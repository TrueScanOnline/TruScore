/**
 * GET/POST /api/community-agreement
 *
 * Display-only Community Agreements sidecar. Reads prevailing Evidence Authority
 * snapshots for revision identity. Never writes evidence_responses or confirms/disputes.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';
import { EvidenceAuthority } from '../truescan-src/evidenceAuthority/authority';
import { PostgresAuthorityStore } from '../lib/evidenceAuthorityPg';
import { PostgresCommunityAgreementStore } from '../lib/communityAgreementPg';
import {
  CommunityAgreementService,
  createMemoryAgreementAbuseGuard,
} from '../truescan-src/communityAgreement/service';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function bearer(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

function clientKey(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]);
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return 'unknown';
}

let authorityPromise: Promise<EvidenceAuthority> | null = null;
let agreementPromise: Promise<CommunityAgreementService> | null = null;
const abuse = createMemoryAgreementAbuseGuard();

async function authority(): Promise<EvidenceAuthority> {
  if (!authorityPromise) {
    authorityPromise = (async () => {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!connectionString) throw new Error('evidence_authority_database_unconfigured');
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
        max: 5,
      });
      const env = process.env.RVEEL_EVIDENCE_AUTHORITY_ENV === 'production' ? 'production' : 'uat';
      return new EvidenceAuthority(new PostgresAuthorityStore(pool), {
        authorityEnv: env,
        founderAdminToken: process.env.RVEEL_FOUNDER_ADMIN_TOKEN,
      });
    })();
  }
  return authorityPromise;
}

async function agreements(): Promise<CommunityAgreementService> {
  if (!agreementPromise) {
    agreementPromise = (async () => {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!connectionString) throw new Error('community_agreement_database_unconfigured');
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString,
        ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
        max: 5,
      });
      const env = process.env.RVEEL_EVIDENCE_AUTHORITY_ENV === 'production' ? 'production' : 'uat';
      return new CommunityAgreementService({
        authorityEnv: env,
        store: new PostgresCommunityAgreementStore(pool),
        abuse,
        newId: () => `agr_${randomBytes(6).toString('hex')}`,
      });
    })();
  }
  return agreementPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const service = await agreements();
    const ea = await authority();

    if (req.method === 'GET') {
      const barcode = typeof req.query.barcode === 'string' ? req.query.barcode : '';
      const cardGroup = typeof req.query.cardGroup === 'string' ? req.query.cardGroup : '';
      const variantKey = typeof req.query.variantKey === 'string' ? req.query.variantKey : '';
      const token = bearer(req);
      const contributorId = token ? await ea.authenticate(token) : null;
      if (token && !contributorId) {
        return res.status(401).json({ ok: false, reason: 'invalid_credential' });
      }
      const snapshot = barcode ? await ea.snapshot(barcode) : null;
      const result = await service.get({
        barcode,
        cardGroup,
        variantKey,
        contributorId,
        snapshot,
      });
      if (!result.ok) return res.status(result.status).json({ ok: false, reason: result.reason });
      return res.status(200).json(result.body);
    }

    if (req.method === 'POST') {
      const body = (req.body || {}) as Record<string, unknown>;
      const token = bearer(req);
      const contributorId = await ea.authenticate(token);
      if (!contributorId) {
        return res.status(401).json({ ok: false, reason: 'contributor_credential_required' });
      }
      const barcode = typeof body.barcode === 'string' ? body.barcode : '';
      const snapshot = barcode ? await ea.snapshot(barcode) : null;
      const result = await service.agree({
        barcode,
        cardGroup: body.cardGroup,
        variantKey: body.variantKey,
        expectedRevisionId: body.expectedRevisionId,
        contributorId,
        snapshot,
        clientKey: clientKey(req),
      });
      if (!result.ok) return res.status(result.status).json({ ok: false, reason: result.reason });
      return res.status(200).json(result.body);
    }

    return res.status(405).json({ ok: false, reason: 'method_not_allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'community_agreement_error';
    if (message === 'community_agreements_schema_unavailable') {
      return res.status(503).json({ ok: false, reason: message });
    }
    console.error('[community-agreement]', message);
    return res.status(500).json({ ok: false, reason: 'community_agreement_error' });
  }
}
