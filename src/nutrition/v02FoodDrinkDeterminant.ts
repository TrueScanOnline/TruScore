/**
 * v0.2 Food / Drink determinant (Wave 3 Nutrition Table Enhancement).
 * Implements section 8 of Rveel_Wave3_Nutrition_Table_Enhancement_Cursor_Implementation_Specification_20260913_v0_2.
 * Frozen after Stage 1/2 founder acceptance; production-wired via assessGovernedNutrients (Stage 3).
 * Export name retained for continuity with Stage 1/2 simulation evidence.
 */

import { getNutrientValue100g } from '../utils/nutritionPer100g';
import type { ProductNutriments } from '../types/product';

export type V02ProductClass = 'food' | 'drink';

export type V02ProvisionalDrinkStep = 'step1_volume' | 'step2_prepared' | 'step3_explicit_identity' | null;

export interface V02FoodDrinkDeterminantInput {
  productName?: string | null;
  genericName?: string | null;
  quantity?: string | null;
  servingSize?: string | null;
  productQuantity?: number | null;
  productQuantityUnit?: string | null;
  servingQuantity?: number | null;
  servingQuantityUnit?: string | null;
  categoriesTags?: string[] | null;
  nutriments?: ProductNutriments;
  nutritionDataPer?: string | null;
  nutritionDataPreparedPer?: string | null;
}

export interface V02FoodDrinkDeterminantResult {
  productClass: V02ProductClass;
  provisionalDrink: boolean;
  provisionalDrinkStep: V02ProvisionalDrinkStep;
  provisionalDrinkEvidence: string[];
  foodVetoEvidence: string | null;
  foodVetoFamily: string | null;
  per100BasisLimitation: string | null;
}

const PREPARED_DRINK_PHRASES = [
  'drink powder',
  'powdered drink',
  'beverage powder',
  'powdered beverage',
  'milkshake powder',
  'milkshake syrup',
  'hot chocolate powder',
  'cocoa drink powder',
  'cocoa beverage powder',
  'malted milk powder',
] as const;

const EXPLICIT_DRINK_PHRASES = [
  'yoghurt drink',
  'yogurt drink',
  'yoghurt drinks',
  'yogurt drinks',
] as const;

const EXPLICIT_DRINK_WHOLE_WORDS = ['drink', 'drinks', 'beverage', 'beverages'] as const;

const EXACT_DRINK_CATEGORY_LOCAL_IDS = new Set(['beverage', 'beverages', 'drink', 'drinks']);

interface FoodVetoFamily {
  id: string;
  nameTerms: string[];
  offLocalIds: string[];
  /** When true, name match on `term` requires the normalised local-id to equal `term` (oil family). */
  exactLocalIdOnly?: boolean;
  /** OFF local-ids that must not match this family (oilseed exclusion). */
  offLocalIdExclusions?: string[];
}

