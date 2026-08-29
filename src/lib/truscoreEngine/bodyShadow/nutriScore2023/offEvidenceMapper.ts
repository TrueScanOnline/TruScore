/**
 * Maps OFF product evidence to normalized Nutri-Score 2023 inputs (shadow only).
 * Must NOT consume OFF grade, numeric score, or component points as calculation inputs.
 */

import type { Product } from '../../../../types/product';
import { assessNutriScoreApplicability } from './applicability';
import { calculateNutriScore2023 } from './calculator';
import { checkGradeInvarianceBounds } from './boundsInvariance';
import { sodiumGToSaltG, sodiumMgToSaltG } from './pointTables';
import type {
  NutriScore2023Branch,
  NutriScore2023Inputs,
  NutriScore2023Outcome,
  ShadowClassification,
} from './types';

type OffNutriscore2023Data = {
  is_beverage?: number | boolean;
  is_cheese?: number | boolean;
  is_fat_oil_nuts_seeds?: number | boolean;
  is_red_meat_product?: number | boolean;
  is_water?: number | boolean | string;
  non_nutritive_sweeteners?: number | boolean;
  fruits_vegetables_legumes?: number | null;
};

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function boolOrNull(v: unknown): boolean | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return null;
}

function readNutriment(n: Product['nutriments'], keys: string[]): number | null {
  if (!n) return null;
  for (const key of keys) {
    const v = (n as Record<string, unknown>)[key];
    const parsed = numOrNull(v);
    if (parsed !== null) return parsed;
  }
  return null;
}

function resolveSaltG(product: Product): number | null {
  const n = product.nutriments;
  const salt = readNutriment(n, ['salt_100g', 'salt']);
  if (salt !== null) return salt;
  const sodiumG = readNutriment(n, ['sodium_100g', 'sodium']);
  if (sodiumG !== null) return sodiumGToSaltG(sodiumG);
  const sodiumMg = readNutriment(n, ['sodium_mg_100g', 'sodium_mg']);
  if (sodiumMg !== null) return sodiumMgToSaltG(sodiumMg);
  return null;
}

function resolveBranchFromOff2023(data: OffNutriscore2023Data | undefined): NutriScore2023Branch | null {
  if (!data) return null;
  if (boolOrNull(data.is_water)) return 'water';
  if (boolOrNull(data.is_beverage)) return 'beverages';
  if (boolOrNull(data.is_cheese)) return 'cheese';
  if (boolOrNull(data.is_fat_oil_nuts_seeds)) return 'fats_oils_nuts_seeds';
  if (boolOrNull(data.is_red_meat_product)) return 'red_meat';
  return 'general_foods';
}

function resolveFvlPercent(product: Product, off2023?: OffNutriscore2023Data): number | null {
  const fromOffData = numOrNull(off2023?.fruits_vegetables_legumes);
  if (fromOffData !== null) return fromOffData;
  const fromNutriments = readNutriment(product.nutriments, [
    'fruits-vegetables-legumes-estimate-from-ingredients_100g',
  ]);
  return fromNutriments;
}

export function mapOffProductToNutriScore2023Inputs(product: Product): {
  inputs: NutriScore2023Inputs | null;
  unresolvedReason?: string;
} {
  const offRoot = (product as Product & { nutriscore?: { '2023'?: { data?: OffNutriscore2023Data; category_available?: number } } }).nutriscore;
  const off2023 = offRoot?.['2023']?.data;
  const categoryAvailable = offRoot?.['2023']?.category_available === 1;

  const branch = categoryAvailable ? resolveBranchFromOff2023(off2023) : null;
  if (!branch) {
    return { inputs: null, unresolvedReason: 'unresolved_branch' };
  }

  const isBeverage = branch === 'beverages' || branch === 'water';
  const basis = isBeverage ? 'per_100ml' : 'per_100g';

  const energyKj =
    readNutriment(product.nutriments, ['energy-kj_100g', 'energy_100g', 'energy-kj', 'energy']) ??
    null;

  return {
    inputs: {
      branch,
      basis,
      energyKj,
      saturatedFatG: readNutriment(product.nutriments, ['saturated-fat_100g', 'saturated-fat']),
      sugarsG: readNutriment(product.nutriments, ['sugars_100g', 'sugars']),
      saltG: resolveSaltG(product),
      proteinG: readNutriment(product.nutriments, ['proteins_100g', 'proteins']),
      fibreG: readNutriment(product.nutriments, ['fiber_100g', 'fibre_100g', 'fiber', 'fibre']),
      fvlPercent: resolveFvlPercent(product, off2023),
      fvlPoints: null,
      totalFatG: readNutriment(product.nutriments, ['fat_100g', 'fat']),
      nonNutritiveSweetenersPresent: isBeverage
        ? boolOrNull(off2023?.non_nutritive_sweeteners)
        : null,
      isWater: branch === 'water',
    },
  };
}

export function evaluateLocalNutriScoreFromOffProduct(product: Product): {
  applicability: ReturnType<typeof assessNutriScoreApplicability>;
  mapped: ReturnType<typeof mapOffProductToNutriScore2023Inputs>;
  completeOutcome: NutriScore2023Outcome | null;
  boundsOutcome: NutriScore2023Outcome | null;
  classification: ShadowClassification;
  unresolvedReason?: string;
} {
  const applicability = assessNutriScoreApplicability({
    categoriesTags: product.categories_tags,
  });

  if (!applicability.applicable) {
    return {
      applicability,
      mapped: { inputs: null },
      completeOutcome: null,
      boundsOutcome: null,
      classification: 'NUTRISCORE_NOT_APPLICABLE',
      unresolvedReason: applicability.reason,
    };
  }

  const mapped = mapOffProductToNutriScore2023Inputs(product);
  if (!mapped.inputs) {
    return {
      applicability,
      mapped,
      completeOutcome: null,
      boundsOutcome: null,
      classification: 'INSUFFICIENT_DETERMINISTIC_EVIDENCE',
      unresolvedReason: mapped.unresolvedReason,
    };
  }

  const completeOutcome = calculateNutriScore2023(mapped.inputs);
  if (completeOutcome.kind === 'calculated') {
    return {
      applicability,
      mapped,
      completeOutcome,
      boundsOutcome: null,
      classification: 'LOCAL_COMPLETE_INPUT_GRADE_RECOVERED',
    };
  }

  if (completeOutcome.kind === 'unresolved') {
    const bounds = checkGradeInvarianceBounds(mapped.inputs);
    if (bounds.invariant) {
      return {
        applicability,
        mapped,
        completeOutcome,
        boundsOutcome: {
          kind: 'bounds_invariant_grade',
          grade: bounds.grade,
          branch: mapped.inputs.branch,
          path: 'bounds_invariance',
        },
        classification: 'BOUNDS_INVARIANT_GRADE',
      };
    }
    return {
      applicability,
      mapped,
      completeOutcome,
      boundsOutcome: null,
      classification: 'INSUFFICIENT_DETERMINISTIC_EVIDENCE',
      unresolvedReason: completeOutcome.reason,
    };
  }

  return {
    applicability,
    mapped,
    completeOutcome,
    boundsOutcome: null,
    classification: 'INSUFFICIENT_DETERMINISTIC_EVIDENCE',
  };
}

export function offGradeForComparison(product: Product): string | null {
  const g = product.nutriscore_grade ?? product.nutrition_grades_tags?.[0];
  if (!g) return null;
  const lower = String(g).toLowerCase();
  if (lower === 'unknown' || lower === 'not-applicable') return null;
  if (!['a', 'b', 'c', 'd', 'e'].includes(lower)) return null;
  return lower;
}
