import type { FreezeStatus, ResolutionStatus, ReviewState } from '../contracts/phase6/enums';

/**
 * Document 5: ethics_scoring_eligible requires `resolution_status` in { resolved, resolved_with_warning }.
 * This is a bounded, enum-backed set — do not expand outside explicit pack approval.
 */
export const ETHICS_SCORING_ELIGIBLE_RESOLUTION_STATUSES = [
  'resolved',
  'resolved_with_warning',
] as const satisfies readonly ResolutionStatus[];

export function isResolutionEligibleForEthicsScoring(
  s: ResolutionStatus
): s is (typeof ETHICS_SCORING_ELIGIBLE_RESOLUTION_STATUSES)[number] {
  return (ETHICS_SCORING_ELIGIBLE_RESOLUTION_STATUSES as readonly string[]).includes(s);
}

export function isEthicsScoringEligibleState(input: {
  freezeStatus: FreezeStatus;
  reviewState: ReviewState;
  resolutionStatus: ResolutionStatus;
  blockerFlags: string[];
}): boolean {
  return (
    input.freezeStatus === 'frozen' &&
    input.reviewState === 'reviewed' &&
    isResolutionEligibleForEthicsScoring(input.resolutionStatus) &&
    input.blockerFlags.length === 0
  );
}
