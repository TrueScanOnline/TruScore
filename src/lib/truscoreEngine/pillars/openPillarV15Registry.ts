/**
 * Open Pillar v15 — stable production adjustment IDs and commentary registry.
 * Bound to fired adjustments for S28 (exhaustive) and S12 (governed selection).
 */

export type OpenV15AdjustmentFamily = 'system' | 'ingredients' | 'origins';

export type OpenV15AdjustmentId =
  | 'open-v15-base'
  | 'open-v15-ing-clarity-zero'
  | 'open-v15-ing-clarity-one'
  | 'open-v15-ing-clarity-two'
  | 'open-v15-ing-clarity-three-plus'
  | 'open-v15-ing-clarity-unavailable'
  | 'open-v15-origins-evidently-complete'
  | 'open-v15-origins-pct-95-99'
  | 'open-v15-origins-pct-76-94'
  | 'open-v15-origins-pct-50-75'
  | 'open-v15-origins-pct-25-49'
  | 'open-v15-origins-pct-1-24'
  | 'open-v15-origins-qualified-partial'
  | 'open-v15-origins-packet-gap'
  | 'open-v15-origins-insufficient'
  | 'open-v15-origins-conflict';

export interface OpenV15AdjustmentMeta {
  id: OpenV15AdjustmentId;
  family: OpenV15AdjustmentFamily;
  /** Points applied in production scorer (0 for neutral rows). */
  points: number;
  highlightEligible: boolean;
  description: string;
  /** L1 overall-screen highlight title (S12). Omitted when not highlight-eligible. */
  highlightTitle?: string;
  /** L2 drill-down explainer. */
  highlightExplainer?: string;
  externalResource: string;
  /** Wave 4 / alternate source required — registered but not wired to OFF-only MVP. */
  mvpUnreachable?: boolean;
}

