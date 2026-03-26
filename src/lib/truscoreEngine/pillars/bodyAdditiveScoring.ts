/**
 * Body Pillar — Food Additives of Concern (MVP)
 * Body_Scoring_Specification_V12 + Implementation Guidance v1.3
 *
 * Curated registry only (additiveDatabase.ts bodyConcernTier); exact matching only.
 */

import { Product } from '../../../types/product';
import { getAdditiveInfo, AdditiveInfo } from '../../../services/additiveDatabase';

export type BodyConcernTier = 'yellow' | 'orange' | 'red';

const TIER_DEDUCTION: Record<BodyConcernTier, number> = {
  yellow: 1,
  orange: 3,
  red: 6,
};

const MVP_ELEMENT_CAP = 8;

/** Max total Body score when any Red-tier MVP additive is present (before floor 2). */
export const BODY_RED_ADDITIVE_SCORE_CEILING = 12;

export function deductionForBodyConcernTier(tier: BodyConcernTier): number {
  return TIER_DEDUCTION[tier];
}

export function getBodyConcernTierFromInfo(info: AdditiveInfo | null): BodyConcernTier | null {
  return info?.bodyConcernTier ?? null;
}

/**
 * Normalize Open Food Facts additive tag to canonical e-number key (e.g. e102).
 */
export function normalizeOffAdditiveTag(tag: string): string | null {
  const t = tag.toLowerCase().trim();
  const m = t.match(/^en:?(e\d+[a-z]?)$/);
  const eNum = m ? m[1] : t.replace(/^en:/, '');
  if (/^e\d+[a-z]?$/.test(eNum)) {
    return eNum;
  }
  return null;
}

/**
 * Phase 1 exact label forms per Body_Scoring_Specification_V12 Additives Registry v1 (MVP core rows).
 * Matching is case-insensitive; implements E-number variants and class+number/name/alias forms.
 */
const MVP_TEXT_FORMS: Record<string, string[]> = {
  e250: [
    'e250',
    'e 250',
    'e-250',
    '250',
    'sodium nitrite',
    'preservative (250)',
    'preservative (sodium nitrite)',
  ],
  e171: [
    'e171',
    'e 171',
    'e-171',
    '171',
    'titanium dioxide',
    'colour (171)',
    'color (171)',
    'colour (titanium dioxide)',
    'color (titanium dioxide)',
  ],
  e951: [
    'e951',
    'e 951',
    'e-951',
    '951',
    'aspartame',
    'sweetener (951)',
    'sweetener (aspartame)',
  ],
  e102: [
    'e102',
    'e 102',
    'e-102',
    '102',
    'tartrazine',
    'colour (102)',
    'color (102)',
    'colour (tartrazine)',
    'color (tartrazine)',
  ],
  e110: [
    'e110',
    'e 110',
    'e-110',
    '110',
    'sunset yellow',
    'sunset yellow fcf',
    'colour (110)',
    'color (110)',
    'colour (sunset yellow fcf)',
    'color (sunset yellow fcf)',
  ],
  e129: [
    'e129',
    'e 129',
    'e-129',
    '129',
    'allura red',
    'allura red ac',
    'colour (129)',
    'color (129)',
    'colour (allura red ac)',
    'color (allura red ac)',
  ],
};

const MVP_IDS = Object.keys(MVP_TEXT_FORMS) as string[];

function normalizeIngredientsForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Exact controlled match for a single label form (Phase 1 — no fuzzy matching).
 */
function ingredientsMatchForm(haystackLower: string, form: string): boolean {
  const f = form.trim().toLowerCase();
  if (!f) return false;

  // Bare numeric additive code (e.g. 250) — avoid matching inside longer numbers
  if (/^\d+[a-z]?$/i.test(f)) {
    return new RegExp(`(^|[^0-9a-z])${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^0-9a-z]|$)`, 'i').test(
      haystackLower
    );
  }

  // E-number with optional spaces / hyphen (E250, E 250, E-250)
  const eCompact = f.replace(/\s/g, '');
  if (/^e-?\d+[a-z]?$/i.test(eCompact)) {
    const num = eCompact.replace(/^e-?/i, '');
    return new RegExp(`\\be\\s*-?\\s*${num}\\b`, 'i').test(haystackLower);
  }

  // Phrases (alias, class + name, etc.)
  const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystackLower);
}

function findMvpIdsInIngredientsText(ingredientsText: string): string[] {
  const hay = normalizeIngredientsForMatching(ingredientsText);
  const found = new Set<string>();
  for (const id of MVP_IDS) {
    const forms = MVP_TEXT_FORMS[id];
    for (const form of forms) {
      if (ingredientsMatchForm(hay, form)) {
        found.add(id);
        break;
      }
    }
  }
  return [...found];
}

function allTagsFailNormalization(tags: string[] | undefined): boolean {
  if (!tags || tags.length === 0) return true;
  return tags.every((t) => !normalizeOffAdditiveTag(t));
}

function getNormalizedTagIds(tags: string[] | undefined): string[] {
  const ids = new Set<string>();
  for (const tag of tags || []) {
    const id = normalizeOffAdditiveTag(tag);
    if (id) ids.add(id);
  }
  return [...ids];
}

export interface BodyMvpAdditiveMatch {
  canonicalId: string;
  name: string;
  tier: BodyConcernTier;
  deduction: number;
}

export interface BodyMvpAdditiveScoreResult {
  matches: BodyMvpAdditiveMatch[];
  /** Sum of per-additive deductions before element cap (for debugging). */
  rawSumDeduction: number;
  /** Total deduction from this element after cap (-8 max). */
  elementDeduction: number;
  hasRedTier: boolean;
}

/**
 * Collect MVP additive matches for food/beverage products using OFF tags + optional exact text fallback.
 */
export function scoreBodyMvpAdditives(product: Product): BodyMvpAdditiveScoreResult {
  const tags = product.additives_tags;
  const text = product.ingredients_text || '';

  const tagIds = getNormalizedTagIds(tags);
  const tagMvp: string[] = [];
  for (const id of tagIds) {
    const info = getAdditiveInfo(id);
    const tier = getBodyConcernTierFromInfo(info);
    if (tier) tagMvp.push(id);
  }

  const textHitIds = findMvpIdsInIngredientsText(text);
  const absent = allTagsFailNormalization(tags);
  const textOnly = textHitIds.filter((id) => !tagIds.includes(id));
  const incomplete = tagIds.length > 0 && textOnly.length > 0;

  let combinedIds: string[];
  if (absent) {
    combinedIds = [...new Set([...tagMvp, ...textHitIds])];
  } else if (incomplete) {
    combinedIds = [...new Set([...tagMvp, ...textOnly])];
  } else {
    combinedIds = [...tagMvp];
  }

  const matches: BodyMvpAdditiveMatch[] = [];
  let rawSum = 0;
  let hasRed = false;

  for (const id of combinedIds) {
    const info = getAdditiveInfo(id);
    if (!info) continue;
    const tier = getBodyConcernTierFromInfo(info);
    if (!tier) continue;
    const d = deductionForBodyConcernTier(tier);
    rawSum += d;
    if (tier === 'red') hasRed = true;
    matches.push({
      canonicalId: id,
      name: info.name,
      tier,
      deduction: d,
    });
  }

  const capped = Math.min(rawSum, MVP_ELEMENT_CAP);
  return {
    matches,
    rawSumDeduction: rawSum,
    elementDeduction: capped,
    hasRedTier: hasRed,
  };
}
