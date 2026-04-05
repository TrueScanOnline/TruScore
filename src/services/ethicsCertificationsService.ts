/**
 * ETHICS PILLAR — Certifications element
 *
 * SPEC: Database files/ETHICS Pillar/Ethics_Scoring_Specification_37_Cursor_Submit.xlsx (v37).
 * If the workbook’s numeric tables (BBFAW tiers, KTC bands, certification weights) differ from code,
 * update bbfawService / ktcService / ETHICS_CERTIFICATION_WEIGHTS and re-run `yarn sync-ethics-data` when JSON inputs change.
 *
 * - MVP: single highest eligible certification only (no stacking).
 * - Weights (v37 / unchanged): Fairtrade +6, Rainforest Alliance +5, ASC +4, MSC +4, RSPO +3, Organic +2.
 * - MSC: API validation rules unchanged (see ethics_msc_api_validated).
 *
 * Organic (+2): OFF recognised certifier/mark OR generic en:organic tag OR product-name standalone “organic”.
 * Generic organic wording in ingredients_text / ingredients_text_en alone does not score.
 */

import type { Product } from '../types/product';
import { logger } from '../utils/logger';

export type EthicsCertificationScheme =
  | 'fairtrade'
  | 'rainforest_alliance'
  | 'asc'
  | 'msc'
  | 'rspo'
  | 'organic';

export type EthicsOrganicMatchSource =
  | 'off_tags_or_hierarchy'
  | 'label_or_cert_text'
  | 'product_name';

/** Relative weights within the certification element only (SPEC v37). */
export const ETHICS_CERTIFICATION_WEIGHTS: Record<EthicsCertificationScheme, number> = {
  fairtrade: 6,
  rainforest_alliance: 5,
  asc: 4,
  msc: 4,
  rspo: 3,
  organic: 2,
};

const REF_OFF_PRODUCT = 'https://world.openfoodfacts.org/';
const REF_MSC_API = 'https://www.msc.org/for-business/msc-data-validation-api';

const FAIRTRADE_LABEL_TAGS = new Set([
  'en:fair-trade',
  'en:fairtrade',
  'en:fairtrade-international',
  'en:max-havelaar',
  'en:flo',
  'en:fairtrade-australia-and-new-zealand',
]);

const RAINFOREST_UTZ_TAGS = new Set([
  'en:rainforest-alliance',
  'en:utz',
  'en:utz-certified',
  'en:rainforest-alliance-certified',
]);

const ASC_LABEL_TAGS = new Set([
  'en:aquaculture-stewardship-council',
  'en:asc-certified',
  'en:asc',
]);

const MSC_LABEL_TAGS = new Set(['en:marine-stewardship-council', 'en:msc-certified']);

const RSPO_LABEL_TAGS = new Set([
  'en:roundtable-on-sustainable-palm-oil',
  'en:rspo',
  'en:rspo-certified',
  'en:rspo-mass-balance',
  'en:rspo-segregated',
  'en:rspo-identity-preserved',
  'en:rspo-credits',
  'en:certified-sustainable-palm-oil',
  'en:sustainable-palm-oil',
]);

/**
 * Organic: exact OFF tags / hierarchy + legacy aliases. Includes generic en:organic (v37).
 */
export const ETHICS_ORGANIC_TAG_ALLOWLIST = new Set([
  'en:organic',
  'en:aco-certified-organic',
  'en:australian-certified-organic',
  'en:eu-organic',
  'en:european-organic',
  'en:usda-organic',
  'en:soil-association-organic',
  'en:organic-food-chain',
  'en:demeter',
  'en:biodynamic',
  'en:biodynamic-agriculture',
  'en:naturland',
  'en:ccof-certified-organic',
  'en:canada-organic',
  'en:bioland',
  'en:biokreis',
  'en:danish-state-controlled-organic',
  'en:luomu-controlled-organic-production',
  'en:finnish-organic-association',
  'en:tun-certified-organic',
  'en:debio-organic',
  'en:southern-cross-certified',
  'en:southern-cross-organic',
  /** Legacy OFF slug; keep for defensive matching. */
  'en:acos-organic',
]);

