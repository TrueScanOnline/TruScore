/**
 * Phase 5 / 5B golden baselines: deterministic clock + mocked recall / prefs → diffable scan contract.
 */
import type { ProductWithTrustScore } from '../../types/product';
import type { AlertsPreferences } from '../../store/useAlertsStore';
import { buildProductScanResult } from '../../services/buildProductScanResult';

const FROZEN_NOW_MS = new Date('2026-06-15T12:00:00Z').getTime();

const defaultPrefs: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

function stripForGolden(result: ReturnType<typeof buildProductScanResult>['result']) {
  const { product: _p, ...rest } = result;
  return {
    ...rest,
    product_stub: { barcode: result.product?.barcode, source: result.product?.source },
  };
}

function baseProduct(over: Partial<ProductWithTrustScore>): ProductWithTrustScore {
  return {
    barcode: '9300601249114',
    product_name: 'Golden Test Product',
    brands: 'TestBrand',
    source: 'openfoodfacts',
    trust_score: 72,
    trust_score_breakdown: {
      body: 18,
      planet: 18,
      ethics: 18,
      open: 18,
      reasons: [],
    },
    confidence: 0.85,
    ...over,
  } as ProductWithTrustScore;
}

describe('scan output contract (golden)', () => {
  it('matches frozen baseline — active recall → class A safety signal', () => {
    const product = baseProduct({
      recalls: [
        {
          recallId: 'FDA-TEST-1',
          productName: 'Golden Test Product',
          reason: 'Test contamination',
          recallDate: '2026-05-01',
          isActive: true,
          url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
          classification: 'Class I',
        },
      ],
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    expect(result.signals.safety_regulatory.length).toBeGreaterThanOrEqual(1);
    expect(result.signals.safety_regulatory[0].class).toBe('A');
    expect(stripForGolden(result)).toMatchSnapshot('recall-class-a');
  });

  it('matches frozen baseline — no recall, high completeness', () => {
    const product = baseProduct({
      recalls: [],
      nutriments: { energy: 100, fat: 1, carbohydrates: 10, proteins: 2, salt: 0.1 },
      ingredients_text: 'water, sugar, salt, natural flavor',
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    expect(result.signals.safety_regulatory).toEqual([]);
    expect(stripForGolden(result)).toMatchSnapshot('no-recall-clean-au');
  });

  it('matches frozen baseline — NZ market metadata', () => {
    const product = baseProduct({
      recalls: [],
      barcode: '9421901881054',
      nutriments: { energy: 50, fat: 2, carbohydrates: 5, proteins: 1, salt: 0.05 },
      ingredients_text: 'milk, cocoa, sugar',
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'NZ',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    expect(result.market).toBe('NZ');
    expect(stripForGolden(result)).toMatchSnapshot('nz-core-clean');
  });

  it('matches frozen baseline — web_search source adds transparency B', () => {
    const product = baseProduct({
      source: 'web_search',
      recalls: [],
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    const web = result.signals.transparency.find((s) => s.dedupe_key.includes('web_search'));
    expect(web?.class).toBe('B');
    expect(stripForGolden(result)).toMatchSnapshot('web-search-transparency');
  });

  it('matches frozen baseline — limited data transparency when completeness low', () => {
    const product = baseProduct({
      recalls: [],
      nutriments: {},
      ingredients_text: '',
      brands: '',
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    const lim = result.signals.transparency.find((s) => s.dedupe_key.includes('limited_data'));
    expect(lim?.class).toBe('B');
    expect(stripForGolden(result)).toMatchSnapshot('limited-data-transparency');
  });

  it('matches frozen baseline — partial terminal adds analysis_incomplete flag', () => {
    const product = baseProduct({ recalls: [] });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: defaultPrefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'partial',
      nowMs: FROZEN_NOW_MS,
    });
    expect(result.terminal_state).toBe('partial');
    expect(result.coverage.flags).toContain('analysis_incomplete');
    expect(stripForGolden(result)).toMatchSnapshot('partial-terminal');
  });

  it('matches frozen baseline — preference hit class C (animal testing)', () => {
    const prefs: AlertsPreferences = {
      ...defaultPrefs,
      ethicalEnabled: true,
      avoidAnimalTesting: true,
    };
    const product = baseProduct({
      recalls: [],
      brands: 'Unilever',
      nutriments: { energy: 10, fat: 0.5, carbohydrates: 2, proteins: 0.5, salt: 0.01 },
      ingredients_text: 'water, sugar, palm oil',
    });
    const { result } = buildProductScanResult({
      barcode: product.barcode,
      product,
      userPreferences: prefs,
      isSubscriber: false,
      market: 'AU',
      terminal_state: 'success',
      nowMs: FROZEN_NOW_MS,
    });
    expect(result.signals.user_preference.some((s) => s.class === 'C')).toBe(true);
    expect(stripForGolden(result)).toMatchSnapshot('preference-animal-testing');
  });
});
