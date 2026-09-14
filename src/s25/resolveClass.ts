/**
 * Declared class/function resolution via Classes_25 parser_terms only.
 * Unknown → Surface_Copy.function_unknown (caller). Do not infer typical use.
 */

import { S25_CLASSES } from './loadAsset';
import type { S25ClassEntry } from './types';

export interface DeclaredClassSpan {
  classEntry: S25ClassEntry;
  start: number;
  end: number;
  matchedTerm: string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find all declared class/function term spans in ingredients text. */
export function findDeclaredClassSpans(ingredientsText: string): DeclaredClassSpan[] {
  const hay = String(ingredientsText || '');
  if (!hay) return [];
  const lower = hay.toLowerCase();
  const spans: DeclaredClassSpan[] = [];

  for (const entry of S25_CLASSES) {
    for (const term of entry.parser_terms) {
      const t = term.trim().toLowerCase();
      if (!t) continue;
      const re = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(t)})(?=[^a-z0-9]|$)`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(lower)) !== null) {
        const matched = m[2];
        const start = m.index + m[1].length;
        const end = start + matched.length;
        spans.push({ classEntry: entry, start, end, matchedTerm: matched });
      }
    }
  }

  spans.sort((a, b) => a.start - b.start || b.end - a.end);
  return spans;
}

/**
 * Resolve the nearest preceding declared class for a character offset in ingredients text.
 * Used for product-specific function display and name/bare-code context gates.
 */
export function resolveDeclaredClassAt(
  ingredientsText: string,
  position: number,
  precomputed?: DeclaredClassSpan[]
): S25ClassEntry | null {
  const spans = precomputed ?? findDeclaredClassSpans(ingredientsText);
  if (spans.length === 0) return null;

  // Prefer a span that contains the position, else nearest preceding within a local window.
  let best: DeclaredClassSpan | null = null;
  for (const span of spans) {
    if (position >= span.start && position <= span.end + 80) {
      if (!best || span.start >= best.start) best = span;
    } else if (position > span.end && position - span.end <= 120) {
      if (!best || span.end > best.end) best = span;
    }
  }
  return best?.classEntry ?? null;
}

/**
 * Whether `position` falls inside a declared-additive context (class term nearby / brackets).
 */
export function isWithinDeclaredAdditiveContext(
  ingredientsText: string,
  position: number,
  precomputed?: DeclaredClassSpan[]
): boolean {
  return resolveDeclaredClassAt(ingredientsText, position, precomputed) != null;
}

/** Resolve product-level declared class for an additive from its first hit position. */
export function resolveClassForAdditiveHit(
  ingredientsText: string,
  position: number | null
): S25ClassEntry | null {
  if (position == null || position < 0) return null;
  return resolveDeclaredClassAt(ingredientsText, position);
}
