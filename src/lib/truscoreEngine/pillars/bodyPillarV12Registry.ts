/**
 * Body Pillar v12 — stable production adjustment IDs and commentary registry.
 * Bound to fired adjustments for S28 (exhaustive) and S12 (governed selection).
 *
 * Authority: Rveel_Wave3_Body_Score_Highlights_Founder_Locked_..._ID_Contract_..._v0_5 §14
 * plus the consolidated v0.4 controlling specification (body-v12-nova-1-unknown).
 * Scoring arithmetic is unchanged by this registry.
 */

export type BodyV12AdjustmentFamily = 'system' | 'nutrition' | 'processing' | 'additives';

/** Presentation-only synthesis family; never a scoring adjustment ID. */
export type BodyV12SynthesisFamily = 'body.additives.colour_warning_cluster';

export type BodyV12AdjustmentId =
  | 'body-v12-base'
  | 'body-v12-nutri-a'
  | 'body-v12-nutri-b'
  | 'body-v12-nutri-c'
  | 'body-v12-nutri-d'
  | 'body-v12-nutri-e'
  | 'body-v12-nutri-unavailable'
  | 'body-v12-nutri-unrecognised'
  | 'body-v12-whole-produce-rescue'
  | 'body-v12-nova-1-off'
  | 'body-v12-nova-1-inferred'
  | 'body-v12-nova-1-unknown'
  | 'body-v12-nova-2'
  | 'body-v12-nova-3'
  | 'body-v12-nova-4'
  | 'body-v12-additive-e102'
  | 'body-v12-additive-e110'
  | 'body-v12-additive-e129'
  | 'body-v12-additive-e171'
  | 'body-v12-additive-e250'
  | 'body-v12-additive-e951'
  | 'body-v12-additive-cap'
  | 'body-v12-red-additive-ceiling'
  | 'body-v12-final-floor';

export interface BodyV12AdjustmentMeta {
  id: BodyV12AdjustmentId;
  family: BodyV12AdjustmentFamily;
  /** Points applied in production scorer (0 for neutral rows; see `dynamicPoints` for normalisers). */
  points: number;
  /** True when the fired value is computed at scoring time (cap / ceiling / floor normalisers). */
  dynamicPoints?: boolean;
  highlightEligible: boolean;
  description: string;
  /** L1 overall-screen highlight title (S12). Omitted when not highlight-eligible. */
  highlightTitle?: string;
  /** L2 drill-down explainer. */
  highlightExplainer?: string;
  /** Presentation synthesis family bound to the exact fired IDs (S12 only, never scored). */
  synthesisFamily?: BodyV12SynthesisFamily;
  externalResource: string;
}

const NUTRISCORE_RESOURCE = 'https://www.santepubliquefrance.fr/en/nutrition-and-physical-activity/nutri-score';
const NOVA_RESOURCE = 'https://www.fao.org/3/ca5644en/ca5644en.pdf';
const NOVA_4_HEALTH_RESOURCE =
  'https://www.who.int/news-room/articles-detail/call-for-experts-to-develop-a-who-guideline-on-consumption-of-ultra-processed-foods';
const COLOUR_RESOURCE = 'https://www.foodstandards.gov.au/consumer/additives/foodcolour';
const E171_RESOURCE = 'https://www.foodstandards.gov.au/consumer/foodtech/Review-of-titanium-dioxide-as-a-food-additive';
const E250_RESOURCE = 'https://www.foodstandards.gov.au/consumer/additives/nitrate';
const E951_RESOURCE = 'https://www.who.int/news/item/14-07-2023-aspartame-hazard-and-risk-assessment-results-released';
const OFF_RESOURCE = 'https://world.openfoodfacts.org/';

const NUTRISCORE_L2_PREFIX =
  'Nutri-Score weighs energy, sugars, saturated fat and salt against favourable features such as fibre, protein, fruit, vegetables and legumes.';

const COLOUR_L1 = 'EU/UK packs warn about children’s activity and attention';

/**
 * Single-colour L2. Where two or three governed colours fire together, S12 selects the
 * multi-colour variant through the `body.additives.colour_warning_cluster` synthesis family.
 */
function colourExplainer(colourName: string): string {
  return (
    `This product contains ${colourName}, an industrially made, petroleum-derived food colour for which EU/UK packs must warn that it ` +
    '“may have an adverse effect on activity and attention in children.” It remains permitted in AU/NZ, where FSANZ says the evidence ' +
    'has not established a causal link between the individual colour and behavioural effects. In the US, FDA is working with industry ' +
    'to eliminate petroleum-based food dyes by the end of 2027, and California will prohibit this colour in specified public-school ' +
    'foods from the end of 2027.'
  );
}