export const OPEN_V15_ADJUSTMENT_REGISTRY: Record<OpenV15AdjustmentId, OpenV15AdjustmentMeta> = {
  'open-v15-base': {
    id: 'open-v15-base',
    family: 'system',
    points: 0,
    highlightEligible: false,
    description:
      'Base score +15 (uniform across pillars) — carried on pillar.baseScore, not the fired-adjustment ledger',
    externalResource: 'https://world.openfoodfacts.org/',
  },
  'open-v15-ing-clarity-zero': {
    id: 'open-v15-ing-clarity-zero',
    family: 'ingredients',
    points: 1,
    highlightEligible: true,
    description: 'Ingredient wording clarity: no governed vague or code-dependent flags',
    highlightTitle: 'Clear ingredient wording',
    highlightExplainer:
      'The ingredient list uses specific wording with no governed broad, generic or code-only additive forms.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
  },
  'open-v15-ing-clarity-one': {
    id: 'open-v15-ing-clarity-one',
    family: 'ingredients',
    points: -2,
    highlightEligible: true,
    description: 'Ingredient wording clarity: one governed vague or code-dependent flag',
    highlightTitle: 'Possible vague ingredient wording',
    highlightExplainer:
      'One governed broad, generic or code-dependent ingredient form was detected; clearer identity would improve transparency.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
  },
  'open-v15-ing-clarity-two': {
    id: 'open-v15-ing-clarity-two',
    family: 'ingredients',
    points: -4,
    highlightEligible: true,
    description: 'Ingredient wording clarity: two governed vague or code-dependent flags',
    highlightTitle: 'Vague ingredient wording',
    highlightExplainer:
      'Two governed broad, generic or code-dependent ingredient forms were detected.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
  },
  'open-v15-ing-clarity-three-plus': {
    id: 'open-v15-ing-clarity-three-plus',
    family: 'ingredients',
    points: -6,
    highlightEligible: true,
    description: 'Ingredient wording clarity: three or more governed vague or code-dependent flags',
    highlightTitle: 'Heavy vague ingredient wording',
    highlightExplainer:
      'Three or more governed broad, generic or code-dependent ingredient forms were detected.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
  },
  'open-v15-ing-clarity-unavailable': {
    id: 'open-v15-ing-clarity-unavailable',
    family: 'ingredients',
    points: 0,
    highlightEligible: false,
    description: 'Ingredient wording clarity: usable ingredient declaration unavailable',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
  },
  'open-v15-origins-evidently-complete': {
    id: 'open-v15-origins-evidently-complete',
    family: 'origins',
    points: 8,
    highlightEligible: true,
    description: 'Origins: evidently complete ingredient-origin disclosure (single-ingredient OFF exception)',
    highlightTitle: 'Evident ingredient origin',
    highlightExplainer:
      'For this single-ingredient product, Open Food Facts carries a specific disclosed ingredient origin with no conflict.',
    externalResource: 'https://world.openfoodfacts.org/origins',
  },
  'open-v15-origins-pct-95-99': {
    id: 'open-v15-origins-pct-95-99',
    family: 'origins',
    points: 4,
    highlightEligible: true,
    description: 'Origins: 95–99% disclosed ingredient-origin completeness',
    highlightTitle: 'Near-complete origin disclosure',
    highlightExplainer: 'Manufacturer disclosure indicates 95–99% ingredient-origin completeness.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-76-94': {
    id: 'open-v15-origins-pct-76-94',
    family: 'origins',
    points: -1,
    highlightEligible: true,
    description: 'Origins: 76–94% disclosed ingredient-origin completeness',
    highlightTitle: 'Partial origin disclosure (76–94%)',
    highlightExplainer: 'Manufacturer disclosure indicates partial ingredient-origin completeness (76–94%).',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-50-75': {
    id: 'open-v15-origins-pct-50-75',
    family: 'origins',
    points: -3,
    highlightEligible: true,
    description: 'Origins: 50–75% disclosed ingredient-origin completeness',
    highlightTitle: 'Limited origin disclosure (50–75%)',
    highlightExplainer: 'Manufacturer disclosure indicates limited ingredient-origin completeness (50–75%).',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-25-49': {
    id: 'open-v15-origins-pct-25-49',
    family: 'origins',
    points: -5,
    highlightEligible: true,
    description: 'Origins: 25–49% disclosed ingredient-origin completeness',
    highlightTitle: 'Low origin disclosure (25–49%)',
    highlightExplainer: 'Manufacturer disclosure indicates low ingredient-origin completeness (25–49%).',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-1-24': {
    id: 'open-v15-origins-pct-1-24',
    family: 'origins',
    points: -7,
    highlightEligible: true,
    description: 'Origins: 1–24% disclosed ingredient-origin completeness',
    highlightTitle: 'Minimal origin disclosure (1–24%)',
    highlightExplainer: 'Manufacturer disclosure indicates minimal ingredient-origin completeness (1–24%).',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-qualified-partial': {
    id: 'open-v15-origins-qualified-partial',
    family: 'origins',
    points: -4,
    highlightEligible: true,
    description: 'Origins: qualified or unquantified partial disclosure',
    highlightTitle: 'Qualified partial origin disclosure',
    highlightExplainer:
      'Origin wording is qualified or partial without a governed quantified completeness percentage.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-packet-gap': {
    id: 'open-v15-origins-packet-gap',
    family: 'origins',
    points: -8,
    highlightEligible: true,
    description: 'Origins: governed verified packet disclosure gap',
    highlightTitle: 'Origin disclosure gap',
    highlightExplainer:
      'A governed verified packet disclosure gap was identified for ingredient origins.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-insufficient': {
    id: 'open-v15-origins-insufficient',
    family: 'origins',
    points: 0,
    highlightEligible: false,
    description: 'Origins: insufficient OFF ingredient-origin evidence (neutral)',
    externalResource: 'https://world.openfoodfacts.org/origins',
  },
  'open-v15-origins-conflict': {
    id: 'open-v15-origins-conflict',
    family: 'origins',
    points: 0,
    highlightEligible: false,
    description: 'Origins: conflicting OFF ingredient-origin evidence (fail closed, neutral)',
    externalResource: 'https://world.openfoodfacts.org/origins',
  },
};

/** MVP Wave 3: percentage / qualified / packet-gap states registered but not wired to OFF-only evidence. */
export const OPEN_V15_MVP_UNREACHABLE_ORIGINS_IDS: OpenV15AdjustmentId[] = (
  Object.values(OPEN_V15_ADJUSTMENT_REGISTRY) as OpenV15AdjustmentMeta[]
)
  .filter((m) => m.mvpUnreachable)
  .map((m) => m.id);

export function openV15PositiveRank(points: number): number {
  if (points === 8) return 3;
  if (points === 4) return 2;
  if (points === 1) return 1;
  return 0;
}
