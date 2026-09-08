/**
 * Product Enhancement Service — governed transforms only (Review 1 Pass 2).
 *
 * NA-004: non-governed runtime enrichment (aggressive brand extract, EAN brand fill,
 * OpenCorporates, B-Corp label mutation, EWG/WWF/Leaping Bunny tag mutation) retired from
 * the live product-truth / scoring / identity / Chaining / Signals pipeline.
 *
 * Preserved governed helpers (pre-score):
 * - extractPalmOilAnalysisForProduct
 * - formatProductData / formatIngredients / formatCertifications (OFF-derived)
 * - calculateAndSetEcoScore (OFF Green-Score normalisation)
 * - assignNOVA1IfHighConfidence / ensureNova1ProvenanceOnProduct
 *
 * @module productEnhancementService
 */

import { Product } from '../types/product';
import { extractPalmOilAnalysis, formatCertifications, formatIngredients, calculateEcoScore } from './openFoodFacts';
import { logger } from '../utils/logger';
import { assignNOVA1IfHighConfidence } from '../utils/novaAssessment';
import { ensureNova1ProvenanceOnProduct } from '../utils/nova1Provenance';
import { stampCoreTruthAuthority } from '../config/coreTruthProductCacheAuthority';

/**
 * OPTIMIZATION: CDN Support for Product Images (display-only; non-authoritative).
 */
export function getCDNImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) {
    return imageUrl;
  }

  const CDN_BASE_URL = process.env.CDN_BASE_URL || process.env.EXPO_PUBLIC_CDN_BASE_URL;

  if (CDN_BASE_URL) {
    try {
      const encodedUrl = encodeURIComponent(imageUrl);
      return `${CDN_BASE_URL}/proxy?url=${encodedUrl}`;
    } catch (error) {
      logger.debug('Error encoding image URL for CDN (non-critical):', error);
      return imageUrl;
    }
  }

  return imageUrl;
}

/**
 * Extract and set palm oil analysis on product (governed).
 */
export function extractPalmOilAnalysisForProduct(product: Product): Product {
  const hasIngredientsText =
    product.ingredients_text &&
    typeof product.ingredients_text === 'string' &&
    product.ingredients_text.trim().length > 0;
  const hasAnalysisTags =
    Array.isArray(product.ingredients_analysis_tags) && product.ingredients_analysis_tags.length > 0;
  const hasAnalysis =
    product.ingredients_analysis &&
    typeof product.ingredients_analysis === 'object' &&
    Object.keys(product.ingredients_analysis).length > 0;

  if (hasIngredientsText || hasAnalysisTags || hasAnalysis) {
    try {
      product.palm_oil_analysis = extractPalmOilAnalysis(product);
    } catch (error) {
      logger.debug('Error extracting palm oil analysis:', error);
    }
  }

  return product;
}

/**
 * Format product data for Open Facts family (governed OFF-derived).
 */
export function formatProductData(product: Product): Product {
  if (
    product.source === 'openfoodfacts' ||
    product.source === 'openbeautyfacts' ||
    product.source === 'openpetfoodfacts'
  ) {
    product.ingredients = formatIngredients(product);
    product.certifications = formatCertifications(product);
  }

  if (product.source === 'openproductsfacts' && product.ingredients_text) {
    product.ingredients = formatIngredients(product);
  }

  return product;
}

/**
 * Calculate and set Eco-Score on product (OFF score → grade normalisation only).
 */
export function calculateAndSetEcoScore(product: Product): Product {
  const calculatedEcoScore = calculateEcoScore(product);
  if (calculatedEcoScore) {
    product.ecoscore_data = calculatedEcoScore;
    if (calculatedEcoScore.grade && calculatedEcoScore.grade !== 'unknown') {
      product.ecoscore_grade = calculatedEcoScore.grade;
    }
    if (calculatedEcoScore.score !== undefined) {
      product.ecoscore_score = calculatedEcoScore.score;
    }
  }
  return product;
}

/**
 * Deterministic governed transforms applied before calculateTruScore.
 * When `stampAuthority` is true, marks the product as Core Truth cache-eligible (NA-003).
 */
export function applyGovernedProductTransforms(
  product: Product,
  options?: { stampAuthority?: boolean }
): Product {
  extractPalmOilAnalysisForProduct(product);
  formatProductData(product);

  if (product.image_url) {
    product.image_url = getCDNImageUrl(product.image_url);
  }
  if (product.image_front_url) {
    product.image_front_url = getCDNImageUrl(product.image_front_url);
  }
  if (product.image_front_small_url) {
    product.image_front_small_url = getCDNImageUrl(product.image_front_small_url);
  }

  calculateAndSetEcoScore(product);
  assignNOVA1IfHighConfidence(product);
  ensureNova1ProvenanceOnProduct(product);

  if (options?.stampAuthority) {
    stampCoreTruthAuthority(product);
  }

  return product;
}

/**
 * @deprecated NA-004 — retired non-governed MVP enrichment. No-op.
 */
export async function applyMVPEnhancementsToProduct(product: Product): Promise<Product> {
  return product;
}

/**
 * @deprecated NA-004 — retired EAN / OpenCorporates / B-Corp runtime enrichment. No-op.
 */
export async function applyBrandEnrichment(product: Product): Promise<Product> {
  return product;
}

/**
 * Apply governed transforms only (formerly included non-governed enrichment).
 * Prefer `applyGovernedProductTransforms` at call sites.
 */
export async function enhanceProduct(product: Product): Promise<Product> {
  return applyGovernedProductTransforms(product, { stampAuthority: false });
}
