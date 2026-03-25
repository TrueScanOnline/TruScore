/**
 * ETHICS PILLAR — Certifications element (SPEC: Database files/ETHICS Pillar/ETHICS Pillar spec sheet.xlsx)
 *
 * - MVP: apply the single highest eligible certification weight only (no stacking).
 * - Weights (v36): Fairtrade +6, Rainforest Alliance (UTZ) +5, ASC +4, MSC +4, RSPO +3, Organic +2.
 * - ASC vs MSC: spec treats these as mutually exclusive certifications for a product (aquaculture vs wild-catch);
 *   no tie-break rule. If both ever appear in data, max weight wins (both +4 today).
 * - MSC: official API validation is authoritative for positive hits; OFF cannot override a negative API result.
 *   When `product.ethics_msc_api_validated === true`, MSC is eligible; when `false`, MSC is never credited.
 *   When unset, MSC is not credited unless EXPO_PUBLIC_ETHICS_MSC_OFF_FALLBACK=true (dev / limited rollout only).
 * - Organic: not scored on bare "organic" alone; require a recognised certifier tag or text signal per spec.
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

/** Relative weights within the certification element only (SPEC v36). */
export const ETHICS_CERTIFICATION_WEIGHTS: Record<EthicsCertificationScheme, number> = {
  fairtrade: 6,
  rainforest_alliance: 5,
  asc: 4,
  msc: 4,
  rspo: 3,
  organic: 2,
};

const REF_OFF_PRODUCT =
  'https://world.openfoodfacts.org/';
const REF_MSC_API =
  'https://www.msc.org/for-business/msc-data-validation-api';

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
 * Tags that imply a recognised organic certifier / mark (not generic en:organic alone).
 */
const ORGANIC_CERTIFIER_TAGS = new Set([
  'en:eu-organic',
  'en:european-organic',
  'en:usda-organic',
  'en:australian-certified-organic',
  'en:acos-organic',
  'en:demeter',
  'en:biodynamic-agriculture',
  'en:biodynamic',
  'en:naturland',
  'en:soil-association-organic',
  'en:organic-food-chain',
  'en:southern-cross-organic',
]);

function normalizeTag(tag: string): string {
  return String(tag || '')
    .trim()
    .toLowerCase();
}

function getAllowMscOffFallback(): boolean {
  try {
    const v = process.env.EXPO_PUBLIC_ETHICS_MSC_OFF_FALLBACK;
    return v === 'true' || v === '1';
  } catch {
    return false;
  }
}

function collectLabelTags(product: Product): string[] {
  if (!Array.isArray(product.labels_tags)) return [];
  return product.labels_tags.map(normalizeTag).filter(Boolean);
}

/** Lowercased haystack for substring checks (labels text + cert names + ingredients). */
function buildHaystack(product: Product): string {
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

const ORGANIC_CERTIFIER_SUBSTRINGS = [
  'australian certified organic',
  'australian certified organic.',
  'acos',
  'demeter',
  'bdri',
  'organic food chain',
  'southern cross certified',
  'eu organic',
  'usda organic',
  'soil association',
  'biodynamic',
  'naturland',
];

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

/**
 * Organic credit only with a recognised certifier / mark (spec). Bare en:generic organic wording alone is insufficient.
 */
function detectOrganic(tags: string[], haystack: string): boolean {
  if (tags.some((t) => ORGANIC_CERTIFIER_TAGS.has(t))) return true;
  if (ORGANIC_CERTIFIER_SUBSTRINGS.some((s) => haystack.includes(s))) return true;
  return false;
}

export interface EthicsCertificationsEvaluation {
  /** Single adjustment to apply (max weight among eligible schemes). */
  adjustment: number;
  winningScheme: EthicsCertificationScheme | null;
  /** All schemes that were eligible before max selection (for diagnostics / UI). */
  eligibleSchemes: EthicsCertificationScheme[];
  referenceUrl: string;
}

/**
 * Evaluate certifications per ETHICS SPEC (max one scheme for MVP).
 */
export function evaluateEthicsCertifications(product: Product): EthicsCertificationsEvaluation {
  const tags = collectLabelTags(product);
  const haystack = buildHaystack(product);

  const eligible: EthicsCertificationScheme[] = [];

  if (detectFairtrade(tags, haystack)) eligible.push('fairtrade');
  if (detectRainforestUtz(tags)) eligible.push('rainforest_alliance');
  if (detectAsc(tags, haystack)) eligible.push('asc');
  if (mscEligible(product, tags)) eligible.push('msc');
  if (detectRspo(tags, haystack)) eligible.push('rspo');
  if (detectOrganic(tags, haystack)) eligible.push('organic');

  if (eligible.length === 0) {
    return {
      adjustment: 0,
      winningScheme: null,
      eligibleSchemes: [],
      referenceUrl: REF_OFF_PRODUCT,
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
  };
}

export function getEthicsCertificationAdjustment(product: Product): number {
  return evaluateEthicsCertifications(product).adjustment;
}
