/**
 * Ethics Pillar Calculation
 * 
 * IMPLEMENTATION: Directly conforms to ETHICS Pillar.xlsx spec
 * 
 * Base Score: 15/25 (uniform)
 * Adjustments:
 * - Certifications: Fairtrade=+8, Organic=+7, Rainforest/UTZ=+6, MSC/ASC=+6, Ocean Wise=+5, Friend of the Sea=+4, RSPCA/Leaping Bunny/B-Corp=+5, GlobalG.A.P=+4, Free-Roaming=+5, Free-Range=+3, Cage-Free=+1 (per spec - RSPO removed)
 * - Certification bonus cap: +15 total
 * - Animal Cruelty: BBFAW tier-based ONLY - Tier 1=+4, Tier 2=+2, Tier 6=-7, E/F=-7
 *   SPEC: "1. BBFAW; if not found nil return (only top 150 food companies currently assessed)"
 *   NO FALLBACK - If BBFAW not found, return nil (no adjustment, no penalty)
 *   NGO violations and news → Banner Alerts only (scoring neutral), time-bound <12months
 * - Labor Violations: 3-tier system - Limited=-4, Moderate=-8, Major=-15 (DOL, Walk Free, Oxfam, ILO)
 *   Brand/parent assessed separately with same tiers (-4/-8/-15), mutually exclusive
 * - Recalls (within 3 months, universal): 3-tier system - Class III=-4, Class II=-8, Class I=-15
 * - Brand/Parent Overlay: Tiered - Limited=-4, Moderate=-8, Major=-15 (mutually exclusive - only if product doesn't have violation)
 * 
 * Final: Capped at 0-25 (min 0, max 25)
 */

import { Product } from '../../../types/product';
import { getBrandData, hasRecallHistory } from '../../../data/brandDatabase';
import { logger } from '../../../utils/logger';
// Note: Animal cruelty fallback system removed per spec - BBFAW only
// import { checkAnimalCruelty, hasHighImpactAnimalCruelty, AnimalCrueltyData } from '../../../services/animalCrueltyService';
import { checkLaborViolations, hasHighImpactLaborViolations } from '../../../services/laborViolationsService';
import { checkBBFAWTier, getBBFAWTierScore } from '../../../services/bbfawService';
import { extractAllBrands, normalizeBrand } from '../../../utils/brandExtraction';
import { matchBrands, getBestBrandMatch, getParentCompanies, checkBrandProperty } from '../../../services/brandMatchingService';
import { powershellLogger } from '../../../utils/powershellLogger';

// Performance timing helper (works in Node.js, browser, and React Native)
function getPerformanceNow(): number {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  // Fallback for environments without performance API
  return Date.now();
}

export interface EthicsPillarResult {
  score: number;
  base: number;
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    certificationBonus: number;
    animalCrueltyPenalty: number; // Legacy violation-based penalty (fallback)
    animalCrueltyAdjustment: number; // BBFAW tier-based adjustment (primary)
    laborViolationPenalty: number;
    recallPenalty: number;
    brandOverlayPenalty: number;
  };
}

/**
 * Calculate Ethics Pillar score
 * Always starts at base 15, then applies adjustments
 * 
 * PERFORMANCE: Optimized for fast calculation - all lookups are synchronous
 * and use in-memory brand database (no async API calls)
 */
