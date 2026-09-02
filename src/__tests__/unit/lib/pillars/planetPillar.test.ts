/**
 * Planet Pillar — Planet_Scoring_Specification_v19 + Annex v2
 */

import { calculatePlanetPillar } from '../../../../lib/truscoreEngine/pillars/planetPillar';
import { PLANET_V19_ADJUSTMENT_REGISTRY } from '../../../../lib/truscoreEngine/pillars/planetPillarV19Registry';
import {
  expectPillarLedgerReconciles,
  firedAdjustmentIds,
} from '../../../helpers/pillarLedgerNeutrality';
import { Product } from '../../../../types/product';

describe('Planet Pillar (v19)', () => {
  const baseProduct: Product = {
    barcode: '1234567890123',
    product_name: 'Test Product',
    brands: '',
    categories: '',
    categories_tags: [],
    labels_tags: [],
    ingredients_text: '',
    ingredients_analysis_tags: [],
    additives_tags: [],
    nutriments: {},
    source: 'test',
  };

  test('base 15 when no Eco-Score and no packaging evidence', () => {
    const result = calculatePlanetPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.hasEcoScoreGrade).toBe(false);
    expect(result.details.palmOilPlanetAdjustment).toBe(0);
  });

  test('Eco-Score A => +7 (22)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'a' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(22);
    expect(result.details.hasEcoScoreGrade).toBe(true);
    expect(result.details.ecoscoreAdjustment).toBe(7);
    expect(result.details.packagingFallbackPoints).toBeUndefined();
  });

  test('Eco-Score C => −1 (14)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'c' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(14);
    expect(result.details.ecoscoreAdjustment).toBe(-1);
  });

  test('Eco-Score E => −7 (8)', () => {
    const product = { ...baseProduct, ecoscore_grade: 'e' };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(8);
  });

  test('unknown Eco-Score string triggers packaging fallback path (not eco adjustment)', () => {
    const product: Product = {
      ...baseProduct,
      ecoscore_grade: 'unknown',
      true_scan_market: 'AU',
      packagings_complete: true,
      packagings: [{ recycling: 'Recycle' }, { recycling: 'en:recycle' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.details.hasEcoScoreGrade).toBe(false);
    expect(result.score).toBe(17);
    expect(result.details.packagingFallbackPoints).toBe(2);
  });

  test('palm tags do not change score when Eco-Score missing', () => {
    const product: Product = {
      ...baseProduct,
      ingredients_analysis_tags: ['en:palm-oil'],
      palm_oil_analysis: {
        containsPalmOil: true,
        isPalmOilFree: false,
        isNonSustainable: true,
        isCertifiedSustainable: false,
        score: -8,
      },
      true_scan_market: 'AU',
      packagings: [{ material: 'en:plastic', recycling: 'Check locally' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.score).toBe(15);
  });

  test('product packaging_text_in_languages does not grant +2 across multiple empty-recycling rows', () => {
    const product: Product = {
      ...baseProduct,
      ecoscore_grade: 'unknown',
      true_scan_market: 'AU',
      packagings_complete: true,
      packaging_text_in_languages: { en: 'Widely recycled at kerbside' },
      packagings: [{ recycling: '' }, { recycling: '' }],
    };
    const result = calculatePlanetPillar(product);
    expect(result.details.packagingFallbackPoints ?? 0).toBe(0);
    expect(result.score).toBe(15);
  });

  describe('Wave 3 stable adjustment IDs (v19)', () => {
    function idOf(result: ReturnType<typeof calculatePlanetPillar>, id: string) {
      return result.adjustments.find((adj) => adj.id === id);
    }

    test('base row fires as planet-v19-base and is never highlight-eligible', () => {
      const result = calculatePlanetPillar(baseProduct);
      const row = idOf(result, 'planet-v19-base');
      expect(row?.value).toBe(0);
      expect(row?.highlightEligible).toBe(false);
    });

    test('environmental grades map to locked highlight-eligible IDs', () => {
      const cases: Array<[string, string, number]> = [
        ['a', 'planet-v19-environmental-a', 7],
        ['b', 'planet-v19-environmental-b', 3],
        ['c', 'planet-v19-environmental-c', -1],
        ['d', 'planet-v19-environmental-d', -3],
        ['e', 'planet-v19-environmental-e', -7],
      ];
      for (const [grade, id, value] of cases) {
        const result = calculatePlanetPillar({ ...baseProduct, ecoscore_grade: grade });
        const row = idOf(result, id);
        expect(row?.value).toBe(value);
        expect(row?.highlightEligible).toBe(true);
        expect(row?.metadata?.environmentalGrade).toBe(grade.toUpperCase());
        expect(firedAdjustmentIds(result)).not.toContain('planet-v19-packaging-no-evidence');
        expectPillarLedgerReconciles(result);
      }
    });

    test('no usable grade opens the packaging fallback gate with its own diagnostic ID', () => {
      const result = calculatePlanetPillar(baseProduct);
      expect(idOf(result, 'planet-v19-environmental-no-usable-grade')?.highlightEligible).toBe(false);
      expect(idOf(result, 'planet-v19-packaging-no-evidence')?.highlightEligible).toBe(false);
    });

    test('packaging fallback +2 fires all-kerbside with jurisdiction as metadata, not in the ID', () => {
      const result = calculatePlanetPillar({
        ...baseProduct,
        ecoscore_grade: 'unknown',
        true_scan_market: 'AU',
        packagings_complete: true,
        packagings: [{ recycling: 'Recycle' }, { recycling: 'en:recycle' }],
      });
      const row = idOf(result, 'planet-v19-packaging-all-kerbside');
      expect(row?.value).toBe(2);
      expect(row?.highlightEligible).toBe(true);
      expect(row?.metadata?.jurisdiction).toBe('AU');
      expect(row?.id).not.toContain('au');
      expectPillarLedgerReconciles(result);
    });

    test('packaging evidence present but non-scoring fires the neutral-evidence ID', () => {
      const result = calculatePlanetPillar({
        ...baseProduct,
        true_scan_market: 'AU',
        packagings: [{ material: 'en:plastic', recycling: 'Check locally' }],
      });
      expect(idOf(result, 'planet-v19-packaging-neutral-evidence')?.highlightEligible).toBe(false);
      expect(result.score).toBe(15);
      expectPillarLedgerReconciles(result);
    });

    test('highlight-eligible registry entries carry locked L1/L2 commentary', () => {
      for (const meta of Object.values(PLANET_V19_ADJUSTMENT_REGISTRY)) {
        if (meta.highlightEligible) {
          expect(meta.highlightTitle).toBeTruthy();
          expect(meta.highlightExplainer).toBeTruthy();
        }
      }
    });
  });
});
