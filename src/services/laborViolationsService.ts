/**
 * Labor Violations Service
 * Detects labor violations and human exploitation for CARE Pillar.
 *
 * Sources: Brand database, known lists, DOL (curated list + enforcement API), Walk Free GSI, Buycott.
 *
 * Banner alerts (ID 17): Labor alerts MUST cite the specific violation report with external
 * hyperlink when available. violationReportUrls is populated from DOL list, Walk Free GSI,
 * Buycott, or DOL child/forced labor reports (when only brand_database). Use generic org
 * link only when no specific URL can be provided. Time-bound: 12 months; timestamps come
 * from violation year (DOL, Walk Free) or current year when not available.
 */

import { Product } from '../types/product';
import { getBrandData, normalizeBrandNameForLookup } from '../data/brandDatabase';
import { logger } from '../utils/logger';
import { fetchProductFromBuycott } from './buycottApi';
import { checkDOLLaborViolations, getDOLViolationSeverity } from './dolLaborDataService';
import { checkDOLViolations } from './dolEnforcementService';
import { checkILOViolations } from './iloStatisticsService';
import { checkWalkFreeViolations, getWalkFreeViolationSeverity } from './walkFreeService';
import { matchBrands, getParentCompanies } from './brandMatchingService';

/**
 * Official report URLs for labor sources (used in banner alerts for specific citation).
 * Banner should link to the actual report/issue when available; fallback to generic org link only when not.
 */
export const LABOR_REPORT_URLS = {
  DOL_LIST_OF_GOODS: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
  DOL_ENFORCEMENT: 'https://enforcedata.dol.gov/',
  DOL_YOUTH_LABOR: 'https://www.dol.gov/general/topic/youthlabor',
  DOL_CHILD_FORCED_LABOR_REPORTS: 'https://www.dol.gov/agencies/ilab/child-labor-forced-labor-reports',
  WALK_FREE_GSI: 'https://www.walkfree.org/projects/the-global-slavery-index/',
  OXFAM_LABOUR: 'https://www.oxfam.org/en/what-we-do/work/labour-rights',
  ILO: 'https://www.ilo.org/global/lang--en/index.htm',
  BUYCOTT: 'https://www.buycott.com/',
} as const;

export interface LaborViolationData {
  hasViolations: boolean;
  violationType: 'none' | 'limited' | 'moderate' | 'major'; // 3-tier system: Limited=-4, Moderate=-8, Major=-15
  violations: string[];
  sources: string[];
  /** Specific report/issue URLs when available. Banner uses first as actionUrl; only use generic org link when none. */
  violationReportUrls?: string[];
  timestamp?: number; // Timestamp when violation was reported (for time-bound filtering: within 12 months)
  violationTimestamps?: { [source: string]: number }; // Per-source timestamps for detailed tracking
}

/**
 * Known brands with major labor violations (Class I)
 * (child labor, slavery, Walk Free high-risk)
 * Penalty: -15
 */
const MAJOR_LABOR_VIOLATION_BRANDS: Set<string> = new Set([
  // Cocoa/Chocolate (known child labor issues)
  'nestle', 'nestlé', 'mars', 'hershey', 'ferrero', 'mondelez',
  'lindt', 'godiva', 'ghirardelli', 'cadbury',
  
  // Consumer Goods (known labor violations)
  'unilever', // Kenyan tea workers violence issue (major labor violation)
  
  // Garments/Textiles (known labor issues)
  'nike', 'adidas', 'h&m', 'zara', 'forever 21', 'shein',
  'boohoo', 'asos', 'primark',
  
  // Electronics (known labor issues)
  'apple', 'samsung', 'huawei', 'xiaomi', 'foxconn',
  
  // Agriculture (known labor issues)
  'dole', 'chiquita', 'del monte', 'fresh del monte',
]);

/**
 * Known brands with moderate labor violations (Class II)
 * (unsafe conditions, Walk Free medium-risk)
 * Penalty: -8
 */
const MODERATE_LABOR_VIOLATION_BRANDS: Set<string> = new Set([
  // Retail/Fast Food (workplace safety issues)
  'mcdonald\'s', 'mcdonalds', 'starbucks', 'walmart', 'amazon',
  'target', 'home depot', 'lowes', 'kroger', 'albertsons',
  
  // Manufacturing (workplace violations)
  'foxconn', 'pegatron', 'wistron',
]);

/**
 * Known brands with limited labor violations (Class III)
 * (under-pay, over-work, min breaks, unpaid overtime, Walk Free low-risk)
 * Penalty: -4
 */
