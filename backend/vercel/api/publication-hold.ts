/**
 * Administrative publication hold control.
 * GET  /api/publication-hold?barcode=...  — public status (no confidential reason)
 * POST /api/publication-hold              — founder token required
 *
 * Holds are independent of Score / Rateability engines.
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPublicationHold, setPublicationHold } from '../lib/publicationHoldStore';

function founderAuthorized(req: VercelRequest): boolean {
  const expected = String(process.env.RVEEL_FOUNDER_ADMIN_TOKEN || '').trim();
  if (!expected) return false;
  const header = req.headers['x-rveel-founder-admin'];
  const token = Array.isArray(header) ? header[0] : header;
  return typeof token === 'string' && token.length > 0 && token === expected;
}

function publicPayload(record: {
  barcode: string;
  held: boolean;
  updatedAt: string;
}) {
  return {
    barcode: record.barcode,
    held: record.held,
    updatedAt: record.updatedAt,
    // Consumer-safe: never expose dispute reason or authorizer.
    kind: record.held ? 'administrative_hold' : 'none',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Rveel-Founder-Admin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const barcode = typeof req.query.barcode === 'string' ? req.query.barcode : '';
    const result = await getPublicationHold(barcode);
    if (!result.ok) {
      // Inconsistent / unavailable store → fail closed for consumer publication.
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({
        barcode: barcode.replace(/\D/g, ''),
        held: true,
        kind: 'hold_state_unavailable',
        error: result.code,
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(publicPayload(result.record));
  }

  if (req.method === 'POST') {
    if (!founderAuthorized(req)) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const body = (req.body || {}) as Record<string, unknown>;
    const barcode = typeof body.barcode === 'string' ? body.barcode : '';
    const held = body.held === true;
    const reason = typeof body.reason === 'string' ? body.reason : '';
    const authorizedBy =
      typeof body.authorizedBy === 'string' && body.authorizedBy.trim()
        ? body.authorizedBy.trim()
        : 'founder-admin';

    const result = await setPublicationHold({ barcode, held, reason, authorizedBy });
    if (!result.ok) {
      const status =
        result.code === 'invalid_barcode' || result.code === 'reason_required' ? 400 : 503;
      return res.status(status).json({ error: result.code, message: result.error });
    }
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ...publicPayload(result.record),
      // Admin response may include reason for audit confirmation only.
      reason: result.record.reason,
      authorizedBy: result.record.authorizedBy,
      heldAt: result.record.heldAt,
      releasedAt: result.record.releasedAt,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
