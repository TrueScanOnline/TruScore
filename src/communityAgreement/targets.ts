/**
 * Allowlisted group → prevailing subject/version selection.
 * Shared contract: server derives the authoritative set; client recomputes the same set
 * from its snapshot and verifies presentation coverage.
 */

import type { SharedEvidenceSnapshot } from '../evidenceAuthority/types';
import { nutritionField, type NutritionAttribute } from '../ingredientsNutrition/nutritionSchema';
import type { AgreementSubjectVersion, CommunityAgreementGroup } from './types';
import { sortAgreementPairs } from './revision';

/** Attributes NutritionTable can surface via per-100g keys. */
const DISPLAYABLE_NUTRITION_ATTRIBUTES = new Set<string>([
  'energy-kcal',
  'energy-kj',
  'fat',
  'saturated-fat',
  'carbohydrates',
  'sugars',
  'fiber',
  'proteins',
  'sodium',
]);

const NUTRITION_SUBJECT =
  /^ingredients_nutrition\|nutrient:([^|]+)\|basis:per_100g$/;

export function isDisplayableNutritionOffKey(key: string): boolean {
  if (!key.endsWith('_100g')) return false;
  const off = key.slice(0, -'_100g'.length);
  return (
    off === 'energy-kcal' ||
    off === 'energy-kj' ||
    off === 'fat' ||
    off === 'saturated-fat' ||
    off === 'carbohydrates' ||
    off === 'sugars' ||
    off === 'fiber' ||
    off === 'proteins' ||
    off === 'sodium' ||
    off === 'salt'
  );
}

export function nutritionOffKeyForSubjectKey(subjectKey: string): string | null {
  const match = NUTRITION_SUBJECT.exec(subjectKey);
  if (!match) return null;
  const attribute = match[1];
  if (!DISPLAYABLE_NUTRITION_ATTRIBUTES.has(attribute)) return null;
  try {
    const field = nutritionField(attribute as NutritionAttribute);
    return `${field.offNutrient}_100g`;
  } catch {
    return null;
  }
}

function rowQualifies(group: CommunityAgreementGroup, subjectKey: string): boolean {
  if (group === 'nutrition') {
    const match = NUTRITION_SUBJECT.exec(subjectKey);
    if (!match) return false;
    return DISPLAYABLE_NUTRITION_ATTRIBUTES.has(match[1]);
  }
  if (group === 'ingredients') {
    return subjectKey === 'ingredients_nutrition|ingredients_text';
  }
  if (group === 'origins') {
    return subjectKey.startsWith('origins|');
  }
  if (group === 'packet_information') {
    return subjectKey.startsWith('packet_claims|') || subjectKey.startsWith('certifications|');
  }
  return false;
}

/**
 * Complete canonical set of qualifying prevailing community facts for a group.
 * Uses snapshot.prevailing only (admitted + active|review_required).
 */
export function selectAgreementTargets(
  group: CommunityAgreementGroup,
  snapshot: SharedEvidenceSnapshot | null | undefined
): AgreementSubjectVersion[] {
  if (!snapshot?.prevailing?.length) return [];
  const pairs: AgreementSubjectVersion[] = [];
  for (const row of snapshot.prevailing) {
    if (!row.subjectKey || !row.versionId) continue;
    if (!rowQualifies(group, row.subjectKey)) continue;
    pairs.push({ subjectKey: row.subjectKey, versionId: row.versionId });
  }
  return sortAgreementPairs(pairs);
}

export function agreementTargetsEmpty(pairs: AgreementSubjectVersion[]): boolean {
  return pairs.length === 0;
}

export function submitterIdsForAgreementTargets(
  snapshot: SharedEvidenceSnapshot | null | undefined,
  pairs: AgreementSubjectVersion[]
): string[] {
  if (!snapshot?.prevailing?.length || pairs.length === 0) return [];
  const wanted = new Set(pairs.map((pair) => pair.versionId));
  const ids = new Set<string>();
  for (const row of snapshot.prevailing) {
    if (!wanted.has(row.versionId)) continue;
    const submitter = row.evidence?.submitterId?.trim();
    if (submitter) ids.add(submitter);
  }
  return [...ids];
}
