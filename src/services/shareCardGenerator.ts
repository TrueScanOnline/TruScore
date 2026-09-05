/**
 * Share Card Generator
 * Creates visual share cards with product image, Rveel Score, and key insights
 * 
 * Note: Requires react-native-view-shot for image capture
 * Install: npm install react-native-view-shot
 */

import { ProductWithTrustScore } from '../types/product';
import { TruScoreResult } from '../lib/truscoreEngine';
import { logger } from '../utils/logger';
import { captureRef } from 'react-native-view-shot';
import { productIdentity } from '../config/productIdentity';
import {
  resolveShareOverallScore,
  resolveShareBreakdownForOverall,
} from '../utils/shareScoreSemantics';
import {
  RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from '../utils/truScorePresentation';
import { consumerPillarLabel } from '../lib/scoreHighlights';

export interface ShareCardOptions {
  product: ProductWithTrustScore;
  truScore?: TruScoreResult;
  includeInsights?: boolean;
  width?: number;
  height?: number;
  format?: 'png' | 'jpg';
  quality?: number;
}

/**
 * Generate a share card image for a product
 * Returns a local file URI that can be shared
 * 
 * @param product - Product to create share card for
 * @param options - Share card generation options
 * @returns URI of generated share card image, or null if generation fails
 */
export async function generateShareCard(
  product: ProductWithTrustScore,
  options: Partial<ShareCardOptions> = {}
): Promise<string | null> {
  try {
    // For now, return product image as share card
    // Full implementation would require:
    // 1. Creating a React component with product info
    // 2. Rendering it to a view
    // 3. Capturing the view as an image
    // 
    // This is complex and requires React Native rendering, so we'll
    // provide a simpler implementation that returns the product image
    // with metadata in the share message instead
    
    logger.debug('Share card generation: using product image (full card generation requires view-shot setup)');
    return product.image_url || product.image_front_url || null;
  } catch (error) {
    logger.error('Error generating share card:', error);
    return product.image_url || product.image_front_url || null;
  }
}

/**
 * Generate share card component props
 * Returns data that can be used to render a share card component
 */
export function getShareCardData(
  product: ProductWithTrustScore,
  truScore?: TruScoreResult
): {
  productName: string;
  truScore: number | null;
  imageUrl: string | null;
  insights: string[];
  breakdown?: {
    Body: number;
    Planet: number;
    Ethics: number;
    Open: number;
  };
} {
  const insights: string[] = [];
  
  // Extract insights from score engine
  if (truScore?.insights) {
    truScore.insights.forEach(insight => {
      insights.push(insight.reason);
    });
  }

  const overall = resolveShareOverallScore(truScore, product);
  const breakdown = resolveShareBreakdownForOverall(overall, truScore, product) ?? undefined;
  
  return {
    productName: product.product_name || `Product ${product.barcode}`,
    truScore: overall,
    imageUrl: product.image_url || product.image_front_url || null,
    insights,
    breakdown,
  };
}

/**
 * Generate share message with product info
 * This is used when visual share card generation is not available
 */
export function generateShareMessage(
  product: ProductWithTrustScore,
  truScore?: TruScoreResult
): string {
  const score = resolveShareOverallScore(truScore, product);
  const productName = product.product_name || `Product ${product.barcode}`;
  const breakdown = resolveShareBreakdownForOverall(score, truScore, product);
  
  let message = `🔍 ${productName}\n\n`;
  if (score === null) {
    message += `${RVEEL_SCORE_UNAVAILABLE_TITLE}\n`;
    message += `${RVEEL_SCORE_UNAVAILABLE_EXPLANATION}\n\n`;
  } else {
    message += `${productIdentity.publicScoreName}: ${score}/100\n\n`;
  }
  
  if (breakdown) {
    // Consumer pillar labels (Ethics → Claims, Open → Transparency); internal keys unchanged.
    message += `Breakdown:\n`;
    message += `• ${consumerPillarLabel('Body')}: ${breakdown.Body}/25\n`;
    message += `• ${consumerPillarLabel('Planet')}: ${breakdown.Planet}/25\n`;
    message += `• ${consumerPillarLabel('Ethics')}: ${breakdown.Ethics}/25\n`;
    message += `• ${consumerPillarLabel('Open')}: ${breakdown.Open}/25\n\n`;
  }
  
  if (truScore?.insights && truScore.insights.length > 0) {
    message += `Key Insights:\n`;
    truScore.insights.slice(0, 3).forEach(insight => {
      message += `• ${insight.reason}\n`;
    });
    message += `\n`;
  }
  
  message += `📱 Scan with ${productIdentity.displayName} to see full details\n`;
  message += `#${productIdentity.publicScoreHashtag} #FoodTransparency #${productIdentity.displayName}`;
  
  return message;
}

/**
 * Check if share card generation is available
 */
export function isShareCardGenerationAvailable(): boolean {
  return typeof captureRef === 'function';
}
