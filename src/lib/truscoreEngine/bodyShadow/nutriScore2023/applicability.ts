/**
 * Nutri-Score applicability gate — fail closed when exclusions cannot be ruled out.
 */

import type { NutriScoreApplicabilityReason } from './types';

const ALCOHOLIC_TAGS = [
  'en:alcoholic-beverages',
  'en:beers',
  'en:wines',
  'en:spirits',
];

const EXCLUDED_TAG_PATTERNS: Array<{ pattern: RegExp; reason: NutriScoreApplicabilityReason }> = [
  { pattern: /infant-formul/i, reason: 'infant_formula' },
  { pattern: /follow-on-formul/i, reason: 'infant_formula' },
  { pattern: /foods-for-special-medical-purposes/i, reason: 'special_medical_purpose' },
  { pattern: /meal-replacement/i, reason: 'meal_replacement' },
  { pattern: /food-supplement/i, reason: 'food_supplement' },
  { pattern: /sports-nutrition|sport-nutrition|energy-gel/i, reason: 'sports_nutrition' },
];

export interface ApplicabilityEvidence {
  categoriesTags?: string[];
  abvPercent?: number | null;
}

export function assessNutriScoreApplicability(
  evidence: ApplicabilityEvidence
): { applicable: true } | { applicable: false; reason: NutriScoreApplicabilityReason | string } {
  const tags = evidence.categoriesTags ?? [];

  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (ALCOHOLIC_TAGS.some((t) => lower.includes(t))) {
      return { applicable: false, reason: 'alcoholic_beverage' };
    }
    for (const { pattern, reason } of EXCLUDED_TAG_PATTERNS) {
      if (pattern.test(lower)) {
        return { applicable: false, reason };
      }
    }
  }

  if (evidence.abvPercent !== null && evidence.abvPercent !== undefined && evidence.abvPercent > 1.2) {
    return { applicable: false, reason: 'alcoholic_beverage' };
  }

  return { applicable: true };
}
