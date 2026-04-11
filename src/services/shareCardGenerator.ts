/**
 * Share Card Generator
 * Creates visual share cards with product image, TruScore, and key insights
 * 
 * Note: Requires react-native-view-shot for image capture
 * Install: npm install react-native-view-shot
 */

import { Product, ProductWithTrustScore } from '../types/product';
import { TruScoreResult } from '../lib/truscoreEngine';
import { logger } from '../utils/logger';
import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';

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
  const {
    truScore,
    includeInsights = true,
    width = 1200,
    height = 1200,
    format = 'png',
    quality = 0.9,
  } = options;

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
  
  // Extract insights from TruScore
  if (truScore?.insights) {
    truScore.insights.forEach(insight => {
      insights.push(insight.reason);
    });
  }
  
  return {
    productName: product.product_name || `Product ${product.barcode}`,
    truScore: truScore?.truscore ?? product.trust_score,
    imageUrl: product.image_url || product.image_front_url || null,
    insights,
    breakdown: truScore?.breakdown || (product.trust_score_breakdown ? {
      Body: product.trust_score_breakdown.body,
      Planet: product.trust_score_breakdown.planet,
      Ethics: product.trust_score_breakdown.ethics ?? 0,
      Open: product.trust_score_breakdown.open,
    } : undefined),
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
  const score = truScore?.truscore ?? product.trust_score ?? 0;
  const productName = product.product_name || `Product ${product.barcode}`;
  
  let message = `🔍 ${productName}\n\n`;
  message += `TruScore: ${score}/100\n\n`;
  
  if (truScore?.breakdown) {
    message += `Breakdown:\n`;
    message += `• Body: ${truScore.breakdown.Body}/25\n`;
    message += `• Planet: ${truScore.breakdown.Planet}/25\n`;
    message += `• Ethics: ${truScore.breakdown.Ethics}/25\n`;
    message += `• Open: ${truScore.breakdown.Open}/25\n\n`;
  }
  
  if (truScore?.insights && truScore.insights.length > 0) {
    message += `Key Insights:\n`;
    truScore.insights.slice(0, 3).forEach(insight => {
      message += `• ${insight.reason}\n`;
    });
    message += `\n`;
  }
  
  message += `📱 Scan with TrueScan to see full details\n`;
  message += `#TruScore #FoodTransparency #TrueScan`;
  
  return message;
}

/**
 * Check if share card generation is available
 */
export function isShareCardGenerationAvailable(): boolean {
  return typeof captureRef === 'function';
}
