// OpenCorporates API client
// Provides parent-subsidiary company relationships
// Free tier available (with rate limits)

import { Product } from '../types/product';
import { logger } from '../utils/logger';
import { fetchWithRateLimit } from '../utils/timeoutHelper';

const OPENCORPORATES_API_BASE = 'https://api.opencorporates.com/v0.4';
const USER_AGENT = 'TrueScan-FoodScanner/1.0.0';

// Note: OpenCorporates API requires API key (free tier available)
// Get your key at: https://opencorporates.com/api_accounts/new
// Store in environment variable: EXPO_PUBLIC_OPENCORPORATES_API_KEY
const OPENCORPORATES_API_KEY = process.env.EXPO_PUBLIC_OPENCORPORATES_API_KEY || '';

export interface OpenCorporatesCompanyData {
  companyName?: string;
  companyNumber?: string;
  jurisdiction?: string;
  parentCompany?: string;
  subsidiaries?: string[];
  status?: string;
  incorporationDate?: string;
}

/**
 * Search for company information in OpenCorporates
 * Used for parent-subsidiary relationship mapping
 */
export async function searchCompanyInOpenCorporates(companyName: string, countryCode?: string): Promise<OpenCorporatesCompanyData | null> {
  // Skip if no API key configured
  if (!OPENCORPORATES_API_KEY) {
    logger.debug('OpenCorporates API key not configured, skipping company lookup');
    return null;
  }

  try {
    // Build search query
    let url = `${OPENCORPORATES_API_BASE}/companies/search?q=${encodeURIComponent(companyName)}&api_token=${OPENCORPORATES_API_KEY}`;
    
    if (countryCode) {
      url += `&jurisdiction_code=${countryCode.toLowerCase()}`;
    }

    const response = await fetchWithRateLimit(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    }, 'opencorporates');

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug(`OpenCorporates: Company not found: ${companyName}`);
        return null;
      }
      logger.debug(`OpenCorporates API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (!data || !data.results || !data.results.companies || data.results.companies.length === 0) {
      return null;
    }

    const company = data.results.companies[0].company;
    
    // Extract parent-subsidiary relationships (may require additional API calls)
    return {
      companyName: company.name,
      companyNumber: company.company_number,
      jurisdiction: company.jurisdiction_code,
      status: company.current_status,
      incorporationDate: company.incorporation_date,
      // Note: Parent-subsidiary relationships may require Relationships File or additional API calls
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`OpenCorporates API error for ${companyName}:`, errorMessage);
    return null;
  }
}

/**
 * Enrich product with parent-subsidiary company information
 */
export async function enrichProductWithOpenCorporates(product: Product): Promise<Product> {
  if (!product.brands) {
    return product;
  }

  try {
    // Extract company name from brand
    const companyName = product.brands.split(',')[0].trim();
    const companyData = await searchCompanyInOpenCorporates(companyName);
    
    if (companyData) {
      // Store OpenCorporates data for reference
      (product as any).opencorporates_data = companyData;
      
      logger.debug(`Enriched product with OpenCorporates data: ${product.barcode}`);
    }
  } catch (error) {
    logger.debug('Error enriching product with OpenCorporates:', error);
  }

  return product;
}

