/**
 * Ethics Pillar v37 — stable production adjustment IDs and commentary registry.
 * Bound to fired adjustments for S28 (exhaustive) and S12 (governed selection).
 *
 * Authority: Rveel_Wave3_Ethics_Score_Highlights_Founder_Locked_Commentary_L3_ID_Contract_20260905_v0_2 §3–§5.
 * Consumer copy is year-dynamic: `[Year]`, `[COMPANY]` and `[SCORE]` resolve from the metadata carried on
 * the fired row, which must come from the same governed benchmark record that produced the score.
 * KTC/BBFAW L1 carries its own benchmark attribution so it survives being read in isolation.
 * Scoring arithmetic is unchanged by this registry.
 */

import type { EthicsCertificationScheme } from '../../../services/ethicsCertificationsService';
import type { BBFAWImpactRating, BBFAWTier } from '../../../services/bbfawService';

export type EthicsV37AdjustmentFamily = 'system' | 'ktc' | 'bbfaw' | 'certifications';

export type EthicsV37AdjustmentId =
  | 'ethics-v37-base'
  | 'ethics-v37-ktc-0-10'
  | 'ethics-v37-ktc-11-20'
  | 'ethics-v37-ktc-21-30'
  | 'ethics-v37-ktc-31-50'
  | 'ethics-v37-ktc-51-70'
  | 'ethics-v37-ktc-71-80'
  | 'ethics-v37-ktc-81-90'
  | 'ethics-v37-ktc-91-100'
  | 'ethics-v37-bbfaw-tier-1'
  | 'ethics-v37-bbfaw-tier-2'
  | 'ethics-v37-bbfaw-tier-3'
  | 'ethics-v37-bbfaw-tier-4'
  | 'ethics-v37-bbfaw-tier-5'
  | 'ethics-v37-bbfaw-tier-6'
  | 'ethics-v37-bbfaw-impact-ab'
  | 'ethics-v37-bbfaw-impact-cd'
  | 'ethics-v37-bbfaw-impact-ef'
  | 'ethics-v37-cert-fairtrade'
  | 'ethics-v37-cert-rainforest-alliance'
  | 'ethics-v37-cert-asc'
  | 'ethics-v37-cert-msc'
  | 'ethics-v37-cert-organic'
  | 'ethics-v37-frozen-benchmark-ineligible'
  | 'ethics-v37-final-cap'
  | 'ethics-v37-final-floor';

export interface EthicsV37AdjustmentMeta {
  id: EthicsV37AdjustmentId;
  family: EthicsV37AdjustmentFamily;
  /** Points applied in production scorer (0 for neutral rows; see `dynamicPoints` for normalisers). */
  points: number;
  /** True when the fired value is computed at scoring time (cap / floor normalisers). */
  dynamicPoints?: boolean;
  highlightEligible: boolean;
  description: string;
  /** L1 overall-screen highlight title (S12). Omitted when not highlight-eligible. */
  highlightTitle?: string;
  /** L2 drill-down explainer. Tokens resolve from the fired row metadata, never from product fields. */
  highlightExplainer?: string;
  externalResource: string;
}

const KTC_RESOURCE = 'https://www.business-humanrights.org/en/from-us/knowthechain/food-and-beverage-benchmark/';
const BBFAW_RESOURCE = 'https://www.bbfaw.com/about-us/benchmark-methodology/';
const FAIRTRADE_RESOURCE = 'https://www.fairtrade.net/en/why-fairtrade/how-we-do-it/how-does-the-label-work.html';
const RAINFOREST_RESOURCE = 'https://www.rainforest-alliance.org/what-does-rainforest-alliance-certified-mean/';
const MSC_RESOURCE = 'https://www.msc.org/what-we-are-doing/our-approach/the-blue-msc-label-what-it-means-for-you';
const ASC_RESOURCE = 'https://asc-aqua.org/about-the-asc-sustainability-label/';
const ORGANIC_RESOURCE = 'https://www.accc.gov.au/consumers/advertising-and-promotions/organic-claims';
const OFF_RESOURCE = 'https://world.openfoodfacts.org/';

/**
 * Locked KTC L1. `Product owner` only survives when governed entity resolution proves the
 * benchmarked company is this product's owner; otherwise `resolveGovernedCopy` substitutes
 * `[COMPANY]` from the same fired benchmark record (Ethics v0.2 §4).
 */
