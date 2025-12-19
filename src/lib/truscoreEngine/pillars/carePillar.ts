/**
 * Care Pillar Calculation
 * 
 * Base Score: 15/25
 * Adjustments:
 * - Certifications: Fairtrade=+8, Organic=+7, Rainforest/UTZ=+6, MSC/ASC=+6, RSPO=+6, Ocean Wise=+5, RSPCA/Leaping Bunny/B-Corp=+5, Free-Roaming=+5, Friend of the Sea=+4, GlobalG.A.P=+4, Free-Range=+3, Cage-Free=+1
 * - Certification bonus cap: +15 total
 * - Animal Cruelty: 3-tier system - Limited=-4, Moderate=-8, Major=-15 (BBFAW tier-based, ASPCA, Ethical Consumer)
 * - Labor Violations: 3-tier system - Limited=-4, Moderate=-8, Major=-15 (DOL, Walk Free GSI, Buycott)
 * - Recalls (within 3 months): 3-tier system - Class III=-4, Class II=-8, Class I=-15
 * - Brand/Parent Overlay: -3 (mutually exclusive - only if product doesn't have violation)
 * 
 * Final: Capped at 0-25
 */

import { Product } from '../../../types/product';
import { getBrandData, hasRecallHistory } from '../../../data/brandDatabase';
import { logger } from '../../../utils/logger';
import { checkAnimalCruelty, hasHighImpactAnimalCruelty } from '../../../services/animalCrueltyService';
import { checkLaborViolations, hasHighImpactLaborViolations } from '../../../services/laborViolationsService';
import { extractAllBrands, normalizeBrand } from '../../../utils/brandExtraction';
import { matchBrands, getBestBrandMatch, getParentCompanies, checkBrandProperty } from '../../../services/brandMatchingService';

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
  
  // FUZZY MATCHING: Use fuzzy matching service for all brand lookups
  // This provides confidence scoring and better matching accuracy
  const brandMatches = matchBrands(product, 0.75); // 75% threshold (balanced accuracy vs coverage)
  const bestBrandMatch = brandMatches.length > 0 ? brandMatches[0] : null;
  
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
    fuzzyMatchesFound: brandMatches.length,
    bestMatchConfidence: bestBrandMatch?.confidence || 0,
    bestMatchType: bestBrandMatch?.matchType || 'none',
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
  
  // Ocean Wise certification (+5) - sustainable wild catch
  if (hasLabel('ocean-wise') || hasLabel('oceanwise') || 
      labels.some((l: string) => l.toLowerCase().includes('ocean-wise'))) {
    certificationBonus += 5;
    adjustments.push({
      description: 'Ocean Wise certification (sustainable wild catch)',
      value: 5,
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
  
  // Free-Roaming (+5) - highest animal welfare standard
  if (labels.some((l: string) => 
    l.toLowerCase().includes('free-roaming') || 
    l.toLowerCase().includes('freeroaming')
  )) {
    certificationBonus += 5;
    adjustments.push({
      description: 'Free-Roaming (highest animal welfare standard)',
      value: 5,
      type: 'positive',
    });
  }
  
  // Friend of the Sea certification (+4) - eco-aquaculture
  if (hasLabel('friend-of-the-sea') || hasLabel('friendofthesea') ||
      labels.some((l: string) => l.toLowerCase().includes('friend-of-the-sea'))) {
    certificationBonus += 4;
    adjustments.push({
      description: 'Friend of the Sea certification (eco-aquaculture)',
      value: 4,
      type: 'positive',
    });
  }
  
  // GlobalG.A.P certification (+4) - Good Agricultural Practice
  if (hasLabel('globalgap') || hasLabel('global-gap') ||
      labels.some((l: string) => l.toLowerCase().includes('globalgap') || l.toLowerCase().includes('global-gap'))) {
    certificationBonus += 4;
    adjustments.push({
      description: 'GlobalG.A.P certification (Good Agricultural Practice)',
      value: 4,
      type: 'positive',
    });
  }
  
  // Free-Range (+3) - separate from Cage-Free
  if (labels.some((l: string) => 
    l.toLowerCase().includes('free-range') && 
    !l.toLowerCase().includes('free-roaming')
  )) {
    certificationBonus += 3;
    adjustments.push({
      description: 'Free-Range',
      value: 3,
      type: 'positive',
    });
  }
  
  // Cage-Free (+1) - basic no-cages (lowest animal welfare certification)
  if (labels.some((l: string) => 
    l.toLowerCase().includes('cage-free') && 
    !l.toLowerCase().includes('free-range') &&
    !l.toLowerCase().includes('free-roaming')
  )) {
    certificationBonus += 1;
    adjustments.push({
      description: 'Cage-Free (basic no-cages)',
      value: 1,
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
  
  // 3-TIER SYSTEM: Limited=-4, Moderate=-8, Major=-15
  // MUTUALLY EXCLUSIVE LOGIC: Check if violation is product-level or parent-level
  // If product has certifications (indicating ethical product), parent violations should use brand overlay
  const hasProductCertifications = cappedCertBonus > 0;
  const isParentLevelViolation = animalCrueltyData.violations.some(v => 
    v.includes('parent') || v.includes('may use brand overlay')
  );
  
  // Only apply direct penalty if violation is product-level OR product has no certifications
  // If product is ethical (has certifications) and violation is parent-level, skip direct penalty
  // (will be handled by brand overlay below)
  if (animalCrueltyData.hasViolations && !(hasProductCertifications && isParentLevelViolation)) {
    if (animalCrueltyData.violationType === 'major') {
      animalCrueltyPenalty = 15;
      adjustments.push({
        description: 'Major animal cruelty violation (factory farming/slaughter/cruelty/BBFAW tier 1-2)',
        value: -animalCrueltyPenalty,
        type: 'negative',
      });
      score -= animalCrueltyPenalty;
    } else if (animalCrueltyData.violationType === 'moderate') {
      animalCrueltyPenalty = 8;
      adjustments.push({
        description: 'Moderate animal cruelty violation (overcrowding/poor transport/BBFAW tier 3-4)',
        value: -animalCrueltyPenalty,
        type: 'negative',
      });
      score -= animalCrueltyPenalty;
    } else if (animalCrueltyData.violationType === 'limited') {
      animalCrueltyPenalty = 4;
      adjustments.push({
        description: 'Limited animal cruelty violation (minor welfare lapses/BBFAW tier 5-6)',
        value: -animalCrueltyPenalty,
        type: 'negative',
      });
      score -= animalCrueltyPenalty;
    }
  } else if (animalCrueltyData.hasViolations && hasProductCertifications && isParentLevelViolation) {
    // Product is ethical but parent has violations - will be handled by brand overlay
    logger.debug('[CarePillar] Product is ethical but parent has violations - will use brand overlay instead of direct penalty');
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
  
  // 3-TIER SYSTEM: Limited=-4, Moderate=-8, Major=-15
  if (laborViolationData.hasViolations) {
    if (laborViolationData.violationType === 'major') {
      laborViolationPenalty = 15;
      adjustments.push({
        description: 'Major labor violation (child labor/slavery/Walk Free high-risk)',
        value: -laborViolationPenalty,
        type: 'negative',
      });
      score -= laborViolationPenalty;
    } else if (laborViolationData.violationType === 'moderate') {
      laborViolationPenalty = 8;
      adjustments.push({
        description: 'Moderate labor violation (unsafe conditions/Walk Free medium-risk)',
        value: -laborViolationPenalty,
        type: 'negative',
      });
      score -= laborViolationPenalty;
    } else if (laborViolationData.violationType === 'limited') {
      laborViolationPenalty = 4;
      adjustments.push({
        description: 'Limited labor violation (under-pay/over-work/min breaks/unpaid overtime/Walk Free low-risk)',
        value: -laborViolationPenalty,
        type: 'negative',
      });
      score -= laborViolationPenalty;
    }
  } else if (brandsLower) {
    // Log when no violations found (helps debug brand matching)
    logger.debug('[CarePillar] No labor violations found for brand:', brandsLower);
  }
  
  // Recalls penalty (within last 3 months, universal) - 3-TIER SYSTEM
  // CRITICAL: Recalls are now fetched BEFORE TruScore calculation (see productService.ts)
  // Excel Spec: Class I = -15, Class II = -8, Class III = -4 (3-month window)
  let recallPenalty = 0;
  let productHasRecallHistory = false;
  let productHasRecentRecalls = false;
  
  // Logging: Track recall data availability
  const recallsCount = product.recalls?.length || 0;
  logger.debug('[CarePillar] Recall check:', {
    recallsAvailable: recallsCount > 0,
    recallsCount,
    recallsData: product.recalls ? 'present' : 'missing',
  });
  
  if (product.recalls && Array.isArray(product.recalls) && product.recalls.length > 0) {
    const now = Date.now();
    const threeMonthsAgo = now - (3 * 30 * 24 * 60 * 60 * 1000); // Changed from 12 to 3 months
    
    const recentRecalls = product.recalls.filter(recall => {
      if (!recall.isActive) return false;
      const recallDate = new Date(recall.recallDate).getTime();
      return recallDate >= threeMonthsAgo;
    });
    
    if (recentRecalls.length > 0) {
      productHasRecentRecalls = true;
      productHasRecallHistory = true;
      
      // 3-TIER SYSTEM: Determine highest severity recall
      // Use numeric priority to avoid TypeScript narrowing issues
      let highestPriority = 0; // 0=Unknown, 1=Class III, 2=Class II, 3=Class I
      let highestSeverity: 'Class I' | 'Class II' | 'Class III' | 'Unknown' = 'Unknown';
      
      for (const recall of recentRecalls) {
        const classification: 'Class I' | 'Class II' | 'Class III' | 'Unknown' = recall.classification || 'Unknown';
        let priority = 0;
        if (classification === 'Class I') {
          priority = 3;
        } else if (classification === 'Class II') {
          priority = 2;
        } else if (classification === 'Class III') {
          priority = 1;
        }
        
        if (priority > highestPriority) {
          highestPriority = priority;
          highestSeverity = classification;
          if (priority === 3) {
            break; // Class I is highest, no need to check further
          }
        }
      }
      
      // Apply penalty based on highest severity
      if (highestSeverity === 'Class I') {
        recallPenalty = 15;
        adjustments.push({
          description: `Product recalls - Class I (${recentRecalls.length} active recall(s) within last 3 months, universal)`,
          value: -recallPenalty,
          type: 'negative',
        });
      } else if (highestSeverity === 'Class II') {
        recallPenalty = 8;
        adjustments.push({
          description: `Product recalls - Class II (${recentRecalls.length} active recall(s) within last 3 months, universal)`,
          value: -recallPenalty,
          type: 'negative',
        });
      } else if (highestSeverity === 'Class III') {
        recallPenalty = 4;
        adjustments.push({
          description: `Product recalls - Class III (${recentRecalls.length} active recall(s) within last 3 months, universal)`,
          value: -recallPenalty,
          type: 'negative',
        });
      } else {
        // Unknown classification - use moderate penalty (Class II equivalent)
        recallPenalty = 8;
        adjustments.push({
          description: `Product recalls - Unknown classification (${recentRecalls.length} active recall(s) within last 3 months, universal)`,
          value: -recallPenalty,
          type: 'negative',
        });
      }
      
      score -= recallPenalty;
      logger.info(`[CarePillar] Applied recall penalty: -${recallPenalty} (${recentRecalls.length} recent recall(s), highest severity: ${highestSeverity})`);
    } else {
      // Check if brand has recall history (even if not recent)
      productHasRecallHistory = product.recalls.length > 0;
      logger.debug('[CarePillar] Recalls found but not recent (outside 3 months):', product.recalls.length);
    }
  } else {
    logger.debug('[CarePillar] No recalls data available - product.recalls is empty or missing');
  }
  
  // Brand/Parent Overlay Penalty (MUTUALLY EXCLUSIVE LOGIC)
  // Excel Spec: "Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive (no deduct if product hits)"
  // Applied if brand/parent has violations BUT product itself doesn't have the same violation
  // PERFORMANCE: All lookups are synchronous from in-memory database
  // ENHANCED: Use fuzzy matching for better brand resolution
  let brandOverlayPenalty = 0;
  
  // FUZZY MATCHING: Use fuzzy-matched brand data (already computed above)
  const brandData = bestBrandMatch?.matchedData || null;
  const matchedBrand = bestBrandMatch?.brand || primaryBrand || '';
  const parentCompanies = getParentCompanies(product, 0.75); // Get all parent companies from fuzzy matches
  const parentCompany = parentCompanies.length > 0 ? parentCompanies[0] : (brandData?.parentCompany || product.brand_owner);
  
  // Logging: Track brand database lookup with fuzzy matching results
  logger.debug('[CarePillar] Brand database lookup (fuzzy matching):', {
    allBrandsChecked: allBrands.length,
    fuzzyMatchesCount: brandMatches.length,
    matchedBrand: matchedBrand || 'N/A',
    primaryBrand: primaryBrand || 'N/A',
    brandDataFound: !!brandData,
    matchConfidence: bestBrandMatch?.confidence || 0,
    matchType: bestBrandMatch?.matchType || 'none',
    parentCompany: parentCompany || 'N/A',
    parentCompaniesFound: parentCompanies.length,
    brandDataKeys: brandData ? Object.keys(brandData) : [],
  });
  
  // MUTUALLY EXCLUSIVE LOGIC: Only apply brand overlay if product doesn't have the violation
  // Check for high-impact conditions across all brands (but only if product doesn't have them)
  let hasHighImpactAnimal = false;
  let hasHighImpactLabor = false;
  let hasBrandRecallHistory = false;
  
  // Only check brand overlay if product itself doesn't have the violation
  // Also check if product is ethical (has certifications) - if so, parent violations should use overlay
  const productHasAnimalCruelty = animalCrueltyPenalty > 0;
  const productHasLaborViolations = laborViolationPenalty > 0;
  const productHasRecalls = productHasRecentRecalls; // Only recent recalls (3 months)
  const productIsEthical = cappedCertBonus > 0; // Has certifications indicating ethical product
  
  // If product is ethical but parent has violations, we should use brand overlay
  // Check if animal cruelty violation was parent-level
  const animalCrueltyIsParentLevel = animalCrueltyData.violations.some(v => 
    v.includes('parent') || v.includes('may use brand overlay')
  );
  
  // If product is ethical and violation is parent-level, we should use brand overlay instead
  if (productIsEthical && animalCrueltyIsParentLevel && !productHasAnimalCruelty) {
    // Product is ethical, parent has violations - use brand overlay
    hasHighImpactAnimal = true;
    logger.debug('[CarePillar] Product is ethical but parent has animal cruelty - using brand overlay');
  }
  
  // Check primary brand and all extracted brands
  for (const brand of allBrands) {
    // Animal cruelty: only if product doesn't have it
    if (!productHasAnimalCruelty && hasHighImpactAnimalCruelty(brand)) {
      hasHighImpactAnimal = true;
    }
    // Labor violations: only if product doesn't have it
    if (!productHasLaborViolations && hasHighImpactLaborViolations(brand)) {
      hasHighImpactLabor = true;
    }
    // Recalls: only if product doesn't have recent recalls
    if (!productHasRecalls && hasRecallHistory(brand)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Check parent company
  if (parentCompany) {
    if (!productHasAnimalCruelty && !hasHighImpactAnimal && hasHighImpactAnimalCruelty(parentCompany)) {
      hasHighImpactAnimal = true;
    }
    if (!productHasLaborViolations && !hasHighImpactLabor && hasHighImpactLaborViolations(parentCompany)) {
      hasHighImpactLabor = true;
    }
    if (!productHasRecalls && !hasBrandRecallHistory && hasRecallHistory(parentCompany)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Logging: Track overlay penalty checks
  logger.debug('[CarePillar] Brand overlay checks (mutually exclusive):', {
    productHasAnimalCruelty,
    productHasLaborViolations,
    productHasRecalls,
    hasHighImpactAnimal,
    hasHighImpactLabor,
    hasBrandRecallHistory,
    willApplyPenalty: hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory,
  });
  
  // Apply brand overlay penalty only if product doesn't have the violation
  if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
    // Excel spec: Brand overlay uses same tiers as product violations (-4/-8/-15)
    // For simplicity, we use -3 as a general overlay (can be enhanced to use tiers)
    brandOverlayPenalty = 3;
    const reasons: string[] = [];
    if (hasHighImpactAnimal) reasons.push('animal cruelty');
    if (hasHighImpactLabor) reasons.push('labor violations');
    if (hasBrandRecallHistory) reasons.push('recall history');
    
    adjustments.push({
      description: `Brand/parent high-impact overlay (${reasons.join(', ')}) - mutually exclusive`,
      value: -brandOverlayPenalty,
      type: 'negative',
    });
    score -= brandOverlayPenalty;
    logger.info(`[CarePillar] Applied brand overlay penalty: -${brandOverlayPenalty} (${reasons.join(', ')}) - product doesn't have these violations`);
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

