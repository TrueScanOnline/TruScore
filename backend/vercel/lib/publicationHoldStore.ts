/**
 * Administrative publication holds — separate from scoring / Rateability.
 * Default: no hold. Requires Postgres when mutating; reads fail closed on DB error.
 */

import { Pool } from 'pg';

export type PublicationHoldRecord = {
  barcode: string;
  held: boolean;
  reason: string | null;
  authorizedBy: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  updatedAt: string;
};

function getPostgresUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool | null {
  const url = getPostgresUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  }
  return pool;
}

async function ensureSchema(p: Pool): Promise<void> {
  if (!schemaReady) {
    schemaReady = p
      .query(
        `CREATE TABLE IF NOT EXISTS publication_holds (
           barcode TEXT PRIMARY KEY,
           held BOOLEAN NOT NULL DEFAULT FALSE,
           reason TEXT,
           authorized_by TEXT,
           held_at TIMESTAMPTZ,
           released_at TIMESTAMPTZ,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      )
      .then(() => undefined);
  }
  await schemaReady;
}

function normalizeBarcode(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return null;
  return digits;
}

export async function getPublicationHold(
  barcodeRaw: string
): Promise<{ ok: true; record: PublicationHoldRecord } | { ok: false; error: string; code: string }> {
  const barcode = normalizeBarcode(barcodeRaw);
  if (!barcode) return { ok: false, error: 'Invalid barcode', code: 'invalid_barcode' };

  const p = getPool();
  if (!p) {
    // Store not configured → default no hold (explicit, not an error).
    return {
      ok: true,
      record: {
        barcode,
        held: false,
        reason: null,
        authorizedBy: null,
        heldAt: null,
        releasedAt: null,
        updatedAt: new Date(0).toISOString(),
      },
    };
  }

  try {
    await ensureSchema(p);
    const result = await p.query(
      `SELECT barcode, held, reason, authorized_by, held_at, released_at, updated_at
       FROM publication_holds WHERE barcode = $1`,
      [barcode]
    );
    if (!result.rows.length) {
      return {
        ok: true,
        record: {
          barcode,
          held: false,
          reason: null,
          authorizedBy: null,
          heldAt: null,
          releasedAt: null,
          updatedAt: new Date(0).toISOString(),
        },
      };
    }
    const row = result.rows[0];
    return {
      ok: true,
      record: {
        barcode: String(row.barcode),
        held: row.held === true,
        reason: row.reason == null ? null : String(row.reason),
        authorizedBy: row.authorized_by == null ? null : String(row.authorized_by),
        heldAt: row.held_at ? new Date(row.held_at).toISOString() : null,
        releasedAt: row.released_at ? new Date(row.released_at).toISOString() : null,
        updatedAt: new Date(row.updated_at).toISOString(),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'hold_store_unavailable',
      code: 'hold_store_unavailable',
    };
  }
}

export async function setPublicationHold(input: {
  barcode: string;
  held: boolean;
  reason?: string;
  authorizedBy: string;
}): Promise<{ ok: true; record: PublicationHoldRecord } | { ok: false; error: string; code: string }> {
  const barcode = normalizeBarcode(input.barcode);
  if (!barcode) return { ok: false, error: 'Invalid barcode', code: 'invalid_barcode' };
  if (!input.authorizedBy.trim()) {
    return { ok: false, error: 'authorizedBy required', code: 'unauthorized' };
  }
  if (input.held && !String(input.reason || '').trim()) {
    return { ok: false, error: 'reason required when holding', code: 'reason_required' };
  }

  const p = getPool();
  if (!p) {
    return { ok: false, error: 'Hold store not configured (Postgres required)', code: 'hold_store_unavailable' };
  }

  try {
    await ensureSchema(p);
    const now = new Date();
    const reason = input.held ? String(input.reason || '').trim().slice(0, 500) : null;
    const result = await p.query(
      `INSERT INTO publication_holds (barcode, held, reason, authorized_by, held_at, released_at, updated_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $2 THEN $5::timestamptz ELSE NULL END,
               CASE WHEN $2 THEN NULL ELSE $5::timestamptz END, $5::timestamptz)
       ON CONFLICT (barcode) DO UPDATE SET
         held = EXCLUDED.held,
         reason = EXCLUDED.reason,
         authorized_by = EXCLUDED.authorized_by,
         held_at = CASE WHEN EXCLUDED.held THEN COALESCE(publication_holds.held_at, EXCLUDED.held_at) ELSE publication_holds.held_at END,
         released_at = CASE WHEN EXCLUDED.held THEN NULL ELSE EXCLUDED.released_at END,
         updated_at = EXCLUDED.updated_at
       RETURNING barcode, held, reason, authorized_by, held_at, released_at, updated_at`,
      [barcode, input.held, reason, input.authorizedBy.trim().slice(0, 120), now.toISOString()]
    );
    const row = result.rows[0];
    return {
      ok: true,
      record: {
        barcode: String(row.barcode),
        held: row.held === true,
        reason: row.reason == null ? null : String(row.reason),
        authorizedBy: row.authorized_by == null ? null : String(row.authorized_by),
        heldAt: row.held_at ? new Date(row.held_at).toISOString() : null,
        releasedAt: row.released_at ? new Date(row.released_at).toISOString() : null,
        updatedAt: new Date(row.updated_at).toISOString(),
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'hold_store_unavailable',
      code: 'hold_store_unavailable',
    };
  }
}
