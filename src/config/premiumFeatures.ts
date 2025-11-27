/**
 * Premium Feature Configuration
 * 
 * This file controls which features are premium and how they're gated.
 * 
 * To enable premium gating for a feature:
 * 1. Set ENABLE_PREMIUM_GATING to true
 * 2. Mark features as premium in PREMIUM_FEATURES map
 * 3. Use PremiumGate component or isPremiumFeatureEnabled() to gate features
 * 
 * To add a new premium feature:
 * 1. Add it to PremiumFeature enum in premiumFeatures.ts
 * 2. Add it to PREMIUM_FEATURES map below with isPremium: true
 * 3. Use PremiumGate component in your UI
 */

import { PremiumFeature } from '../utils/premiumFeatures';

/**
 * Global premium gating toggle
 * 
 * Set to true to enable premium gating (features will be locked behind subscription)
 * Set to false to allow all features for free (testing/development mode)
 * 
 * IMPORTANT: Set to true before production launch!
 */
export const ENABLE_PREMIUM_GATING = false;

/**
 * Premium Features Configuration
 * 
 * Controls which features require premium subscription.
 * Set isPremium: true to gate a feature behind subscription.
 * 
 * You can easily enable/disable premium gating for individual features here.
 */
export const PREMIUM_FEATURES: Record<PremiumFeature, { isPremium: boolean }> = {
  // Tier 1: Core Premium Features
  [PremiumFeature.OFFLINE_MODE]: { isPremium: true },
  [PremiumFeature.UNLIMITED_HISTORY]: { isPremium: true },
  [PremiumFeature.ADVANCED_SEARCH]: { isPremium: true },
  [PremiumFeature.EXPORT_DATA]: { isPremium: true },
  
  // Tier 2: Enhanced Features
  [PremiumFeature.ENHANCED_INSIGHTS]: { isPremium: true },
  [PremiumFeature.AD_FREE]: { isPremium: true },
  
  // Tier 3: Future Features
  [PremiumFeature.PRODUCT_COMPARISONS]: { isPremium: true },
  [PremiumFeature.PERSONALIZED_RECOMMENDATIONS]: { isPremium: true },
  [PremiumFeature.HISTORICAL_TRENDS]: { isPremium: true },
  
  // Legacy/Deprecated (keep for backward compatibility)
  [PremiumFeature.PRICING_TRENDS]: { isPremium: false }, // Deprecated
  [PremiumFeature.ADDITIONAL_PRODUCT_INFO]: { isPremium: false }, // Merged into ENHANCED_INSIGHTS
  [PremiumFeature.PRODUCT_FILTERS]: { isPremium: false }, // Merged into ADVANCED_SEARCH
  [PremiumFeature.BETTER_TRUST_SCORE]: { isPremium: false }, // Merged into ENHANCED_INSIGHTS
};

/**
 * Check if a feature is configured as premium
 */
export function isFeaturePremium(feature: PremiumFeature): boolean {
  return PREMIUM_FEATURES[feature]?.isPremium ?? false;
}

