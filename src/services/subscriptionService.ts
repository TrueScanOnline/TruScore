import Qonversion, { Product } from 'react-native-qonversion';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';

export interface QonversionProduct {
  qonversionId: string;
  storeId: string;
  type: 'subscription' | 'one_time';
  duration: 'weekly' | 'monthly' | 'annual' | 'lifetime';
  price: number;
  currencyCode: string;
  title: string;
  description: string;
}

export interface QonversionOfferings {
  main: {
    id: string;
    products: QonversionProduct[];
  } | null;
  available: Array<{
    id: string;
    products: QonversionProduct[];
  }>;
}

/**
 * Get available subscription products
 */
export async function getAvailableProducts(retryCount = 0): Promise<QonversionProduct[]> {
  try {
    const offerings = await Qonversion.getSharedInstance().offerings();
    
    if (!offerings || !offerings.main || offerings.main.products.length === 0) {
      // Retry once if no products found (network issue)
      if (retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getAvailableProducts(retryCount + 1);
      }
      console.warn('No products available in Qonversion');
      return [];
    }

    // Map Qonversion Product to QonversionProduct
    return offerings.main.products
      .filter((product: Product) => {
        // Filter for subscription products - check type property
        const productType = (product as any).type || product.qonversionID;
        return productType && String(productType).toLowerCase().includes('subscription');
      })
      .map((product: Product): QonversionProduct => {
        // Determine duration from subscription period
        let duration: 'weekly' | 'monthly' | 'annual' | 'lifetime' = 'monthly';
        if (product.subscriptionPeriod) {
          const period = product.subscriptionPeriod;
          const unit = String((period as any).unit || '').toUpperCase();
          if (unit.includes('YEAR')) {
            duration = 'annual';
          } else if (unit.includes('WEEK')) {
            duration = 'weekly';
          } else {
            duration = 'monthly';
          }
        }

        // Get price from store details
        let price = 0;
        let currencyCode = 'USD';
        let title = product.qonversionID;
        let description = '';

        if (Platform.OS === 'ios' && product.skProduct) {
          price = parseFloat(String(product.skProduct.price || 0));
          currencyCode = product.skProduct.currencyCode || 'USD';
          title = product.skProduct.localizedTitle || product.qonversionID;
          description = product.skProduct.localizedDescription || '';
        } else if (Platform.OS === 'android' && product.storeDetails) {
          const pricingPhases = product.storeDetails.defaultSubscriptionOfferDetails?.pricingPhases;
          const pricingPhase = pricingPhases?.[0];
          if (pricingPhase?.price) {
            const priceData = pricingPhase.price as any;
            price = priceData.amountMicros ? priceData.amountMicros / 1000000 : (priceData.amount || 0);
            currencyCode = priceData.currencyCode || 'USD';
            title = product.storeDetails.title || product.qonversionID;
            description = product.storeDetails.description || '';
          }
        }

        const productType = (product as any).type || '';
        return {
          qonversionId: product.qonversionID,
          storeId: product.storeID || product.qonversionID,
          type: String(productType).toLowerCase().includes('subscription') ? 'subscription' : 'one_time',
          duration,
          price,
          currencyCode,
          title,
          description,
        };
      });
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * Get all available offerings from Qonversion
 */
export async function getOfferings(): Promise<QonversionOfferings> {
  try {
    const offerings = await Qonversion.getSharedInstance().offerings();
    if (!offerings) {
      return {
        main: null,
        available: [],
      };
    }
    
    // Convert offerings to our type
    const mainOffering = offerings.main ? {
      id: offerings.main.id || 'main',
      products: offerings.main.products.map((p: Product) => {
        const productType = (p as any).type || '';
        return {
          qonversionId: p.qonversionID,
          storeId: p.storeID || p.qonversionID,
          type: String(productType).toLowerCase().includes('subscription') ? 'subscription' as const : 'one_time' as const,
          duration: 'monthly' as const,
          price: Platform.OS === 'ios' && p.skProduct ? parseFloat(String(p.skProduct.price || 0)) : 0,
          currencyCode: Platform.OS === 'ios' && p.skProduct ? (p.skProduct.currencyCode || 'USD') : 'USD',
          title: p.qonversionID,
          description: '',
        };
      }),
    } : null;

    return {
      main: mainOffering,
      available: [],
    };
  } catch (error) {
    console.error('Failed to get offerings:', error);
    return {
      main: null,
      available: [],
    };
  }
}

/**
 * Get specific product by ID
 */
export async function getProduct(productId: string): Promise<QonversionProduct | null> {
  try {
    const products = await getAvailableProducts();
    return products.find(p => p.qonversionId === productId || p.storeId === productId) || null;
  } catch (error) {
    console.error('Failed to get product:', error);
    return null;
  }
}

/**
 * Format price for display using user's locale
 */
export function formatPrice(price: number, currencyCode: string): string {
  try {
    // Use user's locale from expo-localization
    const locale = Localization.locale || 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(price);
  } catch (error) {
    // Fallback if locale formatting fails
    return `${currencyCode} ${price.toFixed(2)}`;
  }
}

/**
 * Get subscription period label
 */
export function getPeriodLabel(duration: string): string {
  switch (duration) {
    case 'weekly':
      return 'Week';
    case 'monthly':
      return 'Month';
    case 'annual':
    case 'yearly':
      return 'Year';
    default:
      return duration;
  }
}

/**
 * Calculate savings for annual vs monthly
 */
export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): {
  percentage: number;
  amount: number;
} {
  const monthlyAnnualCost = monthlyPrice * 12;
  const savings = monthlyAnnualCost - annualPrice;
  const percentage = (savings / monthlyAnnualCost) * 100;

  return {
    percentage: Math.round(percentage),
    amount: savings,
  };
}

