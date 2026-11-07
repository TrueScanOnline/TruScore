/**
 * Postgres persistence for WP-09 Community Agreements.
 * Separate from evidence_responses / Evidence Authority writes.
 * WP09-R2: durable rate-limit buckets shared across serverless instances.
 */

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

const WINDOW_MS = 60_000;

export const COMMUNITY_AGREEMENT_RATE_LIMITS = {
  perCredentialPerMinute: 30,
  /** Platform X-Forwarded-For / X-Real-IP from the Vercel edge — not a client body field. */
  perClientKeyPerMinute: 60,
  perBarcodePerMinute: 120,
} as const;

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

  /**
   * Atomic per-window counter. Returns false when the limit is exceeded.
   */
  async consumeRateBucket(bucketBase: string, limit: number, now: number): Promise<boolean> {
    await this.assertSchemaReady();
    const windowStart = Math.floor(now / WINDOW_MS) * WINDOW_MS;
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
      const clientOk = await store.consumeRateBucket(
        `client|${authorityEnv}|${clientKey || 'unknown'}`,
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
