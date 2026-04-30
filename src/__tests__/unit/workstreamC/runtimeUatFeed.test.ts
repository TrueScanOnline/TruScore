import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import { buildWorkstreamCSkeletonRecordsForRuntime } from '../../../workstreamC/skeleton/runtimeUatFeed';

describe('Workstream C runtime UAT feed', () => {
  const prev = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  beforeAll(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prev;
  });

  it('UAT_C_011 NZ renders SIG_NEWS_NZ_001', () => {
    const logs: string[] = [];
    const recs = buildWorkstreamCSkeletonRecordsForRuntime({
      barcode: '9415556123456',
      productName: 'Countdown Greek Style Yoghurt',
      scanMarketPublic: 'NZ',
      logLines: logs,
    });
    expect(recs.some((r) => r.signal_id === 'SIG_NEWS_NZ_001')).toBe(true);
    expect(logs.some((l) => l.includes('chain_resolve'))).toBe(true);
  });

  it('UAT_C_008 Cadbury keeps both global NGO signals', () => {
    const recs = buildWorkstreamCSkeletonRecordsForRuntime({
      barcode: '9300601234567',
      productName: 'Cadbury Dairy Milk 180g',
      scanMarketPublic: 'AU',
    });
    const { result } = buildProductScanResult({
      barcode: '9300601234567',
      product: {
        barcode: '9300601234567',
        product_name: 'Cadbury Dairy Milk 180g',
        brands: 'Cadbury',
        source: 'test',
        trust_score: 42,
        trust_score_breakdown: { body: 10, planet: 10, ethics: 10, open: 12 },
      } as any,
      userPreferences: { palmOil: true, animalWelfare: true, fairTrade: true, organic: true } as any,
      isSubscriber: false,
      market: 'AU',
      dynamicSignalRecords: recs,
      deriveTerminal: false,
      terminal_state: 'success',
      phase6SignalSourceMode: 'governed_5b_only',
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    const ids = flat.map((x) => x.id);
    expect(ids).toContain('SIG_NEWS_GLOBAL_001');
    expect(ids).toContain('SIG_NEWS_GLOBAL_002');
  });

  it('Ritz negative control does not over-fire NGO signals', () => {
    const recs = buildWorkstreamCSkeletonRecordsForRuntime({
      barcode: '9310123456789',
      productName: 'Ritz crackers',
      scanMarketPublic: 'AU',
    });
    expect(recs.filter((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL_'))).toHaveLength(0);
  });
});
