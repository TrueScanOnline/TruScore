/**
 * Body colour-warning cluster — the only approved cross-adjustment presentation synthesis.
 *
 * Locked copy transcribed verbatim from:
 *   Rveel_Wave3_Body_Score_Highlights_Founder_Locked_Complete_Commentary_L3_ID_Contract_S27_Context_20260901_v0_5 §5.1, §7
 *   Rveel_Wave3_Consolidated_Score_Highlights_Controlling_Specification_..._v0_4 §4.1
 *
 * E102, E110 and E129 remain separate scoring adjustments and separate S28 rows. This module only
 * supplies the shared consumer commentary bound to whichever of those IDs actually fired.
 */

export const BODY_COLOUR_SYNTHESIS_FAMILY = 'body.additives.colour_warning_cluster';

/** Fired production adjustment IDs that belong to the colour-warning family, in E-number order. */
export const BODY_COLOUR_SYNTHESIS_MEMBER_IDS = [
  'body-v12-additive-e102',
  'body-v12-additive-e110',
  'body-v12-additive-e129',
] as const;

export type BodyColourSynthesisMemberId = (typeof BODY_COLOUR_SYNTHESIS_MEMBER_IDS)[number];

/**
 * Consumer colour names. Locked by the three-colour L2 variant, which names them verbatim as
 * "Tartrazine (E102), Sunset Yellow (E110) and Allura Red (E129)".
 */
const COLOUR_NAME_BY_ID: Record<BodyColourSynthesisMemberId, string> = {
  'body-v12-additive-e102': 'Tartrazine (E102)',
  'body-v12-additive-e110': 'Sunset Yellow (E110)',
  'body-v12-additive-e129': 'Allura Red (E129)',
};

/** Locked common L1 for the colour-warning story, whatever subset fired. */
export const BODY_COLOUR_SYNTHESIS_L1 = 'EU/UK packs warn about children’s activity and attention';

/** Locked one-colour L2. `[DETECTED COLOUR]` resolves from the single fired member ID. */
function oneColourL2(colour: string): string {
  return (
    `This product contains ${colour}, an industrially made, petroleum-derived food colour for which EU/UK packs must warn ` +
    'that it “may have an adverse effect on activity and attention in children.” It remains permitted in AU/NZ, where FSANZ ' +
    'says the evidence has not established a causal link between the individual colour and behavioural effects. In the US, ' +
    'FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, and California will prohibit ' +
    'this colour in specified public-school foods from the end of 2027.'
  );
}

/** Locked two-colour L2. `[COLOUR 1]` / `[COLOUR 2]` resolve from the fired member IDs in E-number order. */
function twoColourL2(first: string, second: string): string {
  return (
    `This product contains ${first} and ${second}, industrially made, petroleum-derived food colours for which EU/UK packs ` +
    'must warn that they “may have an adverse effect on activity and attention in children.” Both remain permitted in AU/NZ, ' +
    'where FSANZ says the evidence has not established a causal link between the individual colours and behavioural effects. ' +
    'In the US, FDA is working with industry to eliminate petroleum-based food dyes by the end of 2027, and California will ' +
    'prohibit both colours in specified public-school foods from the end of 2027.'
  );
}

/** Locked three-colour L2. Colour names are part of the locked wording. */
const THREE_COLOUR_L2 =
  'This product contains Tartrazine (E102), Sunset Yellow (E110) and Allura Red (E129), industrially made, ' +
  'petroleum-derived food colours for which EU/UK packs must warn that they “may have an adverse effect on activity and ' +
  'attention in children.” All remain permitted in AU/NZ, where FSANZ says the evidence has not established a causal link ' +
  'between the individual colours and behavioural effects. In the US, FDA is working with industry to eliminate ' +
  'petroleum-based food dyes by the end of 2027, and California will prohibit these colours in specified public-school ' +
  'foods from the end of 2027.';

/**
 * Locked presentation materiality: one colour = −3, two = −6, three = −9. Ranking only —
 * scoring truth remains the individual fired −3 rows and the additive cap/ceiling normalisers.
 */
export function bodyColourSynthesisMateriality(firedColourCount: number): number {
  return -3 * firedColourCount;
}

/**
 * Locked negative-pool priority for the synthesized cluster (Body v0.5 §6):
 * three colours = 1, two colours = 4, one colour = 9.
 */
export function bodyColourSynthesisPriority(firedColourCount: number): number {
  if (firedColourCount >= 3) return 1;
  if (firedColourCount === 2) return 4;
  return 9;
}

/** Locked L2 variant for the exact detected subset, ordered by E number. */
export function bodyColourSynthesisL2(firedMemberIds: readonly string[]): string {
  const names = BODY_COLOUR_SYNTHESIS_MEMBER_IDS.filter((id) => firedMemberIds.includes(id)).map(
    (id) => COLOUR_NAME_BY_ID[id]
  );
  if (names.length >= 3) return THREE_COLOUR_L2;
  if (names.length === 2) return twoColourL2(names[0], names[1]);
  return oneColourL2(names[0]);
}

export function isBodyColourSynthesisMemberId(id: string): id is BodyColourSynthesisMemberId {
  return (BODY_COLOUR_SYNTHESIS_MEMBER_IDS as readonly string[]).includes(id);
}