/** Multi-word phrases for label/cert text (order: longest first for matching). */
const ORGANIC_LABEL_PHRASES_MULTI: string[] = [
  'inspection and certification organization of organic products',
  'catalan council of organic production',
  'luomu controlled organic production',
  'farm verified organic',
  'danish state controlled organic',
  'ccof certified organic',
  'finnish organic association',
  'southern cross certified',
  'australian certified organic',
  'tun certified organic',
  'soil association organic',
  'aco certified organic',
  'canada organic',
  'india organic',
  'organic food chain',
  'debio organic',
  'soil association',
  'eu organic',
  'usda organic',
  'biodynamic agriculture',
  'biodynamic',
  'naturland',
  'demeter',
  'bioland',
  'biokreis',
];

function normalizeTag(tag: string): string {
  return String(tag || '')
    .trim()
    .toLowerCase();
}

/**
 * Strip Open Food Facts–style language prefix(es) from a taxonomy tag (e.g. en:, fr:).
 * Some APIs return duplicate prefixes; strip repeatedly until stable.
 */
export function stripOffTagLanguagePrefix(tag: string): string {
  let s = normalizeTag(tag);
  let prev = '';
  while (s !== prev && /^[a-z]{2}:/.test(s)) {
    prev = s;
    s = s.replace(/^[a-z]{2}:/, '');
  }
  return s;
}

