/**
 * Care Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Certifications: Fairtrade=+8, Organic=+7, Rainforest/UTZ=+6, MSC/ASC=+6, RSPO=+6, RSPCA/Leaping Bunny/B-Corp=+5, Cage-Free/Free-Range=+4
 * - Certification bonus cap: +15 total
 * - Animal Cruelty: Major=-15, Minor=-5, Brand overlay=-3
 * - Labor Violations: Minor=-5, Major=-15, Brand overlay=-3
 * - Recalls (within 12 months): -10, Brand overlay=-3 if recall history
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { getBrandData, hasRecallHistory } from '../../../data/brandDatabase';
import { logger } from '../../../utils/logger';
import { checkAnimalCruelty, hasHighImpactAnimalCruelty } from '../../../services/animalCrueltyService';
import { checkLaborViolations, hasHighImpactLaborViolations } from '../../../services/laborViolationsService';

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
    animalCrueltyPenalty: number;
    laborViolationPenalty: number;
    recallPenalty: number;
    brandOverlayPenalty: number;
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
  
  // RSPO certification (Roundtable on Sustainable Palm Oil)
  if (hasLabel('rspo') || hasLabel('roundtable-on-sustainable-palm-oil')) {
    certificationBonus += 6;
    adjustments.push({
      description: 'RSPO certification',
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
  
  // Leaping Bunny certification (cruelty-free)
  if (hasLabel('leaping-bunny') || hasLabel('cruelty-free') || 
      (product as any).leaping_bunny?.isCrueltyFree === true) {
    certificationBonus += 5;
    adjustments.push({
      description: 'Leaping Bunny certification (cruelty-free)',
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
  
  // Animal Cruelty penalties (Major=-15, Minor=-5)
  const animalCrueltyData = checkAnimalCruelty(product);
  let animalCrueltyPenalty = 0;
  
  if (animalCrueltyData.hasViolations) {
    if (animalCrueltyData.violationType === 'major') {
      animalCrueltyPenalty = 15;
      adjustments.push({
        description: 'Major animal cruelty violation (factory farming/slaughter/cruelty)',
        value: -animalCrueltyPenalty,
        type: 'negative',
      });
      score -= animalCrueltyPenalty;
    } else if (animalCrueltyData.violationType === 'minor') {
      animalCrueltyPenalty = 5;
      adjustments.push({
        description: 'Minor animal cruelty violation',
        value: -animalCrueltyPenalty,
        type: 'negative',
      });
      score -= animalCrueltyPenalty;
    }
  }
  
  // Labor Violations penalties (Minor=-5, Major=-15)
  const laborViolationData = checkLaborViolations(product);
  let laborViolationPenalty = 0;
  
  if (laborViolationData.hasViolations) {
    if (laborViolationData.violationType === 'major') {
      laborViolationPenalty = 15;
      adjustments.push({
        description: 'Major labor violation (child labor/slavery)',
        value: -laborViolationPenalty,
        type: 'negative',
      });
      score -= laborViolationPenalty;
    } else if (laborViolationData.violationType === 'minor') {
      laborViolationPenalty = 5;
      adjustments.push({
        description: 'Minor labor violation (under-pay/over-work/min breaks/unpaid overtime)',
        value: -laborViolationPenalty,
        type: 'negative',
      });
      score -= laborViolationPenalty;
    }
  }
  
  // Recalls penalty (within last 12 months, universal)
  let recallPenalty = 0;
  let productHasRecallHistory = false;
  
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
      productHasRecallHistory = true;
      adjustments.push({
        description: `Product recalls (${recentRecalls.length} active recall(s) within last 12 months, universal)`,
        value: -recallPenalty,
        type: 'negative',
      });
      score -= recallPenalty;
    } else {
      // Check if brand has recall history (even if not recent)
      productHasRecallHistory = product.recalls.length > 0;
    }
  }
  
  // Brand/Parent Overlay Penalty (-3 for high-impact brands)
  // Applied if brand/parent has:
  // - High-impact animal cruelty
  // - High-impact labor violations
  // - Recall history
  let brandOverlayPenalty = 0;
  const brandName = product.brands || '';
  const brandData = brandName ? getBrandData(brandName) : null;
  const parentCompany = brandData?.parentCompany || product.brand_owner;
  
  // Check for high-impact conditions
  const hasHighImpactAnimal = hasHighImpactAnimalCruelty(brandName) || 
    (parentCompany && hasHighImpactAnimalCruelty(parentCompany));
  const hasHighImpactLabor = hasHighImpactLaborViolations(brandName) || 
    (parentCompany && hasHighImpactLaborViolations(parentCompany));
  const hasBrandRecallHistory = productHasRecallHistory || 
    (brandName ? hasRecallHistory(brandName) : false) ||
    (parentCompany ? hasRecallHistory(parentCompany) : false);
  
  if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
    brandOverlayPenalty = 3;
    const reasons: string[] = [];
    if (hasHighImpactAnimal) reasons.push('animal cruelty');
    if (hasHighImpactLabor) reasons.push('labor violations');
    if (hasBrandRecallHistory) reasons.push('recall history');
    
    adjustments.push({
      description: `Brand/parent high-impact overlay (${reasons.join(', ')})`,
      value: -brandOverlayPenalty,
      type: 'negative',
    });
    score -= brandOverlayPenalty;
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  logger.debug('[CarePillar] Calculation:', {
    base,
    certificationBonus: cappedCertBonus,
    animalCrueltyPenalty,
    laborViolationPenalty,
    recallPenalty,
    brandOverlayPenalty,
    final: score,
  });
  
  return {
    score,
    base,
    adjustments,
    details: {
      certificationBonus: cappedCertBonus,
      animalCrueltyPenalty,
      laborViolationPenalty,
      recallPenalty,
      brandOverlayPenalty,
    },
  };
}

