/**
 * Nutrient-context adapter — Claims consumes governed Nutrition assessment (NUT-01..06).
 * Does not recalculate thresholds.
 * Persists two distinct identities: founder methodology vs threshold/reference asset.
 *
 * Controlling reference asset is always CLAIMS_NUTRIENT_REFERENCE_ASSET_ID — never overridden
 * by a legacy/generic assessment.standardId. Upstream standardId may be preserved diagnostically.
 */

import type { GovernedNutrientAssessment } from '../../../nutrition/governedNutrientTypes';
import type { ClaimsNutrientContext, ClaimsNutrientEntry } from './types';
import {
  CLAIMS_NUTRIENT_METHODOLOGY_VERSION,
  CLAIMS_NUTRIENT_REFERENCE_ASSET_ID,
} from './types';

export interface BuildClaimsNutrientContextOptions {
  /**
   * Product GTIN/barcode for product-bound nutrient evidence pointers.
   * Identifies which product the governed nutrient assessment outcome was built for —
   * not an OFF evidence object and not the asset id alone.
   */
  productBarcode?: string | null;
}

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
 * Smallest deterministic product-bound pointer to a governed nutrient assessment outcome.
 * Format: governed-nutrient-assessment:{barcode}:{nutrientKey}
 * Identifies the Claims-consumed Nutrition assessment result for that product+nutrient —
 * not the threshold asset and not a packet evidence object.
 */
export function claimsNutrientSourceEvidenceId(
  productBarcode: string | null | undefined,
  nutrientKey: 'total_sugars' | 'saturated_fat' | 'sodium'
): string {
  const gtin = (productBarcode && String(productBarcode).trim()) || 'unknown';
  return `governed-nutrient-assessment:${gtin}:${nutrientKey}`;
}

/**
 * Build the versioned nutrient-context object Claims must consume.
 * When assessment is null, return null (version identities live on ClaimsAssessmentResult).
 */
export function buildClaimsNutrientContext(
  assessment: GovernedNutrientAssessment | null | undefined,
  options?: BuildClaimsNutrientContextOptions
): ClaimsNutrientContext | null {
  const methodology = CLAIMS_NUTRIENT_METHODOLOGY_VERSION;
  // Controlling identity — never let legacy/generic assessment.standardId override.
  const referenceAssetId = CLAIMS_NUTRIENT_REFERENCE_ASSET_ID;
  const upstreamStandardId =
    assessment?.standardId && assessment.standardId !== referenceAssetId
      ? assessment.standardId
      : undefined;

  if (!assessment) {
    return null;
  }

  const barcode = options?.productBarcode;
  const total_sugars = mapEntry(
    assessment.nutrients.totalSugars,
    claimsNutrientSourceEvidenceId(barcode, 'total_sugars')
  );
  const saturated_fat = mapEntry(
    assessment.nutrients.saturatedFat,
    claimsNutrientSourceEvidenceId(barcode, 'saturated_fat')
  );
  const sodium = mapEntry(
    assessment.nutrients.sodium,
    claimsNutrientSourceEvidenceId(barcode, 'sodium')
  );

  const high_nutrient_labels: ClaimsNutrientContext['high_nutrient_labels'] = [];
  if (total_sugars.level === 'high') high_nutrient_labels.push('total sugars');
  if (saturated_fat.level === 'high') high_nutrient_labels.push('saturated fat');
  if (sodium.level === 'high') high_nutrient_labels.push('sodium');

  const levels = [total_sugars.level, saturated_fat.level, sodium.level];
  const required_context_complete = levels.every((l) => l !== 'unavailable');
  const any_governed_high = high_nutrient_labels.length > 0;

  // Accepted upstream contract is binary food | drink (no Claims 'unknown' basis).
  const basis: 'food' | 'drink' = assessment.productClass === 'drink' ? 'drink' : 'food';

  const large_portion_override =
    assessment.nutrients.totalSugars.triggers.includes('large_portion') ||
    assessment.nutrients.saturatedFat.triggers.includes('large_portion') ||
    assessment.nutrients.sodium.triggers.includes('large_portion');

  return {
    standard_version: referenceAssetId,
    nutrient_methodology_version: methodology,
    nutrient_reference_asset_id: referenceAssetId,
    ...(upstreamStandardId ? { upstream_standard_id: upstreamStandardId } : {}),
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
