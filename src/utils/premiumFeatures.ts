import { useSubscriptionStore, SubscriptionInfo } from '../store/useSubscriptionStore';

/**
 * Premium feature definitions
 * Updated based on competitive analysis and user value assessment
 */
export enum PremiumFeature {
  // Tier 1: Core Premium Features (High Value, High Demand)
  OFFLINE_MODE = 'offline_mode',
  UNLIMITED_HISTORY = 'unlimited_history',
  ADVANCED_SEARCH = 'advanced_search',
  EXPORT_DATA = 'export_data',
  
  // Tier 2: Enhanced Features (Medium Value)
  ENHANCED_INSIGHTS = 'enhanced_insights',
  AD_FREE = 'ad_free',
  
  // Tier 3: Future Features (To Be Implemented)
  PRODUCT_COMPARISONS = 'product_comparisons',
  PERSONALIZED_RECOMMENDATIONS = 'personalized_recommendations',
  HISTORICAL_TRENDS = 'historical_trends',
  
  // Legacy/Deprecated (Keep for backward compatibility)
  PRICING_TRENDS = 'pricing_trends', // Deprecated - pricing card removed
  ADDITIONAL_PRODUCT_INFO = 'additional_product_info', // Merged into ENHANCED_INSIGHTS
  PRODUCT_FILTERS = 'product_filters', // Merged into ADVANCED_SEARCH
  BETTER_TRUST_SCORE = 'better_trust_score', // Merged into ENHANCED_INSIGHTS
}

/**
 * Feature descriptions for UI
 */
export const PremiumFeatureDescriptions: Record<PremiumFeature, {
  title: string;
  description: string;
  icon: string;
}> = {
  // Tier 1: Core Premium Features
  [PremiumFeature.OFFLINE_MODE]: {
    title: 'Offline Mode',
    description: 'Scan products and access cached data without internet connection',
    icon: 'cloud-offline-outline',
  },
  [PremiumFeature.UNLIMITED_HISTORY]: {
    title: 'Unlimited History',
    description: 'Save unlimited scan history (free users limited to 100 scans)',
    icon: 'infinite-outline',
  },
  [PremiumFeature.ADVANCED_SEARCH]: {
    title: 'Advanced Search & Filters',
    description: 'Filter by Trust Score, Eco-Score, NOVA, certifications, and more',
    icon: 'search-outline',
  },
  [PremiumFeature.EXPORT_DATA]: {
    title: 'Export Scan History',
    description: 'Export your scan history to CSV or JSON format',
    icon: 'download-outline',
  },
  
  // Tier 2: Enhanced Features
  [PremiumFeature.ENHANCED_INSIGHTS]: {
    title: 'Enhanced Insights',
    description: 'Detailed TruScore breakdown, advanced nutrition analytics, and personalized recommendations',
    icon: 'analytics-outline',
  },
  [PremiumFeature.AD_FREE]: {
    title: 'Ad-Free Experience',
    description: 'Enjoy TrueScan without advertisements',
    icon: 'close-circle-outline',
  },
  
  // Tier 3: Future Features
  [PremiumFeature.PRODUCT_COMPARISONS]: {
    title: 'Product Comparisons',
    description: 'Compare multiple products side-by-side',
    icon: 'git-compare-outline',
  },
  [PremiumFeature.PERSONALIZED_RECOMMENDATIONS]: {
    title: 'Personalized Recommendations',
    description: 'Get product recommendations based on your preferences',
    icon: 'bulb-outline',
  },
  [PremiumFeature.HISTORICAL_TRENDS]: {
    title: 'Historical Trends',
    description: 'Track product changes and trends over time',
    icon: 'trending-up-outline',
  },
  
  // Legacy/Deprecated (for backward compatibility)
  [PremiumFeature.PRICING_TRENDS]: {
    title: 'Pricing & Trends',
    description: 'View historical pricing data and trends (deprecated)',
    icon: 'trending-up-outline',
  },
  [PremiumFeature.ADDITIONAL_PRODUCT_INFO]: {
    title: 'Additional Product Info',
    description: 'Access extended product details and insights (merged into Enhanced Insights)',
    icon: 'information-circle-outline',
  },
  [PremiumFeature.PRODUCT_FILTERS]: {
    title: 'Product Filters',
    description: 'Advanced filtering and sorting options (merged into Advanced Search)',
    icon: 'options-outline',
  },
  [PremiumFeature.BETTER_TRUST_SCORE]: {
    title: 'Enhanced Trust Score',
    description: 'Detailed trust score breakdown and analysis (merged into Enhanced Insights)',
    icon: 'shield-checkmark-outline',
  },
};

