/**
 * Independent literal / template copy contract for Score Highlights L1/L2 (Wave 3, 5 Sept 2026).
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The founder acceptance criteria require that "pipeline-resolved commentary equals the independent
 * literal contract" (Body v0.6 Acceptance; Planet v0.2 Acceptance; Open v0.2 Acceptance). An oracle
 * that reads `resolveGovernedCopy()`, the pillar registries or any other runtime copy helper cannot
 * discharge that requirement, because it would compare the implementation against itself.
 *
 * Every `l1` / `l2` string below is hand-transcribed from the founder-locked commentary tables in:
 *   - Rveel_Wave3_Body_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_S27_Context_20260905_v0_6 §3
 *   - Rveel_Wave3_Planet_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260905_v0_2 §3
 *   - Rveel_Wave3_Ethics_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260905_v0_2 §3
 *   - Rveel_Wave3_Open_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260905_v0_2 §3
 *   - Rveel_Wave3_Consolidated_Score_Highlights_Controlling_Specification_S12_S12a_S28_..._20260905_v0_5
 *
 * HARD RULE: this module must not import `resolveGovernedCopy`, `resolveOpenGovernedCopy`,
 * `bodyColourSynthesis*`, `selectScoreHighlights` or any pillar registry. It imports only the
 * `ScoreHighlightPillar` string-union type, which carries no copy. A guard test asserts this.
 *
 * `l1Template` / `l2Template` hold the founder cell verbatim with `[Token]`s intact. `l1` / `l2`
 * hold the hand-resolved consumer string for this entry's own `fired` metadata, so the contract
 * governs both the locked wording and the token binding.
 */

import type { ScoreHighlightPillar } from '../../../lib/scoreHighlights/types';

/** How faithfully the founder document locks the string in this entry. */
export type ContractProvenance =
  /** The founder cell contains the literal consumer sentence (optionally with `[Token]`s). */
  | 'doc_literal'
  /**
   * The founder cell contains an authoring instruction plus an illustrative example rather than a
   * locked literal. The expected string is a hand-authored faithful generalisation of that
   * instruction. These are the only entries where the contract is weaker than a literal lock and
   * they are enumerated by `INSTRUCTION_DERIVED_CONTRACT_KEYS` so they stay visible.
   */
  | 'doc_instruction';

export interface ContractFiredRow {
  /** Stable production adjustment ID. */
  id: string;
  /** Points from the founder "Effect" column. */
  value: number;
  /** Score-neutral metadata the governed scorer emits for this state; drives token binding only. */
  metadata?: Record<string, string | number | boolean>;
}

export interface LiteralCopyContractEntry {
  /** Unique key for this ID/variant pair. */
  contractKey: string;
  /** Internal pillar key (never a consumer label). */
  pillar: ScoreHighlightPillar;
  /** `storyKey` the pipeline is expected to emit (adjustment ID, or a synthesis family). */
  storyKey: string;
  /** Highlight-eligible stable registry IDs this entry covers. */
  eligibleIds: readonly string[];
  /** Founder variant label, where the ID carries more than one governed variant. */
  variant?: string;
  /** Governing document + section for this row. */
  authority: string;
  /** Fired ledger rows fed to the pipeline to exercise this entry. */
  fired: readonly ContractFiredRow[];
  /** Founder L1 cell verbatim, tokens intact. */
  l1Template: string;
  /** Founder L2 cell verbatim, tokens intact. */
  l2Template: string;
  /** Hand-resolved expected consumer L1 for this entry's metadata. */
  l1: string;
  /** Hand-resolved expected consumer L2 for this entry's metadata. */
  l2: string;
  provenance: ContractProvenance;
  /** Recorded reasoning where the founder cell is not a literal, or where formatting is chosen. */
  note?: string;
}

const BODY_DOC = 'Body v0.6 §3';
const PLANET_DOC = 'Planet v0.2 §3';
const ETHICS_DOC = 'Ethics v0.2 §3';
const OPEN_DOC = 'Open v0.2 §3';

// ---------------------------------------------------------------------------
// Body — Nutri-Score (Body v0.6 §3)
// ---------------------------------------------------------------------------

const NUTRI_PREFIX_DOC =
  `Nutri-Score weighs energy, sugars, saturated fat and salt against favourable features such as fibre, protein, fruit, vegetables and legumes.`;

