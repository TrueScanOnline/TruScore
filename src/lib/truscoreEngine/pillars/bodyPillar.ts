/**
 * Body Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Nutri-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
 * - Additives: Weighted by safety (safe: -0.5, caution: -1.5, avoid: -3, cap -15)
 * - Risky tags: -4 each (carcinogenic, endocrine, irritant, EWG high-hazard)
 * - Irritants: -10
 * - Fragrance: -10
 * - NOVA: 1=+3, 2=0, 3=-3, 4=-8
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { getAdditiveInfo } from '../../../services/additiveDatabase';
import { getUserCountryCode } from '../../../utils/countryDetection';
import { getCountrySpecificAdditivePenalty } from '../../../services/countrySpecificRegulations';
import { detectProductCategory } from '../productCategoryDetection';
import { logger } from '../../../utils/logger';

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
    riskyTagsPenalty: number;
    irritantPenalty: number;
    fragrancePenalty: number;
    novaAdjustment: number;
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
  let nutriscoreValue: number | undefined;
  if (hasNutriScore) {
    const ns = product.nutriscore_grade?.toLowerCase();
    if (ns) {
      const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
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
  
  // Additive penalties
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
        if (additiveInfo.safety === 'avoid') {
          basePenalty = 3;
        } else if (additiveInfo.safety === 'caution') {
          basePenalty = 1.5;
        } else if (additiveInfo.safety === 'safe') {
          basePenalty = shouldAdjustAdditiveScoring ? 0 : 0.5;
        } else {
          basePenalty = 1.5;
        }
      } else {
        basePenalty = shouldAdjustAdditiveScoring ? 0.75 : 1.5;
      }
      
      const countryPenalty = getCountrySpecificAdditivePenalty(eNum, userCountry);
      additivePenalty += basePenalty + countryPenalty;
    }
    
    const cappedPenalty = Math.min(additivePenalty, 15);
    if (cappedPenalty > 0) {
      adjustments.push({
        description: `${product.additives_tags.length} additive(s) (weighted by safety rating)`,
        value: -cappedPenalty,
        type: 'negative',
      });
      score -= cappedPenalty;
    }
  }
  
  // Risky tags
  const riskyCount = analysisTags.filter((t: string) =>
    ['carcinogenic', 'endocrine', 'irritant', 'ewg-high-hazard'].some((x) =>
      t.toLowerCase().includes(x)
    )
  ).length;
  const riskyTagsPenalty = riskyCount * 4;
  if (riskyTagsPenalty > 0) {
    adjustments.push({
      description: `${riskyCount} risky tag(s) (carcinogenic, endocrine, irritant, EWG high-hazard)`,
      value: -riskyTagsPenalty,
      type: 'negative',
    });
    score -= riskyTagsPenalty;
  }
  
  // EWG Skin Deep enhancement
  const ewgData = (product as any).ewg_skin_deep;
  let ewgPenalty = 0;
  if (ewgData && ewgData.hazardScore) {
    if (ewgData.hazardScore >= 7) {
      ewgPenalty = 5;
    } else if (ewgData.hazardScore >= 4) {
      ewgPenalty = 3;
    } else if (ewgData.hazardScore >= 1) {
      ewgPenalty = 1;
    }
    if (ewgPenalty > 0) {
      adjustments.push({
        description: `EWG high-hazard cosmetic (hazard score: ${ewgData.hazardScore})`,
        value: -ewgPenalty,
        type: 'negative',
      });
      score -= ewgPenalty;
    }
  }
  
  // Irritants
  const hasIrritants = IRRITANTS.some((i) => hasTerm(i));
  const irritantPenalty = hasIrritants ? 10 : 0;
  if (irritantPenalty > 0) {
    adjustments.push({
      description: 'Contains irritants (paraben, phthalate, sulfate, etc.)',
      value: -irritantPenalty,
      type: 'negative',
    });
    score -= irritantPenalty;
  }
  
  // Fragrance
  const hasFragrance = ['parfum', 'fragrance', 'aroma'].some((a) => hasTerm(a));
  const fragrancePenalty = hasFragrance ? 10 : 0;
  if (fragrancePenalty > 0) {
    adjustments.push({
      description: 'Contains fragrance/parfum',
      value: -fragrancePenalty,
      type: 'negative',
    });
    score -= fragrancePenalty;
  }
  
  // NOVA adjustments
  const nova = product.nova_group;
  let novaAdjustment = 0;
  if (nova === 1) {
    novaAdjustment = 3;
    adjustments.push({
      description: 'NOVA Group 1 (unprocessed)',
      value: novaAdjustment,
      type: 'positive',
    });
    score += novaAdjustment;
  } else if (nova === 2) {
    // No adjustment for NOVA 2
  } else if (nova === 3) {
    novaAdjustment = -3;
    adjustments.push({
      description: 'NOVA Group 3 (processed)',
      value: novaAdjustment,
      type: 'negative',
    });
    score += novaAdjustment; // Already negative
  } else if (nova === 4) {
    novaAdjustment = -8;
    adjustments.push({
      description: 'NOVA Group 4 (ultra-processed)',
      value: novaAdjustment,
      type: 'negative',
    });
    score += novaAdjustment; // Already negative
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return {
    score,
    base,
    adjustments,
    details: {
      hasNutriScore,
      nutriscoreGrade: product.nutriscore_grade,
      nutriscoreValue,
      additivePenalty: Math.min(additivePenalty, 15),
      riskyTagsPenalty,
      irritantPenalty,
      fragrancePenalty,
      novaAdjustment,
    },
  };
}

