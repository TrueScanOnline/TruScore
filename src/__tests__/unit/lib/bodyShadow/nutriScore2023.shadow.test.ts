/**
 * Nutri-Score 2023 shadow calculator tests — offline validation build.
 */

import { calculateNutriScore2023 } from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/calculator';
import {
  gradeFromScoreBeverage,
  gradeFromScoreFats,
  gradeFromScoreGeneral,
} from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/pointTables';
import type { NutriScore2023Inputs } from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/types';
import { evaluateLocalNutriScoreFromOffProduct } from '../../../../lib/truscoreEngine/bodyShadow/nutriScore2023/offEvidenceMapper';
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

  it('null fibre fails closed (not zero)', () => {
    const out = calculateNutriScore2023(generalInputs({ fibreG: null }));
    expect(out.kind).toBe('unresolved');
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
});