const FOOD_VETO_FAMILIES: FoodVetoFamily[] = [
  {
    id: 'soup_broth',
    nameTerms: ['soup', 'soups', 'broth', 'broths'],
    offLocalIds: ['soup', 'soups', 'broth', 'broths'],
  },
  {
    id: 'sauce_gravy',
    nameTerms: ['sauce', 'sauces', 'gravy', 'gravies'],
    offLocalIds: ['sauce', 'sauces', 'gravy', 'gravies'],
  },
  {
    id: 'dressing',
    nameTerms: ['dressing', 'dressings'],
    offLocalIds: ['dressing', 'dressings'],
  },
  {
    id: 'condiment',
    nameTerms: ['condiment', 'condiments'],
    offLocalIds: ['condiment', 'condiments'],
  },
  {
    id: 'oil',
    nameTerms: ['oil', 'oils'],
    offLocalIds: ['oil', 'oils'],
    offLocalIdExclusions: ['oilseed', 'oilseeds'],
  },
  {
    id: 'honey',
    nameTerms: ['honey', 'honeys'],
    offLocalIds: ['honey', 'honeys'],
  },
  {
    id: 'ice_cream',
    nameTerms: ['ice cream', 'ice-cream', 'ice creams', 'frozen dessert', 'frozen desserts'],
    offLocalIds: ['ice cream', 'ice-cream', 'ice creams', 'frozen dessert', 'frozen desserts'],
  },
  {
    id: 'yoghurt',
    nameTerms: ['yoghurt', 'yoghurts', 'yogurt', 'yogurts', 'drinking yoghurt', 'drinking yogurt'],
    offLocalIds: ['yoghurt', 'yoghurts', 'yogurt', 'yogurts', 'drinking yoghurt', 'drinking yogurt'],
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Section 8.2 — normalise hyphens/underscores/punctuation to spaces; case-insensitive matching. */
export function normalizeDeterminantText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[-_/.,;:!?()[\]{}'"&+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWholeWordOrPhrase(haystack: string, term: string): boolean {
  const normHaystack = normalizeDeterminantText(haystack);
  const normTerm = normalizeDeterminantText(term);
  if (!normHaystack || !normTerm) return false;
  if (normTerm.includes(' ')) {
    return normHaystack.includes(normTerm);
  }
  const pattern = new RegExp(`(?:^|\\s)${escapeRegex(normTerm)}(?:\\s|$)`);
  return pattern.test(normHaystack);
}

function extractOffLocalIds(categoriesTags?: string[] | null): string[] {
  if (!categoriesTags?.length) return [];
  return categoriesTags.map((tag) => {
    const raw = tag.includes(':') ? tag.slice(tag.indexOf(':') + 1) : tag;
    return normalizeDeterminantText(raw.replace(/-/g, ' '));
  });
}

function identityText(input: V02FoodDrinkDeterminantInput): string {
  return [input.productName, input.genericName].filter(Boolean).join(' ');
}

function isStructuredUnitPresent(unit: string | null | undefined): boolean {
  return typeof unit === 'string' && unit.trim().length > 0;
}

function isVolumeStructuredUnit(unit: string | null | undefined): boolean {
  if (!isStructuredUnitPresent(unit)) return false;
  const u = unit!.trim().toLowerCase();
  return u === 'ml' || u === 'l' || u === 'cl' || u === 'litre' || u === 'litres' || u === 'liter' || u === 'liters';
}

const VOLUME_TEXT_PATTERN =
  /(\d+(?:[.,]\d+)?)\s*(ml|mL|cl|cL|l|L|litre|litres|liter|liters)\b/gi;

function parseVolumeAmountsFromText(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(VOLUME_TEXT_PATTERN.source, VOLUME_TEXT_PATTERN.flags);
  while ((match = pattern.exec(text)) !== null) {
    matches.push(`${match[1]} ${match[2]}`);
  }
  return matches;
}

function hasWeightEvidenceInText(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return /\d+(?:[.,]\d+)?\s*(g|gram|grams|kg|kilogram|kilograms)\b/i.test(text);
}

/**
 * Step 1 volume evidence (founder Stage 1 corrective):
 * - If both structured units are present, both must be volume for structured fields to establish Drink.
 * - If only one structured unit is present, that unit alone may establish Drink when it is volume.
 * - Raw-text volume fallback applies only for fields whose corresponding structured unit is absent.
 * - No mass↔volume conversion or density inference.
 */
function evaluateStep1Volume(input: V02FoodDrinkDeterminantInput): string[] {
  const evidence: string[] = [];

  const productUnitPresent = isStructuredUnitPresent(input.productQuantityUnit);
  const servingUnitPresent = isStructuredUnitPresent(input.servingQuantityUnit);
  const productIsVolume = isVolumeStructuredUnit(input.productQuantityUnit);
  const servingIsVolume = isVolumeStructuredUnit(input.servingQuantityUnit);

  if (productUnitPresent && servingUnitPresent) {
    if (productIsVolume && servingIsVolume) {
      evidence.push(`structured product quantity unit is volume (${input.productQuantityUnit})`);
      evidence.push(`structured serving quantity unit is volume (${input.servingQuantityUnit})`);
    }
    // Conflicting structured units (e.g. g + ml) do not establish provisional Drink.
    return evidence;
  }

  if (productUnitPresent && productIsVolume) {
    evidence.push(`structured product quantity unit is volume (${input.productQuantityUnit})`);
  }
  if (servingUnitPresent && servingIsVolume) {
    evidence.push(`structured serving quantity unit is volume (${input.servingQuantityUnit})`);
  }

  if (evidence.length > 0) {
    return evidence;
  }

  // Raw-text fallback only where the corresponding structured unit is absent.
  const quantityVolumes = productUnitPresent ? [] : parseVolumeAmountsFromText(input.quantity);
  const servingVolumes = servingUnitPresent ? [] : parseVolumeAmountsFromText(input.servingSize);
  const allVolumeSnippets = [...quantityVolumes, ...servingVolumes];

  const quantityHasWeight = productUnitPresent ? false : hasWeightEvidenceInText(input.quantity);
  const servingHasWeight = servingUnitPresent ? false : hasWeightEvidenceInText(input.servingSize);

  if (allVolumeSnippets.length === 1 && !quantityHasWeight && !servingHasWeight) {
    evidence.push(`unambiguous volume amount in quantity/serving text (${allVolumeSnippets[0]})`);
  } else if (allVolumeSnippets.length === 1 && quantityHasWeight !== servingHasWeight) {
    evidence.push(`unambiguous volume amount in quantity/serving text (${allVolumeSnippets[0]})`);
  }

  return evidence;
}

function hasReliablePreparedNutrition(input: V02FoodDrinkDeterminantInput): boolean {
  if (input.nutritionDataPreparedPer?.trim()) return true;
  const nutriments = input.nutriments;
  if (!nutriments) return false;

  const preparedKeys = Object.keys(nutriments).filter((key) => key.includes('prepared'));
  if (preparedKeys.length === 0) return false;

  const ratedKeys = ['saturated-fat', 'sugars', 'sodium', 'salt', 'energy'];
  return ratedKeys.some((base) => {
    const direct = nutriments[`${base}_prepared_100g` as keyof ProductNutriments];
    const alt = nutriments[`${base}_prepared_100ml` as keyof ProductNutriments];
    const val = direct ?? alt;
    return typeof val === 'number' && Number.isFinite(val) && val >= 0;
  });
}

function evaluateStep2Prepared(input: V02FoodDrinkDeterminantInput): string[] {
  const identity = identityText(input);
  const matchedPhrase = PREPARED_DRINK_PHRASES.find((phrase) => containsWholeWordOrPhrase(identity, phrase));
  if (!matchedPhrase) return [];
  if (!hasReliablePreparedNutrition(input)) return [];
  return [`prepared-drink identity phrase "${matchedPhrase}" with reliable prepared nutrition`];
}

function evaluateStep3ExplicitIdentity(input: V02FoodDrinkDeterminantInput): string[] {
  const evidence: string[] = [];
  const identity = identityText(input);

  for (const phrase of EXPLICIT_DRINK_PHRASES) {
    if (containsWholeWordOrPhrase(identity, phrase)) {
      evidence.push(`explicit drink phrase "${phrase}" in product identity`);
      return evidence;
    }
  }

  for (const word of EXPLICIT_DRINK_WHOLE_WORDS) {
    if (containsWholeWordOrPhrase(identity, word)) {
      evidence.push(`whole word "${word}" in product identity`);
      return evidence;
    }
  }

  const localIds = extractOffLocalIds(input.categoriesTags);
  for (const localId of localIds) {
    const compact = localId.replace(/\s+/g, ' ');
    if (EXACT_DRINK_CATEGORY_LOCAL_IDS.has(compact)) {
      evidence.push(`OFF category local-id exactly "${compact}"`);
      return evidence;
    }
  }

  return evidence;
}

const YOGHURT_DRINK_OFF_LOCAL_IDS = new Set([
  'yoghurt drink',
  'yogurt drink',
  'yoghurt drinks',
  'yogurt drinks',
]);

/**
 * Explicit yoghurt/yogurt-drink exception (evaluated before the broader yoghurt Food-veto).
 * Matches product/generic name phrases or OFF local-ids in the yoghurt/yogurt-drink family.
 * Does not treat literal "drinking yoghurt/yogurt" as the drink exception.
 */
function isYoghurtDrinkException(input: V02FoodDrinkDeterminantInput): boolean {
  const identity = identityText(input);
  if (EXPLICIT_DRINK_PHRASES.some((phrase) => containsWholeWordOrPhrase(identity, phrase))) {
    return true;
  }
  const localIds = extractOffLocalIds(input.categoriesTags);
  return localIds.some((localId) => YOGHURT_DRINK_OFF_LOCAL_IDS.has(localId.replace(/\s+/g, ' ')));
}

function localIdMatchesTerm(localId: string, term: string, family: FoodVetoFamily): boolean {
  const normTerm = normalizeDeterminantText(term);
  const normLocal = localId.replace(/-/g, ' ');

  if (family.id === 'oil') {
    if (family.offLocalIdExclusions?.some((ex) => normLocal === normalizeDeterminantText(ex) || normLocal.includes(normalizeDeterminantText(ex)))) {
      return false;
    }
    return normLocal === normTerm || normLocal.endsWith(` ${normTerm}`) || normLocal.startsWith(`${normTerm} `);
  }

  if (family.id === 'ice_cream') {
    return normLocal.includes(normTerm);
  }

  return normLocal === normTerm || containsWholeWordOrPhrase(normLocal, normTerm);
}

function nameMatchesVetoTerm(identity: string, term: string, family: FoodVetoFamily): boolean {
  if (family.id === 'oil' && /\boilseed\b/i.test(identity)) {
    return false;
  }
  return containsWholeWordOrPhrase(identity, term);
}

function evaluateFoodVeto(input: V02FoodDrinkDeterminantInput): { family: string; evidence: string } | null {
  const identity = identityText(input);
  const localIds = extractOffLocalIds(input.categoriesTags);
  const yoghurtDrinkException = isYoghurtDrinkException(input);

  for (const family of FOOD_VETO_FAMILIES) {
    // Broader yoghurt/yogurt ancestor must not veto when explicit yoghurt/yogurt-drink evidence exists.
    if (family.id === 'yoghurt' && yoghurtDrinkException) {
      continue;
    }

    for (const term of family.nameTerms) {
      if (nameMatchesVetoTerm(identity, term, family)) {
        return {
          family: family.id,
          evidence: `Food-veto family "${family.id}" via name term "${term}"`,
        };
      }
    }
    for (const localId of localIds) {
      for (const term of family.offLocalIds) {
        if (localIdMatchesTerm(localId, term, family)) {
          return {
            family: family.id,
            evidence: `Food-veto family "${family.id}" via OFF local-id "${localId}" matching "${term}"`,
          };
        }
      }
    }
  }

  return null;
}

function hasReliable100gBasis(nutriments?: ProductNutriments): boolean {
  if (!nutriments) return false;
  const keys = ['saturated-fat', 'sugars', 'sodium', 'salt', 'energy'];
  return keys.some((key) => {
    const val = getNutrientValue100g(nutriments, key);
    return val !== undefined && Number.isFinite(val);
  });
}

function evaluatePer100BasisLimitation(
  input: V02FoodDrinkDeterminantInput,
  foodVetoFamily: string | null
): string | null {
  if (!foodVetoFamily) return null;

  const per = (input.nutritionDataPer ?? '').trim().toLowerCase();
  const isExplicit100ml = per === '100ml' || per === '100 ml';
  const has100g = hasReliable100gBasis(input.nutriments);

  if (isExplicit100ml && !has100g) {
    return 'Food-veto product: nutrients on 100 mL basis only; no reliable 100 g basis — H/M/L would require density assumption';
  }

  if (!has100g && input.nutriments) {
    const has100ml = Object.keys(input.nutriments).some(
      (k) => k.endsWith('_100ml') && typeof input.nutriments![k as keyof ProductNutriments] === 'number'
    );
    if (has100ml && !has100g) {
      return 'Food-veto product: nutrients on 100 mL basis only; no reliable 100 g basis — H/M/L would require density assumption';
    }
  }

  return null;
}

/**
 * Simulate v0.2 Food / Drink classification per specification section 8.
 * Drink must be affirmatively established; otherwise Food.
 */
export function simulateV02FoodDrinkClass(input: V02FoodDrinkDeterminantInput): V02FoodDrinkDeterminantResult {
  const step1 = evaluateStep1Volume(input);
  const step2 = step1.length === 0 ? evaluateStep2Prepared(input) : [];
  const step3 = step1.length === 0 && step2.length === 0 ? evaluateStep3ExplicitIdentity(input) : [];

  let provisionalDrinkStep: V02ProvisionalDrinkStep = null;
  let provisionalDrinkEvidence: string[] = [];

  if (step1.length > 0) {
    provisionalDrinkStep = 'step1_volume';
    provisionalDrinkEvidence = step1;
  } else if (step2.length > 0) {
    provisionalDrinkStep = 'step2_prepared';
    provisionalDrinkEvidence = step2;
  } else if (step3.length > 0) {
    provisionalDrinkStep = 'step3_explicit_identity';
    provisionalDrinkEvidence = step3;
  }

  const provisionalDrink = provisionalDrinkEvidence.length > 0;

  let foodVeto: { family: string; evidence: string } | null = null;
  if (provisionalDrink) {
    foodVeto = evaluateFoodVeto(input);
  }

  const productClass: V02ProductClass = provisionalDrink && !foodVeto ? 'drink' : 'food';
  const per100BasisLimitation = evaluatePer100BasisLimitation(input, foodVeto?.family ?? null);

  return {
    productClass,
    provisionalDrink,
    provisionalDrinkStep,
    provisionalDrinkEvidence,
    foodVetoEvidence: foodVeto?.evidence ?? null,
    foodVetoFamily: foodVeto?.family ?? null,
    per100BasisLimitation,
  };
}
