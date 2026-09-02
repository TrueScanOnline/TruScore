/**
 * Planet Pillar v19 — stable production adjustment IDs and commentary registry.
 * Bound to fired adjustments for S28 (exhaustive) and S12 (governed selection).
 *
 * Authority: Rveel_Wave3_Planet_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260901_v0_1 §9.
 * IDs deliberately say "environmental" rather than Eco-Score/Green-Score so upstream naming
 * changes never force an internal scoring-ID migration. Scoring arithmetic is unchanged.
 */

export type PlanetV19AdjustmentFamily = 'system' | 'environmental' | 'packaging';

export type PlanetV19AdjustmentId =
  | 'planet-v19-base'
  | 'planet-v19-environmental-a'
  | 'planet-v19-environmental-b'
  | 'planet-v19-environmental-c'
  | 'planet-v19-environmental-d'
  | 'planet-v19-environmental-e'
  | 'planet-v19-environmental-no-usable-grade'
  | 'planet-v19-packaging-all-kerbside'
  | 'planet-v19-packaging-some-kerbside'
  | 'planet-v19-packaging-neutral-evidence'
  | 'planet-v19-packaging-no-evidence';

export interface PlanetV19AdjustmentMeta {
  id: PlanetV19AdjustmentId;
  family: PlanetV19AdjustmentFamily;
  /** Points applied in production scorer (0 for neutral rows). */
  points: number;
  highlightEligible: boolean;
  description: string;
  /** L1 overall-screen highlight title (S12). Omitted when not highlight-eligible. */
  highlightTitle?: string;
  /** L2 drill-down explainer. `[Australia/New Zealand]` resolves from the fired jurisdiction metadata. */
  highlightExplainer?: string;
  externalResource: string;
}

const GREEN_SCORE_RESOURCE = 'https://blog.openfoodfacts.org/en/EN-Pro-Platform-User-Guide.pdf';
const PACKAGING_AU_RESOURCE = 'https://apco.org.au/faqs?category=Australasian+Recycling+Label+Program';
const OFF_RESOURCE = 'https://world.openfoodfacts.org/';

const GREEN_SCORE_L2_PREFIX =
  'Open Food Facts’ Green-Score estimates a food’s environmental impact using life-cycle data for its product category, then ' +
  'adjusts for product-specific information such as ingredients, origins and packaging.';

