/**
 * Nutri-Score 2023 shadow calculator tests — offline validation build.
 */

import { calculateNutriScore2023 } from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/calculator';
import {
  gradeFromScoreBeverage,
  gradeFromScoreFats,
  gradeFromScoreGeneral,
  generalSaltPoints,
} from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/pointTables';
import type { NutriScore2023Inputs } from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/types';
import {
  evaluateLocalNutriScoreFromOffProduct,
  OFF_FIBRE_UNAVAILABLE_ZERO_POINTS,
} from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/offEvidenceMapper';
import { evaluateWholeProduceCandidate, shadowBodyScoreEstimate } from '../../../../lib/truscoreEngine/bodyShadow/wholeProduce';
import type { Product } from '../../../../types/product';

function generalInputs(over: Partial<NutriScore2023Inputs> = {}): NutriScore2023Inputs {
  return {
    branch: 'general_foods',
    basis: 'per_100g',
    energyKj: 500,
    saturatedFatG: 1,
    sugarsG: 3,
    saltG: 0.1,
    proteinG: 5,
    fibreG: 4,
    fvlPercent: 0,
    fvlPoints: null,
    totalFatG: 5,
    nonNutritiveSweetenersPresent: null,
    isWater: false,
    ...over,
  };
}

describe('Nutri-Score 2023 shadow calculator', () => {
  it('general grade boundaries A/B/C/D/E', () => {
    expect(gradeFromScoreGeneral(0)).toBe('a');
    expect(gradeFromScoreGeneral(2)).toBe('b');
    expect(gradeFromScoreGeneral(10)).toBe('c');
    expect(gradeFromScoreGeneral(18)).toBe('d');
    expect(gradeFromScoreGeneral(19)).toBe('e');
  });

  it('N=10 vs N=11 protein behaviour (general foods)', () => {
    const n10 = calculateNutriScore2023(
      generalInputs({
        energyKj: 3400,
        saturatedFatG: 0.5,
        sugarsG: 0,
        saltG: 0.2,
        proteinG: 17,
        fibreG: 0,
        fvlPercent: 0,
      })
    );
    const n11 = calculateNutriScore2023(
      generalInputs({
        energyKj: 3400,
        saturatedFatG: 0.5,
        sugarsG: 0,
        saltG: 0.21,
        proteinG: 17,
        fibreG: 0,
        fvlPercent: 0,
      })
    );
    expect(n10.kind).toBe('calculated');
    expect(n11.kind).toBe('calculated');
    if (n10.kind === 'calculated' && n11.kind === 'calculated') {
      expect(n10.negativePoints).toBe(10);
      expect(n11.negativePoints).toBe(11);
      expect(n10.positivePoints).toBe(6);
      expect(n11.positivePoints).toBe(0);
      expect(n10.numericScore).toBe(4);
      expect(n11.numericScore).toBe(11);
    }
  });

  it('cheese keeps protein when N>=11', () => {
    const out = calculateNutriScore2023(
      generalInputs({
        branch: 'cheese',
        energyKj: 2000,
        saturatedFatG: 10,
        sugarsG: 2,
        saltG: 2,
        proteinG: 20,
        fibreG: 0,
        fvlPercent: 0,
      })
    );
    expect(out.kind).toBe('calculated');
    if (out.kind === 'calculated') {
      expect(out.negativePoints).toBeGreaterThanOrEqual(11);
      expect(out.positivePoints).toBeGreaterThan(0);
    }
  });

  it('red meat caps protein at 2 points', () => {
    const out = calculateNutriScore2023(
      generalInputs({
        branch: 'red_meat',
        proteinG: 20,
        energyKj: 800,
        saturatedFatG: 3,
        sugarsG: 1,
        saltG: 0.5,
        fibreG: 0,
        fvlPercent: 0,
      })
    );
    expect(out.kind).toBe('calculated');
  });

  it('fats branch N=6 vs N=7 and grade -6/-5 boundary', () => {
    expect(gradeFromScoreFats(-6)).toBe('a');
    expect(gradeFromScoreFats(-5)).toBe('b');
    const out = calculateNutriScore2023(
      generalInputs({
        branch: 'fats_oils_nuts_seeds',
        energyKj: null,
        saturatedFatG: 2,
        totalFatG: 20,
        sugarsG: 1,
        saltG: 0.1,
        proteinG: 1,
        fibreG: 0,
        fvlPercent: 0,
      })
    );
    expect(out.kind).toBe('calculated');
  });

  it('beverage water is grade A; non-water cannot be A', () => {
    const water = calculateNutriScore2023({
      branch: 'water',
      basis: 'per_100ml',
      energyKj: 0,
      saturatedFatG: 0,
      sugarsG: 0,
      saltG: 0,
      proteinG: 0,
      fibreG: 0,
      fvlPercent: 0,
      fvlPoints: null,
      totalFatG: 0,
      nonNutritiveSweetenersPresent: false,
      isWater: true,
    });
    expect(water.kind).toBe('calculated');
    if (water.kind === 'calculated') expect(water.grade).toBe('a');

    expect(gradeFromScoreBeverage(0, false)).toBe('b');
  });

  it('beverage NNS adds +4 N points when present', () => {
    const without = calculateNutriScore2023(
      generalInputs({
        branch: 'beverages',
        basis: 'per_100ml',
        energyKj: 50,
        saturatedFatG: 0,
        sugarsG: 1,
        saltG: 0.01,
        proteinG: 0,
        fibreG: 0,
        fvlPercent: 0,
        nonNutritiveSweetenersPresent: false,
      })
    );
    const withNns = calculateNutriScore2023(
      generalInputs({
        branch: 'beverages',
        basis: 'per_100ml',
        energyKj: 50,
        saturatedFatG: 0,
        sugarsG: 1,
        saltG: 0.01,
        proteinG: 0,
        fibreG: 0,
        fvlPercent: 0,
        nonNutritiveSweetenersPresent: true,
      })
    );
    expect(without.kind).toBe('calculated');
    expect(withNns.kind).toBe('calculated');
    if (without.kind === 'calculated' && withNns.kind === 'calculated') {
      expect(withNns.negativePoints - without.negativePoints).toBe(4);
    }
  });

  it('unavailable fibre with OFF-aligned mode → 0 favourable points (not declared 0 g)', () => {
    const inputs = generalInputs({ fibreG: null });
    const strict = calculateNutriScore2023(inputs);
    expect(strict.kind).toBe('unresolved');

    const offAligned = calculateNutriScore2023(inputs, { fibreUnavailableAsZeroPoints: true });
    expect(offAligned.kind).toBe('calculated');
    if (offAligned.kind === 'calculated') {
      expect(offAligned.path).toBe('complete_input_fibre_unavailable_zero_points');
    }
  });

  it('declared 0 g fibre still scores fibre points table at 0 (distinct from unavailable)', () => {
    const declaredZero = calculateNutriScore2023(generalInputs({ fibreG: 0 }));
    const unavailable = calculateNutriScore2023(generalInputs({ fibreG: null }), {
      fibreUnavailableAsZeroPoints: true,
    });
    expect(declaredZero.kind).toBe('calculated');
    expect(unavailable.kind).toBe('calculated');
    if (declaredZero.kind === 'calculated' && unavailable.kind === 'calculated') {
      expect(declaredZero.numericScore).toBe(unavailable.numericScore);
      expect(unavailable.path).toBe('complete_input_fibre_unavailable_zero_points');
      expect(declaredZero.path).toBe('complete_input');
    }
  });

  it('Sour Patch Kids 9300617300793 — missing fibre/salt unresolved', () => {
    const product: Product = {
      barcode: '9300617300793',
      product_name: 'Sour patch kids',
      categories_tags: ['en:gummi-candies'],
      nova_group: 4,
      nutriscore_grade: 'unknown',
      nutriments: {
        energy_100g: 1749.68,
        'energy-kj_100g': 1749.68,
        saturated_fat_100g: 4,
        sugars_100g: 62,
        proteins_100g: 4,
      },
      nutriscore: {
        '2023': {
          category_available: 1,
          data: {
            is_beverage: 0,
            is_cheese: 0,
            is_fat_oil_nuts_seeds: 0,
            is_red_meat_product: 0,
            is_water: 0,
            fruits_vegetables_legumes: 0,
            fiber: null,
            salt: null,
          },
        },
      },
    } as Product;

    const evalResult = evaluateLocalNutriScoreFromOffProduct(product);
    expect(evalResult.classification).toBe('INSUFFICIENT_DETERMINISTIC_EVIDENCE');
    expect(evalResult.completeOutcome?.kind).toBe('unresolved');
  });

  it('9556001137722 instant noodles — fail-closed when prepared basis not established', () => {
    const product: Product = {
      barcode: '9556001137722',
      product_name: '2 Minute Noodles Chicken Flavour',
      categories_tags: [
        'en:dried-products-to-be-rehydrated',
        'en:instant-noodles',
        'en:noodles',
      ],
      nutrition_data: 'on',
      nutrition_data_prepared_per: '100g',
      misc_tags: ['en:nutriscore-missing-prepared-nutrition-data', 'en:nutriscore-not-computed'],
      nutriments: {
        'energy-kj_100g': 322.16,
        sugars_100g: 0.069,
        'saturated-fat_100g': 0.36,
        salt_100g: 0.162,
        proteins_100g: 1.89,
        'fruits-vegetables-legumes-estimate-from-ingredients_100g': 0,
      },
      nutriscore: {
        '2023': {
          category_available: 1,
          preparation: 'prepared',
          nutrients_available: 0,
          nutriscore_computed: 0,
          grade: 'unknown',
          data: {
            is_beverage: 0,
            is_cheese: 0,
            is_fat_oil_nuts_seeds: 0,
            is_red_meat_product: 0,
            is_water: 0,
            fruits_vegetables_legumes: 0,
          },
        },
      },
    } as Product;

    const strict = evaluateLocalNutriScoreFromOffProduct(product);
    const fibreMode = evaluateLocalNutriScoreFromOffProduct(product, OFF_FIBRE_UNAVAILABLE_ZERO_POINTS);
    expect(strict.unresolvedReason).toBe('unresolved_preparation_basis');
    expect(strict.completeOutcome).toBeNull();
    expect(fibreMode.unresolvedReason).toBe('unresolved_preparation_basis');
    expect(fibreMode.completeOutcome).toBeNull();
  });

  it('rehydratable product with prepared nutriment keys maps prepared basis', () => {
    const product: Product = {
      barcode: 'test-prepared-noodles',
      categories_tags: ['en:dried-products-to-be-rehydrated', 'en:instant-noodles'],
      nutriments: {
        'energy-kj_prepared_100g': 400,
        sugars_prepared_100g: 2,
        'saturated-fat_prepared_100g': 1,
        salt_prepared_100g: 0.5,
        proteins_prepared_100g: 3,
        fiber_prepared_100g: 1,
        'fruits-vegetables-legumes-estimate-from-ingredients_prepared_100g': 0,
      },
      nutriscore: {
        '2023': {
          category_available: 1,
          data: {
            is_beverage: 0,
            is_cheese: 0,
            is_fat_oil_nuts_seeds: 0,
            is_red_meat_product: 0,
            is_water: 0,
            fruits_vegetables_legumes: 0,
          },
        },
      },
    } as Product;

    const evalResult = evaluateLocalNutriScoreFromOffProduct(product);
    expect(evalResult.mapped.inputs?.nutritionPreparation).toBe('prepared');
    expect(evalResult.completeOutcome?.kind).toBe('calculated');
  });

  it('Driscoll raspberries 93541121 — whole produce candidate Body shadow 22', () => {
    const product: Product = {
      barcode: '93541121',
      product_name: 'Raspberries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries', 'en:berries', 'en:fruits'],
      nova_group: 1,
      nutriscore_grade: 'unknown',
      nutriments: {
        energy_100g: 298.75,
        fiber_100g: 6.5,
        proteins_100g: 1.2,
        sugars_100g: 4.4,
        salt_100g: 0.00625,
        saturated_fat_100g: 0.13,
      },
      nutriscore: {
        '2023': {
          category_available: 1,
          data: {
            is_beverage: 0,
            is_cheese: 0,
            is_fat_oil_nuts_seeds: 0,
            is_red_meat_product: 0,
            is_water: 0,
            fruits_vegetables_legumes: 100,
          },
        },
      },
    } as Product;

    const wp = evaluateWholeProduceCandidate(product);
    expect(wp.candidate).toBe(true);

    const shadow = shadowBodyScoreEstimate({
      product,
      localGrade: null,
      offGrade: null,
      wholeProduceCandidate: wp.candidate,
    });
    expect(shadow).toBe(22);
  });

  it('whole produce does not stack when OFF Nutri-Score present', () => {
    const product: Product = {
      barcode: '93541121',
      product_name: 'Raspberries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries'],
      nova_group: 1,
      nutriscore_grade: 'a',
    };
    const wp = evaluateWholeProduceCandidate(product);
    const shadow = shadowBodyScoreEstimate({
      product,
      localGrade: null,
      offGrade: 'a',
      wholeProduceCandidate: wp.candidate,
    });
    expect(shadow).toBe(25);
  });

  it('whole produce boundary — juice category excluded', () => {
    const product: Product = {
      barcode: '9990000000001',
      product_name: 'Apple juice',
      ingredients_text: 'apple juice',
      categories_tags: ['en:apple-juices', 'en:juices'],
      nova_group: 1,
    };
    expect(evaluateWholeProduceCandidate(product).candidate).toBe(false);
  });

  it('whole produce boundary — multi-ingredient excluded', () => {
    const product: Product = {
      barcode: '9990000000002',
      product_name: 'Fruit salad',
      ingredients_text: 'apple, banana',
      categories_tags: ['en:fresh-fruits'],
      nova_group: 1,
    };
    expect(evaluateWholeProduceCandidate(product).candidate).toBe(false);
  });

  it('2023 salt table uses 0.2 g steps (3.3 g → 16 points, not 20)', () => {
    expect(generalSaltPoints(3.3)).toBe(16);
    expect(generalSaltPoints(3.0)).toBe(14);
    expect(generalSaltPoints(3.01)).toBe(15);
    expect(generalSaltPoints(4.1)).toBe(20);
  });

  it('Marmite 9414942110252 — exact OFF grade D reproduction after 2023 salt table', () => {
    const product: Product = {
      barcode: '9414942110252',
      product_name: 'Marmite',
      categories_tags: ['en:yeast-extract-spreads'],
      nova_group: 4,
      nutriscore_grade: 'd',
      nutriments: {
        'energy-kj_100g': 690,
        'saturated-fat_100g': 0.1,
        sugars_100g: 11.2,
        salt_100g: 3.3,
        proteins_100g: 17.4,
        fiber_100g: 9.3,
      },
      nutriscore: {
        '2023': {
          category_available: 1,
          data: {
            is_beverage: 0,
            is_cheese: 0,
            is_fat_oil_nuts_seeds: 0,
            is_red_meat_product: 0,
            is_water: 0,
            fruits_vegetables_legumes: 1.6,
          },
        },
      },
    } as Product;
    const local = evaluateLocalNutriScoreFromOffProduct(product);
    expect(local.completeOutcome?.kind).toBe('calculated');
    if (local.completeOutcome?.kind === 'calculated') {
      expect(local.completeOutcome.grade).toBe('d');
      expect(local.completeOutcome.numericScore).toBe(16);
    }
  });

  it('whole produce boundary — NOVA 4 excluded', () => {
    const product: Product = {
      barcode: '9990000000003',
      product_name: 'Ultra processed berries',
      ingredients_text: 'raspberries',
      categories_tags: ['en:fresh-raspberries'],
      nova_group: 4,
    };
    expect(evaluateWholeProduceCandidate(product).candidate).toBe(false);
  });
});
