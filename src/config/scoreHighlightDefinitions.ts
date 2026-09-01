// Score Highlight Definitions - Complete Catalogue from v8 Specification
// Based on Score_Highlights_Specification_v8_20251222.docx
// This file contains all possible highlights verbatim from the spec

import { resolveBrandToParent } from '../services/bbfawBrandResolutionService';
import { checkBBFAWTier, getBBFAWTierScore, getBBFAWImpactScore } from '../services/bbfawService';
import { resolveBrandToKTCParent } from '../services/ktcBrandResolutionService';
import { checkKTCParent, getKTCScoreAdjustment } from '../services/ktcService';
import { getEthicsCertificationAdjustment } from '../services/ethicsCertificationsService';
import { computePackagingFallback } from '../lib/truscoreEngine/pillars/planetPackagingFallback';

function productHasPlanetEcoScoreGrade(product: { ecoscore_grade?: string }): boolean {
  const g = product.ecoscore_grade;
  if (typeof g !== 'string') return false;
  return ['a', 'b', 'c', 'd', 'e'].includes(g.toLowerCase());
}

export type PillarCategory = 'body' | 'planet' | 'ethics' | 'open';
export type HighlightType = 'green' | 'red';
export type Severity = 'low' | 'medium' | 'high';

export interface HighlightDefinition {
  id: string; // Unique identifier
  pillar: PillarCategory;
  type: HighlightType;
  severity: Severity;
  title: string; // Highlights Commentary (verbatim from spec)
  description: string; // Explainer (verbatim from spec)
  externalResource: string; // External Resource URL (verbatim from spec)
  scoreValue: number; // Score Value from x-pillar table
  trigger: (product: any) => boolean; // Function to check if this highlight applies
  alcoholOverride?: string; // Replacement description for alcohol products (if applicable)
}

// Helper to determine severity from score value
function getSeverity(scoreValue: number): Severity {
  const absValue = Math.abs(scoreValue);
  if (absValue >= 5) return 'high';
  if (absValue >= 3) return 'medium';
  return 'low';
}

// Helper to determine type from score value
function getType(scoreValue: number): HighlightType {
  return scoreValue > 0 ? 'green' : 'red';
}

import { getPalmOilStatus } from '../utils/palmOilUtils';

