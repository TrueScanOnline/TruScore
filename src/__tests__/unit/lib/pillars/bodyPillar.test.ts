/**
 * Body Pillar Unit Tests
 *
 * Body_Scoring_Specification_V12 (Final): Nutri-Score A=22/B=18/C=14/D=12/E=8;
 * NOVA 1=+3, 2=+1, 3=−1, 4=−6; MVP additives (−1/−3/−6 per tier, element cap −8); red additive ceiling 12; floor 2.
 */

import {
  calculateBodyPillar,
  WHOLE_PRODUCE_NUTRITION_BONUS,
} from '../../../../lib/truscoreEngine/pillars/bodyPillar';
import {
  BODY_V12_ADJUSTMENT_REGISTRY,
  bodyV12AdditiveAdjustmentId,
} from '../../../../lib/truscoreEngine/pillars/bodyPillarV12Registry';
import { assignNOVA1IfHighConfidence } from '../../../../utils/novaAssessment';
import { markNova1ProvenanceInferred, markNova1ProvenanceOff } from '../../../../utils/nova1Provenance';
import { ADDITIVE_DATABASE } from '../../../../services/additiveDatabase';
import {
  expectPillarLedgerReconciles,
  firedAdjustmentIds,
} from '../../../helpers/pillarLedgerNeutrality';
import { Product } from '../../../../types/product';

