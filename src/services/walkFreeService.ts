/**
 * Walk Free Global Slavery Index (GSI) Service
 * Integrates with Walk Free Foundation's Global Slavery Index data
 * 
 * Source: https://www.walkfree.org/projects/the-global-slavery-index/
 * Data Format: Dataset downloads (CSV/Excel), annual reports
 * 
 * This service provides modern slavery data for CARE Pillar scoring
 */

import { logger } from '../utils/logger';

export interface WalkFreeViolation {
  country: string;
  countryCode?: string;
  prevalence: number; // Prevalence per 1000 population
  vulnerability: number; // Vulnerability score (0-100)
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  sector?: string;
  year?: number;
}

export interface WalkFreeData {
  violations: WalkFreeViolation[];
  lastUpdated: string;
}

// In-memory cache for Walk Free data
let walkFreeDataCache: WalkFreeData | null = null;
let walkFreeDataCacheTimestamp: number = 0;
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year (GSI updates annually)

/**
 * Known countries with modern slavery violations from Walk Free GSI
 * This is a curated list based on Walk Free's Global Slavery Index reports
 * 
 * Note: In production, this should be loaded from a downloaded/parsed GSI dataset
 * For now, we use a curated list of known high-risk countries
 */
const KNOWN_WALK_FREE_VIOLATIONS: WalkFreeViolation[] = [
  // Very High Risk Countries
  { country: 'North Korea', countryCode: 'KP', prevalence: 104.6, vulnerability: 95, riskLevel: 'very_high', year: 2023 },
  { country: 'Eritrea', countryCode: 'ER', prevalence: 90.3, vulnerability: 92, riskLevel: 'very_high', year: 2023 },
  { country: 'Mauritania', countryCode: 'MR', prevalence: 32, vulnerability: 88, riskLevel: 'very_high', year: 2023 },
  { country: 'Saudi Arabia', countryCode: 'SA', prevalence: 21.3, vulnerability: 87, riskLevel: 'very_high', year: 2023 },
  { country: 'Turkey', countryCode: 'TR', prevalence: 15.6, vulnerability: 85, riskLevel: 'very_high', year: 2023 },
  
  // High Risk Countries (common manufacturing/agriculture sources)
  { country: 'China', countryCode: 'CN', prevalence: 5.4, vulnerability: 75, riskLevel: 'high', year: 2023 },
  { country: 'India', countryCode: 'IN', prevalence: 8, vulnerability: 72, riskLevel: 'high', year: 2023 },
  { country: 'Bangladesh', countryCode: 'BD', prevalence: 5.9, vulnerability: 78, riskLevel: 'high', year: 2023 },
  { country: 'Pakistan', countryCode: 'PK', prevalence: 16.8, vulnerability: 74, riskLevel: 'high', year: 2023 },
  { country: 'Indonesia', countryCode: 'ID', prevalence: 1.2, vulnerability: 68, riskLevel: 'high', year: 2023 },
  { country: 'Malaysia', countryCode: 'MY', prevalence: 10.1, vulnerability: 70, riskLevel: 'high', year: 2023 },
  { country: 'Thailand', countryCode: 'TH', prevalence: 7.6, vulnerability: 69, riskLevel: 'high', year: 2023 },
  { country: 'Vietnam', countryCode: 'VN', prevalence: 1.2, vulnerability: 67, riskLevel: 'high', year: 2023 },
  { country: 'Philippines', countryCode: 'PH', prevalence: 1.6, vulnerability: 66, riskLevel: 'high', year: 2023 },
  { country: 'Brazil', countryCode: 'BR', prevalence: 1.6, vulnerability: 65, riskLevel: 'high', year: 2023 },
  { country: 'Mexico', countryCode: 'MX', prevalence: 2.6, vulnerability: 64, riskLevel: 'high', year: 2023 },
  
  // Medium Risk Countries
  { country: 'Colombia', countryCode: 'CO', prevalence: 1.2, vulnerability: 58, riskLevel: 'medium', year: 2023 },
  { country: 'Guatemala', countryCode: 'GT', prevalence: 1.8, vulnerability: 60, riskLevel: 'medium', year: 2023 },
  { country: 'Honduras', countryCode: 'HN', prevalence: 1.4, vulnerability: 59, riskLevel: 'medium', year: 2023 },
  { country: 'Dominican Republic', countryCode: 'DO', prevalence: 1.1, vulnerability: 57, riskLevel: 'medium', year: 2023 },
];

/**
 * Check if a country has Walk Free modern slavery violations
 * 
 * @param countryCode - ISO country code (e.g., 'CN', 'IN', 'BD')
 * @param countryName - Country name (fallback if code not available)
 * @returns Walk Free violation data if found
 */
export function checkWalkFreeViolations(
  countryCode?: string,
  countryName?: string
): WalkFreeViolation | null {
  if (!countryCode && !countryName) {
    return null;
  }

  // Try to find by country code first
  if (countryCode) {
    const violation = KNOWN_WALK_FREE_VIOLATIONS.find(v => 
      v.countryCode?.toLowerCase() === countryCode.toLowerCase()
    );
    if (violation) {
      return violation;
    }
  }

  // Fallback to country name
  if (countryName) {
    const countryNameLower = countryName.toLowerCase();
    const violation = KNOWN_WALK_FREE_VIOLATIONS.find(v => 
      v.country.toLowerCase().includes(countryNameLower) ||
      countryNameLower.includes(v.country.toLowerCase())
    );
    if (violation) {
      return violation;
    }
  }

  return null;
}

/**
 * Get Walk Free violation severity based on risk level
 * 
 * @param violation - Walk Free violation found
 * @returns Severity level: 'limited', 'moderate', or 'major'
 */
export function getWalkFreeViolationSeverity(violation: WalkFreeViolation | null): 'limited' | 'moderate' | 'major' {
  if (!violation) {
    return 'limited'; // No violation
  }

  // Map risk levels to severity
  switch (violation.riskLevel) {
    case 'very_high':
    case 'high':
      return 'major';
    case 'medium':
      return 'moderate';
    case 'low':
    default:
      return 'limited';
  }
}

/**
 * Load Walk Free GSI data from external source
 * 
 * Note: In production, this should download and parse the GSI dataset
 * For now, we use the curated list above
 */
export async function loadWalkFreeData(): Promise<WalkFreeData> {
  // Check cache
  if (walkFreeDataCache && (Date.now() - walkFreeDataCacheTimestamp) < CACHE_DURATION) {
    return walkFreeDataCache;
  }

  try {
    // TODO: In production, download and parse GSI dataset
    // For now, use curated list
    const data: WalkFreeData = {
      violations: KNOWN_WALK_FREE_VIOLATIONS,
      lastUpdated: new Date().toISOString(),
    };

    walkFreeDataCache = data;
    walkFreeDataCacheTimestamp = Date.now();

    logger.debug('[WalkFree] Loaded Walk Free GSI data:', {
      violationsCount: data.violations.length,
      lastUpdated: data.lastUpdated,
    });

    return data;
  } catch (error) {
    logger.error('[WalkFree] Error loading Walk Free data:', error);
    // Return empty data on error
    return {
      violations: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Initialize Walk Free service
 * Call this on app startup to preload data
 */
export async function initializeWalkFreeService(): Promise<void> {
  try {
    await loadWalkFreeData();
    logger.info('[WalkFree] Walk Free GSI service initialized');
  } catch (error) {
    logger.error('[WalkFree] Error initializing Walk Free service:', error);
  }
}

