/**
 * Classify frozen benchmark attribution for Rateability benchmark-check stamping.
 *
 * ethics_scoring_eligible === false alone does NOT mean a completed not_applicable assessment.
 * Completed assessed not_applicable is reserved for an explicit governed “checked, genuinely N/A”
 * outcome — none of the current ineligibility causes produce that.
 */

import type { FrozenBenchmarkAttributionObject } from '../../../benchmark/types';
import type { BenchmarkNotApplicableResolution } from '../claims/types';

export type FrozenIneligibilityCause =
  | 'no_frozen_object'
  | 'eligible'
  | 'freeze_not_frozen'
  | 'review_not_reviewed'
  | 'resolution_ambiguous'
  | 'resolution_blocked'
  | 'resolution_needs_review'
  | 'blocker_flags_present'
  | 'confidence_insufficient'
  | 'ineligible_other';

/**
 * Primary ineligibility cause for a frozen attribution object (diagnostic / mapping report).
 * Order matches Document 5 eligibility gate precedence for reporting clarity.
 */
export function classifyFrozenBenchmarkIneligibility(
  frozen: FrozenBenchmarkAttributionObject | null | undefined
): FrozenIneligibilityCause {
  if (!frozen) return 'no_frozen_object';
  if (frozen.eligibility.ethics_scoring_eligible) return 'eligible';

  if (frozen.freeze.freeze_status !== 'frozen') return 'freeze_not_frozen';
  if (frozen.state.review_state !== 'reviewed') return 'review_not_reviewed';
  if (frozen.state.resolution_status === 'ambiguous') return 'resolution_ambiguous';
  if (frozen.state.resolution_status === 'blocked') return 'resolution_blocked';
  if (frozen.state.resolution_status === 'needs_review') return 'resolution_needs_review';
  if ((frozen.eligibility.blocker_flags?.length ?? 0) > 0) return 'blocker_flags_present';
  // Confidence is not part of isEthicsScoringEligibleState today, but low/rejected/probable
  // attribution must never be treated as a completed assessed check if somehow ineligible.
  if (
    frozen.state.confidence_state === 'low' ||
    frozen.state.confidence_state === 'rejected' ||
    frozen.state.confidence_state === 'probable'
  ) {
    return 'confidence_insufficient';
  }
  return 'ineligible_other';
}

/**
 * Rateability stamp when ethics scoring is ineligible for a source.
 * Every current false/ineligible frozen cause → skipped_or_unavailable (not assessed).
 * completed_no_applicable_result is not emitted from ethics_scoring_eligible === false alone.
 */
export function frozenIneligibleNotApplicableResolution(
  frozen: FrozenBenchmarkAttributionObject | null | undefined
): BenchmarkNotApplicableResolution {
  const cause = classifyFrozenBenchmarkIneligibility(frozen);
  switch (cause) {
    case 'eligible':
    case 'no_frozen_object':
      // Callers should not stamp not_applicable on these; fail closed if they do.
      return 'skipped_or_unavailable';
    case 'freeze_not_frozen':
    case 'review_not_reviewed':
    case 'resolution_ambiguous':
    case 'resolution_blocked':
    case 'resolution_needs_review':
    case 'blocker_flags_present':
    case 'confidence_insufficient':
    case 'ineligible_other':
      return 'skipped_or_unavailable';
    default:
      return 'skipped_or_unavailable';
  }
}
