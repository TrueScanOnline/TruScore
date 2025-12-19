/**
 * Match Quality Logger
 * 
 * Comprehensive logging for fuzzy matching quality monitoring.
 * Tracks match accuracy, confidence scores, and false positives/negatives
 * for continuous improvement of the matching system.
 */

import { logger } from './logger';
import { BrandMatchResult } from '../services/brandMatchingService';

interface MatchQualityMetrics {
  totalMatches: number;
  exactMatches: number;
  aliasMatches: number;
  fuzzyMatches: number;
  noMatches: number;
  averageConfidence: number;
  highConfidenceMatches: number; // ≥90%
  mediumConfidenceMatches: number; // 75-89%
  lowConfidenceMatches: number; // <75%
  matchTypes: {
    exact: number;
    alias: number;
    fuzzy: number;
    none: number;
  };
}

// In-memory metrics (can be persisted to analytics service)
let matchQualityMetrics: MatchQualityMetrics = {
  totalMatches: 0,
  exactMatches: 0,
  aliasMatches: 0,
  fuzzyMatches: 0,
  noMatches: 0,
  averageConfidence: 0,
  highConfidenceMatches: 0,
  mediumConfidenceMatches: 0,
  lowConfidenceMatches: 0,
  matchTypes: {
    exact: 0,
    alias: 0,
    fuzzy: 0,
    none: 0,
  },
};

/**
 * Log match quality for monitoring and analytics
 */
export function logMatchQuality(
  barcode: string,
  productName: string,
  brandMatches: BrandMatchResult[],
  context: string = 'general'
): void {
  if (brandMatches.length === 0) {
    matchQualityMetrics.noMatches++;
    matchQualityMetrics.totalMatches++;
    logger.debug('[MatchQuality] No matches found:', {
      barcode,
      productName: productName?.substring(0, 50),
      context,
    });
    return;
  }

  // Update metrics
  matchQualityMetrics.totalMatches++;
  
  const bestMatch = brandMatches[0];
  const confidence = bestMatch.confidence;
  const matchType = bestMatch.matchType;

  // Update match type counts
  matchQualityMetrics.matchTypes[matchType] = (matchQualityMetrics.matchTypes[matchType] || 0) + 1;

  // Update confidence buckets
  if (confidence >= 90) {
    matchQualityMetrics.highConfidenceMatches++;
  } else if (confidence >= 75) {
    matchQualityMetrics.mediumConfidenceMatches++;
  } else {
    matchQualityMetrics.lowConfidenceMatches++;
  }

  // Update average confidence
  const totalConfidence = matchQualityMetrics.averageConfidence * (matchQualityMetrics.totalMatches - 1) + confidence;
  matchQualityMetrics.averageConfidence = totalConfidence / matchQualityMetrics.totalMatches;

  // Log match details
  logger.debug('[MatchQuality] Match found:', {
    barcode,
    productName: productName?.substring(0, 50),
    context,
    matchType,
    confidence,
    matchedBrand: bestMatch.matchedData?.name || bestMatch.brand,
    algorithm: bestMatch.algorithm,
    allMatchesCount: brandMatches.length,
  });

  // Log low-confidence matches for review
  if (confidence < 75) {
    logger.warn('[MatchQuality] Low-confidence match (needs review):', {
      barcode,
      productName: productName?.substring(0, 50),
      brand: bestMatch.brand,
      matchedBrand: bestMatch.matchedData?.name || 'N/A',
      confidence,
      matchType,
      context,
    });
  }
}

/**
 * Get current match quality metrics
 */
export function getMatchQualityMetrics(): MatchQualityMetrics {
  return { ...matchQualityMetrics };
}

/**
 * Reset match quality metrics (useful for testing)
 */
export function resetMatchQualityMetrics(): void {
  matchQualityMetrics = {
    totalMatches: 0,
    exactMatches: 0,
    aliasMatches: 0,
    fuzzyMatches: 0,
    noMatches: 0,
    averageConfidence: 0,
    highConfidenceMatches: 0,
    mediumConfidenceMatches: 0,
    lowConfidenceMatches: 0,
    matchTypes: {
      exact: 0,
      alias: 0,
      fuzzy: 0,
      none: 0,
    },
  };
}

/**
 * Log match quality summary (call periodically for monitoring)
 */
export function logMatchQualitySummary(): void {
  const metrics = getMatchQualityMetrics();
  
  if (metrics.totalMatches === 0) {
    return;
  }

  const exactMatchRate = (metrics.matchTypes.exact / metrics.totalMatches) * 100;
  const fuzzyMatchRate = (metrics.matchTypes.fuzzy / metrics.totalMatches) * 100;
  const noMatchRate = (metrics.noMatches / metrics.totalMatches) * 100;
  const highConfidenceRate = (metrics.highConfidenceMatches / metrics.totalMatches) * 100;

  logger.info('[MatchQuality] Summary:', {
    totalMatches: metrics.totalMatches,
    exactMatchRate: `${exactMatchRate.toFixed(1)}%`,
    fuzzyMatchRate: `${fuzzyMatchRate.toFixed(1)}%`,
    noMatchRate: `${noMatchRate.toFixed(1)}%`,
    averageConfidence: `${metrics.averageConfidence.toFixed(1)}%`,
    highConfidenceRate: `${highConfidenceRate.toFixed(1)}%`,
    matchTypeDistribution: metrics.matchTypes,
  });
}
