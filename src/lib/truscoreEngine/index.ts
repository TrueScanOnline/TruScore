/**
 * TruScore Engine - Modular Pillar System
 *
 * This module orchestrates the calculation of all 4 pillars:
 * - Body Pillar (nutrition, additives, processing)
 * - Planet Pillar (Eco-Score v19 + packaging fallback per Annex v2; palm display-only)
 * - Ethics Pillar (base 15 + BBFAW + KTC + certifications, capped 0–25)
 * - Open Pillar (transparency, ingredients disclosure, origin)
 *
 * Each pillar is calculated independently and can be tested/modified separately.
 */

import { Product } from '../../types/product';
import { AlertsPreferences } from '../../store/useAlertsStore';
import { generateInsights } from '../alertsInsights';
import { isMvpLegacyAlertsInsightsEnabled } from '../../config/mvpRuntimeGates';
import {
  stripUnauthoredScoringFieldsFromContribution,
  toScoringProduct,
} from '../../contributions/eligibilityBoundary';
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

/** Optional overrides for scoring (e.g. user-chosen Planet packaging jurisdiction). */
export type TruScoreScoringContext = {
  /** When set, merged onto the product as `true_scan_market` for Planet packaging fallback. */
  planetMarket?: 'AU' | 'NZ';
  /**
   * Verified + canonically promoted contribution evidence authorised to reach existing scorers.
   * Pending evidence must not be passed here.
   */
  promotedContributionEvidence?: import('../../contributions/types').ContributionEvidence[];
};

export interface TruScoreResult {
  /**
   * Overall TruScore 0–100, or null when scoring is unavailable / non-assessment
   * (technical calculation failure — never a substantive numeric score).
   */
  truscore: number | null;
  breakdown: {
    Body: number | null;
    Planet: number | null;
    Ethics: number | null;
    Open: number | null;
  };
  /** True when a technical scoring failure prevented assessment (distinct from genuine numeric 0). */
  scoringUnavailable?: boolean;
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

/** Identifiable non-assessment result for technical calculation failures. */
function unavailableTruScoreResult(): TruScoreResult {
  return {
    truscore: null,
    breakdown: { Body: null, Planet: null, Ethics: null, Open: null },
    scoringUnavailable: true,
    hasNutriScore: false,
    hasEcoScore: false,
    hasOrigin: false,
  };
}

function runPillarOrThrow<T>(pillar: string, fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`SCORING_UNAVAILABLE:${pillar}:${message}`);
  }
}

/**
 * Calculate TruScore v1.4 - Full spec implementation using modular pillars
 * 
 * All pillars start at base 15, then apply adjustments.
 * 
 * @param product - Product data to score
 * @param preferences - Optional user alert preferences for generating scan insights (not banner alerts)
 * @param scoringContext - Optional scoring overrides (e.g. persisted Planet market AU/NZ)
 * @returns TruScore result with total score, breakdown, and optional insights
 */
