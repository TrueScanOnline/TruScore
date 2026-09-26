/**
 * Wave 4A.0 — clean production contribution-evidence epoch boundary.
 *
 * Production authority requires BOTH the current production epoch AND an
 * explicitly valid `recordClass: 'production'`. Absence/unknown/malformed/
 * historical/fixture/test/developer classifications fail closed.
 *
 * No bulk migration or grandfathering is authorised in 4A.0.
 */

export const CURRENT_PRODUCTION_CONTRIBUTION_EPOCH = 'wave4a.0' as const;

export type ProductionContributionEpoch = typeof CURRENT_PRODUCTION_CONTRIBUTION_EPOCH;

/** Structural class of a contribution evidence record. */
export const CONTRIBUTION_RECORD_CLASSES = [
  'production',
  'historical',
  'fixture',
  'test',
  'developer',
] as const;
export type ContributionRecordClass = (typeof CONTRIBUTION_RECORD_CLASSES)[number];

export type EpochInspectable = {
  productionEpoch?: string | null;
  recordClass?: ContributionRecordClass | string | null;
};

export function isCurrentProductionEpoch(epoch: string | null | undefined): boolean {
  return epoch === CURRENT_PRODUCTION_CONTRIBUTION_EPOCH;
}

/** Explicit allowlist — absent/unknown/malformed classes are not production. */
export function isExplicitProductionRecordClass(
  recordClass: string | null | undefined
): boolean {
  return recordClass === 'production';
}

export function isKnownContributionRecordClass(
  recordClass: string | null | undefined
): recordClass is ContributionRecordClass {
  return (
    recordClass === 'production' ||
    recordClass === 'historical' ||
    recordClass === 'fixture' ||
    recordClass === 'test' ||
    recordClass === 'developer'
  );
}

/**
 * Runtime determinant for stamping new contribution records.
 * Uses existing Expo/Node determinants already used elsewhere in this repo:
 * - Jest / NODE_ENV=test → non-production (developer)
 * - Metro / Expo Go (__DEV__) → non-production (developer)
 * - Release / store / TestFlight native builds (!__DEV__) → production
 *
 * Does not invent a new environment architecture. UAT on TestFlight is a
 * production-class runtime; Expo Go / Jest are not.
 */
export function resolveContributionCreationRecordClass(): ContributionRecordClass {
  if (process.env.JEST_WORKER_ID != null || process.env.NODE_ENV === 'test') {
    return 'developer';
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return 'developer';
  }
  return 'production';
}

/**
 * True only when the record carries the live production epoch AND an explicit
 * production recordClass. Epoch alone never converts historical/dev/test rows.
 */
export function carriesCurrentProductionEpoch(evidence: EpochInspectable): boolean {
  if (!isExplicitProductionRecordClass(evidence.recordClass ?? null)) return false;
  return isCurrentProductionEpoch(evidence.productionEpoch);
}

export function describeEpochAuthority(evidence: EpochInspectable): {
  productionAuthoritativeCandidate: boolean;
  reason: string;
  productionEpoch: string | null;
  recordClass: ContributionRecordClass | 'unspecified' | 'malformed';
} {
  const productionEpoch =
    typeof evidence.productionEpoch === 'string' ? evidence.productionEpoch : null;
  const rawClass = evidence.recordClass;
  const recordClass =
    rawClass == null || rawClass === ''
      ? 'unspecified'
      : isKnownContributionRecordClass(rawClass)
        ? rawClass
        : 'malformed';

  if (!isExplicitProductionRecordClass(typeof rawClass === 'string' ? rawClass : null)) {
    return {
      productionAuthoritativeCandidate: false,
      reason: `recordClass=${recordClass} is not explicit production — fail closed`,
      productionEpoch,
      recordClass,
    };
  }
  if (!productionEpoch) {
    return {
      productionAuthoritativeCandidate: false,
      reason: 'missing productionEpoch (pre-epoch / legacy) — fail closed',
      productionEpoch: null,
      recordClass,
    };
  }
  if (!isCurrentProductionEpoch(productionEpoch)) {
    return {
      productionAuthoritativeCandidate: false,
      reason: `productionEpoch=${productionEpoch} is not current (${CURRENT_PRODUCTION_CONTRIBUTION_EPOCH})`,
      productionEpoch,
      recordClass,
    };
  }
  return {
    productionAuthoritativeCandidate: true,
    reason: `productionEpoch=${CURRENT_PRODUCTION_CONTRIBUTION_EPOCH} with explicit recordClass=production`,
    productionEpoch,
    recordClass: 'production',
  };
}
