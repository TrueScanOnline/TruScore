/**
 * Central Rveel-governed nutrient assessment (UK FoP MTL).
 * UI and future Claims must consume this; do not re-run threshold arithmetic in the UI.
 * Raw OFF product.nutrient_levels are never authority for ratings.
 */

import type { Product, ProductNutriments } from '../types/product';
import { getNutrientValue100g } from '../utils/nutritionPer100g';
import { UK_GOV_FOP_MTL_REFERENCE } from './ukGovFopMtlReference';
import { parseReliableServingSize } from './parseReliableServingSize';
import { simulateV02FoodDrinkClass } from './v02FoodDrinkDeterminant';
import type {
  GovernedLimitationCode,
  GovernedLevelTrigger,
  GovernedNutrientAssessment,
  GovernedNutrientAssessmentItem,
  GovernedNutrientLevel,
  GovernedPer100Basis,
  GovernedProductClass,
  SodiumValueBasis,
} from './governedNutrientTypes';

export type { GovernedNutrientAssessment, GovernedNutrientKey } from './governedNutrientTypes';

export interface AssessGovernedNutrientsInput {
  nutriments?: ProductNutriments;
  categoriesTags?: string[];
  servingSize?: string | null;
  /** Optional structured serving quantity (g or ml) when already normalised for Per serve. */
  servingQuantity?: number | null;
  servingUnit?: 'g' | 'ml' | null;
  /** Identity / quantity fields for the accepted v0.2 Food/Drink determinant. */
  productName?: string | null;
  genericName?: string | null;
  quantity?: string | null;
  productQuantity?: number | null;
  productQuantityUnit?: string | null;
  /** OFF raw serving quantity unit (string); distinct from normalised servingUnit for Per serve. */
  servingQuantityUnit?: string | null;
  nutritionDataPer?: string | null;
  nutritionDataPreparedPer?: string | null;
}

function isValidAmount(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value >= 0;
}

/**
 * Categories-only view of the accepted v0.2 binary Food/Drink determinant.
 * Prefer assessGovernedNutrients / simulateV02FoodDrinkClass with full identity+quantity evidence.
 * Never returns `unknown` — Drink must be affirmatively established; otherwise Food.
 */
export function resolveGovernedProductClass(categoriesTags?: string[]): GovernedProductClass {
  return simulateV02FoodDrinkClass({ categoriesTags: categoriesTags ?? null }).productClass;
}

export function resolvePer100Basis(productClass: GovernedProductClass): GovernedPer100Basis {
  if (productClass === 'drink') return '100ml';
  if (productClass === 'food') return '100g';
  return 'unknown';
}

/** OFF-style sodium is typically grams; thresholds and display use mg. */
export function sodiumMgFromNutriments(nutriments: ProductNutriments | undefined): {
  mgPer100: number | undefined;
  valueBasis: SodiumValueBasis | undefined;
} {
  if (!nutriments) return { mgPer100: undefined, valueBasis: undefined };

  const sodiumG = getNutrientValue100g(nutriments, 'sodium');
  if (isValidAmount(sodiumG)) {
    return { mgPer100: sodiumG * 1000, valueBasis: 'sodium' };
  }

  const saltG = getNutrientValue100g(nutriments, 'salt');
  if (isValidAmount(saltG)) {
    // salt = sodium × 2.5 ⇒ sodium(g) = salt(g) / 2.5
    return { mgPer100: (saltG / 2.5) * 1000, valueBasis: 'salt_derived' };
  }

  return { mgPer100: undefined, valueBasis: undefined };
}

function levelFromPer100(value: number, lowMax: number, highMinExclusive: number): Exclude<GovernedNutrientLevel, 'unavailable'> {
  if (value <= lowMax) return 'low';
  if (value > highMinExclusive) return 'high';
  return 'moderate';
}

/**
 * Singular governed Per serve arithmetic: per100 × servingQuantity ÷ 100.
 * Raw OFF/source `*_serving` fields must not override this value.
 */
export function governedPerServeFromPer100(
  per100: number | undefined,
  servingQuantity: number | undefined
): number | undefined {
  if (!isValidAmount(per100) || servingQuantity === undefined || !(servingQuantity > 0)) {
    return undefined;
  }
  return (per100 * servingQuantity) / 100;
}

