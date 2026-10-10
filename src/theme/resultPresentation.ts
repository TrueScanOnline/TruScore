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
  /**
   * A · Emerald Perspectives appearance.
   * Visual approval does not close corrective-package acceptance.
   * These values do not choose a score, a publication state, or a contribution action.
   */
  emerald: {
    /** Luminous emerald. Deep accent stays a small wallpaper mark, not the page colour. */
    wallpaperBase: '#10957E',
    wallpaper: {
      light: '#27B899',
      main: '#10957E',
      deep: '#087565',
    },
    card: { light: '#FFFFFF', dark: '#182E29' },
    ink: { light: '#101C36', dark: '#F0F7F4' },
    muted: { light: '#536477', dark: '#BECEC7' },
    line: { light: '#E1ECE8', dark: '#36574B' },
    action: { light: '#087B68', dark: '#8ED8C4' },
    question: { light: '#59616B', dark: '#BECEC7' },
    medallion: ['#FFFFFF', '#EDF0F2'] as const,
    teaser: ['#FFFFFF', '#F0FAF6'] as const,
    teaserBorder: { light: '#C9E7DF', dark: '#36574B' },
    chevronCircle: { light: '#D7F6EC', dark: '#1E4A40' },
    radius: { card: 20, tile: 22, photo: 12, teaser: 18 },
    space: { page: 16, card: 12, pad: 12, scrollTop: 8, photoPad: 10 },
    identity: { minHeight: 96, photo: 72, name: 16, nameLine: 21, brand: 13, brandLine: 18 },
    score: { title: 20, titleLine: 26, reserve: 12 },
    /** Roles at font scale 1.0. System text scaling still applies. */
    type: {
      pillarName: 13,
      pillarNameLine: 17,
      pillarValue: 20,
      pillarValueLine: 24,
      pillarIcon: 26,
      score: 40,
      scoreLine: 44,
      denominator: 12,
      denominatorLine: 15,
      band: 17,
      bandLine: 21,
      confidence: 14,
      confidenceLine: 18,
    },
    /** Share of the pillar grid, not the padded card. Ordinary phones stay near 38%. */
    medallionGridRatio: 0.38,
    /** Exposed height of the three backing sheets above the white card. */
    backingPeek: 28,
    innerFace: 108,
    arcRadius: 62,
    arcStroke: 5,
    tileHeight: 118,
    gridHeight: 244,
    tileGap: 8,
    fold: 30,
    /** Transparent wallpaper curves. They sit on the gradient and do not form a solid block. */
    curve: { shadow: 0.12, lower: 0.12 },
    foldShade: '#163F32',
    foldLight: ['#E2F0E9', '#FFFFFF'] as const,
    foldDark: ['#80958D', '#C3D6CE', '#476157'] as const,
    tileEdge: { light: '#FFFFFF', dark: '#59766A' },
    /** Mint, pale aqua, pale blue. Each sheet is drawn separately. */
    frameStack: ['#B7F3DC', '#C5F2F6', '#D7EAFF'] as const,
    frameWash: '#FFFFFF',
    discNeutral: { light: '#59616B', dark: '#D4DDD9' },
    discIconOnDark: '#DAEEE4',
    pillars: {
      Body: {
        glyph: 'apple' as const,
        icon: '#EC514F',
        light: ['#FFE4DE', '#FFC2BA', '#FF8F88'] as const,
        dark: ['#4D3034', '#42292E', '#35242A'] as const,
      },
      Planet: {
        glyph: 'leaf' as const,
        icon: '#008B76',
        light: ['#E7FFF5', '#B7F3DC', '#62D6B0'] as const,
        dark: ['#255244', '#1F4238', '#19332D'] as const,
      },
      Ethics: {
        glyph: 'message-text' as const,
        icon: '#9451E9',
        light: ['#F7ECFF', '#E2C8FF', '#C084F6'] as const,
        dark: ['#473756', '#382C47', '#2C2539'] as const,
      },
      Open: {
        glyph: 'eye' as const,
        icon: '#087BF0',
        light: ['#E7F7FF', '#C4EBFF', '#78CCF6'] as const,
        dark: ['#2C4B60', '#233C50', '#1B3043'] as const,
      },
    },
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

/** Emerald Result surfaces. Pillar identity stays separate from score-band colour. */
export function resultEmeraldTone(darkMode: boolean) {
  const mode = darkMode ? 'dark' : 'light';
  const emerald = resultPresentation.emerald;
  return {
    card: emerald.card[mode],
    ink: emerald.ink[mode],
    muted: emerald.muted[mode],
    line: emerald.line[mode],
    action: emerald.action[mode],
    question: emerald.question[mode],
    teaserBorder: emerald.teaserBorder[mode],
    chevronCircle: emerald.chevronCircle[mode],
  };
}

export function resultEmeraldPillar(pillar: ResultPillarKey, darkMode: boolean) {
  const role = resultPresentation.emerald.pillars[pillar];
  const shades = darkMode ? role.dark : role.light;
  const mapped = resultPillarSurface(pillar, true);
  if (darkMode) {
    return { glyph: role.glyph, icon: mapped.icon, text: mapped.text, tint: shades[0], gradient: shades };
  }
  return {
    glyph: role.glyph,
    icon: role.icon,
    text: resultPresentation.emerald.ink.light,
    tint: shades[0],
    gradient: shades,
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
