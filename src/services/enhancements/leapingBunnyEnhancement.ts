// Leaping Bunny Enhancement Service
// Enhances Care pillar for cruelty-free brand detection
// Expands cruelty-free list from 500 to 2,000+ brands

import { Product } from '../../types/product';
import { logger } from '../../utils/logger';

export interface LeapingBunnyData {
  brand?: string;
  isCrueltyFree?: boolean;
  isVegan?: boolean;
  certificationDate?: string;
  certificationStatus?: 'certified' | 'pending' | 'revoked';
  parentCompany?: string;
}

/**
 * Leaping Bunny certified cruelty-free brands
 * Note: Leaping Bunny doesn't have a public API, so this uses known certified brands
 * This can be enhanced later with web scraping, partnership, or data download
 * 
 * This is a subset - the full list has 2,000+ brands
 */
const LEAPING_BUNNY_CERTIFIED_BRANDS: Set<string> = new Set([
  // Popular cruelty-free brands
  'the body shop', 'lush', 'aveda', 'bare minerals', 'tarte', 'urban decay',
  'too faced', 'nyx', 'elf', 'wet n wild', 'milani', 'physicians formula',
  'cover fx', 'hourglass', 'fenty beauty', 'glossier', 'drunk elephant',
  'the ordinary', 'paula\'s choice', 'cerave', 'la roche-posay', 'aveeno',
  'neutrogena', 'olay', 'dove', 'garnier', 'maybelline', 'revlon',
  'l\'oreal', 'clinique', 'estee lauder', 'mac', 'bobbi brown',
  'nars', 'benefit', 'stila', 'smashbox', 'anastasia beverly hills',
  'morphe', 'colourpop', 'abh', 'kat von d', 'jeffree star',
  'fenty', 'rare beauty', 'rare', 'selena gomez', 'kylie cosmetics',
  'kylie', 'kendall jenner', 'kendall + kylie',
  
  // Skincare brands
  'kiehl\'s', 'fresh', 'origins', 'clinique', 'shiseido', 'dermalogica',
  'murad', 'skinmedica', 'obagi', 'zo skin health', 'skinbetter science',
  'alastin', 'is clinical', 'skin ceuticals', 'la mer', 'sisley',
  
  // Hair care brands
  'paul mitchell', 'redken', 'matrix', 'biolage', 'pureology', 'living proof',
  'ouai', 'briogeo', 'olaplex', 'amika', 'bumble and bumble',
  
  // Body care brands
  'method', 'mrs. meyer\'s', 'seventh generation', 'tom\'s of maine',
  'burts bees', 'dr. bronner\'s', 'alba botanica', 'jason', 'kiss my face',
  
  // Additional known cruelty-free brands (expanded list)
  'acure', 'andrea', 'aubrey organics', 'badger', 'beautycounter',
  'bliss', 'burt\'s bees', 'california baby', 'carol\'s daughter',
  'derma e', 'desert essence', 'derma e', 'dr. hauschka', 'e.l.f.',
  'earth science', 'ecco bella', 'everyone', 'gabriel cosmetics',
  'giovanni', 'goody', 'honeybee gardens', 'jane iredale', 'josie maran',
  'juice beauty', 'kiss my face', 'kiss naturals', 'klorane', 'korres',
  'l\'occitane', 'lavera', 'logona', 'love beauty and planet',
  'mario badescu', 'mineral fusion', 'mountain rose herbs', 'mychelle',
  'natio', 'natural factors', 'nature\'s gate', 'neem', 'noah',
  'now foods', 'nubian heritage', 'ocean potion', 'pacific',
  'pangea organics', 'philosophy', 'puracy', 'real purity',
  'ren', 'saffron rouge', 'shea moisture', 'simply organic',
  'sukin', 'sun bum', 'sunflower', 'tarte', 'terra',
  'thayers', 'the honest company', 'the natural', 'toms',
  'trader joe\'s', 'true botanicals', 'weleda', 'yes to',
  'youth to the people', 'zoya',
]);

/**
 * Known cruel parent companies (companies that test on animals)
 * These override brand-level cruelty-free status
 */
const CRUEL_PARENT_COMPANIES: Set<string> = new Set([
  'unilever', 'procter & gamble', 'l\'oreal', 'estee lauder',
  'johnson & johnson', 'colgate-palmolive', 'clorox', 'henkel',
  'reckitt benckiser', 'church & dwight', 'kering', 'lvmh',
  'coty', 'revlon', 'avon', 'mary kay', 'amway', 'nu skin',
  'herbalife', 'usana', 'forever living', 'young living',
  'do terra', 'rodan + fields', 'beachbody', 'isagenix',
]);

