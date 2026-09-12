// TruScore calculation
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { extractManufacturingCountry, calculateEcoScore, formatCertifications } from '../services/openFoodFacts';
import { calculateTruScore, buildTruScoreAnalysis } from '../lib/truscoreEngine';
import { getPlanetScoringContext } from './planetScoringContext';
import { scoreBodyMvpAdditives } from '../lib/truscoreEngine/pillars/bodyAdditiveScoring';
import { applyResolvedNutrientLevels } from './resolveNutrientLevels';
import { assessGovernedNutrientsFromProduct } from '../nutrition/governedNutrientAssessment';
import { logger } from './logger';
import { powershellLogger } from './powershellLogger';
import { hasCoreTruthAuthority } from '../config/coreTruthProductCacheAuthority';

/**
 * Scoring eligibility after Review 1 Pass 2 (NA-003):
 * only Core Truth–authorised products (World OFF + governed transforms) may score.
 * Storage location (sqlite / AsyncStorage) and legacy source labels are not authority.
 */
function hasSufficientDataForTrustScore(product: Product): boolean {
  return hasCoreTruthAuthority(product);
}

/**
 * Calculate overall TruScore (0-100) based on multiple factors
 * Only calculates score if we have sufficient real data
 *
 * Note: This is a wrapper function that calls calculateTruScore from truscoreEngine.ts
 * The function name uses "TrustScore" for backward compatibility with ProductWithTrustScore type
 *
 * Review 1 Pass 2 (NA-001): always recalculates — calculated TruScore cache has no runtime authority.
 */
export async function calculateTrustScore(product: Product): Promise<ProductWithTrustScore> {
  // Wave 3: OFF-legacy nutrient_levels fill is a no-op. Consumer ratings use assessGovernedNutrients.
  applyResolvedNutrientLevels(product);

  // Check if we have sufficient data for a meaningful TruScore
  const hasRealData = hasSufficientDataForTrustScore(product);

  if (!hasRealData) {
    // Return product without TruScore (marked as insufficient data)
    return {
      ...product,
      trust_score: null,
      trust_score_breakdown: null,
    };
  }

  // Always calculate current TruScore from current product (NA-001 / NA-015 / NA-016).
  logger.debug('[TruScore] Calculating TruScore:', {
    barcode: product.barcode,
    hasNutriScore: !!product.nutriscore_grade,
    nutriscore_grade: product.nutriscore_grade,
    hasEcoScore: !!product.ecoscore_grade,
    ecoscore_grade: product.ecoscore_grade,
  });
  const truScoreResult = calculateTruScore(product, undefined, getPlanetScoringContext());

  // Technical scoring failure → unavailable/non-assessment (never Overall 0 / all-zero pillars)
  if (truScoreResult.scoringUnavailable || truScoreResult.truscore == null) {
    return {
      ...product,
      trust_score: null,
      trust_score_breakdown: null,
      _truscore_metadata: {
        hasNutriScore: !!truScoreResult.hasNutriScore,
        hasEcoScore: !!truScoreResult.hasEcoScore,
        hasOrigin: !!truScoreResult.hasOrigin,
        scoringUnavailable: true,
      },
    };
  }
  
  // Ensure all pillar scores are valid numbers (safety check)
  const body = typeof truScoreResult.breakdown.Body === 'number' && !isNaN(truScoreResult.breakdown.Body) 
    ? truScoreResult.breakdown.Body 
    : 0;
  const planet = typeof truScoreResult.breakdown.Planet === 'number' && !isNaN(truScoreResult.breakdown.Planet) 
    ? truScoreResult.breakdown.Planet 
    : 0;
  const ethics = typeof truScoreResult.breakdown.Ethics === 'number' && !isNaN(truScoreResult.breakdown.Ethics) 
    ? truScoreResult.breakdown.Ethics 
    : 0;
  const open = typeof truScoreResult.breakdown.Open === 'number' && !isNaN(truScoreResult.breakdown.Open) 
    ? truScoreResult.breakdown.Open 
    : 0;

  const breakdown: TrustScoreBreakdown = {
    body,
    planet,
    ethics,
    open,
    // Legacy fields (for backward compatibility and display)
    sustainability: (planet / 25) * 100, // Convert to 0-100 for compatibility
    bodySafety: (body / 25) * 100,
    processing: calculateProcessingScore(product), // Still calculated for educational display
    transparency: (open / 25) * 100,
    reasons: [],
  };

  // TruScore: Sum of 4 equal pillars (0-100 total)
  // Each pillar is 25 points maximum
  const truScore = truScoreResult.truscore;

  // Generate reasons (use v1.3 metadata)
  breakdown.reasons = generateTrustReasons(
    breakdown,
    product,
    {
      hasNutriScore: truScoreResult.hasNutriScore,
      hasEcoScore: truScoreResult.hasEcoScore,
      hasOrigin: truScoreResult.hasOrigin,
    }
  );

  // Always build analysis from current product when we have pillar details, so fetch trace
  // reflects this product (e.g. post-merge OFF+Spoonacular), not a cached analysis from
  // an earlier product (e.g. progressive OFF+OBF).
  const analysis =
    truScoreResult.pillarDetails
      ? buildTruScoreAnalysis(product, truScoreResult)
      : (truScoreResult.analysis ?? null);
  if (analysis) {
    powershellLogger.truScoreAnalysis(analysis);
  }

  return {
    ...product,
    trust_score: truScore,
    trust_score_breakdown: breakdown,
    // Add v1.3 metadata for UI transparency warnings
    _truscore_metadata: {
      hasNutriScore: truScoreResult.hasNutriScore,
      hasEcoScore: truScoreResult.hasEcoScore,
      hasOrigin: truScoreResult.hasOrigin,
    },
    _truscore_analysis: analysis ?? undefined,
  };
}

