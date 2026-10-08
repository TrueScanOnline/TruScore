/**
 * Shared Result presentation tokens.
 * Approved Discovery appearance: 2d9527169dac52bc04ac02859f566fb5daa63e86.
 * That visual approval does not close corrective-package acceptance.
 *
 * These tokens describe colour, type, spacing and icon roles.
 * They do not choose a score, a publication state, or a contribution action.
 */

export const resultPresentation = {
  neutral: '#8a8a8a',
  track: '#e7eeec',
  disclaimer: {
    light: '#f3f5f6',
    dark: '#2a2e32',
  },
  type: {
    display: 34,
    title: 20,
    body: 15,
    meta: 12,
  },
  radius: {
    card: 18,
    tile: 14,
    chip: 12,
  },
  space: {
    gap: 8,
    card: 12,
    scrollClearance: 32,
  },
  tap: {
    min: 44,
  },
  ring: {
    rated: 96,
    neutral: 64,
    stroke: 8,
  },
  pillars: {
    Body: { tint: '#fff1f1', icon: '#c45c5c', glyph: 'apple' },
    Planet: { tint: '#eaf8f2', icon: '#1e8f68', glyph: 'leaf' },
    Ethics: { tint: '#f3f0ff', icon: '#6e5bd6', glyph: 'message-outline' },
    Open: { tint: '#eef4fc', icon: '#3d7ed6', glyph: 'eye-outline' },
  },
} as const;

export type ResultPillarKey = keyof typeof resultPresentation.pillars;
