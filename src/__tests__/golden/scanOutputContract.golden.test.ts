/**
 * Phase 5 / 5B golden baselines: deterministic clock + prefs → diffable scan contract.
 * Wave 1 closure: default public mode is governed_5b_only (no synthetic/legacy Signal cards).
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
  it('default / omitted mode is governed-only — legacy product.recalls do not become Signal cards', () => {
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
    expect(result.signals.safety_regulatory).toEqual([]);
    expect(result.signals.transparency.some((s) => s.dedupe_key.includes('limited_data'))).toBe(false);
    expect(stripForGolden(result)).toMatchSnapshot('governed-default-no-legacy-recall');
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
    expect(result.signals.transparency).toEqual([]);
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

  it('governed default — web_search does not add public transparency Signal (coverage flag only)', () => {
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
    expect(result.signals.transparency.find((s) => s.dedupe_key.includes('web_search'))).toBeUndefined();
    expect(result.coverage.flags).toContain('web_search_fallback');
    expect(stripForGolden(result)).toMatchSnapshot('web-search-coverage-flag-only');
  });

  it('transitional mode still emits web_search / limited_data cards (controlled tests only)', () => {
    const product = baseProduct({
      source: 'web_search',
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
      phase6SignalSourceMode: 'transitional',
    });
    expect(result.signals.transparency.some((s) => s.dedupe_key.includes('web_search'))).toBe(true);
    expect(result.signals.transparency.some((s) => s.dedupe_key.includes('limited_data'))).toBe(true);
  });

  it('governed default — low completeness does not add Limited Product Data Signal', () => {
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
    expect(result.signals.transparency.find((s) => s.dedupe_key.includes('limited_data'))).toBeUndefined();
    expect(result.coverage.flags).toContain('low_completeness');
    expect(stripForGolden(result)).toMatchSnapshot('limited-data-coverage-flag-only');
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

  it('governed default — preference hits do not become public Signal cards', () => {
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
    expect(result.signals.user_preference).toEqual([]);
    expect(stripForGolden(result)).toMatchSnapshot('preference-not-public-signal');
  });
});
