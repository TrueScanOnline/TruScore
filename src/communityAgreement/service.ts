/**
 * WP-09 Community Agreement domain service.
 * Display-only. Does not touch Evidence Authority confirm/dispute or scoring.
 */

import type { AuthorityEnv, SharedEvidenceSnapshot } from '../evidenceAuthority/types';
import { buildAgreementRevision, resolveAgreementVariantKey } from './revision';
import { selectAgreementTargets, submitterIdsForAgreementTargets } from './targets';
import {
  COMMUNITY_AGREEMENT_EMPTY_VARIANT,
  isCommunityAgreementGroup,
  type CommunityAgreementGetResponse,
  type CommunityAgreementGroup,
  type CommunityAgreementPostResponse,
} from './types';

export type CommunityAgreementRecord = {
  agreementId: string;
  authorityEnv: AuthorityEnv;
  barcode: string;
  variantKey: string;
  cardGroup: CommunityAgreementGroup;
  revisionId: string;
  revisionPairs: string[];
  contributorId: string;
  createdAt: number;
};

export type CommunityAgreementStore = {
  count(
    authorityEnv: AuthorityEnv,
    barcode: string,
    variantKey: string,
    cardGroup: CommunityAgreementGroup,
    revisionId: string
  ): Promise<number>;
  hasAgreed(
    authorityEnv: AuthorityEnv,
    barcode: string,
    variantKey: string,
    cardGroup: CommunityAgreementGroup,
    revisionId: string,
    contributorId: string
  ): Promise<boolean>;
  insert(row: CommunityAgreementRecord): Promise<'inserted' | 'duplicate'>;
};

export type AgreementRateLimitDecision = { ok: true } | { ok: false; reason: 'rate_limited' };

export type AgreementAbuseGuard = {
  check(input: {
    authorityEnv: AuthorityEnv;
    contributorId: string;
    barcode: string;
    clientKey: string;
    now: number;
  }): AgreementRateLimitDecision | Promise<AgreementRateLimitDecision>;
};

export type CommunityAgreementServiceDeps = {
  authorityEnv: AuthorityEnv;
  store: CommunityAgreementStore;
  abuse?: AgreementAbuseGuard;
  now?: () => number;
  newId?: () => string;
  /**
   * Optional second snapshot read immediately before insert.
   * Narrows the race with Evidence Authority admission; not one atomic TX.
   */
  revalidateSnapshot?: (barcode: string) => Promise<SharedEvidenceSnapshot | null>;
};

const BARCODE_RE = /^\d{8,14}$/;

/**
 * Process-local Map only — for unit tests and explicitly labelled local development.
 * Production API must use the durable Postgres bucket guard instead.
 */
export function createMemoryAgreementAbuseGuard(limits?: {
  perCredentialPerMinute?: number;
  perClientKeyPerMinute?: number;
  perBarcodePerMinute?: number;
}): AgreementAbuseGuard {
  const perCredential = limits?.perCredentialPerMinute ?? 30;
  const perClient = limits?.perClientKeyPerMinute ?? 60;
  const perBarcode = limits?.perBarcodePerMinute ?? 120;
  const buckets = new Map<string, number>();

  function tick(key: string, limit: number, now: number): boolean {
    const minute = Math.floor(now / 60_000);
    const bucketKey = `${key}|${minute}`;
    const next = (buckets.get(bucketKey) || 0) + 1;
    buckets.set(bucketKey, next);
    return next <= limit;
  }

  return {
    check({ authorityEnv, contributorId, barcode, clientKey, now }) {
      if (!tick(`cred|${authorityEnv}|${contributorId}`, perCredential, now)) {
        return { ok: false, reason: 'rate_limited' };
      }
      if (!tick(`client|${authorityEnv}|${clientKey || 'unknown'}`, perClient, now)) {
        return { ok: false, reason: 'rate_limited' };
      }
      if (!tick(`barcode|${authorityEnv}|${barcode}`, perBarcode, now)) {
        return { ok: false, reason: 'rate_limited' };
      }
      return { ok: true };
    },
  };
}

