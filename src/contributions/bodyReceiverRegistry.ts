/**
 * Wave 4A.0 — Body receiver predicate registration (code/governance controlled).
 *
 * 4A.0 ships with zero registered predicates → Body fail-closed.
 * 4A.2 may register approved evidence-type × methodology predicates here.
 * Stored receiverEligibility maps are never authoritative.
 */

import type { ContributionEvidence } from './types';
import { BODY_RECEIVER_4A0_UNREGISTERED_REASON } from './admissionTypes';

export type BodyReceiverPredicateResult = {
  eligible: boolean;
  methodologyId: string;
  methodologyVersion: string;
  reason: string;
};

export type BodyReceiverPredicate = (evidence: ContributionEvidence) => BodyReceiverPredicateResult | null;

const registeredBodyPredicates: BodyReceiverPredicate[] = [];

/** Production API for later packages — not used by 4A.0 callers. */
export function registerBodyReceiverPredicate(predicate: BodyReceiverPredicate): () => void {
  registeredBodyPredicates.push(predicate);
  return () => {
    const idx = registeredBodyPredicates.indexOf(predicate);
    if (idx >= 0) registeredBodyPredicates.splice(idx, 1);
  };
}

export function listRegisteredBodyReceiverPredicateCount(): number {
  return registeredBodyPredicates.length;
}

export function __clearBodyReceiverPredicatesForTests(): void {
  registeredBodyPredicates.length = 0;
}

/**
 * Evaluate Body eligibility from registered predicates only.
 * Empty registry → fail closed with 4A.0 unregistered reason.
 */
export function evaluateBodyReceiverEligibility(
  evidence: ContributionEvidence
): BodyReceiverPredicateResult {
  if (registeredBodyPredicates.length === 0) {
    return {
      eligible: false,
      methodologyId: 'body_pillar',
      methodologyVersion: 'as_built',
      reason: BODY_RECEIVER_4A0_UNREGISTERED_REASON,
    };
  }
  for (const predicate of registeredBodyPredicates) {
    const result = predicate(evidence);
    if (result && result.eligible === true) {
      return result;
    }
  }
  return {
    eligible: false,
    methodologyId: 'body_pillar',
    methodologyVersion: 'as_built',
    reason: BODY_RECEIVER_4A0_UNREGISTERED_REASON,
  };
}
