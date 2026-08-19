import {
  consumerSignalCategoryLabel,
  emptySignalsBuckets,
  isPublicationRecordPubliclyRenderable,
  mapPublicationRecordToSignalCard,
  mapSignalCardToBucket,
  NORMATIVE_TO_PRESENTATION_DEFAULT,
  signalClassOrder,
  sortPublicationRecordsForRender,
} from '../../../../src/signals/signalRenderMapping';
import type { SignalCard } from '../../../../src/types/scanOutputContract';
import type { DynamicSignalPublicationRecord } from '../../../../src/dynamicSignals/publish/types';

describe('signalRenderMapping (Slice 0 foundation)', () => {
  it('maps presentation signal classes to canonical buckets', () => {
    const base = {
      id: 'id',
      title_key: 't',
      body_key: 'b',
      why_key: 'w',
      severity: 'low' as const,
      links: [],
      dedupe_key: 'k',
    };
    expect(mapSignalCardToBucket({ ...base, class: 'A' } as SignalCard)).toBe('safety_regulatory');
    expect(mapSignalCardToBucket({ ...base, class: 'B' } as SignalCard)).toBe('transparency');
    expect(mapSignalCardToBucket({ ...base, class: 'C' } as SignalCard)).toBe('user_preference');
    expect(mapSignalCardToBucket({ ...base, class: 'D' } as SignalCard)).toBe('premium_insight');
  });

  it('keeps canonical class order A->B->C->D', () => {
    expect(signalClassOrder('A')).toBeLessThan(signalClassOrder('B'));
    expect(signalClassOrder('B')).toBeLessThan(signalClassOrder('C'));
    expect(signalClassOrder('C')).toBeLessThan(signalClassOrder('D'));
  });

  it('declares normative MVP mapping defaults in one owner module', () => {
    expect(NORMATIVE_TO_PRESENTATION_DEFAULT.safety_regulatory).toEqual({
      bucket: 'safety_regulatory',
      signalClass: 'A',
    });
    expect(NORMATIVE_TO_PRESENTATION_DEFAULT.in_the_news).toEqual({
      bucket: 'transparency',
      signalClass: 'B',
    });
    expect(NORMATIVE_TO_PRESENTATION_DEFAULT.my_choices_chain).toEqual({
      bucket: 'user_preference',
      signalClass: 'C',
    });
    expect(consumerSignalCategoryLabel('A')).toBe('Food Safety');
    expect(consumerSignalCategoryLabel('B')).toBe('In the News');
    expect(consumerSignalCategoryLabel('C')).toBeNull();
  });

  it('creates empty signal buckets with all public keys', () => {
    expect(emptySignalsBuckets()).toEqual({
      safety_regulatory: [],
      transparency: [],
      user_preference: [],
      premium_insight: [],
    });
  });

  it('maps publish records via owner defaults and enforces publishable-only gate', () => {
    const base: DynamicSignalPublicationRecord = {
      signal_id: 'p6s-1',
      dedupe_key: 'k1',
      signal_class: 'in_the_news',
      signal_publication_state: 'publishable',
      resolution_key: { gtin: '9300633072391', market_key: 'AU' },
      state: { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      lineage_reference: 'phase6:pub:signal:p6s-1',
      source_idempotency_key: 's|r|in_the_news',
      staleness: { valid_until: '2030-01-01T00:00:00.000Z' },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
    };
    expect(isPublicationRecordPubliclyRenderable(base)).toBe(true);
    expect(isPublicationRecordPubliclyRenderable({ ...base, signal_publication_state: 'held_for_review' })).toBe(
      false
    );
    const card = mapPublicationRecordToSignalCard(base);
    expect(card.class).toBe('B');
    expect(card.dedupe_key).toBe('k1');
    expect(card.links).toEqual([]);
    const withEvidence: DynamicSignalPublicationRecord = {
      ...base,
      source_record_url: 'https://example.org/evidence/article',
    };
    expect(mapPublicationRecordToSignalCard(withEvidence).links).toEqual([
      { url: 'https://example.org/evidence/article' },
    ]);
  });

  it('sorts publication records deterministically by owner precedence', () => {
    const mk = (
      cls: DynamicSignalPublicationRecord['signal_class'],
      dedupe: string,
      id: string
    ): DynamicSignalPublicationRecord => ({
      signal_id: id,
      dedupe_key: dedupe,
      signal_class: cls,
      signal_publication_state: 'publishable',
      resolution_key: { gtin: '9300633072391', market_key: 'AU' },
      state: { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
      lineage_reference: `phase6:pub:signal:${id}`,
      source_idempotency_key: `s|${dedupe}|${cls}`,
      staleness: { valid_until: '2030-01-01T00:00:00.000Z' },
      editorial: { priority: 0, due_at: null, last_reviewed_at: null },
      mislink: { open_report_count: 0, last_event_at: null },
    });
    const out = sortPublicationRecordsForRender([
      mk('my_choices_chain', 'z', '03'),
      mk('safety_regulatory', 'b', '02'),
      mk('safety_regulatory', 'a', '01'),
    ]);
    expect(out.map((x) => x.signal_id)).toEqual(['01', '02', '03']);
  });
});

