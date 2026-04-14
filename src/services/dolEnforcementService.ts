// DOL (US Department of Labor) Enforcement Data Service
// Provides labor violation data from DOL Open Data Portal
// FREE API - JSON/CSV downloads available
// NON-BLOCKING: Async background service, doesn't affect product display

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'dol_enforcement_';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (enforcement data doesn't change often)

export interface DOLViolation {
  violationId: string;
  companyName: string;
  violationType: string;
  violationDate: string;
  penalty?: number;
  status: string;
  description: string;
  url?: string;
}

/**
 * Check for DOL labor violations by company/brand name
 * NON-BLOCKING: Fast timeout (3 seconds), returns empty array if slow
 * Uses DOL Open Data Portal API: https://enforcedata.dol.gov/
 */
export async function checkDOLViolations(
  companyName?: string,
  brand?: string
): Promise<DOLViolation[]> {
  if (!companyName && !brand) {
    return [];
  }

  try {
    // Try to get from cache first
    const searchTerm = companyName || brand || 'unknown';
    const cacheKey = `${CACHE_KEY_PREFIX}${searchTerm.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await getCachedViolations(cacheKey);
    if (cached) {
      return filterCompanySpecificViolations(cached, companyName, brand);
    }

    const violations: DOLViolation[] = [];
    
    try {
      // DOL Open Data Portal API
      // Note: DOL enforcement data API structure may vary
      // Try the datasets API endpoint first
      const searchQuery = encodeURIComponent(companyName || brand || '');
      // Try DOL API endpoint - may need to use datasets API
      // Alternative endpoint: https://apiprod.dol.gov/v4/datasets
      const url = `https://apiprod.dol.gov/v4/datasets?search=${searchQuery}&format=json`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Rveel/1.0.0',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000); // 3 second timeout (non-blocking)
          return controller.signal;
        })(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // No violations found
        }
        logger.debug(`DOL API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      // Parse DOL API response (structure may vary)
      // DOL Open Data Portal may return different structures
      // Handle both array and object responses, and nested structures
      let records: any[] = [];
      
      if (Array.isArray(data)) {
        records = data;
      } else if (data.results && Array.isArray(data.results)) {
        records = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        records = data.data;
      } else if (data.items && Array.isArray(data.items)) {
        records = data.items;
      } else if (data.records && Array.isArray(data.records)) {
        records = data.records;
      } else if (typeof data === 'object' && Object.keys(data).length > 0) {
        // Try to find any array in the response
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            records = data[key];
            break;
          }
        }
      }
      
      for (const record of records.slice(0, 10)) {
        // Extract violation data (field names may vary - DOL uses various formats)
        // Try multiple field name variations
        const violationId = record.id || record.violation_id || record.case_number || record.case_id || record.record_id || `dol-${Date.now()}-${Math.random()}`;
        const company = record.company_name || record.employer_name || record.employer || record.name || record.company || record.establishment_name || companyName || 'Unknown Company';
        const violationType = record.violation_type || record.type || record.category || record.violation_category || record.nature_of_violation || 'Labor Violation';
        const violationDate = record.violation_date || record.date || record.finding_date || record.inspection_date || record.case_date || new Date().toISOString();
        const penalty = record.penalty || record.penalty_amount || record.fine || record.total_penalties || undefined;
        const status = record.status || record.case_status || record.violation_status || 'Active';
        const description = record.description || record.violation_description || record.summary || record.nature_of_violation || record.violation || 'DOL enforcement action';
        const url = record.url || record.detail_url || record.link || `https://enforcedata.dol.gov/`;
        
        // Only add if we have at least a company name
        if (company && company !== 'Unknown Company') {
          violations.push({
            violationId,
            companyName: company,
            violationType,
            violationDate,
            penalty,
            status,
            description,
            url,
          });
        }
      }
    } catch (error) {
      // Non-blocking: Log and continue without violations
      logger.debug('DOL enforcement data fetch error (non-critical):', error);
      return [];
    }
    
    // Cache results if any found
    if (violations.length > 0) {
      await cacheViolations(cacheKey, violations);
      return filterCompanySpecificViolations(violations, companyName, brand);
    }
    
    return violations;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Error checking DOL violations (non-critical):`, errorMessage);
    return [];
  }
}

/**
 * Filter violations to be company-specific
 */
function filterCompanySpecificViolations(
  violations: DOLViolation[],
  companyName?: string,
  brand?: string
): DOLViolation[] {
  if (!companyName && !brand) {
    return violations;
  }

  const searchTerms: string[] = [];
  if (companyName) {
    searchTerms.push(companyName.toLowerCase());
    // Also search for partial matches
    const words = companyName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    searchTerms.push(...words);
  }
  if (brand) {
    searchTerms.push(brand.toLowerCase());
    const words = brand.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    searchTerms.push(...words);
  }

  return violations.filter(violation => {
    const companyLower = violation.companyName.toLowerCase();
    return searchTerms.some(term => companyLower.includes(term));
  });
}

/**
 * Cache violation data
 */
async function cacheViolations(key: string, violations: DOLViolation[]): Promise<void> {
  try {
    const data = {
      violations,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching DOL violations:', error);
  }
}

/**
 * Get cached violation data
 */
async function getCachedViolations(key: string): Promise<DOLViolation[] | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data.violations || null;
  } catch (error) {
    logger.debug('Error getting cached DOL violations:', error);
    return null;
  }
}

