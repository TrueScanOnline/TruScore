import { buildProductScanResult } from '../../../services/buildProductScanResult';
import { flattenSignalsOrdered, dedupeSignalCards } from '../../../utils/scanResultPresentation';
import {
  buildWorkstreamCRuntimePublicationRecords,
  isWorkstreamCSignalsRuntimeEnabled,
} from '../../../workstreamC/runtime/workstreamCRuntimePublicationRecords';

/**
 * Runtime path = bundled canonical_brands + brand_aliases + Product identity (preferred).
 * GTIN reviewed rows apply only when `product` is omitted (non-screen harness).
 * Injected-chain scenarios stay in `skeletonPublicationRecords.test.ts`.
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

  it('AU Cadbury chocolate resolves chain via identity_resolution and yields SL008/SL011 NGO globals', () => {
    const logs: string[] = [];
    const bc = '9300601234567';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: bc,
      productName: 'Cadbury Dairy Milk Chocolate Bar',
      product: {
        barcode: bc,
        product_name: 'Cadbury Dairy Milk Chocolate Bar',
        brands: 'Cadbury',
        categories_tags: ['en:chocolates'],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    const ids = new Set(recs.map((r) => r.signal_id));
    expect(ids.has('SIG_NEWS_GLOBAL_001')).toBe(true);
    expect(ids.has('SIG_NEWS_GLOBAL_002')).toBe(true);
    expect(logs.some((l) => l.includes('source=identity_resolution'))).toBe(true);
    expect(logs.some((l) => l.includes('source=gtin_link'))).toBe(false);

    const { result } = buildProductScanResult({
      barcode: bc,
      product: {
        barcode: bc,
        product_name: 'Cadbury Dairy Milk Chocolate Bar',
        brands: 'Cadbury',
        categories_tags: ['en:chocolates'],
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
    });
    const flat = dedupeSignalCards(flattenSignalsOrdered(result.signals));
    const flatIds = flat.map((c) => c.id);
    expect(flatIds).toContain('SIG_NEWS_GLOBAL_001');
    expect(flatIds).toContain('SIG_NEWS_GLOBAL_002');
    const gw = flat.find((c) => c.id === 'SIG_NEWS_GLOBAL_001');
    expect(gw?.links?.[0]?.url).toMatch(/^https:\/\/globalwitness\.org\//);
    const ran = flat.find((c) => c.id === 'SIG_NEWS_GLOBAL_002');
    expect(ran?.links?.[0]?.url).toMatch(/^https:\/\/www\.ran\.org\//);
  });

  it('AU Ritz crackers — identity Mondelez Ritz brand, no SIG_NEWS_GLOBAL (negative control)', () => {
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9310123456789',
      productName: 'Ritz Original Crackers',
      product: {
        barcode: '9310123456789',
        product_name: 'Ritz Original Crackers',
        brands: 'Ritz',
        categories_tags: ['en:biscuits-and-crackers'],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
    });
    expect(recs.some((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL'))).toBe(false);
  });

  it('AU KitKat — Nestlé-only brands + KitKat title yields SIG_NEWS_GLOBAL_001 only (not GLOBAL_002)', () => {
    process.env.EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH = '1';
    const logs: string[] = [];
    const bc = '9300650123456';
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: bc,
      productName: 'KitKat Chunky Milk Chocolate',
      product: {
        barcode: bc,
        product_name: 'KitKat Chunky Milk Chocolate',
        brands: 'Nestlé',
        categories_tags: ['en:chocolates'],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    const ids = recs.map((r) => r.signal_id);
    expect(ids).toContain('SIG_NEWS_GLOBAL_001');
    expect(ids).not.toContain('SIG_NEWS_GLOBAL_002');
    expect(ids.filter((id) => id === 'SIG_NEWS_GLOBAL_001')).toHaveLength(1);
    expect(logs.some((l) => l.includes('brand_id=B0060') && l.includes('parent_id=P0008'))).toBe(true);
  });

  it('AU Nestlé sibling (condensed milk) — no KitKat-scoped SIG_NEWS_GLOBAL_001', () => {
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300605099999',
      productName: 'Nestlé Sweetened Condensed Milk',
      product: {
        barcode: '9300605099999',
        product_name: 'Nestlé Sweetened Condensed Milk',
        brands: 'Nestlé',
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
    });
    expect(recs.some((r) => r.signal_id === 'SIG_NEWS_GLOBAL_001')).toBe(false);
  });

  it('logs Cadbury B0067→B0241 bridge when chocolate wording present (SL008/SL011 subject row)', () => {
    const logs: string[] = [];
    buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300111222333',
      productName: 'Cadbury Dark Chocolate Block',
      product: {
        barcode: '9300111222333',
        brands: 'Cadbury',
        product_name: 'Cadbury Dark Chocolate Block',
        categories_tags: [],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    expect(logs.some((l) => l.includes('cadbury_ngo_subject_bridge: applied'))).toBe(true);
  });

  it('AU ambiguous Cadbury biscuit — bridge not applied, no SIG_NEWS_GLOBAL', () => {
    const logs: string[] = [];
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9300999999999',
      productName: 'Cadbury Biscuits',
      product: {
        barcode: '9300999999999',
        brands: 'Cadbury',
        product_name: 'Cadbury Biscuits',
        categories_tags: ['en:biscuits-and-crackers'],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
      logLines: logs,
    });
    expect(recs.filter((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL'))).toHaveLength(0);
    expect(logs.some((l) => l.includes('cadbury_ngo_subject_bridge: not applied'))).toBe(true);
  });

  it('AU Philadelphia cream cheese — Mondelez brand, no SIG_NEWS_GLOBAL (negative control)', () => {
    const recs = buildWorkstreamCRuntimePublicationRecords({
      barcode: '9410001234567',
      productName: 'Philadelphia Cream Cheese',
      product: {
        barcode: '9410001234567',
        product_name: 'Philadelphia Cream Cheese',
        brands: 'Philadelphia',
        categories_tags: ['en:dairies'],
        source: 'openfoodfacts',
      } as any,
      scanMarketPublic: 'AU',
    });
    expect(recs.filter((r) => r.signal_id.startsWith('SIG_NEWS_GLOBAL'))).toHaveLength(0);
  });

  it('returns empty when runtime gate env is off', () => {
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '0';
    expect(
      buildWorkstreamCRuntimePublicationRecords({
        barcode: '9300601234567',
        productName: 'Cadbury Dairy Milk Chocolate Bar',
        scanMarketPublic: 'AU',
      })
    ).toHaveLength(0);
    process.env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT = '1';
  });
});
