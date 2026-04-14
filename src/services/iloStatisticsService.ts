// ILO (International Labour Organization) Statistics Service
// Provides labor statistics and forced labor data
// FREE API - JSON format via ILOSTAT SDMX API
// NON-BLOCKING: Async background service, doesn't affect product display

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CACHE_KEY_PREFIX = 'ilo_statistics_';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days (statistics don't change often)

export interface ILOStatistics {
  country: string;
  indicator: string;
  value: number;
  year: number;
  source: string;
  url?: string;
}

export interface ILOLaborViolation {
  country: string;
  violationType: 'child_labor' | 'forced_labor' | 'wage_violation' | 'safety_violation';
  severity: 'high' | 'medium' | 'low';
  year: number;
  description: string;
  source: string;
  url?: string;
}

/**
 * Check for ILO labor violations by country
 * NON-BLOCKING: Fast timeout (3 seconds), returns empty array if slow
 * Uses ILOSTAT SDMX API: https://www.ilo.org/sdmx/rest/
 */
export async function checkILOViolations(
  countryCode?: string,
  companyName?: string
): Promise<ILOLaborViolation[]> {
  if (!countryCode) {
    return [];
  }

  try {
    // Try to get from cache first
    const cacheKey = `${CACHE_KEY_PREFIX}${countryCode.toLowerCase()}`;
    const cached = await getCachedViolations(cacheKey);
    if (cached) {
      return cached;
    }

    const violations: ILOLaborViolation[] = [];
    
    try {
      // ILO SDMX API endpoint (corrected)
      // Base URL: https://sdmx.ilo.org/rest
      // Note: ILO SDMX API is complex and may require proper dataflow IDs
      // For now, we'll use a simplified approach that may not return data
      // In production, this should be enhanced with proper SDMX dataflow IDs
      
      // ILO API may require authentication or specific dataflow IDs
      // For labor violations, we'll rely on other sources (DOL, Walk Free)
      // This service is a placeholder for future ILO integration
      
      // Return empty array - ILO integration requires proper SDMX setup
      logger.debug('ILO Statistics: SDMX API requires proper dataflow IDs and setup');
      return [];
      
      /* Future implementation:
      const baseUrl = 'https://sdmx.ilo.org/rest';
      const dataflowUrl = `${baseUrl}/dataflow/ILO/all/latest`;
      
      const response = await fetch(dataflowUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Rveel/1.0.0',
        },
        signal: (() => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 3000);
          return controller.signal;
        })(),
      });
      */
    } catch (error) {
      // Non-blocking: Log and continue without violations
      logger.debug('ILO statistics fetch error (non-critical):', error);
      return [];
    }
    
    // Cache results if any found
    if (violations.length > 0) {
      await cacheViolations(cacheKey, violations);
    }
    
    return violations;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.debug(`Error checking ILO violations (non-critical):`, errorMessage);
    return [];
  }
}

/**
 * Get ILO labor statistics for a country
 * Returns general statistics (not violations)
 */
export async function getILOStatistics(
  countryCode: string,
  indicators?: string[]
): Promise<ILOStatistics[]> {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}stats_${countryCode.toLowerCase()}`;
    const cached = await getCachedStatistics(cacheKey);
    if (cached) {
      return cached;
    }

    // Implementation similar to checkILOViolations but returns statistics
    // This is a placeholder - actual implementation depends on ILO API structure
    return [];
  } catch (error) {
    logger.debug('Error getting ILO statistics (non-critical):', error);
    return [];
  }
}

/**
 * Cache violation data
 */
async function cacheViolations(key: string, violations: ILOLaborViolation[]): Promise<void> {
  try {
    const data = {
      violations,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching ILO violations:', error);
  }
}

/**
 * Get cached violation data
 */
async function getCachedViolations(key: string): Promise<ILOLaborViolation[] | null> {
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
    logger.debug('Error getting cached ILO violations:', error);
    return null;
  }
}

/**
 * Cache statistics data
 */
async function cacheStatistics(key: string, statistics: ILOStatistics[]): Promise<void> {
  try {
    const data = {
      statistics,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    logger.debug('Error caching ILO statistics:', error);
  }
}

/**
 * Get cached statistics data
 */
async function getCachedStatistics(key: string): Promise<ILOStatistics[] | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age > CACHE_DURATION) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return data.statistics || null;
  } catch (error) {
    logger.debug('Error getting cached ILO statistics:', error);
    return null;
  }
}

