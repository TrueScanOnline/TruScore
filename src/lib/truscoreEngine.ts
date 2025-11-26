// src/lib/truscoreEngine.ts – TruScore v1.4 Core Engine (Nov 2025)
// Full client-side TS scoring engine - offline-first, <150ms
// Ported from Python v1.4 spec exactly

import { Product, PackagingItem } from '../types/product';
import { ValuesPreferences } from '../store/useValuesStore';
import { generateInsights } from './valuesInsights';
import { getAdditiveInfo } from '../services/additiveDatabase';
import { getCruelParents, isCruelParent } from '../data/brandDatabase';

export interface Insight {
  type: 'geopolitical' | 'ethical' | 'environmental';
  reason: string;
  source?: string;
  color: string;
}

export interface TruScoreResult {
  truscore: number;
  breakdown: {
    Body: number;
    Planet: number;
    Care: number;
    Open: number;
  };
  hasNutriScore?: boolean;
  hasEcoScore?: boolean;
  hasOrigin?: boolean;
  insights?: Insight[];
}

// Get cruel parents list dynamically from brand database
const CRUEL_PARENTS = getCruelParents();

// Hidden terms for Open pillar
const HIDDEN_TERMS = [
  'parfum',
  'fragrance',
  'aroma',
  'flavor',
  'natural flavor',
  'natural flavour',
  'proprietary',
];

// Irritant terms for Body pillar
const IRRITANTS = [
  'paraben',
  'phthalate',
  'sulfate',
  'triclosan',
  'formaldehyde',
  'peg',
  'silicone',
  'phenoxyethanol',
];

/**
 * Calculate TruScore v1.4 - Full spec implementation
 * 4 pillars × 25pts = 100 total
 * Offline-first, <150ms execution
 * 
 * @param product - Product data
 * @param preferences - Optional user values preferences for insights generation
 */
