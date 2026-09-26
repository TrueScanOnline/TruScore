/**
 * Wave 4A.0 — clean production contribution-evidence epoch boundary.
 *
 * Records without the current production epoch are pre-epoch / non-production.
 * They may remain for history/dev/fixtures but must fail closed for production
 * assessment, Confidence, maturity, confirm/dispute inheritance, and prevailing
 * production-record selection.
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
  recordClass?: ContributionRecordClass | null;
};

export function isCurrentProductionEpoch(epoch: string | null | undefined): boolean {
  return epoch === CURRENT_PRODUCTION_CONTRIBUTION_EPOCH;
}

/** Fixture/test/developer records never satisfy production epoch authority. */
export function isNonProductionRecordClass(
  recordClass: ContributionRecordClass | null | undefined
): boolean {
  return recordClass === 'fixture' || recordClass === 'test' || recordClass === 'developer';
}

/**
 * True only when the record carries the live production epoch and is not a
 * structurally non-production class. Absent epoch ⇒ pre-epoch ⇒ fail closed.
 */
export function carriesCurrentProductionEpoch(evidence: EpochInspectable): boolean {
  if (isNonProductionRecordClass(evidence.recordClass ?? null)) return false;
  return isCurrentProductionEpoch(evidence.productionEpoch);
}

export function describeEpochAuthority(evidence: EpochInspectable): {
  productionAuthoritativeCandidate: boolean;
  reason: string;
  productionEpoch: string | null;
  recordClass: ContributionRecordClass | 'unspecified';
} {
  const productionEpoch =
    typeof evidence.productionEpoch === 'string' ? evidence.productionEpoch : null;
  const recordClass = evidence.recordClass ?? 'unspecified';

  if (isNonProductionRecordClass(evidence.recordClass ?? null)) {
    return {
      productionAuthoritativeCandidate: false,
      reason: `recordClass=${recordClass} is structurally excluded from production authority`,
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
    reason: `productionEpoch=${CURRENT_PRODUCTION_CONTRIBUTION_EPOCH} with production-capable recordClass`,
    productionEpoch,
    recordClass,
  };
}
