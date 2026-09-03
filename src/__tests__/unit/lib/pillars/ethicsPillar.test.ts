/**
 * Ethics Pillar Unit Tests
 *
 * SPEC: Ethics_Scoring_Specification_37_Cursor_Submit.xlsx — Base 15 + BBFAW + KTC + certifications (cap 0–25).
 */

import { calculateEthicsPillar } from '../../../../lib/truscoreEngine/pillars/ethicsPillar';
import {
  ETHICS_V37_ADJUSTMENT_REGISTRY,
  ethicsV37KtcAdjustmentId,
} from '../../../../lib/truscoreEngine/pillars/ethicsPillarV37Registry';
import { getKTCScoreAdjustment } from '../../../../services/ktcService';
import {
  expectPillarLedgerReconciles,
  firedAdjustmentIds,
} from '../../../helpers/pillarLedgerNeutrality';
import { Product } from '../../../../types/product';
import { selectBenchmarkSnapshot } from '../../../../benchmark/snapshotSelect';

describe('Ethics Pillar Calculation (BBFAW + KTC + certifications)', () => {
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

  test('should start at base score 15 when no BBFAW match', () => {
    const result = calculateEthicsPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.bbfawMatchedCompany).toBeNull();
  });

  test('should apply nil return when brand not in BBFAW', () => {
    const product = { ...baseProduct, brands: 'Unknown Small Brand Ltd' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
    expect(result.details.bbfawMatchedCompany).toBeNull();
  });

  test('should use brand_owner over brands for BBFAW lookup', () => {
    const product = { ...baseProduct, brand_owner: 'Marks & Spencer PLC', brands: 'Unknown Brand' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Marks & Spencer PLC');
    expect(result.score).toBe(22);
  });

  test('should resolve alias "M&S" to Marks & Spencer PLC via BBFAW mapping', () => {
    const product = { ...baseProduct, brands: 'M&S' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Marks & Spencer PLC');
    expect(result.details.bbfawTier).toBe(2);
    expect(result.score).toBe(22);
  });

  test('should resolve alias "Batchelors" to Premier Foods PLC via BBFAW mapping', () => {
    const product = { ...baseProduct, brands: 'Batchelors' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Premier Foods PLC');
    expect(result.details.bbfawTier).toBe(2);
  });

  test('should try second brand when first fails (Unknown, Activia)', () => {
    const product = { ...baseProduct, brands: 'Unknown, Activia' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBe('Groupe Danone SA');
    expect(result.details.bbfawTier).toBe(3);
  });

  test('should match Nestlé with accent via parent_entity_exact indexing', () => {
    const product = { ...baseProduct, brand_owner: 'Nestlé SA' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
  });

  test('should require exact match - Unilever does not match Unilever NV', () => {
    const product = { ...baseProduct, brands: 'Unilever' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeNull();
    expect(result.score).toBe(15);
  });

  test('should apply BBFAW Tier 2 + Impact B for Marks & Spencer', () => {
    const product = { ...baseProduct, brands: 'Marks & Spencer PLC' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
    expect(result.details.bbfawTier).toBe(2);
    expect(result.details.bbfawTierScore).toBe(4);
    expect(result.details.bbfawImpactScore).toBe(3);
    expect(result.score).toBe(22);
  });

  test('should apply BBFAW Tier 2 for Greggs', () => {
    const product = { ...baseProduct, brands: 'Greggs PLC' };
    const result = calculateEthicsPillar(product);
    expect(result.base).toBe(15);
    expect(result.details.bbfawTier).toBe(2);
    expect(result.details.bbfawTierScore).toBe(4);
    expect(result.details.bbfawImpactScore).toBe(1);
    expect(result.score).toBe(20);
  });

  test('should apply BBFAW Tier 3 for Groupe Danone', () => {
    const product = { ...baseProduct, brands: 'Groupe Danone SA' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawTier).toBe(3);
    expect(result.details.bbfawTierScore).toBe(2);
    expect(result.score).toBe(18);
  });

  test('should apply BBFAW Tier 6 penalty for Tyson Foods', () => {
    const product = { ...baseProduct, brands: 'Tyson Foods' };
    const result = calculateEthicsPillar(product);
    expect(result.details.bbfawMatchedCompany).toBeTruthy();
    expect(result.details.bbfawTier).toBe(6);
    expect(result.details.bbfawTierScore).toBe(-6);
    expect(result.details.bbfawImpactScore).toBe(-3);
    expect(result.score).toBe(6);
  });

  test('should cap score at 0', () => {
    const product = { ...baseProduct, brands: 'JBS SA' };
    const result = calculateEthicsPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  test('should cap score at 25', () => {
    const product = { ...baseProduct, brands: 'Marks & Spencer PLC' };
    const result = calculateEthicsPillar(product);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  test('should add certifications (max scheme) when BBFAW does not apply', () => {
    const product = {
      ...baseProduct,
      brands: 'Totally Unknown Indie Brand',
      labels_tags: ['en:fair-trade'],
    };
    const result = calculateEthicsPillar(product);
    expect(result.details.certificationsAdjustment).toBe(6);
    expect(result.details.certificationsWinningScheme).toBe('fairtrade');
    expect(result.score).toBe(21);
  });

  describe('Wave 3 stable adjustment IDs (v37)', () => {
    function idOf(result: ReturnType<typeof calculateEthicsPillar>, id: string) {
      return result.adjustments.find((adj) => adj.id === id);
    }

    test('base row fires as ethics-v37-base and is never highlight-eligible', () => {
      const result = calculateEthicsPillar(baseProduct);
      expect(idOf(result, 'ethics-v37-base')?.value).toBe(0);
      expect(idOf(result, 'ethics-v37-base')?.highlightEligible).toBe(false);
    });

    test('BBFAW Tier and Impact stay separate fired rows with same-cycle metadata', () => {
      const result = calculateEthicsPillar({ ...baseProduct, brands: 'Marks & Spencer PLC' });
      const tier = idOf(result, 'ethics-v37-bbfaw-tier-2');
      const impact = idOf(result, 'ethics-v37-bbfaw-impact-ab');
      expect(tier?.value).toBe(4);
      expect(impact?.value).toBe(3);
      expect(tier?.highlightEligible).toBe(true);
      expect(impact?.highlightEligible).toBe(true);
      expect(tier?.metadata?.benchmarkCompany).toBe('Marks & Spencer PLC');
      expect(tier?.metadata?.tier).toBe(2);
      expect(impact?.metadata?.impactRating).toBe('B');
      expectPillarLedgerReconciles(result);
    });

    test('negative BBFAW tier and impact fire their locked IDs', () => {
      const result = calculateEthicsPillar({ ...baseProduct, brands: 'Tyson Foods' });
      expect(idOf(result, 'ethics-v37-bbfaw-tier-6')?.value).toBe(-6);
      expect(idOf(result, 'ethics-v37-bbfaw-impact-ef')?.value).toBe(-3);
      expectPillarLedgerReconciles(result);
    });

    test('KTC band ID matches the governed score band and carries year/company/score metadata', () => {
      const result = calculateEthicsPillar({ ...baseProduct, brands: 'JBS S.A.' });
      const row = idOf(result, 'ethics-v37-ktc-0-10');
      expect(row?.value).toBe(-10);
      expect(row?.highlightEligible).toBe(true);
      expect(row?.metadata?.benchmarkCompany).toBe('JBS S.A.');
      expect(row?.metadata?.benchmarkScore).toBe(3);
      expect(row?.metadata?.benchmarkYear).toBe(selectBenchmarkSnapshot('KTC').benchmark_cycle);
      expectPillarLedgerReconciles(result);
    });

    test('KTC band IDs and v37 point weights agree across every band boundary', () => {
      const boundaries = [0, 10, 11, 20, 21, 30, 31, 50, 51, 70, 71, 80, 81, 90, 91, 100];
      for (const score of boundaries) {
        const id = ethicsV37KtcAdjustmentId(score);
        expect(id).toBeTruthy();
        expect(ETHICS_V37_ADJUSTMENT_REGISTRY[id!].points).toBe(getKTCScoreAdjustment(score));
      }
    });

    test('winning certification fires its locked ID with packet-evidence metadata', () => {
      const result = calculateEthicsPillar({
        ...baseProduct,
        brands: 'Totally Unknown Indie Brand',
        labels_tags: ['en:fair-trade'],
      });
      const row = idOf(result, 'ethics-v37-cert-fairtrade');
      expect(row?.value).toBe(6);
      expect(row?.metadata?.certificationScheme).toBe('fairtrade');
      expect(row?.metadata?.packetEvidence).toBe(true);
      expectPillarLedgerReconciles(result);
    });

    test('organic carries evidence class without changing the +2 effect', () => {
      const certified = calculateEthicsPillar({
        ...baseProduct,
        labels_tags: ['en:organic'],
      });
      const row = idOf(certified, 'ethics-v37-cert-organic');
      expect(row?.value).toBe(2);
      expect(row?.metadata?.organicEvidenceClass).toBe('certified');
    });

    test('cap normaliser fires only when the cap changes the score', () => {
      const capped = calculateEthicsPillar({
        ...baseProduct,
        brands: 'Marks & Spencer PLC',
        labels_tags: ['en:fair-trade'],
      });
      expect(capped.score).toBe(25);
      expect(idOf(capped, 'ethics-v37-final-cap')?.value).toBe(-3);
      expect(idOf(capped, 'ethics-v37-final-cap')?.highlightEligible).toBe(false);
      expectPillarLedgerReconciles(capped);

      const uncapped = calculateEthicsPillar({ ...baseProduct, brands: 'Marks & Spencer PLC' });
      expect(firedAdjustmentIds(uncapped)).not.toContain('ethics-v37-final-cap');
    });

    test('floor normaliser fires only when the floor changes the score', () => {
      const floored = calculateEthicsPillar({ ...baseProduct, brands: 'Tyson Foods Inc.' });
      expect(floored.score).toBe(0);
      expect(idOf(floored, 'ethics-v37-final-floor')?.value).toBe(2);
      expect(idOf(floored, 'ethics-v37-final-floor')?.highlightEligible).toBe(false);
      expectPillarLedgerReconciles(floored);

      const unfloored = calculateEthicsPillar({ ...baseProduct, brands: 'Tyson Foods' });
      expect(firedAdjustmentIds(unfloored)).not.toContain('ethics-v37-final-floor');
    });

    test('no RSPO or superseded certification ID exists in the registry', () => {
      const ids = Object.keys(ETHICS_V37_ADJUSTMENT_REGISTRY);
      expect(ids.some((id) => id.includes('rspo'))).toBe(false);
    });

    test('highlight-eligible registry entries carry locked L1/L2 commentary', () => {
      for (const meta of Object.values(ETHICS_V37_ADJUSTMENT_REGISTRY)) {
        if (meta.highlightEligible) {
          expect(meta.highlightTitle).toBeTruthy();
          expect(meta.highlightExplainer).toBeTruthy();
        }
      }
    });
  });
});