function assessOne(args: {
  rawPer100: number | undefined;
  perServe: number | undefined;
  lowMax: number;
  highMinExclusive: number;
  largePortionThreshold: number | undefined;
  ratingsEnabled: boolean;
  valueBasis?: SodiumValueBasis;
}): GovernedNutrientAssessmentItem {
  const { rawPer100, perServe, lowMax, highMinExclusive, largePortionThreshold, ratingsEnabled, valueBasis } =
    args;

  if (!isValidAmount(rawPer100)) {
    return { rawPer100: undefined, perServe, level: 'unavailable', triggers: [], valueBasis };
  }

  if (!ratingsEnabled) {
    return { rawPer100, perServe, level: 'unavailable', triggers: [], valueBasis };
  }

  const triggers: GovernedLevelTrigger[] = [];
  const per100Level = levelFromPer100(rawPer100, lowMax, highMinExclusive);
  if (per100Level === 'high') triggers.push('per100');

  let largePortionHigh = false;
  if (
    largePortionThreshold !== undefined &&
    isValidAmount(perServe) &&
    perServe > largePortionThreshold
  ) {
    largePortionHigh = true;
    triggers.push('large_portion');
  }

  let level: GovernedNutrientLevel = per100Level;
  if (largePortionHigh) level = 'high';

  return { rawPer100, perServe, level, triggers, valueBasis };
}

export function assessGovernedNutrients(input: AssessGovernedNutrientsInput): GovernedNutrientAssessment {
  const ref = UK_GOV_FOP_MTL_REFERENCE;
  const limitations: GovernedLimitationCode[] = [];
  const classResult = simulateV02FoodDrinkClass({
    productName: input.productName,
    genericName: input.genericName,
    quantity: input.quantity,
    servingSize: input.servingSize,
    productQuantity: input.productQuantity,
    productQuantityUnit: input.productQuantityUnit,
    servingQuantity: input.servingQuantity,
    servingQuantityUnit: input.servingQuantityUnit ?? input.servingUnit ?? null,
    categoriesTags: input.categoriesTags,
    nutriments: input.nutriments,
    nutritionDataPer: input.nutritionDataPer,
    nutritionDataPreparedPer: input.nutritionDataPreparedPer,
  });
  const productClass: GovernedProductClass = classResult.productClass;
  const per100Basis = resolvePer100Basis(productClass);
  // v0.2 determinant is binary Food/Drink — ratings always enabled once nutrients exist.
  const ratingsEnabled = true;

  // Serving evidence
  let serving: GovernedNutrientAssessment['serving'];
  if (
    input.servingQuantity != null &&
    isValidAmount(input.servingQuantity) &&
    (input.servingUnit === 'g' || input.servingUnit === 'ml')
  ) {
    serving = {
      usable: true,
      quantity: input.servingQuantity,
      unit: input.servingUnit,
      sourceText: input.servingSize?.trim() || `${input.servingQuantity} ${input.servingUnit}`,
    };
  } else {
    const parsed = parseReliableServingSize(input.servingSize);
    if (parsed.usable) {
      serving = {
        usable: true,
        quantity: parsed.quantity,
        unit: parsed.unit,
        sourceText: parsed.sourceText,
      };
    } else {
      serving = { usable: false, reason: parsed.reason, sourceText: parsed.sourceText };
      limitations.push(parsed.reason);
    }
  }

  // Unit must match product class for large-portion / per-serve from per-100
  let servingUsableForClass = serving.usable;
  if (serving.usable) {
    if (productClass === 'food' && serving.unit !== 'g') {
      servingUsableForClass = false;
      limitations.push('serving_unit_mismatch');
    } else if (productClass === 'drink' && serving.unit !== 'ml') {
      servingUsableForClass = false;
      limitations.push('serving_unit_mismatch');
    } else if (productClass === 'unknown') {
      servingUsableForClass = false;
    }
  }

  const n = input.nutriments;
  const satPer100 = getNutrientValue100g(n, 'saturated-fat');
  const sugarsPer100 = getNutrientValue100g(n, 'sugars');
  const { mgPer100: sodiumPer100, valueBasis } = sodiumMgFromNutriments(n);

  if (!isValidAmount(satPer100)) limitations.push('nutrient_missing');
  if (!isValidAmount(sugarsPer100)) limitations.push('nutrient_missing');
  if (!isValidAmount(sodiumPer100)) limitations.push('nutrient_missing');

  const serveQty =
    servingUsableForClass && serving.usable ? serving.quantity : undefined;

  const satPerServe = governedPerServeFromPer100(
    isValidAmount(satPer100) ? satPer100 : undefined,
    serveQty
  );
  const sugarsPerServe = governedPerServeFromPer100(
    isValidAmount(sugarsPer100) ? sugarsPer100 : undefined,
    serveQty
  );
  const sodiumPerServeMg = governedPerServeFromPer100(
    isValidAmount(sodiumPer100) ? sodiumPer100 : undefined,
    serveQty
  );

  const band = productClass === 'drink' ? ref.thresholds.drink : ref.thresholds.food;
  const portion = productClass === 'drink' ? ref.largePortion.drink : ref.largePortion.food;

  let largePortionGate = false;
  if (servingUsableForClass && serving.usable && ratingsEnabled) {
    const min = portion.minServingExclusive;
    if (serving.unit === min.unit && serving.quantity > min.quantity) {
      largePortionGate = true;
    }
  }

  const sat = assessOne({
    rawPer100: isValidAmount(satPer100) ? satPer100 : undefined,
    perServe: satPerServe,
    lowMax: band.saturatedFat_g_per_100.lowMax,
    highMinExclusive: band.saturatedFat_g_per_100.highMinExclusive,
    largePortionThreshold: largePortionGate ? portion.saturatedFat_g : undefined,
    ratingsEnabled,
  });

  const sugars = assessOne({
    rawPer100: isValidAmount(sugarsPer100) ? sugarsPer100 : undefined,
    perServe: sugarsPerServe,
    lowMax: band.totalSugars_g_per_100.lowMax,
    highMinExclusive: band.totalSugars_g_per_100.highMinExclusive,
    largePortionThreshold: largePortionGate ? portion.totalSugars_g : undefined,
    ratingsEnabled,
  });

  const sodium = assessOne({
    rawPer100: isValidAmount(sodiumPer100) ? sodiumPer100 : undefined,
    perServe: sodiumPerServeMg,
    lowMax: band.sodium_mg_per_100.lowMax,
    highMinExclusive: band.sodium_mg_per_100.highMinExclusive,
    largePortionThreshold: largePortionGate ? portion.sodium_mg : undefined,
    ratingsEnabled,
    valueBasis,
  });

  // Deduplicate limitation codes
  const uniqueLimitations = [...new Set(limitations)];

  return {
    standardId: ref.reference_standard_id,
    productClass,
    per100Basis,
    serving: servingUsableForClass || !serving.usable
      ? serving
      : { usable: false, reason: 'serving_unit_mismatch', sourceText: serving.usable ? serving.sourceText : undefined },
    nutrients: {
      saturatedFat: sat,
      totalSugars: sugars,
      sodium,
    },
    limitations: uniqueLimitations,
  };
}

