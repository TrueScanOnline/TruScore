/**
 * W5-ADD-SHARE-01 / 01B — Additives share content from currently rendered S25 list items.
 * Presentation-only. Uses governed catalogue / surface copy. No new scientific claims.
 * Discovery order is never framed as safety or avoidance.
 */

import { productIdentity } from '../../config/productIdentity';
import { getSourceProfile, getSurfaceCopy } from '../../s25';
import { DISCOVERY_DISPLAY_SEQUENCE } from '../../s25/discoveryPresentationOrder';
import type { S25RenderListItem } from '../../s25/types';

const appName = productIdentity.displayName;

/** Max discovery cards on an overview share image (readable, not a silent partial). */
export const ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT = 3;

/** Single non-safety line shown once on the share card footer. */
export const ADDITIVES_SHARE_DISCLAIMER =
  'Discovery order is not a safety ranking.';

export type AdditiveShareHighlight = {
  additiveId: string;
  codeLabel: string;
  /** Consumer-facing name (governed consumer_display_name when present). */
  displayName: string;
  /**
   * Same as displayName. Kept for callers/tests that still read `title`.
   * Prefer displayName in new UI.
   */
  title: string;
  /** Formal catalogue title when it differs from displayName. */
  formalTitle: string | null;
  discovery: string;
  sourceLabel: string | null;
  sourceProfileId: string | null;
  /** Claim-specific qualifications only (VARIABLE / CHEMICAL_SYNTHESIS). */
  qualifications: string[];
  isCorePromoted: boolean;
};

export type AdditiveSharePayload = {
  mode: 'overview' | 'detail';
  productName: string;
  additiveCount: number;
  highlights: AdditiveShareHighlight[];
  /** True when every rendered additive is represented in highlights. */
  listComplete: boolean;
  omittedCount: number;
  completenessNote: string;
  /** One card-level non-safety line (not repeated per additive). */
  disclaimer: string;
  /** Alias of disclaimer for earlier SHARE-01 callers/tests. */
  discoveryOrderNote: string;
};

function codeLabelFor(item: S25RenderListItem): string {
  if (item.colourGroupIds && item.colourGroupIds.length > 1) {
    return item.colourGroupIds.map((id) => id.replace(/^e/i, '')).join(', ');
  }
  const code = item.entry.schedule8_code?.trim();
  if (code) return code;
  return item.additiveId.replace(/^e/i, '').toUpperCase();
}

/** Prefer governed consumer_display_name; never invent aliases. */
function displayNameFor(item: S25RenderListItem): { displayName: string; formalTitle: string | null } {
  if (item.colourGroupIds && item.colourGroupIds.length > 1) {
    return { displayName: 'Colour additives', formalTitle: null };
  }
  const consumerRaw = (item.entry.consumer_display_name || '').replace(/\s+/g, ' ').trim();
  const formal = (item.entry.entry_title || '').replace(/\s+/g, ' ').trim();
  // Treat bare additive ids as missing — prefer governed entry_title, never invent aliases.
  const consumerLooksLikeId =
    !consumerRaw ||
    consumerRaw.toLowerCase() === item.additiveId.toLowerCase() ||
    consumerRaw.toLowerCase() === `e${codeLabelFor(item).toLowerCase()}`;
  const consumer = consumerLooksLikeId ? '' : consumerRaw;
  const stripParenCode = (s: string) =>
    s.replace(/\s*\([^)]*\)\s*$/u, '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (consumer) {
    // Hide formal line when it only repeats the consumer name (optionally with a code).
    const formalUseful =
      formal &&
      formal.toLowerCase() !== consumer.toLowerCase() &&
      stripParenCode(formal) !== stripParenCode(consumer)
        ? formal
        : null;
    return { displayName: consumer, formalTitle: formalUseful };
  }
  if (formal) return { displayName: formal, formalTitle: null };
  return { displayName: item.additiveId, formalTitle: null };
}

/**
 * One clear discovery statement. Never cuts mid-sentence.
 * Prefer first complete sentence when the tile is long.
 */
