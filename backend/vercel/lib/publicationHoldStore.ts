/**
 * Administrative publication holds — separate from scoring / Rateability.
 *
 * Readiness: persistent Postgres is required before the service may report a
 * confirmed "no hold". An unconfigured store is NEVER treated as proof of no hold.
 */

export type PublicationHoldRecord = {
  barcode: string;
  held: boolean;
  reason: string | null;
  authorizedBy: string | null;
  heldAt: string | null;
  releasedAt: string | null;
  updatedAt: string;
};

export type HoldQueryResult = {
  rows: Record<string, unknown>[];
  rowCount?: number | null;
};

export type HoldStoreQuery = (
  text: string,
  params?: unknown[]
) => Promise<HoldQueryResult>;

export type HoldStoreDeps = {
  query?: HoldStoreQuery;
  /** When true, store is considered configured/operational. */
  configured?: boolean;
};

function getPostgresUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return (
    env.POSTGRES_URL ||
    env.DATABASE_URL ||
    env.NEON_DATABASE_URL ||
    env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

type PgPool = {
  query: (text: string, params?: unknown[]) => Promise<HoldQueryResult>;
};

let pool: PgPool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(env: NodeJS.ProcessEnv = process.env): PgPool | null {
  const url = getPostgresUrl(env);
  if (!url) return null;
  if (!pool) {
    // Lazy require keeps Jest unit suites free of native `pg` resolution.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg') as {
      Pool: new (config: Record<string, unknown>) => PgPool;
    };
    pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  }
  return pool;
}

/** Explicit operational readiness: Postgres URL present (persistent store). */
export function isPublicationHoldStoreConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getPostgresUrl(env));
}

/**
 * Production/public hold service is operational only when persistent storage exists
 * AND founders have set PUBLICATION_HOLD_OPERATIONAL=1.
 */
export function isPublicationHoldServiceOperational(env: NodeJS.ProcessEnv = process.env): boolean {
  return isPublicationHoldStoreConfigured(env) && env.PUBLICATION_HOLD_OPERATIONAL === '1';
}

async function ensureSchema(query: HoldStoreQuery): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS publication_holds (
           barcode TEXT PRIMARY KEY,
           held BOOLEAN NOT NULL DEFAULT FALSE,
           reason TEXT,
           authorized_by TEXT,
           held_at TIMESTAMPTZ,
           released_at TIMESTAMPTZ,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );
      await query(
        `CREATE TABLE IF NOT EXISTS publication_hold_events (
           id BIGSERIAL PRIMARY KEY,
           barcode TEXT NOT NULL,
           action TEXT NOT NULL,
           held BOOLEAN NOT NULL,
           reason TEXT,
           authorized_by TEXT NOT NULL,
           created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      );
      await query(
        `CREATE INDEX IF NOT EXISTS publication_hold_events_barcode_created_idx
         ON publication_hold_events (barcode, created_at DESC)`
      );
    })();
  }
  await schemaReady;
}

export function normalizeHoldBarcode(raw: string): string | null {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return null;
  return digits;
}

function rowToRecord(row: Record<string, unknown>): PublicationHoldRecord {
  return {
    barcode: String(row.barcode),
    held: row.held === true,
    reason: row.reason == null ? null : String(row.reason),
    authorizedBy: row.authorized_by == null ? null : String(row.authorized_by),
    heldAt: row.held_at ? new Date(String(row.held_at)).toISOString() : null,
    releasedAt: row.released_at ? new Date(String(row.released_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function resolveQuery(deps?: HoldStoreDeps, env: NodeJS.ProcessEnv = process.env): HoldStoreQuery | null {
  if (deps?.query) return deps.query;
  const p = getPool(env);
  if (!p) return null;
  return (text, params) => p.query(text, params);
}

export async function getPublicationHold(
  barcodeRaw: string,
  deps?: HoldStoreDeps,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ ok: true; record: PublicationHoldRecord } | { ok: false; error: string; code: string }> {
  const barcode = normalizeHoldBarcode(barcodeRaw);
  if (!barcode) return { ok: false, error: 'Invalid barcode', code: 'invalid_barcode' };

  const configured =
    typeof deps?.configured === 'boolean' ? deps.configured : isPublicationHoldStoreConfigured(env);
  const query = resolveQuery(deps, env);

  if (!configured || !query) {
    // Unconfigured store is NOT proof of no hold.
    return {
      ok: false,
      error: 'Publication hold store not configured',
      code: 'hold_store_unconfigured',
    };
  }

  try {
    await ensureSchema(query);
    const result = await query(
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
    return { ok: true, record: rowToRecord(result.rows[0] as Record<string, unknown>) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'hold_store_unavailable',
      code: 'hold_store_unavailable',
    };
  }
}

export async function setPublicationHold(
  input: {
    barcode: string;
    held: boolean;
    reason?: string;
    authorizedBy: string;
  },
  deps?: HoldStoreDeps,
  env: NodeJS.ProcessEnv = process.env
): Promise<{ ok: true; record: PublicationHoldRecord } | { ok: false; error: string; code: string }> {
  const barcode = normalizeHoldBarcode(input.barcode);
  if (!barcode) return { ok: false, error: 'Invalid barcode', code: 'invalid_barcode' };
  if (!input.authorizedBy.trim()) {
    return { ok: false, error: 'authorizedBy required', code: 'authorized_by_required' };
  }
  if (input.held && !String(input.reason || '').trim()) {
    return { ok: false, error: 'reason required when holding', code: 'reason_required' };
  }

  const configured =
    typeof deps?.configured === 'boolean' ? deps.configured : isPublicationHoldStoreConfigured(env);
  const query = resolveQuery(deps, env);
  if (!configured || !query) {
    return { ok: false, error: 'Hold store not configured (Postgres required)', code: 'hold_store_unconfigured' };
  }

  try {
    await ensureSchema(query);
    const now = new Date();
    const reason = input.held ? String(input.reason || '').trim().slice(0, 500) : null;
    const authorizedBy = input.authorizedBy.trim().slice(0, 120);
    const result = await query(
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
      [barcode, input.held, reason, authorizedBy, now.toISOString()]
    );

    await query(
      `INSERT INTO publication_hold_events (barcode, action, held, reason, authorized_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::timestamptz)`,
      [
        barcode,
        input.held ? 'hold' : 'release',
        input.held,
        input.held ? reason : String(input.reason || '').trim().slice(0, 500) || null,
        authorizedBy,
        now.toISOString(),
      ]
    );

    return { ok: true, record: rowToRecord(result.rows[0] as Record<string, unknown>) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'hold_store_unavailable',
      code: 'hold_store_unavailable',
    };
  }
}

/** Test helper — reset schema promise between suites. */
export function __resetPublicationHoldSchemaForTests(): void {
  schemaReady = null;
}
