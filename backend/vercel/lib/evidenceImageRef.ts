import { get } from '@vercel/blob-private';
import type { ReadableStream } from 'stream/web';
import { evidenceImageBlobToken } from './evidenceImageBlob';

/** Stable reference for a later OCR/VLM worker. It does not include image bytes. */
export type EvidenceImageRef = {
  assetId: string;
  contentType: 'image/jpeg';
  sha256: string;
  byteLength: number;
  width: number;
  height: number;
  profileId: string;
  profileVersion: number;
  pathname: string;
  lineage: {
    sha256: string;
    byteLength: number;
    width: number;
    height: number;
  };
};

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

function numberOf(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function describeEvidenceImage(assetId: string): Promise<EvidenceImageRef | null> {
  const db = await pool();
  const found = await db.query(
    `SELECT asset_id, sha256, byte_length, content_type, storage_kind, blob_pathname,
            image_width, image_height, profile_id, profile_version,
            lineage_sha256, lineage_byte_length, lineage_width, lineage_height, verified
       FROM evidence_source_assets WHERE asset_id = $1`,
    [assetId]
  );
  const row = found.rows[0];
  if (!row || row.verified !== true || row.storage_kind !== 'private_blob' || row.content_type !== 'image/jpeg') {
    return null;
  }
  if (typeof row.blob_pathname !== 'string' || !row.blob_pathname) return null;
  return {
    assetId: String(row.asset_id),
    contentType: 'image/jpeg',
    sha256: String(row.sha256),
    byteLength: numberOf(row.byte_length),
    width: numberOf(row.image_width),
    height: numberOf(row.image_height),
    profileId: String(row.profile_id || ''),
    profileVersion: numberOf(row.profile_version),
    pathname: row.blob_pathname,
    lineage: {
      sha256: String(row.lineage_sha256 || ''),
      byteLength: numberOf(row.lineage_byte_length),
      width: numberOf(row.lineage_width),
      height: numberOf(row.lineage_height),
    },
  };
}

/**
 * Server-side reader for a finalised private evidence image.
 * Callers must already be inside the server. This is not a mobile download route.
 */
export async function openEvidenceImage(assetId: string): Promise<{ ref: EvidenceImageRef; stream: ReadableStream<Uint8Array> } | null> {
  const ref = await describeEvidenceImage(assetId);
  const token = evidenceImageBlobToken();
  if (!ref || !token) return null;
  const result = await get(ref.pathname, { access: 'private', token });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return { ref, stream: result.stream };
}
