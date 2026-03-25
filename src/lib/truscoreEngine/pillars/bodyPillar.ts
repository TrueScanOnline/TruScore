/**
 * Body Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Nutri-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
 * - Additives: IARC hybrid system (IARC when available, safety rating fallback)
 *   - IARC Class 1: -10, Class 2A: -5, Class 2B: -3
 *   - Non-IARC: Avoid=-3, Caution=-1, Safe=0 (food) or -0.5 (non-food)
 *   - Cap: -15 total (IARC + irritants + non-IARC additives)
 * - Risky tags: -4 each (carcinogenic, endocrine, irritant, EWG high-hazard)
 * - Universal irritants: -5 each (e.g., phthalates, parabens)
 * - NOVA: 1=+3, 2=+1, 3=−1, 4=−6 (processing penalties capped; see implementation)
 * - EWG: A=+5, B=+2, C=0, D=-3, F=-5 (household products only, cap -10)
 * 
 * Final: Capped at 2-25 (minimum floor of 2)
 */

import { Product } from '../../../types/product';
import { getAdditiveInfo } from '../../../services/additiveDatabase';
import { getUserCountryCode } from '../../../utils/countryDetection';
import { getCountrySpecificAdditivePenalty } from '../../../services/countrySpecificRegulations';
import { detectProductCategory } from '../productCategoryDetection';
import { logger } from '../../../utils/logger';
import { matchIngredientsAgainstIARC, getIARCPenalty } from '../../../utils/ingredientMatcher';
import { powershellLogger } from '../../../utils/powershellLogger';

const IRRITANTS = ['paraben', 'phthalate', 'sulfate', 'triclosan', 'formaldehyde', 'peg', 'silicone', 'phenoxyethanol'];

export interface BodyPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    hasNutriScore: boolean;
    nutriscoreGrade?: string;
    nutriscoreValue?: number;
    additivePenalty: number;
    universalIrritantPenalty: number;
    novaAdjustment: number;
    ewgAdjustment: number;
  };
}

/**
 * Calculate Body Pillar score
 * Always starts at base 15, then applies adjustments
 */
