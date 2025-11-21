// Trust score calculation
import { Product, ProductWithTrustScore, TrustScoreBreakdown } from '../types/product';
import { extractManufacturingCountry, calculateEcoScore, formatCertifications } from '../services/openFoodFacts';
import { calculateTruScore } from '../lib/scoringEngine';

/**
 * Check if we have sufficient real data to calculate a meaningful Trust Score
 * Only products from Open Food Facts or with comprehensive data should get scores
 */
function hasSufficientDataForTrustScore(product: Product): boolean {
  // If source is Open Food Facts, we have real data
  if (product.source === 'openfoodfacts') {
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
 * Calculate overall trust score (0-100) based on multiple factors
 * Only calculates score if we have sufficient real data
 */
export function calculateTrustScore(product: Product): ProductWithTrustScore {
  // Check if we have sufficient data for a meaningful Trust Score
  const hasRealData = hasSufficientDataForTrustScore(product);
  
  if (!hasRealData) {
    // Return product without Trust Score (marked as insufficient data)
    return {
      ...product,
      trust_score: null,
      trust_score_breakdown: null,
    };
  }

  // TruScore v1.3: 4 equal pillars (25 points each = 100 total)
  // 100% based on recognized public systems (Nutri-Score, Eco-Score, NOVA, OFF labels)
  // Use v1.3 scoring engine
  const truScoreResult = calculateTruScore(product, product.source || 'unknown');
  
  const body = truScoreResult.breakdown.Body;
  const planet = truScoreResult.breakdown.Planet;
  const care = truScoreResult.breakdown.Care;
  const open = truScoreResult.breakdown.Open;

  const breakdown: TrustScoreBreakdown = {
    body,
    planet,
    care,
    open,
    // Legacy fields (for backward compatibility and display)
    sustainability: (planet / 25) * 100, // Convert to 0-100 for compatibility
    ethics: (care / 25) * 100,
    bodySafety: (body / 25) * 100,
    processing: calculateProcessingScore(product), // Still calculated for educational display
    transparency: (open / 25) * 100,
    reasons: [],
  };

  // TruScore: Sum of 4 equal pillars (0-100 total)
  // Each pillar is 25 points maximum
  const truScore = truScoreResult.truscore;

  // Generate reasons (use v1.3 metadata)
  breakdown.reasons = generateTrustReasons(breakdown, product, {
    hasNutriScore: truScoreResult.hasNutriScore,
    hasEcoScore: truScoreResult.hasEcoScore,
    hasOrigin: truScoreResult.hasOrigin,
  });

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
  };
}

/**
 * Calculate Planet score (0-25) - TruScore Pillar #2
 * Based on Eco-Score (official French system) + packaging + palm oil
 */
function calculatePlanetScore(product: Product): number {
  const ecoScore = calculateEcoScore(product);

  // Eco-Score grade conversion (A=25, B=20, C=15, D=10, E=5, unknown=12)
  // Direct conversion from recognized public system
  const gradeScores: Record<string, number> = {
    'a': 25,
    'b': 20,
    'c': 15,
    'd': 10,
    'e': 5,
    'unknown': 12,
  };
  let score = ecoScore?.grade ? (gradeScores[ecoScore.grade.toLowerCase()] || 12) : 12;

  // Palm oil / deforestation risk
  const hasPalmOil = product.ingredients_analysis_tags?.some(tag => 
    tag.toLowerCase().includes('palm-oil') && !tag.toLowerCase().includes('palm-oil-free')
  );
  if (hasPalmOil) {
    score -= 8; // Non-sustainable palm oil = major deforestation risk
  }

  // Packaging recyclability (bonus for fully recyclable)
  const packagings = product.packagings || [];
  if (packagings.length > 0) {
    const recyclable = packagings.filter(p => 
      p.recycling === 'recycle' || p.recycling === 'widely recycled'
    ).length;
    
    if (recyclable === packagings.length) {
      score += 5; // All packaging recyclable = bonus
    } else if (recyclable > 0) {
      score += 2; // Some packaging recyclable = small bonus
    }
  } else if (product.packaging_tags) {
    // Fallback to packaging_tags if packagings array not available
    const hasRecyclable = product.packaging_tags.some(tag => 
      tag.toLowerCase().includes('recyclable')
    );
    if (hasRecyclable) {
      score += 5; // Recyclable packaging = bonus
    }
  }

  return Math.max(0, Math.min(25, Math.round(score)));
}

/**
 * Calculate Care score (0-25) - TruScore Pillar #3
 * Based on ethical & welfare certifications (Fairtrade, Organic, MSC, etc.)
 * Explicit bonus structure: Fairtrade +8, EU Organic +7, MSC +6, etc.
 */
function calculateCareScore(product: Product): number {
  let score = 0; // Start at 0, build up with certifications

  // Extract labels from labels_tags (Open Food Facts format)
  const labels = (product.labels_tags || []).map(l => l.toLowerCase());
  
  // Explicit bonus structure (can stack up to +25)
  const labelBonuses: Record<string, number> = {
    'en:fair-trade': 8,           // Fairtrade = major ethical bonus
    'en:eu-organic': 7,           // EU Organic = high ethical standard
    'en:organic': 7,              // Organic (general)
    'en:rainforest-alliance': 6,  // Rainforest Alliance = strong certification
    'en:msc': 6,                  // Marine Stewardship Council = sustainable fishing
    'en:asc': 6,                  // Aquaculture Stewardship Council = sustainable aquaculture
    'en:rspca-assured': 5,        // RSPCA Assured = animal welfare
    'en:cage-free': 4,            // Cage-free = animal welfare
    'en:free-range': 4,           // Free-range = animal welfare
    'en:grass-fed': 4,            // Grass-fed = animal welfare
    'en:utz': 3,                  // UTZ = sustainable farming
    'en:fair-for-life': 3,        // Fair for Life = ethical trade
  };

  // Apply bonuses for each label
  for (const label of labels) {
    for (const [key, bonus] of Object.entries(labelBonuses)) {
      if (label.includes(key)) {
        score += bonus;
        break; // Only count each label once
      }
    }
  }

  // Known cruelty/exploitation brand penalty (simple internal list)
  // These are parent companies known for poor ethical practices
  const crueltyBrands = [
    'nestle', 'unilever', 'procter & gamble', 'l\'oreal', 
    'mars', 'mondelez', 'kraft heinz', 'coca-cola', 'pepsico'
  ];
  
  const brandName = (product.brands || '').toLowerCase();
  const isCrueltyBrand = crueltyBrands.some(cruel => brandName.includes(cruel));
  
  if (isCrueltyBrand) {
    score -= 10; // Known cruelty brand = major penalty
  }

  // Cap at 25 (maximum)
  return Math.max(0, Math.min(25, score));
}

/**
 * Calculate Body score (0-25) - TruScore Pillar #1
 * Based on Nutri-Score (official EU system) + NOVA + additives + allergens
 */
function calculateBodyScore(product: Product): number {
  // Primary: Use Nutri-Score if available (recognized standard)
  // Direct conversion: A=25, B=20, C=15, D=10, E=5, missing=12
  if (product.nutriscore_grade) {
    const gradeScores: Record<string, number> = {
      'a': 25,
      'b': 20,
      'c': 15,
      'd': 10,
      'e': 5,
      'unknown': 12,
    };
    
    let score = gradeScores[product.nutriscore_grade.toLowerCase()] || 12;
    
    // NOVA ultra-processing (São Paulo University system - now merged into Body)
    // NOVA 1 = +3, NOVA 3 = -3, NOVA 4 = -8
    if (product.nova_group === 1) {
      score += 3; // Unprocessed or minimally processed = bonus
    } else if (product.nova_group === 3) {
      score -= 3; // Processed = penalty
    } else if (product.nova_group === 4) {
      score -= 8; // Ultra-processed = major penalty
    }
    
    // Risky additives / contaminants (OFF analysis)
    // High-risk additives (EFSA/EWG flagged) - penalty of -3 to -10
    if (product.additives_tags && product.additives_tags.length > 0) {
      const highRiskAdditives = ['en:e102', 'en:e104', 'en:e110', 'en:e122', 'en:e124', 'en:e129', 
                                 'en:e211', 'en:e250', 'en:e251', 'en:e621', 'en:e951', 'en:e952'];
      const highRiskCount = product.additives_tags.filter(tag => 
        highRiskAdditives.some(risk => tag.toLowerCase().includes(risk))
      ).length;
      
      // Also check ingredients_analysis_tags for risk indicators
      const riskyIngredients = product.ingredients_analysis_tags?.filter(tag =>
        tag.toLowerCase().includes('palm') || 
        tag.toLowerCase().includes('risk') || 
        tag.toLowerCase().includes('carcinogenic')
      ).length || 0;
      
      // Deduct up to -10 points for risky additives and ingredients
      const additivePenalty = Math.min(10, (highRiskCount * 2) + (riskyIngredients * 3));
      score -= additivePenalty;
    }
    
    // Allergens & irritants (deduct up to -5)
    if (product.allergens_tags && product.allergens_tags.length > 0) {
      score -= Math.min(5, product.allergens_tags.length * 1);
    }
    
    // Cosmetics/household irritants (parfum, fragrance, phthalate, paraben)
    const ingredientsText = (product.ingredients_text || '').toLowerCase();
    const irritants = ['parfum', 'fragrance', 'phthalate', 'paraben'];
    const hasIrritants = irritants.some(irritant => ingredientsText.includes(irritant));
    if (hasIrritants) {
      score -= 5;
    }
    
    return Math.max(0, Math.min(25, Math.round(score)));
  }
  
  // Fallback: If no Nutri-Score, use basic nutrition data (less reliable)
  // Base score of 12 (equivalent to "unknown" Nutri-Score)
  let score = 12;
  
  if (!product.nutriments) {
    return Math.max(0, score); // No nutrition data = base score only
  }

  // Basic nutrition-based scoring (simple fallback)
  const nutrientLevels = product.nutrient_levels || {};
  
  // Good nutrition indicators (small bonuses)
  if (nutrientLevels.fat === 'low') score += 2;
  if (nutrientLevels.saturated_fat === 'low') score += 2;
  if (nutrientLevels.sugars === 'low') score += 2;
  if (nutrientLevels.salt === 'low') score += 2;
  
  // Poor nutrition indicators (penalties)
  if (nutrientLevels.fat === 'high') score -= 3;
  if (nutrientLevels.saturated_fat === 'high') score -= 3;
  if (nutrientLevels.sugars === 'high') score -= 3;
  if (nutrientLevels.salt === 'high') score -= 3;
  
  // NOVA adjustment (if available)
  if (product.nova_group === 1) {
    score += 3;
  } else if (product.nova_group === 4) {
    score -= 8;
  }

  return Math.max(0, Math.min(25, Math.round(score)));
}

/**
 * Calculate processing score (0-100)
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
 * Calculate Open score (0-25) - TruScore Pillar #4
 * Based on ingredient disclosure transparency (hidden terms detection)
 * Detects generic terms like "parfum", "fragrance", "natural flavor", "proprietary blend"
 */
function calculateOpenScore(product: Product): number {
  let score = 25; // Start with perfect score (full transparency)

  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  
  // Check for hidden terms (generic ingredient descriptors)
  const hiddenTerms = [
    'parfum', 'fragrance', 'aroma', 'flavor', 'flavour',
    'natural flavor', 'natural flavour', 
    'artificial flavor', 'artificial flavour',
    'proprietary blend', 'natural flavoring', 'artificial flavoring'
  ];
  
  const hiddenCount = hiddenTerms.filter(term => 
    ingredientsText.includes(term)
  ).length;
  
  // Deduct points for hidden terms
  if (hiddenCount >= 3) {
    score -= 20; // Multiple hidden terms = major transparency issue
  } else if (hiddenCount >= 1) {
    score -= 10; // One hidden term = moderate concern
  }
  
  // Check for ingredient list presence
  if (!ingredientsText || ingredientsText.length < 10) {
    score = 5; // No ingredient list = very poor transparency (minimum score)
  }
  
  // Check for percentage disclosure (bonus for full disclosure)
  // If ingredients list contains percentages, it's more transparent
  const hasPercentages = /%\s|\d+%/.test(ingredientsText);
  if (hasPercentages && score >= 15) {
    score = Math.min(25, score + 2); // Small bonus for percentage disclosure
  }

  return Math.max(0, Math.min(25, Math.round(score)));
}

/**
 * Legacy: Calculate transparency score (0-100) - for backward compatibility
 */
function calculateTransparencyScore(product: Product): number {
  const openScore = calculateOpenScore(product);
  // Convert 0-25 to 0-100 for compatibility
  return (openScore / 25) * 100;
}

/**
 * Legacy: Calculate sustainability score (0-100) - for backward compatibility
 */
function calculateSustainabilityScore(product: Product): number {
  const planetScore = calculatePlanetScore(product);
  // Convert 0-25 to 0-100 for compatibility
  return (planetScore / 25) * 100;
}

/**
 * Legacy: Calculate ethics score (0-100) - for backward compatibility
 */
function calculateEthicsScore(product: Product): number {
  const careScore = calculateCareScore(product);
  // Convert 0-25 to 0-100 for compatibility
  return (careScore / 25) * 100;
}

/**
 * Legacy: Calculate Body Safety score (0-100) - for backward compatibility
 */
function calculateBodySafetyScore(product: Product): number {
  const bodyScore = calculateBodyScore(product);
  // Convert 0-25 to 0-100 for compatibility
  return (bodyScore / 25) * 100;
}

/**
 * Generate human-readable reasons for trust score
 * Updated for TruScore v1.3 4-pillar system
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

  // Care (Certifications)
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

  // Open (Ingredient transparency)
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  const hiddenTerms = ['parfum', 'fragrance', 'aroma', 'natural flavor', 'proprietary blend'];
  const hiddenCount = hiddenTerms.filter(term => ingredientsText.includes(term)).length;
  
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

