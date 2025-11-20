import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Qonversion, { QonversionConfigBuilder, LaunchMode, Environment } from 'react-native-qonversion';
import { Platform } from 'react-native';

export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'grace_period' | 'billing_issue' | null;
export type SubscriptionPeriod = 'monthly' | 'annual' | null;

export interface SubscriptionInfo {
  isPremium: boolean;
  status: SubscriptionStatus;
  period: SubscriptionPeriod;
  productId: string | null;
  expiresDate: Date | null;
  isTrialPeriod: boolean;
  willRenew: boolean;
}

interface SubscriptionStore {
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  purchaseSubscription: (productId: string) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  clearSubscription: () => void;
}

const STORAGE_KEY = '@truescan_subscription';
// Qonversion Project Key - same for both iOS and Android
// Get from: https://dashboard.qonversion.io/settings
const QONVERSION_API_KEY = process.env.EXPO_PUBLIC_QONVERSION_PROJECT_KEY || 
  Platform.select({
    ios: process.env.EXPO_PUBLIC_QONVERSION_IOS_KEY,
    android: process.env.EXPO_PUBLIC_QONVERSION_ANDROID_KEY,
    default: '',
  }) ||
  'Bdh8Y7krabWxjf_alA0bSRUlHn8W3W0_'; // Default project key (can be overridden by env)

const PREMIUM_ENTITLEMENT_ID = 'premium'; // Qonversion entitlement ID

const initialState: SubscriptionInfo = {
  isPremium: false,
  status: null,
  period: null,
  productId: null,
  expiresDate: null,
  isTrialPeriod: false,
  willRenew: false,
};

