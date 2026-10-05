import { createHash } from 'crypto';
import { del, get, issueSignedToken, presignUrl } from '@vercel/blob-private';
import { evidenceImageProfile, type EvidenceImageProfile } from '../truescan-src/evidenceImage/profile';
import { PENDING_REMOTE_EVIDENCE_MS, UNCITED_REMOTE_EVIDENCE_MS } from '../truescan-src/evidenceImage/retention';

/** SDK 2.8 control-plane version. The phone sends this on the binary PUT. */
const BLOB_API_VERSION = '12';

type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

let poolPromise: Promise<Queryable> | null = null;

async function pool(): Promise<Queryable> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (!connectionString) throw new Error('evidence_authority_database_unconfigured');
      const { Pool } = await import('pg');
      return new Pool({
        connectionString,
        ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
        max: 2,
      });
    })();
  }
  return poolPromise;
}

export function evidenceImageBlobToken(env: NodeJS.ProcessEnv = process.env): string | null {
  // The private store is connected with prefix EVIDENCE_IMAGE, which injects
  // EVIDENCE_IMAGE_READ_WRITE_TOKEN. The explicit BLOB-named override remains
  // accepted. The public hero token BLOB_READ_WRITE_TOKEN is never read.
  const token = (env.EVIDENCE_IMAGE_BLOB_READ_WRITE_TOKEN || env.EVIDENCE_IMAGE_READ_WRITE_TOKEN || '').trim();
  return token || null;
}

function storeIdFromToken(token: string): string {
  const storeId = token.split('_')[3] || '';
  return storeId.startsWith('store_') ? storeId.slice('store_'.length) : storeId;
}

export function evidenceImagePathname(contributorId: string, barcode: string, preparedSha256: string): string {
  return `evidence-images/${contributorId}/${barcode}/${preparedSha256}.jpg`;
}

export async function authorizePrivateEvidenceUpload(input: {
  contributorId: string;
  barcode: string;
  preparedSha256: string;
  preparedByteLength: number;
  width: number;
  height: number;
  profileId: string;
  profileVersion: number;
  lineageSha256: string;
  lineageByteLength: number;
  lineageWidth: number;
  lineageHeight: number;
}): Promise<
  | { status: 'already_available'; assetId: string; sha256: string }
  | { status: 'profile_stale'; profile: EvidenceImageProfile }
  | { status: 'upload'; presignedUrl: string; pathname: string; headers: Record<string, string> }
  | { status: 'rejected'; reason: string }
> {
  const profile = evidenceImageProfile(process.env);
  if (input.profileId !== profile.profileId || input.profileVersion !== profile.version) {
    return { status: 'profile_stale', profile };
  }
  if (input.preparedByteLength < 1 || input.preparedByteLength > profile.maxBytes) {
    return { status: 'rejected', reason: 'evidence_image_over_cap' };
  }
  const token = evidenceImageBlobToken();
  if (!token) return { status: 'rejected', reason: 'evidence_image_store_unconfigured' };
  const db = await pool();
  const existing = await db.query(
    `SELECT asset_id, sha256 FROM evidence_source_assets
      WHERE sha256 = $1 AND contributor_id = $2 AND barcode = $3 AND content_type = 'image/jpeg'
        AND storage_kind = 'private_blob' AND verified = TRUE
      LIMIT 1`,
    [input.preparedSha256, input.contributorId, input.barcode]
  );
  const row = existing.rows[0];
  if (row) return { status: 'already_available', assetId: String(row.asset_id), sha256: String(row.sha256) };
  const pathname = evidenceImagePathname(input.contributorId, input.barcode, input.preparedSha256);
  const now = Date.now();
  await db.query(
    `INSERT INTO evidence_image_pending (
       pathname, contributor_id, barcode, prepared_sha256, prepared_byte_length, width, height,
       profile_id, profile_version, lineage_sha256, lineage_byte_length, lineage_width, lineage_height,
       created_at, expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     ON CONFLICT (pathname) DO UPDATE SET
       prepared_byte_length = EXCLUDED.prepared_byte_length,
       width = EXCLUDED.width,
       height = EXCLUDED.height,
       profile_id = EXCLUDED.profile_id,
       profile_version = EXCLUDED.profile_version,
       lineage_sha256 = EXCLUDED.lineage_sha256,
       lineage_byte_length = EXCLUDED.lineage_byte_length,
       lineage_width = EXCLUDED.lineage_width,
       lineage_height = EXCLUDED.lineage_height,
       expires_at = EXCLUDED.expires_at`,
    [
      pathname,
      input.contributorId,
      input.barcode,
      input.preparedSha256,
      input.preparedByteLength,
      input.width,
      input.height,
      input.profileId,
      input.profileVersion,
      input.lineageSha256,
      input.lineageByteLength,
      input.lineageWidth,
      input.lineageHeight,
      now,
      now + PENDING_REMOTE_EVIDENCE_MS,
    ]
  );
  const validUntil = now + 15 * 60 * 1000;
  const signed = await issueSignedToken({
    token,
    pathname,
    operations: ['put'],
    validUntil,
    allowedContentTypes: ['image/jpeg'],
    maximumSizeInBytes: profile.maxBytes,
  });
  const presigned = await presignUrl(signed, {
    access: 'private',
    operation: 'put',
    pathname,
    validUntil,
    allowedContentTypes: ['image/jpeg'],
    maximumSizeInBytes: profile.maxBytes,
    allowOverwrite: true,
  });
  return {
    status: 'upload',
    presignedUrl: presigned.presignedUrl,
    pathname,
    headers: {
      'x-vercel-blob-access': 'private',
      'x-content-type': 'image/jpeg',
      'x-api-version': BLOB_API_VERSION,
      'x-vercel-blob-store-id': storeIdFromToken(token),
    },
  };
}

