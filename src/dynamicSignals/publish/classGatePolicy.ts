import type { NormativeSignalClass, SignalPublicationState } from '../../contracts/phase6/enums';
import type { DynamicSignalPublicationRecord, MyChoicesChainContext } from './types';

type SignalState = DynamicSignalPublicationRecord['state'];

/**
 * Class-specific gating (Doc 5, execution pack). **Explicit** `state` + chain context only — no
 * identity heuristics or “best guess” resolution shortcuts.
 */
export function classAllowsPublishable(
  signalClass: NormativeSignalClass,
  state: SignalState,
  myChoices: MyChoicesChainContext | undefined
): { allowed: boolean; reason: string } {
  if (state.resolution_status === 'blocked' || state.resolution_status === 'needs_review') {
    return { allowed: false, reason: 'xl02_blocked_or_needs_review' };
  }
  if (state.confidence_state === 'rejected') {
    return { allowed: false, reason: 'rejected_confidence' };
  }
  if (state.resolution_status === 'ambiguous' && signalClass === 'safety_regulatory') {
    return { allowed: false, reason: 'safety_ambiguous' };
  }
  if (state.resolution_status !== 'resolved' && state.resolution_status !== 'resolved_with_warning') {
    return { allowed: false, reason: 'resolution_not_resolved' };
  }

  if (signalClass === 'safety_regulatory') {
    return { allowed: true, reason: 'safety_ok' };
  }

  if (signalClass === 'in_the_news') {
    if (state.review_state !== 'reviewed') {
      return { allowed: false, reason: 'in_the_news_needs_reviewed' };
    }
    return { allowed: true, reason: 'in_the_news_ok' };
  }

  if (signalClass === 'my_choices_chain') {
    if (!myChoices) {
      return { allowed: false, reason: 'my_choices_context_required' };
    }
    if (!myChoices.is_chain_linked) {
      return { allowed: false, reason: 'my_choices_not_chain_linked' };
    }
    if (state.review_state === 'provisional' || state.review_state === 'seeded') {
      return { allowed: false, reason: 'my_choices_review_not_ready' };
    }
    return { allowed: true, reason: 'my_choices_ok' };
  }

  return { allowed: false, reason: 'unknown_class' };
}

/**
 * **Initial** `signal_publication_state` for a new materialized record. `expired` is never returned
 * here (staleness is time-driven). **XL-02:** `blocked` and `needs_review` never get `publishable` via
 * gating; `suppressed` / `held_for_review` reflect hard blocks vs review queue.
 */
export function initialSignalPublicationState(
  signalClass: NormativeSignalClass,
  state: SignalState,
  myChoices: MyChoicesChainContext | undefined
): SignalPublicationState {
  if (state.resolution_status === 'blocked') return 'suppressed';
  if (state.resolution_status === 'needs_review') return 'held_for_review';
  if (state.resolution_status === 'ambiguous' && signalClass === 'safety_regulatory') {
    return 'held_for_review';
  }
  if (state.confidence_state === 'rejected') return 'suppressed';

  const g = classAllowsPublishable(signalClass, state, myChoices);
  if (g.allowed) return 'publishable';

  return 'held_for_review';
}
