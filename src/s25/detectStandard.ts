/**
 * Standard catalogue detection (body6_existing = false only).
 * Uses row-level code/name detection fields + class-context restrictions from the asset.
 * Does not redetect Body-6 rows.
 */

import { getStandardCatalogueEntries } from './loadAsset';
import { compactAdditiveToken, normalizeCodedTermToAdditiveId } from './normalize';
import {
  findDeclaredClassSpans,
  isWithinDeclaredAdditiveContext,
  type DeclaredClassSpan,
} from './resolveClass';
import type { S25CatalogueEntry, S25DetectionHit } from './types';
import { normalizeOffAdditiveTag } from '../lib/truscoreEngine/pillars/bodyAdditiveScoring';

const EXPLICIT_CODE_RE = /\b(?:e|ins)\s*-?\s*\d{3,4}[a-z]?\b|\ben:e\d{3,4}[a-z]?\b/gi;
const BARE_NUMERIC_RE = /\b\d{3,4}[a-z]?\b/gi;

export interface StandardDetectInput {
  ingredientsText?: string | null;
  additivesTags?: string[] | null;
}

function buildCodeAliasIndex(
  entries: readonly S25CatalogueEntry[]
): Map<string, S25CatalogueEntry> {
  const map = new Map<string, S25CatalogueEntry>();
  for (const entry of entries) {
    if (!entry.code_detection_enabled) continue;
    for (const alias of entry.code_aliases) {
      const id = normalizeCodedTermToAdditiveId(alias) ?? compactAdditiveToken(alias);
      if (!id) continue;
      const key = id.startsWith('e') ? id : compactAdditiveToken(alias);
      if (!map.has(key)) map.set(key, entry);
      // Also index compact alias forms
      const compact = compactAdditiveToken(alias);
      if (compact && !map.has(compact)) map.set(compact, entry);
    }
    if (entry.schedule8_code) {
      const canon = `e${String(entry.schedule8_code).toLowerCase()}`;
      if (!map.has(canon)) map.set(canon, entry);
    }
  }
  return map;
}

function buildNameAliasIndex(
  entries: readonly S25CatalogueEntry[]
): Array<{ aliasLower: string; entry: S25CatalogueEntry }> {
  const out: Array<{ aliasLower: string; entry: S25CatalogueEntry }> = [];
  for (const entry of entries) {
    if (!entry.name_detection_enabled) continue;
    for (const alias of entry.name_aliases) {
      const a = alias.trim().toLowerCase();
      if (a) out.push({ aliasLower: a, entry });
    }
  }
  // Longer aliases first to reduce partial collisions
  out.sort((a, b) => b.aliasLower.length - a.aliasLower.length);
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function recordHit(
  byId: Map<string, S25DetectionHit>,
  hit: S25DetectionHit
): void {
  const existing = byId.get(hit.additiveId);
  if (!existing) {
    byId.set(hit.additiveId, hit);
    return;
  }
  if (
    hit.position != null &&
    (existing.position == null || hit.position < existing.position)
  ) {
    byId.set(hit.additiveId, { ...existing, position: hit.position });
  }
}

/**
 * Detect standard (non-Body-6) catalogue additives from product tags + ingredients text.
 */
export function detectStandardAdditives(input: StandardDetectInput): S25DetectionHit[] {
  const entries = getStandardCatalogueEntries();
  const codeIndex = buildCodeAliasIndex(entries);
  const nameIndex = buildNameAliasIndex(entries);
  const byId = new Map<string, S25DetectionHit>();

  const tags = input.additivesTags ?? [];
  for (const tag of tags) {
    const canon = normalizeOffAdditiveTag(tag);
    if (!canon) continue;
    const entry = codeIndex.get(canon);
    if (!entry || entry.body6_existing) continue;
    if (!entry.code_detection_enabled) continue;
    if (entry.code_detection_scope === 'NAME_ONLY') continue;
    recordHit(byId, {
      additiveId: entry.additive_id,
      position: null,
      source: 'structured_tag',
    });
  }

  const text = String(input.ingredientsText || '');
  if (!text) {
    return [...byId.values()];
  }

  const lower = text.toLowerCase();
  const classSpans: DeclaredClassSpan[] = findDeclaredClassSpans(text);

  // Explicit E / INS / en:e codes
  EXPLICIT_CODE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EXPLICIT_CODE_RE.exec(text)) !== null) {
    const canon = normalizeCodedTermToAdditiveId(m[0]);
    if (!canon) continue;
    const entry = codeIndex.get(canon);
    if (!entry || !entry.code_detection_enabled) continue;
    if (entry.code_detection_scope === 'NAME_ONLY') continue;
    recordHit(byId, {
      additiveId: entry.additive_id,
      position: m.index,
      source: 'explicit_code',
    });
  }

  // Bare numeric codes — only within declared additive context when required
  BARE_NUMERIC_RE.lastIndex = 0;
  while ((m = BARE_NUMERIC_RE.exec(text)) !== null) {
    const token = m[0];
    // Skip if this is part of an E/INS prefix already counted
    const before = text.slice(Math.max(0, m.index - 4), m.index).toLowerCase();
    if (/(?:^|[^a-z])(?:e|ins)\s*-?\s*$/i.test(before) || /en:$/i.test(before)) {
      continue;
    }
    const canon = normalizeCodedTermToAdditiveId(token);
    if (!canon) continue;
    const entry = codeIndex.get(canon);
    if (!entry || !entry.code_detection_enabled) continue;
    if (entry.code_detection_scope === 'NAME_ONLY') continue;
    if (entry.bare_numeric_requires_declared_additive_context) {
      if (!isWithinDeclaredAdditiveContext(text, m.index, classSpans)) continue;
    }
    recordHit(byId, {
      additiveId: entry.additive_id,
      position: m.index,
      source: 'declared_class_code',
    });
  }

  // Name aliases — WITHIN_DECLARED_ADDITIVE_CONTEXT for all v0.7 rows
  for (const { aliasLower, entry } of nameIndex) {
    const re = new RegExp(
      `(^|[^a-z0-9])(${escapeRegExp(aliasLower)})(?=[^a-z0-9]|$)`,
      'gi'
    );
    let nm: RegExpExecArray | null;
    while ((nm = re.exec(lower)) !== null) {
      const start = nm.index + nm[1].length;
      if (entry.name_detection_scope === 'WITHIN_DECLARED_ADDITIVE_CONTEXT') {
        if (!isWithinDeclaredAdditiveContext(text, start, classSpans)) continue;
      }
      recordHit(byId, {
        additiveId: entry.additive_id,
        position: start,
        source: 'name',
      });
    }
  }

  return [...byId.values()];
}
