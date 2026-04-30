import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import {
  buildWorkstreamCRuntimePublicationRecords,
  isWorkstreamCSignalsRuntimeEnabled,
} from '../../../workstreamC/runtime/workstreamCRuntimePublicationRecords';

/**
 * Runtime path = reviewed GTIN in bundled `gtin_brand_links` + embedded C-pack only.
 * Injected-chain / artificial barcode scenarios stay in `skeletonPublicationRecords.test.ts`.
 */

describe('Workstream C runtime publication records', () => {
  const prev = process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT;
  beforeAll(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = prev;
  });

  it('gate reads env flag', () => {
    expect(isWorkstreamCSignalsRuntimeEnabled()).toBe(true);
  });

  it('AU Cadbury Dairy Milk reviewed GTIN resolves chain via gtin_link and yields both NGO globals', () => {
    const logs: string[] = [];
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9310051000015',
      productName: 'Cadbury Dairy Milk Chocolate Bar',
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    const ids = new Set(recs.map((r) => r.signal_id));
    expect(ids.has('SIG_NEWS_GLOBAL_001')).toBe(true);
    expect(ids.has('SIG_NEWS_GLOBAL_002')).toBe(true);
    expect(logs.some((l) => l.includes('source=gtin_link'))).toBe(true);

    const { result } = buildProductScanResult({
      barcode: '9310051000015',
      product: {
        barcode: '9310051000015',
        product_name: 'Cadbury Dairy Milk Chocolate Bar',
        brands: 'Cadbury',
        source: 'openfoodfacts',
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
    const flatIds = flat.map((c) => c.id);
    expect(flatIds).toContain('SIG_NEWS_GLOBAL_001');
    expect(flatIds).toContain('SIG_NEWS_GLOBAL_002');
    const gw = flat.find((c) => c.id === 'SIG_NEWS_GLOBAL_001');
    expect(gw?.links?.[0]?.url).toMatch(/^https:\/\/globalwitness\.org\//);
  });

  it('AU Ritz reviewed GTIN stays negative for NGO global signals (brand-scoped links)', () => {
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9310047230518',
      productName: 'Ritz Original Crackers',
      scanMarketPublic: 'AU',
    });
    expect(recs.filter((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL'))).toHaveLength(0);
  });

  it('returns empty when runtime gate env is off', () => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '0';
    expect(
      buildWorkstreamCRuntimePublicationRecords({
        barcode: '9310051000015',
        productName: 'Cadbury Dairy Milk Chocolate Bar',
        scanMarketPublic: 'AU',
      })
    ).toHaveLength(0);
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
  });
});
