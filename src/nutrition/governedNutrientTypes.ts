/**
 * Governed nutrient assessment types (Wave 3 Nutrition Table Enhancement).
 * Future Claims work may consume these fields; do not add Claims-specific fields here.
 */

export type GovernedProductClass = 'food' | 'drink' | 'unknown';
export type GovernedPer100Basis = '100g' | '100ml' | 'unknown';
export type GovernedNutrientLevel = 'low' | 'moderate' | 'high' | 'unavailable';
export type GovernedLevelTrigger = 'per100' | 'large_portion';
export type SodiumValueBasis = 'sodium' | 'salt_derived';

export type GovernedNutrientKey = 'saturatedFat' | 'totalSugars' | 'sodium';

export type GovernedLimitationCode =
  | 'product_class_unknown'
  | 'serving_unavailable'
  | 'serving_ambiguous'
  | 'serving_count_only'
  | 'serving_unit_mismatch'
  | 'nutrient_missing'
  | 'nutrient_invalid'
  | 'per_serve_basis_unclear'
  | 'preparation_basis_unclear';

export interface GovernedServingEvidence {
  quantity: number;
  unit: 'g' | 'ml';
  sourceText: string;
  usable: true;
}

export interface GovernedNutrientAssessmentItem {
  /** Grams per 100 g/mL for sat fat & sugars; mg per 100 for sodium. */
  rawPer100: number | undefined;
  /** Per-serve in same unit as rawPer100 when usable. */
  perServe?: number;
  level: GovernedNutrientLevel;
  triggers: GovernedLevelTrigger[];
  /** Sodium only. */
  valueBasis?: SodiumValueBasis;
}

export interface GovernedNutrientAssessment {
  standardId: string;
  productClass: GovernedProductClass;
  per100Basis: GovernedPer100Basis;
  serving: GovernedServingEvidence | { usable: false; reason?: GovernedLimitationCode; sourceText?: string };
  nutrients: {
    saturatedFat: GovernedNutrientAssessmentItem;
    totalSugars: GovernedNutrientAssessmentItem;
    sodium: GovernedNutrientAssessmentItem;
  };
  limitations: GovernedLimitationCode[];
}