const BODY_NUTRI: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Body:body-v12-nutri-a',
    pillar: 'Body',
    storyKey: 'body-v12-nutri-a',
    eligibleIds: ['body-v12-nutri-a'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nutri-a', value: 7 }],
    l1Template: `A — highest nutritional quality`,
    l2Template: `${NUTRI_PREFIX_DOC} For this product, that overall balance is strongly favourable, placing it in the highest grade.`,
    l1: `A — highest nutritional quality`,
    l2: `${NUTRI_PREFIX_DOC} For this product, that overall balance is strongly favourable, placing it in the highest grade.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nutri-b',
    pillar: 'Body',
    storyKey: 'body-v12-nutri-b',
    eligibleIds: ['body-v12-nutri-b'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nutri-b', value: 3 }],
    l1Template: `B — favourable nutritional profile`,
    l2Template: `${NUTRI_PREFIX_DOC} For this product, the overall balance remains favourable, resulting in a B.`,
    l1: `B — favourable nutritional profile`,
    l2: `${NUTRI_PREFIX_DOC} For this product, the overall balance remains favourable, resulting in a B.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nutri-c',
    pillar: 'Body',
    storyKey: 'body-v12-nutri-c',
    eligibleIds: ['body-v12-nutri-c'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nutri-c', value: -1 }],
    l1Template: `C — nutritional middle ground`,
    l2Template: `This product has a mixed nutritional profile overall. Nutri-Score weighs energy, sugars, saturated fat and salt against favourable features such as fibre, protein, fruit, vegetables and legumes, and the resulting balance places it around the middle of the scale.`,
    l1: `C — nutritional middle ground`,
    l2: `This product has a mixed nutritional profile overall. Nutri-Score weighs energy, sugars, saturated fat and salt against favourable features such as fibre, protein, fruit, vegetables and legumes, and the resulting balance places it around the middle of the scale.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nutri-d',
    pillar: 'Body',
    storyKey: 'body-v12-nutri-d',
    eligibleIds: ['body-v12-nutri-d'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nutri-d', value: -3 }],
    l1Template: `D — less favourable nutritional profile`,
    l2Template: `This product has a less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry more weight in its Nutri-Score calculation than favourable features such as fibre, protein, fruit, vegetables and legumes.`,
    l1: `D — less favourable nutritional profile`,
    l2: `This product has a less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry more weight in its Nutri-Score calculation than favourable features such as fibre, protein, fruit, vegetables and legumes.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nutri-e',
    pillar: 'Body',
    storyKey: 'body-v12-nutri-e',
    eligibleIds: ['body-v12-nutri-e'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nutri-e', value: -7 }],
    l1Template: `E — lowest nutritional quality`,
    l2Template: `This product has a distinctly less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry enough weight in its Nutri-Score calculation to place it in the lowest grade, even after favourable features are considered.`,
    l1: `E — lowest nutritional quality`,
    l2: `This product has a distinctly less favourable nutritional profile overall: energy, sugars, saturated fat and salt carry enough weight in its Nutri-Score calculation to place it in the lowest grade, even after favourable features are considered.`,
    provenance: 'doc_literal',
  },
];

// ---------------------------------------------------------------------------
// Body — NOVA (Body v0.6 §3). NOVA 1 is Highlight-eligible only on the accepted
// external-provenance ID; the inferred and unknown-provenance rows are ineligible.
// ---------------------------------------------------------------------------

const BODY_NOVA: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Body:body-v12-nova-1-off',
    pillar: 'Body',
    storyKey: 'body-v12-nova-1-off',
    eligibleIds: ['body-v12-nova-1-off'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nova-1-off', value: 3 }],
    l1Template: `Unprocessed or minimally processed`,
    l2Template: `NOVA Group 1 covers foods that are unprocessed or only minimally changed, such as fresh or frozen produce, grains, legumes, eggs, plain dairy, meat and fish.`,
    l1: `Unprocessed or minimally processed`,
    l2: `NOVA Group 1 covers foods that are unprocessed or only minimally changed, such as fresh or frozen produce, grains, legumes, eggs, plain dairy, meat and fish.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nova-2',
    pillar: 'Body',
    storyKey: 'body-v12-nova-2',
    eligibleIds: ['body-v12-nova-2'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nova-2', value: 1 }],
    l1Template: `Processed culinary ingredient`,
    l2Template: `NOVA Group 2 is essentially the kitchen-building-block category: ingredients such as oils, butter, sugar and salt that are extracted or refined mainly to prepare other foods and are not typically consumed on their own.`,
    l1: `Processed culinary ingredient`,
    l2: `NOVA Group 2 is essentially the kitchen-building-block category: ingredients such as oils, butter, sugar and salt that are extracted or refined mainly to prepare other foods and are not typically consumed on their own.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nova-3',
    pillar: 'Body',
    storyKey: 'body-v12-nova-3',
    eligibleIds: ['body-v12-nova-3'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nova-3', value: -1 }],
    l1Template: `Processed food`,
    l2Template: `NOVA Group 3 generally starts with an unprocessed or minimally processed Group 1 food, then adds Group 2 culinary ingredients such as salt, sugar, oil or vinegar — often to preserve it or change its flavour or texture.`,
    l1: `Processed food`,
    l2: `NOVA Group 3 generally starts with an unprocessed or minimally processed Group 1 food, then adds Group 2 culinary ingredients such as salt, sugar, oil or vinegar — often to preserve it or change its flavour or texture.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-nova-4',
    pillar: 'Body',
    storyKey: 'body-v12-nova-4',
    eligibleIds: ['body-v12-nova-4'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-nova-4', value: -6 }],
    l1Template: `Ultra-processed food`,
    l2Template: `NOVA Group 4 covers industrial formulations that typically involve refined ingredients, additives or processing methods uncommon in home cooking. WHO says diets high in ultra-processed foods are associated with higher risks of diet-related disease and other negative health outcomes.`,
    l1: `Ultra-processed food`,
    l2: `NOVA Group 4 covers industrial formulations that typically involve refined ingredients, additives or processing methods uncommon in home cooking. WHO says diets high in ultra-processed foods are associated with higher risks of diet-related disease and other negative health outcomes.`,
    provenance: 'doc_literal',
  },
];

// ---------------------------------------------------------------------------
// Body — independent additive stories (Body v0.6 §3, §4)
// ---------------------------------------------------------------------------

const BODY_INDEPENDENT_ADDITIVES: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Body:body-v12-additive-e171',
    pillar: 'Body',
    storyKey: 'body-v12-additive-e171',
    eligibleIds: ['body-v12-additive-e171'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-additive-e171', value: -3 }],
    l1Template: `A food whitener the EU stopped permitting`,
    l2Template: `Titanium dioxide (E171) is a synthetically produced white pigment made from naturally occurring ores and used to make foods look whiter or brighter. The EU stopped permitting it in food after European food-safety experts said a possible DNA-damage concern could not be ruled out; FSANZ found no safety concerns in its review, while Health Canada said there was no conclusive scientific evidence that food-grade titanium dioxide is a human-health concern. The US still permits titanium dioxide in food as a colour, capped at 1% by weight.`,
    l1: `A food whitener the EU stopped permitting`,
    l2: `Titanium dioxide (E171) is a synthetically produced white pigment made from naturally occurring ores and used to make foods look whiter or brighter. The EU stopped permitting it in food after European food-safety experts said a possible DNA-damage concern could not be ruled out; FSANZ found no safety concerns in its review, while Health Canada said there was no conclusive scientific evidence that food-grade titanium dioxide is a human-health concern. The US still permits titanium dioxide in food as a colour, capped at 1% by weight.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-additive-e250',
    pillar: 'Body',
    storyKey: 'body-v12-additive-e250',
    eligibleIds: ['body-v12-additive-e250'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-additive-e250', value: -6 }],
    l1Template: `Nitrite helps keep cured meat safe — but can contribute to nitrosamine formation`,
    l2Template: `Sodium nitrite (E250) is added to bacon, ham and sausages to control dangerous bacteria, extend safe shelf life and create the familiar cured flavour and pink colour. The trade-off is that it can help form chemicals called nitrosamines, some of which are carcinogenic: the EU cut permitted nitrite levels in 2025, Denmark maintains even tighter limits, and US bacon rules require vitamin-C-like compounds that reduce nitrosamine formation. FSANZ says Australians' overall dietary exposure to nitrates and nitrites is not considered an appreciable health and safety risk.`,
    l1: `Nitrite helps keep cured meat safe — but can contribute to nitrosamine formation`,
    l2: `Sodium nitrite (E250) is added to bacon, ham and sausages to control dangerous bacteria, extend safe shelf life and create the familiar cured flavour and pink colour. The trade-off is that it can help form chemicals called nitrosamines, some of which are carcinogenic: the EU cut permitted nitrite levels in 2025, Denmark maintains even tighter limits, and US bacon rules require vitamin-C-like compounds that reduce nitrosamine formation. FSANZ says Australians' overall dietary exposure to nitrates and nitrites is not considered an appreciable health and safety risk.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Body:body-v12-additive-e951',
    pillar: 'Body',
    storyKey: 'body-v12-additive-e951',
    eligibleIds: ['body-v12-additive-e951'],
    authority: BODY_DOC,
    fired: [{ id: 'body-v12-additive-e951', value: -3 }],
    l1Template: `IARC classified aspartame as “possibly carcinogenic”`,
    l2Template: `Aspartame (E951) is an artificial sweetener made from two amino acids and is about 200 times sweeter than sugar. WHO's cancer research agency classified it as “possibly carcinogenic” in 2023, based on limited evidence, while WHO's food-additive experts kept the accepted daily intake unchanged. FSANZ says current AU/NZ standards remain appropriate, and the US FDA continues to consider its approved uses safe under its conditions of use.`,
    l1: `IARC classified aspartame as “possibly carcinogenic”`,
    l2: `Aspartame (E951) is an artificial sweetener made from two amino acids and is about 200 times sweeter than sugar. WHO's cancer research agency classified it as “possibly carcinogenic” in 2023, based on limited evidence, while WHO's food-additive experts kept the accepted daily intake unchanged. FSANZ says current AU/NZ standards remain appropriate, and the US FDA continues to consider its approved uses safe under its conditions of use.`,
    provenance: 'doc_literal',
  },
];

// ---------------------------------------------------------------------------
// Body — E102/E110/E129 colour synthesis family (Body v0.6 §3 presentation-family
// rows, §4). The three colour IDs are Highlight-eligible but "not rendered
// individually"; the consumer story is the synthesised family bound to the exact
// fired colour IDs, with one/two/three-colour variants.
// ---------------------------------------------------------------------------

const COLOUR_FAMILY = 'body.additives.colour_warning_cluster';
const COLOUR_L1_DOC = `EU/UK packs warn about children's activity and attention`;

function oneColourL2Doc(colour: string): string {
  return `This product contains ${colour}, an industrially made, petroleum-derived food colour for which EU/UK packs must warn that it “may have an adverse effect on activity and attention in children.” It remains permitted in AU/NZ, where FSANZ says the evidence has not established a causal link between the individual colour and behavioural effects. In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, and California will prohibit this colour in specified public-school foods from the end of 2027.`;
}

const ONE_COLOUR_L2_TEMPLATE = oneColourL2Doc('[DETECTED COLOUR]');

const TWO_COLOUR_L2_TEMPLATE = `This product contains [COLOUR 1] and [COLOUR 2], industrially made, petroleum-derived food colours for which EU/UK packs must warn that they “may have an adverse effect on activity and attention in children.” Both remain permitted in AU/NZ, where FSANZ says the evidence has not established a causal link between the individual colours and behavioural effects. In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, and California will prohibit both colours in specified public-school foods from the end of 2027.`;

const THREE_COLOUR_L2_DOC = `This product contains Tartrazine (E102), Sunset Yellow (E110) and Allura Red (E129), industrially made, petroleum-derived food colours for which EU/UK packs must warn that they “may have an adverse effect on activity and attention in children.” All remain permitted in AU/NZ, where FSANZ says the evidence has not established a causal link between the individual colours and behavioural effects. In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, and California will prohibit these colours in specified public-school foods from the end of 2027.`;

/** Locked consumer colour names, taken verbatim from the three-colour L2 variant. */
const COLOUR_NAME_DOC = {
  'body-v12-additive-e102': 'Tartrazine (E102)',
  'body-v12-additive-e110': 'Sunset Yellow (E110)',
  'body-v12-additive-e129': 'Allura Red (E129)',
} as const;

const BODY_COLOUR_SYNTHESIS: LiteralCopyContractEntry[] = [
  ...(['body-v12-additive-e102', 'body-v12-additive-e110', 'body-v12-additive-e129'] as const).map(
    (id): LiteralCopyContractEntry => ({
      contractKey: `Body:${COLOUR_FAMILY}:one-colour:${id}`,
      pillar: 'Body',
      storyKey: COLOUR_FAMILY,
      eligibleIds: [id],
      variant: 'One colour detected',
      authority: `${BODY_DOC} colour-synthesis family`,
      fired: [{ id, value: -3 }],
      l1Template: COLOUR_L1_DOC,
      l2Template: ONE_COLOUR_L2_TEMPLATE,
      l1: COLOUR_L1_DOC,
      l2: oneColourL2Doc(COLOUR_NAME_DOC[id]),
      provenance: 'doc_literal',
    })
  ),
  {
    contractKey: `Body:${COLOUR_FAMILY}:two-colour`,
    pillar: 'Body',
    storyKey: COLOUR_FAMILY,
    eligibleIds: ['body-v12-additive-e102', 'body-v12-additive-e110'],
    variant: 'Two colours detected',
    authority: `${BODY_DOC} colour-synthesis family`,
    fired: [
      { id: 'body-v12-additive-e102', value: -3 },
      { id: 'body-v12-additive-e110', value: -3 },
    ],
    l1Template: COLOUR_L1_DOC,
    l2Template: TWO_COLOUR_L2_TEMPLATE,
    l1: COLOUR_L1_DOC,
    l2: TWO_COLOUR_L2_TEMPLATE.replace('[COLOUR 1]', 'Tartrazine (E102)').replace(
      '[COLOUR 2]',
      'Sunset Yellow (E110)'
    ),
    provenance: 'doc_literal',
    note: 'Colour names bind in E-number order from the exact fired colour IDs (Body v0.6 §4).',
  },
  {
    contractKey: `Body:${COLOUR_FAMILY}:three-colour`,
    pillar: 'Body',
    storyKey: COLOUR_FAMILY,
    eligibleIds: [
      'body-v12-additive-e102',
      'body-v12-additive-e110',
      'body-v12-additive-e129',
    ],
    variant: 'Three colours detected',
    authority: `${BODY_DOC} colour-synthesis family`,
    fired: [
      { id: 'body-v12-additive-e102', value: -3 },
      { id: 'body-v12-additive-e110', value: -3 },
      { id: 'body-v12-additive-e129', value: -3 },
    ],
    l1Template: COLOUR_L1_DOC,
    l2Template: THREE_COLOUR_L2_DOC,
    l1: COLOUR_L1_DOC,
    l2: THREE_COLOUR_L2_DOC,
    provenance: 'doc_literal',
  },
];

// ---------------------------------------------------------------------------
// Planet — Green-Score grades and packaging fallback (Planet v0.2 §3, §5)
// ---------------------------------------------------------------------------

const GREEN_SCORE_PREFIX_DOC = `Open Food Facts' Green-Score estimates a food's environmental impact using life-cycle data for its product category, then adjusts for product-specific information such as ingredients, origins and packaging.`;

const PLANET_GRADES: Array<{ id: string; value: number; l1: string; tail: string }> = [
  {
    id: 'planet-v19-environmental-a',
    value: 7,
    l1: `A — lower environmental impact`,
    tail: `This product received an A, the lowest-eco-impact grade on its A–E scale.`,
  },
  {
    id: 'planet-v19-environmental-b',
    value: 3,
    l1: `B — relatively low environmental impact`,
    tail: `This product received a B, indicating relatively low estimated eco-impact on its A–E scale.`,
  },
  {
    id: 'planet-v19-environmental-c',
    value: -1,
    l1: `C — moderate environmental impact`,
    tail: `This product received a C, the middle grade on its A–E scale.`,
  },
  {
    id: 'planet-v19-environmental-d',
    value: -3,
    l1: `D — higher environmental impact`,
    tail: `This product received a D, indicating higher estimated eco-impact on its A–E scale.`,
  },
  {
    id: 'planet-v19-environmental-e',
    value: -7,
    l1: `E — very high environmental impact`,
    tail: `This product received an E, the highest-impact grade on its A–E scale.`,
  },
];

const PLANET_ENVIRONMENTAL: LiteralCopyContractEntry[] = PLANET_GRADES.map((grade) => ({
  contractKey: `Planet:${grade.id}`,
  pillar: 'Planet' as const,
  storyKey: grade.id,
  eligibleIds: [grade.id],
  authority: PLANET_DOC,
  fired: [{ id: grade.id, value: grade.value }],
  l1Template: grade.l1,
  l2Template: `${GREEN_SCORE_PREFIX_DOC} ${grade.tail}`,
  l1: grade.l1,
  l2: `${GREEN_SCORE_PREFIX_DOC} ${grade.tail}`,
  provenance: 'doc_literal' as const,
}));

const PACKAGING_ALL_L2_TEMPLATE = `No usable Open Food Facts Green-Score is available for this product. In [Australia/New Zealand], the packaging evidence available to us indicates that all primary packaging components can go in ordinary kerbside recycling.`;
const PACKAGING_SOME_L2_TEMPLATE = `No usable Open Food Facts Green-Score is available for this product. In [Australia/New Zealand], the packaging evidence available to us confirms kerbside recycling for at least one primary packaging component, but not the full primary packaging set.`;

/** `[Australia/New Zealand]` must bind to the active Planet jurisdiction (Planet v0.2 §5). */
const PLANET_JURISDICTIONS = [
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
] as const;

const PLANET_PACKAGING: LiteralCopyContractEntry[] = PLANET_JURISDICTIONS.flatMap((market) => [
  {
    contractKey: `Planet:planet-v19-packaging-all-kerbside:${market.code}`,
    pillar: 'Planet' as const,
    storyKey: 'planet-v19-packaging-all-kerbside',
    eligibleIds: ['planet-v19-packaging-all-kerbside'],
    variant: `Assessment market ${market.code}`,
    authority: `${PLANET_DOC}, §5`,
    fired: [
      { id: 'planet-v19-packaging-all-kerbside', value: 2, metadata: { jurisdiction: market.code } },
    ],
    l1Template: `Primary packaging is kerbside recyclable`,
    l2Template: PACKAGING_ALL_L2_TEMPLATE,
    l1: `Primary packaging is kerbside recyclable`,
    l2: PACKAGING_ALL_L2_TEMPLATE.replace('[Australia/New Zealand]', market.name),
    provenance: 'doc_literal' as const,
  },
  {
    contractKey: `Planet:planet-v19-packaging-some-kerbside:${market.code}`,
    pillar: 'Planet' as const,
    storyKey: 'planet-v19-packaging-some-kerbside',
    eligibleIds: ['planet-v19-packaging-some-kerbside'],
    variant: `Assessment market ${market.code}`,
    authority: `${PLANET_DOC}, §5`,
    fired: [
      { id: 'planet-v19-packaging-some-kerbside', value: 1, metadata: { jurisdiction: market.code } },
    ],
    l1Template: `Some primary packaging is kerbside recyclable`,
    l2Template: PACKAGING_SOME_L2_TEMPLATE,
    l1: `Some primary packaging is kerbside recyclable`,
    l2: PACKAGING_SOME_L2_TEMPLATE.replace('[Australia/New Zealand]', market.name),
    provenance: 'doc_literal' as const,
  },
]);

// ---------------------------------------------------------------------------
// Ethics — KnowTheChain (Ethics v0.2 §3, §4)
//
// One locked L1/L2 pair across all eight bands. Two governed L1 variants:
// "Product owner" survives only where governed entity resolution proves the
// benchmarked company is the product owner; otherwise [COMPANY] is substituted.
// ---------------------------------------------------------------------------

const KTC_L1_TEMPLATE = `Product owner: [SCORE]/100 in independent forced-labour safeguards benchmark`;
const KTC_L2_TEMPLATE = `KnowTheChain’s [Year] Food & Beverage Benchmark scored [COMPANY] [SCORE]/100 for its efforts to prevent and address forced-labour risks in its supply chains.`;

const KTC_YEAR = 2026;
const KTC_SCORE = 24;
const KTC_COMPANY = 'Example Foods';
const KTC_L2_RESOLVED = `KnowTheChain’s ${KTC_YEAR} Food & Beverage Benchmark scored ${KTC_COMPANY} ${KTC_SCORE}/100 for its efforts to prevent and address forced-labour risks in its supply chains.`;

const KTC_BANDS: Array<{ id: string; value: number }> = [
  { id: 'ethics-v37-ktc-0-10', value: -10 },
  { id: 'ethics-v37-ktc-11-20', value: -8 },
  { id: 'ethics-v37-ktc-21-30', value: -6 },
  { id: 'ethics-v37-ktc-31-50', value: -3 },
  { id: 'ethics-v37-ktc-51-70', value: 3 },
  { id: 'ethics-v37-ktc-71-80', value: 6 },
  { id: 'ethics-v37-ktc-81-90', value: 8 },
  { id: 'ethics-v37-ktc-91-100', value: 10 },
];

const ETHICS_KTC: LiteralCopyContractEntry[] = KTC_BANDS.flatMap((band) => [
  {
    contractKey: `Ethics:${band.id}:product-owner-proven`,
    pillar: 'Ethics' as const,
    storyKey: band.id,
    eligibleIds: [band.id],
    variant: 'Product owner proven by governed entity resolution',
    authority: `${ETHICS_DOC}, §4`,
    fired: [
      {
        id: band.id,
        value: band.value,
        metadata: {
          benchmarkYear: KTC_YEAR,
          benchmarkScore: KTC_SCORE,
          benchmarkCompany: KTC_COMPANY,
          benchmarkEntityRole: 'product_owner',
        },
      },
    ],
    l1Template: KTC_L1_TEMPLATE,
    l2Template: KTC_L2_TEMPLATE,
    l1: `Product owner: ${KTC_SCORE}/100 in independent forced-labour safeguards benchmark`,
    l2: KTC_L2_RESOLVED,
    provenance: 'doc_literal' as const,
  },
  {
    contractKey: `Ethics:${band.id}:company-substituted`,
    pillar: 'Ethics' as const,
    storyKey: band.id,
    eligibleIds: [band.id],
    variant: 'Ownership unproven — [COMPANY] substituted for "Product owner"',
    authority: `${ETHICS_DOC}, §4`,
    fired: [
      {
        id: band.id,
        value: band.value,
        metadata: {
          benchmarkYear: KTC_YEAR,
          benchmarkScore: KTC_SCORE,
          benchmarkCompany: KTC_COMPANY,
        },
      },
    ],
    l1Template: KTC_L1_TEMPLATE,
    l2Template: KTC_L2_TEMPLATE,
    l1: `${KTC_COMPANY}: ${KTC_SCORE}/100 in independent forced-labour safeguards benchmark`,
    l2: KTC_L2_RESOLVED,
    provenance: 'doc_literal' as const,
    note: 'Ethics v0.2 §4: never attribute a benchmarked company result to an unproven product owner.',
  },
]);

// ---------------------------------------------------------------------------
// Ethics — BBFAW tier and impact (Ethics v0.2 §3, §5)
// ---------------------------------------------------------------------------

const BBFAW_YEAR = 2024;
const BBFAW_COMPANY = 'Example Foods';

function bbfawL2Template(body: string): string {
  return `BBFAW’s [Year] ${body}`;
}

function bbfawL2Resolved(body: string): string {
  return `BBFAW’s ${BBFAW_YEAR} ${body.split('[COMPANY]').join(BBFAW_COMPANY)}`;
}

const BBFAW_ROWS: Array<{ id: string; value: number; l1: string; body: string }> = [
  {
    id: 'ethics-v37-bbfaw-tier-1',
    value: 6,
    l1: `Independent animal-welfare benchmark: Tier 1 — leading governance`,
    body: `benchmark placed [COMPANY] in Tier 1, its highest tier, reflecting a leadership position on farm animal welfare.`,
  },
  {
    id: 'ethics-v37-bbfaw-tier-2',
    value: 4,
    l1: `Independent animal-welfare benchmark: Tier 2 — strong governance`,
    body: `benchmark placed [COMPANY] in Tier 2, where farm animal welfare is treated as an integral part of business strategy.`,
  },
  {
    id: 'ethics-v37-bbfaw-tier-3',
    value: 2,
    l1: `Independent animal-welfare benchmark: Tier 3 — established approach`,
    body: `benchmark placed [COMPANY] in Tier 3, reflecting an established approach with further implementation work to do.`,
  },
  {
    id: 'ethics-v37-bbfaw-tier-4',
    value: 1,
    l1: `Independent animal-welfare benchmark: Tier 4 — making progress`,
    body: `benchmark placed [COMPANY] in Tier 4, reflecting progress in implementing animal-welfare policies and commitments.`,
  },
  {
    id: 'ethics-v37-bbfaw-tier-5',
    value: -4,
    l1: `Independent animal-welfare benchmark: Tier 5 — limited progress`,
    body: `benchmark placed [COMPANY] in Tier 5, where it found limited evidence that animal welfare was being managed effectively.`,
  },
  {
    id: 'ethics-v37-bbfaw-tier-6',
    value: -6,
    l1: `Independent animal-welfare benchmark: Tier 6 — little evidence of governance`,
    body: `benchmark placed [COMPANY] in Tier 6, where it found limited, if any, evidence that farm animal welfare was recognised as a business issue.`,
  },
  {
    id: 'ethics-v37-bbfaw-impact-ab',
    value: 3,
    l1: `Independent animal-welfare benchmark: Impact A/B — strong reported improvement`,
    body: `Impact Rating placed [COMPANY] in A/B, reflecting reported improved welfare impacts for a reasonable proportion of farm animals in its operations or supply chains.`,
  },
  {
    id: 'ethics-v37-bbfaw-impact-cd',
    value: 1,
    l1: `Independent animal-welfare benchmark: Impact C/D — some reported improvement`,
    body: `Impact Rating placed [COMPANY] in C/D, reflecting reported improved welfare impacts for at least some farm animals in its operations or supply chains.`,
  },
  {
    id: 'ethics-v37-bbfaw-impact-ef',
    value: -3,
    l1: `Independent animal-welfare benchmark: Impact E/F — improvement not yet demonstrated`,
    body: `Impact Rating placed [COMPANY] in E/F, meaning it had yet to demonstrate improved welfare impacts for farm animals in its operations or supply chains.`,
  },
];

const ETHICS_BBFAW: LiteralCopyContractEntry[] = BBFAW_ROWS.map((row) => ({
  contractKey: `Ethics:${row.id}`,
  pillar: 'Ethics' as const,
  storyKey: row.id,
  eligibleIds: [row.id],
  authority: `${ETHICS_DOC}, §5`,
  fired: [
    {
      id: row.id,
      value: row.value,
      metadata: { benchmarkYear: BBFAW_YEAR, benchmarkCompany: BBFAW_COMPANY },
    },
  ],
  l1Template: row.l1,
  l2Template: bbfawL2Template(row.body),
  l1: row.l1,
  l2: bbfawL2Resolved(row.body),
  provenance: 'doc_literal' as const,
}));

// ---------------------------------------------------------------------------
// Ethics — packet certifications (Ethics v0.2 §3, §6)
// ---------------------------------------------------------------------------

const ETHICS_CERTIFICATIONS: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Ethics:ethics-v37-cert-fairtrade',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-fairtrade',
    eligibleIds: ['ethics-v37-cert-fairtrade'],
    authority: ETHICS_DOC,
    fired: [{ id: 'ethics-v37-cert-fairtrade', value: 6 }],
    l1Template: `Fairtrade certified`,
    l2Template: `A Fairtrade certification mark appears on this packet. Fairtrade standards cover social, economic and environmental requirements.`,
    l1: `Fairtrade certified`,
    l2: `A Fairtrade certification mark appears on this packet. Fairtrade standards cover social, economic and environmental requirements.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Ethics:ethics-v37-cert-rainforest-alliance',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-rainforest-alliance',
    eligibleIds: ['ethics-v37-cert-rainforest-alliance'],
    authority: ETHICS_DOC,
    fired: [{ id: 'ethics-v37-cert-rainforest-alliance', value: 6 }],
    l1Template: `Rainforest Alliance certified`,
    l2Template: `A Rainforest Alliance or legacy UTZ certification mark appears on this packet. The programme covers environmental and social farming requirements.`,
    l1: `Rainforest Alliance certified`,
    l2: `A Rainforest Alliance or legacy UTZ certification mark appears on this packet. The programme covers environmental and social farming requirements.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Ethics:ethics-v37-cert-asc',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-asc',
    eligibleIds: ['ethics-v37-cert-asc'],
    authority: ETHICS_DOC,
    fired: [{ id: 'ethics-v37-cert-asc', value: 4 }],
    l1Template: `Certified responsible farmed seafood`,
    l2Template: `The ASC label appears on this packet. It identifies farmed seafood from a certified supply chain whose standards cover environmental stewardship, animal welfare and social requirements.`,
    l1: `Certified responsible farmed seafood`,
    l2: `The ASC label appears on this packet. It identifies farmed seafood from a certified supply chain whose standards cover environmental stewardship, animal welfare and social requirements.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Ethics:ethics-v37-cert-msc',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-msc',
    eligibleIds: ['ethics-v37-cert-msc'],
    authority: ETHICS_DOC,
    fired: [{ id: 'ethics-v37-cert-msc', value: 4 }],
    l1Template: `Certified sustainable wild-caught seafood`,
    l2Template: `The MSC blue label appears on this packet. It identifies wild-caught seafood from fisheries independently assessed against MSC environmental-sustainability requirements, with supply-chain traceability controls.`,
    l1: `Certified sustainable wild-caught seafood`,
    l2: `The MSC blue label appears on this packet. It identifies wild-caught seafood from fisheries independently assessed against MSC environmental-sustainability requirements, with supply-chain traceability controls.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Ethics:ethics-v37-cert-organic:certified',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-organic',
    eligibleIds: ['ethics-v37-cert-organic'],
    variant: 'Certified variant',
    authority: `${ETHICS_DOC}, §6`,
    fired: [
      { id: 'ethics-v37-cert-organic', value: 2, metadata: { organicEvidenceClass: 'certified' } },
    ],
    l1Template: `Organic certified`,
    l2Template: `An organic certification mark appears on this packet, indicating certification against that scheme’s organic standard.`,
    l1: `Organic certified`,
    l2: `An organic certification mark appears on this packet, indicating certification against that scheme’s organic standard.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Ethics:ethics-v37-cert-organic:claim-only',
    pillar: 'Ethics',
    storyKey: 'ethics-v37-cert-organic',
    eligibleIds: ['ethics-v37-cert-organic'],
    variant: 'Claim-only variant',
    authority: `${ETHICS_DOC}, §6`,
    fired: [
      { id: 'ethics-v37-cert-organic', value: 2, metadata: { organicEvidenceClass: 'claim_only' } },
    ],
    l1Template: `Organic claim identified`,
    l2Template: `An organic claim appears on this packet, but the packet does not show a specific organic certification.`,
    l1: `Organic claim identified`,
    l2: `An organic claim appears on this packet, but the packet does not show a specific organic certification.`,
    provenance: 'doc_literal',
    note: 'Same +2 scoring ID; organicEvidenceClass selects the variant and never upgrades claim-only to certified.',
  },
];

// ---------------------------------------------------------------------------
// Open — ingredient clarity (Open v0.2 §3, §4)
// ---------------------------------------------------------------------------

const OPEN_CLARITY: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Open:open-v15-ing-clarity-zero',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-zero',
    eligibleIds: ['open-v15-ing-clarity-zero'],
    authority: OPEN_DOC,
    fired: [{ id: 'open-v15-ing-clarity-zero', value: 1 }],
    l1Template: `Ingredient wording is clear where assessed`,
    l2Template: `In the ingredient list we could assess, we did not find any of the broad, generic or code-dependent terms we check for. That does not mean every detail about the product is disclosed.`,
    l1: `Ingredient wording is clear where assessed`,
    l2: `In the ingredient list we could assess, we did not find any of the broad, generic or code-dependent terms we check for. That does not mean every detail about the product is disclosed.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-one:broad_generic',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-one',
    eligibleIds: ['open-v15-ing-clarity-one'],
    variant: 'Broad/generic',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-one',
        value: -2,
        metadata: { termPresentationClass: 'broad_generic', matchedTerms: 'natural flavours' },
      },
    ],
    l1Template: `One ingredient term is vague`,
    l2Template: `The ingredient list says “[TERM]”. This is a broad description, and in the wording we could assess it does not identify the specific ingredient or substance represented by [TERM].`,
    l1: `One ingredient term is vague`,
    l2: `The ingredient list says “natural flavours”. This is a broad description, and in the wording we could assess it does not identify the specific ingredient or substance represented by natural flavours.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-one:coded',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-one',
    eligibleIds: ['open-v15-ing-clarity-one'],
    variant: 'Coded additive',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-one',
        value: -2,
        metadata: {
          termPresentationClass: 'coded',
          matchedTerms: 'E102',
          decodedAdditiveNames: 'Tartrazine',
        },
      },
    ],
    l1Template: `One ingredient needs decoding`,
    l2Template: `“[TERM]” is a standard food-additive number for [PLAIN NAME]. The code identifies the additive precisely, but a shopper needs to know or look up the number to see the additive’s name.`,
    l1: `One ingredient needs decoding`,
    l2: `“E102” is a standard food-additive number for Tartrazine. The code identifies the additive precisely, but a shopper needs to know or look up the number to see the additive’s name.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-two:broad_generic',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-two',
    eligibleIds: ['open-v15-ing-clarity-two'],
    variant: 'Broad/generic',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-two',
        value: -4,
        metadata: {
          termPresentationClass: 'broad_generic',
          matchedTerms: 'natural flavours|spices',
        },
      },
    ],
    l1Template: `Two ingredient terms are vague`,
    l2Template: `The ingredient list uses two broad descriptions: “[TERM 1]” and “[TERM 2]”. In the wording we could assess, they do not identify the specific ingredients or substances represented by those categories.`,
    l1: `Two ingredient terms are vague`,
    l2: `The ingredient list uses two broad descriptions: “natural flavours” and “spices”. In the wording we could assess, they do not identify the specific ingredients or substances represented by those categories.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-two:coded',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-two',
    eligibleIds: ['open-v15-ing-clarity-two'],
    variant: 'Coded additives',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-two',
        value: -4,
        metadata: { termPresentationClass: 'coded', matchedTerms: 'E102|E110' },
      },
    ],
    l1Template: `Two ingredients need decoding`,
    l2Template: `Two additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know or look them up to see their names.`,
    l1: `Two ingredients need decoding`,
    l2: `Two additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know or look them up to see their names.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-two:mixed',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-two',
    eligibleIds: ['open-v15-ing-clarity-two'],
    variant: 'Mixed broad/coded',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-two',
        value: -4,
        metadata: { termPresentationClass: 'mixed', matchedTerms: 'natural flavours|E102' },
      },
    ],
    l1Template: `Some ingredient wording needs explanation`,
    l2Template: `This ingredient list combines a broad description with a coded additive number. Tap through to see what each term means.`,
    l1: `Some ingredient wording needs explanation`,
    l2: `This ingredient list combines a broad description with a coded additive number. Tap through to see what each term means.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-three-plus:broad_generic',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-three-plus',
    eligibleIds: ['open-v15-ing-clarity-three-plus'],
    variant: 'Broad/generic',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-three-plus',
        value: -6,
        metadata: {
          termPresentationClass: 'broad_generic',
          matchedTerms: 'natural flavours|spices|vegetable oil',
        },
      },
    ],
    l1Template: `Several ingredient terms are vague`,
    l2Template: `Several broad ingredient descriptions appear in this list, including [TERMS]. In the wording we could assess, they leave parts of the ingredient make-up unspecified.`,
    l1: `Several ingredient terms are vague`,
    l2: `Several broad ingredient descriptions appear in this list, including natural flavours, spices and vegetable oil. In the wording we could assess, they leave parts of the ingredient make-up unspecified.`,
    provenance: 'doc_instruction',
    note: 'Open v0.2 locks the sentence but only instructs "show the governed matched broad terms as a list: [TERMS]". The comma-separated list with a final "and" is the hand-authored reading of that instruction; list punctuation is not itself founder-locked.',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-three-plus:coded',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-three-plus',
    eligibleIds: ['open-v15-ing-clarity-three-plus'],
    variant: 'Coded additives',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-three-plus',
        value: -6,
        metadata: { termPresentationClass: 'coded', matchedTerms: 'E102|E110|E129' },
      },
    ],
    l1Template: `Several ingredients need decoding`,
    l2Template: `Several additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know or look them up to see their names.`,
    l1: `Several ingredients need decoding`,
    l2: `Several additives are listed mainly by number. The codes identify them precisely, but a shopper needs to know or look them up to see their names.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-ing-clarity-three-plus:mixed',
    pillar: 'Open',
    storyKey: 'open-v15-ing-clarity-three-plus',
    eligibleIds: ['open-v15-ing-clarity-three-plus'],
    variant: 'Mixed broad/coded',
    authority: OPEN_DOC,
    fired: [
      {
        id: 'open-v15-ing-clarity-three-plus',
        value: -6,
        metadata: { termPresentationClass: 'mixed', matchedTerms: 'natural flavours|E102|spices' },
      },
    ],
    l1Template: `Several ingredient terms need explanation`,
    l2Template: `This ingredient list uses several broad descriptions and coded additive numbers. Tap through to see what each term means.`,
    l1: `Several ingredient terms need explanation`,
    l2: `This ingredient list uses several broad descriptions and coded additive numbers. Tap through to see what each term means.`,
    provenance: 'doc_literal',
  },
];

