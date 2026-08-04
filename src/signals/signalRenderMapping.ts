/**
 * Phase 6 Slice 0 owner module:
 * Single owning source for:
 * - normative class -> bucket mapping defaults
 * - presentation class mapping
 * - precedence / ordering
 * - dedupe ordering rules where applicable
 *
 * Guardrails:
 * - Do not duplicate these rules elsewhere.
 * - Changes here must align with the locked Phase 6 execution pack.
 */

import type { ProductScanResult, SignalCard, SignalClass } from '../types/scanOutputContract';
import type { NormativeSignalClass } from '../contracts/phase6/enums';
import type { DynamicSignalPublicationRecord } from '../dynamicSignals/publish/types';

export type SignalBucketKey = keyof ProductScanResult['signals'];

export const SIGNAL_CLASS_TO_BUCKET: Record<SignalClass, SignalBucketKey> = {
  A: 'safety_regulatory',
  B: 'transparency',
  C: 'user_preference',
  D: 'premium_insight',
};

export const NORMATIVE_TO_PRESENTATION_DEFAULT: Record<
  NormativeSignalClass,
  { bucket: SignalBucketKey; signalClass: SignalClass }
> = {
  // Required engineering default per locked execution pack §2.2.
  // Product approval state is governed by the execution pack sign-off section,
  // not inferred from this source file alone.
  safety_regulatory: { bucket: 'safety_regulatory', signalClass: 'A' },
  in_the_news: { bucket: 'transparency', signalClass: 'B' },
  my_choices_chain: { bucket: 'user_preference', signalClass: 'C' },
};

export function signalClassOrder(c: SignalClass): number {
  if (c === 'A') return 0;
  if (c === 'B') return 1;
  if (c === 'C') return 2;
  return 3;
}

export function mapSignalCardToBucket(card: SignalCard): SignalBucketKey {
  return SIGNAL_CLASS_TO_BUCKET[card.class] ?? 'premium_insight';
}

export function emptySignalsBuckets(): ProductScanResult['signals'] {
  return {
    safety_regulatory: [],
    transparency: [],
    user_preference: [],
    premium_insight: [],
  };
}

const PUBLICATION_SIGNAL_SEVERITY_BY_CLASS: Record<NormativeSignalClass, SignalCard['severity']> = {
  safety_regulatory: 'high',
  in_the_news: 'medium',
  my_choices_chain: 'low',
};

/** Slice 6 contract: only 5B publishable records can enter ProductScanResult.signals. */
export function isPublicationRecordPubliclyRenderable(r: DynamicSignalPublicationRecord): boolean {
  return r.signal_publication_state === 'publishable';
}

/**
 * Deterministic ordering for release comparison before dedupe:
 * 1) normative class order via owner mapping (`A`..`D`)
 * 2) dedupe_key lexicographic
 * 3) signal_id lexicographic
 */
export function sortPublicationRecordsForRender(
  records: DynamicSignalPublicationRecord[]
): DynamicSignalPublicationRecord[] {
  return [...records].sort((a, b) => {
    const aClass = NORMATIVE_TO_PRESENTATION_DEFAULT[a.signal_class].signalClass;
    const bClass = NORMATIVE_TO_PRESENTATION_DEFAULT[b.signal_class].signalClass;
    const classRank = signalClassOrder(aClass) - signalClassOrder(bClass);
    if (classRank !== 0) return classRank;
    const dk = a.dedupe_key.localeCompare(b.dedupe_key);
    if (dk !== 0) return dk;
    return a.signal_id.localeCompare(b.signal_id);
  });
}

export function mapPublicationRecordToSignalCard(r: DynamicSignalPublicationRecord): SignalCard {
  const view = NORMATIVE_TO_PRESENTATION_DEFAULT[r.signal_class];
  const severity =
    r.food_recall?.severity_override ?? PUBLICATION_SIGNAL_SEVERITY_BY_CLASS[r.signal_class];
  const sk = r.skeleton_card_copy;
  const fallbackTitle = r.source_record_id ? `${r.signal_class}:${r.source_record_id}` : r.signal_class;
  const evidence = r.source_record_url?.trim();
  const evidenceLinks =
    evidence && /^https?:\/\//i.test(evidence) ? [{ url: evidence }] : ([] as SignalCard['links']);
  return {
    id: r.signal_id,
    class: view.signalClass,
    title_key: `phase6.dynamic.${r.signal_class}.title`,
    body_key: `phase6.dynamic.${r.signal_class}.body`,
    why_key: `phase6.dynamic.${r.signal_class}.why`,
    severity,
    links: evidenceLinks,
    dedupe_key: r.dedupe_key,
    title_display: sk?.title_display ?? fallbackTitle,
    body_display: sk?.body_display,
    why_display: sk?.why_display,
    food_recall_needs_batch_entry: r.food_recall?.needs_batch_entry === true,
  };
}

