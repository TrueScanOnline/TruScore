import {
  assessGovernedNutrients,
  resolveGovernedProductClass,
  sodiumMgFromNutriments,
} from '../../../nutrition/governedNutrientAssessment';
import { parseReliableServingSize } from '../../../nutrition/parseReliableServingSize';
import { UK_GOV_FOP_MTL_REFERENCE } from '../../../nutrition/ukGovFopMtlReference';
import {
  deriveNutrientLevelsFromNutriments,
  resolveNutrientLevels,
} from '../../../utils/resolveNutrientLevels';

describe('governed UK FoP MTL nutrient assessment', () => {
  describe('boundary — food per 100 g', () => {
    it('saturated fat boundaries', () => {
      expect(
        assessGovernedNutrients({
          nutriments: { 'saturated-fat_100g': 1.5 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.saturatedFat.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({
          nutriments: { 'saturated-fat_100g': 1.5001 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.saturatedFat.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { 'saturated-fat_100g': 5.0 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.saturatedFat.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { 'saturated-fat_100g': 5.0001 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.saturatedFat.level
      ).toBe('high');
    });

    it('total sugars boundaries', () => {
      expect(
        assessGovernedNutrients({
          nutriments: { sugars_100g: 5.0 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.totalSugars.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({
          nutriments: { sugars_100g: 5.0001 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.totalSugars.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { sugars_100g: 22.5 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.totalSugars.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { sugars_100g: 22.5001 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.totalSugars.level
      ).toBe('high');
    });

    it('sodium boundaries (mg)', () => {
      expect(
        assessGovernedNutrients({
          nutriments: { sodium_100g: 0.12 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.sodium.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({
          nutriments: { sodium_100g: 0.1201 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.sodium.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { sodium_100g: 0.6 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.sodium.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({
          nutriments: { sodium_100g: 0.6001 },
          categoriesTags: ['en:breakfast-cereals'],
        }).nutrients.sodium.level
      ).toBe('high');
    });
  });

  describe('boundary — drink per 100 mL', () => {
    const drink = ['en:beverages'];
    it('saturated fat / sugars / sodium drink bands', () => {
      expect(
        assessGovernedNutrients({ nutriments: { 'saturated-fat_100g': 0.75 }, categoriesTags: drink })
          .nutrients.saturatedFat.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({ nutriments: { 'saturated-fat_100g': 0.7501 }, categoriesTags: drink })
          .nutrients.saturatedFat.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { 'saturated-fat_100g': 2.5 }, categoriesTags: drink })
          .nutrients.saturatedFat.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { 'saturated-fat_100g': 2.5001 }, categoriesTags: drink })
          .nutrients.saturatedFat.level
      ).toBe('high');

      expect(
        assessGovernedNutrients({ nutriments: { sugars_100g: 2.5 }, categoriesTags: drink }).nutrients
          .totalSugars.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({ nutriments: { sugars_100g: 2.5001 }, categoriesTags: drink }).nutrients
          .totalSugars.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { sugars_100g: 11.25 }, categoriesTags: drink }).nutrients
          .totalSugars.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { sugars_100g: 11.2501 }, categoriesTags: drink }).nutrients
          .totalSugars.level
      ).toBe('high');

      expect(
        assessGovernedNutrients({ nutriments: { sodium_100g: 0.12 }, categoriesTags: drink }).nutrients
          .sodium.level
      ).toBe('low');
      expect(
        assessGovernedNutrients({ nutriments: { sodium_100g: 0.1201 }, categoriesTags: drink }).nutrients
          .sodium.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { sodium_100g: 0.3 }, categoriesTags: drink }).nutrients
          .sodium.level
      ).toBe('moderate');
      expect(
        assessGovernedNutrients({ nutriments: { sodium_100g: 0.3001 }, categoriesTags: drink }).nutrients
          .sodium.level
      ).toBe('high');
    });
  });

  describe('OFF-legacy independence', () => {
    it('food sugars 15 g/100 g is Moderate even if OFF says high', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 15 },
        categoriesTags: ['en:breakfast-cereals'],
      });
      expect(a.nutrients.totalSugars.level).toBe('moderate');
      // Legacy resolver must not invent OFF-aligned ratings
      expect(resolveNutrientLevels({ sugars_100g: 15 }, { sugars: 'high' }, undefined).sugars).toBeUndefined();
      expect(deriveNutrientLevelsFromNutriments({ sugars_100g: 50 }, undefined).sugars).toBeUndefined();
    });

    it('drink sugars 8 g/100 mL is Moderate even if OFF says high', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 8 },
        categoriesTags: ['en:beverages'],
      });
      expect(a.nutrients.totalSugars.level).toBe('moderate');
    });
  });

  describe('sodium precedence', () => {
    it('uses direct sodium over salt', () => {
      const { mgPer100, valueBasis } = sodiumMgFromNutriments({
        sodium_100g: 0.2,
        salt_100g: 2,
      });
      expect(valueBasis).toBe('sodium');
      expect(mgPer100).toBeCloseTo(200, 5);
    });

    it('derives sodium from salt when sodium missing', () => {
      const { mgPer100, valueBasis } = sodiumMgFromNutriments({ salt_100g: 1.25 });
      expect(valueBasis).toBe('salt_derived');
      // sodium g = 1.25/2.5 = 0.5 → 500 mg
      expect(mgPer100).toBeCloseTo(500, 5);
    });
  });

  describe('product class', () => {
    it('does not treat plant-based-foods-and-beverages as drink', () => {
      expect(resolveGovernedProductClass(['en:plant-based-foods-and-beverages'])).toBe('food');
    });
    it('treats exact en:beverages as drink', () => {
      expect(resolveGovernedProductClass(['en:beverages'])).toBe('drink');
    });
    it('unknown when categories absent', () => {
      expect(resolveGovernedProductClass(undefined)).toBe('unknown');
      const a = assessGovernedNutrients({ nutriments: { sugars_100g: 50 } });
      expect(a.nutrients.totalSugars.level).toBe('unavailable');
      expect(a.limitations).toContain('product_class_unknown');
    });
  });

  describe('large-portion High override', () => {
    it('310 mL drink sugars 10.6 → Moderate per-100, High via large_portion', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 10.6 },
        categoriesTags: ['en:beverages'],
        servingSize: '310 mL',
      });
      expect(a.nutrients.totalSugars.rawPer100).toBe(10.6);
      expect(a.nutrients.totalSugars.perServe).toBeCloseTo(32.86, 2);
      expect(a.nutrients.totalSugars.level).toBe('high');
      expect(a.nutrients.totalSugars.triggers).toEqual(['large_portion']);
    });

    it('150 mL drink sugars 10.6 → no large-portion gate (not >150)', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 10.6 },
        categoriesTags: ['en:beverages'],
        servingSize: '150 mL',
      });
      expect(a.nutrients.totalSugars.level).toBe('moderate');
      expect(a.nutrients.totalSugars.triggers).toEqual([]);
    });

    it('food 150 g serve sugars 20 → High via large_portion', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 20 },
        categoriesTags: ['en:meals'],
        servingSize: '150 g',
      });
      expect(a.nutrients.totalSugars.perServe).toBe(30);
      expect(a.nutrients.totalSugars.level).toBe('high');
      expect(a.nutrients.totalSugars.triggers).toContain('large_portion');
    });

    it('food 100 g serve sugars 27.1 → High via per100 only', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 27.1 },
        categoriesTags: ['en:meals'],
        servingSize: '100 g',
      });
      expect(a.nutrients.totalSugars.level).toBe('high');
      expect(a.nutrients.totalSugars.triggers).toEqual(['per100']);
    });

    it('food 150 g serve exactly 27 g sugars/serve → equality not High from portion', () => {
      // 27 g / 150 g * 100 = 18 g/100 → Moderate per-100; portion equality not High
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 18 },
        categoriesTags: ['en:meals'],
        servingSize: '150 g',
      });
      expect(a.nutrients.totalSugars.perServe).toBe(27);
      expect(a.nutrients.totalSugars.level).toBe('moderate');
      expect(a.nutrients.totalSugars.triggers).not.toContain('large_portion');
    });

    it('drink 200 mL serve exactly 13.5 g sugars/serve → equality not High from portion', () => {
      // 13.5 / 200 * 100 = 6.75 → Moderate drink per-100
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 6.75 },
        categoriesTags: ['en:beverages'],
        servingSize: '200 mL',
      });
      expect(a.nutrients.totalSugars.perServe).toBeCloseTo(13.5, 5);
      expect(a.nutrients.totalSugars.level).toBe('moderate');
      expect(a.nutrients.totalSugars.triggers).not.toContain('large_portion');
    });

    it('no serving → no per-serve / no large-portion', () => {
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 20 },
        categoriesTags: ['en:meals'],
      });
      expect(a.serving.usable).toBe(false);
      expect(a.nutrients.totalSugars.perServe).toBeUndefined();
      expect(a.nutrients.totalSugars.triggers).not.toContain('large_portion');
    });

    it('count-only serving “1 can” unavailable', () => {
      expect(parseReliableServingSize('1 can').usable).toBe(false);
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 20 },
        categoriesTags: ['en:beverages'],
        servingSize: '1 can',
      });
      expect(a.serving.usable).toBe(false);
    });

    it('accepts “1 can (330 mL)”', () => {
      const p = parseReliableServingSize('1 can (330 mL)');
      expect(p.usable).toBe(true);
      if (p.usable) {
        expect(p.quantity).toBe(330);
        expect(p.unit).toBe('ml');
      }
    });

    it('resolves explicit multi-serving totals by division', () => {
      for (const [text, qty] of [
        ['250 g (2 servings)', 125],
        ['500 g (4 servings)', 125],
        ['250 g / 2 serves', 125],
      ] as const) {
        const p = parseReliableServingSize(text);
        expect(p.usable).toBe(true);
        if (p.usable) {
          expect(p.quantity).toBe(qty);
          expect(p.unit).toBe('g');
        }
      }
    });

    it('rejects multipack notation without explicit serving count', () => {
      expect(parseReliableServingSize('2 x 30 g').usable).toBe(false);
      expect(parseReliableServingSize('1 pack (2 x 25 g)').usable).toBe(false);
      const a = assessGovernedNutrients({
        nutriments: { sugars_100g: 20 },
        categoriesTags: ['en:meals'],
        servingSize: '2 x 30 g',
      });
      expect(a.serving.usable).toBe(false);
      expect(a.nutrients.totalSugars.perServe).toBeUndefined();
      expect(a.nutrients.totalSugars.triggers).not.toContain('large_portion');
    });

    it('keeps explicit single-serving forms working', () => {
      expect(parseReliableServingSize('1 slice (35 g)')).toMatchObject({
        usable: true,
        quantity: 35,
        unit: 'g',
      });
      expect(parseReliableServingSize('30 g')).toMatchObject({ usable: true, quantity: 30, unit: 'g' });
      expect(parseReliableServingSize('0.5 L')).toMatchObject({ usable: true, quantity: 500, unit: 'ml' });
    });

    it('ignores raw *_serving fields — governed Per serve is per100 × qty ÷ 100 only', () => {
      const a = assessGovernedNutrients({
        nutriments: {
          sugars_100g: 10,
          sugars_serving: 40,
        },
        categoriesTags: ['en:meals'],
        servingSize: '120 g',
      });
      expect(a.serving.usable).toBe(true);
      expect(a.nutrients.totalSugars.perServe).toBe(12);
      expect(a.nutrients.totalSugars.level).toBe('moderate'); // 10 g/100 food
      expect(a.nutrients.totalSugars.triggers).toEqual([]);
      expect(a.nutrients.totalSugars.triggers).not.toContain('large_portion');
    });
  });

  describe('reference metadata', () => {
    it('exposes versioned standard id', () => {
      expect(UK_GOV_FOP_MTL_REFERENCE.reference_standard_id).toBe(
        'uk-gov-fop-mtl-rveel-reviewed-2026-09-12'
      );
      expect(UK_GOV_FOP_MTL_REFERENCE.source_runtime_fetch).toBe(false);
    });
  });

  describe('inspection fixtures — before/after governed ratings', () => {
    it('NUTRI GRAIN 9310055105850', () => {
      const a = assessGovernedNutrients({
        nutriments: {
          proteins_100g: 21.75,
          sugars_100g: 24,
          salt_100g: 0.875,
          fat_100g: 3,
          'saturated-fat_100g': 0.5,
        },
        categoriesTags: [
          'en:plant-based-foods-and-beverages',
          'en:breakfast-cereals',
        ],
      });
      expect(a.productClass).toBe('food');
      expect(a.nutrients.totalSugars.level).toBe('high');
      expect(a.nutrients.saturatedFat.level).toBe('low');
      // salt 0.875 g → sodium 350 mg → Moderate food
      expect(a.nutrients.sodium.level).toBe('moderate');
      expect(a.nutrients.sodium.valueBasis).toBe('salt_derived');
    });

    it('Marmite 9414942110252', () => {
      const a = assessGovernedNutrients({
        nutriments: {
          'saturated-fat_100g': 0.1,
          sugars_100g: 11.2,
          salt_100g: 3.3,
          proteins_100g: 17.4,
          fat_100g: 1,
        },
        categoriesTags: ['en:yeast-extract-spreads'],
      });
      expect(a.nutrients.saturatedFat.level).toBe('low');
      expect(a.nutrients.totalSugars.level).toBe('moderate');
      // salt 3.3 → sodium 1320 mg → High
      expect(a.nutrients.sodium.level).toBe('high');
    });

    it('Mi Goreng 089686171914', () => {
      const a = assessGovernedNutrients({
        nutriments: {
          sugars_100g: 1.99,
          'saturated-fat_100g': 2.61,
          salt_100g: 0.709,
          proteins_100g: 2.42,
        },
        categoriesTags: ['en:instant-noodles', 'en:plant-based-foods-and-beverages'],
      });
      expect(a.productClass).toBe('food');
      expect(a.nutrients.totalSugars.level).toBe('low');
      expect(a.nutrients.saturatedFat.level).toBe('moderate');
      // 0.709/2.5*1000 = 283.6 mg → Moderate
      expect(a.nutrients.sodium.level).toBe('moderate');
    });

    it('Fresh Chocolate Milk 94008241', () => {
      const a = assessGovernedNutrients({
        nutriments: {
          sugars_100g: 11.5333333333333,
          'saturated-fat_100g': 5.6,
          salt_100g: 0.130833333333333,
          fat_100g: 7.33333333333333,
          proteins_100g: 4.33333333333333,
        },
        categoriesTags: ['en:beverages', 'en:chocolate-milks'],
      });
      expect(a.productClass).toBe('drink');
      expect(a.nutrients.totalSugars.level).toBe('high'); // >11.25 drink
      expect(a.nutrients.saturatedFat.level).toBe('high'); // >2.5 drink
      // salt → sodium ~52.3 mg → Low drink
      expect(a.nutrients.sodium.level).toBe('low');
    });
  });
});