const LIMITED_LABOR_VIOLATION_BRANDS: Set<string> = new Set([
  // Retail/Fast Food (wage violations, minor)
  'mcdonald\'s', 'mcdonalds', 'starbucks', // Some locations may be limited
  'subway', 'domino\'s', 'pizza hut',
]);

/**
 * Normalize brand name for lookup
 * ENHANCED: Uses shared normalization from brandDatabase for consistency
 */
function normalizeBrandName(brand: string): string {
  return normalizeBrandNameForLookup(brand);
}

/**
 * Check brand database for labor practices
 * Returns 3-tier classification: limited, moderate, or major
 */
function checkBrandDatabase(brandName: string): { type: 'none' | 'limited' | 'moderate' | 'major'; source: string } | null {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return null;
  }
  
  // Check labor practices rating to determine tier
  const normalized = normalizeBrandName(brandName);
  if (brandData.laborPractices === 'poor') {
    // Poor rating - check known violation lists
    if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return { type: 'major', source: 'brand_database' };
    } else if (MODERATE_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return { type: 'moderate', source: 'brand_database' };
    } else if (LIMITED_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return { type: 'limited', source: 'brand_database' };
    } else {
      // Poor rating but not in known lists - default to moderate
      return { type: 'moderate', source: 'brand_database' };
    }
  } else if (brandData.laborPractices === 'fair') {
    // Fair rating may indicate limited concerns
    if (LIMITED_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return { type: 'limited', source: 'brand_database' };
    }
  }
  
  return null;
}

/**
 * Check known violation lists
 * Returns 3-tier classification: limited, moderate, or major
 */
function checkKnownViolations(brandName: string): { type: 'limited' | 'moderate' | 'major'; source: string } | null {
  const normalized = normalizeBrandName(brandName);
  
  // Check major violations first (highest priority)
  if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return { type: 'major', source: 'known_violations' };
  }
  
  // Check partial matches for major violations
  for (const majorBrand of MAJOR_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(majorBrand) || majorBrand.includes(normalized)) {
      return { type: 'major', source: 'known_violations' };
    }
  }
  
  // Check moderate violations
  if (MODERATE_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return { type: 'moderate', source: 'known_violations' };
  }
  
  // Check partial matches for moderate violations
  for (const moderateBrand of MODERATE_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(moderateBrand) || moderateBrand.includes(normalized)) {
      return { type: 'moderate', source: 'known_violations' };
    }
  }
  
  // Check limited violations
  if (LIMITED_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return { type: 'limited', source: 'known_violations' };
  }
  
  // Check partial matches for limited violations
  for (const limitedBrand of LIMITED_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(limitedBrand) || limitedBrand.includes(normalized)) {
      return { type: 'limited', source: 'known_violations' };
    }
  }
  
  return null;
}

/**
 * Check for labor violations in a product
 * Returns violation data for CARE Pillar scoring
 * 
 * ENHANCED: Uses fuzzy matching for better brand resolution and confidence scoring
 * 
 * Note: This is synchronous for performance. Buycott API integration
 * would be async and can be added in product enhancement layer.
 */