export const BODY_V12_ADJUSTMENT_REGISTRY: Record<BodyV12AdjustmentId, BodyV12AdjustmentMeta> = {
  'body-v12-base': {
    id: 'body-v12-base',
    family: 'system',
    points: 0,
    highlightEligible: false,
    description:
      'Base score +15 (uniform across pillars) — carried on pillar.baseScore, not the fired-adjustment ledger',
    externalResource: OFF_RESOURCE,
  },
  'body-v12-nutri-a': {
    id: 'body-v12-nutri-a',
    family: 'nutrition',
    points: 7,
    highlightEligible: true,
    description: 'Nutri-Score grade A (highest nutritional quality)',
    highlightTitle: 'A — highest nutritional quality',
    highlightExplainer: `${NUTRISCORE_L2_PREFIX} For this product, that overall balance is strongly favourable, placing it in the highest grade.`,
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-b': {
    id: 'body-v12-nutri-b',
    family: 'nutrition',
    points: 3,
    highlightEligible: true,
    description: 'Nutri-Score grade B (favourable nutritional profile)',
    highlightTitle: 'B — favourable nutritional profile',
    highlightExplainer: `${NUTRISCORE_L2_PREFIX} For this product, the overall balance remains favourable, resulting in a B.`,
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-c': {
    id: 'body-v12-nutri-c',
    family: 'nutrition',
    points: -1,
    highlightEligible: true,
    description: 'Nutri-Score grade C (nutritional middle ground)',
    highlightTitle: 'C — nutritional middle ground',
    highlightExplainer:
      'This product has a mixed nutritional profile overall. Nutri-Score weighs energy, sugars, saturated fat and salt against ' +
      'favourable features such as fibre, protein, fruit, vegetables and legumes, and the resulting balance places it around the ' +
      'middle of the scale.',
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-d': {
    id: 'body-v12-nutri-d',
    family: 'nutrition',
    points: -3,
    highlightEligible: true,
    description: 'Nutri-Score grade D (less favourable nutritional profile)',
    highlightTitle: 'D — less favourable nutritional profile',
    highlightExplainer:
      'This product has a less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry more weight in ' +
      'its Nutri-Score calculation than favourable features such as fibre, protein, fruit, vegetables and legumes.',
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-e': {
    id: 'body-v12-nutri-e',
    family: 'nutrition',
    points: -7,
    highlightEligible: true,
    description: 'Nutri-Score grade E (lowest nutritional quality)',
    highlightTitle: 'E — lowest nutritional quality',
    highlightExplainer:
      'This product has a distinctly less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry enough ' +
      'weight in its Nutri-Score calculation to place it in the lowest grade, even after favourable features are considered.',
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-unavailable': {
    id: 'body-v12-nutri-unavailable',
    family: 'nutrition',
    points: 0,
    highlightEligible: false,
    description: 'Nutri-Score: no usable grade available (diagnostic / Confidence context only)',
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-nutri-unrecognised': {
    id: 'body-v12-nutri-unrecognised',
    family: 'nutrition',
    points: 0,
    highlightEligible: false,
    description: 'Nutri-Score: value present but not a recognised A–E grade (diagnostic only)',
    externalResource: NUTRISCORE_RESOURCE,
  },
  'body-v12-whole-produce-rescue': {
    id: 'body-v12-whole-produce-rescue',
    family: 'nutrition',
    points: 7,
    highlightEligible: false,
    description:
      'Whole Produce nutrition rescue (unprocessed / minimally processed single ingredient, no valid Nutri-Score) — founder-locked Highlight exclusion',
    externalResource: OFF_RESOURCE,
  },
  'body-v12-nova-1-off': {
    id: 'body-v12-nova-1-off',
    family: 'processing',
    points: 3,
    highlightEligible: true,
    description: 'NOVA Group 1 supplied by accepted external product evidence (unprocessed / minimally processed)',
    highlightTitle: 'Unprocessed or minimally processed',
    highlightExplainer:
      'NOVA Group 1 covers foods that are unprocessed or only minimally changed, such as fresh or frozen produce, grains, legumes, ' +
      'eggs, plain dairy, meat and fish.',
    externalResource: NOVA_RESOURCE,
  },
  'body-v12-nova-1-inferred': {
    id: 'body-v12-nova-1-inferred',
    family: 'processing',
    points: 3,
    highlightEligible: false,
    description: 'NOVA Group 1 internally inferred by Rveel rescue — same scoring effect, consumer Highlight excluded',
    externalResource: NOVA_RESOURCE,
  },
  'body-v12-nova-1-unknown': {
    id: 'body-v12-nova-1-unknown',
    family: 'processing',
    points: 3,
    highlightEligible: false,
    description:
      'NOVA Group 1 present but provenance unresolved / legacy-ambiguous — same scoring effect, fail-closed consumer treatment',
    externalResource: NOVA_RESOURCE,
  },
  'body-v12-nova-2': {
    id: 'body-v12-nova-2',
    family: 'processing',
    points: 1,
    highlightEligible: true,
    description: 'NOVA Group 2 (processed culinary ingredients)',
    highlightTitle: 'Processed culinary ingredient',
    highlightExplainer:
      'NOVA Group 2 is essentially the kitchen-building-block category: ingredients such as oils, butter, sugar and salt that are ' +
      'extracted or refined mainly to prepare other foods and are not typically consumed on their own.',
    externalResource: NOVA_RESOURCE,
  },
  'body-v12-nova-3': {
    id: 'body-v12-nova-3',
    family: 'processing',
    points: -1,
    highlightEligible: true,
    description: 'NOVA Group 3 (processed)',
    highlightTitle: 'Processed food',
    highlightExplainer:
      'NOVA Group 3 generally starts with an unprocessed or minimally processed Group 1 food, then adds Group 2 culinary ingredients ' +
      'such as salt, sugar, oil or vinegar — often to preserve it or change its flavour or texture.',
    externalResource: NOVA_RESOURCE,
  },
  'body-v12-nova-4': {
    id: 'body-v12-nova-4',
    family: 'processing',
    points: -6,
    highlightEligible: true,
    description: 'NOVA Group 4 (ultra-processed)',
    highlightTitle: 'Ultra-processed food',
    highlightExplainer:
      'NOVA Group 4 covers industrial formulations that typically involve refined ingredients, additives or processing methods ' +
      'uncommon in home cooking. WHO says a growing body of evidence links diets high in ultra-processed foods with higher risks ' +
      'of diet-related disease and other negative health outcomes.',
    externalResource: NOVA_4_HEALTH_RESOURCE,
  },
  'body-v12-additive-e102': {
    id: 'body-v12-additive-e102',
    family: 'additives',
    points: -3,
    highlightEligible: true,
    description: 'Food additive of concern: E102 Tartrazine',
    highlightTitle: COLOUR_L1,
    highlightExplainer: colourExplainer('Tartrazine (E102)'),
    synthesisFamily: 'body.additives.colour_warning_cluster',
    externalResource: COLOUR_RESOURCE,
  },
  'body-v12-additive-e110': {
    id: 'body-v12-additive-e110',
    family: 'additives',
    points: -3,
    highlightEligible: true,
    description: 'Food additive of concern: E110 Sunset Yellow FCF',
    highlightTitle: COLOUR_L1,
    highlightExplainer: colourExplainer('Sunset Yellow FCF (E110)'),
    synthesisFamily: 'body.additives.colour_warning_cluster',
    externalResource: COLOUR_RESOURCE,
  },
  'body-v12-additive-e129': {
    id: 'body-v12-additive-e129',
    family: 'additives',
    points: -3,
    highlightEligible: true,
    description: 'Food additive of concern: E129 Allura Red AC',
    highlightTitle: COLOUR_L1,
    highlightExplainer: colourExplainer('Allura Red AC (E129)'),
    synthesisFamily: 'body.additives.colour_warning_cluster',
    externalResource: COLOUR_RESOURCE,
  },
  'body-v12-additive-e171': {
    id: 'body-v12-additive-e171',
    family: 'additives',
    points: -3,
    highlightEligible: true,
    description: 'Food additive of concern: E171 Titanium dioxide',
    highlightTitle: 'A food whitener the EU stopped permitting',
    highlightExplainer:
      'Titanium dioxide (E171) is a synthetically produced white pigment made from naturally occurring ores and used to make foods ' +
      'look whiter or brighter. The EU stopped permitting it in food after European food-safety experts said a possible DNA-damage ' +
      'concern could not be ruled out; FSANZ found no safety concerns in its review, while Health Canada said there was no conclusive ' +
      'scientific evidence that food-grade titanium dioxide is a human-health concern. The US still permits titanium dioxide in food ' +
      'as a colour, capped at 1% by weight.',
    externalResource: E171_RESOURCE,
  },
  'body-v12-additive-e250': {
    id: 'body-v12-additive-e250',
    family: 'additives',
    points: -6,
    highlightEligible: true,
    description: 'Food additive of concern: E250 Sodium nitrite',
    highlightTitle: 'Nitrite helps keep cured meat safe — but can form carcinogenic compounds',
    highlightExplainer:
      'Sodium nitrite (E250) is added to bacon, ham and sausages to control dangerous bacteria, extend safe shelf life and create the ' +
      'familiar cured flavour and pink colour. The trade-off is that it can help form chemicals called nitrosamines, some of which are ' +
      'carcinogenic: the EU cut permitted nitrite levels in 2025, Denmark maintains even tighter limits, and US bacon rules require ' +
      'vitamin-C-like compounds that reduce nitrosamine formation. FSANZ says Australians’ overall dietary exposure to nitrates and ' +
      'nitrites is not considered an appreciable health and safety risk.',
    externalResource: E250_RESOURCE,
  },
  'body-v12-additive-e951': {
    id: 'body-v12-additive-e951',
    family: 'additives',
    points: -3,
    highlightEligible: true,
    description: 'Food additive of concern: E951 Aspartame',
    highlightTitle: 'Aspartame classified as “possibly carcinogenic”',
    highlightExplainer:
      'Aspartame (E951) is an artificial sweetener made from two amino acids and is about 200 times sweeter than sugar. WHO’s cancer ' +
      'research agency classified it as “possibly carcinogenic” in 2023, based on limited evidence, while WHO’s food-additive experts ' +
      'kept the accepted daily intake unchanged. FSANZ says current AU/NZ standards remain appropriate, and the US FDA continues to ' +
      'consider its approved uses safe under its conditions of use.',
    externalResource: E951_RESOURCE,
  },
  'body-v12-additive-cap': {
    id: 'body-v12-additive-cap',
    family: 'additives',
    points: 0,
    dynamicPoints: true,
    highlightEligible: false,
    description:
      'Food additive element cap normaliser (raw per-additive deductions exceeded the governed −8 element cap) — arithmetic only',
    externalResource: OFF_RESOURCE,
  },
  'body-v12-red-additive-ceiling': {
    id: 'body-v12-red-additive-ceiling',
    family: 'additives',
    points: 0,
    dynamicPoints: true,
    highlightEligible: false,
    description: 'Red-tier additive Body score ceiling normaliser (12/25) — arithmetic only',
    externalResource: OFF_RESOURCE,
  },
  'body-v12-final-floor': {
    id: 'body-v12-final-floor',
    family: 'system',
    points: 0,
    dynamicPoints: true,
    highlightEligible: false,
    description: 'Final Body floor normaliser (2/25) — arithmetic only',
    externalResource: OFF_RESOURCE,
  },
};

