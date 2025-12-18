/**
 * Geo-Aware Product Service
 * Prioritizes country-specific data sources based on user location
 */

import { getUserCountryCode } from '../utils/countryDetection';
import { logger } from '../utils/logger';

/**
 * Country-specific data source priority mapping
 * Sources are ordered by priority (highest first)
 */
const COUNTRY_DATA_SOURCE_PRIORITY: Record<string, string[]> = {
  US: ['usda', 'fda', 'openfoodfacts', 'healthcanada'],
  CA: ['healthcanada', 'cfia', 'openfoodfacts', 'usda'],
  AU: ['fsanz', 'afcd', 'openfoodfacts', 'usda'],
  NZ: ['fsanz', 'nzfcd', 'openfoodfacts', 'usda'],
  UK: ['ukfsa', 'efsa', 'openfoodfacts', 'usda'],
  GB: ['ukfsa', 'efsa', 'openfoodfacts', 'usda'], // GB is same as UK
  // EU countries
  FR: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  DE: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  IT: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  ES: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  NL: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  BE: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  AT: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  SE: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  DK: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  FI: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  PL: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  PT: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  GR: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  IE: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  CZ: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  HU: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  RO: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  SK: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  BG: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  HR: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  LT: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  LV: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  SI: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  EE: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  CY: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  MT: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  LU: ['efsa', 'rasff', 'openfoodfacts', 'usda'],
  // Default fallback
  DEFAULT: ['openfoodfacts', 'usda', 'healthcanada'],
};

/**
 * Get country-specific data sources in priority order
 * 
 * @param countryCode - ISO country code (e.g., 'US', 'CA', 'AU')
 * @returns Array of data source names in priority order
 */
export function getCountrySpecificDataSources(countryCode?: string | null): string[] {
  const code = (countryCode || getUserCountryCode() || 'DEFAULT').toUpperCase();
  const sources = COUNTRY_DATA_SOURCE_PRIORITY[code] || COUNTRY_DATA_SOURCE_PRIORITY.DEFAULT;
  
  logger.debug(`Country-specific data sources for ${code}: ${sources.join(', ')}`);
  
  return sources;
}

/**
 * Check if a data source should be prioritized for a country
 */
export function shouldPrioritizeSource(
  source: string,
  countryCode?: string | null
): boolean {
  const prioritizedSources = getCountrySpecificDataSources(countryCode);
  return prioritizedSources.includes(source.toLowerCase());
}

/**
 * Get priority score for a data source based on country
 * Higher score = higher priority
 */
export function getSourcePriorityScore(
  source: string,
  countryCode?: string | null
): number {
  const prioritizedSources = getCountrySpecificDataSources(countryCode);
  const index = prioritizedSources.findIndex(s => s === source.toLowerCase());
  
  if (index === -1) {
    return 0; // Not prioritized
  }
  
  // Return inverse index (first = highest priority)
  return prioritizedSources.length - index;
}

/**
 * Sort data sources by country-specific priority
 */
export function sortSourcesByPriority(
  sources: string[],
  countryCode?: string | null
): string[] {
  return [...sources].sort((a, b) => {
    const scoreA = getSourcePriorityScore(a, countryCode);
    const scoreB = getSourcePriorityScore(b, countryCode);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Get region-specific regulations info
 */
export function getRegionSpecificRegulations(countryCode?: string | null): {
  allergenWarnings?: string[];
  certifications?: string[];
  recalls?: string[];
} {
  const code = (countryCode || getUserCountryCode() || '').toUpperCase();
  
  const regulations: Record<string, {
    allergenWarnings?: string[];
    certifications?: string[];
    recalls?: string[];
  }> = {
    US: {
      allergenWarnings: ['FDA requires labeling of 8 major allergens'],
      recalls: ['FDA Recalls', 'Recalls.gov'],
    },
    CA: {
      allergenWarnings: ['Health Canada requires labeling of priority allergens'],
      recalls: ['CFIA Recalls', 'Health Canada Recalls'],
    },
    EU: {
      allergenWarnings: ['EU requires labeling of 14 allergens'],
      certifications: ['EU Organic', 'Fair Trade', 'Rainforest Alliance'],
      recalls: ['RASFF Alerts', 'EFSA Notifications'],
    },
    AU: {
      allergenWarnings: ['FSANZ requires labeling of priority allergens'],
      recalls: ['FSANZ Recalls'],
    },
    NZ: {
      allergenWarnings: ['FSANZ requires labeling of priority allergens'],
      recalls: ['FSANZ Recalls'],
    },
  };
  
  // Check if it's an EU country
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
  ];
  
  if (euCountries.includes(code)) {
    return regulations.EU || {};
  }
  
  return regulations[code] || {};
}
