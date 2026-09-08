/**
 * Review 1 Pass 2 corrective regression — NA-001 / NA-003 / NA-004 / NA-015 / NA-016.
 * Deterministic proofs against retired calculated TruScore cache, Core Truth product-cache
 * authority, and non-governed enhancement retirement.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateTrustScore } from '../../../utils/trustScore';
import {
  getCachedTruScore,
  cacheTruScore,
} from '../../../utils/truScoreCache';
import { calculateTruScore } from '../../../lib/truscoreEngine';
import {
  applyGovernedProductTransforms,
  enhanceProduct,
  applyMVPEnhancementsToProduct,
  applyBrandEnrichment,
} from '../../../services/productEnhancementService';
import { applyMVPEnhancements } from '../../../services/enhancements/enhancementLayer';
import { enrichProductWithBCorp } from '../../../services/bCorpApi';
import { enhanceWithLeapingBunny } from '../../../services/enhancements/leapingBunnyEnhancement';
import { enhanceWithEWGSkinDeep } from '../../../services/enhancements/ewgSkinDeepEnhancement';
import { enhancePalmOilWithWWF } from '../../../services/enhancements/wwfPalmOilEnhancement';
import {
  CORE_TRUTH_PRODUCT_CACHE_AUTHORITY,
  hasCoreTruthAuthority,
  stampCoreTruthAuthority,
} from '../../../config/coreTruthProductCacheAuthority';
import { WHOLE_PRODUCE_NUTRITION_BONUS } from '../../../lib/truscoreEngine/pillars/bodyPillar';
import { assignNOVA1IfHighConfidence } from '../../../utils/novaAssessment';
import { ensureNova1ProvenanceOnProduct } from '../../../utils/nova1Provenance';
import { calculateAndSetEcoScore } from '../../../services/productEnhancementService';
import type { Product } from '../../../types/product';

const mockedGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockedSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

function authorisedProduct(overrides: Partial<Product> = {}): Product {
  return stampCoreTruthAuthority({
    barcode: '9000000000001',
    product_name: 'Test Product',
    source: 'openfoodfacts',
    nutriscore_grade: 'c',
    nova_group: 3,
    ingredients_text: 'water, sugar',
    ...overrides,
  });
}

describe('Pass 2 corrective — calculated TruScore cache retirement (NA-001 / NA-015)', () => {
  beforeEach(() => {
    mockedGetItem.mockReset();
    mockedSetItem.mockReset();
  });

  it('getCachedTruScore always returns null even when AsyncStorage has a legacy entry', async () => {
    mockedGetItem.mockResolvedValueOnce(
      JSON.stringify({
        result: {
          truscore: 11,
          breakdown: { Body: 1, Planet: 1, Ethics: 1, Open: 8 },
          scoringUnavailable: false,
        },
        version: '1.4',
        timestamp: Date.now(),
        barcode: '9000000000001',
      })
    );
    await expect(getCachedTruScore('9000000000001')).resolves.toBeNull();
  });

  it('cacheTruScore is a no-op (does not write)', async () => {
    await cacheTruScore('9000000000001', {
      truscore: 50,
      breakdown: { Body: 12, Planet: 12, Ethics: 12, Open: 14 },
    } as any);
    expect(mockedSetItem).not.toHaveBeenCalled();
  });

  it('pre-existing @truescan_truscore_cache_* entry cannot change current calculateTrustScore result', async () => {
    const product = authorisedProduct({
      barcode: '93541121',
      product_name: 'Raspberries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
      nova_group: 1,
      nutriscore_grade: 'unknown',
    });

    mockedGetItem.mockResolvedValue(
      JSON.stringify({
        result: {
          truscore: 40,
          breakdown: { Body: 10, Planet: 10, Ethics: 10, Open: 10 },
          pillarDetails: {
            Body: { baseScore: 15, finalScore: 10, adjustments: [] },
            Planet: { baseScore: 15, finalScore: 10, adjustments: [] },
            Ethics: { baseScore: 15, finalScore: 10, adjustments: [] },
            Open: { baseScore: 15, finalScore: 10, adjustments: [] },
          },
          hasNutriScore: false,
          hasEcoScore: false,
          hasOrigin: false,
        },
        version: '1.4',
        timestamp: Date.now(),
        barcode: '93541121',
      })
    );

    const scored = await calculateTrustScore(product);
    expect(scored.trust_score).not.toBe(40);
    expect(scored.trust_score).toBeGreaterThan(40);
    // Body should include current Whole Produce +7 path → Body 25 in typical raspberry fixture
    expect(scored.trust_score_breakdown?.body).toBe(25);
  });

  it('old cached unavailable cannot suppress a later successful current calculation (NA-015)', async () => {
    const product = authorisedProduct({
      nutriscore_grade: 'b',
      nova_group: 2,
      ingredients_text: 'oats, water',
    });

    mockedGetItem.mockResolvedValue(
      JSON.stringify({
        result: {
          truscore: null,
          breakdown: { Body: null, Planet: null, Ethics: null, Open: null },
          scoringUnavailable: true,
        },
        version: '1.4',
        timestamp: Date.now(),
        barcode: product.barcode,
      })
    );

    const scored = await calculateTrustScore(product);
    expect(scored._truscore_metadata?.scoringUnavailable).not.toBe(true);
    expect(scored.trust_score).not.toBeNull();
    expect(typeof scored.trust_score).toBe('number');
  });

  it('S28 analysis is built from the same current calculation (NA-016)', async () => {
    const product = authorisedProduct({
      barcode: '93541121',
      product_name: 'Raspberries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries'],
      nova_group: 1,
      nutriscore_grade: 'unknown',
      _fetchTrace: [{ database: 'Open Food Facts', queryKeyType: 'barcode', order: 1, hit: true }],
    } as Product);

    const scored = await calculateTrustScore(product);
    expect(scored._truscore_analysis).toBeTruthy();
    expect(scored._truscore_analysis?.totalScore).toBe(scored.trust_score);
    expect(scored._truscore_analysis?.pillars.Body.finalScore).toBe(scored.trust_score_breakdown?.body);
    const generatedAt = scored._truscore_analysis?.generatedAt ?? 0;
    expect(generatedAt).toBeGreaterThan(Date.now() - 60_000);
  });
});

describe('Pass 2 corrective — Whole Produce with retired score cache', () => {
  it('93541121 receives current Whole Produce +7 even if legacy TruScore cache key exists', async () => {
    mockedGetItem.mockResolvedValue(
      JSON.stringify({
        result: {
          truscore: 55,
          breakdown: { Body: 18, Planet: 12, Ethics: 12, Open: 13 },
          pillarDetails: {
            Body: {
              baseScore: 15,
              finalScore: 18,
              adjustments: [{ description: 'pre-bonus epoch', value: 3 }],
            },
            Planet: { baseScore: 15, finalScore: 12, adjustments: [] },
            Ethics: { baseScore: 15, finalScore: 12, adjustments: [] },
            Open: { baseScore: 15, finalScore: 13, adjustments: [] },
          },
        },
        version: '1.4',
        timestamp: Date.now() - 86400000,
        barcode: '93541121',
      })
    );

    const product = authorisedProduct({
      barcode: '93541121',
      product_name: "Driscoll's Raspberries",
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
      nova_group: 1,
      nutriscore_grade: 'unknown',
    });

    const a = await calculateTrustScore(product);
    const b = await calculateTrustScore(product);
    expect(a.trust_score_breakdown?.body).toBe(25);
    expect(b.trust_score_breakdown?.body).toBe(25);
    expect(a.trust_score).toBe(b.trust_score);
    const bodyAdj = a._truscore_analysis?.pillars.Body.adjustments ?? [];
    expect(bodyAdj.some((row) => row.adjustmentId === 'body-v12-whole-produce-rescue')).toBe(true);
    expect(
      bodyAdj.find((row) => row.adjustmentId === 'body-v12-whole-produce-rescue')?.value
    ).toBe(WHOLE_PRODUCE_NUTRITION_BONUS);
  });
});

describe('Pass 2 corrective — product-cache authority (NA-003)', () => {
  it('new Core Truth authority marker is recognised', () => {
    const p = stampCoreTruthAuthority({ barcode: '1', source: 'openfoodfacts' });
    expect(hasCoreTruthAuthority(p)).toBe(true);
    expect(p._rveelCoreTruthAuthority).toBe(CORE_TRUTH_PRODUCT_CACHE_AUTHORITY);
  });

  it('legacy openfoodfacts-labelled row without marker is not scoring-eligible', async () => {
    const legacy: Product = {
      barcode: '9310036044239',
      product_name: 'PAULS MLKY MAX CHOC',
      source: 'openfoodfacts',
      brands: 'PAULS MLKY MAX',
      nutriscore_grade: 'd',
      ingredients_text: 'milk, sugar',
    };
    expect(hasCoreTruthAuthority(legacy)).toBe(false);
    const scored = await calculateTrustScore(legacy);
    expect(scored.trust_score).toBeNull();
    expect(scored.trust_score_breakdown).toBeNull();
  });

  it('web_search / sqlite / unknown sources without authority do not score', async () => {
    for (const source of ['web_search', 'sqlite', 'upcitemdb', 'ean_search'] as const) {
      const scored = await calculateTrustScore({
        barcode: '111',
        product_name: 'Something',
        source,
        image_url: 'https://example.com/x.jpg',
        nutriments: { 'energy-kcal_100g': 100 },
        ingredients_text: 'water',
        quality: 90,
        completion: 90,
      });
      expect(scored.trust_score).toBeNull();
    }
  });

  it('authorised World-OFF style record may score under current methodology', async () => {
    const scored = await calculateTrustScore(
      authorisedProduct({
        nutriscore_grade: 'b',
        nova_group: 2,
        ingredients_text: 'oats',
      })
    );
    expect(scored.trust_score).not.toBeNull();
  });
});

describe('Pass 2 corrective — NA-004 non-governed enrichment retirement', () => {
  it('9310036044239 does not get brands from product-name regex via governed path', async () => {
    const product: Product = {
      barcode: '9310036044239',
      product_name: 'PAULS MLKY MAX CHOC',
      source: 'openfoodfacts',
      ingredients_text: 'milk, sugar, cocoa',
    };
    applyGovernedProductTransforms(product, { stampAuthority: true });
    expect(product.brands).toBeUndefined();
    await enhanceProduct(product);
    expect(product.brands).toBeUndefined();
  });

  it('applyMVPEnhancements / brand enrichment no longer inject labels or brands', async () => {
    const product: Product = {
      barcode: 'x',
      product_name: 'Patagonia Provisions Jerky',
      brands: 'Patagonia Provisions',
      source: 'openfoodfacts',
      ingredients_text: 'beef',
      labels_tags: [],
    };
    await applyMVPEnhancements(product);
    await applyMVPEnhancementsToProduct(product);
    await applyBrandEnrichment(product);
    expect(product.labels_tags).toEqual([]);
    expect(product.brands).toBe('Patagonia Provisions');
  });

  it('retired modules still exist but live enhanceProduct path does not apply their mutations', async () => {
    // Direct module calls may still mutate if invoked explicitly — production path must not call them.
    // Prove the governed orchestration path does not.
    const product: Product = {
      barcode: 'cosmetic1',
      product_name: 'Test Lotion',
      brands: 'SomeBrand',
      source: 'openfoodfacts',
      categories: 'cosmetics',
      categories_tags: ['en:cosmetics'],
      ingredients_text: 'fragrance, parabens, water',
      labels_tags: [],
      ingredients_analysis_tags: [],
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isNonSustainable: true,
        score: -5,
      },
    };
    const beforeLabels = [...(product.labels_tags || [])];
    const beforeAnalysis = [...(product.ingredients_analysis_tags || [])];
    applyGovernedProductTransforms(product, { stampAuthority: true });
    expect(product.labels_tags).toEqual(beforeLabels);
    expect(product.ingredients_analysis_tags?.every((t) => !t.startsWith('en:ewg-'))).toBe(true);
    expect(product.ingredients_analysis_tags).toEqual(beforeAnalysis);
    expect((product as any).ewg_skin_deep).toBeUndefined();
    expect((product as any).b_corp).toBeUndefined();
    expect((product as any).leaping_bunny).toBeUndefined();
  });

  it('documents that direct retired helpers are out of the production call chain (optional smoke)', async () => {
    // If someone re-wires these, NA-004 regressions should fail the orchestration tests above.
    expect(typeof enrichProductWithBCorp).toBe('function');
    expect(typeof enhanceWithLeapingBunny).toBe('function');
    expect(typeof enhanceWithEWGSkinDeep).toBe('function');
    expect(typeof enhancePalmOilWithWWF).toBe('function');
  });
});

describe('Pass 2 corrective — governed helpers preserved pre-score', () => {
  it('NOVA-1 rescue + provenance + Eco normalisation still run via applyGovernedProductTransforms', () => {
    const product: Product = {
      barcode: '93536240',
      product_name: 'Blueberries',
      ingredients_text: 'blueberries',
      categories_tags: ['en:berries', 'en:fruits', 'en:blueberries'],
      source: 'openfoodfacts',
      ecoscore_score: 80,
      additives_tags: [],
    };
    applyGovernedProductTransforms(product, { stampAuthority: true });
    expect(hasCoreTruthAuthority(product)).toBe(true);
    expect(product.nova_group).toBe(1);
    expect(product.nova1Provenance === 'inferred' || product.nova1Provenance === 'off').toBe(true);
    ensureNova1ProvenanceOnProduct(product);
    calculateAndSetEcoScore(product);
    expect(product.ecoscore_grade).toBeTruthy();
    // assignNOVA1IfHighConfidence already applied inside transforms
    const again = assignNOVA1IfHighConfidence({ ...product, nova_group: undefined, nova1Provenance: undefined });
    expect(again.nova_group).toBe(1);
  });

  it('engine calculateTruScore still matches calculateTrustScore pillars for authorised product', async () => {
    const product = authorisedProduct({
      barcode: '93541121',
      product_name: 'Raspberries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries', 'en:berries'],
      nova_group: 1,
      nutriscore_grade: 'unknown',
    });
    const engine = calculateTruScore(product);
    const wrapped = await calculateTrustScore(product);
    expect(wrapped.trust_score).toBe(engine.truscore);
    expect(wrapped.trust_score_breakdown?.body).toBe(engine.breakdown.Body);
  });
});
