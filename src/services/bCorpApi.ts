// B-Corp Directory API client
// Provides certified B-Corporation information
// Note: B Lab doesn't have a public API, but we can use structured data

import { Product } from '../types/product';
import { logger } from '../utils/logger';

// Note: B Lab doesn't offer a public API
// We'll use a structured approach with known B-Corp data
// This can be enhanced with web scraping or data downloads if needed

export interface BCorpData {
  companyName: string;
  isBCorp: boolean;
  certificationDate?: string;
  impactScore?: number;
  country?: string;
  industry?: string;
}

/**
 * Known B-Corporations (subset - can be expanded with full database)
 * Full list available at: https://www.bcorporation.net/
 */
const KNOWN_B_CORPS: Set<string> = new Set([
  // Food & Beverage
  'patagonia provisions', 'ben & jerry\'s', 'honest tea', 'stonyfield', 'cascadian farm',
  'annies', 'clif bar', 'luna bar', 'guayaki', 'numi tea', 'republic of tea',
  'new belgium brewing', 'sierra nevada', 'allbirds', 'toms',
  
  // Personal Care
  'dr. bronner\'s', 'method', 'seventh generation', 'tom\'s of maine', 'burts bees',
  'badger', 'alba botanica', 'jason', 'kiss my face',
  
  // Additional known B-Corps
  'patagonia', 'eileen fisher', 'warby parker', 'allbirds', 'toms',
  'greyston bakery', 'king arthur flour', 'alter eco', 'applegate',
  'cascadian farm', 'organic valley', 'stonyfield', 'honest tea',
]);

/**
 * Check if a company is a certified B-Corporation
 */
export function isBCorp(companyName: string): boolean {
  if (!companyName) return false;
  
  const normalized = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s&'\-]/g, '')
    .replace(/\s+/g, ' ');
  
  return KNOWN_B_CORPS.has(normalized);
}

/**
 * Get B-Corp data for a company
 */
export async function getBCorpData(companyName: string): Promise<BCorpData | null> {
  if (!companyName) {
    return null;
  }

  try {
    const isCertified = isBCorp(companyName);
    
    if (!isCertified) {
      return null;
    }

    // Return basic B-Corp data
    // Note: Full impact scores and certification dates would require database download
    return {
      companyName,
      isBCorp: true,
      // TODO: Enhance with full B-Corp database download for impact scores and dates
    };
  } catch (error) {
    logger.debug('Error getting B-Corp data:', error);
    return null;
  }
}

/**
 * Enrich product with B-Corp certification information
 */
export async function enrichProductWithBCorp(product: Product): Promise<Product> {
  if (!product.brands) {
    return product;
  }

  try {
    // Check if brand is a B-Corp
    const brandNames = product.brands.split(',').map((b: string) => b.trim());
    
    for (const brandName of brandNames) {
      const bCorpData = await getBCorpData(brandName);
      
      if (bCorpData && bCorpData.isBCorp) {
        // Store B-Corp data
        (product as any).b_corp = bCorpData;
        
        // Add B-Corp label if not already present
        if (!product.labels_tags) {
          product.labels_tags = [];
        }
        if (!product.labels_tags.includes('en:b-corp')) {
          product.labels_tags.push('en:b-corp');
        }
        
        logger.debug(`Enriched product with B-Corp certification: ${product.barcode} - ${brandName}`);
        break;
      }
    }
  } catch (error) {
    logger.debug('Error enriching product with B-Corp:', error);
  }

  return product;
}

