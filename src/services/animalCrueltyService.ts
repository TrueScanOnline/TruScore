/**
 * Animal Cruelty Service
 * Detects animal cruelty violations for CARE Pillar
 * Extends existing cruel parent detection with minor violations
 * 
 * Sources:
 * - Brand database (animalTesting field)
 * - PETA, HSUS, RSPCA data (via brand database)
 * - Known violation lists
 */

import { Product } from '../types/product';
import { getBrandData, isCruelParent, normalizeBrandNameForLookup } from '../data/brandDatabase';
import { logger } from '../utils/logger';

export interface AnimalCrueltyData {
  hasViolations: boolean;
  violationType: 'none' | 'minor' | 'major';
  violations: string[];
  sources: string[];
}

/**
 * Known brands with major animal cruelty violations
 * (factory farming, slaughter, cruelty, news tie)
 */
const MAJOR_ANIMAL_CRUELTY_BRANDS: Set<string> = new Set([
  // Major animal testing companies
  'unilever', 'procter & gamble', 'p&g', 'l\'oreal', 'loreal',
  'estee lauder', 'estée lauder', 'colgate-palmolive',
  'johnson & johnson', 'j&j', 'reckitt', 'reckitt benckiser',
  'rb', 'henkel', 'beiersdorf', 'shiseido', 'kao',
  'sc johnson', 's.c. johnson', 'clorox', 'church & dwight',
  'coty', 'revlon', 'avon', 'mary kay', 'amway',
  
  // Factory farming/slaughter
  'tyson', 'jbs', 'cargill', 'smithfield', 'perdue',
  'sanderson farms', 'pilgrim\'s pride', 'hormel',
]);

/**
 * Known brands with minor animal cruelty violations
 * (less severe but still concerning practices)
 */
const MINOR_ANIMAL_CRUELTY_BRANDS: Set<string> = new Set([
  // Brands with questionable practices but not major violations
  'nestle', 'nestlé', 'mars', 'mondelez', 'hershey',
  'ferrero', 'lindt', 'godiva',
]);

/**
 * Normalize brand name for lookup
 * ENHANCED: Uses shared normalization from brandDatabase for consistency
 */
function normalizeBrandName(brand: string): string {
  return normalizeBrandNameForLookup(brand);
}

/**
 * Check brand database for animal testing/cruelty
 */
function checkBrandDatabase(brandName: string): { type: 'none' | 'minor' | 'major'; source: string } | null {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return null;
  }
  
  // Check animal testing (major violation)
  if (brandData.animalTesting === true) {
    return { type: 'major', source: 'brand_database' };
  }
  
  // Check ethical rating (poor rating may indicate minor issues)
  if (brandData.ethicalRating === 'poor' && !brandData.animalTesting) {
    // Check if in known minor violations
    const normalized = normalizeBrandName(brandName);
    if (MINOR_ANIMAL_CRUELTY_BRANDS.has(normalized)) {
      return { type: 'minor', source: 'brand_database' };
    }
  }
  
  return null;
}

/**
 * Check known violation lists
 */
function checkKnownViolations(brandName: string): { type: 'minor' | 'major'; source: string } | null {
  const normalized = normalizeBrandName(brandName);
  
  // Check major violations first
  if (MAJOR_ANIMAL_CRUELTY_BRANDS.has(normalized)) {
    return { type: 'major', source: 'known_violations' };
  }
  
  // Check partial matches for major violations
  for (const majorBrand of MAJOR_ANIMAL_CRUELTY_BRANDS) {
    if (normalized.includes(majorBrand) || majorBrand.includes(normalized)) {
      return { type: 'major', source: 'known_violations' };
    }
  }
  
  // Check minor violations
  if (MINOR_ANIMAL_CRUELTY_BRANDS.has(normalized)) {
    return { type: 'minor', source: 'known_violations' };
  }
  
  // Check partial matches for minor violations
  for (const minorBrand of MINOR_ANIMAL_CRUELTY_BRANDS) {
    if (normalized.includes(minorBrand) || minorBrand.includes(normalized)) {
      return { type: 'minor', source: 'known_violations' };
    }
  }
  
  return null;
}

/**
 * Check for animal cruelty violations in a product
 * Returns violation data for CARE Pillar scoring
 */
