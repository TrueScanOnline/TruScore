/**
 * TruScore Engine - Modular Pillar System
 * 
 * This module orchestrates the calculation of all 4 pillars:
 * - Body Pillar (nutrition, additives, processing)
 * - Planet Pillar (environmental impact, palm oil, recyclability)
 * - Ethics Pillar (ethical certifications, recalls, brand ethics)
 * - Open Pillar (transparency, ingredients disclosure, origin)
 * 
 * Each pillar is calculated independently and can be tested/modified separately.
 */

import { Product } from '../../types/product';
import { ValuesPreferences } from '../../store/useValuesStore';
import { generateInsights } from '../valuesInsights';
import { logger } from '../../utils/logger';
import { powershellLogger } from '../../utils/powershellLogger';

// Import individual pillar calculators
import { calculateBodyPillar, BodyPillarResult } from './pillars/bodyPillar';
import { calculatePlanetPillar, PlanetPillarResult } from './pillars/planetPillar';
import { calculateEthicsPillar, EthicsPillarResult } from './pillars/ethicsPillar';
import { calculateOpenPillar, OpenPillarResult } from './pillars/openPillar';

export interface Insight {
  type: 'geopolitical' | 'ethical' | 'environmental';
  reason: string;
  source?: string;
  color: string;
}

export interface TruScoreResult {
  truscore: number;
  breakdown: {
    Body: number;
    Planet: number;
    Ethics: number;
    Open: number;
  };
  hasNutriScore?: boolean;
  hasEcoScore?: boolean;
  hasOrigin?: boolean;
  insights?: Insight[];
  // Detailed pillar results for analysis
  pillarDetails?: {
    body: BodyPillarResult;
    planet: PlanetPillarResult;
        ethics: EthicsPillarResult;
    open: OpenPillarResult;
  };
}

/**
 * Calculate TruScore v1.4 - Full spec implementation using modular pillars
 * 
 * All pillars start at base 15, then apply adjustments.
 * 
 * @param product - Product data to score
 * @param preferences - Optional user values preferences for generating insights
 * @returns TruScore result with total score, breakdown, and optional insights
 */