export async function readPrivateBlob(pathname: string): Promise<{ sha256: string; byteLength: number } | null> {
  const token = evidenceImageBlobToken();
  if (!token) return null;
  const result = await get(pathname, { access: 'private', token });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const hash = createHash('sha256');
  const reader = result.stream.getReader();
  let byteLength = 0;
  const cap = evidenceImageProfile(process.env).maxBytes + 1;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    byteLength += step.value.byteLength;
    if (byteLength > cap) {
      await reader.cancel();
      return null;
    }
    hash.update(step.value);
  }
  return { sha256: hash.digest('hex'), byteLength };
}

export async function deletePrivateBlob(pathname: string): Promise<void> {
  const token = evidenceImageBlobToken();
  if (!token) return;
  await del(pathname, { token });
}

export async function pendingEvidenceImage(pathname: string): Promise<Record<string, unknown> | null> {
  const db = await pool();
  const found = await db.query(`SELECT * FROM evidence_image_pending WHERE pathname = $1`, [pathname]);
  return found.rows[0] ?? null;
}

export async function deletePendingEvidenceImage(pathname: string): Promise<void> {
  const db = await pool();
  await db.query(`DELETE FROM evidence_image_pending WHERE pathname = $1`, [pathname]);
}

export async function sweepEvidenceImageLifecycle(now = Date.now()): Promise<{ pending: number; uncited: number }> {
  const token = evidenceImageBlobToken();
  if (!token) return { pending: 0, uncited: 0 };
  const db = await pool();
  const pending = await db.query(`SELECT pathname FROM evidence_image_pending WHERE expires_at < $1`, [now]);
  for (const row of pending.rows) {
    const pathname = String(row.pathname);
    await del(pathname, { token }).catch(() => undefined);
    await db.query(`DELETE FROM evidence_image_pending WHERE pathname = $1`, [pathname]);
  }
  const cutoff = now - UNCITED_REMOTE_EVIDENCE_MS;
  const uncited = await db.query(
    `SELECT asset_id, blob_pathname FROM evidence_source_assets asset
      WHERE asset.storage_kind = 'private_blob'
        AND asset.created_at < $1
        AND asset.blob_pathname IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM evidence_versions version WHERE version.source_asset_id = asset.asset_id)
        AND NOT EXISTS (SELECT 1 FROM evidence_regions region WHERE region.asset_id = asset.asset_id)
        AND NOT EXISTS (
          SELECT 1 FROM evidence_versions version
          WHERE version.content_json::text LIKE '%' || asset.asset_id || '%'
        )`,
    [cutoff]
  );
  for (const row of uncited.rows) {
    const pathname = String(row.blob_pathname);
    await del(pathname, { token }).catch(() => undefined);
    await db.query(`DELETE FROM evidence_source_assets WHERE asset_id = $1 AND storage_kind = 'private_blob'`, [
      String(row.asset_id),
    ]);
  }
  return { pending: pending.rows.length, uncited: uncited.rows.length };
}