/** Convenience: assess from a Product-like object. */
export function assessGovernedNutrientsFromProduct(
  product: Pick<
    Product,
    | 'nutriments'
    | 'categories_tags'
    | 'serving_size'
    | 'product_name'
    | 'product_name_en'
    | 'generic_name'
    | 'quantity'
    | 'product_quantity'
    | 'product_quantity_unit'
    | 'serving_quantity'
    | 'serving_quantity_unit'
    | 'nutrition_data_per'
    | 'nutrition_data_prepared_per'
  >
): GovernedNutrientAssessment {
  return assessGovernedNutrients({
    nutriments: product.nutriments,
    categoriesTags: product.categories_tags,
    servingSize: product.serving_size,
    productName: product.product_name || product.product_name_en,
    genericName: product.generic_name,
    quantity: product.quantity,
    productQuantity: product.product_quantity,
    productQuantityUnit: product.product_quantity_unit,
    servingQuantity: product.serving_quantity,
    servingQuantityUnit: product.serving_quantity_unit,
    nutritionDataPer: product.nutrition_data_per,
    nutritionDataPreparedPer: product.nutrition_data_prepared_per,
  });
}

export function hasGovernedHighNutrient(assessment: GovernedNutrientAssessment): boolean {
  return (
    assessment.nutrients.saturatedFat.level === 'high' ||
    assessment.nutrients.totalSugars.level === 'high' ||
    assessment.nutrients.sodium.level === 'high'
  );
}

export function formatHighReason(args: {
  nutrientLabel: string;
  item: GovernedNutrientAssessmentItem;
  per100BasisLabel: string;
  highThresholdPer100: number;
  highThresholdPortion: number;
  servingLabel: string;
  formatValue: (n: number) => string;
}): string {
  const { nutrientLabel, item, per100BasisLabel, highThresholdPer100, highThresholdPortion, servingLabel, formatValue } =
    args;
  const hasPer100 = item.triggers.includes('per100');
  const hasPortion = item.triggers.includes('large_portion');
  if (hasPer100 && hasPortion) {
    return `${nutrientLabel} is High under both the standard per-100 comparison and the declared-serving threshold.`;
  }
  if (hasPortion && item.perServe !== undefined) {
    return `${nutrientLabel} is High because the declared ${servingLabel} serving contains ${formatValue(
      item.perServe
    )}, above the UK large-portion High threshold of ${formatValue(highThresholdPortion)}.`;
  }
  if (hasPer100 && item.rawPer100 !== undefined) {
    return `${nutrientLabel} is High because this product contains ${formatValue(
      item.rawPer100
    )} per ${per100BasisLabel}, above the High threshold of ${formatValue(highThresholdPer100)}.`;
  }
  return `${nutrientLabel} is High.`;
}