// ---------------------------------------------------------------------------
// Open — origins (Open v0.2 §3, §7). Percentage / qualified-partial / packet-gap
// remain governed but mvpUnreachable in the OFF-only scorer; they are exercised
// here as synthetic fired rows so the locked copy cannot drift.
// ---------------------------------------------------------------------------

const ORIGINS_PCT_LOW_L2_TEMPLATE = `The origin statement identifies [X]% of ingredient sourcing. It doesn’t say where the remaining [Y]% comes from.`;

const ORIGINS_PCT_BANDS: Array<{ id: string; value: number; accounted: number }> = [
  { id: 'open-v15-origins-pct-76-94', value: -1, accounted: 80 },
  { id: 'open-v15-origins-pct-50-75', value: -3, accounted: 60 },
  { id: 'open-v15-origins-pct-25-49', value: -5, accounted: 30 },
  { id: 'open-v15-origins-pct-1-24', value: -7, accounted: 10 },
];

const OPEN_ORIGINS: LiteralCopyContractEntry[] = [
  {
    contractKey: 'Open:open-v15-origins-evidently-complete',
    pillar: 'Open',
    storyKey: 'open-v15-origins-evidently-complete',
    eligibleIds: ['open-v15-origins-evidently-complete'],
    authority: `${OPEN_DOC}, §7`,
    fired: [{ id: 'open-v15-origins-evidently-complete', value: 8 }],
    l1Template: `Ingredient origins appear fully accounted for`,
    l2Template: `The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.`,
    l1: `Ingredient origins appear fully accounted for`,
    l2: `The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.`,
    provenance: 'doc_literal',
  },
  {
    contractKey: 'Open:open-v15-origins-evidently-complete:single-ingredient',
    pillar: 'Open',
    storyKey: 'open-v15-origins-evidently-complete',
    eligibleIds: ['open-v15-origins-evidently-complete'],
    variant: 'Single-ingredient scoring route',
    authority: `${OPEN_DOC}, §7`,
    fired: [
      {
        id: 'open-v15-origins-evidently-complete',
        value: 8,
        metadata: { singleIngredient: true, ingredient: 'Honey', country: 'New Zealand' },
      },
    ],
    l1Template: `Ingredient origins appear fully accounted for`,
    l2Template: `The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.`,
    l1: `Ingredient origins appear fully accounted for`,
    l2: `The available origin information appears to account for the relevant ingredient sourcing, with no material remainder left unexplained.`,
    provenance: 'doc_literal',
    note: 'Open v0.2 §7: singleIngredient/country stays provenance metadata and must not select alternative copy.',
  },
  {
    contractKey: 'Open:open-v15-origins-pct-95-99',
    pillar: 'Open',
    storyKey: 'open-v15-origins-pct-95-99',
    eligibleIds: ['open-v15-origins-pct-95-99'],
    authority: `${OPEN_DOC}, §7`,
    fired: [
      {
        id: 'open-v15-origins-pct-95-99',
        value: 4,
        metadata: { accountedPercent: 97, remainderPercent: 3 },
      },
    ],
    l1Template: `[X]% of ingredient sourcing disclosed`,
    l2Template: `The origin information accounts for [X]% of ingredient sourcing, leaving only a small remainder unspecified.`,
    l1: `97% of ingredient sourcing disclosed`,
    l2: `The origin information accounts for 97% of ingredient sourcing, leaving only a small remainder unspecified.`,
    provenance: 'doc_literal',
  },
  ...ORIGINS_PCT_BANDS.map(
    (band): LiteralCopyContractEntry => ({
      contractKey: `Open:${band.id}`,
      pillar: 'Open',
      storyKey: band.id,
      eligibleIds: [band.id],
      authority: `${OPEN_DOC}, §7`,
      fired: [
        {
          id: band.id,
          value: band.value,
          metadata: {
            accountedPercent: band.accounted,
            remainderPercent: 100 - band.accounted,
          },
        },
      ],
      l1Template: `[Y]% of ingredient sourcing is unspecified`,
      l2Template: ORIGINS_PCT_LOW_L2_TEMPLATE,
      l1: `${100 - band.accounted}% of ingredient sourcing is unspecified`,
      l2: ORIGINS_PCT_LOW_L2_TEMPLATE.replace('[X]', String(band.accounted)).replace(
        '[Y]',
        String(100 - band.accounted)
      ),
      provenance: 'doc_literal',
    })
  ),
  {
    contractKey: 'Open:open-v15-origins-qualified-partial',
    pillar: 'Open',
    storyKey: 'open-v15-origins-qualified-partial',
    eligibleIds: ['open-v15-origins-qualified-partial'],
    authority: `${OPEN_DOC}, §7`,
    fired: [
      {
        id: 'open-v15-origins-qualified-partial',
        value: -4,
        metadata: { sourceStatement: 'local and imported' },
      },
    ],
    l1Template: `Origin information is only partly specific`,
    l2Template: `Use the actual packet statement. Example: “The origin statement says the ingredients are local and imported, but doesn’t identify where the imported ingredients come from or how much comes from each source.”`,
    l1: `Origin information is only partly specific`,
    l2: `The origin statement says “local and imported”, but doesn’t identify where all ingredients come from or how much comes from each source.`,
    provenance: 'doc_instruction',
    note:
      'Open v0.2 gives an authoring instruction plus one example rather than a locked literal. The example says "where the imported ingredients come from", which does not generalise to a [STATEMENT] token that need not mention imports; "where all ingredients come from" is the hand-authored faithful generalisation. FOUNDER CLARIFICATION ITEM: this is the weakest row in the contract and should be locked as a literal template in the next Open revision.',
  },
  {
    contractKey: 'Open:open-v15-origins-packet-gap',
    pillar: 'Open',
    storyKey: 'open-v15-origins-packet-gap',
    eligibleIds: ['open-v15-origins-packet-gap'],
    authority: `${OPEN_DOC}, §7`,
    fired: [{ id: 'open-v15-origins-packet-gap', value: -8 }],
    l1Template: `No clear origin statement found`,
    l2Template: `This packet was checked and no clear ingredient-origin information was found, leaving the product’s origins unclear.`,
    l1: `No clear origin statement found`,
    l2: `This packet was checked and no clear ingredient-origin information was found, leaving the product’s origins unclear.`,
    provenance: 'doc_literal',
  },
];