export function calculateEthicsPillar(product: Product): EthicsPillarResult {
  const startTime = getPerformanceNow();
  const adjustments: EthicsPillarResult['adjustments'] = [];
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
  logger.debug('[EthicsPillar] Starting calculation:', {
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
  
  // MSC/ASC certification (+6) - sustainable fishing per spec
  if (labels.some((l: string) => ['en:msc', 'en:asc'].includes(l))) {
    certificationBonus += 6;
    adjustments.push({
      description: 'MSC/ASC certification (sustainable fishing)',
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
      logger.debug(`[EthicsPillar] Certification bonus capped at +15 (total was +${certificationBonus})`);
    }
  }
  
  // Cap score at 25 after certifications (before penalties are applied)
  // This ensures adjustments are made from baseline 15, with max of 25 after positive adjustments
  score = Math.min(score, 25);
  
  // Define hasProductCertifications at function scope (used in both animal cruelty and labor violations sections)
  const hasProductCertifications = cappedCertBonus > 0;
  
  // Animal Cruelty scoring (BBFAW tier-based system ONLY per Excel spec)
  // SPEC: "1. BBFAW; if not found nil return (only top 150 food companies currently assessed)"
  // NO FALLBACK - If BBFAW not found, return nil (no adjustment, no penalty)
  // NGO violations and news → Banner Alerts only (scoring neutral), time-bound <12months
  let animalCrueltyAdjustment = 0;
  let animalCrueltyPenalty = 0; // Always 0 per spec - BBFAW only, no fallback violation system
  let bbfawTierApplied = false;
  
  // Check BBFAW tier data (ONLY source per spec)
  // Check all brands for BBFAW data
  for (const brand of allBrands) {
    const bbfawData = checkBBFAWTier(brand);
    if (bbfawData) {
      const tierScore = getBBFAWTierScore(bbfawData.tier);
      if (tierScore !== 0) {
        animalCrueltyAdjustment = tierScore;
        bbfawTierApplied = true;
        
        if (tierScore > 0) {
          adjustments.push({
            description: `BBFAW Tier ${bbfawData.tier} (excellent animal welfare)`,
            value: tierScore,
            type: 'positive',
          });
        } else {
          adjustments.push({
            description: `BBFAW Tier ${bbfawData.tier} (poor animal welfare)`,
            value: tierScore,
            type: 'negative',
          });
        }
        
        score += tierScore;
        logger.debug('[EthicsPillar] BBFAW tier-based scoring applied:', {
          brand,
          tier: bbfawData.tier,
          score: tierScore,
        });
        break; // Use first BBFAW match found
      }
    }
  }
  
  // SPEC COMPLIANCE: If BBFAW not found, return nil (no adjustment, no penalty)
  // NGO violations and news are handled in banner alerts (scoring neutral)
  if (!bbfawTierApplied) {
    logger.debug('[EthicsPillar] BBFAW data not found - returning nil (no adjustment, no penalty) per spec');
    // No adjustment applied - spec says "if not found nil return"
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
        logger.debug('[EthicsPillar] Labor violation found in secondary brand:', {
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
    logger.debug('[EthicsPillar] Labor violation check:', {
      primaryBrand: brandsLower || 'N/A',
      allBrandsChecked: allBrands.length,
      hasViolations: laborViolationData.hasViolations,
      violationType: laborViolationData.violationType,
      sources: laborViolationData.sources,
      violations: laborViolationData.violations,
    });
  }
  
  // 3-TIER SYSTEM: Limited=-4, Moderate=-8, Major=-15
  // MUTUALLY EXCLUSIVE LOGIC: Check if violation is product-level or parent-level
  // If product has certifications (indicating ethical product), parent violations should use brand overlay
  // Check if violation is from parent company (even if parent is in brands list)
  // Use brand_owner for parent detection (parentCompany is defined later)
  const isParentLevelLaborViolation = laborViolationData.violations.some(v => 
    v.includes('parent') || v.includes('may use brand overlay') ||
    // If product is ethical and violating brand matches brand_owner (parent company), treat as parent-level
    (hasProductCertifications && product.brand_owner && 
     v.toLowerCase().includes(product.brand_owner.toLowerCase()) &&
     // Only treat as parent-level if primary brand is different from brand_owner
     primaryBrand && primaryBrand.toLowerCase() !== product.brand_owner.toLowerCase())
  );
  
  // Only apply direct penalty if violation is product-level OR product has no certifications
  // If product is ethical (has certifications) and violation is parent-level, skip direct penalty
  // (will be handled by brand overlay below)
  if (laborViolationData.hasViolations && !(hasProductCertifications && isParentLevelLaborViolation)) {
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
  } else if (laborViolationData.hasViolations && hasProductCertifications && isParentLevelLaborViolation) {
    // Product is ethical but parent has violations - will be handled by brand overlay
    logger.debug('[EthicsPillar] Product is ethical but parent has labor violations - will use brand overlay instead of direct penalty');
  } else if (brandsLower) {
    // Log when no violations found (helps debug brand matching)
    logger.debug('[EthicsPillar] No labor violations found for brand:', brandsLower);
  }
  
  // Recalls penalty (within last 3 months, universal) - 3-TIER SYSTEM
  // CRITICAL: Recalls are now fetched BEFORE TruScore calculation (see productService.ts)
  // Excel Spec: Class I = -15, Class II = -8, Class III = -4 (3-month window)
  let recallPenalty = 0;
  let productHasRecallHistory = false;
  let productHasRecentRecalls = false;
  
  // Logging: Track recall data availability
  const recallsCount = product.recalls?.length || 0;
  logger.debug('[EthicsPillar] Recall check:', {
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
      logger.info(`[EthicsPillar] Applied recall penalty: -${recallPenalty} (${recentRecalls.length} recent recall(s), highest severity: ${highestSeverity})`);
    } else {
      // Check if brand has recall history (even if not recent)
      productHasRecallHistory = product.recalls.length > 0;
      logger.debug('[EthicsPillar] Recalls found but not recent (outside 3 months):', product.recalls.length);
    }
  } else {
    logger.debug('[EthicsPillar] No recalls data available - product.recalls is empty or missing');
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
  logger.debug('[EthicsPillar] Brand database lookup (fuzzy matching):', {
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
  // Check BBFAW adjustment (can be negative) - no legacy penalty (removed per spec)
  const productHasAnimalCruelty = animalCrueltyAdjustment < 0;
  const productHasLaborViolations = laborViolationPenalty > 0;
  const productHasRecalls = productHasRecentRecalls; // Only recent recalls (3 months)
  const productIsEthical = cappedCertBonus > 0; // Has certifications indicating ethical product
  
  // Check parent company BBFAW tier for brand overlay (if product doesn't have animal cruelty)
  // SPEC: Brand overlay applies if parent has violations BUT product doesn't have the same violation
  // For animal cruelty, we check parent company BBFAW tier (not product brand)
  let parentBBFAWData: { tier: number; score: number } | null = null;
  if (parentCompany && !productHasAnimalCruelty) {
    const parentBBFAW = checkBBFAWTier(parentCompany);
    if (parentBBFAW) {
      const parentTierScore = getBBFAWTierScore(parentBBFAW.tier);
      if (parentTierScore < 0) {
        // Parent has poor BBFAW tier (negative score) - can trigger brand overlay
        parentBBFAWData = { tier: parentBBFAW.tier, score: parentTierScore };
      }
    }
  }
  const laborViolationIsParentLevel = laborViolationData.violations.some(v => 
    v.includes('parent') || v.includes('may use brand overlay') ||
    // Check if violating brand matches parent company (from brand_owner or parent company detection)
    (productIsEthical && parentCompany && v.toLowerCase().includes(parentCompany.toLowerCase())) ||
    (productIsEthical && product.brand_owner && v.toLowerCase().includes(product.brand_owner.toLowerCase()) &&
     // Only treat as parent-level if primary brand is different from brand_owner
     primaryBrand && primaryBrand.toLowerCase() !== product.brand_owner.toLowerCase())
  );
  
  // Brand overlay checks (mutually exclusive - only if product doesn't have the violation)
  // For animal cruelty: Check parent company BBFAW tier (if product doesn't have negative BBFAW adjustment)
  if (!productHasAnimalCruelty && parentBBFAWData && parentBBFAWData.score < 0) {
    // Product doesn't have animal cruelty, but parent has poor BBFAW tier (negative score)
    hasHighImpactAnimal = true;
    logger.debug('[EthicsPillar] Product doesn\'t have animal cruelty but parent has poor BBFAW tier - using brand overlay', {
      parentCompany,
      parentBBFAWTier: parentBBFAWData.tier,
      parentBBFAWScore: parentBBFAWData.score,
    });
  }
  
  // For labor violations: Check parent company (if product doesn't have labor violations)
  if (productIsEthical && laborViolationIsParentLevel && !productHasLaborViolations) {
    // Product is ethical, parent has labor violations - use brand overlay
    hasHighImpactLabor = true;
    logger.debug('[EthicsPillar] Product is ethical but parent has labor violations - using brand overlay');
  }
  
  // Check primary brand and all extracted brands for labor violations and recalls
  for (const brand of allBrands) {
    // Labor violations: only if product doesn't have it
    if (!productHasLaborViolations && hasHighImpactLaborViolations(brand)) {
      hasHighImpactLabor = true;
    }
    // Recalls: only if product doesn't have recent recalls
    if (!productHasRecalls && hasRecallHistory(brand)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Check parent company for labor violations and recalls
  if (parentCompany) {
    if (!productHasLaborViolations && !hasHighImpactLabor && hasHighImpactLaborViolations(parentCompany)) {
      hasHighImpactLabor = true;
    }
    if (!productHasRecalls && !hasBrandRecallHistory && hasRecallHistory(parentCompany)) {
      hasBrandRecallHistory = true;
    }
  }
  
  // Logging: Track overlay penalty checks
  logger.debug('[EthicsPillar] Brand overlay checks (mutually exclusive):', {
    productHasAnimalCruelty,
    productHasLaborViolations,
    productHasRecalls,
    hasHighImpactAnimal,
    hasHighImpactLabor,
    hasBrandRecallHistory,
    willApplyPenalty: hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory,
  });
  
  // Apply brand overlay penalty only if product doesn't have the violation
  // Excel spec: Brand overlay uses same tiers as product violations (-4/-8/-15)
  if (hasHighImpactAnimal || hasHighImpactLabor || hasBrandRecallHistory) {
    // Determine severity tier for brand overlay (same tiers as product violations)
    let overlaySeverity: 'limited' | 'moderate' | 'major' = 'limited';
    const reasons: string[] = [];
    
    // Check animal cruelty severity from parent company BBFAW tier
    if (hasHighImpactAnimal && parentBBFAWData) {
      // Use BBFAW tier to determine severity for brand overlay
      // SPEC: Brand overlay uses same tiers as product violations (-4/-8/-15)
      // Map BBFAW tier to severity: Tier 6/E/F = major (-15), Tier 3-5 = moderate (-8), Tier 1-2 = limited (-4) but positive so skip
      // Since parent has negative BBFAW score, it's a violation
      if (parentBBFAWData.tier === 6 || parentBBFAWData.score <= -7) {
        // Tier 6 or E/F = major severity for brand overlay
        overlaySeverity = 'major';
        reasons.push('animal cruelty (BBFAW Tier 6/E/F - major)');
      } else if (parentBBFAWData.tier >= 3 && parentBBFAWData.tier <= 5) {
        // Tiers 3-5 = moderate severity for brand overlay (conservative approach)
        if (overlaySeverity === 'limited') {
          overlaySeverity = 'moderate';
        }
        reasons.push(`animal cruelty (BBFAW Tier ${parentBBFAWData.tier} - moderate)`);
      } else {
        // Tiers 1-2 are positive, so shouldn't trigger brand overlay
        // But if we're here, it means hasHighImpactAnimal is true, so use moderate
        if (overlaySeverity === 'limited') {
          overlaySeverity = 'moderate';
        }
        reasons.push(`animal cruelty (BBFAW Tier ${parentBBFAWData.tier})`);
      }
    }
    
    // Check labor violations severity from parent company
    if (hasHighImpactLabor) {
      // Create a test product with parent company to check severity
      const parentProduct: Product = {
        ...product,
        brands: parentCompany || matchedBrand || primaryBrand || '',
      };
      const parentLaborData = checkLaborViolations(parentProduct);
      if (parentLaborData.violationType === 'major') {
        overlaySeverity = 'major';
        reasons.push('labor violations (major)');
      } else if (parentLaborData.violationType === 'moderate' && overlaySeverity === 'limited') {
        overlaySeverity = 'moderate';
        reasons.push('labor violations (moderate)');
      } else if (parentLaborData.violationType === 'limited' && overlaySeverity === 'limited') {
        reasons.push('labor violations (limited)');
      }
    }
    
    // Check recall severity from brand database
    // Note: Brand database only stores boolean recallHistory, not classification
    // For brand overlay, we use moderate (-8) as default since we don't have Class I/II/III data
    // This is conservative - if brand has recall history, it's a moderate concern
    if (hasBrandRecallHistory) {
      if (overlaySeverity !== 'major') {
        // Default to moderate for recall history (conservative approach)
        // Brand database doesn't store recall classifications, so we use moderate
        if (overlaySeverity === 'limited') {
          overlaySeverity = 'moderate';
        }
        reasons.push('recall history (moderate)');
      } else {
        reasons.push('recall history');
      }
    }
    
    // Apply tiered penalty based on severity
    // Limited = -4, Moderate = -8, Major = -15
    if (overlaySeverity === 'major') {
      brandOverlayPenalty = 15;
    } else if (overlaySeverity === 'moderate') {
      brandOverlayPenalty = 8;
    } else {
      brandOverlayPenalty = 4;
    }
    
    adjustments.push({
      description: `Brand/parent overlay (${reasons.join(', ')}) - ${overlaySeverity} severity - mutually exclusive`,
      value: -brandOverlayPenalty,
      type: 'negative',
    });
    score -= brandOverlayPenalty;
    logger.info(`[EthicsPillar] Applied brand overlay penalty: -${brandOverlayPenalty} (${overlaySeverity} severity: ${reasons.join(', ')}) - product doesn't have these violations`);
  }
  
  // Cap at 0-25
  score = Math.max(0, Math.min(25, Math.round(score)));
  
  const calculationTime = getPerformanceNow() - startTime;
  
  // Comprehensive logging for debugging and analysis
  logger.info('[EthicsPillar] Calculation complete:', {
    barcode: product.barcode,
    productName: product.product_name?.substring(0, 50),
    base,
    certificationBonus: cappedCertBonus,
    certificationBonusRaw: certificationBonus,
    animalCrueltyPenalty, // Always 0 per spec - BBFAW only, no fallback violation system
    animalCrueltyAdjustment, // BBFAW tier-based adjustment only (nil if BBFAW not found)
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
    hasAnimalCruelty: animalCrueltyAdjustment < 0, // BBFAW negative adjustment only (no fallback penalty)
    hasLaborViolations: laborViolationPenalty > 0,
    hasRecallsPenalty: recallPenalty > 0,
    hasBrandOverlay: brandOverlayPenalty > 0,
  });
  
  // Detailed debug log with all adjustments
  logger.debug('[EthicsPillar] Detailed breakdown:', {
    adjustments: adjustments.map(a => ({
      description: a.description,
      value: a.value,
      type: a.type,
    })),
  });
  
  const result: EthicsPillarResult = {
    score,
    base,
    adjustments,
    details: {
      certificationBonus: cappedCertBonus,
      animalCrueltyPenalty,
      animalCrueltyAdjustment,
      laborViolationPenalty,
      recallPenalty,
      brandOverlayPenalty,
    },
  };

  // PowerShell logging for Ethics Pillar
  powershellLogger.pillarCalculation(
    product.barcode || 'unknown',
    'Ethics',
    base,
    score,
    adjustments.map(adj => ({
      ...adj,
      dataSource: adj.description.includes('certification') ? 'OFF' : undefined,
    })),
    result.details
  );

  return result;
}
