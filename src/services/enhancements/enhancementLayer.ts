// Enhancement Layer Orchestrator
// Applies MVP enhancements to products after primary data sources
// Integrates EWG Skin Deep, WWF Palm Oil, and Leaping Bunny enhancements

import { Product, PalmOilAnalysis } from '../../types/product';
import { logger } from '../../utils/logger';
import { enhanceWithEWGSkinDeep } from './ewgSkinDeepEnhancement';
import { enhancePalmOilWithWWF } from './wwfPalmOilEnhancement';
import { enhanceWithLeapingBunny } from './leapingBunnyEnhancement';

/**
 * Apply all MVP enhancements to a product
 * This is called after primary data sources (Gold Standard → Country-Specific → Global OFF)
 * 
 * Enhancement order:
 * 1. EWG Skin Deep (Body pillar - cosmetics)
 * 2. WWF Palm Oil (Planet pillar - palm oil sustainability)
 * 3. Leaping Bunny (Care pillar - cruelty-free)
 */
export async function applyMVPEnhancements(
  product: Product,
  userCountry?: string
): Promise<Product> {
  if (!product) {
    return product;
  }
  
  try {
    logger.debug(`Applying MVP enhancements for product: ${product.barcode}`);
    
    // 1. EWG Skin Deep Enhancement (Body pillar - cosmetics)
    // Only applies to cosmetics/personal care products
    product = await enhanceWithEWGSkinDeep(product);
    
    // 2. WWF Palm Oil Enhancement (Planet pillar - palm oil sustainability)
    // Only applies if palm oil is detected
    if (product.palm_oil_analysis && product.palm_oil_analysis.containsPalmOil) {
      product.palm_oil_analysis = await enhancePalmOilWithWWF(
        product.palm_oil_analysis,
        product
      );
    }
    
    // 3. Leaping Bunny Enhancement (Care pillar - cruelty-free)
    // Applies to all products with brand information
    product = await enhanceWithLeapingBunny(product);
    
    // Mark that enhancements were applied
    (product as any).enhancements_applied = {
      ewg_skin_deep: !!(product as any).ewg_skin_deep,
      wwf_palm_oil: !!(product.palm_oil_analysis as any)?.wwf_data,
      leaping_bunny: !!(product as any).leaping_bunny,
    };
    
    logger.debug(`MVP enhancements applied: ${product.barcode}`, {
      ewg: !!(product as any).ewg_skin_deep,
      wwf: !!(product.palm_oil_analysis as any)?.wwf_data,
      leapingBunny: !!(product as any).leaping_bunny,
    });
  } catch (error) {
    logger.debug('Error applying MVP enhancements:', error);
    // Don't fail if enhancements fail - return product as-is
  }
  
  return product;
}

/**
 * Check if product has been enhanced
 */
export function hasEnhancements(product: Product): boolean {
  return !!(
    (product as any).ewg_skin_deep ||
    (product.palm_oil_analysis as any)?.wwf_data ||
    (product as any).leaping_bunny
  );
}

/**
 * Get enhancement summary for display
 */
export function getEnhancementSummary(product: Product): {
  ewg: boolean;
  wwf: boolean;
  leapingBunny: boolean;
} {
  return {
    ewg: !!(product as any).ewg_skin_deep,
    wwf: !!(product.palm_oil_analysis as any)?.wwf_data,
    leapingBunny: !!(product as any).leaping_bunny,
  };
}
