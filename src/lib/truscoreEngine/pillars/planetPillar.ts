/**
 * Planet Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Eco-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
 * - Palm oil: -8 (non-certified) or -5 (certified sustainable)
 * - Recyclable packaging: +5 (all) or +2 (some)
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { getLocalRecyclabilityStatus } from '../../../utils/packagingRecyclability';
import { logger } from '../../../utils/logger';

export interface PlanetPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    hasEcoScore: boolean;
    ecoscoreGrade?: string;
    ecoscoreValue?: number;
    palmOilPenalty: number;
    recyclableBonus: number;
  };
}

/**
 * Calculate Planet Pillar score
 * Always starts at base 15, then applies adjustments
 */
export function calculatePlanetPillar(product: Product): PlanetPillarResult {
  const adjustments: PlanetPillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const hasEcoScore = !!product.ecoscore_grade;
  const analysisTags = (product.ingredients_analysis_tags || []).filter((tag: unknown) => 
    typeof tag === 'string'
  ) as string[];
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const packagings = product.packagings || [];
  
  // Eco-Score adjustment (from base 15)
  let ecoscoreValue: number | undefined;
  if (hasEcoScore) {
    const es = product.ecoscore_grade?.toLowerCase();
    if (es) {
      const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
      ecoscoreValue = gradeMapping[es] || 15;
      const adjustment = ecoscoreValue - 15; // Adjustment from base 15
      
      if (adjustment > 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (excellent environmental impact)`,
          value: adjustment,
          type: 'positive',
        });
        score += adjustment;
      } else if (adjustment < 0) {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (poor environmental impact)`,
          value: adjustment,
          type: 'negative',
        });
        score += adjustment; // adjustment is already negative
      } else {
        adjustments.push({
          description: `Eco-Score Grade ${es.toUpperCase()} (average environmental impact)`,
          value: 0,
          type: 'neutral',
        });
      }
      
      logger.debug(`[PlanetPillar] Eco-Score grade "${es.toUpperCase()}" adjustment: ${adjustment} (from base 15)`);
    } else {
      logger.warn('[PlanetPillar] Eco-Score grade is empty/null, using baseline 15');
    }
  } else {
    adjustments.push({
      description: 'No Eco-Score available (baseline)',
      value: 0,
      type: 'neutral',
    });
    logger.debug('[PlanetPillar] No Eco-Score available, using baseline 15');
  }
  
  // Palm oil penalty
  let palmOilPenalty = 0;
  if (product.palm_oil_analysis) {
    const { containsPalmOil, isPalmOilFree, isCertifiedSustainable } = product.palm_oil_analysis;
    if (containsPalmOil && !isPalmOilFree) {
      if (isCertifiedSustainable) {
        palmOilPenalty = 5;
        adjustments.push({
          description: 'Contains palm oil (certified sustainable)',
          value: -palmOilPenalty,
          type: 'negative',
        });
      } else {
        palmOilPenalty = 8;
        adjustments.push({
          description: 'Contains palm oil (non-certified)',
          value: -palmOilPenalty,
          type: 'negative',
        });
      }
      score -= palmOilPenalty;
    }
  } else {
    // Fallback: Check tags if palm_oil_analysis doesn't exist
    const hasPalm = analysisTags.some((t: string) => t.toLowerCase().includes('palm'));
    const palmFree = [...analysisTags, ...labels].some((t: string) =>
      t.toLowerCase().includes('palm-oil-free')
    );
    if (hasPalm && !palmFree) {
      palmOilPenalty = 8;
      adjustments.push({
        description: 'Contains palm oil (non-certified, detected from tags)',
        value: -palmOilPenalty,
        type: 'negative',
      });
      score -= palmOilPenalty;
    }
  }
  
  // Recyclable packaging bonus
  let recyclableBonus = 0;
  if (packagings.length > 0) {
    const recyclabilityStatus = getLocalRecyclabilityStatus(packagings);
    
    if (recyclabilityStatus.isRecyclable) {
      if (recyclabilityStatus.recyclableItems.length === packagings.length) {
        recyclableBonus = 5;
        adjustments.push({
          description: 'All packaging recyclable (meets local requirements)',
          value: recyclableBonus,
          type: 'positive',
        });
        score += recyclableBonus;
      } else if (recyclabilityStatus.recyclableItems.length > 0) {
        recyclableBonus = 2;
        adjustments.push({
          description: 'Some packaging recyclable (meets local requirements)',
          value: recyclableBonus,
          type: 'positive',
        });
        score += recyclableBonus;
      }
    }
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return {
    score,
    base,
    adjustments,
    details: {
      hasEcoScore,
      ecoscoreGrade: product.ecoscore_grade,
      ecoscoreValue,
      palmOilPenalty,
      recyclableBonus,
    },
  };
}

