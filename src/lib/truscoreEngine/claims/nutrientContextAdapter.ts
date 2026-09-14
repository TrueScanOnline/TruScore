/**
 * Nutrient-context adapter — Claims consumes governed Nutrition assessment (NUT-01..06).
 * Does not recalculate thresholds.
 * Persists two distinct identities: founder methodology vs threshold/reference asset.
 */

import type { GovernedNutrientAssessment } from '../../../nutrition/governedNutrientTypes';
import { UK_GOV_FOP_MTL_REFERENCE } from '../../../nutrition/ukGovFopMtlReference';
import type { ClaimsNutrientContext, ClaimsNutrientEntry } from './types';
import {
  CLAIMS_NUTRIENT_METHODOLOGY_VERSION,
  CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
} from './types';

function mapEntry(
  item: GovernedNutrientAssessment['nutrients']['totalSugars'],
  sourceEvidenceId: string
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
    source_evidence_id: sourceEvidenceId,
  };
}

function emptyUnavailableEntry(sourceEvidenceId: string): ClaimsNutrientEntry {
  return {
    level: 'unavailable',
    high_reason: null,
    source_evidence_id: sourceEvidenceId,
  };
}

/**
 * Build the versioned nutrient-context object Claims must consume.
 * When assessment is null, still emit both version identities (never empty strings).
 */
export function buildClaimsNutrientContext(
  assessment: GovernedNutrientAssessment | null | undefined
): ClaimsNutrientContext | null {
  const methodology = CLAIMS_NUTRIENT_METHODOLOGY_VERSION;
  const assetId =
    assessment?.standardId ||
    UK_GOV_FOP_MTL_REFERENCE.reference_standard_id ||
    CLAIMS_NUTRIENT_REFERENCE_ASSET_ID;

  if (!assessment) {
    // Caller may still need version identities on the assessment result; return a
    // null context for scoring arithmetic, versions live on ClaimsAssessmentResult.
    return null;
  }

  const sourceEvidenceId = `governed-nutrient:${assetId}`;
  const total_sugars = mapEntry(assessment.nutrients.totalSugars, sourceEvidenceId);
  const saturated_fat = mapEntry(assessment.nutrients.saturatedFat, sourceEvidenceId);
  const sodium = mapEntry(assessment.nutrients.sodium, sourceEvidenceId);

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
    standard_version: assetId,
    nutrient_methodology_version: methodology,
    nutrient_reference_asset_id: assetId,
    basis,
    large_portion_override,
    nutrients: { total_sugars, saturated_fat, sodium },
    required_context_complete,
    any_governed_high,
    high_nutrient_labels,
  };
}

/** Version identities when nutrient assessment is unavailable. */
export function claimsNutrientVersionIdentities(): {
  nutrient_methodology_version: string;
  nutrient_reference_asset_id: string;
  nutrient_standard_version: string;
} {
  return {
    nutrient_methodology_version: CLAIMS_NUTRIENT_METHODOLOGY_VERSION,
    nutrient_reference_asset_id: CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
    nutrient_standard_version: CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
  };
}

/** Test helper — empty unavailable entries retain source_evidence_id. */
export function __testEmptyNutrientEntry(id: string): ClaimsNutrientEntry {
  return emptyUnavailableEntry(id);
}
