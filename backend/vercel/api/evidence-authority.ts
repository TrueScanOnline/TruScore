/**
 * POST/GET /api/evidence-authority
 *
 * Server Wave 4A evidence authority. Contributor identity comes from a
 * server-issued credential. Client admission, epoch, and eligibility fields
 * are not accepted. Postgres is required.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  EvidenceAuthority,
  OFF_LIVE_WRITE_HOSTNAME,
  liveOffNetworkWriteAllowed,
  officialOffWriteTarget,
} from '../truescan-src/evidenceAuthority/authority';
import { summarizeOffWriteResponse } from '../truescan-src/evidenceAuthority/offWriteResponse';
import type { EvidenceFactInput } from '../truescan-src/evidenceAuthority/types';
import type { ManualTextDomain } from '../truescan-src/evidenceAuthority/manualTextAsset';
import { continueAfterResponse } from '../lib/continueAfterResponse';
import {
  bindServerTrace,
  logClientTimeline,
  openServerTrace,
  serverTraceAction,
  serverTraceMark,
  serverTraceNote,
} from '../lib/contributionTrace';
import { PostgresAuthorityStore } from '../lib/evidenceAuthorityPg';
import {
  authorizePrivateEvidenceUpload,
  deletePendingEvidenceImage,
  pendingEvidenceImage,
  readPrivateBlob,
} from '../lib/evidenceImageBlob';
import { evidenceImageProfile } from '../truescan-src/evidenceImage/profile';

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
      const configuredTarget = process.env.OFF_LIVE_WRITE_TARGET?.trim() || '';
      const liveTarget = officialOffWriteTarget(configuredTarget || undefined);
      const liveUser = process.env.OFF_LIVE_WRITE_USER_ID?.trim() || '';
      const livePassword = process.env.OFF_LIVE_WRITE_PASSWORD?.trim() || '';
      const liveCredentials = liveUser.length > 0 && livePassword.length > 0;
      const execute =
        env === 'uat' &&
        process.env.OFF_LIVE_WRITE_EXECUTE === '1' &&
        liveCredentials &&
        liveTarget !== null &&
        liveOffNetworkWriteAllowed();
      return new EvidenceAuthority(new PostgresAuthorityStore(pool), {
        authorityEnv: env,
        founderAdminToken: process.env.RVEEL_FOUNDER_ADMIN_TOKEN,
        offTarget: env === 'uat' ? configuredTarget : '',
        offCredentialsConfigured: env === 'uat' && liveCredentials,
        offExecute: execute,
        offTransport: async ({ target: offTarget, fields }) => {
          const accepted = officialOffWriteTarget(offTarget);
          if (
            !execute ||
            !liveCredentials ||
            !accepted ||
            new URL(accepted).hostname !== OFF_LIVE_WRITE_HOSTNAME ||
            !liveOffNetworkWriteAllowed()
          ) {
            return { ok: false, status: 0 };
          }
          const form = new URLSearchParams(fields);
          form.set('user_id', liveUser);
          form.set('password', livePassword);
          const response = await fetch(accepted, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form,
          });
          const body = await response.text();
          const note = summarizeOffWriteResponse(response.status, body);
          console.log(
            '[off-live-write]',
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

const TRACE_DOMAINS = new Set(['ingredients_nutrition', 'origins', 'packet_claims', 'certifications']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const receivedAt = Date.now();
  const trace = openServerTrace(req, receivedAt);
  if (trace) bindServerTrace(res, trace, receivedAt);
  try {
    const service = await authority();
    if (req.method === 'GET') {
      serverTraceAction('authority_env');
      const barcode = typeof req.query.barcode === 'string' ? req.query.barcode.trim() : '';
      if (!barcode) return res.status(200).json({ success: true, authorityEnv: service.authorityEnv });
      if (!/^\d{8,14}$/.test(barcode)) return res.status(400).json({ success: false, error: 'Valid barcode required' });
      const snapshot = await service.snapshot(barcode);
      scheduleOffDispatch(service, snapshot.barcode, snapshot.offDispatch, false);
      return res.status(200).json({ success: true, snapshot });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';
    if (action === 'contribution-trace') {
      serverTraceAction('contribution_trace');
      logClientTimeline(body);
      return res.status(200).json({ success: true });
    }
    if (action === 'issue-credential') {
      serverTraceAction('issue_credential');
      serverTraceMark('server_credential_received');
      return res.status(201).json({ success: true, ...(await service.issueCredential()) });
    }
    if (action === 'withdraw' || action === 'suppress') {
      const admin = req.headers['x-rveel-founder-admin'];
      const token = typeof admin === 'string' ? admin : undefined;
      const versionId = typeof body.versionId === 'string' ? body.versionId : '';
      const result = await service.govern(token, versionId, action);
      return res.status(result.ok ? 200 : 403).json(result);
    }
    serverTraceMark('authenticate_begin');
    const contributorId = await service.authenticate(bearer(req));
    serverTraceMark('authenticate_end');
    if (!contributorId) return res.status(401).json({ success: false, error: 'contributor_credential_required' });
    if (action === 'confirm' || action === 'dispute') {
      const versionId = typeof body.versionId === 'string' ? body.versionId : '';
      const result =
        action === 'confirm'
          ? await service.confirm(contributorId, versionId)
          : await service.dispute(contributorId, versionId, 'other');
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action === 'upload-asset-chunk' || action === 'finalize-asset') {
      serverTraceAction('chunk_transport_retired');
      return res.status(409).json({ ok: false, reason: 'chunk_transport_retired' });
    }
    if (action === 'evidence-image-profile') {
      serverTraceAction('evidence_image_profile');
      return res.status(200).json({ success: true, profile: evidenceImageProfile(process.env) });
    }
    if (action === 'authorize-evidence-image') {
      serverTraceAction('authorize_evidence_image');
      const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
      const preparedSha256 = typeof body.preparedSha256 === 'string' ? body.preparedSha256.trim() : '';
      const lineageSha256 = typeof body.lineageSha256 === 'string' ? body.lineageSha256.trim() : '';
      const profileId = typeof body.profileId === 'string' ? body.profileId.trim() : '';
      if (!/^\d{8,14}$/.test(barcode) || !/^[a-f0-9]{64}$/.test(preparedSha256) || !/^[a-f0-9]{64}$/.test(lineageSha256)) {
        return res.status(400).json({ success: false, error: 'evidence_image_incomplete' });
      }
      const result = await authorizePrivateEvidenceUpload({
        contributorId,
        barcode,
        preparedSha256,
        preparedByteLength: Number(body.preparedByteLength),
        width: Number(body.width),
        height: Number(body.height),
        profileId,
        profileVersion: Number(body.profileVersion),
        lineageSha256,
        lineageByteLength: Number(body.lineageByteLength),
        lineageWidth: Number(body.lineageWidth),
        lineageHeight: Number(body.lineageHeight),
      });
      return res.status(result.status === 'rejected' ? 409 : 200).json(result);
    }
    if (action === 'finalize-evidence-image') {
      serverTraceAction('finalize_evidence_image');
      const pathname = typeof body.pathname === 'string' ? body.pathname.trim() : '';
      const preparedSha256 = typeof body.preparedSha256 === 'string' ? body.preparedSha256.trim() : '';
      if (!pathname.startsWith('evidence-images/') || !/^[a-f0-9]{64}$/.test(preparedSha256)) {
        return res.status(400).json({ success: false, error: 'evidence_image_incomplete' });
      }
      const pending = await pendingEvidenceImage(pathname);
      if (!pending || String(pending.contributor_id) !== contributorId || String(pending.prepared_sha256) !== preparedSha256) {
        return res.status(409).json({ ok: false, reason: 'source_not_owned' });
      }
      const object = await readPrivateBlob(pathname);
      if (!object || object.sha256 !== preparedSha256 || object.byteLength !== Number(pending.prepared_byte_length)) {
        return res.status(409).json({ ok: false, reason: 'source_hash_mismatch' });
      }
      const registered = await service.registerPrivateEvidenceImage({
        contributorId,
        barcode: String(pending.barcode),
        sha256: preparedSha256,
        byteLength: object.byteLength,
        width: Number(pending.width),
        height: Number(pending.height),
        profileId: String(pending.profile_id),
        profileVersion: Number(pending.profile_version),
        lineageSha256: String(pending.lineage_sha256),
        lineageByteLength: Number(pending.lineage_byte_length),
        lineageWidth: Number(pending.lineage_width),
        lineageHeight: Number(pending.lineage_height),
        blobPathname: pathname,
      });
      if (!registered.ok) return res.status(409).json(registered);
      await deletePendingEvidenceImage(pathname);
      return res.status(200).json({
        ok: true,
        assetId: registered.assetId,
        sha256: registered.sha256,
        duplicate: registered.duplicate,
        ref: {
          assetId: registered.assetId,
          contentType: 'image/jpeg',
          sha256: registered.sha256,
          byteLength: object.byteLength,
        },
      });
    }
    if (action === 'finalize-manual-text') {
      serverTraceAction('finalize_manual_text');
      serverTraceMark('server_finalise_received');
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
        originQualifications: Array.isArray(body.originQualifications)
          ? body.originQualifications.filter((item) => item === 'local' || item === 'imported')
          : undefined,
        percentageNotStated: body.percentageNotStated === true,
        ingredientSubject: typeof body.ingredientSubject === 'string' ? body.ingredientSubject : undefined,
        labelsTags: Array.isArray(body.labelsTags) ? body.labelsTags.filter((tag) => typeof tag === 'string') : undefined,
        packetAbsence: false,
      });
      return res.status(result.ok ? 200 : 409).json(result);
    }
    if (action !== 'submit') return res.status(400).json({ success: false, error: 'Invalid action' });
    serverTraceAction('submit');
    serverTraceMark('server_submit_received');
    const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
    const declaredSha256 = typeof body.declaredSha256 === 'string' ? body.declaredSha256.trim() : '';
    const sourceBase64 = typeof body.sourceBase64 === 'string' ? body.sourceBase64 : '';
    const facts = Array.isArray(body.facts) ? (body.facts as EvidenceFactInput[]) : [];
    const ceasedSubjectKeys = Array.isArray(body.ceasedSubjectKeys)
      ? body.ceasedSubjectKeys.filter((key): key is string => typeof key === 'string' && key.trim().length > 0)
      : [];
    const referencesFinalizedAsset = facts.some(
      (fact) => typeof fact?.finalizedAssetId === 'string' && fact.finalizedAssetId.length > 0
    );
    const closureOnly = facts.length === 0 && ceasedSubjectKeys.length > 0;
    if (!/^\d{8,14}$/.test(barcode) || !idempotencyKey || (!sourceBase64 && !referencesFinalizedAsset && !closureOnly)) {
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
      ...(ceasedSubjectKeys.length > 0 ? { ceasedSubjectKeys } : {}),
    });
    serverTraceMark('snapshot_returned');
    const offStatuses = (outcome.snapshot?.offDispatch ?? []).map((row) => row.status);
    const domains = [
      ...new Set(
        facts
          .map((fact) => (typeof fact?.domain === 'string' ? fact.domain : ''))
          .filter((domain) => TRACE_DOMAINS.has(domain))
      ),
    ];
    serverTraceNote({
      outcome: outcome.status,
      factCount: facts.length,
      domains,
      offStatuses,
      offScheduled: offStatuses.some((status) => status === 'pending' || status === 'failed_retryable'),
    });
    if (outcome.snapshot) scheduleOffDispatch(service, outcome.snapshot.barcode, outcome.snapshot.offDispatch, true);
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

function scheduleOffDispatch(
  service: EvidenceAuthority,
  barcode: string,
  rows: Array<{ status: string }>,
  includeFailed: boolean
): void {
  const ready = rows.some(
    (row) => row.status === 'pending' || (includeFailed && row.status === 'failed_retryable')
  );
  if (!ready) return;
  continueAfterResponse(
    service.dispatchPendingOff(barcode).catch(() => {
      console.log(
        '[off-live-write]',
        JSON.stringify({ barcode, status: 0, note: 'dispatch_continuation_failed' })
      );
    })
  );
}
