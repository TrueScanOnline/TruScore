/**
 * W5-CD-01 approved consumer copy, bound only to genuine outcome variants.
 *
 * admitted_visible / correction use the existing Result success fact
 * (CONTRIBUTION_NOTICE_ADDED) — EA admission already makes evidence visible
 * on Result. Do not claim "awaiting review" for that state.
 *
 * The Stage 4 "Contribution received / We'll check…" receipt-before-publish
 * copy is reserved for a distinct server-receipt state. That state is not
 * separately exposed on the governed Result path today, so it is not offered.
 */

import { CONTRIBUTION_NOTICE_ADDED } from '../contribution/resultContributionActions';
import type { ContributionCelebrationCopy, ContributionCelebrationVariant } from './types';

const ADMITTED_SECONDARY_DETAIL =
  'Your contribution was admitted into this product’s evidence and is reflected on the result you see here. Community checks may continue where Rveel’s existing agreement process applies.';

export function copyForCelebrationVariant(
  variant: ContributionCelebrationVariant
): ContributionCelebrationCopy {
  switch (variant) {
    case 'admitted_visible':
      return {
        title: 'You made a difference!',
        body: 'Thanks for helping make food information clearer.',
        status: CONTRIBUTION_NOTICE_ADDED,
        qualification: null,
        primaryAction: 'Keep exploring',
        secondaryAction: 'What happens next?',
        secondaryDetail: ADMITTED_SECONDARY_DETAIL,
      };
    case 'correction':
      return {
        title: 'Thank you for keeping Rveel accurate!',
        body: 'Thanks for helping make food information clearer.',
        status: CONTRIBUTION_NOTICE_ADDED,
        qualification: null,
        primaryAction: 'Keep exploring',
        secondaryAction: 'What happens next?',
        secondaryDetail: ADMITTED_SECONDARY_DETAIL,
      };
    case 'agreement_compact':
      return {
        title: 'Thanks for your contribution',
        body: '',
        status: null,
        qualification: null,
        primaryAction: 'OK',
        secondaryAction: null,
        secondaryDetail: null,
      };
  }
}

/** True when a celebration variant is allowed for a complete EA admission. */
export function celebrationVariantForAdmission(args: {
  complete: boolean;
  journey: 'add' | 'change';
}): ContributionCelebrationVariant | null {
  if (!args.complete) return null;
  return args.journey === 'change' ? 'correction' : 'admitted_visible';
}
