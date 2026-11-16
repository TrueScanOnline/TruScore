/**
 * Administrative publication hold control.
 * GET  /api/publication-hold?barcode=...  — public status (no confidential reason)
 * POST /api/publication-hold              — founder token required
 *
 * Holds are independent of Score / Rateability engines.
 */

import { timingSafeEqual } from 'crypto';
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getPublicationHold,
  isPublicationHoldServiceOperational,
  isPublicationHoldStoreConfigured,
  normalizeHoldBarcode,
  setPublicationHold,
} from '../lib/publicationHoldStore';

function founderAuthorized(req: VercelRequest): boolean {
  const expected = String(process.env.RVEEL_FOUNDER_ADMIN_TOKEN || '').trim();
  if (expected.length < 24) return false;
  const header = req.headers['x-rveel-founder-admin'];
  const token = Array.isArray(header) ? header[0] : header;
  if (typeof token !== 'string' || token.length === 0) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function corsOrigin(req: VercelRequest): string {
  const allowed = String(process.env.PUBLICATION_HOLD_CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (req.method === 'GET' || req.method === 'OPTIONS') {
    // Public read status — allow app hosts; default * only for GET when unset.
    if (allowed.length === 0) return '*';
    if (origin && allowed.includes(origin)) return origin;
    return allowed[0];
  }
  // Admin writes: never wildcard.
  if (origin && allowed.includes(origin)) return origin;
  if (allowed.length > 0) return allowed[0];
  return 'null';
}

function publicPayload(record: { barcode: string; held: boolean; updatedAt: string }) {
  return {
    barcode: record.barcode,
    held: record.held,
    updatedAt: record.updatedAt,
    kind: record.held ? 'administrative_hold' : 'none',
    storeConfigured: true,
    serviceOperational: isPublicationHoldServiceOperational(),
  };
}

function unavailablePayload(barcode: string, code: string) {
  return {
    barcode,
    held: true,
    kind: 'hold_state_unavailable',
    error: code,
    storeConfigured: isPublicationHoldStoreConfigured(),
    serviceOperational: isPublicationHoldServiceOperational(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = corsOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Rveel-Founder-Admin');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const barcodeRaw = typeof req.query.barcode === 'string' ? req.query.barcode : '';
    const barcode = normalizeHoldBarcode(barcodeRaw) || barcodeRaw.replace(/\D/g, '');
    const result = await getPublicationHold(barcodeRaw);
    if (!result.ok) {
      return res.status(503).json(unavailablePayload(barcode, result.code));
    }
    // Persistent store is configured and answered. held:false here is confirmed absence of a hold row,
    // not "store missing". Production launch still requires PUBLICATION_HOLD_OPERATIONAL=1 (checklist).
    return res.status(200).json(publicPayload(result.record));
  }

  if (req.method === 'POST') {
    if (!founderAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!isPublicationHoldStoreConfigured()) {
      return res.status(503).json({ error: 'hold_store_unconfigured' });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const barcode = typeof body.barcode === 'string' ? body.barcode : '';
    if (!normalizeHoldBarcode(barcode)) {
      return res.status(400).json({ error: 'invalid_barcode' });
    }
    if (typeof body.held !== 'boolean') {
      return res.status(400).json({ error: 'held_boolean_required' });
    }
    const held = body.held === true;
    const reason = typeof body.reason === 'string' ? body.reason : '';
    const authorizedBy =
      typeof body.authorizedBy === 'string' ? body.authorizedBy.trim() : '';
    if (!authorizedBy) {
      return res.status(400).json({ error: 'authorized_by_required' });
    }

    const result = await setPublicationHold({ barcode, held, reason, authorizedBy });
    if (!result.ok) {
      const status =
        result.code === 'invalid_barcode' ||
        result.code === 'reason_required' ||
        result.code === 'authorized_by_required'
          ? 400
          : 503;
      return res.status(status).json({ error: result.code, message: result.error });
    }
    return res.status(200).json({
      ...publicPayload(result.record),
      reason: result.record.reason,
      authorizedBy: result.record.authorizedBy,
      heldAt: result.record.heldAt,
      releasedAt: result.record.releasedAt,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