export function checkLaborViolations(product: Product): LaborViolationData {
  const violations: string[] = [];
  const sources: string[] = [];
  let violationType: 'none' | 'limited' | 'moderate' | 'major' = 'none';
  
  // FUZZY MATCHING: Use fuzzy matching service for all brand lookups
  const brandMatches = matchBrands(product, 0.75); // 75% threshold
  
  if (brandMatches.length === 0) {
    logger.debug('[LaborViolations] No brand matches found (fuzzy matching):', {
      barcode: product.barcode,
      brandsField: product.brands || 'N/A',
    });
    return {
      hasViolations: false,
      violationType: 'none',
      violations: [],
      sources: [],
    };
  }
  
  // Helper to determine most severe violation type
  const getMostSevereType = (current: 'none' | 'limited' | 'moderate' | 'major', newType: 'limited' | 'moderate' | 'major'): 'none' | 'limited' | 'moderate' | 'major' => {
    if (current === 'major' || newType === 'major') return 'major';
    if (current === 'moderate' || newType === 'moderate') return 'moderate';
    if (current === 'limited' || newType === 'limited') return 'limited';
    return 'none';
  };
  
  // ENHANCED: Check all fuzzy-matched brands (sorted by confidence, highest first)
  // Only apply violations if confidence is above threshold
  for (const brandMatch of brandMatches) {
    const brand = brandMatch.brand;
    const confidence = brandMatch.confidence;
    const matchType = brandMatch.matchType;
    
    // Skip low-confidence matches (below 75% threshold)
    if (confidence < 75) {
      logger.debug('[LaborViolations] Skipping low-confidence match:', {
        brand,
        confidence,
        matchType,
      });
      continue;
    }
    
    // Log match quality for monitoring
    logger.debug('[LaborViolations] Checking brand match:', {
      brand,
      confidence,
      matchType,
      matchedBrand: brandMatch.matchedData?.name || 'N/A',
    });
    let foundMajor = false;
    
    // FUZZY MATCHING: Use matched brand data from fuzzy matching (more accurate)
    const matchedBrandData = brandMatch.matchedData;
    const matchedBrandName = matchedBrandData?.name || brand;
    
    // 1. Check brand database using fuzzy-matched data
    if (matchedBrandData) {
      // Use matched brand data directly
      if (matchedBrandData.laborPractices === 'poor') {
        // Poor rating - check known violation lists with confidence adjustment
        let violationTier: 'limited' | 'moderate' | 'major' = 'moderate'; // Default for poor
        const normalized = normalizeBrandName(matchedBrandName);
        if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
          violationTier = 'major';
        } else if (MODERATE_LABOR_VIOLATION_BRANDS.has(normalized)) {
          violationTier = 'moderate';
        } else if (LIMITED_LABOR_VIOLATION_BRANDS.has(normalized)) {
          violationTier = 'limited';
        }
        
        // Apply confidence-based tier adjustment
        // High confidence (≥90%): Use full tier
        // Medium confidence (75-89%): Use one tier lower
        let adjustedTier = violationTier;
        if (confidence < 90 && confidence >= 75) {
          if (violationTier === 'major') adjustedTier = 'moderate';
          else if (violationTier === 'moderate') adjustedTier = 'limited';
        }
        
        violationType = getMostSevereType(violationType, adjustedTier);
        if (!violations.some(v => v.includes('brand_database'))) {
          violations.push(`${adjustedTier} labor violation (brand database: ${matchedBrandName}, ${confidence}% confidence)`);
          sources.push('brand_database');
        }
        if (adjustedTier === 'major') {
          foundMajor = true;
        }
      } else if (matchedBrandData.laborPractices === 'fair') {
        // Fair rating may indicate limited concerns
        const normalized = normalizeBrandName(matchedBrandName);
        if (LIMITED_LABOR_VIOLATION_BRANDS.has(normalized)) {
          let adjustedTier: 'limited' | 'moderate' | 'major' = 'limited';
          if (confidence < 90 && confidence >= 75) {
            // Medium confidence - don't apply limited, log for review
            logger.debug('[LaborViolations] Medium confidence fair rating - not applying:', {
              brand: matchedBrandName,
              confidence,
            });
          } else {
            violationType = getMostSevereType(violationType, adjustedTier);
            if (!violations.some(v => v.includes('brand_database'))) {
              violations.push(`${adjustedTier} labor violation (brand database: ${matchedBrandName}, ${confidence}% confidence)`);
              sources.push('brand_database');
            }
          }
        }
      }
    } else {
      // Fallback: Check original brand if fuzzy match didn't provide data
      const dbResult = checkBrandDatabase(brand);
      if (dbResult && dbResult.type !== 'none') {
        // Apply confidence-based adjustment
        let adjustedType = dbResult.type;
        if (confidence < 90 && confidence >= 75) {
          if (dbResult.type === 'major') adjustedType = 'moderate';
          else if (dbResult.type === 'moderate') adjustedType = 'limited';
        }
        
        violationType = getMostSevereType(violationType, adjustedType);
        if (!violations.some(v => v.includes(dbResult.source))) {
          violations.push(`${adjustedType} labor violation (${dbResult.source}: ${brand}, ${confidence}% confidence, ${matchType})`);
          sources.push(dbResult.source);
        }
        if (adjustedType === 'major') {
          foundMajor = true;
        }
      }
    }
    
    // 2. Check known violations list (only if no major violation found yet) - use matched brand name
    if (!foundMajor) {
      const knownResult = checkKnownViolations(matchedBrandName);
      if (knownResult) {
        // Apply confidence-based adjustment
        let adjustedType = knownResult.type;
        if (confidence < 90 && confidence >= 75) {
          if (knownResult.type === 'major') adjustedType = 'moderate';
          else if (knownResult.type === 'moderate') adjustedType = 'limited';
        }
        
        violationType = getMostSevereType(violationType, adjustedType);
        if (!violations.some(v => v.includes(knownResult.source))) {
          violations.push(`${adjustedType} labor violation (${knownResult.source}: ${matchedBrandName}, ${confidence}% confidence)`);
          sources.push(knownResult.source);
        }
        if (adjustedType === 'major') {
          foundMajor = true;
        }
      }
    }
    
    // If we found a major violation, stop checking other brands
    if (foundMajor) {
      break;
    }
  }
  
  // 3. Check DOL (Department of Labor) data
  // FUZZY MATCHING: Use best matched brand for DOL checks
  const bestMatchedBrand = brandMatches.length > 0 ? (brandMatches[0].matchedData?.name || brandMatches[0].brand) : null;
  
  // Extract product category and origin country
  const productCategory = product.categories || product.categories_tags?.join(' ') || '';
  const originCountry = product.origins_tags?.[0] || product.origins || product.manufacturing_places_tags?.[0] || product.manufacturing_places;
  
  // violationReportUrls: specific report links for banner (use first as actionUrl when present)
  const violationReportUrls: string[] = [];

  // 3a. Check DOL curated list (synchronous, fast)
  const dolViolations = checkDOLLaborViolations(bestMatchedBrand || undefined, productCategory, originCountry);
  if (dolViolations.length > 0) {
    const dolSeverity = getDOLViolationSeverity(dolViolations);
    violationType = getMostSevereType(violationType, dolSeverity);
    violations.push(`${dolSeverity} labor violation (DOL: ${dolViolations.map(v => v.good).join(', ')})`);
    sources.push('dol');
    violationReportUrls.push(LABOR_REPORT_URLS.DOL_LIST_OF_GOODS);
  }
  
  // 3b. Check DOL Enforcement API (async, non-blocking - runs in background)
  // This doesn't block the function return - violations are added asynchronously
  if (bestMatchedBrand) {
    checkDOLViolations(bestMatchedBrand, bestMatchedBrand)
      .then(apiViolations => {
        if (apiViolations.length > 0) {
          // Log for future enhancement - could update violations asynchronously
          logger.debug('[LaborViolations] DOL API violations found (async):', {
            brand: bestMatchedBrand,
            violationsCount: apiViolations.length,
          });
        }
      })
      .catch(error => {
        logger.debug('[LaborViolations] DOL API check error (non-critical):', error);
      });
  }
  
  // Extract country code from origins (reused for multiple checks)
  const countryCode = product.countries_tags?.[0] || product.origins_tags?.[0] || undefined;
  
  // 3c. Check ILO Statistics (async, non-blocking - runs in background)
  if (countryCode) {
    checkILOViolations(countryCode, bestMatchedBrand || undefined)
      .then(iloViolations => {
        if (iloViolations.length > 0) {
          // Log for future enhancement - could update violations asynchronously
          logger.debug('[LaborViolations] ILO violations found (async):', {
            country: countryCode,
            violationsCount: iloViolations.length,
          });
        }
      })
      .catch(error => {
        logger.debug('[LaborViolations] ILO check error (non-critical):', error);
      });
  }
  
  // 4. Check Walk Free Global Slavery Index data
  const countryName = product.countries || product.origins || product.manufacturing_places;
  const walkFreeViolation = checkWalkFreeViolations(countryCode, countryName);
  if (walkFreeViolation) {
    const walkFreeSeverity = getWalkFreeViolationSeverity(walkFreeViolation);
    violationType = getMostSevereType(violationType, walkFreeSeverity);
    violations.push(`${walkFreeSeverity} labor violation (Walk Free GSI: ${walkFreeViolation.country}, risk ${walkFreeViolation.riskLevel})`);
    sources.push('walk_free');
    violationReportUrls.push(LABOR_REPORT_URLS.WALK_FREE_GSI);
  }
  
  // 5. Check Buycott data (if available in product)
  // Note: Buycott data should be fetched in product enhancement layer
  const buycottData = (product as any).buycott_data;
  if (buycottData && buycottData.laborViolations) {
    // Map Buycott data to 3-tier system (assume 'major' or 'minor' from Buycott)
    const buycottType = buycottData.laborViolations === 'major' ? 'major' : 'limited';
    violationType = getMostSevereType(violationType, buycottType);
    violations.push(`${buycottType} labor violation (Buycott API)`);
    sources.push('buycott_api');
    violationReportUrls.push(LABOR_REPORT_URLS.BUYCOTT);
  }
  
  // 6. Check parent company (if available) - FUZZY MATCHING: Use fuzzy-matched parent companies
  const parentCompanies = getParentCompanies(product, 0.75);
  for (const parentCompany of parentCompanies) {
    const parentResult = checkBrandDatabase(parentCompany);
    if (parentResult && parentResult.type !== 'none') {
      violationType = getMostSevereType(violationType, parentResult.type);
      violations.push(`${parentResult.type} labor violation (parent: ${parentCompany})`);
      sources.push('brand_database_parent');
    }
  }
  
  // Log match quality for monitoring
  if (violationType !== 'none') {
    logger.info('[LaborViolations] Violations found (fuzzy matching):', {
      barcode: product.barcode,
      violationType,
      violationsCount: violations.length,
      sources,
      brandMatchesCount: brandMatches.length,
      bestMatchConfidence: brandMatches[0]?.confidence || 0,
    });
  } else {
    logger.debug('[LaborViolations] No violations found (fuzzy matching):', {
      barcode: product.barcode,
      brandMatchesCount: brandMatches.length,
      bestMatchConfidence: brandMatches[0]?.confidence || 0,
    });
  }
  
  // When only source is brand_database, link to DOL List of Goods (specific official list; we have no single report URL)
  if (sources.includes('brand_database') && violationReportUrls.length === 0) {
    violationReportUrls.push(LABOR_REPORT_URLS.DOL_LIST_OF_GOODS);
  }

  // Time-bound: set timestamps from actual violation dates when available (12-month filter in banner)
  const now = Date.now();
  const violationTimestamps: { [source: string]: number } = {};
  if (dolViolations.length > 0) {
    const latestYear = Math.max(...dolViolations.map(v => v.year ?? new Date().getFullYear()));
    violationTimestamps['dol'] = new Date(latestYear, 0, 1).getTime();
  }
  if (walkFreeViolation?.year) {
    violationTimestamps['walk_free'] = new Date(walkFreeViolation.year, 0, 1).getTime();
  }
  for (const source of sources) {
    if (violationTimestamps[source] === undefined) {
      // No date from source: use start of current year so 12-month filter includes it
      violationTimestamps[source] = new Date(new Date().getFullYear(), 0, 1).getTime();
    }
  }

  const timestamp = sources.length > 0
    ? Math.max(...Object.values(violationTimestamps))
    : undefined;

  return {
    hasViolations: violationType !== 'none',
    violationType,
    violations,
    sources,
    violationReportUrls: violationReportUrls.length > 0 ? violationReportUrls : undefined,
    timestamp,
    violationTimestamps: sources.length > 0 ? violationTimestamps : undefined,
  };
}