export function calculateBodyPillar(product: Product): BodyPillarResult {
  const adjustments: BodyPillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const hasNutriScore = !!product.nutriscore_grade;
  const text = (product.ingredients_text || '').toLowerCase();
  const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
    typeof tag === 'string'
  ) as string[];
  
  // Helper: word boundary matching
  const hasTerm = (term: string): boolean => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
  };
  
  // Nutri-Score adjustment (from base 15)
  // NEW SPEC: A=+7 (total 22), B=+3 (18), C=0 (15), D=-3 (12), E=-7 (8)
  let nutriscoreValue: number | undefined;
  if (hasNutriScore) {
    const ns = product.nutriscore_grade?.toLowerCase();
    if (ns) {
      // Updated mapping: A=22, B=18, C=15, D=12, E=8
      const gradeMapping: Record<string, number> = { a: 22, b: 18, c: 15, d: 12, e: 8 };
      nutriscoreValue = gradeMapping[ns] || 15;
      const adjustment = nutriscoreValue - 15; // Adjustment from base 15
      
      if (adjustment > 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${ns.toUpperCase()} (excellent nutrition)`,
          value: adjustment,
          type: 'positive',
        });
        score += adjustment;
      } else if (adjustment < 0) {
        adjustments.push({
          description: `Nutri-Score Grade ${ns.toUpperCase()} (poor nutrition)`,
          value: adjustment,
          type: 'negative',
        });
        score += adjustment; // adjustment is already negative
      } else {
        adjustments.push({
          description: `Nutri-Score Grade ${ns.toUpperCase()} (average nutrition)`,
          value: 0,
          type: 'neutral',
        });
      }
      
      logger.debug(`[BodyPillar] Nutri-Score grade "${ns.toUpperCase()}" adjustment: ${adjustment} (from base 15)`);
    } else {
      logger.warn('[BodyPillar] Nutri-Score grade is empty/null, using baseline 15');
    }
  } else {
    adjustments.push({
      description: 'No Nutri-Score available (baseline)',
      value: 0,
      type: 'neutral',
    });
    logger.debug('[BodyPillar] No Nutri-Score available, using baseline 15');
  }
  
  // Additive penalties - IARC Hybrid System
  // Priority: IARC classification > Safety rating
  let additivePenalty = 0;
  const userCountry = getUserCountryCode();
  const productCategory = detectProductCategory(product);
  const shouldAdjustAdditiveScoring = productCategory !== 'food';
  
  if (product.additives_tags && product.additives_tags.length > 0) {
    for (const tag of product.additives_tags) {
      const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
      const eNum = eNumMatch ? eNumMatch[1] : tag.toLowerCase().replace(/^en:/, '');
      
      const additiveInfo = getAdditiveInfo(eNum);
      let basePenalty = 0;
      
      if (additiveInfo) {
        // IARC Hybrid System: Use IARC when available, otherwise use safety rating
        if (additiveInfo.iarcGroup) {
          // IARC classification takes priority
          if (additiveInfo.iarcGroup === '1') {
            basePenalty = 10; // IARC Class 1: Carcinogenic to humans
          } else if (additiveInfo.iarcGroup === '2A') {
            basePenalty = 5; // IARC Class 2A: Probably carcinogenic
          } else if (additiveInfo.iarcGroup === '2B') {
            basePenalty = 3; // IARC Class 2B: Possibly carcinogenic
          }
        } else {
          // Fallback to safety rating when IARC not available
          if (additiveInfo.safety === 'avoid') {
            basePenalty = 3;
          } else if (additiveInfo.safety === 'caution') {
            basePenalty = 1;
          } else if (additiveInfo.safety === 'safe') {
            basePenalty = shouldAdjustAdditiveScoring ? 0 : 0;
          } else {
            basePenalty = 1;
          }
        }
      } else {
        // Unknown additive - no penalty (ID 6: only penalize confirmed classifications)
        basePenalty = 0;
      }
      
      const countryPenalty = getCountrySpecificAdditivePenalty(eNum, userCountry);
      additivePenalty += basePenalty + countryPenalty;
    }
  }
  
  // Universal irritants penalty (-5 each, e.g., phthalates, parabens)
  // Check for high-risk universal irritants in ingredients text
  const universalIrritants = ['phthalate', 'paraben', 'bpa', 'pfas'];
  const irritantCount = universalIrritants.filter((i) => hasTerm(i)).length;
  let universalIrritantPenalty = irritantCount * 5;
  
  // Total additive + irritant penalty (cap at -15)
  const totalAdditivePenalty = additivePenalty + universalIrritantPenalty;
  const cappedPenalty = Math.min(totalAdditivePenalty, 15);
  
  if (cappedPenalty > 0) {
    const penaltyDescription = additivePenalty > 0 && universalIrritantPenalty > 0
      ? `${product.additives_tags?.length || 0} additive(s) + ${irritantCount} universal irritant(s) (IARC hybrid system)`
      : additivePenalty > 0
      ? `${product.additives_tags?.length || 0} additive(s) (IARC hybrid system)`
      : `${irritantCount} universal irritant(s)`;
    
    adjustments.push({
      description: penaltyDescription,
      value: -cappedPenalty,
      type: 'negative',
    });
    score -= cappedPenalty;
  }
  
  // Risky tags penalty REMOVED (ID 2: Duplicative with IARC and Safety penalties)
  // Previously: -4 per risky tag (carcinogenic, endocrine, irritant, EWG high-hazard)
  // This was duplicative since these are already covered by:
  // - IARC ingredient penalties (carcinogenic)
  // - Universal irritants penalty (irritant)
  // - Safety rating penalties (endocrine)
  
  // IARC Ingredient Checking (comprehensive database)
  // Check ALL ingredients against IARC database (1,055 agents)
  let iarcIngredientPenalty = 0;
  const iarcMatchedAgents: string[] = [];
  
  if (product.ingredients_text) {
    try {
      const matchedAgents = matchIngredientsAgainstIARC(product.ingredients_text);
      
      // Deduplicate: Skip if already penalized via E-number
      const alreadyPenalized = new Set<string>();
      if (product.additives_tags) {
        for (const tag of product.additives_tags) {
          const eNumMatch = tag.toLowerCase().match(/^en:?(e\d+[a-z]?)$/);
          if (eNumMatch) {
            const eNum = eNumMatch[1];
            const additiveInfo = getAdditiveInfo(eNum);
            if (additiveInfo?.iarcGroup) {
              // This additive already has IARC penalty, mark as penalized
              alreadyPenalized.add(additiveInfo.name.toLowerCase());
            }
          }
        }
      }
      
      // Apply penalties for IARC-classified ingredients (only high confidence matches)
      for (const agent of matchedAgents) {
        // Skip if already penalized via E-number
        if (alreadyPenalized.has(agent.agent.toLowerCase())) {
          continue;
        }
        
        // Only apply penalties for high confidence matches (exact or high)
        if (agent.confidence === 'exact' || agent.confidence === 'high') {
          const penalty = getIARCPenalty(agent);
          if (penalty > 0) {
            iarcIngredientPenalty += penalty;
            iarcMatchedAgents.push(`${agent.agent} (IARC Group ${agent.group})`);
          }
        }
      }
      
      // Cap IARC ingredient penalties at -10 (similar to NOVA cap)
      iarcIngredientPenalty = Math.min(iarcIngredientPenalty, 10);
      
      if (iarcIngredientPenalty > 0 && iarcMatchedAgents.length > 0) {
        adjustments.push({
          description: `IARC-classified ingredient(s): ${iarcMatchedAgents.slice(0, 3).join(', ')}${iarcMatchedAgents.length > 3 ? ` (+${iarcMatchedAgents.length - 3} more)` : ''}`,
          value: -iarcIngredientPenalty,
          type: 'negative',
        });
        score -= iarcIngredientPenalty;
      }
    } catch (error) {
      logger.debug('[BodyPillar] Error checking IARC ingredients:', error);
      // Continue without IARC ingredient checking if there's an error
    }
  }
  
  // EWG Skin Deep enhancement (household products only)
  // New spec: A=+5, B=+2, C=0, D=-3, F=-5 (cap -10)
  const ewgData = (product as any).ewg_skin_deep;
  const isHousehold = productCategory === 'household' || productCategory === 'cosmetics';
  let ewgAdjustment = 0;
  let ewgRating: 'A' | 'B' | 'C' | 'D' | 'F' | undefined;
  
  if (ewgData && isHousehold) {
    // Map hazard score to letter grade (estimated mapping)
    // A (0-2): Excellent, B (2-4): Good, C (4-6): Moderate, D (6-8): Poor, F (8-10): Very Poor
    const hazardScore = ewgData.hazardScore || 0;
    let ewgRating: 'A' | 'B' | 'C' | 'D' | 'F' | undefined;
    
    if (hazardScore <= 2) {
      ewgRating = 'A';
      ewgAdjustment = 5; // +5
    } else if (hazardScore <= 4) {
      ewgRating = 'B';
      ewgAdjustment = 2; // +2
    } else if (hazardScore <= 6) {
      ewgRating = 'C';
      ewgAdjustment = 0; // 0
    } else if (hazardScore <= 8) {
      ewgRating = 'D';
      ewgAdjustment = -3; // -3
    } else {
      ewgRating = 'F';
      ewgAdjustment = -5; // -5
    }
    
    // Cap EWG penalties at -10
    const cappedEwgAdjustment = Math.max(ewgAdjustment, -10);
    
    if (cappedEwgAdjustment !== 0) {
      adjustments.push({
        description: `EWG rating ${ewgRating} (hazard score: ${hazardScore})`,
        value: cappedEwgAdjustment,
        type: cappedEwgAdjustment > 0 ? 'positive' : 'negative',
      });
      score += cappedEwgAdjustment;
    }
  }
  
  // Note: Universal irritants (phthalates, parabens) are now handled in additive penalty section above
  // Note: Fragrance penalty moved to Open Pillar (transparency issue, not body safety)
  
  // NOVA adjustments (with cap of -10 total processing penalties)
  // NEW SPEC: 1=+3, 2=+1, 3=-1, 4=-6 (cap -10 total processing penalties)
  const nova = product.nova_group;
  let novaAdjustment = 0;
  let totalProcessingPenalties = 0;
  
  if (nova === 1) {
    novaAdjustment = 3;
    adjustments.push({
      description: 'NOVA Group 1 (unprocessed)',
      value: novaAdjustment,
      type: 'positive',
    });
    score += novaAdjustment;
  } else if (nova === 2) {
    novaAdjustment = 1;
    adjustments.push({
      description: 'NOVA Group 2 (processed culinary ingredients)',
      value: novaAdjustment,
      type: 'positive',
    });
    score += novaAdjustment;
  } else if (nova === 3) {
    novaAdjustment = -1;
    totalProcessingPenalties = 1;
    adjustments.push({
      description: 'NOVA Group 3 (processed)',
      value: novaAdjustment,
      type: 'negative',
    });
  } else if (nova === 4) {
    novaAdjustment = -6;
    totalProcessingPenalties = 6;
    adjustments.push({
      description: 'NOVA Group 4 (ultra-processed)',
      value: novaAdjustment,
      type: 'negative',
    });
  }
  
  // Cap total processing penalties at -10
  const cappedProcessingPenalty = Math.min(totalProcessingPenalties, 10);
  if (cappedProcessingPenalty > 0) {
    score -= cappedProcessingPenalty;
    if (totalProcessingPenalties > 10) {
      logger.debug(`[BodyPillar] Processing penalties capped at -10 (total was -${totalProcessingPenalties})`);
    }
  }
  
  // Cap at 2-25 (minimum floor of 2 per new specification)
  score = Math.max(2, Math.min(25, Math.round(score)));

  const result: BodyPillarResult = {
    score,
    base,
    adjustments,
    details: {
      hasNutriScore,
      nutriscoreGrade: product.nutriscore_grade,
      nutriscoreValue,
      additivePenalty: Math.min(additivePenalty, 15),
      universalIrritantPenalty: universalIrritantPenalty,
      novaAdjustment,
      ewgAdjustment: ewgAdjustment,
    },
  };

  // PowerShell logging for Body Pillar
  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Body',
    base,
    score,
    adjustments.map(adj => ({
      ...adj,
      dataSource: adj.description.includes('Nutri-Score') ? 'OFF' : undefined,
    })),
    result.details
  );

  return result;
}

