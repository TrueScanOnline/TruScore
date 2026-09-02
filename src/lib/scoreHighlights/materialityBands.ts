/**
 * Locked five-band muted materiality treatment (v0.4 §4.0.1).
 *
 * Sign and materiality stay internal facts that choose a soft visual treatment. No points,
 * no public legend, no good/bad labels, no warning semantics. Exact hues remain Wave 5 polish;
 * these are restrained tints inside the Rveel palette and deliberately do not echo the
 * Nutri-Score A–E classification colours.
 */

import type { ScoreHighlightBand } from './types';

/** Internal effect band from the signed materiality actually used for ranking. */
export function scoreHighlightBand(materiality: number): ScoreHighlightBand {
  if (materiality >= 4) return 'strong_positive';
  if (materiality >= 2) return 'positive';
  if (materiality >= -1) return 'light';
  if (materiality >= -3) return 'negative';
  return 'strong_negative';
}

export interface ScoreHighlightBandStyle {
  /** Muted row tint. */
  background: string;
  /** Left rule / glyph colour. */
  accent: string;
}

const LIGHT_BAND_STYLES: Record<ScoreHighlightBand, ScoreHighlightBandStyle> = {
  // Deeper Rveel teal/green
  strong_positive: { background: '#e2f1ec', accent: '#128069' },
  // Softer green
  positive: { background: '#ecf5f1', accent: '#4a9c85' },
  // Warm sand/amber — same low-intensity family for +1 and −1
  light: { background: '#f6f1e6', accent: '#a98a4e' },
  // Muted coral / soft red
  negative: { background: '#f8eeec', accent: '#b8705f' },
  // Deeper terracotta / berry
  strong_negative: { background: '#f4e6e4', accent: '#9c4f45' },
};

const DARK_BAND_STYLES: Record<ScoreHighlightBand, ScoreHighlightBandStyle> = {
  strong_positive: { background: '#16302a', accent: '#5fbfa4' },
  positive: { background: '#1a2b27', accent: '#79c2ac' },
  light: { background: '#2b2620', accent: '#cdb27a' },
  negative: { background: '#2e2220', accent: '#d69485' },
  strong_negative: { background: '#301f1d', accent: '#c9756a' },
};

export function scoreHighlightBandStyle(
  band: ScoreHighlightBand,
  isDark: boolean
): ScoreHighlightBandStyle {
  return (isDark ? DARK_BAND_STYLES : LIGHT_BAND_STYLES)[band];
}

/**
 * Decorative direction glyph. Presentation only — hosts must mark it as non-accessible so no
 * scoring-direction narration reaches assistive technology (v0.4 accessibility clarification).
 */
export function scoreHighlightDirectionGlyph(sign: 'positive' | 'negative'): 'chevron-up' | 'chevron-down' {
  return sign === 'positive' ? 'chevron-up' : 'chevron-down';
}