describe('Body Pillar Calculation', () => {
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
    source: 'openfoodfacts',
  };

  test('should start at base score 15 when no data', () => {
    const result = calculateBodyPillar(baseProduct);
    expect(result.base).toBe(15);
    expect(result.score).toBe(15);
  });

  test('should apply Nutri-Score A adjustment (+7 from base 15 → 22)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'a' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(22);
    expect(result.details.nutriscoreValue).toBe(22);
  });

  test('should apply Nutri-Score C adjustment (−1 from base 15 → 14)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'c' };
    const result = calculateBodyPillar(product);
    expect(result.score).toBe(14);
    expect(result.details.nutriscoreValue).toBe(14);
  });

  test('should apply Nutri-Score D adjustment (−3 from base 15 → 12)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'd' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(12);
    expect(result.details.nutriscoreValue).toBe(12);
  });

  test('should apply Nutri-Score E adjustment (−7 from base 15 → 8)', () => {
    const product = { ...baseProduct, nutriscore_grade: 'e' };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(8);
    expect(result.details.nutriscoreValue).toBe(8);
  });

  test('should apply NOVA Group 4 (−6)', () => {
    const product = { ...baseProduct, nova_group: 4 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(9);
  });

  test('should apply NOVA Group 1 bonus (+3)', () => {
    const product = { ...baseProduct, nova_group: 1 };
    const result = calculateBodyPillar(product);
    expect(result.base).toBe(15);
    expect(result.score).toBe(18);
  });

  test('should apply MVP additive penalties from registry (e102 orange = −3)', () => {
    const product = { ...baseProduct, additives_tags: ['en:e102'] };
    const result = calculateBodyPillar(product);
    expect(result.details.additiveElementDeduction).toBe(3);
    expect(result.score).toBe(12);
  });

  test('applies MVP additives for OFF beverages (still category food)', () => {
    const product = {
      ...baseProduct,
      categories_tags: ['en:beverages', 'en:sodas'],
      additives_tags: ['en:e102'],
    };
    const result = calculateBodyPillar(product);
    expect(result.details.foodAdditivesApplied).toBe(true);
    expect(result.details.additiveElementDeduction).toBe(3);
  });

  test('normalizes en:250 additive tag to e250 for MVP scoring', () => {
    const product = { ...baseProduct, additives_tags: ['en:250'] };
    const result = calculateBodyPillar(product);
    expect(result.details.hasRedBodyAdditive).toBe(true);
    expect(result.details.additiveElementDeduction).toBe(6);
  });

  test('should apply red additive ceiling (max 12/25)', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'a',
      nova_group: 1,
      additives_tags: ['en:e250'],
    };
    const result = calculateBodyPillar(product);
    expect(result.details.hasRedBodyAdditive).toBe(true);
    expect(result.details.redAdditiveCeilingApplied).toBe(true);
    expect(result.score).toBe(12);
  });

  test('should respect floor 2', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'e',
      nova_group: 4,
      additives_tags: ['en:e102', 'en:e110', 'en:e129', 'en:e171'],
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  test('should cap score at 25', () => {
    const product = {
      ...baseProduct,
      nutriscore_grade: 'a',
      nova_group: 1,
    };
    const result = calculateBodyPillar(product);
    expect(result.score).toBe(25);
  });

  describe('Whole Produce +7 (production)', () => {
    test(`Whole Produce nutrition bonus constant is +${WHOLE_PRODUCE_NUTRITION_BONUS}`, () => {
      expect(WHOLE_PRODUCE_NUTRITION_BONUS).toBe(7);
    });

    test("93541121 Driscoll's Raspberries → 25/25 (no valid OFF Nutri + NOVA 1)", () => {
      const product: Product = {
        ...baseProduct,
        barcode: '93541121',
        product_name: 'Raspberries',
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
        nova_group: 1,
        nutriscore_grade: 'unknown',
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('qualifying Whole Produce + rescued NOVA 1 → 25/25', () => {
      const product: Product = {
        ...baseProduct,
        barcode: '93536240',
        product_name: 'Blueberries',
        ingredients_text: 'blueberries',
        categories_tags: ['en:berries', 'en:fruits', 'en:blueberries'],
        additives_tags: [],
      };
      const rescued = assignNOVA1IfHighConfidence(product);
      expect(rescued.nova_group).toBe(1);
      const result = calculateBodyPillar(rescued);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('valid OFF Nutri-Score A + NOVA 1 → 25/25 (Whole Produce does not stack)', () => {
      const product: Product = {
        ...baseProduct,
        barcode: '93541121',
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries'],
        nova_group: 1,
        nutriscore_grade: 'a',
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('valid OFF Nutri-Score B + NOVA 1 → 21/25 (Whole Produce +7 does not stack, non-cap-masked)', () => {
      const product: Product = {
        ...baseProduct,
        barcode: '93541121',
        product_name: 'Raspberries',
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
        nova_group: 1,
        nutriscore_grade: 'b',
      };
      const result = calculateBodyPillar(product);
      // 15 base + 3 Nutri B + 3 NOVA1 = 21; accidental +7 stack would reach 28 (capped at 25)
      expect(result.score).toBe(21);
      expect(result.details.nutriscoreValue).toBe(18);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('valid OFF Nutri-Score A without NOVA on Whole-Produce-eligible product → Nutri precedence, no +7', () => {
      const product: Product = {
        ...baseProduct,
        barcode: '93541121',
        product_name: 'Raspberries',
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
        nutriscore_grade: 'a',
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(22);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    describe('H1–H3 hardening regressions', () => {
      test('strawberry jam + generic fruit category + NOVA1 → no Whole Produce +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'strawberry jam',
          categories_tags: ['en:fruits'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('apple juice → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'apple juice',
          categories_tags: ['en:apple-juices', 'en:juices'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
      });

      test('dried blueberries with rescued NOVA1 → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'dried blueberries',
          categories_tags: ['en:berries', 'en:fruits'],
          additives_tags: [],
        };
        const rescued = assignNOVA1IfHighConfidence(product);
        expect(rescued.nova_group).toBe(1);
        const result = calculateBodyPillar(rescued);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('roasted carrots → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'roasted carrots',
          categories_tags: ['en:vegetables'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('seasoned potato → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'seasoned potato',
          categories_tags: ['en:fresh-potatoes', 'en:vegetables'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('additive-bearing generic produce + NOVA1 → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'spinach',
          categories_tags: ['en:vegetables'],
          nova_group: 1,
          additives_tags: ['en:e300'],
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('apples & pears → no +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'apples & pears',
          categories_tags: ['en:fresh-fruits'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
        expect(result.score).toBe(18);
      });

      test('blanched single-ingredient produce remains eligible for +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'blanched spinach',
          categories_tags: ['en:vegetables'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
        expect(result.score).toBe(25);
      });

      test('frozen produce remains eligible for +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'frozen peas',
          categories_tags: ['en:legumes', 'en:pulses'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
        expect(result.score).toBe(25);
      });

      test('peeled produce remains eligible for +7', () => {
        const product: Product = {
          ...baseProduct,
          ingredients_text: 'peeled potato',
          categories_tags: ['en:fresh-potatoes', 'en:vegetables'],
          nova_group: 1,
        };
        const result = calculateBodyPillar(product);
        expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
        expect(result.score).toBe(25);
      });
    });

    test('eligible apple → +7 with NOVA 1', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'apple',
        categories_tags: ['en:fresh-apples', 'en:fruits'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('eligible onion → +7 with NOVA 1', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'onion',
        categories_tags: ['en:vegetables', 'en:onions'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('eligible potato → +7 with NOVA 1', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'potato',
        categories_tags: ['en:fresh-potatoes', 'en:vegetables'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('eligible avocado → +7 with NOVA 1', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'avocado',
        categories_tags: ['en:fruits', 'en:avocados'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('eligible fresh/frozen legume/pulse → +7 with NOVA 1', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'lentils',
        categories_tags: ['en:legumes', 'en:pulses'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.score).toBe(25);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(true);
    });

    test('coconut exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'coconut',
        categories_tags: ['en:fresh-fruits', 'en:coconut'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
      expect(result.score).toBe(18);
    });

    test('juice exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'apple juice',
        categories_tags: ['en:apple-juices', 'en:juices'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('dried-fruit exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'raisins',
        categories_tags: ['en:dried-fruits', 'en:fruits'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('nuts/seeds exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'almonds',
        categories_tags: ['en:nuts', 'en:seeds'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('multi-ingredient exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'apple, banana',
        categories_tags: ['en:fresh-fruits'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('NOVA other than 1 exclusion', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries'],
        nova_group: 4,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });

    test('ambiguous/missing category evidence → fail closed', () => {
      const product: Product = {
        ...baseProduct,
        ingredients_text: 'raspberries',
        categories_tags: ['en:snacks'],
        nova_group: 1,
      };
      const result = calculateBodyPillar(product);
      expect(result.details.wholeProduceAdjustmentApplied).toBe(false);
    });
  });

  describe('Wave 3 stable adjustment IDs (v12)', () => {
    function idOf(result: ReturnType<typeof calculateBodyPillar>, id: string) {
      return result.adjustments.find((adj) => adj.id === id);
    }

    test('base 15 is carried on pillar.base and never fires as a ledger row', () => {
      const result = calculateBodyPillar(baseProduct);
      expect(result.base).toBe(15);
      expect(firedAdjustmentIds(result)).not.toContain('body-v12-base');
    });

    test('Nutri-Score grades map to locked highlight-eligible IDs', () => {
      const cases: Array<[string, string, number]> = [
        ['a', 'body-v12-nutri-a', 7],
        ['b', 'body-v12-nutri-b', 3],
        ['c', 'body-v12-nutri-c', -1],
        ['d', 'body-v12-nutri-d', -3],
        ['e', 'body-v12-nutri-e', -7],
      ];
      for (const [grade, id, value] of cases) {
        const result = calculateBodyPillar({ ...baseProduct, nutriscore_grade: grade });
        const row = idOf(result, id);
        expect(row).toBeDefined();
        expect(row!.value).toBe(value);
        expect(row!.highlightEligible).toBe(true);
        expect(row!.metadata?.nutriscoreGrade).toBe(grade.toUpperCase());
      }
    });

    test('missing vs unrecognised Nutri-Score fire distinct highlight-ineligible diagnostics', () => {
      const missing = calculateBodyPillar(baseProduct);
      expect(idOf(missing, 'body-v12-nutri-unavailable')?.highlightEligible).toBe(false);

      const unrecognised = calculateBodyPillar({ ...baseProduct, nutriscore_grade: 'unknown' });
      expect(idOf(unrecognised, 'body-v12-nutri-unrecognised')?.highlightEligible).toBe(false);
      expect(firedAdjustmentIds(unrecognised)).not.toContain('body-v12-nutri-unavailable');
    });

    test('Whole Produce rescue fires +7 but is never highlight-eligible', () => {
      const result = calculateBodyPillar({
        ...baseProduct,
        ingredients_text: 'raspberries',
        categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
        nova_group: 1,
        nutriscore_grade: 'unknown',
      });
      const row = idOf(result, 'body-v12-whole-produce-rescue');
      expect(row?.value).toBe(WHOLE_PRODUCE_NUTRITION_BONUS);
      expect(row?.highlightEligible).toBe(false);
    });

    test('NOVA 1 provenance selects the ID; all three score +3 identically', () => {
      const external: Product = { ...baseProduct, nova_group: 1 };
      markNova1ProvenanceOff(external);
      const off = calculateBodyPillar(external);
      expect(idOf(off, 'body-v12-nova-1-off')?.value).toBe(3);
      expect(idOf(off, 'body-v12-nova-1-off')?.highlightEligible).toBe(true);
      expect(off.adjustments.find((adj) => adj.id === 'body-v12-nova-1-off')?.metadata?.nova1Provenance).toBe('off');

      const estimated: Product = { ...baseProduct };
      markNova1ProvenanceInferred(estimated);
      const inferred = calculateBodyPillar(estimated);
      expect(idOf(inferred, 'body-v12-nova-1-inferred')?.value).toBe(3);
      expect(idOf(inferred, 'body-v12-nova-1-inferred')?.highlightEligible).toBe(false);

      const legacy = calculateBodyPillar({ ...baseProduct, nova_group: 1 });
      expect(idOf(legacy, 'body-v12-nova-1-unknown')?.value).toBe(3);
      expect(idOf(legacy, 'body-v12-nova-1-unknown')?.highlightEligible).toBe(false);

      expect(off.score).toBe(18);
      expect(inferred.score).toBe(18);
      expect(legacy.score).toBe(18);
    });

    test('internally rescued NOVA 1 is marked inferred and stays highlight-ineligible', () => {
      const rescued = assignNOVA1IfHighConfidence({
        ...baseProduct,
        ingredients_text: 'blueberries',
        categories_tags: ['en:berries', 'en:fruits'],
      });
      const result = calculateBodyPillar(rescued);
      expect(idOf(result, 'body-v12-nova-1-inferred')?.highlightEligible).toBe(false);
      expect(result.score).toBe(25);
      expectPillarLedgerReconciles(result);
    });

    test('NOVA 2–4 map to locked IDs', () => {
      expect(firedAdjustmentIds(calculateBodyPillar({ ...baseProduct, nova_group: 2 }))).toContain('body-v12-nova-2');
      expect(firedAdjustmentIds(calculateBodyPillar({ ...baseProduct, nova_group: 3 }))).toContain('body-v12-nova-3');
      expect(firedAdjustmentIds(calculateBodyPillar({ ...baseProduct, nova_group: 4 }))).toContain('body-v12-nova-4');
    });

    test('each fired additive gets its own row at the raw per-additive deduction', () => {
      const result = calculateBodyPillar({ ...baseProduct, additives_tags: ['en:e102', 'en:e171'] });
      expect(idOf(result, 'body-v12-additive-e102')?.value).toBe(-3);
      expect(idOf(result, 'body-v12-additive-e171')?.value).toBe(-3);
      expect(idOf(result, 'body-v12-additive-e102')?.metadata?.canonicalId).toBe('e102');
      expect(idOf(result, 'body-v12-additive-e102')?.highlightEligible).toBe(true);
      expect(firedAdjustmentIds(result)).not.toContain('body-v12-additive-cap');
      expect(result.details.additiveElementDeduction).toBe(6);
      expect(result.score).toBe(9);
      expectPillarLedgerReconciles(result);
    });

    test('cap normaliser reconciles raw additive rows back to the −8 element cap', () => {
      const result = calculateBodyPillar({
        ...baseProduct,
        additives_tags: ['en:e102', 'en:e110', 'en:e129', 'en:e171', 'en:e250'],
      });
      const rawSum = result.adjustments
        .filter((adj) => adj.id?.startsWith('body-v12-additive-e'))
        .reduce((total, adj) => total + adj.value, 0);
      expect(rawSum).toBe(-18);
      expect(idOf(result, 'body-v12-additive-cap')?.value).toBe(10);
      expect(idOf(result, 'body-v12-additive-cap')?.highlightEligible).toBe(false);
      expect(result.details.additiveElementDeduction).toBe(8);
      expectPillarLedgerReconciles(result);
    });

    test('red-additive ceiling normaliser fires only when it changes the score', () => {
      const changed = calculateBodyPillar({
        ...baseProduct,
        nutriscore_grade: 'a',
        nova_group: 1,
        additives_tags: ['en:e250'],
      });
      expect(idOf(changed, 'body-v12-red-additive-ceiling')?.highlightEligible).toBe(false);
      expect(changed.score).toBe(12);
      expectPillarLedgerReconciles(changed);

      const unchanged = calculateBodyPillar({
        ...baseProduct,
        nutriscore_grade: 'e',
        additives_tags: ['en:e250'],
      });
      expect(firedAdjustmentIds(unchanged)).not.toContain('body-v12-red-additive-ceiling');
      expectPillarLedgerReconciles(unchanged);
    });

    test('final floor normaliser fires only when the floor changes the score', () => {
      const floored = calculateBodyPillar({
        ...baseProduct,
        nutriscore_grade: 'e',
        nova_group: 4,
        additives_tags: ['en:e250', 'en:e102', 'en:e110'],
      });
      expect(floored.score).toBe(2);
      expect(idOf(floored, 'body-v12-final-floor')?.highlightEligible).toBe(false);
      expectPillarLedgerReconciles(floored);

      const notFloored = calculateBodyPillar({ ...baseProduct, nutriscore_grade: 'e' });
      expect(firedAdjustmentIds(notFloored)).not.toContain('body-v12-final-floor');
    });

    test('every governed MVP additive has a locked adjustment ID', () => {
      const governed = Object.entries(ADDITIVE_DATABASE)
        .filter(([, info]) => !!info.bodyConcernTier)
        .map(([id]) => id);
      expect(governed.length).toBeGreaterThan(0);
      for (const canonicalId of governed) {
        expect(bodyV12AdditiveAdjustmentId(canonicalId)).toBeTruthy();
      }
    });

    test('highlight-eligible registry entries carry locked L1/L2 commentary', () => {
      for (const meta of Object.values(BODY_V12_ADJUSTMENT_REGISTRY)) {
        if (meta.highlightEligible) {
          expect(meta.highlightTitle).toBeTruthy();
          expect(meta.highlightExplainer).toBeTruthy();
        }
      }
    });

    test('ledger reconciles exactly across representative fixtures (score neutrality)', () => {
      const fixtures: Product[] = [
        baseProduct,
        { ...baseProduct, nutriscore_grade: 'a', nova_group: 1 },
        { ...baseProduct, nutriscore_grade: 'e', nova_group: 4 },
        { ...baseProduct, nutriscore_grade: 'c', additives_tags: ['en:e951'] },
        { ...baseProduct, ingredients_text: 'apple', categories_tags: ['en:fresh-apples'], nova_group: 1 },
        { ...baseProduct, additives_tags: ['en:e102', 'en:e110', 'en:e129', 'en:e171', 'en:e250', 'en:e951'] },
      ];
      for (const fixture of fixtures) {
        expectPillarLedgerReconciles(calculateBodyPillar(fixture));
      }
    });
  });
});