/**
 * Check if a premium feature is enabled
 * 
 * Premium features require an active subscription or trial.
 * Grace period users retain access to most features.
 * 
 * @param feature - The premium feature to check
 * @param subscriptionInfo - Current subscription status
 * @returns true if feature is enabled, false otherwise
 */
export function isPremiumFeatureEnabled(
  feature: PremiumFeature,
  subscriptionInfo: SubscriptionInfo
): boolean {
  // TODO: Remove this temporary override when ready to launch premium features
  // TEMPORARY: Always return true to enable all features for testing
  // Set to false when ready to enable premium gating
  const ENABLE_PREMIUM_GATING = false; // Change to true to enable premium gating
  
  if (!ENABLE_PREMIUM_GATING) {
    return true; // Testing mode - all features enabled
  }

  // All premium features require active subscription
  if (!subscriptionInfo.isPremium) {
    return false;
  }

  // Check subscription status
  if (subscriptionInfo.status !== 'active' && subscriptionInfo.status !== 'trial') {
    // Allow grace period access for most features
    if (subscriptionInfo.status === 'grace_period') {
      // Grace period allows access to core features
      // Exclude newest/future features during grace period
      const gracePeriodExcludedFeatures = [
        PremiumFeature.PRODUCT_COMPARISONS,
        PremiumFeature.PERSONALIZED_RECOMMENDATIONS,
        PremiumFeature.HISTORICAL_TRENDS,
      ];
      return !gracePeriodExcludedFeatures.includes(feature);
    }
    return false;
  }

  // All features available for active/trial subscriptions
  return true;
}

/**
 * Get feature gate message
 */
export function getPremiumFeatureMessage(feature: PremiumFeature): string {
  const desc = PremiumFeatureDescriptions[feature];
  return `Unlock ${desc.title} with Premium subscription`;
}

/**
 * Check if user has premium subscription
 */
export function isPremium(subscriptionInfo: SubscriptionInfo): boolean {
  return subscriptionInfo.isPremium && 
         (subscriptionInfo.status === 'active' || 
          subscriptionInfo.status === 'trial' || 
          subscriptionInfo.status === 'grace_period');
}

/**
 * Check if subscription is in trial
 */
export function isTrial(subscriptionInfo: SubscriptionInfo): boolean {
  return subscriptionInfo.isPremium && subscriptionInfo.status === 'trial';
}

/**
 * Check if subscription is expired but in grace period
 */
export function isGracePeriod(subscriptionInfo: SubscriptionInfo): boolean {
  return subscriptionInfo.isPremium && subscriptionInfo.status === 'grace_period';
}

/**
 * Get subscription status message
 */
export function getSubscriptionStatusMessage(subscriptionInfo: SubscriptionInfo): string {
  if (!subscriptionInfo.isPremium) {
    return 'Free';
  }

  switch (subscriptionInfo.status) {
    case 'active':
      return subscriptionInfo.period === 'annual' ? 'Premium (Annual)' : 'Premium (Monthly)';
    case 'trial':
      return 'Premium (Trial)';
    case 'grace_period':
      return 'Premium (Grace Period)';
    case 'billing_issue':
      return 'Premium (Billing Issue)';
    case 'expired':
      return 'Expired';
    default:
      return 'Premium';
  }
}