export function createMemoryAgreementStore(): CommunityAgreementStore & {
  rows: CommunityAgreementRecord[];
} {
  const rows: CommunityAgreementRecord[] = [];
  return {
    rows,
    async count(authorityEnv, barcode, variantKey, cardGroup, revisionId) {
      return rows.filter(
        (row) =>
          row.authorityEnv === authorityEnv &&
          row.barcode === barcode &&
          row.variantKey === variantKey &&
          row.cardGroup === cardGroup &&
          row.revisionId === revisionId
      ).length;
    },
    async hasAgreed(authorityEnv, barcode, variantKey, cardGroup, revisionId, contributorId) {
      return rows.some(
        (row) =>
          row.authorityEnv === authorityEnv &&
          row.barcode === barcode &&
          row.variantKey === variantKey &&
          row.cardGroup === cardGroup &&
          row.revisionId === revisionId &&
          row.contributorId === contributorId
      );
    },
    async insert(row) {
      const exists = rows.some(
        (item) =>
          item.authorityEnv === row.authorityEnv &&
          item.barcode === row.barcode &&
          item.variantKey === row.variantKey &&
          item.cardGroup === row.cardGroup &&
          item.revisionId === row.revisionId &&
          item.contributorId === row.contributorId
      );
      if (exists) return 'duplicate';
      rows.push(row);
      return 'inserted';
    },
  };
}

export class CommunityAgreementService {
  constructor(private readonly deps: CommunityAgreementServiceDeps) {}

  private env(): AuthorityEnv {
    return this.deps.authorityEnv;
  }

  async get(input: {
    barcode: string;
    cardGroup: unknown;
    variantKey?: unknown;
    contributorId?: string | null;
    snapshot: SharedEvidenceSnapshot | null;
  }): Promise<
    | { ok: true; body: CommunityAgreementGetResponse }
    | { ok: false; status: number; reason: string }
  > {
    if (!BARCODE_RE.test(input.barcode)) {
      return { ok: false, status: 400, reason: 'invalid_barcode' };
    }
    if (!isCommunityAgreementGroup(input.cardGroup)) {
      return { ok: false, status: 400, reason: 'unsupported_group' };
    }
    const variant = resolveAgreementVariantKey(input.variantKey);
    if (!variant.ok) return { ok: false, status: 400, reason: variant.reason };

    if (!input.snapshot || input.snapshot.barcode !== input.barcode) {
      return {
        ok: true,
        body: {
          authorityEnv: this.env(),
          barcode: input.barcode,
          variantKey: variant.variantKey,
          cardGroup: input.cardGroup,
          revisionId: '',
          count: 0,
          eligible: false,
          ...(input.contributorId ? { hasAgreed: false } : {}),
        },
      };
    }
    if (input.snapshot.authorityEnv !== this.env()) {
      return { ok: false, status: 409, reason: 'authority_env_mismatch' };
    }

    const pairs = selectAgreementTargets(input.cardGroup, input.snapshot);
    if (pairs.length === 0) {
      return {
        ok: true,
        body: {
          authorityEnv: this.env(),
          barcode: input.barcode,
          variantKey: variant.variantKey,
          cardGroup: input.cardGroup,
          revisionId: '',
          count: 0,
          eligible: false,
          ...(input.contributorId ? { hasAgreed: false } : {}),
        },
      };
    }

    const revision = buildAgreementRevision({
      authorityEnv: this.env(),
      barcode: input.barcode,
      variantKey: variant.variantKey,
      cardGroup: input.cardGroup,
      pairs,
    });
    const count = await this.deps.store.count(
      this.env(),
      input.barcode,
      revision.variantKey,
      input.cardGroup,
      revision.revisionId
    );
    const hasAgreed = input.contributorId
      ? await this.deps.store.hasAgreed(
          this.env(),
          input.barcode,
          revision.variantKey,
          input.cardGroup,
          revision.revisionId,
          input.contributorId
        )
      : undefined;

    return {
      ok: true,
      body: {
        authorityEnv: this.env(),
        barcode: input.barcode,
        variantKey: revision.variantKey,
        cardGroup: input.cardGroup,
        revisionId: revision.revisionId,
        count,
        eligible: true,
        ...(hasAgreed !== undefined ? { hasAgreed } : {}),
      },
    };
  }

