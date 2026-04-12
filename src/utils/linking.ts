// Deep linking configuration
import * as Linking from 'expo-linking';
import {
  buildShareUrl,
  parseShareQueryParams,
  SHARE_QUERY_CTX,
  SHARE_QUERY_REF,
  SHARE_QUERY_SRC,
} from './shareUrl';

export { buildShareUrl, parseShareQueryParams, SHARE_QUERY_CTX, SHARE_QUERY_REF, SHARE_QUERY_SRC };
export type { ShareLinkSource } from './shareUrl';

export const linking = {
  prefixes: ['truescan://', 'https://truescan.app'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Main: {
        screens: {
          Scan: {
            screens: {
              ScanHome: '',
              Result: {
                path: 'barcode/:barcode',
                parse: {
                  barcode: (barcode: string) => barcode,
                },
              },
            },
          },
          Search: {
            screens: {
              SearchHome: 'search',
            },
          },
          History: {
            screens: {
              HistoryHome: 'history',
            },
          },
          Favourites: {
            screens: {
              FavouritesHome: 'favourites',
            },
          },
          Alerts: {
            screens: {
              AlertsHome: 'alerts',
            },
          },
          Settings: 'profile',
        },
      },
      DeveloperSettings: 'developer-settings',
    },
  },
};

/**
 * Parse barcode from deep link URL
 * Examples:
 * - truescan://barcode/1234567890
 * - https://truescan.app/barcode/1234567890
 */
export function parseBarcodeFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    
    // Handle truescan://barcode/1234567890
    if (parsed.scheme === 'truescan' && parsed.hostname === 'barcode') {
      const barcode = parsed.path?.replace(/^\//, '') || parsed.queryParams?.barcode;
      if (barcode && /^\d{8,14}$/.test(barcode.toString())) {
        return barcode.toString();
      }
    }
    
    // Handle https://truescan.app/barcode/1234567890
    if (parsed.scheme === 'https' && parsed.hostname === 'truescan.app') {
      const pathParts = parsed.path?.split('/').filter(Boolean) || [];
      if (pathParts[0] === 'barcode' && pathParts[1]) {
        const barcode = pathParts[1].split('?')[0];
        if (/^\d{8,14}$/.test(barcode)) {
          return barcode;
        }
      }
    }
    
    // Handle query params
    if (parsed.queryParams?.barcode) {
      const barcode = parsed.queryParams.barcode.toString();
      if (/^\d{8,14}$/.test(barcode)) {
        return barcode;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing barcode from URL:', error);
    return null;
  }
}

/**
 * Generate universal link for a barcode with app store fallback
 * This link will:
 * - Open the app directly if installed (iOS Universal Links / Android App Links)
 * - Redirect to App Store/Play Store if app not installed
 * 
 * Format: https://truescan.app/barcode/{barcode}
 * This is configured as a universal link in app.config.js:
 * - iOS: associatedDomains: ['applinks:truescan.app']
 * - Android: intentFilters with autoVerify for https://truescan.app
 * 
 * NOTE: Requires a web page at https://truescan.app/barcode/{barcode} that:
 * 1. Detects if app is installed and opens it
 * 2. Redirects to App Store (iOS) or Play Store (Android) if app not installed
 */
export function generateUniversalLink(barcode: string): string {
  return buildShareUrl(barcode);
}

/**
 * Barcode plus optional share attribution from universal links (?ctx=&src=&ref=).
 */
export function parseProductDeepLink(url: string): {
  barcode: string | null;
  ctx?: string;
  src?: string;
  ref?: string;
} {
  const parsed = Linking.parse(url);
  const barcode = parseBarcodeFromUrl(url);
  const q = parseShareQueryParams(parsed.queryParams ?? undefined);
  return { barcode, ...q };
}

/**
 * Generate share URL for a barcode (deprecated - use generateUniversalLink instead)
 * @deprecated Use generateUniversalLink for app store fallback support
 */
export function generateBarcodeShareUrl(barcode: string): string {
  return generateUniversalLink(barcode);
}

/**
 * Generate deep link for a barcode (custom URL scheme)
 * Format: truescan://barcode/{barcode}
 * 
 * Note: This is a fallback for platforms that don't support universal links.
 * Universal links (https://truescan.app) are preferred as they work better across platforms.
 */
export function generateBarcodeDeepLink(barcode: string): string {
  return `truescan://barcode/${barcode}`;
}

/**
 * Get iOS App Store link
 * Replace [APP_STORE_ID] with actual App Store ID when app is published
 */
export function getAppStoreLink(): string {
  // iOS App Store - Update with actual App Store ID when published
  // Format: https://apps.apple.com/app/id{APP_STORE_ID}
  return 'https://apps.apple.com/app/id[APP_STORE_ID]';
}

/**
 * Get Android Play Store link
 */
export function getPlayStoreLink(): string {
  // Google Play Store
  return 'https://play.google.com/store/apps/details?id=com.truescan.foodscanner';
}