function discoveryFor(item: S25RenderListItem): string {
  const raw = (item.entry.tile_summary || item.entry.expanded_summary || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  if (raw.length <= 220) return raw;
  const sentence = raw.match(/^(.+?[.!?])(?:\s|$)/);
  if (sentence && sentence[1].trim().length >= 24) return sentence[1].trim();
  return raw;
}

function isCorePromoted(item: S25RenderListItem): boolean {
  if (item.colourGroupIds?.length) {
    return item.colourGroupIds.some((id) => DISCOVERY_DISPLAY_SEQUENCE[id] != null);
  }
  return DISCOVERY_DISPLAY_SEQUENCE[item.additiveId] != null;
}

function sourceInfo(item: S25RenderListItem): {
  label: string | null;
  profileId: string | null;
  qualifications: string[];
} {
  const qualifications: string[] = [];
  if (item.isBody6 || item.entry.source_preparation_render_mode !== 'STANDARD_PROFILE_AND_COPY') {
    return { label: null, profileId: null, qualifications };
  }
  const profileId = item.entry.source_preparation_profile || null;
  const profile = profileId ? getSourceProfile(profileId) : undefined;
  const label = profile?.consumer_label ?? null;

  if (profileId === 'VARIABLE') {
    qualifications.push(
      'The additive code alone does not establish a product-specific plant, animal, or other origin.'
    );
  }
  if (profileId === 'CHEMICAL_SYNTHESIS') {
    qualifications.push(
      'Made by chemical synthesis — this is not the same as “made from petroleum”.'
    );
  }
  return { label, profileId, qualifications };
}

export function buildAdditiveShareHighlight(item: S25RenderListItem): AdditiveShareHighlight {
  const source = sourceInfo(item);
  const names = displayNameFor(item);
  return {
    additiveId: item.additiveId,
    codeLabel: codeLabelFor(item),
    displayName: names.displayName,
    title: names.displayName,
    formalTitle: names.formalTitle,
    discovery: discoveryFor(item),
    sourceLabel: source.label,
    sourceProfileId: source.profileId,
    qualifications: source.qualifications,
    isCorePromoted: isCorePromoted(item),
  };
}

function completenessNote(): string {
  return (
    getSurfaceCopy('surface_intro') ||
    'These are the food additives we could identify from the information available for this product. This may not be a complete list of every additive in the product.'
  );
}

export function omittedListLabel(omittedCount: number): string {
  if (omittedCount <= 0) return '';
  const n = omittedCount === 1 ? '1 more additive identified' : `${omittedCount} more additives identified`;
  return `${n}. Explore the full list in ${appName}.`;
}

function withDisclaimerFields(
  base: Omit<AdditiveSharePayload, 'disclaimer' | 'discoveryOrderNote'>
): AdditiveSharePayload {
  return {
    ...base,
    disclaimer: ADDITIVES_SHARE_DISCLAIMER,
    discoveryOrderNote: ADDITIVES_SHARE_DISCLAIMER,
  };
}

/** Overview payload from the currently rendered modal list (already discovery-ordered). */
export function buildAdditivesOverviewSharePayload(input: {
  productName: string;
  items: readonly S25RenderListItem[];
  showDiscoveryOrderNote?: boolean;
}): AdditiveSharePayload {
  const all = input.items.map(buildAdditiveShareHighlight);
  const highlights = all.slice(0, ADDITIVES_OVERVIEW_HIGHLIGHT_LIMIT);
  const omittedCount = Math.max(0, all.length - highlights.length);
  return withDisclaimerFields({
    mode: 'overview',
    productName: input.productName.trim() || 'this product',
    additiveCount: all.length,
    highlights,
    listComplete: omittedCount === 0,
    omittedCount,
    completenessNote: completenessNote(),
  });
}

/** Single-additive payload from one rendered card. */
export function buildAdditiveDetailSharePayload(input: {
  productName: string;
  item: S25RenderListItem;
  totalAdditiveCount: number;
}): AdditiveSharePayload {
  const highlight = buildAdditiveShareHighlight(input.item);
  return withDisclaimerFields({
    mode: 'detail',
    productName: input.productName.trim() || 'this product',
    additiveCount: input.totalAdditiveCount,
    highlights: [highlight],
    listComplete: input.totalAdditiveCount <= 1,
    omittedCount: Math.max(0, input.totalAdditiveCount - 1),
    completenessNote: completenessNote(),
  });
}

/** Plain-text path summary / accessibility (not the visual card). */
export function additivesShareText(payload: AdditiveSharePayload): string {
  const lines: string[] = [];
  const countLabel =
    payload.additiveCount === 1
      ? '1 additive identified'
      : `${payload.additiveCount} additives identified`;
  lines.push(countLabel);
  for (const h of payload.highlights) {
    lines.push(`${h.displayName} (${h.codeLabel})`);
    if (h.discovery) lines.push(h.discovery);
    if (h.sourceLabel) lines.push(`Source: ${h.sourceLabel}`);
    for (const q of h.qualifications) lines.push(q);
  }
  if (!payload.listComplete && payload.omittedCount > 0) {
    lines.push(omittedListLabel(payload.omittedCount));
  }
  lines.push(payload.disclaimer);
  return lines.join('\n');
}

/**
 * Text-row fallback for path-summary callers. Visual share uses additiveShare layout
 * on ShareProductStoryCard; these rows are not the primary card composition.
 */
export function additivesOverviewShareRows(
  payload: AdditiveSharePayload
): Array<{ kind: 'text'; text: string }> {
  const rows: Array<{ kind: 'text'; text: string }> = [];
  const countLabel =
    payload.additiveCount === 1
      ? '1 additive identified'
      : `${payload.additiveCount} additives identified`;
  rows.push({ kind: 'text', text: countLabel });
  for (const h of payload.highlights) {
    rows.push({ kind: 'text', text: `${h.displayName} (${h.codeLabel})` });
    if (h.discovery) rows.push({ kind: 'text', text: h.discovery });
  }
  if (!payload.listComplete && payload.omittedCount > 0) {
    rows.push({ kind: 'text', text: omittedListLabel(payload.omittedCount) });
  }
  rows.push({ kind: 'text', text: payload.disclaimer });
  return rows;
}

export function additiveDetailShareRows(
  payload: AdditiveSharePayload
): Array<{ kind: 'text'; text: string }> {
  const h = payload.highlights[0];
  if (!h) return [{ kind: 'text', text: payload.disclaimer }];
  const rows: Array<{ kind: 'text'; text: string }> = [
    { kind: 'text', text: `${h.displayName} (${h.codeLabel})` },
  ];
  if (h.discovery) rows.push({ kind: 'text', text: h.discovery });
  if (h.sourceLabel) rows.push({ kind: 'text', text: `Source: ${h.sourceLabel}` });
  for (const q of h.qualifications) rows.push({ kind: 'text', text: q });
  rows.push({ kind: 'text', text: payload.disclaimer });
  return rows;
}

/** Native/message body — factual additive content; no unpublished score. */
export function buildAdditivesShareMessage(input: {
  payload: AdditiveSharePayload;
  universalLink: string;
}): { title: string; message: string; hashtags: string[] } {
  const { payload, universalLink } = input;
  const name = payload.productName;

  if (payload.mode === 'detail') {
    const h = payload.highlights[0];
    const title = h
      ? `🧪 ${h.displayName} — ${name}`
      : `🧪 Additive discovery — ${name}`;
    const lines: string[] = [`${name}`, ''];
    if (h) {
      lines.push(h.displayName);
      lines.push(`Code ${h.codeLabel}`);
      if (h.discovery) lines.push('', h.discovery);
      if (h.sourceLabel) lines.push('', `Source: ${h.sourceLabel}`);
      for (const q of h.qualifications) lines.push(q);
    }
    lines.push('', payload.disclaimer);
    if (payload.omittedCount > 0) {
      lines.push(`One of ${payload.additiveCount} additives identified on this product.`);
    }
    lines.push('');
    lines.push(`Explore this product in ${appName}`);
    lines.push(universalLink);
    lines.push('');
    lines.push(`#${appName} #FoodAdditives #FoodTransparency #ProductScan`);
    return {
      title,
      message: lines.join('\n'),
      hashtags: [appName, 'FoodAdditives', 'FoodTransparency', 'ProductScan'],
    };
  }

  const countLabel =
    payload.additiveCount === 1
      ? '1 additive identified'
      : `${payload.additiveCount} additives identified`;
  const title = `🧪 Additive discoveries — ${name}`;
  const lines: string[] = [`${name}`, '', countLabel, ''];
  if (payload.highlights.length > 0) {
    lines.push(payload.listComplete ? 'Identified additives:' : 'Selected discoveries:');
    for (const h of payload.highlights) {
      lines.push(`• ${h.displayName} (${h.codeLabel})`);
      if (h.discovery) lines.push(`  ${h.discovery}`);
      if (h.sourceLabel) lines.push(`  Source: ${h.sourceLabel}`);
      for (const q of h.qualifications) lines.push(`  ${q}`);
    }
  }
  if (!payload.listComplete && payload.omittedCount > 0) {
    lines.push('', omittedListLabel(payload.omittedCount));
  }
  lines.push('', payload.disclaimer);
  lines.push('');
  lines.push(`Explore this product in ${appName}`);
  lines.push(universalLink);
  lines.push('');
  lines.push(`#${appName} #FoodAdditives #FoodTransparency #ProductScan`);
  return {
    title,
    message: lines.join('\n'),
    hashtags: [appName, 'FoodAdditives', 'FoodTransparency', 'ProductScan'],
  };
}

/** Empty / no-additive overview (card absent on Result — still testable). */
export function buildEmptyAdditivesOverviewSharePayload(productName: string): AdditiveSharePayload {
  return withDisclaimerFields({
    mode: 'overview',
    productName: productName.trim() || 'this product',
    additiveCount: 0,
    highlights: [],
    listComplete: true,
    omittedCount: 0,
    completenessNote: completenessNote(),
  });
}
