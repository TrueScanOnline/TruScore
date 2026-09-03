/**
 * Planet v19 — Packaging Fallback (Eco-Score absent only).
 * Jurisdiction rules: Planet_v19_Packaging_Jurisdiction_Rules_Annex_v2 (seed rules).
 * Policy: Planet_Scoring_Specification_v19 (Excel).
 *
 * Annex alignment: (1) only primary consumer rows — drop explicit `food_contact` “no”;
 * (2) product-level `packaging_text_in_languages` applies per row only when there is a single
 * primary component, else use each row’s own `recycling` / `packaging_text_in_languages`.
 */

import type { PackagingItem, Product } from '../../../types/product';
import { getUserCountryCode } from '../../../utils/countryDetection';

export type PlanetJurisdictionCode = 'AU' | 'NZ' | 'GLOBAL';

export type PackagingDisposition =
  | 'kerbside_recyclable'
  | 'conditionally_recyclable'
  | 'not_recyclable'
  | 'unknown';

/** Annex v2 + Excel v19: user market → device locale → default MVP (AU). */
export function resolvePlanetJurisdiction(product?: Product | null): PlanetJurisdictionCode {
  const fromProduct = (product as { true_scan_market?: string } | null)?.true_scan_market;
  if (fromProduct && typeof fromProduct === 'string') {
    const c = fromProduct.trim().toUpperCase();
    if (c === 'AU' || c === 'NZ') return c;
  }
  const device = getUserCountryCode();
  if (device === 'AU' || device === 'NZ') return device;
  if (device && device.length === 2) {
    return 'GLOBAL';
  }
  const env = process.env.TRUESCAN_DEFAULT_COUNTRY_CODE?.trim().toUpperCase();
  if (env === 'AU' || env === 'NZ') return env;
  return 'AU';
}

function flattenPackagingTextInLanguages(
  packagingTextInLanguages: Record<string, string> | undefined | null
): string {
  if (!packagingTextInLanguages || typeof packagingTextInLanguages !== 'object') return '';
  const parts: string[] = [];
  for (const v of Object.values(packagingTextInLanguages as Record<string, unknown>)) {
    if (typeof v === 'string' && v.trim()) parts.push(v);
  }
  return parts.join(' \n ');
}

/**
 * Annex v2: score **primary consumer packaging** only. OFF may list outer/transport rows; drop explicit
 * non–food-contact components when `food_contact` is present and negative.
 */
export function filterPrimaryConsumerPackagingItems(items: PackagingItem[]): PackagingItem[] {
  return items.filter((item) => {
    const fc = item.food_contact;
    if (fc === undefined || fc === null || fc === '') return true;
    const n = String(fc).toLowerCase().replace(/^en:/g, '');
    if (n === 'no' || n === 'false') return false;
    if (n.includes('not-in-contact') || n.includes('non-food-contact')) return false;
    return true;
  });
}

