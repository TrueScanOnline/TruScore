/**
 * Care Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Certifications: Fairtrade=+8, Organic=+7, Rainforest Alliance=+6, UTZ=+6, MSC/ASC=+6, RSPCA=+5, B-Corp=+5, Cage-Free/Free-Range=+4
 * - Certification bonus cap: +15 total
 * - Cruel parent: -15
 * - Recalls (within 12 months): -10
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { isCruelParent } from '../../../data/brandDatabase';
import { logger } from '../../../utils/logger';

export interface CarePillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    certificationBonus: number;
    cruelParentPenalty: number;
    recallPenalty: number;
  };
}

/**
 * Calculate Care Pillar score
 * Always starts at base 15, then applies adjustments
 */
export function calculateCarePillar(product: Product): CarePillarResult {
  const adjustments: CarePillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  const brands = (product.brands || '').toLowerCase();
  
  // Helper: label matching
  const hasLabel = (pattern: string): boolean => {
    return labels.some((l: string) => l.includes(pattern.toLowerCase()));
  };
  
  // Base score note
  adjustments.push({
    description: 'Base score (assumes ethical until violations)',
    value: 0,
    type: 'neutral',
  });
  
  // Certification bonuses (stacked, cap +15)
  let certificationBonus = 0;
  
  if (hasLabel('fair-trade')) {
    certificationBonus += 8;
    adjustments.push({
      description: 'Fairtrade certification',
      value: 8,
      type: 'positive',
    });
  }
  
  // Regional Organic certifications
  const organicLabels = labels.filter((l: string) => 
    l.toLowerCase().includes('organic') || 
    l.toLowerCase().includes('usda-organic') ||
    l.toLowerCase().includes('eu-organic') ||
    l.toLowerCase().includes('bio') ||
    l.toLowerCase().includes('ecocert')
  );
  if (organicLabels.length > 0) {
    certificationBonus += 7;
    adjustments.push({
      description: 'Organic certification',
      value: 7,
      type: 'positive',
    });
  }
  
  if (hasLabel('rainforest-alliance')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'Rainforest Alliance certification',
      value: 6,
      type: 'positive',
    });
  }
  
  if (hasLabel('utz')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'UTZ certification',
      value: 6,
      type: 'positive',
    });
  }
  
  if (labels.some((l: string) => ['en:msc', 'en:asc', 'en:dolphin-safe'].includes(l))) {
    certificationBonus += 6;
    adjustments.push({
      description: 'MSC/ASC/Dolphin-Safe certification',
      value: 6,
      type: 'positive',
    });
  }
  
  if (hasLabel('rspca')) {
    certificationBonus += 5;
    adjustments.push({
      description: 'RSPCA certification',
      value: 5,
      type: 'positive',
    });
  }
  
  // B-Corp certification
  if (labels.some((l: string) => l.toLowerCase().includes('b-corp') || l.toLowerCase().includes('bcorp'))) {
    certificationBonus += 5;
    adjustments.push({
      description: 'B-Corp certification',
      value: 5,
      type: 'positive',
    });
  }
  
  // Cage-Free/Free-Range
  if (labels.some((l: string) => 
    l.toLowerCase().includes('cage-free') || 
    l.toLowerCase().includes('free-range')
  )) {
    certificationBonus += 4;
    adjustments.push({
      description: 'Cage-Free/Free-Range',
      value: 4,
      type: 'positive',
    });
  }
  
  // Apply certification bonus with stack cap of +15
  const cappedCertBonus = Math.min(certificationBonus, 15);
  if (cappedCertBonus > 0) {
    // Adjust score - remove individual bonuses and add capped total
    score += cappedCertBonus;
    if (certificationBonus > 15) {
      // If we hit the cap, note it
      logger.debug(`[CarePillar] Certification bonus capped at +15 (total was +${certificationBonus})`);
    }
  }
  
  // Cruel parent penalty
  let cruelParentPenalty = 0;
  if (isCruelParent(brands)) {
    cruelParentPenalty = 15;
    adjustments.push({
      description: 'Cruel parent company (major ethical violation)',
      value: -cruelParentPenalty,
      type: 'negative',
    });
    score -= cruelParentPenalty;
  }
  
  // Recalls penalty (within last 12 months)
  let recallPenalty = 0;
  if (product.recalls && Array.isArray(product.recalls) && product.recalls.length > 0) {
    const now = Date.now();
    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);
    
    const recentRecalls = product.recalls.filter(recall => {
      if (!recall.isActive) return false;
      const recallDate = new Date(recall.recallDate).getTime();
      return recallDate >= twelveMonthsAgo;
    });
    
    if (recentRecalls.length > 0) {
      recallPenalty = 10;
      adjustments.push({
        description: `Product recalls (${recentRecalls.length} active recall(s) within last 12 months)`,
        value: -recallPenalty,
        type: 'negative',
      });
      score -= recallPenalty;
    }
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  return {
    score,
    base,
    adjustments,
    details: {
      certificationBonus: cappedCertBonus,
      cruelParentPenalty,
      recallPenalty,
    },
  };
}

