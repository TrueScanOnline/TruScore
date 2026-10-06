/**
 * Internal unresolved-mark queue.
 * Frequency can prioritise research. It never creates a certification.
 * A later Recognised disposition does not rewrite historical packet observations.
 */

import { normalizeCertificationText } from './resolveCertification';

export type CandidateDisposition = 'Recognised' | 'Not a certification' | 'Unresolved';

export type UnresolvedMarkCandidate = {
  observedWording: string;
  count: number;
  disposition: CandidateDisposition;
  escalated: boolean;
};

const candidates = new Map<string, UnresolvedMarkCandidate>();

export function resetUnresolvedMarkCandidatesForTests(): void {
  candidates.clear();
}

export function recordUnresolvedObservation(wording: string): UnresolvedMarkCandidate {
  const key = normalizeCertificationText(wording);
  const existing = candidates.get(key);
  if (existing) {
    if (existing.disposition === 'Not a certification') {
      return { ...existing, escalated: false };
    }
    const next = { ...existing, count: existing.count + 1, escalated: false };
    candidates.set(key, next);
    return next;
  }
  const created: UnresolvedMarkCandidate = {
    observedWording: wording.trim(),
    count: 1,
    disposition: 'Unresolved',
    escalated: false,
  };
  candidates.set(key, created);
  return created;
}

/** Governance outcome. This does not admit a certification or rewrite older observations. */
export function setCandidateDisposition(wording: string, disposition: CandidateDisposition): UnresolvedMarkCandidate | undefined {
  const key = normalizeCertificationText(wording);
  const existing = candidates.get(key);
  if (!existing) return undefined;
  const next = { ...existing, disposition, escalated: false };
  candidates.set(key, next);
  return next;
}

export function listUnresolvedMarkCandidates(): UnresolvedMarkCandidate[] {
  return [...candidates.values()];
}
