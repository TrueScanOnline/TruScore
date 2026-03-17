// Score Highlight Definitions - Complete Catalogue from v8 Specification
// Based on Score_Highlights_Specification_v8_20251222.docx
// This file contains all possible highlights verbatim from the spec

import { resolveBrandToParent } from '../services/bbfawBrandResolutionService';
import { checkBBFAWTier } from '../services/bbfawService';
import { resolveBrandToKTCParent } from '../services/ktcBrandResolutionService';
import { checkKTCParent, isKTCHighPerformer, isKTCLowPerformer } from '../services/ktcService';

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
    description: 'Balanced nutrition profile boosts health—low sugar/salt/fat, high in fibre/protein.',
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
    description: 'Solid nutrient profile and overall good for your health.',
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
    description: 'Whole foods—natural, healthiest choice.',
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
    description: 'Engineered foods linked to obesity/gut issues. Limit your intake.',
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
    description: 'Some additives are widely recommended for avoidance due to significant health concerns, including links to cancer, cardiovascular problems, and other health issues.',
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
    description: 'Indicates significant concerns related to potential health hazards from nutrition, ingredients, and processing including use of pesticides. Limit risk by choosing organic options.',
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
    description: 'Proven cancer risk. Steer clear if you can or absolutely minimise intake.',
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
    title: 'Average eco-impact profile',
    description: 'Neutral—standard footprint, could improve.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: 0,
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
  
  // High CSV carbon (if OFF missing) - Placeholder, would need carbon data
  {
    id: 'planet-carbon-high',
    pillar: 'planet',
    type: 'red',
    severity: 'high',
    title: 'High carbon footprint',
    description: 'Carbon-heavy—contributes to climate change.',
    externalResource: 'https://world.openfoodfacts.org/eco-score',
    scoreValue: -5,
    trigger: (product) => {
      // Would check carbon footprint data if ecoscore missing
      return false;
    },
  },
  
  // Sustainable Palm Oil
  {
    id: 'planet-palm-sustainable',
    pillar: 'planet',
    type: 'green',
    severity: 'low',
    title: 'Sustainable Palm Oil certified.',
    description: 'Certified palm—no deforestation link.',
    externalResource: 'https://www.rspo.org/standards',
    scoreValue: 0, // Score 0 means no highlight typically, but spec says to show
    trigger: (product) => {
      // Check for RSPO or sustainable palm oil tags
      const tags = product.ingredients_analysis_tags || [];
      return tags.some((tag: string) => 
        tag.toLowerCase().includes('palm-oil') && 
        (tag.toLowerCase().includes('rspo') || tag.toLowerCase().includes('sustainable'))
      );
    },
  },
  
  // Non-sustainable Palm Oil
  {
    id: 'planet-palm-unsustainable',
    pillar: 'planet',
    type: 'red',
    severity: 'high',
    title: 'Unsustainable Palm Oil',
    description: 'Linked to habitat loss—avoid for the benefit of the planet.',
    externalResource: 'https://www.wwf.org/palmoil',
    scoreValue: -8,
    trigger: (product) => {
      // Use palm oil utility to check
      const status = getPalmOilStatus(product.palm_oil_analysis);
      return status?.isNonSustainable === true;
    },
  },
  
  // Brand/parent low WWF/RSPO
  {
    id: 'planet-brand-low-sustainability',
    pillar: 'planet',
    type: 'red',
    severity: 'medium',
    title: 'Parent/Brand low sustainability rating',
    description: 'Brand or Parent company has a poor environmental track record.',
    externalResource: 'https://www.ran.org/palm',
    scoreValue: -4,
    trigger: (product) => {
      // Would need brand sustainability rating data
      return false;
    },
  },
  
  // Packaging - Fully recyclable
  {
    id: 'planet-packaging-recyclable',
    pillar: 'planet',
    type: 'green',
    severity: 'medium',
    title: 'Fully recyclable',
    description: 'Easy recycle—low waste impact.',
    externalResource: 'https://recyclingpartnership.org',
    scoreValue: 3,
    trigger: (product) => {
      return product.packaging_data?.isRecyclable === true;
    },
  },
  
  // Packaging - Partially recyclable
  {
    id: 'planet-packaging-partial',
    pillar: 'planet',
    type: 'green',
    severity: 'low',
    title: 'Partially recyclable',
    description: 'Some reuse—better than nothing.',
    externalResource: 'https://recyclingpartnership.org',
    scoreValue: 1,
    trigger: (product) => {
      // Would need to check if partially recyclable
      return false;
    },
  },
  
  // Packaging - High eco-cost material
  {
    id: 'planet-packaging-high-impact',
    pillar: 'planet',
    type: 'red',
    severity: 'high',
    title: 'High impact packaging',
    description: 'Polluting packaging—eco drain.',
    externalResource: 'https://idematapp.com',
    scoreValue: -5,
    trigger: (product) => {
      // Would need Idemat eco-cost data
      return false;
    },
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

// ETHICS PILLAR highlights - presence-based only (no score effect)
export const ETHICS_HIGHLIGHTS: HighlightDefinition[] = [
  {
    id: 'ethics-bbfaw-present',
    pillar: 'ethics',
    type: 'green',
    severity: 'medium',
    title: 'This company is assessed by the Business Benchmark on Farm Animal Welfare (BBFAW).',
    description:
      'This brand or its parent company appears in the BBFAW benchmark. Tap to view the latest farm animal welfare benchmark information for this company.',
    externalResource: 'https://www.bbfaw.com/food-companies/',
    scoreValue: 0,
    trigger: (p) => productMatchesBBFAW(p),
  },
  {
    id: 'ethics-ktc-present',
    pillar: 'ethics',
    type: 'green',
    severity: 'medium',
    title: 'This company is assessed by KnowTheChain (KTC) for labour rights in supply chains.',
    description:
      'This brand or its parent company appears in the KnowTheChain food & beverage benchmark. Tap to view the latest labour rights benchmark information for this company.',
    externalResource: 'https://www.business-humanrights.org/en/companies/',
    scoreValue: 0,
    trigger: (p) => !!productMatchesKTC(p),
  },
];

// OPEN PILLAR highlights
export const OPEN_HIGHLIGHTS: HighlightDefinition[] = [
  // Base Score - EXCLUDED (N/A internal buffer)
  
  // Ingredients Disclosure - Present
  {
    id: 'open-ingredients-present',
    pillar: 'open',
    type: 'green',
    severity: 'low',
    title: 'Full ingredients listed',
    description: 'Clear ingredient list—no surprises.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
    scoreValue: 2,
    trigger: (product) => {
      const ingredients = product.ingredients_text?.trim() || '';
      return ingredients.length > 10; // Valid ingredients text present
    },
  },
  
  // Ingredients Disclosure - None
  {
    id: 'open-ingredients-none',
    pillar: 'open',
    type: 'red',
    severity: 'medium',
    title: 'No ingredients listed',
    description: 'No ingredients available electronically. Is it on the packet? Click here to add.',
    externalResource: 'https://world.openfoodfacts.org/ingredients',
    scoreValue: -3,
    trigger: (product) => {
      const ingredients = product.ingredients_text?.trim() || '';
      return ingredients.length === 0;
    },
  },
  
  // Hidden Terms - Zero hidden & NOVA 1-2
  {
    id: 'open-hidden-zero-nova12',
    pillar: 'open',
    type: 'green',
    severity: 'medium',
    title: 'Fully transparent label',
    description: 'No vague terms identified. Transparent ingredient disclosure.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: 4,
    trigger: (product) => {
      const ingredients = (product.ingredients_text || '').toLowerCase();
      const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
      const hasHidden = hiddenTerms.some(term => ingredients.includes(term));
      return !hasHidden && (product.nova_group === 1 || product.nova_group === 2);
    },
  },
  
  // Hidden Terms - Zero hidden & NOVA 3-4
  {
    id: 'open-hidden-zero-nova34',
    pillar: 'open',
    type: 'green',
    severity: 'low',
    title: 'Seemingly transparent label',
    description: 'No vague terms identified, but it is a processed product. Take a good look and report any vague terms <here>.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: 2,
    trigger: (product) => {
      const ingredients = (product.ingredients_text || '').toLowerCase();
      const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
      const hasHidden = hiddenTerms.some(term => ingredients.includes(term));
      return !hasHidden && (product.nova_group === 3 || product.nova_group === 4);
    },
  },
  
  // Hidden Terms - 1 hidden term
  {
    id: 'open-hidden-1',
    pillar: 'open',
    type: 'red',
    severity: 'low',
    title: 'Possible vague or hidden ingredient terms.',
    description: 'Vague ingredient term; [insert hidden term(s)]. Improved clarity needed. Potentially hides risks.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -2,
    trigger: (product) => {
      const ingredients = (product.ingredients_text || '').toLowerCase();
      const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
      const count = hiddenTerms.filter(term => ingredients.includes(term)).length;
      return count === 1;
    },
  },
  
  // Hidden Terms - 2 hidden terms
  {
    id: 'open-hidden-2',
    pillar: 'open',
    type: 'red',
    severity: 'high',
    title: 'Vague or hidden ingredient terms.',
    description: 'Multiple obscure ingredients; [insert hidden term(s)]. Improved clarity needed. Potentially hides risks',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -6,
    trigger: (product) => {
      const ingredients = (product.ingredients_text || '').toLowerCase();
      const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
      const count = hiddenTerms.filter(term => ingredients.includes(term)).length;
      return count === 2;
    },
  },
  
  // Hidden Terms - >=3 hidden terms
  {
    id: 'open-hidden-3plus',
    pillar: 'open',
    type: 'red',
    severity: 'high',
    title: 'Many vague or hidden ingredient terms.',
    description: 'Heavy ingredient opacity; [insert hidden term(s)]. Potentially hides risks.',
    externalResource: 'https://world.openfoodfacts.org/additives',
    scoreValue: -11,
    trigger: (product) => {
      const ingredients = (product.ingredients_text || '').toLowerCase();
      const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
      const count = hiddenTerms.filter(term => ingredients.includes(term)).length;
      return count >= 3;
    },
  },
  
  // Nutritional Information - Present with benchmarking
  {
    id: 'open-nutrition-full',
    pillar: 'open',
    type: 'green',
    severity: 'medium',
    title: 'Full nutrition disclosed',
    description: 'Nutritional information and benchmarks clear. Easy to compare.',
    externalResource: 'https://world.openfoodfacts.org/nutrition',
    scoreValue: 3,
    trigger: (product) => {
      // Check if nutriments exist and have standard format (per 100g)
      return product.nutriments && Object.keys(product.nutriments).length > 0;
    },
  },
  
  // Nutritional Information - None
  {
    id: 'open-nutrition-none',
    pillar: 'open',
    type: 'red',
    severity: 'medium',
    title: 'No nutrition info',
    description: 'Missing nutritional details. Difficult to assess nutritional value.',
    externalResource: 'https://world.openfoodfacts.org/nutrition',
    scoreValue: -3,
    trigger: (product) => {
      return !product.nutriments || Object.keys(product.nutriments).length === 0;
    },
  },
  
  // Origins - Complete origins
  {
    id: 'open-origins-complete',
    pillar: 'open',
    type: 'green',
    severity: 'medium',
    title: 'Full origins disclosed',
    description: 'Ingredient origin(s) made available.',
    externalResource: 'https://world.openfoodfacts.org/origins',
    scoreValue: 4,
    trigger: (product) => {
      return (product.origins_tags && product.origins_tags.length > 0) ||
             (product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0) ||
             !!(product.origins?.trim()) ||
             !!(product.manufacturing_places?.trim());
    },
  },
  
  // Origins - No origins
  {
    id: 'open-origins-none',
    pillar: 'open',
    type: 'red',
    severity: 'medium',
    title: 'No origins disclosed',
    description: 'No ingredients origins available electronically. Is it on the packet?',
    externalResource: 'https://world.openfoodfacts.org/origins',
    scoreValue: -4,
    trigger: (product) => {
      const hasOriginsTags = product.origins_tags && product.origins_tags.length > 0;
      const hasManufacturingTags = product.manufacturing_places_tags && product.manufacturing_places_tags.length > 0;
      const hasOriginsString = !!(product.origins?.trim());
      const hasManufacturingString = !!(product.manufacturing_places?.trim());
      return !hasOriginsTags && !hasManufacturingTags && !hasOriginsString && !hasManufacturingString;
    },
  },
  
  // Brand Ownership - Hidden/opaque parent
  {
    id: 'open-ownership-opaque',
    pillar: 'open',
    type: 'red',
    severity: 'medium',
    title: 'Opaque ownership',
    description: 'Covert big corporate product ownership. Small, independent product \'illusion\' alert.',
    externalResource: 'https://world.openfoodfacts.org/brands',
    scoreValue: -3,
    trigger: (product) => {
      // Would need brand ownership mapping data
      return false;
    },
  },
];

// Combine all highlights
export const ALL_HIGHLIGHT_DEFINITIONS: HighlightDefinition[] = [
  ...BODY_HIGHLIGHTS,
  ...PLANET_HIGHLIGHTS,
  ...ETHICS_HIGHLIGHTS,
  ...OPEN_HIGHLIGHTS,
];

// Helper to check if product is alcoholic
export function isAlcoholicProduct(product: any): boolean {
  // Check nutriments for alcohol
  const alcoholValue = product.nutriments?.['alcohol_100g'] || product.nutriments?.['alcohol'];
  if (alcoholValue !== undefined && alcoholValue > 0) return true;
  
  // Check categories
  const categories = product.categories_tags || [];
  if (categories.some((cat: string) => 
    cat.toLowerCase().includes('alcohol') || 
    cat.toLowerCase().includes('wine') || 
    cat.toLowerCase().includes('beer') ||
    cat.toLowerCase().includes('spirits')
  )) return true;
  
  // Check product name
  const name = (product.product_name || product.product_name_en || '').toLowerCase();
  if (name.includes('alcohol') || 
      /\b(wine|beer|whiskey|whisky|vodka|rum|gin|tequila)\b/.test(name)) return true;
  
  return false;
}

