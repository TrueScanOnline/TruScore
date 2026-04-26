import { buildProductScanResult } from '../../../services/buildProductScanResult';
import type { DynamicSignalPublicationRecord } from '../../../dynamicSignals/publish/types';
import type { AlertsPreferences } from '../../../store/useAlertsStore';
import * as signalRenderMapping from '../../../signals/signalRenderMapping';

const prefs: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

function pub(
  input: Partial<DynamicSignalPublicationRecord> & Pick<DynamicSignalPublicationRecord, 'signal_id' | 'dedupe_key'>
): DynamicSignalPublicationRecord {
  return {
    signal_id: input.signal_id,
    dedupe_key: input.dedupe_key,
    signal_class: input.signal_class ?? 'in_the_news',
    signal_publication_state: input.signal_publication_state ?? 'publishable',
    resolution_key: input.resolution_key ?? { gtin: '9300633072391', market_key: 'AU' },
    state:
      input.state ?? { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
    lineage_reference: input.lineage_reference ?? `phase6:pub:signal:${input.signal_id}`,
    source_idempotency_key: input.source_idempotency_key ?? `src|${input.signal_id}`,
    staleness: input.staleness ?? { valid_until: '2030-01-01T00:00:00.000Z' },
    editorial: input.editorial ?? { priority: 0, due_at: null, last_reviewed_at: null },
    mislink: input.mislink ?? { open_report_count: 0, last_event_at: null },
  };
}

describe('buildProductScanResult Slice 6 dynamic publication integration', () => {
  it('candidate_ingestion_alone_cannot_produce_publishable_signal', () => {
    const out = buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: { barcode: '9300633072391', source: 'openfoodfacts' },
      dynamicSignalRecords: [
        pub({ signal_id: 'held', dedupe_key: 'h', signal_publication_state: 'held_for_review' }),
      ],
    }).result;
    expect(out.signals.transparency.find((s) => s.id === 'held')).toBeUndefined();
  });

  it('builder does not reinterpret 5B semantics (non-publishable records are excluded)', () => {
    const out = buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: { barcode: '9300633072391', source: 'openfoodfacts' },
      dynamicSignalRecords: [
        pub({ signal_id: 'supp', dedupe_key: 's', signal_class: 'safety_regulatory', signal_publication_state: 'suppressed' }),
        pub({ signal_id: 'exp', dedupe_key: 'e', signal_class: 'in_the_news', signal_publication_state: 'expired' }),
      ],
    }).result;
    const all = [
      ...out.signals.safety_regulatory,
      ...out.signals.transparency,
      ...out.signals.user_preference,
      ...out.signals.premium_insight,
    ];
    expect(all.find((s) => s.id === 'supp')).toBeUndefined();
    expect(all.find((s) => s.id === 'exp')).toBeUndefined();
  });

  it('maps/order via signalRenderMapping owner only and outputs deterministic order', () => {
    const sortSpy = jest.spyOn(signalRenderMapping, 'sortPublicationRecordsForRender');
    const mapSpy = jest.spyOn(signalRenderMapping, 'mapPublicationRecordToSignalCard');
    const out = buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: { barcode: '9300633072391', source: 'openfoodfacts' },
      dynamicSignalRecords: [
        pub({ signal_id: 'c1', dedupe_key: 'z', signal_class: 'my_choices_chain' }),
        pub({ signal_id: 'a2', dedupe_key: 'b', signal_class: 'safety_regulatory' }),
        pub({ signal_id: 'a1', dedupe_key: 'a', signal_class: 'safety_regulatory' }),
      ],
    }).result;

    expect(sortSpy).toHaveBeenCalled();
    expect(mapSpy).toHaveBeenCalled();
    const ids = [...out.signals.safety_regulatory, ...out.signals.user_preference].map((x) => x.id);
    expect(ids).toEqual(['a1', 'a2', 'c1']);
  });

  it('does not leak AU+NZ into ProductScanResult.market', () => {
    const out = buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: { barcode: '9300633072391', source: 'openfoodfacts' },
      dynamicSignalRecords: [pub({ signal_id: 'a1', dedupe_key: 'a' })],
    }).result;
    expect(['AU', 'NZ', 'UNKNOWN']).toContain(out.market);
  });
});