// All highlight definitions - BODY PILLAR
export const BODY_HIGHLIGHTS: HighlightDefinition[] = [
  // Base Score - EXCLUDED (N/A internal buffer)
  
  // Nutrient Profile - A equiv
  {
    id: 'body-nutri-a',
    pillar: 'body',
    type: 'green',
    severity: 'high',
    title: 'Excellent nutrient balance',
    description:
      'Nutri-Score A: favourable nutrient profile per public Nutri-Score rules—typically lower sugar/salt/sat. fat and more fibre/protein where data supports it. Informational, not personal dietary advice.',
    externalResource: 'https://world.openfoodfacts.org/nutri-score',
    scoreValue: 7,
    trigger: (product) => product.nutriscore_grade?.toLowerCase() === 'a',
    alcoholOverride: 'Alcohol should always be consumed in moderation and with consideration of your personal health status',
  },
  
  // Nutrient Profile - B equiv
  {
    id: 'body-nutri-b',
    pillar: 'body',
    type: 'green',
    severity: 'medium',
    title: 'Good nutrient balance',
    description:
      'Nutri-Score B: generally favourable nutrient profile per Nutri-Score methodology. Useful for comparing similar products; not a personal health verdict.',
    externalResource: 'https://world.openfoodfacts.org/nutri-score',
    scoreValue: 3,
    trigger: (product) => product.nutriscore_grade?.toLowerCase() === 'b',
    alcoholOverride: 'Alcohol should always be consumed in moderation and with consideration of your personal health status',
  },
  
  // Nutrient Profile - C equiv
  {
    id: 'body-nutri-c',
    pillar: 'body',
    type: 'red',
    severity: 'low',
    title: 'Average nutrient balance',
    description: 'Just okay. Nutritional balance so-so. Watch your portions.',
    externalResource: 'https://world.openfoodfacts.org/nutri-score',
    scoreValue: 0,
    trigger: (product) => product.nutriscore_grade?.toLowerCase() === 'c',
    alcoholOverride: 'Alcohol should always be consumed in moderation and with consideration of your personal health status',
  },
  
  // Nutrient Profile - D equiv
  {
    id: 'body-nutri-d',
    pillar: 'body',
    type: 'red',
    severity: 'medium',
    title: 'Poor nutrient balance',
    description: 'Unbalanced—high in bad stuff even if there\'s some good stuff. Cut back.',
    externalResource: 'https://world.openfoodfacts.org/nutri-score',
    scoreValue: -3,
    trigger: (product) => product.nutriscore_grade?.toLowerCase() === 'd',
  },
  
  // Nutrient Profile - E equiv
  {
    id: 'body-nutri-e',
    pillar: 'body',
    type: 'red',
    severity: 'high',
    title: 'Very poor nutrient balance',
    description: 'Risky mix—loaded with sugar/salt/fat. Avoid often.',
    externalResource: 'https://world.openfoodfacts.org/nutri-score',
    scoreValue: -7,
    trigger: (product) => product.nutriscore_grade?.toLowerCase() === 'e',
  },
  
  // NOVA Group - NOVA 1
  {
    id: 'body-nova-1',
    pillar: 'body',
    type: 'green',
    severity: 'medium',
    title: 'Unprocessed or minimally processed',
    description:
      'NOVA 1: unprocessed or minimally processed foods per Open Food Facts NOVA. Often simpler ingredient lists; describes processing class, not a personal “best diet” choice.',
    externalResource: 'https://world.openfoodfacts.org/nova',
    scoreValue: 3,
    trigger: (product) => product.nova_group === 1,
  },
  
  // NOVA Group - NOVA 2
  {
    id: 'body-nova-2',
    pillar: 'body',
    type: 'green',
    severity: 'low',
    title: 'Processed culinary ingredients',
    description: 'Basic processed oils/sugars/fats/salts, extracted from natural foods or derived from nature, used to season and cook.',
    externalResource: 'https://world.openfoodfacts.org/nova',
    scoreValue: 1,
    trigger: (product) => product.nova_group === 2,
  },
  
  // NOVA Group - NOVA 3
  {
    id: 'body-nova-3',
    pillar: 'body',
    type: 'red',
    severity: 'low',
    title: 'Processed foods',
    description: 'Combined natural and culinary ingredients. Okay in moderation.',
    externalResource: 'https://world.openfoodfacts.org/nova',
    scoreValue: -1,
    trigger: (product) => product.nova_group === 3,
  },
  
  // NOVA Group - NOVA 4
  {
    id: 'body-nova-4',
    pillar: 'body',
    type: 'red',
    severity: 'high',
    title: 'Ultra-processed foods',
    description:
      'NOVA 4: ultra-processed per OFF NOVA. Population research links high ultra-processed intake with various health concerns—see Open Food Facts for context; not individual medical guidance.',
    externalResource: 'https://world.openfoodfacts.org/nova',
    scoreValue: -6,
    trigger: (product) => product.nova_group === 4,
  },
  
  // Additives - Safe (Score 0, but can show as green if applicable)
  // Note: Score 0 means no highlight, so we skip this
  
  // Additives - Caution
  {
    id: 'body-additives-caution',
    pillar: 'body',
    type: 'red',
    severity: 'low',
    title: 'Contains additives with a little caution needed.',
    description: 'Many additives are considered safe in small quantities for the general population and are vital for food preservation (preventing spoilage and bacterial growth). However, caution is advised for certain individuals (e.g., those with allergies or sensitivities).',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -1,
    trigger: (product) => {
      // This would need to check for additives with 'caution' safety rating
      // For now, placeholder - would need additive database integration
      return false;
    },
  },
  
  // Additives - Avoid
  {
    id: 'body-additives-avoid',
    pillar: 'body',
    type: 'red',
    severity: 'medium',
    title: 'Contains additives that are better avoided.',
    description:
      'Some additives are flagged “avoid” in public additive databases used by the app; authorities and studies vary by substance—see Open Food Facts additive pages for sources.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -3,
    trigger: (product) => {
      // This would need to check for additives with 'avoid' safety rating
      return false;
    },
  },
  
  // IARC Class 2B
  {
    id: 'body-iarc-2b',
    pillar: 'body',
    type: 'red',
    severity: 'medium',
    title: 'Contains possible carcinogen.',
    description: 'Suspected cancer link. Avoid altogether or at least limit exposure/intake.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -3,
    trigger: (product) => {
      // Would need IARC classification data
      return false;
    },
  },
  
  // IARC Class 2A
  {
    id: 'body-iarc-2a',
    pillar: 'body',
    type: 'red',
    severity: 'high',
    title: 'Contains probable carcinogen.',
    description: 'Probable cancer risk. Avoid altogether or at least be very aware of consumption levels.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -5,
    trigger: (product) => {
      // Would need IARC classification data
      return false;
    },
  },
  
  // EWG High
  {
    id: 'body-ewg-high',
    pillar: 'body',
    type: 'red',
    severity: 'high',
    title: 'High concern ingredients and/or processing.',
    description:
      'Elevated concern in public ingredient/processing signals (e.g. pesticides/additives) used by the app’s rules. Organic or simpler formulations may reduce some exposures—informational; check label and official sources.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -5,
    trigger: (product) => {
      // Would need EWG classification data
      return false;
    },
  },
  
  // IARC Class 1
  {
    id: 'body-iarc-1',
    pillar: 'body',
    type: 'red',
    severity: 'high',
    title: 'Contains known carcinogen.',
    description:
      'IARC Group 1 (known human carcinogen) where applicable additive/substance is present—see authoritative monographs and the product label; not a substitute for professional advice.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -10,
    trigger: (product) => {
      // Would need IARC classification data
      return false;
    },
  },
];

