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

const record: DynamicSignalPublicationRecord = {
  signal_id: 'SIG_MAP_OWNER',
  dedupe_key: 'p6|test|SIG_MAP_OWNER|9300633072391',
  signal_class: 'in_the_news',
  signal_publication_state: 'publishable',
  resolution_key: { gtin: '9300633072391', market_key: 'AU' },
  state: { confidence_state: 'strong', review_state: 'reviewed', resolution_status: 'resolved' },
  lineage_reference: 'phase6:pub:signal:SIG_MAP_OWNER',
  source_idempotency_key: 'src|SIG_MAP_OWNER',
  staleness: { valid_until: '2030-01-01T00:00:00.000Z' },
  editorial: { priority: 0, due_at: null, last_reviewed_at: null },
  mislink: { open_report_count: 0, last_event_at: null },
};

describe('buildProductScanResult mapping owner integration', () => {
  it('routes signal partition through signalRenderMapping owner module', () => {
    const spy = jest.spyOn(signalRenderMapping, 'mapSignalCardToBucket');

    buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: {
        barcode: '9300633072391',
        source: 'openfoodfacts',
      },
      dynamicSignalRecords: [record],
    });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
