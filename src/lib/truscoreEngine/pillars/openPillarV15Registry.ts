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
    highlightTitle: 'Ingredient wording is clear where assessed',
    highlightExplainer:
      'In the ingredient list we could assess, we didn’t find any of the broad, generic or code-dependent terms Rveel checks for. That doesn’t mean every detail about the product is disclosed.',
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
    highlightTitle: 'Ingredient origins appear fully accounted for',
    highlightExplainer:
      'The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.',
    externalResource: 'https://world.openfoodfacts.org/origins',
  },
  'open-v15-origins-pct-95-99': {
    id: 'open-v15-origins-pct-95-99',
    family: 'origins',
    points: 4,
    highlightEligible: true,
    description: 'Origins: 95–99% disclosed ingredient-origin completeness',
    highlightTitle: '[X]% of ingredient sourcing disclosed',
    highlightExplainer:
      'The origin information accounts for [X]% of ingredient sourcing, leaving only a small remainder unspecified.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-76-94': {
    id: 'open-v15-origins-pct-76-94',
    family: 'origins',
    points: -1,
    highlightEligible: true,
    description: 'Origins: 76–94% disclosed ingredient-origin completeness',
    highlightTitle: '[Y]% of ingredient sourcing is unspecified',
    highlightExplainer:
      'The origin statement identifies [X]% of ingredient sourcing. It doesn’t say where the remaining [Y]% comes from.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-50-75': {
    id: 'open-v15-origins-pct-50-75',
    family: 'origins',
    points: -3,
    highlightEligible: true,
    description: 'Origins: 50–75% disclosed ingredient-origin completeness',
    highlightTitle: '[Y]% of ingredient sourcing is unspecified',
    highlightExplainer:
      'The origin statement identifies [X]% of ingredient sourcing. It doesn’t say where the remaining [Y]% comes from.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-25-49': {
    id: 'open-v15-origins-pct-25-49',
    family: 'origins',
    points: -5,
    highlightEligible: true,
    description: 'Origins: 25–49% disclosed ingredient-origin completeness',
    highlightTitle: '[Y]% of ingredient sourcing is unspecified',
    highlightExplainer:
      'The origin statement identifies [X]% of ingredient sourcing. It doesn’t say where the remaining [Y]% comes from.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-pct-1-24': {
    id: 'open-v15-origins-pct-1-24',
    family: 'origins',
    points: -7,
    highlightEligible: true,
    description: 'Origins: 1–24% disclosed ingredient-origin completeness',
    highlightTitle: '[Y]% of ingredient sourcing is unspecified',
    highlightExplainer:
      'The origin statement identifies [X]% of ingredient sourcing. It doesn’t say where the remaining [Y]% comes from.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-qualified-partial': {
    id: 'open-v15-origins-qualified-partial',
    family: 'origins',
    points: -4,
    highlightEligible: true,
    description: 'Origins: qualified or unquantified partial disclosure',
    highlightTitle: 'Origin information is only partly specific',
    highlightExplainer:
      'The origin statement says “[STATEMENT]”, but doesn’t identify where all ingredients come from or how much comes from each source.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    mvpUnreachable: true,
  },
  'open-v15-origins-packet-gap': {
    id: 'open-v15-origins-packet-gap',
    family: 'origins',
    points: -8,
    highlightEligible: true,
    description: 'Origins: governed verified packet disclosure gap',
    highlightTitle: 'No clear origin statement found',
    highlightExplainer:
      'This packet was checked and no clear ingredient-origin information was found, leaving the product’s origins unclear.',
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
