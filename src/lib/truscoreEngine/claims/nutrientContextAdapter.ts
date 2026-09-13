/**
 * Nutrient-context adapter — Claims consumes governed Nutrition assessment (NUT-01..06).
 * Does not recalculate thresholds.
 */

import type { GovernedNutrientAssessment } from '../../../nutrition/governedNutrientTypes';
import { UK_GOV_FOP_MTL_REFERENCE } from '../../../nutrition/ukGovFopMtlReference';
import type { ClaimsNutrientContext, ClaimsNutrientEntry } from './types';

function mapEntry(
  item: GovernedNutrientAssessment['nutrients']['totalSugars']
): ClaimsNutrientEntry {
  const high =
    item.level === 'high'
      ? item.triggers.includes('large_portion')
        ? ('large_portion_override' as const)
        : ('threshold' as const)
      : null;
  return {
    level: item.level,
    per_100_value: item.rawPer100,
    per_portion_value: item.perServe,
    high_reason: high,
  };
}

/**
 * Build the versioned nutrient-context object Claims must consume.
 */
export function buildClaimsNutrientContext(
  assessment: GovernedNutrientAssessment | null | undefined
): ClaimsNutrientContext | null {
  if (!assessment) return null;

  const total_sugars = mapEntry(assessment.nutrients.totalSugars);
  const saturated_fat = mapEntry(assessment.nutrients.saturatedFat);
  const sodium = mapEntry(assessment.nutrients.sodium);

  const high_nutrient_labels: ClaimsNutrientContext['high_nutrient_labels'] = [];
  if (total_sugars.level === 'high') high_nutrient_labels.push('total sugars');
  if (saturated_fat.level === 'high') high_nutrient_labels.push('saturated fat');
  if (sodium.level === 'high') high_nutrient_labels.push('sodium');

  const levels = [total_sugars.level, saturated_fat.level, sodium.level];
  const required_context_complete = levels.every((l) => l !== 'unavailable');
  const any_governed_high = high_nutrient_labels.length > 0;

  const basis =
    assessment.productClass === 'drink'
      ? 'drink'
      : assessment.productClass === 'food'
        ? 'food'
        : 'unknown';

  const large_portion_override =
    assessment.nutrients.totalSugars.triggers.includes('large_portion') ||
    assessment.nutrients.saturatedFat.triggers.includes('large_portion') ||
    assessment.nutrients.sodium.triggers.includes('large_portion');

  return {
    standard_version: assessment.standardId || UK_GOV_FOP_MTL_REFERENCE.reference_standard_id,
    basis,
    large_portion_override,
    nutrients: { total_sugars, saturated_fat, sodium },
    required_context_complete,
    any_governed_high,
    high_nutrient_labels,
  };
}
