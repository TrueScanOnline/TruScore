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
import { extractAllBrands, normalizeBrand } from '../../../utils/brandExtraction';

// Performance timing helper (works in Node.js, browser, and React Native)
function getPerformanceNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  // Fallback for environments without performance API
  return Date.now();
}

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
 * 
 * PERFORMANCE: Optimized for fast calculation - all lookups are synchronous
 * and use in-memory brand database (no async API calls)
 */
export function calculateCarePillar(product: Product): CarePillarResult {
  const startTime = getPerformanceNow();
  const adjustments: CarePillarResult['adjustments'] = [];
  let score = 15; // Base score (always 15)
  const base = 15;
  
  const labels = (product.labels_tags || []).map((l: unknown) => 
    typeof l === 'string' ? l.toLowerCase() : ''
  ).filter(Boolean) as string[];
  
  // ENHANCED: Extract all possible brands from multiple sources
  const allBrands = extractAllBrands(product);
  const primaryBrand = allBrands.length > 0 ? allBrands[0] : null;
  const brandsLower = primaryBrand ? primaryBrand.toLowerCase() : '';
  
  // Logging: Track what data we have
  logger.debug('[CarePillar] Starting calculation:', {
    barcode: product.barcode,
    productName: product.product_name?.substring(0, 50),
    labelsCount: labels.length,
    allBrandsFound: allBrands.length,
    primaryBrand: primaryBrand || 'N/A',
    brandsLower: brandsLower || 'N/A',
    brandOwner: product.brand_owner || 'N/A',
    recallsCount: product.recalls?.length || 0,
    brandsField: product.brands || 'N/A',
  });
  
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
  // PERFORMANCE: Synchronous lookup from in-memory brand database
  // ENHANCED: Check all brands found, not just primary
  let animalCrueltyData = checkAnimalCruelty(product);
  
  // Try all brands if primary brand didn't match
  if (!animalCrueltyData.hasViolations && allBrands.length > 1) {
    // Create a temporary product with each brand to check
    for (let i = 1; i < allBrands.length; i++) {
      const testBrand = allBrands[i];
      const testProduct: Product = {
        ...product,
        brands: testBrand,
      };
      const testData = checkAnimalCruelty(testProduct);
      if (testData.hasViolations) {
        animalCrueltyData = testData;
        logger.debug('[CarePillar] Animal cruelty found in secondary brand:', {
          brand: testBrand,
          violationType: testData.violationType,
        });
        break;
      }
    }
  }
  
  let animalCrueltyPenalty = 0;
  
  // Logging: Track brand lookup results
  if (brandsLower || allBrands.length > 0) {
    logger.debug('[CarePillar] Animal cruelty check:', {
      primaryBrand: brandsLower || 'N/A',
      allBrandsChecked: allBrands.length,
      hasViolations: animalCrueltyData.hasViolations,
      violationType: animalCrueltyData.violationType,
      sources: animalCrueltyData.sources,
      violations: animalCrueltyData.violations,
    });
  }
  
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
  } else if (brandsLower) {
    // Log when no violations found (helps debug brand matching)
    logger.debug('[CarePillar] No animal cruelty violations found for brand:', brandsLower);
  }
  
  // Labor Violations penalties (Minor=-5, Major=-15)
  // PERFORMANCE: Synchronous lookup from in-memory brand database
  // ENHANCED: Check all brands found, not just primary
  let laborViolationData = checkLaborViolations(product);
  
  // Try all brands if primary brand didn't match
  if (!laborViolationData.hasViolations && allBrands.length > 1) {
    // Create a temporary product with each brand to check
    for (let i = 1; i < allBrands.length; i++) {
      const testBrand = allBrands[i];
      const testProduct: Product = {
        ...product,
        brands: testBrand,
      };
      const testData = checkLaborViolations(testProduct);
      if (testData.hasViolations) {
        laborViolationData = testData;
        logger.debug('[CarePillar] Labor violation found in secondary brand:', {
          brand: testBrand,
          violationType: testData.violationType,
        });
        break;
      }
    }
  }
  
  let laborViolationPenalty = 0;
  
  // Logging: Track brand lookup results
  if (brandsLower || allBrands.length > 0) {
    logger.debug('[CarePillar] Labor violation check:', {
      primaryBrand: brandsLower || 'N/A',
      allBrandsChecked: allBrands.length,
      hasViolations: laborViolationData.hasViolations,
      violationType: laborViolationData.violationType,
      sources: laborViolationData.sources,
      violations: laborViolationData.violations,
    });
  }
  
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
  } else if (brandsLower) {
    // Log when no violations found (helps debug brand matching)
    logger.debug('[CarePillar] No labor violations found for brand:', brandsLower);
  }
  
  // Recalls penalty (within last 12 months, universal)
  // CRITICAL: Recalls are now fetched BEFORE TruScore calculation (see productService.ts)
  let recallPenalty = 0;
  let productHasRecallHistory = false;
  
  // Logging: Track recall data availability
  const recallsCount = product.recalls?.length || 0;
  logger.debug('[CarePillar] Recall check:', {
    recallsAvailable: recallsCount > 0,
    recallsCount,
    recallsData: product.recalls ? 'present' : 'missing',
  });
  
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
      logger.info(`[CarePillar] Applied recall penalty: -${recallPenalty} (${recentRecalls.length} recent recall(s))`);
    } else {
      // Check if brand has recall history (even if not recent)
      productHasRecallHistory = product.recalls.length > 0;
      logger.debug('[CarePillar] Recalls found but not recent (outside 12 months):', product.recalls.length);
    }
  } else {
    logger.debug('[CarePillar] No recalls data available - product.recalls is empty or missing');
  }
  
  // Brand/Parent Overlay Penalty (-3 for high-impact brands)
  // Applied if brand/parent has:
  // - High-impact animal cruelty
  // - High-impact labor violations
  // - Recall history
  // PERFORMANCE: All lookups are synchronous from in-memory database
  // ENHANCED: Check all brands found, use best match from database
  let brandOverlayPenalty = 0;
  
  // Try to find brand data for any of the extracted brands
  let brandData = null;
  let matchedBrand = null;
  for (const brand of allBrands) {
    const data = getBrandData(brand, product.brand_owner);
    if (data) {
      brandData = data;
      matchedBrand = brand;
      break; // Use first match found
    }
  }
  
  // If no match found, try with primary brand and brand_owner
  if (!brandData && primaryBrand) {
    brandData = getBrandData(primaryBrand, product.brand_owner);
    matchedBrand = primaryBrand;
  }
  
  const parentCompany = brandData?.parentCompany || product.brand_owner;
  const brandName = matchedBrand || primaryBrand || '';
  
  // Logging: Track brand database lookup
  logger.debug('[CarePillar] Brand database lookup:', {
    allBrandsChecked: allBrands.length,
    matchedBrand: matchedBrand || 'N/A',
    primaryBrand: primaryBrand || 'N/A',
    brandDataFound: !!brandData,
    parentCompany: parentCompany || 'N/A',
    brandDataKeys: brandData ? Object.keys(brandData) : [],
  });
  
  // Check for high-impact conditions across all brands
  let hasHighImpactAnimal = false;
  let hasHighImpactLabor = false;
  let hasBrandRecallHistory = productHasRecallHistory;
  
  // Check primary brand and all extracted brands
  for (const brand of allBrands) {
    if (hasHighImpactAnimalCruelty(brand)) {
      hasHighImpactAnimal = true;
    }
    if (hasHighImpactLaborViolations(brand)) {
      hasHighImpactLabor = true;
    }
    if (hasRecallHistory(brand)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Check parent company
  if (parentCompany) {
    if (!hasHighImpactAnimal && hasHighImpactAnimalCruelty(parentCompany)) {
      hasHighImpactAnimal = true;
    }
    if (!hasHighImpactLabor && hasHighImpactLaborViolations(parentCompany)) {
      hasHighImpactLabor = true;
    }
    if (!hasBrandRecallHistory && hasRecallHistory(parentCompany)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Logging: Track overlay penalty checks
  logger.debug('[CarePillar] Brand overlay checks:', {
    hasHighImpactAnimal,
    hasHighImpactLabor,
    hasBrandRecallHistory,
    willApplyPenalty: hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory,
  });
  
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
    logger.info(`[CarePillar] Applied brand overlay penalty: -${brandOverlayPenalty} (${reasons.join(', ')})`);
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  const calculationTime = getPerformanceNow() - startTime;
  
  // Comprehensive logging for debugging and analysis
  logger.info('[CarePillar] Calculation complete:', {
    barcode: product.barcode,
    productName: product.product_name?.substring(0, 50),
    base,
    certificationBonus: cappedCertBonus,
    certificationBonusRaw: certificationBonus,
    animalCrueltyPenalty,
    laborViolationPenalty,
    recallPenalty,
    brandOverlayPenalty,
    final: score,
    calculationTimeMs: calculationTime.toFixed(2),
    adjustmentsCount: adjustments.length,
    // Data availability
    hasLabels: labels.length > 0,
    labelsCount: labels.length,
    hasBrands: allBrands.length > 0,
    brandsFound: allBrands.length,
    primaryBrand: primaryBrand || 'N/A',
    matchedBrand: matchedBrand || 'N/A',
    hasRecallsData: recallsCount > 0,
    hasBrandData: !!brandData,
    // Certification detection
    certificationsFound: adjustments.filter(a => a.type === 'positive').length,
    // Violations detected
    hasAnimalCruelty: animalCrueltyPenalty > 0,
    hasLaborViolations: laborViolationPenalty > 0,
    hasRecallsPenalty: recallPenalty > 0,
    hasBrandOverlay: brandOverlayPenalty > 0,
  });
  
  // Detailed debug log with all adjustments
  logger.debug('[CarePillar] Detailed breakdown:', {
    adjustments: adjustments.map(a => ({
      description: a.description,
      value: a.value,
      type: a.type,
    })),
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

