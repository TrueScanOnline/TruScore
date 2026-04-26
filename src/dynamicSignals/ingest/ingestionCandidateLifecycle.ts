/**
 * **Bounded vocabulary — ingestion layer only** (Doc 5 `SignalPublicationState` is separate).
 * This is **not** a proxy publication FSM: do not add `candidate` / `held_for_review` / `publishable`
 * here. Only these three literals are valid; Slice 5B alone advances `signal_publication_state`.
 */
export const INGESTION_CANDIDATE_LIFECYCLE = {
  received: 'received',
  normalized: 'normalized',
  rejected_malformed: 'rejected_malformed',
} as const;

export type IngestionCandidateLifecycle =
  (typeof INGESTION_CANDIDATE_LIFECYCLE)[keyof typeof INGESTION_CANDIDATE_LIFECYCLE];
