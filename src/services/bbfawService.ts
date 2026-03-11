/**
 * BBFAW (Business Benchmark on Farm Animal Welfare) Service
 * Integrates with Business Benchmark on Farm Animal Welfare data
 *
 * Source: BBFAW 2024 Report - https://www.bbfaw.com/media/2192/bbfaw-2024-report.pdf
 * Data: Extracted from bbfaw-2024-report.docx via scripts/extractBBFAW2024FromDocx.ts
 *
 * This service provides animal welfare tier data for ETHICS Pillar scoring.
 * Each match includes referenceUrl so users can see WHY and WHERE the score came from.
 */

import { logger } from '../utils/logger';
import { BBFAW_2024_COMPANIES } from '../data/bbfaw2024Data';

export type BBFAWTier = 1 | 2 | 3 | 4 | 5 | 6;

export type BBFAWImpactRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface BBFAWCompanyData {
  companyName: string;
  tier: BBFAWTier;
  impactRating?: BBFAWImpactRating;
  year?: number;
  /** Direct link to BBFAW report so users can see WHY this score was applied */
  referenceUrl?: string;
  reportSection?: string;
}

export interface BBFAWData {
  companies: BBFAWCompanyData[];
  lastUpdated: string;
}

// In-memory cache for BBFAW data
let bbfawDataCache: BBFAWData | null = null;
let bbfawDataCacheTimestamp: number = 0;
const CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year (BBFAW updates annually)

/** BBFAW 2024 companies - Ethics_Scoring_Specification.xlsx: Tier 1-6 + Impact A-F */
const BBFAW_COMPANIES: BBFAWCompanyData[] = BBFAW_2024_COMPANIES.map((c) => ({
  companyName: c.companyName,
  tier: c.tier as BBFAWTier,
  impactRating: c.impactRating as BBFAWImpactRating | undefined,
  year: c.year,
  referenceUrl: c.referenceUrl,
  reportSection: c.reportSection,
}));

/** Normalize for matching: lowercase, trim, accent-fold (Nestlé/Nestle → nestle) */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * Check if a company has BBFAW tier data.
 * Match: case-insensitive, accent-insensitive (Nestlé/Nestle both match).
 *
 * @param companyName - Company name to check (from product or resolved parent)
 * @returns BBFAW company data if found, null otherwise
 */
export function checkBBFAWTier(companyName: string): BBFAWCompanyData | null {
  if (!companyName || typeof companyName !== 'string') {
    return null;
  }

  const normalized = normalizeForMatch(companyName);
  if (!normalized) return null;

  const exactMatch = BBFAW_COMPANIES.find(
    (c) => normalizeForMatch(c.companyName) === normalized
  );
  return exactMatch ?? null;
}

/**
 * Get BBFAW violation severity based on tier (LEGACY - for fallback)
 * 
 * @param tier - BBFAW tier (1-6)
 * @returns Severity level: 'limited', 'moderate', or 'major'
 * @deprecated Use getBBFAWTierScore instead for new tier-based scoring
 */
export function getBBFAWViolationSeverity(tier: BBFAWTier | null): 'limited' | 'moderate' | 'major' {
  if (!tier) {
    return 'limited'; // No tier data
  }

  // Tier mapping (LEGACY):
  // Tier 1-2: Major concerns (Major violation: -15)
  // Tier 3-4: Moderate concerns (Moderate violation: -8)
  // Tier 5-6: Limited concerns (Limited violation: -4)
  if (tier <= 2) {
    return 'major';
  } else if (tier <= 4) {
    return 'moderate';
  } else {
    return 'limited';
  }
}

/**
 * Get BBFAW tier-based score - Ethics_Scoring_Specification.xlsx
 * Tier 1 = +6, Tier 2 = +4, Tier 3 = +2, Tier 4 = +1, Tier 5 = -4, Tier 6 = -6
 */
export function getBBFAWTierScore(tier: BBFAWTier | null): number {
  if (!tier) return 0;
  const MAP: Record<BBFAWTier, number> = {
    1: 6,
    2: 4,
    3: 2,
    4: 1,
    5: -4,
    6: -6,
  };
  return MAP[tier] ?? 0;
}

/**
 * Get BBFAW Impact Rating score - Ethics_Scoring_Specification.xlsx
 * A/B = +3, C/D = +1, E/F = -3
 */
export function getBBFAWImpactScore(rating: BBFAWImpactRating | null | undefined): number {
  if (!rating) return 0;
  if (rating === 'A' || rating === 'B') return 3;
  if (rating === 'C' || rating === 'D') return 1;
  if (rating === 'E' || rating === 'F') return -3;
  return 0;
}

/**
 * Check if BBFAW tier indicates good welfare (positive score)
 */
export function isBBFAWGoodWelfare(tier: BBFAWTier | null): boolean {
  return getBBFAWTierScore(tier) > 0;
}

/**
 * Check if BBFAW tier indicates poor welfare (negative score)
 */
export function isBBFAWPoorWelfare(tier: BBFAWTier | null): boolean {
  return getBBFAWTierScore(tier) < 0;
}

/**
 * Load BBFAW data from external source
 * 
 * Note: In production, this should download and parse the annual BBFAW report
 * For now, we use the curated list above
 */
export async function loadBBFAWData(): Promise<BBFAWData> {
  // Check cache
  if (bbfawDataCache && (Date.now() - bbfawDataCacheTimestamp) < CACHE_DURATION) {
    return bbfawDataCache;
  }

  try {
    // TODO: In production, download and parse BBFAW annual report
    // For now, use curated list
    const data: BBFAWData = {
      companies: BBFAW_COMPANIES,
      lastUpdated: new Date().toISOString(),
    };

    bbfawDataCache = data;
    bbfawDataCacheTimestamp = Date.now();

    logger.debug('[BBFAW] Loaded BBFAW data:', {
      companiesCount: data.companies.length,
      lastUpdated: data.lastUpdated,
    });

    return data;
  } catch (error) {
    logger.error('[BBFAW] Error loading BBFAW data:', error);
    // Return empty data on error
    return {
      companies: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Initialize BBFAW service
 * Call this on app startup to preload data
 */
export async function initializeBBFAWService(): Promise<void> {
  try {
    await loadBBFAWData();
    logger.info('[BBFAW] BBFAW service initialized');
  } catch (error) {
    logger.error('[BBFAW] Error initializing BBFAW service:', error);
  }
}

