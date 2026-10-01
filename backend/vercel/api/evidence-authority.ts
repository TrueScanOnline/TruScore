/**
 * POST/GET /api/evidence-authority
 *
 * Server Wave 4A evidence authority. Contributor identity comes from a
 * server-issued credential. Client admission, epoch, and eligibility fields
 * are not accepted. Postgres is required.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { EvidenceAuthority, OFF_STAGING_HOSTNAME, officialOffStagingTarget } from '../truescan-src/evidenceAuthority/authority';
import { summarizeOffWriteResponse } from '../truescan-src/evidenceAuthority/offWriteResponse';
import type { EvidenceFactInput } from '../truescan-src/evidenceAuthority/types';
import type { ManualTextDomain } from '../truescan-src/evidenceAuthority/manualTextAsset';
import { PostgresAuthorityStore } from '../lib/evidenceAuthorityPg';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Rveel-Founder-Admin');
}

function bearer(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) return header.slice(7).trim();
  return null;
}

function bytesFromBase64(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

let authorityPromise: Promise<EvidenceAuthority> | null = null;

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
      const configuredTarget = process.env.OFF_STAGING_WRITE_TARGET?.trim() || '';
      const stagingTarget = officialOffStagingTarget(configuredTarget || undefined);
      const stagingUser = process.env.OFF_STAGING_WRITE_USER_ID?.trim() || '';
      const stagingPassword = process.env.OFF_STAGING_WRITE_PASSWORD?.trim() || '';
      const stagingCredentials = stagingUser.length > 0 && stagingPassword.length > 0;
      const execute =
        env === 'uat' &&
        process.env.OFF_STAGING_WRITE_EXECUTE === '1' &&
        stagingCredentials &&
        stagingTarget !== null;
      return new EvidenceAuthority(new PostgresAuthorityStore(pool), {
        authorityEnv: env,
        founderAdminToken: process.env.RVEEL_FOUNDER_ADMIN_TOKEN,
        offTarget: env === 'uat' ? configuredTarget : '',
        offCredentialsConfigured: env === 'uat' && stagingCredentials,
        offExecute: execute,
        offTransport: async ({ target: offTarget, fields }) => {
          const accepted = officialOffStagingTarget(offTarget);
          if (!execute || !stagingCredentials || !accepted || new URL(accepted).hostname !== OFF_STAGING_HOSTNAME) {
            return { ok: false, status: 0 };
          }
          const form = new URLSearchParams(fields);
          form.set('user_id', stagingUser);
          form.set('password', stagingPassword);
          const response = await fetch(accepted, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          });
          const body = await response.text();
          const note = summarizeOffWriteResponse(response.status, body);
          console.log(
            '[off-staging-write]',
            JSON.stringify({
              barcode: fields.code || null,
              status: response.status,
              note,
            })
          );
          return { ok: response.ok, status: response.status, note };
        },
      });
    })();
  }
  return authorityPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const service = await authority();
    if (req.method === 'GET') {
      const barcode = typeof req.query.barcode === 'string' ? req.query.barcode.trim() : '';
      if (!barcode) return res.status(200).json({ success: true, authorityEnv: service.authorityEnv });
      if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ success: false, error: 'Valid barcode required' });
      return res.status(200).json({ success: true, snapshot: await service.snapshot(barcode) });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';
    if (action === 'issue-credential') {
      return res.status(201).json({ success: true, ...(await service.issueCredential()) });
    }
    if (action === 'withdraw' || action === 'suppress') {
      const admin = req.headers['x-rveel-founder-admin'];
      const token = typeof admin === 'string' ? admin : undefined;
      const versionId = typeof body.versionId === 'string' ? body.versionId : '';
      const result = await service.govern(token, versionId, action);
      return res.status(result.ok ? 200 : 403).json(result);
    }
    const contributorId = await service.authenticate(bearer(req));
    if (!contributorId) return res.status(401).json({ success: false, error: 'contributor_credential_required' });
    if (action === 'confirm' || action === 'dispute') {
      const versionId = typeof body.versionId === 'string' ? body.versionId : '';
      const result =
        action === 'confirm'
          ? await service.confirm(contributorId, versionId)
          : await service.dispute(contributorId, versionId, 'other');
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action === 'upload-asset-chunk') {
      const chunkBase64 = typeof body.chunkBase64 === 'string' ? body.chunkBase64 : '';
      const uploadId = typeof body.uploadId === 'string' ? body.uploadId.trim() : '';
      const declaredSha256 = typeof body.declaredSha256 === 'string' ? body.declaredSha256.trim() : '';
      const chunkIndex = Number(body.chunkIndex);
      const chunkCount = Number(body.chunkCount);
      const totalBytes = Number(body.totalBytes);
      if (!uploadId || !declaredSha256 || !chunkBase64 || !Number.isInteger(chunkIndex) || !Number.isInteger(chunkCount)) {
        return res.status(400).json({ success: false, error: 'chunk_incomplete' });
      }
      const result = await service.putAssetChunk({
        uploadId,
        chunkIndex,
        chunkCount,
        totalBytes,
        declaredSha256,
        bytes: bytesFromBase64(chunkBase64),
      });
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action === 'finalize-manual-text') {
      const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
      const unitId = typeof body.unitId === 'string' ? body.unitId.trim() : '';
      const domain = typeof body.domain === 'string' ? body.domain : '';
      const allowed: ManualTextDomain[] = ['ingredients_nutrition', 'origins', 'packet_claims', 'certifications'];
      if (!/^\d{8,14}$/.test(barcode) || !sessionId || !unitId || !allowed.includes(domain as ManualTextDomain)) {
        return res.status(400).json({ success: false, error: 'manual_text_incomplete' });
      }
      if (body.packetAbsence === true) {
        return res.status(400).json({ success: false, error: 'packet_absence_requires_packet_evidence' });
      }
      const result = await service.finalizeManualTextAsset({
        contributorId,
        barcode,
        sessionId,
        unitId,
        domain: domain as ManualTextDomain,
        variantKey: typeof body.variantKey === 'string' ? body.variantKey : undefined,
        statement: typeof body.statement === 'string' ? body.statement : undefined,
        ingredientsText: typeof body.ingredientsText === 'string' ? body.ingredientsText : undefined,
        nutritionBasis: typeof body.nutritionBasis === 'string' ? body.nutritionBasis : undefined,
        nutritionAmounts: Array.isArray(body.nutritionAmounts)
          ? (body.nutritionAmounts as Array<{ attribute?: string; value?: unknown; unit?: string }>)
          : undefined,
        originClaimType: typeof body.originClaimType === 'string' ? body.originClaimType : undefined,
        originCountry: typeof body.originCountry === 'string' ? body.originCountry : undefined,
        originCountries: Array.isArray(body.originCountries)
          ? body.originCountries.filter((country) => typeof country === 'string')
          : undefined,
        originPercentage: typeof body.originPercentage === 'number' ? body.originPercentage : undefined,
        originPercentageQualifier:
          typeof body.originPercentageQualifier === 'string' ? body.originPercentageQualifier : undefined,
        originQualification: typeof body.originQualification === 'string' ? body.originQualification : undefined,
        ingredientSubject: typeof body.ingredientSubject === 'string' ? body.ingredientSubject : undefined,
        labelsTags: Array.isArray(body.labelsTags) ? body.labelsTags.filter((tag) => typeof tag === 'string') : undefined,
        packetAbsence: false,
      });
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action === 'finalize-asset') {
      const uploadId = typeof body.uploadId === 'string' ? body.uploadId.trim() : '';
      const declaredSha256 = typeof body.declaredSha256 === 'string' ? body.declaredSha256.trim() : '';
      const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
      if (!uploadId || !declaredSha256 || !/^\d{8,14}$/.test(barcode)) {
        return res.status(400).json({ success: false, error: 'finalize_incomplete' });
      }
      const result = await service.finalizeAssetUpload({
        uploadId,
        declaredSha256,
        contentType: typeof body.contentType === 'string' ? body.contentType : undefined,
        contributorId,
        barcode,
      });
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action !== 'submit') return res.status(400).json({ success: false, error: 'Invalid action' });
    const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
    const declaredSha256 = typeof body.declaredSha256 === 'string' ? body.declaredSha256.trim() : '';
    const sourceBase64 = typeof body.sourceBase64 === 'string' ? body.sourceBase64 : '';
    const facts = Array.isArray(body.facts) ? (body.facts as EvidenceFactInput[]) : [];
    const referencesFinalizedAsset = facts.some(
      (fact) => typeof fact?.finalizedAssetId === 'string' && fact.finalizedAssetId.length > 0
    );
    if (!/^\d{8,14}$/.test(barcode) || !idempotencyKey || (!sourceBase64 && !referencesFinalizedAsset)) {
      return res.status(400).json({ success: false, error: 'submission_incomplete' });
    }
    if (sourceBase64 && !declaredSha256) {
      return res.status(400).json({ success: false, error: 'submission_incomplete' });
    }
    const outcome = await service.submit(contributorId, {
      idempotencyKey,
      barcode,
      declaredSha256: declaredSha256 || undefined,
      sourceBytes: sourceBase64 ? bytesFromBase64(sourceBase64) : undefined,
      contentType: typeof body.contentType === 'string' ? body.contentType : undefined,
      facts,
    });
    return res.status(200).json({ success: outcome.status === 'admitted', outcome });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'evidence_authority_failed';
    const status =
      message === 'evidence_authority_database_unconfigured' ||
      message === 'evidence_authority_schema_unavailable'
        ? 503
        : 500;
    return res.status(status).json({ success: false, error: message });
  }
}