export function calculateTruScore(
  product: Product | null | undefined,
  preferences?: ValuesPreferences
): TruScoreResult {
  // Input validation
  if (!product || typeof product !== 'object') {
    return {
      truscore: 0,
      breakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 },
      hasNutriScore: false,
      hasEcoScore: false,
      hasOrigin: false,
    };
  }

  try {
    const text = (product.ingredients_text || '').toLowerCase();
    const labels = (product.labels_tags || []).map((l: unknown) => 
      typeof l === 'string' ? l.toLowerCase() : ''
    ).filter(Boolean) as string[];
    const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
      typeof tag === 'string'
    ) as string[];
    const packagings = product.packagings || [];
    const brands = (product.brands || '').toLowerCase();
    const additivesCount = (product.additives_tags?.length || 0);

  // Helper: word boundary matching
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };

  // Helper: label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };

  // === BODY PILLAR (25pts) ===
  let body = 25; // Base when Nutri absent
  const hasNutriScore = !!product.nutriscore_grade;

  // If Nutri-Score exists, use it
  if (hasNutriScore) {
    const ns = product.nutriscore_grade?.toLowerCase();
    if (ns) {
      body = { a: 25, b: 20, c: 15, d: 10, e: 5 }[ns] || 25;
    }
  }

  // Penalties
  // Additives: Weighted by safety rating (safe: -0.5, caution: -1.5, avoid: -3, cap 15)
  let additivePenalty = 0;
  if (product.additives_tags && product.additives_tags.length > 0) {
    for (const tag of product.additives_tags) {
      // Extract E-number from tag (handles "en:e412" and "e412" formats)
      const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
      const eNum = eNumMatch ? eNumMatch[1] : tag.toLowerCase().replace(/^en:/, '');
      
      const additiveInfo = getAdditiveInfo(eNum);
      if (additiveInfo) {
        // Weight penalty by safety rating
        if (additiveInfo.safety === 'avoid') {
          additivePenalty += 3;
        } else if (additiveInfo.safety === 'caution') {
          additivePenalty += 1.5;
        } else if (additiveInfo.safety === 'safe') {
          additivePenalty += 0.5;
        } else {
          // Unknown safety - use default
          additivePenalty += 1.5;
        }
      } else {
        // Additive not in database - use default penalty
        additivePenalty += 1.5;
      }
    }
  }
  body -= Math.min(additivePenalty, 15);

  // Risky tags: −4 each
  const riskyCount = analysisTags.filter((t: string) =>
    ['carcinogenic', 'endocrine', 'palm', 'allergen', 'irritant'].some((x) =>
      t.toLowerCase().includes(x)
    )
  ).length;
  body -= riskyCount * 4;

  // Irritant block: −10
  if (IRRITANTS.some((i) => hasTerm(i))) {
    body -= 10;
  }

  // Fragrance: −10
  if (['parfum', 'fragrance', 'aroma'].some((a) => hasTerm(a))) {
    body -= 10;
  }

  // NOVA: 4 = −10, 3 = −5
  const nova = product.nova_group;
  if (nova === 4) body -= 10;
  else if (nova === 3) body -= 5;

  body = Math.max(0, Math.min(25, Math.round(body)));

  // === PLANET PILLAR (25pts) ===
  let planet = 25; // Base when Eco absent
  const hasEcoScore = !!product.ecoscore_grade;

  // If Eco-Score exists, use it
  if (hasEcoScore) {
    const es = product.ecoscore_grade?.toLowerCase();
    if (es) {
      planet = { a: 25, b: 20, c: 15, d: 10, e: 5 }[es] || 25;
    }
  }

  // Palm oil: −10
  const hasPalm = analysisTags.some((t: string) => t.toLowerCase().includes('palm'));
  const palmFree = [...analysisTags, ...labels].some((t: string) =>
    t.toLowerCase().includes('palm-oil-free')
  );
  if (hasPalm && !palmFree) {
    planet -= 10;
  }

  // Recyclable: full +5, partial +2
  const recyclableCount = packagings.filter(
    (p: PackagingItem) =>
      p.recycling &&
      ['recycle', 'widely recycled'].includes(p.recycling.toLowerCase())
  ).length;
  if (recyclableCount === packagings.length && packagings.length > 0) {
    planet += 5;
  } else if (recyclableCount > 0) {
    planet += 2;
  }

  planet = Math.max(0, Math.min(25, Math.round(planet)));

  // === CARE PILLAR (25pts) ===
  let care = 18; // Base (absence of known cruelty)

  // Stack bonuses
  if (hasLabel('fair-trade')) care += 8;
  if (hasLabel('organic')) care += 8;
  if (hasLabel('rainforest-alliance')) care += 7;
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) {
    care += 8;
  }
  if (hasLabel('rspca')) care += 6;
  if (labels.some((l: string) => ['en:vegan', 'en:cruelty-free'].includes(l))) {
    care += 10;
  }
  if (hasLabel('utz')) care += 7;

  // Cruel parent: −30 (using brand database for accurate detection)
  if (isCruelParent(brands)) {
    care -= 30;
  }

  care = Math.max(0, Math.min(25, Math.round(care)));

  // === OPEN PILLAR (25pts) ===
  let open = 25; // Base

  // Hidden terms: 1-2 = −12, ≥3 = −20
  const hiddenCount = HIDDEN_TERMS.filter((t) => hasTerm(t)).length;
  if (hiddenCount >= 3) {
    open -= 20;
  } else if (hiddenCount >= 1) {
    open -= 12;
  }

  // No ingredients: 5
  if (!text || text.trim().length === 0) {
    open = 5;
  } else {
    // Check for placeholder
    const isPlaceholder = /^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i.test(
      text.trim()
    );
    if (isPlaceholder) {
      open = 5;
    }
  }

  // No origin: −15
  const hasOrigin =
    product.origins_tags ||
    product.manufacturing_places_tags ||
    product.origins ||
    product.manufacturing_places;
  if (!hasOrigin || String(hasOrigin).toLowerCase().includes('unknown')) {
    open -= 15;
  }

  // Origin penalty: prefix mismatch OFF tags −8 Open
  // Check if origin tags don't match product code prefix
  // Note: This requires barcode/code which may not be in Product type
  // For now, we'll skip this check as it requires additional context
  // TODO: Implement origin penalty when barcode context is available

  open = Math.max(0, Math.min(25, Math.round(open)));

  // Total with bounds checking (0-100)
  const truscore = Math.max(0, Math.min(100, Math.round(body + planet + care + open)));

    // Generate insights if preferences provided
    const insights = preferences ? generateInsights(product, preferences) : [];
    
    // Debug logging for insights generation
    if (preferences && insights.length === 0) {
      console.log('[TruScore] No insights generated:', {
        hasPreferences: !!preferences,
        environmentalEnabled: preferences.environmentalEnabled,
        avoidPalmOil: preferences.avoidPalmOil,
        hasIngredientsText: !!(product.ingredients_text && product.ingredients_text.trim().length > 0),
        ingredientsTextSample: product.ingredients_text?.substring(0, 100),
        hasPalmOilAnalysis: !!product.palm_oil_analysis,
        palmOilContains: product.palm_oil_analysis?.containsPalmOil
      });
    }

    return {
      truscore,
      breakdown: {
        Body: Math.max(0, Math.min(25, Math.round(body))),
        Planet: Math.max(0, Math.min(25, Math.round(planet))),
        Care: Math.max(0, Math.min(25, Math.round(care))),
        Open: Math.max(0, Math.min(25, Math.round(open))),
      },
      hasNutriScore,
      hasEcoScore,
      hasOrigin: !!hasOrigin && !String(hasOrigin).toLowerCase().includes('unknown'),
      insights: insights.length > 0 ? insights : undefined,
    };
  } catch (error) {
    // Error handling - return safe default
    console.error('[truscoreEngine] Error calculating TruScore:', error);
    return {
      truscore: 0,
      breakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 },
      hasNutriScore: false,
      hasEcoScore: false,
      hasOrigin: false,
    };
  }
}