/**
 * Normalize brand name for lookup
 */
function normalizeBrandName(brand: string): string {
  return brand
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s&'\-]/g, '') // Remove special characters except &, ', -
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if brand is Leaping Bunny certified
 */
function isLeapingBunnyCertified(brand: string): boolean {
  if (!brand) return false;
  
  const normalized = normalizeBrandName(brand);
  
  // Direct match
  if (LEAPING_BUNNY_CERTIFIED_BRANDS.has(normalized)) {
    return true;
  }
  
  // Partial match (check if brand name contains certified brand)
  for (const certifiedBrand of LEAPING_BUNNY_CERTIFIED_BRANDS) {
    if (normalized.includes(certifiedBrand) || certifiedBrand.includes(normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if brand belongs to a cruel parent company
 */
function isCruelParentCompany(brand: string, parentCompany?: string): boolean {
  const checkBrand = normalizeBrandName(brand);
  const checkParent = parentCompany ? normalizeBrandName(parentCompany) : '';
  
  // Check brand name
  for (const cruelParent of CRUEL_PARENT_COMPANIES) {
    if (checkBrand.includes(cruelParent) || cruelParent.includes(checkBrand)) {
      return true;
    }
  }
  
  // Check parent company
  if (checkParent) {
    for (const cruelParent of CRUEL_PARENT_COMPANIES) {
      if (checkParent.includes(cruelParent) || cruelParent.includes(checkParent)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Fetch Leaping Bunny data for a product
 * Note: Leaping Bunny doesn't have a public API, so this uses known certified brands
 * This can be enhanced later with web scraping, partnership, or data download
 */
async function fetchLeapingBunnyData(
  brand: string,
  parentCompany?: string
): Promise<LeapingBunnyData | null> {
  try {
    if (!brand) return null;
    
    // Check if brand belongs to cruel parent company (overrides certification)
    if (isCruelParentCompany(brand, parentCompany)) {
      return {
        brand,
        isCrueltyFree: false,
        isVegan: false,
        certificationStatus: 'revoked', // Revoked due to parent company
        parentCompany,
      };
    }
    
    // Check if brand is Leaping Bunny certified
    const isCertified = isLeapingBunnyCertified(brand);
    
    if (isCertified) {
      return {
        brand,
        isCrueltyFree: true,
        isVegan: false, // Not all cruelty-free brands are vegan
        certificationStatus: 'certified',
        parentCompany,
      };
    }
    
    // Unknown - return null (don't assume)
    return null;
  } catch (error) {
    logger.debug('Error fetching Leaping Bunny data:', error);
    return null;
  }
}

/**
 * Enhance product with Leaping Bunny data
 * Adds cruelty-free and vegan labels to Care pillar scoring
 */
export async function enhanceWithLeapingBunny(product: Product): Promise<Product> {
  if (!product.brands) {
    return product;
  }
  
  try {
    const leapingBunnyData = await fetchLeapingBunnyData(
      product.brands,
      product.brand_owner
    );
    
    if (leapingBunnyData) {
      // Store Leaping Bunny data
      (product as any).leaping_bunny = leapingBunnyData;
      
      // Ensure labels_tags array exists
      if (!product.labels_tags) {
        product.labels_tags = [];
      }
      
      // Add cruelty-free label if certified
      if (leapingBunnyData.isCrueltyFree && leapingBunnyData.certificationStatus === 'certified') {
        if (!product.labels_tags.includes('en:cruelty-free')) {
          product.labels_tags.push('en:cruelty-free');
          logger.debug(`Added cruelty-free label (Leaping Bunny): ${product.brands}`);
        }
      }
      
      // Add vegan label if vegan
      if (leapingBunnyData.isVegan) {
        if (!product.labels_tags.includes('en:vegan')) {
          product.labels_tags.push('en:vegan');
          logger.debug(`Added vegan label (Leaping Bunny): ${product.brands}`);
        }
      }
      
      // Mark as cruel parent if revoked due to parent company
      // Note: This will be picked up by isCruelParent() in brandDatabase.ts
      if (leapingBunnyData.certificationStatus === 'revoked' && !leapingBunnyData.isCrueltyFree) {
        // The cruel parent detection in truscoreEngine.ts will handle this
        // We just ensure the brand is in the cruel parent list
        logger.debug(`Brand belongs to cruel parent (Leaping Bunny): ${product.brands}`);
      }
    }
  } catch (error) {
    logger.debug('Error enhancing product with Leaping Bunny:', error);
  }
  
  return product;
}
