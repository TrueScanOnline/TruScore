/**
 * DOL (US Department of Labor) Labor Data Service
 * Integrates with DOL List of Goods Produced by Child Labor or Forced Labor
 * 
 * Source: https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods
 * Data Format: Annual reports (PDF/Excel)
 * 
 * This service provides labor violation data for Ethics Pillar scoring
 */

import { logger } from '../utils/logger';

export interface DOLLaborViolation {
  country: string;
  good: string;
  violationType: 'child_labor' | 'forced_labor' | 'both';
  sector?: string;
  year?: number;
}

export interface DOLLaborData {
  violations: DOLLaborViolation[];
  lastUpdated: string;
}

// In-memory cache for DOL data
let dolDataCache: DOLLaborData | null = null;
let dolDataCacheTimestamp: number = 0;
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year (DOL updates annually)

/**
 * Known goods and countries with labor violations from DOL reports
 * This is a curated list based on DOL's annual "List of Goods Produced by Child Labor or Forced Labor"
 * 
 * Note: In production, this should be loaded from a downloaded/parsed DOL dataset
 * For now, we use a curated list of known violations
 */
const KNOWN_DOL_VIOLATIONS: DOLLaborViolation[] = [
  // Cocoa/Chocolate - West Africa
  { country: 'Côte d\'Ivoire', good: 'Cocoa', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Ghana', good: 'Cocoa', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Nigeria', good: 'Cocoa', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  
  // Coffee - Multiple countries
  { country: 'Colombia', good: 'Coffee', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Guatemala', good: 'Coffee', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Honduras', good: 'Coffee', violationType: 'child_labor', sector: 'Agriculture', year: 2023 },
  
  // Sugar - Multiple countries
  { country: 'Brazil', good: 'Sugar', violationType: 'forced_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Dominican Republic', good: 'Sugar', violationType: 'forced_labor', sector: 'Agriculture', year: 2023 },
  
  // Garments/Textiles - Multiple countries
  { country: 'Bangladesh', good: 'Garments', violationType: 'forced_labor', sector: 'Manufacturing', year: 2023 },
  { country: 'Cambodia', good: 'Garments', violationType: 'forced_labor', sector: 'Manufacturing', year: 2023 },
  { country: 'China', good: 'Garments', violationType: 'forced_labor', sector: 'Manufacturing', year: 2023 },
  { country: 'India', good: 'Garments', violationType: 'child_labor', sector: 'Manufacturing', year: 2023 },
  
  // Electronics - Multiple countries
  { country: 'China', good: 'Electronics', violationType: 'forced_labor', sector: 'Manufacturing', year: 2023 },
  { country: 'Malaysia', good: 'Electronics', violationType: 'forced_labor', sector: 'Manufacturing', year: 2023 },
  
  // Palm Oil - Multiple countries
  { country: 'Malaysia', good: 'Palm Oil', violationType: 'forced_labor', sector: 'Agriculture', year: 2023 },
  { country: 'Indonesia', good: 'Palm Oil', violationType: 'forced_labor', sector: 'Agriculture', year: 2023 },
];

/**
 * Check if a brand/product has DOL labor violations
 * 
 * @param brandName - Brand name to check
 * @param productCategory - Product category (e.g., 'chocolate', 'coffee', 'garments')
 * @param originCountry - Country of origin (ISO code)
 * @returns Labor violation data if found
 */
export function checkDOLLaborViolations(
  brandName?: string,
  productCategory?: string,
  originCountry?: string
): DOLLaborViolation[] {
  if (!productCategory && !originCountry) {
    return [];
  }

  const violations: DOLLaborViolation[] = [];
  const categoryLower = productCategory?.toLowerCase() || '';
  const countryLower = originCountry?.toLowerCase() || '';

  // Map product categories to DOL goods
  const categoryToGood: Record<string, string[]> = {
    'chocolate': ['Cocoa'],
    'cocoa': ['Cocoa'],
    'candy': ['Cocoa'], // Chocolate candy
    'confectionery': ['Cocoa'], // Chocolate confectionery
    'spread': ['Cocoa', 'Palm Oil'], // Chocolate spreads often have both
    'coffee': ['Coffee'],
    'sugar': ['Sugar'],
    'garments': ['Garments'],
    'textiles': ['Garments'],
    'clothing': ['Garments'],
    'electronics': ['Electronics'],
    'palm oil': ['Palm Oil'],
    'palm-oil': ['Palm Oil'],
    'hazelnut': ['Cocoa'], // Nutella-type products
    'cookies': ['Cocoa', 'Palm Oil'], // Cookies often have both
    'biscuits': ['Cocoa', 'Palm Oil'], // Biscuits often have both
  };

  // Find matching goods - check both category string and category tags
  const matchingGoods: string[] = [];
  const allCategoryText = [
    categoryLower,
    ...(productCategory ? [productCategory.toLowerCase()] : []),
  ].join(' ');
  
  for (const [category, goods] of Object.entries(categoryToGood)) {
    if (allCategoryText.includes(category)) {
      matchingGoods.push(...goods);
    }
  }
  
  // Also check ingredients for cocoa/chocolate/palm oil
  if (allCategoryText.includes('chocolate') || allCategoryText.includes('cocoa') || 
      allCategoryText.includes('hazelnut') || allCategoryText.includes('nutella')) {
    if (!matchingGoods.includes('Cocoa')) {
      matchingGoods.push('Cocoa');
    }
  }
  
  if (allCategoryText.includes('palm')) {
    if (!matchingGoods.includes('Palm Oil')) {
      matchingGoods.push('Palm Oil');
    }
  }

  // Check violations for matching goods and countries
  for (const violation of KNOWN_DOL_VIOLATIONS) {
    // Check if good matches
    const goodMatches = matchingGoods.length === 0 || matchingGoods.includes(violation.good);
    
    // Check if country matches (if provided)
    const countryMatches = !originCountry || 
      violation.country.toLowerCase().includes(countryLower) ||
      countryLower.includes(violation.country.toLowerCase());

    if (goodMatches && countryMatches) {
      violations.push(violation);
    }
  }

  return violations;
}

/**
 * Get DOL labor violation severity
 * 
 * @param violations - DOL violations found
 * @returns Severity level: 'limited', 'moderate', or 'major'
 */
export function getDOLViolationSeverity(violations: DOLLaborViolation[]): 'limited' | 'moderate' | 'major' {
  if (violations.length === 0) {
    return 'limited'; // No violations
  }

  // Check for forced labor (major violation)
  const hasForcedLabor = violations.some(v => 
    v.violationType === 'forced_labor' || v.violationType === 'both'
  );
  
  if (hasForcedLabor) {
    return 'major';
  }

  // Check for child labor (moderate violation)
  const hasChildLabor = violations.some(v => 
    v.violationType === 'child_labor' || v.violationType === 'both'
  );
  
  if (hasChildLabor) {
    return 'moderate';
  }

  return 'limited';
}

/**
 * Load DOL data from external source
 * 
 * Note: In production, this should download and parse the annual DOL report
 * For now, we use the curated list above
 */
export async function loadDOLData(): Promise<DOLLaborData> {
  // Check cache
  if (dolDataCache && (Date.now() - dolDataCacheTimestamp) < CACHE_DURATION) {
    return dolDataCache;
  }

  try {
    // TODO: In production, download and parse DOL annual report
    // For now, use curated list
    const data: DOLLaborData = {
      violations: KNOWN_DOL_VIOLATIONS,
      lastUpdated: new Date().toISOString(),
    };

    dolDataCache = data;
    dolDataCacheTimestamp = Date.now();

    logger.debug('[DOL] Loaded DOL labor violation data:', {
      violationsCount: data.violations.length,
      lastUpdated: data.lastUpdated,
    });

    return data;
  } catch (error) {
    logger.error('[DOL] Error loading DOL data:', error);
    // Return empty data on error
    return {
      violations: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Initialize DOL data service
 * Call this on app startup to preload data
 */
export async function initializeDOLService(): Promise<void> {
  try {
    await loadDOLData();
    logger.info('[DOL] DOL labor data service initialized');
  } catch (error) {
    logger.error('[DOL] Error initializing DOL service:', error);
  }
}

