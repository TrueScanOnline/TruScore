/**
 * Postgres persistence for WP-09 Community Agreements.
 * Separate from evidence_responses / Evidence Authority writes.
 * WP09-R2: durable fixed-minute rate-limit buckets shared across serverless instances.
 * Client edge addresses are hashed before storage; expired windows are purged.
 */

import { createHash } from 'crypto';
import type {
  AgreementAbuseGuard,
  CommunityAgreementRecord,
  CommunityAgreementStore,
} from '../truescan-src/communityAgreement/service';
import type { AuthorityEnv } from '../truescan-src/evidenceAuthority/types';
import type { CommunityAgreementGroup } from '../truescan-src/communityAgreement/types';

type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

type PoolLike = Queryable & {
  connect: () => Promise<Queryable & { release: () => void }>;
};

/** Fixed calendar-minute window length (not a rolling window). */
export const COMMUNITY_AGREEMENT_RATE_WINDOW_MS = 60_000;

/**
 * Retain closed windows briefly for debugging, then delete.
 * Cleanup removes buckets whose window_start_ms is older than now - retention.
 */
export const COMMUNITY_AGREEMENT_RATE_BUCKET_RETENTION_MS = 10 * 60_000;

export const COMMUNITY_AGREEMENT_RATE_LIMITS = {
  perCredentialPerMinute: 30,
  /** Hashed platform edge address — not a raw IP and not a client body field. */
  perClientKeyPerMinute: 60,
  perBarcodePerMinute: 120,
} as const;

/** Server-controlled one-way token for the edge client dimension. */
export function hashAgreementClientKey(raw: string): string {
  const material = `rveel-ca-client-v1|${raw || 'unknown'}`;
  return createHash('sha256').update(material).digest('hex').slice(0, 32);
}

export function agreementRateWindowStartMs(now: number): number {
  return Math.floor(now / COMMUNITY_AGREEMENT_RATE_WINDOW_MS) * COMMUNITY_AGREEMENT_RATE_WINDOW_MS;
}

export class PostgresCommunityAgreementStore implements CommunityAgreementStore {
  private schemaReady = false;

  constructor(private readonly pool: PoolLike) {}

  async assertSchemaReady(): Promise<void> {
    if (this.schemaReady) return;
    const found = await this.pool.query(`SELECT to_regclass('public.community_agreements') AS relation`);
    const relation = found.rows[0]?.relation;
    if (relation == null) {
      throw new Error('community_agreements_schema_unavailable');
    }
    const rate = await this.pool.query(
      `SELECT to_regclass('public.community_agreement_rate_buckets') AS relation`
    );
    if (rate.rows[0]?.relation == null) {
      throw new Error('community_agreements_schema_unavailable');
    }
    this.schemaReady = true;
  }

  async count(
    authorityEnv: AuthorityEnv,
    barcode: string,
    variantKey: string,
    cardGroup: CommunityAgreementGroup,
    revisionId: string
  ): Promise<number> {
    await this.assertSchemaReady();
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS n
       FROM community_agreements
       WHERE authority_env = $1
         AND barcode = $2
         AND variant_key = $3
         AND card_group = $4
         AND revision_id = $5`,
      [authorityEnv, barcode, variantKey, cardGroup, revisionId]
    );
    return Number(result.rows[0]?.n || 0);
  }

  async hasAgreed(
    authorityEnv: AuthorityEnv,
    barcode: string,
    variantKey: string,
    cardGroup: CommunityAgreementGroup,
    revisionId: string,
    contributorId: string
  ): Promise<boolean> {
    await this.assertSchemaReady();
    const result = await this.pool.query(
      `SELECT 1
       FROM community_agreements
       WHERE authority_env = $1
         AND barcode = $2
         AND variant_key = $3
         AND card_group = $4
         AND revision_id = $5
         AND contributor_id = $6
       LIMIT 1`,
      [authorityEnv, barcode, variantKey, cardGroup, revisionId, contributorId]
    );
    return result.rows.length > 0;
  }

  async insert(row: CommunityAgreementRecord): Promise<'inserted' | 'duplicate'> {
    await this.assertSchemaReady();
    try {
      await this.pool.query(
        `INSERT INTO community_agreements (
           agreement_id, authority_env, barcode, variant_key, card_group,
           revision_id, revision_pairs, contributor_id, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,to_timestamp($9::double precision / 1000.0))`,
        [
          row.agreementId,
          row.authorityEnv,
          row.barcode,
          row.variantKey,
          row.cardGroup,
          row.revisionId,
          row.revisionPairs,
          row.contributorId,
          row.createdAt,
        ]
      );
      return 'inserted';
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === '23505') return 'duplicate';
      throw error;
    }
  }

  /** Deletes rate-limit rows older than the retention horizon. */
  async purgeExpiredRateBuckets(
    now: number,
    retentionMs = COMMUNITY_AGREEMENT_RATE_BUCKET_RETENTION_MS
  ): Promise<number> {
    await this.assertSchemaReady();
    const cutoff = now - retentionMs;
    const result = await this.pool.query(
      `DELETE FROM community_agreement_rate_buckets
       WHERE window_start_ms < $1
       RETURNING bucket_key`,
      [cutoff]
    );
    return result.rows.length;
  }

  /**
   * Atomic fixed-minute window counter. Returns false when the limit is exceeded.
   * Opportunistically purges expired buckets after each consume.
   */
  async consumeRateBucket(bucketBase: string, limit: number, now: number): Promise<boolean> {
    await this.assertSchemaReady();
    const windowStart = agreementRateWindowStartMs(now);
    const bucketKey = `${bucketBase}|${windowStart}`;
    const result = await this.pool.query(
      `INSERT INTO community_agreement_rate_buckets (bucket_key, window_start_ms, hit_count, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (bucket_key) DO UPDATE
         SET hit_count = community_agreement_rate_buckets.hit_count + 1,
             updated_at = NOW()
       RETURNING hit_count`,
      [bucketKey, windowStart]
    );
    const hits = Number(result.rows[0]?.hit_count || 0);
    // Best-effort hygiene; failures must not block the agreement path.
    try {
      await this.purgeExpiredRateBuckets(now);
    } catch {
      // ignore cleanup errors
    }
    return hits <= limit;
  }
}

export function createPostgresAgreementAbuseGuard(
  store: PostgresCommunityAgreementStore,
  limits = COMMUNITY_AGREEMENT_RATE_LIMITS
): AgreementAbuseGuard {
  return {
    async check({ authorityEnv, contributorId, barcode, clientKey, now }) {
      const credOk = await store.consumeRateBucket(
        `cred|${authorityEnv}|${contributorId}`,
        limits.perCredentialPerMinute,
        now
      );
      if (!credOk) return { ok: false, reason: 'rate_limited' };
      const clientToken = hashAgreementClientKey(clientKey || 'unknown');
      const clientOk = await store.consumeRateBucket(
        `client|${authorityEnv}|${clientToken}`,
        limits.perClientKeyPerMinute,
        now
      );
      if (!clientOk) return { ok: false, reason: 'rate_limited' };
      const barcodeOk = await store.consumeRateBucket(
        `barcode|${authorityEnv}|${barcode}`,
        limits.perBarcodePerMinute,
        now
      );
      if (!barcodeOk) return { ok: false, reason: 'rate_limited' };
      return { ok: true };
    },
  };
}
