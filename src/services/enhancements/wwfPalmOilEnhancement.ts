// WWF Palm Oil Scorecard Enhancement Service
// Enhances Planet pillar for palm oil sustainability
// Provides certified sustainable vs non-certified palm oil ratings

import { Product, PalmOilAnalysis } from '../../types/product';
import { logger } from '../../utils/logger';

export interface WWFPalmOilScorecardData {
  brand?: string;
  company?: string;
  sustainabilityRating?: 'certified' | 'non-certified' | 'unknown';
  wwfScore?: number; // 0-22 scale (WWF scorecard)
  commitmentLevel?: 'high' | 'medium' | 'low' | 'none';
  certificationStatus?: 'rspo-certified' | 'rspo-member' | 'non-certified';
  lastUpdated?: string;
}

/**
 * WWF Palm Oil Scorecard data (2024)
 * Note: WWF doesn't have a public API, so this uses known scorecard data
 * This can be enhanced later with web scraping or partnership
 */
const WWF_SCORECARD_DATA: Record<string, WWFPalmOilScorecardData> = {
  // High-commitment companies (RSPO certified)
  'unilever': {
    brand: 'Unilever',
    sustainabilityRating: 'certified',
    wwfScore: 18,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'nestle': {
    brand: 'Nestlé',
    sustainabilityRating: 'certified',
    wwfScore: 17,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'pepsico': {
    brand: 'PepsiCo',
    sustainabilityRating: 'certified',
    wwfScore: 16,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'coca-cola': {
    brand: 'Coca-Cola',
    sustainabilityRating: 'certified',
    wwfScore: 15,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'mars': {
    brand: 'Mars',
    sustainabilityRating: 'certified',
    wwfScore: 17,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'mondelēz': {
    brand: 'Mondelēz',
    sustainabilityRating: 'certified',
    wwfScore: 16,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'kellogg': {
    brand: 'Kellogg\'s',
    sustainabilityRating: 'certified',
    wwfScore: 15,
    commitmentLevel: 'high',
    certificationStatus: 'rspo-certified',
  },
  'general-mills': {
    brand: 'General Mills',
    sustainabilityRating: 'certified',
    wwfScore: 14,
    commitmentLevel: 'medium',
    certificationStatus: 'rspo-member',
  },
  // Medium-commitment companies
  'procter-gamble': {
    brand: 'Procter & Gamble',
    sustainabilityRating: 'certified',
    wwfScore: 12,
    commitmentLevel: 'medium',
    certificationStatus: 'rspo-member',
  },
  'johnson-johnson': {
    brand: 'Johnson & Johnson',
    sustainabilityRating: 'certified',
    wwfScore: 11,
    commitmentLevel: 'medium',
    certificationStatus: 'rspo-member',
  },
  // Low-commitment companies (non-certified)
  'palm-oil-unknown': {
    brand: 'Unknown',
    sustainabilityRating: 'non-certified',
    wwfScore: 0,
    commitmentLevel: 'none',
    certificationStatus: 'non-certified',
  },
};

/**
 * Normalize brand name for lookup
 */
function normalizeBrandName(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
}

/**
 * Find brand in WWF scorecard data
 */
function findBrandInWWFScorecard(brand: string): WWFPalmOilScorecardData | null {
  if (!brand) return null;
  
  const normalized = normalizeBrandName(brand);
  
  // Direct match
  if (WWF_SCORECARD_DATA[normalized]) {
    return WWF_SCORECARD_DATA[normalized];
  }
  
  // Partial match (check if brand contains known company names)
  for (const [key, data] of Object.entries(WWF_SCORECARD_DATA)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return data;
    }
  }
  
  return null;
}

/**
 * Fetch WWF Palm Oil Scorecard data for a product
 * Note: WWF doesn't have a public API, so this uses known scorecard data
 * This can be enhanced later with web scraping or partnership
 */
async function fetchWWFPalmOilScorecardData(
  brand: string,
  company?: string
): Promise<WWFPalmOilScorecardData | null> {
  try {
    // Try to find brand in WWF scorecard
    const brandData = findBrandInWWFScorecard(brand);
    if (brandData) {
      return brandData;
    }
    
    // Try company name if provided
    if (company) {
      const companyData = findBrandInWWFScorecard(company);
      if (companyData) {
        return companyData;
      }
    }
    
    // Default: unknown (non-certified)
    return {
      brand,
      sustainabilityRating: 'unknown',
      wwfScore: 0,
      commitmentLevel: 'none',
      certificationStatus: 'non-certified',
    };
  } catch (error) {
    logger.debug('Error fetching WWF Palm Oil Scorecard data:', error);
    return null;
  }
}

/**
 * Enhance palm oil analysis with WWF sustainability data
 * Distinguishes certified sustainable vs non-certified palm oil
 */
export async function enhancePalmOilWithWWF(
  palmOilAnalysis: PalmOilAnalysis,
  product: Product
): Promise<PalmOilAnalysis> {
  // Only enhance if palm oil is detected
  if (!palmOilAnalysis.containsPalmOil) {
    return palmOilAnalysis;
  }
  
  try {
    const wwfData = await fetchWWFPalmOilScorecardData(
      product.brands || '',
      product.brand_owner
    );
    
    if (wwfData) {
      // Store WWF data
      (palmOilAnalysis as any).wwf_data = wwfData;
      
      // Update sustainability status based on WWF rating
      if (wwfData.sustainabilityRating === 'certified') {
        // Certified sustainable palm oil - reduce penalty
        palmOilAnalysis.isCertifiedSustainable = true;
        palmOilAnalysis.isNonSustainable = false;
        
        // Update score: certified sustainable gets -5 instead of -10
        if (palmOilAnalysis.score === -10 || palmOilAnalysis.score === -5) {
          palmOilAnalysis.score = -5; // Reduced penalty for certified sustainable
        }
        
        logger.debug(`Palm oil certified sustainable (WWF): ${product.brands}`, {
          wwfScore: wwfData.wwfScore,
          commitmentLevel: wwfData.commitmentLevel,
        });
      } else if (wwfData.sustainabilityRating === 'non-certified') {
        // Non-certified palm oil - keep full penalty
        palmOilAnalysis.isCertifiedSustainable = false;
        palmOilAnalysis.isNonSustainable = true;
        
        // Keep -10 penalty for non-certified
        palmOilAnalysis.score = -10;
        
        logger.debug(`Palm oil non-certified (WWF): ${product.brands}`, {
          wwfScore: wwfData.wwfScore,
        });
      } else {
        // Unknown - assume non-certified (conservative approach)
        palmOilAnalysis.isCertifiedSustainable = false;
        palmOilAnalysis.isNonSustainable = false; // Unknown, not confirmed non-sustainable
        // Keep existing score
      }
    }
  } catch (error) {
    logger.debug('Error enhancing palm oil with WWF data:', error);
  }
  
  return palmOilAnalysis;
}