const NUTRI_GRADE_IDS: Record<string, BodyV12AdjustmentId> = {
  a: 'body-v12-nutri-a',
  b: 'body-v12-nutri-b',
  c: 'body-v12-nutri-c',
  d: 'body-v12-nutri-d',
  e: 'body-v12-nutri-e',
};

/** Stable ID for a validated OFF Nutri-Score grade; null when the grade is not a recognised A–E value. */
export function bodyV12NutriScoreAdjustmentId(grade: string | undefined): BodyV12AdjustmentId | null {
  if (!grade) return null;
  return NUTRI_GRADE_IDS[grade.toLowerCase()] ?? null;
}

/** Stable ID for NOVA groups 2–4. NOVA 1 is provenance-dependent — use `bodyNova1AdjustmentId`. */
export function bodyV12NovaAdjustmentId(novaGroup: number): BodyV12AdjustmentId | null {
  if (novaGroup === 2) return 'body-v12-nova-2';
  if (novaGroup === 3) return 'body-v12-nova-3';
  if (novaGroup === 4) return 'body-v12-nova-4';
  return null;
}

/** Canonical MVP additive key (e102 …) → locked Body v12 adjustment ID. */
export const BODY_V12_ADDITIVE_ID_BY_CANONICAL: Readonly<Record<string, BodyV12AdjustmentId>> = {
  e102: 'body-v12-additive-e102',
  e110: 'body-v12-additive-e110',
  e129: 'body-v12-additive-e129',
  e171: 'body-v12-additive-e171',
  e250: 'body-v12-additive-e250',
  e951: 'body-v12-additive-e951',
};

export function bodyV12AdditiveAdjustmentId(canonicalId: string): BodyV12AdjustmentId | undefined {
  return BODY_V12_ADDITIVE_ID_BY_CANONICAL[canonicalId.toLowerCase()];
}
