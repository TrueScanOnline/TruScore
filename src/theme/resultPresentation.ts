import { Platform, type ViewStyle } from 'react-native';

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
  canvas: {
    light: '#eef6f4',
    dark: '#141c1b',
  },
  card: {
    light: '#ffffff',
    dark: '#1e2826',
  },
  ink: {
    light: '#1c2430',
    dark: '#f3f6f5',
  },
  muted: {
    light: '#5e6b78',
    dark: '#a7b3b0',
  },
  line: {
    light: '#e3eeeb',
    dark: '#2e3a38',
  },
  stoneSoft: {
    light: '#f3f5f6',
    dark: '#2a3332',
  },
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
    photo: 12,
  },
  space: {
    gap: 8,
    card: 12,
    page: 16,
    scrollClearance: 32,
  },
  photo: {
    size: 64,
  },
  icons: {
    capture: 'camera-outline',
    enlarge: 'expand-outline',
    imageError: 'image-outline',
    close: 'close',
    contributed: 'person-circle-outline',
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
    Body: {
      glyph: 'apple',
      tint: { light: '#fff1f1', dark: '#3d2628' },
      icon: { light: '#c45c5c', dark: '#f0b0b0' },
      text: { light: '#1c2430', dark: '#f8ecec' },
    },
    Planet: {
      glyph: 'leaf',
      tint: { light: '#eaf8f2', dark: '#17342c' },
      icon: { light: '#1e8f68', dark: '#8ed8b6' },
      text: { light: '#1c2430', dark: '#e7f7f0' },
    },
    Ethics: {
      glyph: 'message-outline',
      tint: { light: '#f3f0ff', dark: '#2c2842' },
      icon: { light: '#6e5bd6', dark: '#c9bfff' },
      text: { light: '#1c2430', dark: '#f4f1ff' },
    },
    Open: {
      glyph: 'eye-outline',
      tint: { light: '#eef4fc', dark: '#1b2c40' },
      icon: { light: '#3d7ed6', dark: '#a9c8f5' },
      text: { light: '#1c2430', dark: '#eef4fc' },
    },
  },
} as const;

export type ResultPillarKey = keyof typeof resultPresentation.pillars;

/** Pillar identity colours. They are not score-band colours. */
export function resultPillarSurface(pillar: ResultPillarKey, darkMode: boolean) {
  const role = resultPresentation.pillars[pillar];
  const mode = darkMode ? 'dark' : 'light';
  return {
    glyph: role.glyph,
    tint: role.tint[mode],
    icon: role.icon[mode],
    text: role.text[mode],
  };
}

export function resultTone(darkMode: boolean) {
  const mode = darkMode ? 'dark' : 'light';
  return {
    canvas: resultPresentation.canvas[mode],
    card: resultPresentation.card[mode],
    ink: resultPresentation.ink[mode],
    muted: resultPresentation.muted[mode],
    line: resultPresentation.line[mode],
    stone: resultPresentation.stoneSoft[mode],
  };
}

/** Soft card shadow from the Discovery page. It does not encode a score band. */
export function resultSurfaceShadow(darkMode: boolean): ViewStyle {
  return (
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#1c2430',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: darkMode ? 0.28 : 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 1 },
      default: {},
    }) ?? {}
  );
}