/**
 * Calculate processing score (0-100)
 * Used for educational display in breakdown.processing field
 * Note: This is separate from TruScore calculation (which uses truscoreEngine.ts)
 */
function calculateProcessingScore(product: Product): number {
  let score = 50;

  // NOVA classification (1=best, 4=worst)
  if (product.nova_group === 1) return 100; // Unprocessed
  if (product.nova_group === 2) return 80; // Minimally processed
  if (product.nova_group === 3) return 50; // Processed
  if (product.nova_group === 4) return 20; // Ultra-processed

  // Additives (fewer is better)
  if (product.additives_tags) {
    const numAdditives = product.additives_tags.length;
    if (numAdditives === 0) score += 20;
    else if (numAdditives <= 3) score += 10;
    else if (numAdditives <= 5) score -= 5;
    else score -= 20;
  }

  // Ingredients list length (shorter is better, but need data)
  if (product.ingredients && product.ingredients.length > 0) {
    if (product.ingredients.length <= 5) score += 10;
    else if (product.ingredients.length <= 10) score += 5;
    else if (product.ingredients.length > 15) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate human-readable reasons for TruScore
 * Updated for TruScore v1.4 4-pillar system
 */
function generateTrustReasons(
  breakdown: TrustScoreBreakdown, 
  product: Product,
  metadata?: { hasNutriScore?: boolean; hasEcoScore?: boolean; hasOrigin?: boolean }
): string[] {
  const reasons: string[] = [];

  // Planet (Eco-Score)
  const ecoScore = calculateEcoScore(product);
  if (metadata && metadata.hasEcoScore === false) {
    reasons.push('Eco-Score not available - score based on available data only');
  }
  if (ecoScore?.grade === 'a' || ecoScore?.grade === 'b') {
    reasons.push(`Excellent Eco-Score (${ecoScore.grade.toUpperCase()}) - minimal environmental impact`);
  } else if (ecoScore?.grade === 'e' || ecoScore?.grade === 'd') {
    reasons.push(`Poor Eco-Score (${ecoScore.grade.toUpperCase()}) - significant environmental impact`);
  }

  const hasPalmOil = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('palm-oil') && !tag.toLowerCase().includes('palm-oil-free')
  );
  if (hasPalmOil) {
    reasons.push('Contains palm oil - deforestation risk');
  }

  // Ethics (certifications on product labels)
  const certifications = formatCertifications(product);
  if (certifications && certifications.length > 0) {
    const certNames = certifications.map((c) => c.name).join(', ');
    reasons.push(`Certified: ${certNames} - ethical standards`);
  }

  // Body (Nutri-Score + NOVA)
  if (metadata && metadata.hasNutriScore === false) {
    reasons.push('Nutri-Score not available - score based on available data only');
  }
  if (product.nutriscore_grade) {
    const grade = product.nutriscore_grade.toUpperCase();
    if (grade === 'A' || grade === 'B') {
      reasons.push(`Excellent Nutri-Score (${grade}) - good nutritional quality`);
    } else if (grade === 'E') {
      reasons.push(`Poor Nutri-Score (${grade}) - low nutritional quality`);
    }
  }

  // NOVA processing level
  if (product.nova_group === 1) {
    reasons.push('Unprocessed or minimally processed - NOVA Group 1');
  } else if (product.nova_group === 4) {
    reasons.push('Ultra-processed food - NOVA Group 4');
  }

  const mvpAdditives = scoreBodyMvpAdditives(product);
  if (mvpAdditives.matches.length > 0) {
    const red = mvpAdditives.matches.filter((m) => m.tier === 'red').length;
    const orange = mvpAdditives.matches.filter((m) => m.tier === 'orange').length;
    const yellow = mvpAdditives.matches.filter((m) => m.tier === 'yellow').length;
    const parts: string[] = [];
    if (red) parts.push(`${red} red-tier`);
    if (orange) parts.push(`${orange} orange-tier`);
    if (yellow) parts.push(`${yellow} yellow-tier`);
    reasons.push(
      `Food additives of concern (MVP registry): ${parts.join(', ') || String(mvpAdditives.matches.length)}`
    );
  }

  // Wave 3: use governed UK FoP MTL assessment — not raw OFF nutrient_levels.
  const governed = assessGovernedNutrientsFromProduct(product);
  if (governed.nutrients.totalSugars.level === 'high') {
    reasons.push('High sugar content');
  }
  if (governed.nutrients.sodium.level === 'high') {
    reasons.push('High sodium content');
  }

  // Open / Transparency: consumer interpretation is Score Highlights + pillar score only.
  // Legacy generateTrustReasons Open prose removed (Commit J / F8); cached historical
  // reason strings may remain in storage but have no live reader.

  return reasons;
}

