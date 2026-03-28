/**
 * Body Pillar — Food Additives of Concern (MVP)
 * Body_Scoring_Specification_V12 + Implementation Guidance v1.3
 *
 * MVP subset and label forms: additiveDatabase.ts (bodyConcernTier + bodyMvpLabelForms).
 */

import { Product } from '../../../types/product';
import {
  getAdditiveInfo,
  AdditiveInfo,
  BODY_MVP_TEXT_FORMS_BY_ID,
} from '../../../services/additiveDatabase';

export type BodyConcernTier = 'yellow' | 'orange' | 'red';

const TIER_DEDUCTION: Record<BodyConcernTier, number> = {
  yellow: 1,
  orange: 3,
  red: 6,
};

const MVP_ELEMENT_CAP = 8;

const MVP_IDS = Object.freeze(Object.keys(BODY_MVP_TEXT_FORMS_BY_ID));

/** Max total Body score when any Red-tier MVP additive is present (before floor 2). */
export const BODY_RED_ADDITIVE_SCORE_CEILING = 12;

export function deductionForBodyConcernTier(tier: BodyConcernTier): number {
  return TIER_DEDUCTION[tier];
}

export function getBodyConcernTierFromInfo(info: AdditiveInfo | null): BodyConcernTier | null {
  return info?.bodyConcernTier ?? null;
}

/**
 * Normalize Open Food Facts additive tag to canonical e-number key (e.g. e102, e150d).
 * Supports en:e250, en:250, spaced E 250, e-150d.
 */
export function normalizeOffAdditiveTag(tag: string): string | null {
  let t = tag.toLowerCase().trim();
  if (!t) return null;
  if (t.startsWith('en:')) {
    t = t.slice(3).trim();
  }
  t = t.replace(/\s+/g, '');
  const withE = t.match(/^e-?(\d+[a-z]?)$/);
  if (withE) {
    return `e${withE[1]}`;
  }
  const numericOnly = t.match(/^(\d+[a-z]?)$/);
  if (numericOnly) {
    return `e${numericOnly[1]}`;
  }
  return null;
}

function normalizeIngredientsForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Exact controlled match for a single label form (Phase 1 — no fuzzy matching).
 * Bare numeric-only forms are never matched in free text (defense in depth).
 */
function ingredientsMatchForm(haystackLower: string, form: string): boolean {
  const f = form.trim().toLowerCase();
  if (!f) return false;

  const fCompact = f.replace(/\s/g, '');
  if (/^\d+[a-z]?$/i.test(fCompact)) {
    return false;
  }

  // E-number with optional spaces / hyphen (E250, E 250, E-250) — word-boundary style
  const eCompact = f.replace(/\s/g, '');
  if (/^e-?\d+[a-z]?$/i.test(eCompact)) {
    const num = eCompact.replace(/^e-?/i, '');
    return new RegExp(`\\be\\s*-?\\s*${num}\\b`, 'i').test(haystackLower);
  }

  // Phrases (alias, class + number in parentheses, etc.)
  const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystackLower);
}

function findMvpIdsInIngredientsText(ingredientsText: string): string[] {
  const hay = normalizeIngredientsForMatching(ingredientsText);
  const found = new Set<string>();
  for (const id of MVP_IDS) {
    const forms = BODY_MVP_TEXT_FORMS_BY_ID[id];
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
