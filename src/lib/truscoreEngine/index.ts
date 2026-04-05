/**
 * TruScore Engine - Modular Pillar System
 *
 * This module orchestrates the calculation of all 4 pillars:
 * - Body Pillar (nutrition, additives, processing)
 * - Planet Pillar (environmental impact, palm oil, recyclability)
 * - Ethics Pillar (base 15 + BBFAW + KTC + certifications, capped 0–25)
 * - Open Pillar (transparency, ingredients disclosure, origin)
 *
 * Each pillar is calculated independently and can be tested/modified separately.
 */

import { Product } from '../../types/product';
import { ValuesPreferences } from '../../store/useValuesStore';
import { generateInsights } from '../valuesInsights';
import { logger } from '../../utils/logger';
import { powershellLogger } from '../../utils/powershellLogger';
import type { TruScoreAnalysis, FetchTraceEntry, PillarAnalysis, PillarAdjustmentWithSource } from '../../types/truscoreAnalysis';
import type { QueryKeyType } from '../../types/truscoreAnalysis';

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
  /** Optional authoritative link (same pattern as pillar adjustment referenceUrl). */
  referenceUrl?: string;
  /** Short label for the link button (default “Open reference” in UI). */
  referenceLabel?: string;
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
  /** Full analysis (fetch trace + per-pillar source attribution). Built when pillarDetails exist. */
  analysis?: TruScoreAnalysis;
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

  const calculationStartTime = Date.now();
  
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
    
    const calculationTime = Date.now() - calculationStartTime;
    
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
    result.analysis = buildTruScoreAnalysis(product, result) ?? undefined;

    // PowerShell logging for TruScore calculation details with timing
    powershellLogger.truScoreCalculationDetailed(
      product?.barcode || 'unknown',
      truscore,
      result.breakdown,
      {
        hasNutriScore,
        hasEcoScore,
        hasOrigin,
        calculationTime,
      },
      {
        body: bodyResult,
        planet: planetResult,
        ethics: ethicsResult,
        open: openResult,
      }
    );
    
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

/** Map product.source to display name for analysis logs */
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  openfoodfacts: 'Open Food Facts',
  openbeautyfacts: 'Open Beauty Facts',
  openpetfoodfacts: 'Open Pet Food Facts',
  openproductsfacts: 'Open Products Facts',
  sqlite: 'SQLite',
  cache: 'Cache',
  nzfcd: 'FSANZ (NZ)',
  afcd: 'FSANZ (AU)',
  spoonacular: 'Spoonacular',
  foodatlas: 'FoodAtlas',
  gs1: 'GS1',
  usda: 'USDA',
  healthcanada: 'Health Canada',
  ukfsa: 'UK FSA',
  efsa: 'EFSA',
  rasff: 'RASFF',
  web_search: 'Web search',
};

/** Best-available reference URLs for Ethics pillar. BBFAW 2024 only; pillar passes company-specific link when available. */
const ETHICS_REFERENCE_URLS: Record<string, string> = {
  'BBFAW': 'https://www.bbfaw.com/media/2192/bbfaw-2024-report.pdf#page=16',
};

/**
 * Infer source database and query key type for an adjustment from pillar and description.
 * productSourceDisplay = which DB provided the product used for scoring (e.g. "Open Food Facts").
 * For Ethics, also returns referenceUrl when we have a best-available official link (not the exact report).
 */
