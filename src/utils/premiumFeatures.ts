import { useSubscriptionStore, SubscriptionInfo } from '../store/useSubscriptionStore';

/**
 * Premium feature definitions
 */
export enum PremiumFeature {
  OFFLINE_MODE = 'offline_mode',
  ADVANCED_SEARCH = 'advanced_search',
  AD_FREE = 'ad_free',
  PRICING_TRENDS = 'pricing_trends',
  ADDITIONAL_PRODUCT_INFO = 'additional_product_info',
  PRODUCT_FILTERS = 'product_filters',
  BETTER_TRUST_SCORE = 'better_trust_score',
}

/**
 * Feature descriptions for UI
 */
export const PremiumFeatureDescriptions: Record<PremiumFeature, {
  title: string;
  description: string;
  icon: string;
}> = {
  [PremiumFeature.OFFLINE_MODE]: {
    title: 'Offline Mode',
    description: 'Access cached product data without internet connection',
    icon: 'cloud-offline-outline',
  },
  [PremiumFeature.ADVANCED_SEARCH]: {
    title: 'Advanced Search',
    description: 'Filter by multiple criteria, save searches, and more',
    icon: 'search-outline',
  },
  [PremiumFeature.AD_FREE]: {
    title: 'Ad-Free Experience',
    description: 'Enjoy TrueScan without advertisements',
    icon: 'close-circle-outline',
  },
  [PremiumFeature.PRICING_TRENDS]: {
    title: 'Pricing & Trends',
    description: 'View historical pricing data and trends',
    icon: 'trending-up-outline',
  },
  [PremiumFeature.ADDITIONAL_PRODUCT_INFO]: {
    title: 'Additional Product Info',
    description: 'Access extended product details and insights',
    icon: 'information-circle-outline',
  },
  [PremiumFeature.PRODUCT_FILTERS]: {
    title: 'Product Filters',
    description: 'Advanced filtering and sorting options',
    icon: 'options-outline',
  },
  [PremiumFeature.BETTER_TRUST_SCORE]: {
    title: 'Enhanced Trust Score',
    description: 'Detailed trust score breakdown and analysis',
    icon: 'shield-checkmark-outline',
  },
};

/**
 * Check if a premium feature is enabled
 * TEMPORARILY DISABLED: All features are available for testing
 * TODO: Re-enable premium gating when ready
 */
export function isPremiumFeatureEnabled(
  feature: PremiumFeature,
  subscriptionInfo: SubscriptionInfo
): boolean {
  // TEMPORARY: Always return true to enable all features for testing
  return true;

  // Original premium gating (disabled for testing):
  // // All premium features require active subscription
  // if (!subscriptionInfo.isPremium) {
  //   return false;
  // }

  // // Check subscription status
  // if (subscriptionInfo.status !== 'active' && subscriptionInfo.status !== 'trial') {
  //   // Allow grace period access for some features
  //   if (subscriptionInfo.status === 'grace_period') {
  //     // Grace period allows access to most features except new features
  //     return feature !== PremiumFeature.PRICING_TRENDS; // Example: exclude newest features during grace
  //   }
  //   return false;
  // }

  // // All features available for active/trial subscriptions
  // return true;
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