export function checkAnimalCruelty(product: Product): AnimalCrueltyData {
  const violations: string[] = [];
  const sources: string[] = [];
  let violationType: 'none' | 'minor' | 'major' = 'none';
  
  // ENHANCED: Use enhanced brand extraction to get all brands
  const { extractAllBrands } = require('../utils/brandExtraction');
  const allBrands = extractAllBrands(product);
  
  if (allBrands.length === 0) {
    return {
      hasViolations: false,
      violationType: 'none',
      violations: [],
      sources: [],
    };
  }
  
  // ENHANCED: Check all brands found (not just the first one)
  // Try each brand until we find violations
  for (const brand of allBrands) {
    let foundMajor = false;
    
    // 1. Check using existing isCruelParent (major violation)
    if (isCruelParent(brand)) {
      violationType = 'major';
      violations.push(`major animal cruelty (cruel parent: ${brand})`);
      sources.push('brand_database_cruel_parent');
      foundMajor = true;
    }
    
    // 2. Check brand database (if no major found yet)
    if (!foundMajor) {
      const dbResult = checkBrandDatabase(brand);
      if (dbResult) {
        // Use the more severe violation type
        if (dbResult.type === 'major') {
          violationType = 'major';
          if (!violations.some(v => v.includes(dbResult.source))) {
            violations.push(`${dbResult.type} animal cruelty (${dbResult.source}: ${brand})`);
            sources.push(dbResult.source);
          }
          foundMajor = true;
        } else if (dbResult.type === 'minor' && violationType === 'none') {
          violationType = 'minor';
          if (!violations.some(v => v.includes(dbResult.source))) {
            violations.push(`${dbResult.type} animal cruelty (${dbResult.source}: ${brand})`);
            sources.push(dbResult.source);
          }
        }
      }
    }
    
    // 3. Check known violations list (only if no major violation found yet)
    if (!foundMajor) {
      const knownResult = checkKnownViolations(brand);
      if (knownResult) {
        // Use the more severe violation type
        if (knownResult.type === 'major') {
          violationType = 'major';
          if (!violations.some(v => v.includes(knownResult.source))) {
            violations.push(`${knownResult.type} animal cruelty (${knownResult.source}: ${brand})`);
            sources.push(knownResult.source);
          }
          foundMajor = true;
        } else if (knownResult.type === 'minor' && violationType === 'none') {
          violationType = 'minor';
          if (!violations.some(v => v.includes(knownResult.source))) {
            violations.push(`${knownResult.type} animal cruelty (${knownResult.source}: ${brand})`);
            sources.push(knownResult.source);
          }
        }
      }
    }
    
    // If we found a major violation, stop checking other brands
    if (foundMajor) {
      break;
    }
  }
  
  // 4. Check parent company (if available) - only if no violations found yet
  if (violationType === 'none') {
    const primaryBrand = allBrands[0];
    const brandData = getBrandData(primaryBrand);
    if (brandData?.parentCompany) {
      if (isCruelParent(brandData.parentCompany)) {
        violationType = 'major';
        violations.push('major animal cruelty (parent: cruel parent)');
        sources.push('brand_database_cruel_parent');
      }
      
      const parentDbResult = checkBrandDatabase(brandData.parentCompany);
      if (parentDbResult) {
        // Use the more severe violation type
        if (parentDbResult.type === 'major' || violationType === 'major') {
          violationType = 'major';
        } else if (parentDbResult.type === 'minor' && violationType === 'none') {
          violationType = 'minor';
        }
        
        violations.push(`${parentDbResult.type} animal cruelty (parent: ${brandData.parentCompany})`);
        sources.push('brand_database_parent');
      }
      
      const parentKnownResult = checkKnownViolations(brandData.parentCompany);
      if (parentKnownResult) {
        // Use the more severe violation type
        if (parentKnownResult.type === 'major' || violationType === 'major') {
          violationType = 'major';
        } else if (parentKnownResult.type === 'minor' && violationType === 'none') {
          violationType = 'minor';
        }
        
        if (!violations.some(v => v.includes('parent'))) {
          violations.push(`${parentKnownResult.type} animal cruelty (parent: ${brandData.parentCompany})`);
          sources.push('known_violations_parent');
        }
      }
    }
  }
  
  return {
    hasViolations: violationType !== 'none',
    violationType,
    violations,
    sources,
  };
}

/**
 * Check if brand has high-impact animal cruelty (for overlay penalty)
 */
export function hasHighImpactAnimalCruelty(brandName: string): boolean {
  if (!brandName) return false;
  
  // Check using existing isCruelParent
  if (isCruelParent(brandName)) {
    return true;
  }
  
  const brandData = getBrandData(brandName);
  if (brandData?.animalTesting === true) {
    return true;
  }
  
  if (brandData?.parentCompany) {
    if (isCruelParent(brandData.parentCompany)) {
      return true;
    }
    const parentData = getBrandData(brandData.parentCompany);
    if (parentData?.animalTesting === true) {
      return true;
    }
  }
  
  return false;
}