// PLANET PILLAR highlights
export const PLANET_HIGHLIGHTS: HighlightDefinition[] = [
  // Base Score - EXCLUDED (N/A internal buffer)
  
  // Eco-Score Grade - A
  {
    id: 'planet-ecoscore-a',
    pillar: 'planet',
    type: 'green',
    severity: 'high',
    title: 'Excellent eco-impact profile',
    description: 'Low emissions/water use—planet-friendly.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: 7,
    trigger: (product) => product.ecoscore_grade?.toLowerCase() === 'a',
  },
  
  // Eco-Score Grade - B
  {
    id: 'planet-ecoscore-b',
    pillar: 'planet',
    type: 'green',
    severity: 'medium',
    title: 'Better than average eco-impact profile',
    description: 'Solid sustainability—minimal harm.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: 3,
    trigger: (product) => product.ecoscore_grade?.toLowerCase() === 'b',
  },
  
  // Eco-Score Grade - C
  {
    id: 'planet-ecoscore-c',
    pillar: 'planet',
    type: 'red',
    severity: 'low',
    title: 'Average eco-impact profile (slight Planet penalty)',
    description: 'Eco-Score C applies a small negative adjustment (−1) on Planet, aligned with Body Nutri-Score C handling in MVP.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: -1,
    trigger: (product) => product.ecoscore_grade?.toLowerCase() === 'c',
  },
  
  // Eco-Score Grade - D
  {
    id: 'planet-ecoscore-d',
    pillar: 'planet',
    type: 'red',
    severity: 'medium',
    title: 'Poor eco-impact',
    description: 'High resource drain—eco concern.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: -3,
    trigger: (product) => product.ecoscore_grade?.toLowerCase() === 'd',
  },
  
  // Eco-Score Grade - E
  {
    id: 'planet-ecoscore-e',
    pillar: 'planet',
    type: 'red',
    severity: 'high',
    title: 'Very poor eco-impact',
    description: 'Massive footprint—avoid for planet.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: -7,
    trigger: (product) => product.ecoscore_grade?.toLowerCase() === 'e',
  },
  
  // Sustainable palm (informational — Planet pillar does not score palm in MVP v19)
  {
    id: 'planet-palm-sustainable',
    pillar: 'planet',
    type: 'green',
    severity: 'low',
    title: 'Sustainable palm evidence (display)',
    description: 'Certified or labelled sustainable palm may appear in product details. Planet v19 does not change the Planet score for palm in MVP.',
    externalResource: 'https://www.rspo.org/standards',
    scoreValue: 0,
    trigger: (product) => {
      const tags = product.ingredients_analysis_tags || [];
      return tags.some(
        (tag: string) =>
          tag.toLowerCase().includes('palm-oil') &&
          (tag.toLowerCase().includes('rspo') || tag.toLowerCase().includes('sustainable'))
      );
    },
  },

  {
    id: 'planet-palm-detected',
    pillar: 'planet',
    type: 'red',
    severity: 'low',
    title: 'Palm oil noted (not scored on Planet)',
    description: 'Palm oil may be flagged for transparency. Planet v19 does not apply a palm penalty from OFF alone in MVP.',
    externalResource: 'https://www.wwf.org/palmoil',
    scoreValue: 0,
    trigger: (product) => {
      const status = getPalmOilStatus(product.palm_oil_analysis);
      return status?.containsPalmOil === true && status?.isPalmOilFree !== true;
    },
  },

  {
    id: 'planet-packaging-fallback-plus2',
    pillar: 'planet',
    type: 'green',
    severity: 'medium',
    title: 'Packaging fallback +2 (kerbside, complete)',
    description: 'Eco-Score missing: structured packaging shows all primary components kerbside-recyclable in an approved market, with packagings_complete true (Planet v19 + Annex v2).',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: 2,
    trigger: (product) =>
      !productHasPlanetEcoScoreGrade(product) && computePackagingFallback(product).points === 2,
  },

  {
    id: 'planet-packaging-fallback-plus1',
    pillar: 'planet',
    type: 'green',
    severity: 'low',
    title: 'Packaging fallback +1 (partial kerbside)',
    description: 'Eco-Score missing: at least one kerbside-recyclable primary component and none marked not recyclable (Planet v19 + Annex v2).',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: 1,
    trigger: (product) =>
      !productHasPlanetEcoScoreGrade(product) && computePackagingFallback(product).points === 1,
  },
];