/** The full independent contract: every Highlight-eligible stable ID and governed variant. */
export const LITERAL_COPY_CONTRACT: readonly LiteralCopyContractEntry[] = [
  ...BODY_NUTRI,
  ...BODY_NOVA,
  ...BODY_INDEPENDENT_ADDITIVES,
  ...BODY_COLOUR_SYNTHESIS,
  ...PLANET_ENVIRONMENTAL,
  ...PLANET_PACKAGING,
  ...ETHICS_KTC,
  ...ETHICS_BBFAW,
  ...ETHICS_CERTIFICATIONS,
  ...OPEN_CLARITY,
  ...OPEN_ORIGINS,
];

/** `pillar:id` keys the contract claims to cover, for all-eligible set equality. */
export const CONTRACT_COVERED_ELIGIBLE_KEYS: readonly string[] = Array.from(
  new Set(
    LITERAL_COPY_CONTRACT.flatMap((entry) =>
      entry.eligibleIds.map((id) => `${entry.pillar}:${id}`)
    )
  )
).sort();

/**
 * Rows whose expected string is derived from a founder authoring instruction rather than a locked
 * literal. Locked here so the set cannot silently grow.
 */
export const INSTRUCTION_DERIVED_CONTRACT_KEYS: readonly string[] = LITERAL_COPY_CONTRACT.filter(
  (entry) => entry.provenance === 'doc_instruction'
)
  .map((entry) => entry.contractKey)
  .sort();