export function calculateTruScore(
  product: Product | null | undefined,
  preferences?: ValuesPreferences
): TruScoreResult {
  // Input validation
  if (!product || typeof product !== 'object') {
    logger.warn('[truscoreEngine] Invalid product input: product is null or not an object');
    return {
      truscore: 0,
      breakdown: { Body: 0, Planet: 0, Ethics: 0, Open: 0 },
      hasNutriScore: false,
      hasEcoScore: false,
      hasOrigin: false,
    };
  }
  
  // Validate that required fields are present
  if (!product.barcode && !product.product_name && !product.product_name_en) {
    logger.warn('[truscoreEngine] Product missing required fields: barcode or product_name');
  }
  
  // Validate array types to prevent runtime errors
  if (product.labels_tags && !Array.isArray(product.labels_tags)) {
    logger.warn(`[truscoreEngine] Invalid labels_tags: expected array, got ${typeof product.labels_tags}`);
    product.labels_tags = [];
  }
  if (product.ingredients_analysis_tags && !Array.isArray(product.ingredients_analysis_tags)) {
    logger.warn(`[truscoreEngine] Invalid ingredients_analysis_tags: expected array, got ${typeof product.ingredients_analysis_tags}`);
    product.ingredients_analysis_tags = [];
  }
  if (product.additives_tags && !Array.isArray(product.additives_tags)) {
    logger.warn(`[truscoreEngine] Invalid additives_tags: expected array, got ${typeof product.additives_tags}`);
    product.additives_tags = [];
  }
  if (product.packagings && !Array.isArray(product.packagings)) {
    logger.warn(`[truscoreEngine] Invalid packagings: expected array, got ${typeof product.packagings}`);
    product.packagings = [];
  }

  try {
    // Calculate each pillar independently
    const bodyResult = calculateBodyPillar(product);
    const planetResult = calculatePlanetPillar(product);
    const ethicsResult = calculateEthicsPillar(product);
    const openResult = calculateOpenPillar(product);
    
    // Extract scores - ensure all are valid numbers (safety validation)
    const body = typeof bodyResult.score === 'number' && !isNaN(bodyResult.score) ? bodyResult.score : 0;
    const planet = typeof planetResult.score === 'number' && !isNaN(planetResult.score) ? planetResult.score : 0;
    const ethics = typeof ethicsResult.score === 'number' && !isNaN(ethicsResult.score) ? ethicsResult.score : 0;
    const open = typeof openResult.score === 'number' && !isNaN(openResult.score) ? openResult.score : 0;
    
    // Total with bounds checking (0-100)
    const truscore = Math.max(0, Math.min(100, Math.round(body + planet + ethics + open)));
    
    // Generate insights if preferences provided
    const insights = preferences ? generateInsights(product, preferences) : [];
    
    // Determine metadata
    const hasNutriScore = !!product.nutriscore_grade;
    const hasEcoScore = !!product.ecoscore_grade;
    
    // Check origin status
    const hasOriginTags = Array.isArray(product.origins_tags) && product.origins_tags.length > 0;
    const hasManufacturingTags = Array.isArray(product.manufacturing_places_tags) && product.manufacturing_places_tags.length > 0;
    const hasOriginString = !!(product.origins && typeof product.origins === 'string' && product.origins.trim().length > 0);
    const hasManufacturingString = !!(product.manufacturing_places && typeof product.manufacturing_places === 'string' && product.manufacturing_places.trim().length > 0);
    const placeholderValues = ['unknown', 'n/a', 'not available', 'missing', 'not disclosed', 'not specified'];
    const originArrayValues = [
      ...(Array.isArray(product.origins_tags) ? product.origins_tags.map(v => String(v).toLowerCase()) : []),
      ...(Array.isArray(product.manufacturing_places_tags) ? product.manufacturing_places_tags.map(v => String(v).toLowerCase()) : []),
    ];
    const originString = (product.origins || product.manufacturing_places || '').toString().toLowerCase();
    const allOriginValues = [...originArrayValues, originString].join(' ');
    const hasOrigin: boolean = (hasOriginTags || hasManufacturingTags || hasOriginString || hasManufacturingString) &&
      !placeholderValues.some(placeholder => allOriginValues.includes(placeholder));
    
    const result: TruScoreResult = {
      truscore,
      breakdown: {
        Body: body,
        Planet: planet,
        Ethics: ethics,
        Open: open,
      },
      hasNutriScore,
      hasEcoScore,
      hasOrigin,
      insights: insights.length > 0 ? insights : undefined,
      pillarDetails: {
        body: bodyResult,
        planet: planetResult,
        ethics: ethicsResult,
        open: openResult,
      },
    };
    
    // PowerShell logging for TruScore calculation details
    powershellLogger.log('SUCCESS', 'TRUSCORE_CALCULATION', `TruScore Calculated: ${result.truscore}/100`, {
      barcode: product?.barcode,
      breakdown: result.breakdown,
      hasNutriScore: result.hasNutriScore,
      hasEcoScore: result.hasEcoScore,
      hasOrigin: result.hasOrigin,
      insightsCount: insights.length,
      bodyDetails: bodyResult.details,
      planetDetails: planetResult.details,
      ethicsDetails: ethicsResult.details,
      openDetails: openResult.details,
    });
    
    return result;
  } catch (error) {
    // Error handling - log detailed error and return safe default
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('[truscoreEngine] Error calculating TruScore:', {
      message: errorMessage,
      stack: errorStack,
      productBarcode: product?.barcode || 'unknown',
      productName: product?.product_name || 'unknown',
    });
    
    // Return safe default with null truscore to indicate calculation failure
    return {
      truscore: 0,
      breakdown: { Body: 0, Planet: 0, Ethics: 0, Open: 0 },
      hasNutriScore: false,
      hasEcoScore: false,
      hasOrigin: false,
    };
  }
}

// Export individual pillar functions for testing
export { calculateBodyPillar, calculatePlanetPillar, calculateEthicsPillar, calculateOpenPillar };
export type { BodyPillarResult, PlanetPillarResult, EthicsPillarResult, OpenPillarResult };