function getCompanyCandidatesForBBFAW(product: any): string[] {
  const candidates: string[] = [];
  if (product.brand_owner && typeof product.brand_owner === 'string') {
    const t = product.brand_owner.trim();
    if (t.length >= 2) candidates.push(t);
  }
  if (product.brands && typeof product.brands === 'string') {
    for (const p of product.brands.split(',')) {
      const t = p.trim();
      if (t.length >= 2 && t.toLowerCase() !== 'unknown') candidates.push(t);
    }
  }
  return [...new Set(candidates)];
}

// Helper: Check if product matches BBFAW company (tries all brand candidates + alias resolution)
// Uses same logic as ethicsPillar: prefer brandAliasMap tier/impact when resolved, else BBFAW canonical data
function productMatchesBBFAW(product: any, tier?: number, impact?: string): boolean {
  const candidates = getCompanyCandidatesForBBFAW(product);
  for (const raw of candidates) {
    const resolved = resolveBrandToParent(raw);
    const company = resolved?.parent_entity_exact ?? raw;

    // Prefer resolved mapping (brandAliasMap from Database) when it has valid tier/impact
    const useResolved =
      resolved &&
      resolved.tier_2024 >= 1 &&
      resolved.tier_2024 <= 6 &&
      resolved.impact_2024;

    const effectiveTier = useResolved ? resolved!.tier_2024 : checkBBFAWTier(company)?.tier;
    const effectiveImpact = useResolved ? resolved!.impact_2024 : checkBBFAWTier(company)?.impactRating;

    if (effectiveTier == null && effectiveImpact == null) continue;
    if (tier != null && effectiveTier !== tier) continue;
    if (impact != null && effectiveImpact !== impact) continue;
    return true;
  }
  return false;
}

// Helper: Check if product matches a KTC benchmark parent
function productMatchesKTC(product: any): ReturnType<typeof checkKTCParent> {
  const candidates = getCompanyCandidatesForBBFAW(product);
  for (const raw of candidates) {
    const resolved = resolveBrandToKTCParent(raw);
    const company = resolved?.parentName ?? raw;
    const ktc = checkKTCParent(company);
    if (ktc) return ktc;
  }
  return null;
}

