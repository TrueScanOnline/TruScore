/**
 * Ethical Consumer Service
 * Integrates with Ethical Consumer magazine/website data
 * 
 * Source: https://www.ethicalconsumer.org/
 * Data Format: Website/publications
 * 
 * This service provides ethical ratings for CARE Pillar scoring
 * ENHANCED: Uses fuzzy matching for better company name matching
 */

import { logger } from '../utils/logger';
import { findBestFuzzyMatch } from '../utils/fuzzyMatching';

export interface EthicalConsumerRating {
  companyName: string;
  ethicalScore?: number; // 0-20 (Ethical Consumer scoring)
  animalTesting?: boolean;
  environmentalRating?: 'excellent' | 'good' | 'fair' | 'poor';
  humanRightsRating?: 'excellent' | 'good' | 'fair' | 'poor';
  year?: number;
}

export interface EthicalConsumerData {
  ratings: EthicalConsumerRating[];
  lastUpdated: string;
}

// In-memory cache for Ethical Consumer data
let ethicalConsumerDataCache: EthicalConsumerData | null = null;
let ethicalConsumerDataCacheTimestamp: number = 0;
const CACHE_DURATION = 180 * 24 * 60 * 60 * 1000; // 6 months

/**
 * Known companies with Ethical Consumer ratings
 * This is a curated list based on Ethical Consumer magazine ratings
 * 
 * Note: In production, this should be scraped from Ethical Consumer website or API
 * For now, we use a curated list of known companies
 */
const KNOWN_ETHICAL_CONSUMER_RATINGS: EthicalConsumerRating[] = [
  // Companies with poor ethical ratings
  { companyName: 'Nestlé', ethicalScore: 2, animalTesting: false, environmentalRating: 'poor', humanRightsRating: 'poor', year: 2023 },
  { companyName: 'Unilever', ethicalScore: 5, animalTesting: true, environmentalRating: 'fair', humanRightsRating: 'fair', year: 2023 },
  { companyName: 'Procter & Gamble', ethicalScore: 3, animalTesting: true, environmentalRating: 'poor', humanRightsRating: 'fair', year: 2023 },
  { companyName: 'L\'Oréal', ethicalScore: 4, animalTesting: true, environmentalRating: 'fair', humanRightsRating: 'fair', year: 2023 },
  
  // Companies with fair ethical ratings
  { companyName: 'Mars', ethicalScore: 6, animalTesting: false, environmentalRating: 'fair', humanRightsRating: 'poor', year: 2023 },
  { companyName: 'Mondelez', ethicalScore: 7, animalTesting: false, environmentalRating: 'fair', humanRightsRating: 'fair', year: 2023 },
  
  // Companies with good ethical ratings
  { companyName: 'Danone', ethicalScore: 12, animalTesting: false, environmentalRating: 'good', humanRightsRating: 'good', year: 2023 },
  { companyName: 'Ben & Jerry\'s', ethicalScore: 14, animalTesting: false, environmentalRating: 'good', humanRightsRating: 'good', year: 2023 },
];

/**
 * Check if a company has Ethical Consumer rating
 * ENHANCED: Uses fuzzy matching for better company name matching
 * 
 * @param companyName - Company name to check
 * @returns Ethical Consumer rating if found
 */
export function checkEthicalConsumerRating(companyName: string): EthicalConsumerRating | null {
  if (!companyName) {
    return null;
  }

  const companyNameLower = companyName.toLowerCase().trim();

  // Try exact match first (fastest)
  const exactMatch = KNOWN_ETHICAL_CONSUMER_RATINGS.find(r => 
    r.companyName.toLowerCase() === companyNameLower
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match (fast)
  const partialMatch = KNOWN_ETHICAL_CONSUMER_RATINGS.find(r => 
    companyNameLower.includes(r.companyName.toLowerCase()) ||
    r.companyName.toLowerCase().includes(companyNameLower)
  );
  if (partialMatch) {
    return partialMatch;
  }

  // FUZZY MATCHING: Use fuzzy matching for better accuracy
  const candidateNames = KNOWN_ETHICAL_CONSUMER_RATINGS.map(r => r.companyName);
  const fuzzyMatch = findBestFuzzyMatch(companyName, candidateNames, 0.75);
  
  if (fuzzyMatch && fuzzyMatch.matched) {
    const matchedRating = KNOWN_ETHICAL_CONSUMER_RATINGS.find(r => 
      r.companyName.toLowerCase() === fuzzyMatch.matchedBrand.toLowerCase()
    );
    if (matchedRating) {
      logger.debug('[EthicalConsumer] Fuzzy match found:', {
        input: companyName,
        matched: fuzzyMatch.matchedBrand,
        confidence: fuzzyMatch.confidence,
        algorithm: fuzzyMatch.algorithm,
      });
      return matchedRating;
    }
  }

  return null;
}

/**
 * Get Ethical Consumer violation severity
 * 
 * @param rating - Ethical Consumer rating
 * @returns Severity level: 'limited', 'moderate', or 'major'
 */
export function getEthicalConsumerViolationSeverity(rating: EthicalConsumerRating | null): 'limited' | 'moderate' | 'major' {
  if (!rating) {
    return 'limited'; // No rating
  }

  // Ethical Consumer scores: 0-20 (higher is better)
  // Low scores indicate poor ethical practices
  if (rating.ethicalScore !== undefined) {
    if (rating.ethicalScore <= 4) {
      return 'major';
    } else if (rating.ethicalScore <= 8) {
      return 'moderate';
    } else {
      return 'limited';
    }
  }

  // Fallback to rating-based assessment
  if (rating.animalTesting === true || 
      rating.environmentalRating === 'poor' || 
      rating.humanRightsRating === 'poor') {
    return 'moderate';
  }

  return 'limited';
}

/**
 * Load Ethical Consumer data from external source
 * 
 * Note: In production, this should scrape Ethical Consumer website or use API
 * For now, we use the curated list above
 */
export async function loadEthicalConsumerData(): Promise<EthicalConsumerData> {
  // Check cache
  if (ethicalConsumerDataCache && (Date.now() - ethicalConsumerDataCacheTimestamp) < CACHE_DURATION) {
    return ethicalConsumerDataCache;
  }

  try {
    // TODO: In production, scrape Ethical Consumer website or use API
    // For now, use curated list
    const data: EthicalConsumerData = {
      ratings: KNOWN_ETHICAL_CONSUMER_RATINGS,
      lastUpdated: new Date().toISOString(),
    };

    ethicalConsumerDataCache = data;
    ethicalConsumerDataCacheTimestamp = Date.now();

    logger.debug('[EthicalConsumer] Loaded Ethical Consumer data:', {
      ratingsCount: data.ratings.length,
      lastUpdated: data.lastUpdated,
    });

    return data;
  } catch (error) {
    logger.error('[EthicalConsumer] Error loading Ethical Consumer data:', error);
    // Return empty data on error
    return {
      ratings: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Initialize Ethical Consumer service
 * Call this on app startup to preload data
 */
export async function initializeEthicalConsumerService(): Promise<void> {
  try {
    await loadEthicalConsumerData();
    logger.info('[EthicalConsumer] Ethical Consumer service initialized');
  } catch (error) {
    logger.error('[EthicalConsumer] Error initializing Ethical Consumer service:', error);
  }
}