  async agree(input: {
    barcode: string;
    cardGroup: unknown;
    variantKey?: unknown;
    expectedRevisionId: unknown;
    contributorId: string;
    snapshot: SharedEvidenceSnapshot | null;
    /** Extra submitter ids from version rows when snapshot evidence omits them. */
    versionContributorIds?: string[];
    clientKey?: string;
  }): Promise<
    | { ok: true; body: CommunityAgreementPostResponse }
    | { ok: false; status: number; reason: string }
  > {
    if (!input.contributorId) {
      return { ok: false, status: 401, reason: 'contributor_credential_required' };
    }
    if (!BARCODE_RE.test(input.barcode)) {
      return { ok: false, status: 400, reason: 'invalid_barcode' };
    }
    if (!isCommunityAgreementGroup(input.cardGroup)) {
      return { ok: false, status: 400, reason: 'unsupported_group' };
    }
    if (typeof input.expectedRevisionId !== 'string' || !input.expectedRevisionId.trim()) {
      return { ok: false, status: 400, reason: 'expected_revision_required' };
    }
    const variant = resolveAgreementVariantKey(input.variantKey);
    if (!variant.ok) return { ok: false, status: 400, reason: variant.reason };

    if (!input.snapshot || input.snapshot.barcode !== input.barcode) {
      return { ok: false, status: 409, reason: 'no_eligible_evidence' };
    }
    if (input.snapshot.authorityEnv !== this.env()) {
      return { ok: false, status: 409, reason: 'authority_env_mismatch' };
    }

    const pairs = selectAgreementTargets(input.cardGroup, input.snapshot);
    if (pairs.length === 0) {
      return { ok: false, status: 409, reason: 'no_eligible_evidence' };
    }

    const revision = buildAgreementRevision({
      authorityEnv: this.env(),
      barcode: input.barcode,
      variantKey: variant.variantKey,
      cardGroup: input.cardGroup,
      pairs,
    });
    if (revision.revisionId !== input.expectedRevisionId) {
      return { ok: false, status: 409, reason: 'stale_revision' };
    }

    const submitters = new Set([
      ...submitterIdsForAgreementTargets(input.snapshot, pairs),
      ...(input.versionContributorIds || []),
    ]);
    if (submitters.has(input.contributorId)) {
      return { ok: false, status: 403, reason: 'self_agreement_not_allowed' };
    }

    const now = (this.deps.now || Date.now)();
    if (this.deps.abuse) {
      const limited = await this.deps.abuse.check({
        authorityEnv: this.env(),
        contributorId: input.contributorId,
        barcode: input.barcode,
        clientKey: input.clientKey || 'unknown',
        now,
      });
      if (!limited.ok) return { ok: false, status: 429, reason: limited.reason };
    }

    // Narrow the admission race: re-read prevailing evidence before insert.
    // Still not atomic with Evidence Authority admission — see WP09 concurrency note.
    if (this.deps.revalidateSnapshot) {
      const fresh = await this.deps.revalidateSnapshot(input.barcode);
      if (!fresh || fresh.barcode !== input.barcode || fresh.authorityEnv !== this.env()) {
        return { ok: false, status: 409, reason: 'stale_revision' };
      }
      const freshPairs = selectAgreementTargets(input.cardGroup, fresh);
      const freshRevision = buildAgreementRevision({
        authorityEnv: this.env(),
        barcode: input.barcode,
        variantKey: variant.variantKey,
        cardGroup: input.cardGroup,
        pairs: freshPairs,
      });
      if (freshRevision.revisionId !== revision.revisionId) {
        return { ok: false, status: 409, reason: 'stale_revision' };
      }
    }

    const outcome = await this.deps.store.insert({
      agreementId: (this.deps.newId || (() => `agr_${Math.random().toString(16).slice(2, 14)}`))(),
      authorityEnv: this.env(),
      barcode: input.barcode,
      variantKey: revision.variantKey || COMMUNITY_AGREEMENT_EMPTY_VARIANT,
      cardGroup: input.cardGroup,
      revisionId: revision.revisionId,
      revisionPairs: pairs.map((pair) => `${pair.subjectKey}:${pair.versionId}`),
      contributorId: input.contributorId,
      createdAt: now,
    });

    const count = await this.deps.store.count(
      this.env(),
      input.barcode,
      revision.variantKey,
      input.cardGroup,
      revision.revisionId
    );

    if (outcome === 'duplicate') {
      return {
        ok: true,
        body: {
          authorityEnv: this.env(),
          barcode: input.barcode,
          variantKey: revision.variantKey,
          cardGroup: input.cardGroup,
          revisionId: revision.revisionId,
          count,
          hasAgreed: true,
        },
      };
    }

    return {
      ok: true,
      body: {
        authorityEnv: this.env(),
        barcode: input.barcode,
        variantKey: revision.variantKey,
        cardGroup: input.cardGroup,
        revisionId: revision.revisionId,
        count,
        hasAgreed: true,
      },
    };
  }
}