const KTC_L1 = 'Product owner: [SCORE]/100 in independent forced-labour safeguards benchmark';

const KTC_L2 =
  'KnowTheChain’s [Year] Food & Beverage Benchmark scored [COMPANY] [SCORE]/100 for its efforts to prevent and address ' +
  'forced-labour risks in its supply chains.';

const BBFAW_L1_PREFIX = 'Independent animal-welfare benchmark:';

function bbfawTierExplainer(tier: BBFAWTier): string {
  const trailing: Record<BBFAWTier, string> = {
    1: 'its highest tier, reflecting a leadership position on farm animal welfare.',
    2: 'where farm animal welfare is treated as an integral part of business strategy.',
    3: 'reflecting an established approach with further implementation work to do.',
    4: 'reflecting progress in implementing animal-welfare policies and commitments.',
    5: 'where it found limited evidence that animal welfare was being managed effectively.',
    6: 'where it found limited, if any, evidence that farm animal welfare was recognised as a business issue.',
  };
  return `BBFAW’s [Year] benchmark placed [COMPANY] in Tier ${tier}, ${trailing[tier]}`;
}

export const ETHICS_V37_ADJUSTMENT_REGISTRY: Record<EthicsV37AdjustmentId, EthicsV37AdjustmentMeta> = {
  'ethics-v37-base': {
    id: 'ethics-v37-base',
    family: 'system',
    points: 0,
    highlightEligible: false,
    description: 'Base score +15 (assumes ethical until poor ratings) — internal starting point',
    externalResource: OFF_RESOURCE,
  },
  'ethics-v37-ktc-0-10': {
    id: 'ethics-v37-ktc-0-10',
    family: 'ktc',
    points: -10,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 0–10',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-11-20': {
    id: 'ethics-v37-ktc-11-20',
    family: 'ktc',
    points: -8,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 11–20',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-21-30': {
    id: 'ethics-v37-ktc-21-30',
    family: 'ktc',
    points: -6,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 21–30',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-31-50': {
    id: 'ethics-v37-ktc-31-50',
    family: 'ktc',
    points: -3,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 31–50',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-51-70': {
    id: 'ethics-v37-ktc-51-70',
    family: 'ktc',
    points: 3,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 51–70',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-71-80': {
    id: 'ethics-v37-ktc-71-80',
    family: 'ktc',
    points: 6,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 71–80',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-81-90': {
    id: 'ethics-v37-ktc-81-90',
    family: 'ktc',
    points: 8,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 81–90',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-ktc-91-100': {
    id: 'ethics-v37-ktc-91-100',
    family: 'ktc',
    points: 10,
    highlightEligible: true,
    description: 'KnowTheChain benchmark score 91–100',
    highlightTitle: KTC_L1,
    highlightExplainer: KTC_L2,
    externalResource: KTC_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-1': {
    id: 'ethics-v37-bbfaw-tier-1',
    family: 'bbfaw',
    points: 6,
    highlightEligible: true,
    description: 'BBFAW Tier 1 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 1 — leading governance`,
    highlightExplainer: bbfawTierExplainer(1),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-2': {
    id: 'ethics-v37-bbfaw-tier-2',
    family: 'bbfaw',
    points: 4,
    highlightEligible: true,
    description: 'BBFAW Tier 2 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 2 — strong governance`,
    highlightExplainer: bbfawTierExplainer(2),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-3': {
    id: 'ethics-v37-bbfaw-tier-3',
    family: 'bbfaw',
    points: 2,
    highlightEligible: true,
    description: 'BBFAW Tier 3 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 3 — established approach`,
    highlightExplainer: bbfawTierExplainer(3),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-4': {
    id: 'ethics-v37-bbfaw-tier-4',
    family: 'bbfaw',
    points: 1,
    highlightEligible: true,
    description: 'BBFAW Tier 4 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 4 — making progress`,
    highlightExplainer: bbfawTierExplainer(4),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-5': {
    id: 'ethics-v37-bbfaw-tier-5',
    family: 'bbfaw',
    points: -4,
    highlightEligible: true,
    description: 'BBFAW Tier 5 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 5 — limited progress`,
    highlightExplainer: bbfawTierExplainer(5),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-tier-6': {
    id: 'ethics-v37-bbfaw-tier-6',
    family: 'bbfaw',
    points: -6,
    highlightEligible: true,
    description: 'BBFAW Tier 6 (animal welfare governance)',
    highlightTitle: `${BBFAW_L1_PREFIX} Tier 6 — little evidence of governance`,
    highlightExplainer: bbfawTierExplainer(6),
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-impact-ab': {
    id: 'ethics-v37-bbfaw-impact-ab',
    family: 'bbfaw',
    points: 3,
    highlightEligible: true,
    description: 'BBFAW Impact Rating A/B (welfare outcomes)',
    highlightTitle: `${BBFAW_L1_PREFIX} Impact A/B — strong reported improvement`,
    highlightExplainer:
      'BBFAW’s [Year] Impact Rating placed [COMPANY] in A/B, reflecting reported improved welfare impacts for a reasonable ' +
      'proportion of farm animals in its operations or supply chains.',
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-impact-cd': {
    id: 'ethics-v37-bbfaw-impact-cd',
    family: 'bbfaw',
    points: 1,
    highlightEligible: true,
    description: 'BBFAW Impact Rating C/D (welfare outcomes)',
    highlightTitle: `${BBFAW_L1_PREFIX} Impact C/D — some reported improvement`,
    highlightExplainer:
      'BBFAW’s [Year] Impact Rating placed [COMPANY] in C/D, reflecting reported improved welfare impacts for at least some ' +
      'farm animals in its operations or supply chains.',
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-bbfaw-impact-ef': {
    id: 'ethics-v37-bbfaw-impact-ef',
    family: 'bbfaw',
    points: -3,
    highlightEligible: true,
    description: 'BBFAW Impact Rating E/F (welfare outcomes)',
    highlightTitle: `${BBFAW_L1_PREFIX} Impact E/F — improvement not yet demonstrated`,
    highlightExplainer:
      'BBFAW’s [Year] Impact Rating placed [COMPANY] in E/F, meaning it had yet to demonstrate improved welfare impacts for ' +
      'farm animals in its operations or supply chains.',
    externalResource: BBFAW_RESOURCE,
  },
  'ethics-v37-cert-fairtrade': {
    id: 'ethics-v37-cert-fairtrade',
    family: 'certifications',
    points: 6,
    highlightEligible: true,
    description: 'Ethics certifications — Fairtrade (highest eligible scheme; MVP no stacking)',
    highlightTitle: 'Fairtrade certified',
    highlightExplainer:
      'A Fairtrade certification mark appears on this packet. Fairtrade standards cover social, economic and environmental ' +
      'requirements.',
    externalResource: FAIRTRADE_RESOURCE,
  },
  'ethics-v37-cert-rainforest-alliance': {
    id: 'ethics-v37-cert-rainforest-alliance',
    family: 'certifications',
    points: 6,
    highlightEligible: true,
    description: 'Ethics certifications — Rainforest Alliance / legacy UTZ (highest eligible scheme; MVP no stacking)',
    highlightTitle: 'Rainforest Alliance certified',
    highlightExplainer:
      'A Rainforest Alliance or legacy UTZ certification mark appears on this packet. The programme covers environmental and ' +
      'social farming requirements.',
    externalResource: RAINFOREST_RESOURCE,
  },
  'ethics-v37-cert-asc': {
    id: 'ethics-v37-cert-asc',
    family: 'certifications',
    points: 4,
    highlightEligible: true,
    description: 'Ethics certifications — ASC (highest eligible scheme; MVP no stacking)',
    highlightTitle: 'Certified responsible farmed seafood',
    highlightExplainer:
      'The ASC label appears on this packet. It identifies farmed seafood from a certified supply chain whose standards cover ' +
      'environmental stewardship, animal welfare and social requirements.',
    externalResource: ASC_RESOURCE,
  },
  'ethics-v37-cert-msc': {
    id: 'ethics-v37-cert-msc',
    family: 'certifications',
    points: 4,
    highlightEligible: true,
    description: 'Ethics certifications — MSC (highest eligible scheme; MVP no stacking)',
    highlightTitle: 'Certified sustainable wild-caught seafood',
    highlightExplainer:
      'The MSC blue label appears on this packet. It identifies wild-caught seafood from fisheries independently assessed against ' +
      'MSC environmental-sustainability requirements, with supply-chain traceability controls.',
    externalResource: MSC_RESOURCE,
  },
  'ethics-v37-cert-organic': {
    id: 'ethics-v37-cert-organic',
    family: 'certifications',
    points: 2,
    highlightEligible: true,
    description: 'Ethics certifications — Organic (highest eligible scheme; MVP no stacking)',
    highlightTitle: 'Organic certified',
    highlightExplainer:
      'An organic certification mark appears on this packet, indicating certification against that scheme’s organic standard.',
    externalResource: ORGANIC_RESOURCE,
  },
  'ethics-v37-frozen-benchmark-ineligible': {
    id: 'ethics-v37-frozen-benchmark-ineligible',
    family: 'system',
    points: 0,
    highlightEligible: false,
    description: 'Frozen benchmark not eligible for ethics scoring (deterministic zero benchmark movement)',
    externalResource: OFF_RESOURCE,
  },
  'ethics-v37-final-cap': {
    id: 'ethics-v37-final-cap',
    family: 'system',
    points: 0,
    dynamicPoints: true,
    highlightEligible: false,
    description: 'Final Ethics cap normaliser (25/25) — arithmetic only',
    externalResource: OFF_RESOURCE,
  },
  'ethics-v37-final-floor': {
    id: 'ethics-v37-final-floor',
    family: 'system',
    points: 0,
    dynamicPoints: true,
    highlightEligible: false,
    description: 'Final Ethics floor normaliser (0/25) — arithmetic only',
    externalResource: OFF_RESOURCE,
  },
};

/**
 * KTC band ID from the governed total benchmark score.
 * Bands mirror `getKTCScoreAdjustment` exactly; null when no usable score fired.
 */
export function ethicsV37KtcAdjustmentId(
  totalBenchmarkScore: number | null | undefined
): EthicsV37AdjustmentId | null {
  if (totalBenchmarkScore == null || isNaN(totalBenchmarkScore)) return null;
  const s = totalBenchmarkScore;
  if (s <= 10) return 'ethics-v37-ktc-0-10';
  if (s <= 20) return 'ethics-v37-ktc-11-20';
  if (s <= 30) return 'ethics-v37-ktc-21-30';
  if (s <= 50) return 'ethics-v37-ktc-31-50';
  if (s <= 70) return 'ethics-v37-ktc-51-70';
  if (s <= 80) return 'ethics-v37-ktc-71-80';
  if (s <= 90) return 'ethics-v37-ktc-81-90';
  return 'ethics-v37-ktc-91-100';
}

const BBFAW_TIER_IDS: Record<BBFAWTier, EthicsV37AdjustmentId> = {
  1: 'ethics-v37-bbfaw-tier-1',
  2: 'ethics-v37-bbfaw-tier-2',
  3: 'ethics-v37-bbfaw-tier-3',
  4: 'ethics-v37-bbfaw-tier-4',
  5: 'ethics-v37-bbfaw-tier-5',
  6: 'ethics-v37-bbfaw-tier-6',
};

export function ethicsV37BbfawTierAdjustmentId(tier: BBFAWTier | null | undefined): EthicsV37AdjustmentId | null {
  if (!tier) return null;
  return BBFAW_TIER_IDS[tier] ?? null;
}

export function ethicsV37BbfawImpactAdjustmentId(
  impactRating: BBFAWImpactRating | null | undefined
): EthicsV37AdjustmentId | null {
  if (!impactRating) return null;
  const r = impactRating.toUpperCase();
  if (r === 'A' || r === 'B') return 'ethics-v37-bbfaw-impact-ab';
  if (r === 'C' || r === 'D') return 'ethics-v37-bbfaw-impact-cd';
  if (r === 'E' || r === 'F') return 'ethics-v37-bbfaw-impact-ef';
  return null;
}

const CERT_SCHEME_IDS: Partial<Record<EthicsCertificationScheme, EthicsV37AdjustmentId>> = {
  fairtrade: 'ethics-v37-cert-fairtrade',
  rainforest_alliance: 'ethics-v37-cert-rainforest-alliance',
  asc: 'ethics-v37-cert-asc',
  msc: 'ethics-v37-cert-msc',
  organic: 'ethics-v37-cert-organic',
};

/** Winning certification scheme → locked ID. RSPO and other superseded schemes intentionally have no ID. */
export function ethicsV37CertificationAdjustmentId(
  scheme: EthicsCertificationScheme | null | undefined
): EthicsV37AdjustmentId | null {
  if (!scheme) return null;
  return CERT_SCHEME_IDS[scheme] ?? null;
}