function normaliseEvidence(s: string | undefined | null): string {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .replace(/^en:/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map OFF / moderated recycling evidence to a single disposition (Annex §6).
 * Uses synonym / phrase matching so scores are not blocked on exact seed literals.
 */
export function dispositionFromRecyclingEvidence(
  recyclingField: string | undefined,
  supplementalText: string
): PackagingDisposition {
  const a = normaliseEvidence(recyclingField);
  const b = normaliseEvidence(supplementalText);
  const text = `${a} ${b}`.trim();

  if (!text) return 'unknown';

  // Not recyclable (must win over substring "recycle")
  if (
    /\bnot\s+recycl/.test(text) ||
    /\bnon[\s-]?recycl/.test(text) ||
    /\bdo not recycle\b/.test(text) ||
    /\blandfill\b/.test(text) ||
    /\bgeneral waste\b/.test(text) ||
    /\bput in bin\b/.test(text) ||
    /\bthrow away\b/.test(text)
  ) {
    return 'not_recyclable';
  }

  // Conditional / special pathways (Annex v2 includes deposit return)
  if (/\bcheck locally\b/.test(text) || /\bcheck-local/.test(text) || /\bwhere facilities exist\b/.test(text)) {
    return 'conditionally_recyclable';
  }
  if (/\breturn to store\b/.test(text) || /\breturn-to-store\b/.test(text)) {
    return 'conditionally_recyclable';
  }
  if (/\bdeposit return\b/.test(text) || /\bcontainer deposit\b/.test(text) || /\bcds\b/.test(text)) {
    return 'conditionally_recyclable';
  }
  if (/\bdrop off\b/.test(text) || /\bdrop-off\b/.test(text) || /\bstore collection\b/.test(text)) {
    return 'conditionally_recyclable';
  }
  if (/\bsoft plastic scheme\b/.test(text) || /\bredcycle\b/.test(text)) {
    return 'conditionally_recyclable';
  }

  // Kerbside / household stream — synonyms satisfy Annex normalisation tests
  if (
    /\brecycle\b/.test(text) ||
    /\brecyclable at kerbside\b/.test(text) ||
    /\bkerbside\b/.test(text) ||
    /\bcurbside\b/.test(text) ||
    /\bhome recycling\b/.test(text) ||
    /\bhousehold recycling\b/.test(text) ||
    /\bwidely recycled\b/.test(text) ||
    /\bplace in recycling\b/.test(text) ||
    /\byellow bin\b/.test(text) ||
    /\brecycling bin\b/.test(text)
  ) {
    return 'kerbside_recyclable';
  }

  // Generic positive without ARL phrasing — still structured OFF signal, not material-only
  if (/\brecyclable\b/.test(text) && !/\bnot\b/.test(text)) {
    return 'kerbside_recyclable';
  }

  return 'unknown';
}

function dispositionForPackagingItem(
  item: PackagingItem,
  supplementalForItem: string
): PackagingDisposition {
  const recycling = typeof item.recycling === 'string' ? item.recycling : undefined;
  return dispositionFromRecyclingEvidence(recycling, supplementalForItem);
}

/**
 * Product-level `packaging_text_in_languages` is document-wide copy; applying it to every row
 * over-credits multi-pack products. Only smear onto each component when there is a **single**
 * primary row, or attach per-row text from `item.packaging_text_in_languages` when present.
 */
function supplementalTextForPackagingItem(
  item: PackagingItem,
  globalPackagingText: string,
  primaryCount: number
): string {
  const perItem = flattenPackagingTextInLanguages(item.packaging_text_in_languages);
  if (perItem) return perItem;
  if (primaryCount === 1) return globalPackagingText;
  return '';
}

export interface PackagingFallbackResult {
  points: 0 | 1 | 2;
  jurisdiction: PlanetJurisdictionCode;
  dispositions: PackagingDisposition[];
  /** Score-neutral component labels aligned 1:1 with dispositions (for L3). */
  componentLabels: string[];
  packagingsComplete: boolean | undefined;
  structuredPackagingPresent: boolean;
}

function cleanPackagingTag(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/^en:/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function packagingComponentLabel(item: PackagingItem): string {
  const shape = cleanPackagingTag(item.shape);
  const material = cleanPackagingTag(item.material);
  if (shape && material) return `${shape} (${material})`;
  if (shape) return shape;
  if (material) return material;
  return 'Packaging component';
}

/** Map internal disposition to L3 consumer disposition key (addendum §4.2). */
export function packagingConsumerDispositionKey(
  disposition: PackagingDisposition
): 'kerbside' | 'special_pathway' | 'not_accepted' | 'not_confirmed' {
  switch (disposition) {
    case 'kerbside_recyclable':
      return 'kerbside';
    case 'conditionally_recyclable':
      return 'special_pathway';
    case 'not_recyclable':
      return 'not_accepted';
    default:
      return 'not_confirmed';
  }
}

/**
 * +2: packagings_complete === true and all primary components kerbside (AU/NZ only).
 * +1: structured packaging exists, ≥1 kerbside, no not_recyclable (packagings_complete may be false).
 * 0: otherwise (GLOBAL, missing data, conditional-only, etc.).
 */
export function computePackagingFallback(product: Product): PackagingFallbackResult {
  const jurisdiction = resolvePlanetJurisdiction(product);
  const rawItems = (product.packagings || []).filter((p) => p && typeof p === 'object') as PackagingItem[];
  const items = filterPrimaryConsumerPackagingItems(rawItems);
  const globalPackagingText = flattenPackagingTextInLanguages(product.packaging_text_in_languages);

  if (jurisdiction === 'GLOBAL') {
    return {
      points: 0,
      jurisdiction,
      dispositions: [],
      componentLabels: [],
      packagingsComplete: product.packagings_complete,
      structuredPackagingPresent: rawItems.length > 0,
    };
  }

  if (items.length === 0) {
    return {
      points: 0,
      jurisdiction,
      dispositions: [],
      componentLabels: [],
      packagingsComplete: product.packagings_complete,
      structuredPackagingPresent: false,
    };
  }

  const primaryCount = items.length;
  const dispositions = items.map((it) =>
    dispositionForPackagingItem(it, supplementalTextForPackagingItem(it, globalPackagingText, primaryCount))
  );
  const componentLabels = items.map((it) => packagingComponentLabel(it));
  const complete = product.packagings_complete === true;
  const anyNot = dispositions.some((d) => d === 'not_recyclable');
  const anyKerbside = dispositions.some((d) => d === 'kerbside_recyclable');
  const allKerbside =
    dispositions.length > 0 && dispositions.every((d) => d === 'kerbside_recyclable');

  let points: 0 | 1 | 2 = 0;
  if (complete && allKerbside) {
    points = 2;
  } else if (anyKerbside && !anyNot) {
    points = 1;
  }

  return {
    points,
    jurisdiction,
    dispositions,
    componentLabels,
    packagingsComplete: product.packagings_complete,
    structuredPackagingPresent: true,
  };
}