function inferAdjustmentSource(
  pillar: 'Body' | 'Planet' | 'Ethics' | 'Open',
  adj: { description: string; value: number; type: string },
  productSourceDisplay: string
): { sourceDatabase: string; queryKeyType: QueryKeyType; referenceUrl?: string } {
  const d = (adj.description || '').toLowerCase();
  if (pillar === 'Ethics') {
    if (d.includes('base score') || d.includes('assumes ethical')) return { sourceDatabase: 'Internal', queryKeyType: 'product_field' };
    if (d.includes('bbfaw')) return { sourceDatabase: 'BBFAW', queryKeyType: 'brand', referenceUrl: ETHICS_REFERENCE_URLS['BBFAW'] };
    if (d.includes('ktc') || d.includes('knowthechain') || d.includes('benchmark score'))
      return {
        sourceDatabase: 'KnowTheChain',
        queryKeyType: 'brand',
        referenceUrl: 'https://www.business-humanrights.org/en/from-us/knowthechain/food-and-beverage-benchmark/',
      };
    if (d.includes('ethics certifications') || d.includes('certifications –'))
      return { sourceDatabase: 'Open Food Facts + MSC API', queryKeyType: 'product_field' };
    return { sourceDatabase: 'Internal', queryKeyType: 'product_field' };
  }
  if (pillar === 'Body') {
    if (d.includes('base')) return { sourceDatabase: 'Internal', queryKeyType: 'product_field' };
    if (d.includes('nutri-score') || d.includes('nutriscore')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    if (d.includes('additive') || d.includes('iarc')) return { sourceDatabase: 'Additive DB + ' + productSourceDisplay, queryKeyType: 'product_field' };
    if (d.includes('nova') || d.includes('processing')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    if (d.includes('ewg')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
  }
  if (pillar === 'Planet') {
    if (d.includes('base')) return { sourceDatabase: 'Internal', queryKeyType: 'product_field' };
    if (d.includes('eco-score') || d.includes('ecoscore')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    if (d.includes('palm') || d.includes('rspo')) return { sourceDatabase: productSourceDisplay + ' + Brand DB', queryKeyType: 'brand' };
    if (d.includes('recycl') || d.includes('packaging')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    if (d.includes('overlay')) return { sourceDatabase: 'Brand DB', queryKeyType: 'parent' };
    if (d.includes('farming') || d.includes('low-impact')) return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
    return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
  }
  if (pillar === 'Open') {
    if (d.includes('base')) return { sourceDatabase: 'Internal', queryKeyType: 'product_field' };
    if (d.includes('brand') || d.includes('ownership') || d.includes('parent')) return { sourceDatabase: 'Brand DB', queryKeyType: 'brand' };
    return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
  }
  return { sourceDatabase: productSourceDisplay, queryKeyType: 'product_field' };
}

/**
 * Build full TruScore analysis from product (for fetch trace) and TruScore result (for pillar details).
 * Used for in-app "Score breakdown" and logging. 100% matches the score shown on screen.
 */
export function buildTruScoreAnalysis(
  product: Product | null | undefined,
  result: TruScoreResult
): TruScoreAnalysis | null {
  if (!product || !result.pillarDetails) return null;
  const fetchTrace: FetchTraceEntry[] = Array.isArray((product as any)._fetchTrace) ? (product as any)._fetchTrace : [];
  const productSourceDisplay = SOURCE_DISPLAY_NAMES[(product.source || '').toLowerCase()] || (product.source || 'Merged product');

  function toPillarAnalysis(
    pillarName: 'Body' | 'Planet' | 'Ethics' | 'Open',
    pr: { base: number; score: number; adjustments: Array<{ description: string; value: number; type: 'positive' | 'negative' | 'neutral'; referenceUrl?: string }> }
  ): PillarAnalysis {
    const adjustments: PillarAdjustmentWithSource[] = pr.adjustments.map((adj) => {
      const inferred = inferAdjustmentSource(pillarName, adj, productSourceDisplay);
      const referenceUrl = (adj as { referenceUrl?: string }).referenceUrl ?? inferred.referenceUrl;
      return {
        description: adj.description,
        value: adj.value,
        type: adj.type,
        sourceDatabase: inferred.sourceDatabase,
        queryKeyType: inferred.queryKeyType,
        ...(referenceUrl != null && { referenceUrl }),
      };
    });
    const sourcesUsed = new Map<string, { database: string; queryKeyType: QueryKeyType; returnedResult: boolean; order: number }>();
    adjustments.forEach((a, i) => {
      if (a.sourceDatabase && a.queryKeyType) {
        const key = `${a.sourceDatabase}|${a.queryKeyType}`;
        if (!sourcesUsed.has(key))
          sourcesUsed.set(key, { database: a.sourceDatabase, queryKeyType: a.queryKeyType, returnedResult: a.value !== 0, order: i + 1 });
      }
    });
    return {
      pillarName,
      baseScore: pr.base,
      finalScore: pr.score,
      adjustments,
      dataSourcesUsed: Array.from(sourcesUsed.values()),
    };
  }

  const pd = result.pillarDetails;
  const analysis: TruScoreAnalysis = {
    barcode: product.barcode || 'unknown',
    totalScore: result.truscore,
    fetchTrace,
    pillars: {
      Body: toPillarAnalysis('Body', pd.body),
      Planet: toPillarAnalysis('Planet', pd.planet),
      Ethics: toPillarAnalysis('Ethics', pd.ethics),
      Open: toPillarAnalysis('Open', pd.open),
    },
    generatedAt: Date.now(),
  };
  return analysis;
}

// Export individual pillar functions for testing
export { calculateBodyPillar, calculatePlanetPillar, calculateEthicsPillar, calculateOpenPillar };
export type { BodyPillarResult, PlanetPillarResult, EthicsPillarResult, OpenPillarResult };
export type { TruScoreAnalysis, FetchTraceEntry, PillarAnalysis, PillarAdjustmentWithSource } from '../../types/truscoreAnalysis';

