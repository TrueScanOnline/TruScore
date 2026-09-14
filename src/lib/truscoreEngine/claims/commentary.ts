/**
 * Exact founder-approved Claims commentary (v0.2 §11 + corrective Organic copy).
 */

import { naturalLanguageList, naturalLanguageNutrientList } from './normalize';
import type { ClaimsCommentaryPayload, MatchedClaimObservation } from './types';

const POSITIVE_L2 =
  'The pack highlights [CLAIM]. We also checked the nutrition information panel for total sugars, saturated fat and sodium and did not find high levels in any of those areas. That helps put the claim in the context of the product’s broader nutritional picture.';

const ADVERSE_L2 =
  'The pack highlights [CLAIM]. We also checked the nutrition information panel and found high [NUTRIENT(S)]. That wider nutritional context can help you consider the broader nutritional profile of this product. This finding does not by itself mean the packet claim is false, unlawful, misleading or non-compliant.';

const NOVA4_SENTENCE =
  'This product is also classified as NOVA Group 4 meaning it is considered an ultra-processed food.';

const NEUTRAL_L2 =
  'We checked the packet for the product claims and certifications we currently assess, and our independent company-level benchmark checks did not produce a positive or adverse finding.';

const NEUTRAL_APPEND =
  'We did find packet claims for [CLAIM(S)], but these sit outside the claims we currently assess.';

/** Founder-approved Organic claim-only consumer copy (corrective pass). */
export const ORGANIC_CLAIM_ONLY_L1_V02 = 'Organic claim identified';
export const ORGANIC_CLAIM_ONLY_L2_V02 =
  'The product is presented as Organic, but we have not established a specific organic certification.';
export const ORGANIC_CLAIM_ONLY_L3_BODY_V02 =
  'This reflects a whole-product Organic claim where our available data does not establish a specific organic certification. That does not mean the product is not genuinely organic. If there is a certification on the packet, help us update the record.';
export const ORGANIC_CLAIM_ONLY_CTA_LABEL_V02 = 'Update certification';

function bindClaimToken(template: string, claimList: string): string | null {
  if (!claimList) return null;
  return template.split('[CLAIM]').join(claimList).split('[CLAIM(S)]').join(claimList);
}

function bindNutrientToken(template: string, nutrientList: string): string | null {
  if (!nutrientList) return null;
  return template.split('[NUTRIENT(S)]').join(nutrientList);
}

export function buildPositivePacketContextCommentary(
  claims: MatchedClaimObservation[],
  novaGroup4: boolean
): ClaimsCommentaryPayload {
  const claimTexts = claims.filter((c) => c.set === 'A').map((c) => c.display_text);
  const claimList = naturalLanguageList(claimTexts);
  if (!claimList) {
    return { route: 'none', suppressed_reason: 'missing_claim_token' };
  }
  const l1 = `The pack highlights ${claimList} and our nutrition context check did not find high total sugars, saturated fat or sodium.`;
  let l2 = bindClaimToken(POSITIVE_L2, claimList);
  if (!l2) return { route: 'none', suppressed_reason: 'missing_claim_token' };
  let nova4 = false;
  if (novaGroup4) {
    l2 = `${l2} ${NOVA4_SENTENCE}`;
    nova4 = true;
  }
  return {
    route: 'packet_context_positive',
    l1,
    l2,
    claim_display_texts: claimTexts,
    nova4_sentence_appended: nova4,
    bound_event_id: 'claims.packet_context.positive.v1',
  };
}

export function buildAdversePacketContextCommentary(
  claims: MatchedClaimObservation[],
  highNutrients: ('total sugars' | 'saturated fat' | 'sodium')[],
  novaGroup4: boolean
): ClaimsCommentaryPayload {
  const claimTexts = claims
    .filter((c) => c.set === 'A' || c.set === 'B')
    .map((c) => c.display_text);
  const claimList = naturalLanguageList(claimTexts);
  const nutrientList = naturalLanguageNutrientList(highNutrients);
  if (!claimList || !nutrientList) {
    return { route: 'none', suppressed_reason: 'missing_claim_or_nutrient_token' };
  }
  const l1 = `The pack highlights ${claimList}, while our nutrition check found high ${nutrientList}.`;
  let l2 = bindClaimToken(ADVERSE_L2, claimList);
  if (!l2) return { route: 'none', suppressed_reason: 'missing_claim_token' };
  l2 = bindNutrientToken(l2, nutrientList);
  if (!l2) return { route: 'none', suppressed_reason: 'missing_nutrient_token' };
  let nova4 = false;
  if (novaGroup4) {
    l2 = `${l2} ${NOVA4_SENTENCE}`;
    nova4 = true;
  }
  return {
    route: 'packet_context_adverse',
    l1,
    l2,
    claim_display_texts: claimTexts,
    high_nutrient_labels: highNutrients,
    nova4_sentence_appended: nova4,
    bound_event_id: 'claims.packet_context.adverse.v1',
  };
}

export function buildAssessedNeutralCommentary(
  nonScoringStatements: { display_text: string }[]
): ClaimsCommentaryPayload {
  let l2 = NEUTRAL_L2;
  const texts = nonScoringStatements.map((s) => s.display_text).filter(Boolean);
  if (texts.length > 0) {
    const list = naturalLanguageList(texts);
    if (list) {
      l2 = `${l2} ${bindClaimToken(NEUTRAL_APPEND, list)}`;
    }
  }
  return {
    route: 'assessed_neutral',
    l2,
    claim_display_texts: texts,
  };
}

export function buildOrganicClaimOnlyCommentary(): ClaimsCommentaryPayload {
  return {
    route: 'organic_claim_only',
    l1: ORGANIC_CLAIM_ONLY_L1_V02,
    l2: ORGANIC_CLAIM_ONLY_L2_V02,
    l3_body: ORGANIC_CLAIM_ONLY_L3_BODY_V02,
    cta_label: ORGANIC_CLAIM_ONLY_CTA_LABEL_V02,
    cta_domain: 'certifications',
    bound_event_id: 'claims.organic.claim_only.v1',
  };
}