/**
 * Check if brand has high-impact labor violations (for overlay penalty)
 * ENHANCED: Uses fuzzy matching for better brand resolution
 */
export function hasHighImpactLaborViolations(brandName: string): boolean {
  if (!brandName) return false;
  
  // FUZZY MATCHING: Use fuzzy matching to find best brand match
  const testProduct: Product = {
    barcode: '',
    brands: brandName,
    product_name: '',
  };
  
  const brandMatches = matchBrands(testProduct, 0.75);
  if (brandMatches.length === 0) {
    // Fallback to direct lookup if fuzzy matching fails
    const brandData = getBrandData(brandName);
    if (brandData?.laborPractices === 'poor') {
      return true;
    }
    if (brandData?.parentCompany) {
      const parentData = getBrandData(brandData.parentCompany);
      if (parentData?.laborPractices === 'poor') {
        return true;
      }
    }
    // Check known violations
    const normalized = normalizeBrandName(brandName);
    if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return true;
    }
    for (const majorBrand of MAJOR_LABOR_VIOLATION_BRANDS) {
      if (normalized.includes(majorBrand) || majorBrand.includes(normalized)) {
        return true;
      }
    }
    return false;
  }
  
  // Use best match (highest confidence)
  const bestMatch = brandMatches[0];
  if (bestMatch.confidence < 75) {
    // Low confidence - don't apply
    return false;
  }
  
  const matchedBrandData = bestMatch.matchedData || getBrandData(bestMatch.brand || brandName);
  if (matchedBrandData?.laborPractices === 'poor') {
    return true;
  }
  
  // Check parent company from fuzzy match
  const parentCompany = bestMatch.parentCompany || matchedBrandData?.parentCompany;
  if (parentCompany) {
    const parentData = getBrandData(parentCompany);
    if (parentData?.laborPractices === 'poor') {
      return true;
    }
  }
  
  // Check known violations using matched brand name
  const matchedBrandName = matchedBrandData?.name || bestMatch.brand || brandName;
  const normalized = normalizeBrandName(matchedBrandName);
  
  if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return true;
  }
  
  for (const majorBrand of MAJOR_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(majorBrand) || majorBrand.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