function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Lowercase, collapse whitespace, strip punctuation to spaces, strip diacritics. */
export function normalizeEthicsOrganicText(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAllowMscOffFallback(): boolean {
  try {
    const v = process.env.EXPO_PUBLIC_ETHICS_MSC_OFF_FALLBACK;
    return v === 'true' || v === '1';
  } catch {
    return false;
  }
}

/**
 * Union of OFF label signals used for certification tag matching:
 * labels_tags, labels_hierarchy, formatted certification tags on the product.
 */
export function collectEthicsOffLabelTags(product: Product): string[] {
  const out: string[] = [];
  if (Array.isArray(product.labels_tags)) {
    out.push(...product.labels_tags.map(normalizeTag).filter(Boolean));
  }
  if (Array.isArray(product.labels_hierarchy)) {
    out.push(...product.labels_hierarchy.map(normalizeTag).filter(Boolean));
  }
  if (Array.isArray(product.certifications)) {
    for (const c of product.certifications) {
      const t = c?.tag && typeof c.tag === 'string' ? normalizeTag(c.tag) : '';
      if (t && t.startsWith('ts:')) continue; // display-only synthetics (normalizeTag lowercases)
      if (t) out.push(t);
    }
  }
  return [...new Set(out)];
}

/**
 * OFF `labels_tags` + `labels_hierarchy` only (excludes `product.certifications`).
 * Use when building UI badges so we do not read formatted certs (avoids circularity with `formatCertifications`).
 * Order: tags first, then hierarchy; duplicates removed with first occurrence kept.
 */
export function collectOffLabelTagsForCertDisplay(product: Product): string[] {
  const out: string[] = [];
  if (Array.isArray(product.labels_tags)) {
    out.push(...product.labels_tags.map(normalizeTag).filter(Boolean));
  }
  if (Array.isArray(product.labels_hierarchy)) {
    out.push(...product.labels_hierarchy.map(normalizeTag).filter(Boolean));
  }
  return [...new Set(out)];
}

/** Haystack for non-organic schemes (may include ingredients). */
function buildGeneralCertHaystack(product: Product): string {
  const parts: string[] = [];
  if (product.labels && typeof product.labels === 'string') parts.push(product.labels);
  if (product.labels_en && typeof product.labels_en === 'string') parts.push(product.labels_en);
  if (product.ingredients_text && typeof product.ingredients_text === 'string') {
    parts.push(product.ingredients_text);
  }
  if (product.ingredients_text_en && typeof product.ingredients_text_en === 'string') {
    parts.push(product.ingredients_text_en);
  }
  if (product.product_name && typeof product.product_name === 'string') parts.push(product.product_name);
  if (Array.isArray(product.certifications)) {
    for (const c of product.certifications) {
      if (c?.name) parts.push(c.name);
      if (c?.tag) parts.push(c.tag);
      if (c?.description) parts.push(c.description);
    }
  }
  return parts.join(' | ').toLowerCase();
}

/** Labels + cert display text only — no ingredients, no product name (organic MVP rule). */
function buildOrganicLabelCertNormalized(product: Product): string {
  const parts: string[] = [];
  if (product.labels && typeof product.labels === 'string') parts.push(product.labels);
  if (product.labels_en && typeof product.labels_en === 'string') parts.push(product.labels_en);
  if (Array.isArray(product.certifications)) {
    for (const c of product.certifications) {
      const tag = c?.tag && typeof c.tag === 'string' ? c.tag : '';
      if (tag.toLowerCase().startsWith('ts:')) continue; // avoid circular match via formatCertifications output
      if (c?.name) parts.push(c.name);
      if (tag) parts.push(tag);
      if (c?.description) parts.push(c.description);
    }
  }
  return normalizeEthicsOrganicText(parts.join(' | '));
}

/** Standalone “organic” in normalized text; exclude non-organic / inorganic false positives. */
function hasSafeStandaloneOrganicWord(normalized: string): boolean {
  if (!normalized) return false;
  if (/\binorganic\b/.test(normalized)) return false;
  if (/\bnon\s*organic\b/.test(normalized)) return false;
  if (/\bnonorganic\b/.test(normalized)) return false;
  return /\borganic\b/.test(normalized);
}

/** Word-boundary “dio” (requested phrase list). */
function hasStandaloneDio(normalized: string): boolean {
  return /\bdio\b/.test(normalized);
}

function organicMatchesLabelOrCertText(product: Product): boolean {
  const n = buildOrganicLabelCertNormalized(product);
  if (!n) return false;

  const phrases = [...ORGANIC_LABEL_PHRASES_MULTI].sort((a, b) => b.length - a.length);
  for (const phrase of phrases) {
    const pn = normalizeEthicsOrganicText(phrase);
    if (pn.length >= 2 && n.includes(pn)) return true;
  }
  if (hasSafeStandaloneOrganicWord(n)) return true;
  if (hasStandaloneDio(n)) return true;
  return false;
}

function productNameHasStandaloneOrganic(product: Product): boolean {
  const parts = [product.product_name, product.product_name_en].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  if (parts.length === 0) return false;
  const n = normalizeEthicsOrganicText(parts.join(' '));
  if (/\binorganic\b/.test(n)) return false;
  if (/\bnon\s*organic\b/.test(n)) return false;
  if (/\bnonorganic\b/.test(n)) return false;
  return /\borganic\b/.test(n);
}

function evaluateOrganicMatch(
  product: Product,
  tagUnion: string[]
): { matched: boolean; source?: EthicsOrganicMatchSource } {
  for (const t of tagUnion) {
    if (ETHICS_ORGANIC_TAG_ALLOWLIST.has(t)) {
      return { matched: true, source: 'off_tags_or_hierarchy' };
    }
  }
  if (organicMatchesLabelOrCertText(product)) {
    return { matched: true, source: 'label_or_cert_text' };
  }
  if (productNameHasStandaloneOrganic(product)) {
    return { matched: true, source: 'product_name' };
  }
  return { matched: false };
}

/** Organic match using OFF label fields only (same rules as scoring, without formatted certifications in the tag union). */
export function evaluateOrganicMatchForCertDisplay(product: Product): {
  matched: boolean;
  source?: EthicsOrganicMatchSource;
} {
  return evaluateOrganicMatch(product, collectOffLabelTagsForCertDisplay(product));
}

function detectFairtrade(tags: string[], haystack: string): boolean {
  if (tags.some((t) => FAIRTRADE_LABEL_TAGS.has(t))) return true;
  return (
    /\bfair[\s-]?trade\b/i.test(haystack) ||
    haystack.includes('fairtrade international') ||
    haystack.includes('flo certif')
  );
}

function detectRainforestUtz(tags: string[]): boolean {
  return tags.some((t) => RAINFOREST_UTZ_TAGS.has(t));
}

function detectAsc(tags: string[], haystack: string): boolean {
  if (tags.some((t) => ASC_LABEL_TAGS.has(t))) return true;
  return (
    haystack.includes('aquaculture stewardship council') ||
    haystack.includes('asc certified') ||
    /\basc\b.*(certif|steward)/i.test(haystack)
  );
}

function detectRspo(tags: string[], haystack: string): boolean {
  if (tags.some((t) => RSPO_LABEL_TAGS.has(t))) return true;
  return (
    haystack.includes('rspo') ||
    haystack.includes('roundtable on sustainable palm') ||
    haystack.includes('certified sustainable palm oil')
  );
}

function offSuggestsMsc(tags: string[]): boolean {
  return tags.some((t) => MSC_LABEL_TAGS.has(t));
}

function mscEligible(product: Product, tags: string[]): boolean {
  const validated = product.ethics_msc_api_validated;
  if (validated === true) return true;
  if (validated === false) {
    if (offSuggestsMsc(tags)) {
      logger.debug('[EthicsCertifications] MSC OFF label present but API validation negative — no MSC credit');
    }
    return false;
  }
  if (getAllowMscOffFallback() && offSuggestsMsc(tags)) {
    logger.debug('[EthicsCertifications] MSC credited via OFF fallback (EXPO_PUBLIC_ETHICS_MSC_OFF_FALLBACK)');
    return true;
  }
  if (offSuggestsMsc(tags)) {
    logger.debug('[EthicsCertifications] MSC label in OFF but no API validation — no MSC credit (spec)');
  }
  return false;
}

export interface EthicsCertificationsEvaluation {
  adjustment: number;
  winningScheme: EthicsCertificationScheme | null;
  eligibleSchemes: EthicsCertificationScheme[];
  referenceUrl: string;
  /** Set when organic rules matched (whether or not it wins max scheme). */
  organicMatchSource?: EthicsOrganicMatchSource;
}

/**
 * Evaluate certifications per ETHICS SPEC v37 (max one scheme for MVP).
 */
export function evaluateEthicsCertifications(product: Product): EthicsCertificationsEvaluation {
  const tagUnion = collectEthicsOffLabelTags(product);
  const haystack = buildGeneralCertHaystack(product);

  const organicEval = evaluateOrganicMatch(product, tagUnion);

  const eligible: EthicsCertificationScheme[] = [];

  if (detectFairtrade(tagUnion, haystack)) eligible.push('fairtrade');
  if (detectRainforestUtz(tagUnion)) eligible.push('rainforest_alliance');
  if (detectAsc(tagUnion, haystack)) eligible.push('asc');
  if (mscEligible(product, tagUnion)) eligible.push('msc');
  if (detectRspo(tagUnion, haystack)) eligible.push('rspo');
  if (organicEval.matched) eligible.push('organic');

  if (eligible.length === 0) {
    return {
      adjustment: 0,
      winningScheme: null,
      eligibleSchemes: [],
      referenceUrl: REF_OFF_PRODUCT,
      organicMatchSource: undefined,
    };
  }

  let winning: EthicsCertificationScheme = eligible[0];
  let maxW = ETHICS_CERTIFICATION_WEIGHTS[winning];
  for (let i = 1; i < eligible.length; i++) {
    const s = eligible[i];
    const w = ETHICS_CERTIFICATION_WEIGHTS[s];
    if (w > maxW) {
      maxW = w;
      winning = s;
    }
  }

  const referenceUrl = winning === 'msc' ? REF_MSC_API : REF_OFF_PRODUCT;

  return {
    adjustment: maxW,
    winningScheme: winning,
    eligibleSchemes: eligible,
    referenceUrl,
    organicMatchSource: organicEval.matched ? organicEval.source : undefined,
  };
}

export function getEthicsCertificationAdjustment(product: Product): number {
  return evaluateEthicsCertifications(product).adjustment;
}

/**
 * OFF label tags the Ethics / TruScore certification element recognizes (manual product picker).
 * Union of organic allowlist + fairtrade, Rainforest/UTZ, ASC, MSC, RSPO tag sets.
 */
export function getTruscoreCertificationPickerTags(): string[] {
  const u = new Set<string>();
  ETHICS_ORGANIC_TAG_ALLOWLIST.forEach((t) => u.add(normalizeTag(t)));
  FAIRTRADE_LABEL_TAGS.forEach((t) => u.add(normalizeTag(t)));
  RAINFOREST_UTZ_TAGS.forEach((t) => u.add(normalizeTag(t)));
  ASC_LABEL_TAGS.forEach((t) => u.add(normalizeTag(t)));
  MSC_LABEL_TAGS.forEach((t) => u.add(normalizeTag(t)));
  RSPO_LABEL_TAGS.forEach((t) => u.add(normalizeTag(t)));
  return Array.from(u).sort((a, b) => formatCertificationTagForPicker(a).localeCompare(formatCertificationTagForPicker(b)));
}

/** Human-readable label for an OFF-style label tag (picker UI, badges). */
export function formatCertificationTagForPicker(tag: string): string {
  const slug = stripOffTagLanguagePrefix(tag);
  if (!slug) return String(tag || '').trim();
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