// Helper function to parse subscription status from Qonversion
function parseSubscriptionInfo(entitlements: Map<string, any>): SubscriptionInfo {
  const premium = entitlements.get(PREMIUM_ENTITLEMENT_ID);
  
  if (!premium || !premium.isActive) {
    return initialState;
  }

  const productId = premium.productId || null;
  const period = productId?.includes('annual') || productId?.includes('year') 
    ? 'annual' 
    : productId?.includes('month') || productId?.includes('monthly')
    ? 'monthly'
    : null;

  // Determine status from renewState
  let status: SubscriptionStatus = 'active';
  const renewState = premium.renewState;
  
  // Check if expired
  if (!premium.isActive) {
    // Check if grace period (expired but still within grace period)
    if (premium.expirationDate && new Date(premium.expirationDate) > new Date()) {
      status = 'grace_period';
    } else {
      status = 'expired';
    }
  } else if (renewState === 'billing_issue') {
    status = 'billing_issue';
  } else if (renewState === 'non_renewable' || renewState === 'canceled') {
    // Still active but won't renew
    status = 'active'; // Keep as active until expiration
  } else if (premium.trialStartDate) {
    // Check if currently in trial
    const now = new Date();
    if (premium.expirationDate && premium.expirationDate > now && premium.trialStartDate <= now) {
      status = 'trial';
    }
  }

  // Determine if will renew based on renewState
  const willRenew = premium.renewState !== 'non_renewable' && 
                    premium.renewState !== 'billing_issue' &&
                    premium.renewState !== 'cancelled';

  // Check if trial period
  const isTrialPeriod = !!premium.trialStartDate && 
                        premium.expirationDate && 
                        premium.trialStartDate.getTime() === premium.startedDate.getTime();

  return {
    isPremium: true,
    status,
    period,
    productId,
    expiresDate: premium.expirationDate || null,
    isTrialPeriod,
    willRenew,
  };
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscriptionInfo: initialState,
  isLoading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      // Load cached subscription status
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        set({ 
          subscriptionInfo: {
            ...parsed,
            expiresDate: parsed.expiresDate ? new Date(parsed.expiresDate) : null,
          },
        });
      }

      // Initialize Qonversion SDK
      if (QONVERSION_API_KEY && QONVERSION_API_KEY !== 'YOUR_IOS_KEY' && QONVERSION_API_KEY !== 'YOUR_ANDROID_KEY') {
        try {
          // Check if Qonversion native module is available
          // Qonversion requires native code and won't work in Expo Go
          if (typeof Qonversion === 'undefined' || !Qonversion.initialize) {
            throw new Error('Qonversion native module not available. Requires development build or EAS build.');
          }

          const config = new QonversionConfigBuilder(QONVERSION_API_KEY, LaunchMode.ANALYTICS)
            .setEnvironment(Environment.PRODUCTION) // Use Environment.SANDBOX for testing
            .build();
          
          Qonversion.initialize(config);
          
          // Get current entitlements
          const entitlements = await Qonversion.getSharedInstance().checkEntitlements();
          const subscriptionInfo = parseSubscriptionInfo(entitlements);
          
          set({ subscriptionInfo, isInitialized: true });
          
          // Cache subscription info
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...subscriptionInfo,
            expiresDate: subscriptionInfo.expiresDate?.toISOString() || null,
          }));
        } catch (initError: any) {
          console.warn('Qonversion initialization failed (likely running in Expo Go):', initError.message);
          // Continue with cached subscription info if available
          // App will work in free mode until native build is available
          set({ 
            isInitialized: true,
            error: 'Subscription features require a development build. Running in free mode.',
          });
        }
      } else {
        console.warn('Qonversion API key not configured');
        set({ isInitialized: true });
      }
    } catch (error: any) {
      console.error('Failed to initialize Qonversion:', error);
      set({ 
        error: error.message || 'Failed to initialize subscription service',
        isInitialized: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  checkSubscriptionStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      if (!QONVERSION_API_KEY) {
        throw new Error('Qonversion API key not configured');
      }

      const entitlements = await Qonversion.getSharedInstance().checkEntitlements();
      const subscriptionInfo = parseSubscriptionInfo(entitlements);
      
      set({ subscriptionInfo });
      
      // Cache subscription info
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...subscriptionInfo,
        expiresDate: subscriptionInfo.expiresDate?.toISOString() || null,
      }));
    } catch (error: any) {
      console.error('Failed to check subscription status:', error);
      set({ error: error.message || 'Failed to check subscription status' });
    } finally {
      set({ isLoading: false });
    }
  },

  purchaseSubscription: async (productId: string) => {
    set({ isLoading: true, error: null });

    try {
      if (!QONVERSION_API_KEY) {
        throw new Error('Qonversion API key not configured');
      }

      // Get product first
      const products = await Qonversion.getSharedInstance().products();
      const product = products.get(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Purchase via Qonversion
      const purchaseEntitlements = await Qonversion.getSharedInstance().purchaseProduct(product, undefined);
      
      if (!purchaseEntitlements || !purchaseEntitlements.get(PREMIUM_ENTITLEMENT_ID)?.isActive) {
        set({ isLoading: false });
        return { success: false, error: 'Purchase completed but subscription not activated' };
      }

      // Update subscription info
      const entitlements = await Qonversion.getSharedInstance().checkEntitlements();
      const subscriptionInfo = parseSubscriptionInfo(entitlements);
      
      set({ subscriptionInfo });
      
      // Cache subscription info
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...subscriptionInfo,
        expiresDate: subscriptionInfo.expiresDate?.toISOString() || null,
      }));

      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      console.error('Failed to purchase subscription:', error);
      const errorMessage = error.message || 'Failed to complete purchase';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  restorePurchases: async () => {
    set({ isLoading: true, error: null });

    try {
      if (!QONVERSION_API_KEY) {
        throw new Error('Qonversion API key not configured');
      }

      // Restore purchases via Qonversion
      await Qonversion.getSharedInstance().restore();
      
      // Check entitlements after restore
      const entitlements = await Qonversion.getSharedInstance().checkEntitlements();
      const subscriptionInfo = parseSubscriptionInfo(entitlements);
      
      set({ subscriptionInfo });
      
      // Cache subscription info
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...subscriptionInfo,
        expiresDate: subscriptionInfo.expiresDate?.toISOString() || null,
      }));

      set({ isLoading: false });
      return { success: true };
    } catch (error: any) {
      console.error('Failed to restore purchases:', error);
      const errorMessage = error.message || 'Failed to restore purchases';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearSubscription: async () => {
    set({ subscriptionInfo: initialState });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));

