// TruScore calculation
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { extractManufacturingCountry, calculateEcoScore, formatCertifications } from '../services/openFoodFacts';
import { calculateTruScore, buildTruScoreAnalysis } from '../lib/truscoreEngine';
import { countOpenPillarHiddenTermHits } from '../lib/truscoreEngine/pillars/openPillarHiddenTerms';
import { getCachedTruScore, cacheTruScore } from './truScoreCache';
import { logger } from './logger';
import { powershellLogger } from './powershellLogger';

/**
 * Check if we have sufficient real data to calculate a meaningful TruScore
 * Only products from Open Food Facts or with comprehensive data should get scores
 */
function hasSufficientDataForTrustScore(product: Product): boolean {
  // If source is Open Food Facts, we have real data
  if (product.source === 'openfoodfacts') {
    return true;
  }
  
  // SQLite products are cached products - they have real data (even if minimal)
  if (product.source === 'sqlite') {
    return true;
  }
  
  // If it's a web search result with low quality/completion, don't show score
  if (product.source === 'web_search') {
    const hasRealData = Boolean(
      product.quality && product.quality >= 50 && 
      product.completion && product.completion >= 50 &&
      (product.image_url || product.nutriments || product.ingredients_text)
    );
    return hasRealData;
  }
  
  // For other sources (upcitemdb, barcodespider), check if we have meaningful data
  const hasRealData = Boolean(
    product.product_name && !product.product_name.startsWith('Product ') &&
    (product.image_url || product.nutriments || product.ingredients_text || 
     product.brands || product.origins || product.manufacturing_places)
  );
  
  return hasRealData;
}

/**
 * Calculate overall TruScore (0-100) based on multiple factors
 * Only calculates score if we have sufficient real data
 * 
 * Note: This is a wrapper function that calls calculateTruScore from truscoreEngine.ts
 * The function name uses "TrustScore" for backward compatibility with ProductWithTrustScore type
 * 
 * Now includes caching to avoid recalculation
 */
export async function calculateTrustScore(product: Product): Promise<ProductWithTrustScore> {
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

  // Check cache first
  const cachedTruScore = await getCachedTruScore(product.barcode);
  let truScoreResult;

  if (cachedTruScore) {
    truScoreResult = cachedTruScore;
    logger.debug('[TruScore] Cache hit (skipping full pillar logs)', {
      barcode: product.barcode,
      truscore: truScoreResult.truscore,
      breakdown: truScoreResult.breakdown,
    });
    powershellLogger.log('INFO', 'TRUSCORE_CACHE', `TruScore from cache: ${truScoreResult.truscore}`, {
      barcode: product.barcode,
      breakdown: truScoreResult.breakdown,
      isCached: true,
    });
  } else {
    // TruScore v1.4: 4 equal pillars (25 points each = 100 total)
    // 100% based on recognized public systems (Nutri-Score, Eco-Score, NOVA, OFF labels)
    // Use v1.4 scoring engine (truscoreEngine.ts) - matches UI component
    logger.debug('[TruScore] Calculating fresh TruScore (not cached):', {
      barcode: product.barcode,
      hasNutriScore: !!product.nutriscore_grade,
      nutriscore_grade: product.nutriscore_grade,
      hasEcoScore: !!product.ecoscore_grade,
      ecoscore_grade: product.ecoscore_grade,
    });
    truScoreResult = calculateTruScore(product);
    
    // Cache the result
    await cacheTruScore(product.barcode, truScoreResult);
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

  // Risky additives
  const highRiskAdditives = ['en:e102', 'en:e104', 'en:e110', 'en:e122', 'en:e124', 'en:e129', 
                             'en:e211', 'en:e250', 'en:e251', 'en:e621', 'en:e951', 'en:e952'];
  const highRiskCount = product.additives_tags?.filter(tag =>
    highRiskAdditives.some(risk => tag.toLowerCase().includes(risk))
  ).length || 0;
  
  if (highRiskCount > 0) {
    reasons.push(`Contains ${highRiskCount} high-risk additive(s)`);
  }

  const nutrientLevels = product.nutrient_levels || {};
  if (nutrientLevels.sugars === 'high') {
    reasons.push('High sugar content');
  }
  if (nutrientLevels.salt === 'high') {
    reasons.push('High salt content');
  }

  // Open (Ingredient transparency — v14 hidden-term count)
  const ingredientsText = (product.ingredients_text || '').trim();
  const hiddenCount = countOpenPillarHiddenTermHits(ingredientsText);

  if (hiddenCount >= 3) {
    reasons.push('Multiple hidden ingredients - low transparency');
  } else if (hiddenCount >= 1) {
    reasons.push('Contains hidden ingredients - reduced transparency');
  } else if (!ingredientsText || ingredientsText.length < 10) {
    reasons.push('No ingredient list available - very low transparency');
  } else if (hiddenCount === 0 && ingredientsText.length > 10) {
    reasons.push('Full ingredient disclosure - high transparency');
  }

  return reasons;
}