/**
 * Glyph-class normalisation for the contract comparison.
 *
 * The founder .docx mixes straight and typographic apostrophes/quotes inside the same commentary
 * table — verified in `word/document.xml`, e.g. the Planet L2 cell writes "Open Food Facts'
 * Green-Score" with U+0027 while the adjacent L3 cell writes "Open Food Facts’" with U+2019.
 * The contract therefore governs wording, not glyph encoding. Everything else — words, order,
 * punctuation, en/em dashes, digits and token binding — is compared exactly.
 */
export function normaliseGovernedTypography(text: string): string {
  return text.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

/**
 * Contract keys where the founder text and the runtime string differ only by apostrophe or quote
 * glyph. Locked so a NEW glyph divergence still fails the suite instead of being absorbed.
 */
export const GLYPH_NORMALISED_CONTRACT_KEYS: readonly string[] = [
  'Body:body-v12-additive-e250',
  'Body:body-v12-additive-e951',
  `Body:${COLOUR_FAMILY}:one-colour:body-v12-additive-e102`,
  `Body:${COLOUR_FAMILY}:one-colour:body-v12-additive-e110`,
  `Body:${COLOUR_FAMILY}:one-colour:body-v12-additive-e129`,
  `Body:${COLOUR_FAMILY}:three-colour`,
  `Body:${COLOUR_FAMILY}:two-colour`,
  'Planet:planet-v19-environmental-a',
  'Planet:planet-v19-environmental-b',
  'Planet:planet-v19-environmental-c',
  'Planet:planet-v19-environmental-d',
  'Planet:planet-v19-environmental-e',
].sort();
