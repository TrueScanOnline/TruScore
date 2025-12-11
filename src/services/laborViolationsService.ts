/**
 * Labor Violations Service
 * Detects labor violations and human exploitation for CARE Pillar
 * 
 * Sources:
 * - Brand database (laborPractices field)
 * - Buycott API (ethical data) - FREE tier available
 * - Open Corporates (company data) - FREE tier available
 * - DOL (US Department of Labor) - future integration
 */

import { Product } from '../types/product';
import { getBrandData } from '../data/brandDatabase';
import { logger } from '../utils/logger';
import { fetchProductFromBuycott } from './buycottApi';

export interface LaborViolationData {
  hasViolations: boolean;
  violationType: 'none' | 'minor' | 'major';
  violations: string[];
  sources: string[];
}

/**
 * Known brands with major labor violations (child labor, slavery)
 * Based on public reports, investigations, and NGO data
 */
const MAJOR_LABOR_VIOLATION_BRANDS: Set<string> = new Set([
  // Cocoa/Chocolate (known child labor issues)
  'nestle', 'nestlé', 'mars', 'hershey', 'ferrero', 'mondelez',
  'lindt', 'godiva', 'ghirardelli', 'cadbury',
  
  // Garments/Textiles (known labor issues)
  'nike', 'adidas', 'h&m', 'zara', 'forever 21', 'shein',
  'boohoo', 'asos', 'primark', 'walmart', 'target',
  
  // Electronics (known labor issues)
  'apple', 'samsung', 'huawei', 'xiaomi', 'foxconn',
  
  // Agriculture (known labor issues)
  'dole', 'chiquita', 'del monte', 'fresh del monte',
]);

/**
 * Known brands with minor labor violations (under-pay, over-work, etc.)
 * Based on public reports and investigations
 */
const MINOR_LABOR_VIOLATION_BRANDS: Set<string> = new Set([
  // Retail/Fast Food (wage violations)
  'mcdonald\'s', 'mcdonalds', 'starbucks', 'walmart', 'amazon',
  'target', 'home depot', 'lowes', 'kroger', 'albertsons',
  
  // Manufacturing (workplace violations)
  'foxconn', 'pegatron', 'wistron',
]);

/**
 * Normalize brand name for lookup
 */
function normalizeBrandName(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s&'\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check brand database for labor practices
 */
function checkBrandDatabase(brandName: string): { type: 'none' | 'minor' | 'major'; source: string } | null {
  const brandData = getBrandData(brandName);
  if (!brandData) {
    return null;
  }
  
  // Check labor practices rating
  if (brandData.laborPractices === 'poor') {
    // Poor rating could indicate major or minor - check known violations
    const normalized = normalizeBrandName(brandName);
    if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
      return { type: 'major', source: 'brand_database' };
    }
    return { type: 'minor', source: 'brand_database' };
  }
  
  return null;
}

/**
 * Check known violation lists
 */
function checkKnownViolations(brandName: string): { type: 'minor' | 'major'; source: string } | null {
  const normalized = normalizeBrandName(brandName);
  
  // Check major violations first
  if (MAJOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return { type: 'major', source: 'known_violations' };
  }
  
  // Check partial matches for major violations
  for (const majorBrand of MAJOR_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(majorBrand) || majorBrand.includes(normalized)) {
      return { type: 'major', source: 'known_violations' };
    }
  }
  
  // Check minor violations
  if (MINOR_LABOR_VIOLATION_BRANDS.has(normalized)) {
    return { type: 'minor', source: 'known_violations' };
  }
  
  // Check partial matches for minor violations
  for (const minorBrand of MINOR_LABOR_VIOLATION_BRANDS) {
    if (normalized.includes(minorBrand) || minorBrand.includes(normalized)) {
      return { type: 'minor', source: 'known_violations' };
    }
  }
  
  return null;
}

/**
 * Check for labor violations in a product
 * Returns violation data for CARE Pillar scoring
 * 
 * Note: This is synchronous for performance. Buycott API integration
 * would be async and can be added in product enhancement layer.
 */
export function checkLaborViolations(product: Product): LaborViolationData {
  const violations: string[] = [];
  const sources: string[] = [];
  let violationType: 'none' | 'minor' | 'major' = 'none';
  
  if (!product.brands) {
    return {
      hasViolations: false,
      violationType: 'none',
      violations: [],
      sources: [],
    };
  }
  
  const brandName = product.brands.split(',')[0].trim();
  const normalized = normalizeBrandName(brandName);
  
  // 1. Check brand database
  const dbResult = checkBrandDatabase(brandName);
  if (dbResult) {
    violationType = dbResult.type;
    violations.push(`${dbResult.type} labor violation (brand database)`);
    sources.push(dbResult.source);
  }
  
  // 2. Check known violations list
  const knownResult = checkKnownViolations(brandName);
  if (knownResult) {
    // Use the more severe violation type
    if (knownResult.type === 'major' || violationType === 'major') {
      violationType = 'major';
    } else if (knownResult.type === 'minor' && violationType === 'none') {
      violationType = 'minor';
    }
    
    if (!violations.some(v => v.includes(knownResult.source))) {
      violations.push(`${knownResult.type} labor violation (${knownResult.source})`);
      sources.push(knownResult.source);
    }
  }
  
  // 3. Check Buycott data (if available in product)
  // Note: Buycott data should be fetched in product enhancement layer
  const buycottData = (product as any).buycott_data;
  if (buycottData && buycottData.laborViolations) {
    const buycottType = buycottData.laborViolations === 'major' ? 'major' : 'minor';
    if (buycottType === 'major' || violationType === 'major') {
      violationType = 'major';
    } else if (buycottType === 'minor' && violationType === 'none') {
      violationType = 'minor';
    }
    violations.push(`${buycottType} labor violation (Buycott API)`);
    sources.push('buycott_api');
  }
  
  // 4. Check parent company (if available)
  const brandData = getBrandData(brandName);
  if (brandData?.parentCompany) {
    const parentResult = checkBrandDatabase(brandData.parentCompany);
    if (parentResult) {
      // Use the more severe violation type
      if (parentResult.type === 'major' || violationType === 'major') {
        violationType = 'major';
      } else if (parentResult.type === 'minor' && violationType === 'none') {
        violationType = 'minor';
      }
      
      violations.push(`${parentResult.type} labor violation (parent: ${brandData.parentCompany})`);
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
        violations.push(`${parentKnownResult.type} labor violation (parent: ${brandData.parentCompany})`);
        sources.push('known_violations_parent');
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
 * Check if brand has high-impact labor violations (for overlay penalty)
 */
export function hasHighImpactLaborViolations(brandName: string): boolean {
  if (!brandName) return false;
  
  const normalized = normalizeBrandName(brandName);
  const brandData = getBrandData(brandName);
  
  // Check if brand or parent has poor labor practices
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

