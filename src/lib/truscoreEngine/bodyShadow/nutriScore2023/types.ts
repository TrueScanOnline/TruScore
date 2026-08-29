/**
 * Shadow-only Nutri-Score 2023 normalized input contract.
 * Source-neutral — no OFF field names in the core calculator.
 */

export type NutriScoreGrade = 'a' | 'b' | 'c' | 'd' | 'e';

export type NutriScore2023Branch =
  | 'general_foods'
  | 'cheese'
  | 'red_meat'
  | 'fats_oils_nuts_seeds'
  | 'beverages'
  | 'water';

export type NutriScoreApplicability =
  | 'applicable'
  | 'not_applicable'
  | 'unknown_applicability';

export type NutriScoreApplicabilityReason =
  | 'alcoholic_beverage'
  | 'infant_formula'
  | 'special_medical_purpose'
  | 'meal_replacement'
  | 'food_supplement'
  | 'sports_nutrition'
  | 'other_excluded';

/** Nullable numeric — null means unknown; must not be coerced to zero in calculation. */
export interface NutriScore2023Inputs {
  branch: NutriScore2023Branch;
  basis: 'per_100g' | 'per_100ml';
  energyKj: number | null;
  saturatedFatG: number | null;
  sugarsG: number | null;
  saltG: number | null;
  proteinG: number | null;
  fibreG: number | null;
  /** FVL percentage 0–100 when known exactly. */
  fvlPercent: number | null;
  /** Pre-resolved FVL points when percentage band is established without guessing. */
  fvlPoints: number | null;
  totalFatG: number | null;
  nonNutritiveSweetenersPresent: boolean | null;
  isWater: boolean;
}

export type NutriScore2023Outcome =
  | {
      kind: 'calculated';
      numericScore: number;
      grade: NutriScoreGrade;
      branch: NutriScore2023Branch;
      negativePoints: number;
      positivePoints: number;
      path: 'complete_input';
    }
  | {
      kind: 'bounds_invariant_grade';
      grade: NutriScoreGrade;
      branch: NutriScore2023Branch;
      path: 'bounds_invariance';
    }
  | {
      kind: 'unresolved';
      reason: string;
      branch?: NutriScore2023Branch;
    }
  | {
      kind: 'not_applicable';
      reason: NutriScoreApplicabilityReason | string;
    };

export type ShadowClassification =
  | 'LOCAL_COMPLETE_INPUT_GRADE_RECOVERED'
  | 'BOUNDS_INVARIANT_GRADE'
  | 'INSUFFICIENT_DETERMINISTIC_EVIDENCE'
  | 'NUTRISCORE_NOT_APPLICABLE'
  | 'WHOLE_PRODUCE_CANDIDATE'
  | 'OFF_GRADE_PRESENT_NO_LOCAL_RECOVERY';