export const PLANET_V19_ADJUSTMENT_REGISTRY: Record<PlanetV19AdjustmentId, PlanetV19AdjustmentMeta> = {
  'planet-v19-base': {
    id: 'planet-v19-base',
    family: 'system',
    points: 0,
    highlightEligible: false,
    description: 'Base score +15 (uniform across pillars) — internal starting point, never a consumer Highlight',
    externalResource: OFF_RESOURCE,
  },
  'planet-v19-environmental-a': {
    id: 'planet-v19-environmental-a',
    family: 'environmental',
    points: 7,
    highlightEligible: true,
    description: 'Reported environmental grade A',
    highlightTitle: 'A — lower environmental impact',
    highlightExplainer: `${GREEN_SCORE_L2_PREFIX} This product received an A, the lowest-impact grade on its A–E scale.`,
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-environmental-b': {
    id: 'planet-v19-environmental-b',
    family: 'environmental',
    points: 3,
    highlightEligible: true,
    description: 'Reported environmental grade B',
    highlightTitle: 'B — relatively low environmental impact',
    highlightExplainer: `${GREEN_SCORE_L2_PREFIX} This product received a B, indicating relatively low estimated impact on its A–E scale.`,
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-environmental-c': {
    id: 'planet-v19-environmental-c',
    family: 'environmental',
    points: -1,
    highlightEligible: true,
    description: 'Reported environmental grade C',
    highlightTitle: 'C — moderate environmental impact',
    highlightExplainer: `${GREEN_SCORE_L2_PREFIX} This product received a C, the middle grade on its A–E scale.`,
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-environmental-d': {
    id: 'planet-v19-environmental-d',
    family: 'environmental',
    points: -3,
    highlightEligible: true,
    description: 'Reported environmental grade D',
    highlightTitle: 'D — higher environmental impact',
    highlightExplainer: `${GREEN_SCORE_L2_PREFIX} This product received a D, indicating higher estimated impact on its A–E scale.`,
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-environmental-e': {
    id: 'planet-v19-environmental-e',
    family: 'environmental',
    points: -7,
    highlightEligible: true,
    description: 'Reported environmental grade E',
    highlightTitle: 'E — very high environmental impact',
    highlightExplainer: `${GREEN_SCORE_L2_PREFIX} This product received an E, the highest-impact grade on its A–E scale.`,
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-environmental-no-usable-grade': {
    id: 'planet-v19-environmental-no-usable-grade',
    family: 'environmental',
    points: 0,
    highlightEligible: false,
    description: 'No usable A–E environmental grade — packaging fallback gate opens (diagnostic context only)',
    externalResource: GREEN_SCORE_RESOURCE,
  },
  'planet-v19-packaging-all-kerbside': {
    id: 'planet-v19-packaging-all-kerbside',
    family: 'packaging',
    points: 2,
    highlightEligible: true,
    description: 'Packaging fallback +2: all primary components kerbside-recyclable in the active jurisdiction',
    highlightTitle: 'Primary packaging is kerbside recyclable',
    highlightExplainer:
      'No usable Open Food Facts Green-Score is available for this product. In [Australia/New Zealand], the packaging evidence ' +
      'available to Rveel indicates that all primary packaging components can go in ordinary kerbside recycling.',
    externalResource: PACKAGING_AU_RESOURCE,
  },
  'planet-v19-packaging-some-kerbside': {
    id: 'planet-v19-packaging-some-kerbside',
    family: 'packaging',
    points: 1,
    highlightEligible: true,
    description: 'Packaging fallback +1: at least one primary component kerbside-recyclable, none not-recyclable',
    highlightTitle: 'Some primary packaging is kerbside recyclable',
    highlightExplainer:
      'No usable Open Food Facts Green-Score is available for this product. In [Australia/New Zealand], the packaging evidence ' +
      'available to Rveel confirms kerbside recycling for at least one primary packaging component, but not the full primary ' +
      'packaging set.',
    externalResource: PACKAGING_AU_RESOURCE,
  },
  'planet-v19-packaging-neutral-evidence': {
    id: 'planet-v19-packaging-neutral-evidence',
    family: 'packaging',
    points: 0,
    highlightEligible: false,
    description:
      'Packaging fallback 0: packaging evidence present but insufficient, conditional-only, incomplete or non-approved market',
    externalResource: PACKAGING_AU_RESOURCE,
  },
  'planet-v19-packaging-no-evidence': {
    id: 'planet-v19-packaging-no-evidence',
    family: 'packaging',
    points: 0,
    highlightEligible: false,
    description: 'Packaging fallback 0: no structured packaging evidence (Confidence / missing-data context only)',
    externalResource: PACKAGING_AU_RESOURCE,
  },
};

const ENVIRONMENTAL_GRADE_IDS: Record<string, PlanetV19AdjustmentId> = {
  a: 'planet-v19-environmental-a',
  b: 'planet-v19-environmental-b',
  c: 'planet-v19-environmental-c',
  d: 'planet-v19-environmental-d',
  e: 'planet-v19-environmental-e',
};

/** Stable ID for a usable A–E environmental grade; null when the grade is not usable. */
export function planetV19EnvironmentalGradeAdjustmentId(grade: string | undefined): PlanetV19AdjustmentId | null {
  if (!grade) return null;
  return ENVIRONMENTAL_GRADE_IDS[grade.toLowerCase()] ?? null;
}

/** Stable ID for a scoring packaging fallback outcome (+2 / +1 only). */
export function planetV19PackagingFallbackAdjustmentId(points: 1 | 2): PlanetV19AdjustmentId {
  return points === 2 ? 'planet-v19-packaging-all-kerbside' : 'planet-v19-packaging-some-kerbside';
}