// ETHICS PILLAR highlights - mirror ETHICS score adjustments (sign-consistent)
export const ETHICS_HIGHLIGHTS: HighlightDefinition[] = [
  {
    id: 'ethics-bbfaw-tier-positive',
    pillar: 'ethics',
    type: 'green',
    severity: 'medium',
    title: 'BBFAW benchmark – positive animal welfare score.',
    description:
      'This company appears in the Business Benchmark on Farm Animal Welfare (BBFAW) with an overall positive adjustment to the Ethics score (higher tiers and/or strong welfare impact ratings).',
    externalResource: 'https://www.bbfaw.com/food-companies/',
    // Highlights are informational only – they must not change the score
    scoreValue: 0,
    trigger: (p) => {
      // Compute BBFAW adjustment directly from the current product’s brand/parent mapping,
      // independent of whether a TruScore analysis object has been attached yet.
      const candidates = getCompanyCandidatesForBBFAW(p);
      for (const raw of candidates) {
        const resolved = resolveBrandToParent(raw);
        const name = resolved?.parent_entity_exact ?? raw;
        const data = checkBBFAWTier(name);
        if (!data) continue;
        const tierScore = getBBFAWTierScore(data.tier as any);
        const impactScore = getBBFAWImpactScore(data.impactRating as any);
        if (tierScore + impactScore > 0) return true;
      }
      return false;
    },
  },
  {
    id: 'ethics-bbfaw-tier-negative',
    pillar: 'ethics',
    type: 'red',
    severity: 'medium',
    title: 'BBFAW benchmark – negative animal welfare score.',
    description:
      'This company appears in the Business Benchmark on Farm Animal Welfare (BBFAW) with an overall negative adjustment to the Ethics score (lower tiers and/or poor welfare impact ratings).',
    externalResource: 'https://www.bbfaw.com/food-companies/',
    // Highlights are informational only – they must not change the score
    scoreValue: 0,
    trigger: (p) => {
      // Compute BBFAW adjustment directly from the current product’s brand/parent mapping,
      // independent of whether a TruScore analysis object has been attached yet.
      const candidates = getCompanyCandidatesForBBFAW(p);
      for (const raw of candidates) {
        const resolved = resolveBrandToParent(raw);
        const name = resolved?.parent_entity_exact ?? raw;
        const data = checkBBFAWTier(name);
        if (!data) continue;
        const tierScore = getBBFAWTierScore(data.tier as any);
        const impactScore = getBBFAWImpactScore(data.impactRating as any);
        if (tierScore + impactScore < 0) return true;
      }
      return false;
    },
  },
  {
    id: 'ethics-ktc-positive',
    pillar: 'ethics',
    type: 'green',
    severity: 'medium',
    title: 'KnowTheChain (KTC) – positive human welfare score.',
    description:
      'This company appears in the KnowTheChain Food & Beverage benchmark with a positive adjustment to the Ethics score, indicating stronger protections for workers in its supply chains.',
    externalResource: 'https://www.business-humanrights.org/en/companies/',
    // Highlights are informational only – they must not change the score
    scoreValue: 0,
    trigger: (p) => {
      // Compute KTC adjustment directly from the current product’s brand/parent mapping,
      // independent of whether a TruScore analysis object has been attached yet.
      const ktc = productMatchesKTC(p);
      if (!ktc) return false;
      return getKTCScoreAdjustment(ktc.totalBenchmarkScore) > 0;
    },
  },
  {
    id: 'ethics-ktc-negative',
    pillar: 'ethics',
    type: 'red',
    severity: 'medium',
    title: 'KnowTheChain (KTC) – negative human welfare score.',
    description:
      'This company appears in the KnowTheChain Food & Beverage benchmark with a negative adjustment to the Ethics score, indicating weaker performance on labour rights in its supply chains.',
    externalResource: 'https://www.business-humanrights.org/en/companies/',
    // Highlights are informational only – they must not change the score
    scoreValue: 0,
    trigger: (p) => {
      // Compute KTC adjustment directly from the current product’s brand/parent mapping,
      // independent of whether a TruScore analysis object has been attached yet.
      const ktc = productMatchesKTC(p);
      if (!ktc) return false;
      return getKTCScoreAdjustment(ktc.totalBenchmarkScore) < 0;
    },
  },
  {
    id: 'ethics-certifications-positive',
    pillar: 'ethics',
    type: 'green',
    severity: 'medium',
    title: 'Recognised ethics certification on pack (single highest applies).',
    description:
      'This product carries at least one eligible third-party certification mapped from Open Food Facts (and MSC when validated). Only the highest-weight scheme is applied in MVP (no stacking).',
    externalResource: 'https://world.openfoodfacts.org/',
    scoreValue: 0,
    trigger: (p) => getEthicsCertificationAdjustment(p) > 0,
  },
];

/** BBFAW/KTC benchmark highlights — omit from Result screen “Score highlights” strip only (still allowed in TruScore explanation modals/cards). */
export const ETHICS_BBFAW_KTC_SCORE_HIGHLIGHT_IDS = new Set<string>([
  'ethics-bbfaw-tier-positive',
  'ethics-bbfaw-tier-negative',
  'ethics-ktc-positive',
  'ethics-ktc-negative',
]);

// OPEN PILLAR highlights — superseded by Open v15 fired-adjustment binding (openScoreHighlights.ts).
/** @deprecated v14 catalogue retired; S12 consumes production fired Open v15 adjustments. */
export const OPEN_HIGHLIGHTS: HighlightDefinition[] = [];

// Combine all highlights
export const ALL_HIGHLIGHT_DEFINITIONS: HighlightDefinition[] = [
  ...BODY_HIGHLIGHTS,
  ...PLANET_HIGHLIGHTS,
  ...ETHICS_HIGHLIGHTS,
  ...OPEN_HIGHLIGHTS,
];

export { isAlcoholicProduct } from '../utils/alcoholHighlightClassification';