export function calculateTruScore(
  product: Product | null | undefined,
  preferences?: AlertsPreferences,
  scoringContext?: TruScoreScoringContext
): TruScoreResult {
  // Input validation — non-assessment (not a substantive Overall 0)
  if (!product || typeof product !== 'object') {
    logger.warn('[truscoreEngine] Invalid product input: product is null or not an object');
    return unavailableTruScoreResult();
  }
  
  // Validate that required fields are present
  if (!product.barcode && !product.product_name && !product.product_name_en) {
    logger.warn('[truscoreEngine] Product missing required fields: barcode or product_name');
  }

  let eligible: Product = product;
  try {
    eligible =
      toScoringProduct(product, scoringContext?.promotedContributionEvidence || []) || product;
  } catch (boundaryError) {
    logger.warn('[truscoreEngine] contribution eligibility boundary failed; scoring without unauthored contribution fields', boundaryError);
    eligible = stripUnauthoredScoringFieldsFromContribution(product);
  }
  const scoringProduct: Product =
    scoringContext?.planetMarket === 'AU' || scoringContext?.planetMarket === 'NZ'
      ? { ...eligible, true_scan_market: scoringContext.planetMarket }
      : eligible;

  // Validate array types to prevent runtime errors (mutate scoring copy only when it differs)
  if (scoringProduct.labels_tags && !Array.isArray(scoringProduct.labels_tags)) {
    logger.warn(`[truscoreEngine] Invalid labels_tags: expected array, got ${typeof scoringProduct.labels_tags}`);
    scoringProduct.labels_tags = [];
  }
  if (scoringProduct.ingredients_analysis_tags && !Array.isArray(scoringProduct.ingredients_analysis_tags)) {
    logger.warn(
      `[truscoreEngine] Invalid ingredients_analysis_tags: expected array, got ${typeof scoringProduct.ingredients_analysis_tags}`
    );
    scoringProduct.ingredients_analysis_tags = [];
  }
  if (scoringProduct.additives_tags && !Array.isArray(scoringProduct.additives_tags)) {
    logger.warn(`[truscoreEngine] Invalid additives_tags: expected array, got ${typeof scoringProduct.additives_tags}`);
    scoringProduct.additives_tags = [];
  }
  if (scoringProduct.packagings && !Array.isArray(scoringProduct.packagings)) {
    logger.warn(`[truscoreEngine] Invalid packagings: expected array, got ${typeof scoringProduct.packagings}`);
    scoringProduct.packagings = [];
  }

  const calculationStartTime = Date.now();
  
  try {
    // Calculate each pillar independently — any technical failure → unavailable (not a numeric score)
    const bodyResult = runPillarOrThrow('Body', () => calculateBodyPillar(scoringProduct));
    const planetResult = runPillarOrThrow('Planet', () => calculatePlanetPillar(scoringProduct));
    const ethicsResult = runPillarOrThrow('Ethics', () => calculateEthicsPillar(scoringProduct));
    const openResult = runPillarOrThrow('Open', () => calculateOpenPillar(scoringProduct));

    const requireFinite = (pillar: string, score: unknown): number => {
      if (typeof score !== 'number' || !Number.isFinite(score)) {
        throw new Error(`SCORING_UNAVAILABLE:${pillar}:non-finite score`);
      }
      return score;
    };
    const body = requireFinite('Body', bodyResult.score);
    const planet = requireFinite('Planet', planetResult.score);
    const ethics = requireFinite('Ethics', ethicsResult.score);
    const open = requireFinite('Open', openResult.score);
    
    // Total with bounds checking (0-100)
    const truscore = Math.max(0, Math.min(100, Math.round(body + planet + ethics + open)));
    
    // Legacy Alerts/MyChoices insights — parked for MVP (S-02); Asset Signals are sole Signal-content authority
    const insights =
      preferences && isMvpLegacyAlertsInsightsEnabled()
        ? generateInsights(scoringProduct, preferences)
        : [];
    
    // Determine metadata
    const hasNutriScore = !!scoringProduct.nutriscore_grade;
    const hasEcoScore = !!scoringProduct.ecoscore_grade;
    
    // Check origin status
    const hasOriginTags = Array.isArray(scoringProduct.origins_tags) && scoringProduct.origins_tags.length > 0;
    const hasManufacturingTags =
      Array.isArray(scoringProduct.manufacturing_places_tags) && scoringProduct.manufacturing_places_tags.length > 0;
    const hasOriginString = !!(
      scoringProduct.origins &&
      typeof scoringProduct.origins === 'string' &&
      scoringProduct.origins.trim().length > 0
    );
    const hasManufacturingString = !!(
      scoringProduct.manufacturing_places &&
      typeof scoringProduct.manufacturing_places === 'string' &&
      scoringProduct.manufacturing_places.trim().length > 0
    );
    const placeholderValues = ['unknown', 'n/a', 'not available', 'missing', 'not disclosed', 'not specified'];
    const originArrayValues = [
      ...(Array.isArray(scoringProduct.origins_tags) ? scoringProduct.origins_tags.map(v => String(v).toLowerCase()) : []),
      ...(Array.isArray(scoringProduct.manufacturing_places_tags)
        ? scoringProduct.manufacturing_places_tags.map(v => String(v).toLowerCase())
        : []),
    ];
    const originString = (scoringProduct.origins || scoringProduct.manufacturing_places || '').toString().toLowerCase();
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
    result.analysis = buildTruScoreAnalysis(scoringProduct, result) ?? undefined;

    // PowerShell logging for TruScore calculation details with timing
    powershellLogger.truScoreCalculationDetailed(
      scoringProduct?.barcode || 'unknown',
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('[truscoreEngine] Technical scoring failure — returning unavailable/non-assessment:', {
      message: errorMessage,
      stack: errorStack,
      productBarcode: product?.barcode || 'unknown',
      productName: product?.product_name || 'unknown',
    });
    return unavailableTruScoreResult();
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
    if (d.includes('packaging fallback')) return { sourceDatabase: `${productSourceDisplay} (Planet Annex v2)`, queryKeyType: 'product_field' };
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
      const adjustmentId = (adj as { id?: string }).id;
      const highlightEligible = (adj as { highlightEligible?: boolean }).highlightEligible;
      const adjustmentMetadata = (adj as { metadata?: Record<string, string | number | boolean> }).metadata;
      return {
        description: adj.description,
        value: adj.value,
        type: adj.type,
        sourceDatabase: inferred.sourceDatabase,
        queryKeyType: inferred.queryKeyType,
        ...(adjustmentId != null && { adjustmentId }),
        ...(highlightEligible != null && { highlightEligible }),
        ...(adjustmentMetadata != null && { adjustmentMetadata }),
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

