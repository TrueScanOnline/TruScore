// Deep linking configuration
import * as Linking from 'expo-linking';
import { getStateFromPath as getStateFromPathDefault } from '@react-navigation/native';
import {
  buildShareUrl,
  isShareWebHostname,
  parseShareQueryParams,
  SHARE_QUERY_CTX,
  SHARE_QUERY_REF,
  SHARE_QUERY_SRC,
} from './shareUrl';
import { isMvpAlertsTabEnabled } from '../config/mvpRuntimeGates';
import { normalizeBarcodeDeepLinkPath } from './resultProductLoadGuard';

export {
  buildShareUrl,
  isShareWebHostname,
  parseShareQueryParams,
  SHARE_QUERY_CTX,
  SHARE_QUERY_REF,
  SHARE_QUERY_SRC,
};
export type { ShareLinkSource } from './shareUrl';
export { normalizeBarcodeDeepLinkPath } from './resultProductLoadGuard';

const linkingConfig = {
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
                // Keep raw token; Result applies the existing digit-length contract.
                barcode: (barcode: string) => decodeURIComponent(barcode),
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
        ...(isMvpAlertsTabEnabled()
          ? {
              Alerts: {
                screens: {
                  AlertsHome: 'alerts',
                },
              },
            }
          : {}),
        Settings: 'profile',
      },
    },
    DeveloperSettings: 'developer-settings',
  },
} as const;

export const linking = {
  prefixes: [
    'truescan://',
    'https://truescan.app',
    'https://truscoreapi.vercel.app',
    'https://truscoreapi-uat.vercel.app',
  ],
  config: linkingConfig,
  /**
   * SJ-06/SJ-07: empty and rejected extra-segment barcode paths still navigate so
   * Result can clear prior product UI via invalid_input (not a verified unknown product).
   */
  getStateFromPath(path: string, options: Parameters<typeof getStateFromPathDefault>[1]) {
    const normalized = normalizeBarcodeDeepLinkPath(path);
    const stripped = normalized.replace(/^\/+/, '');
    const isEmptyBarcode =
      stripped === 'barcode' || stripped === 'barcode/' || /^barcode\/?\?/.test(stripped);

    if (isEmptyBarcode) {
      // Explicit state — empty string is not a product substitution; Result rejects via existing /^\d{8,14}$/.
      return {
        routes: [
          {
            name: 'Main',
            state: {
              index: 0,
              routes: [
                {
                  name: 'Scan',
                  state: {
                    index: 1,
                    routes: [
                      { name: 'ScanHome' },
                      { name: 'Result', params: { barcode: '' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
        index: 0,
      };
    }

    return getStateFromPathDefault(normalized, {
      ...options,
      screens: linkingConfig.screens as never,
    });
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
    
    // Handle truescan://barcode/1234567890 (first path segment only — extra segments ignored)
    if (parsed.scheme === 'truescan' && parsed.hostname === 'barcode') {
      const raw = parsed.path?.replace(/^\//, '') || parsed.queryParams?.barcode;
      const barcode =
        typeof raw === 'string' ? raw.split('/').filter(Boolean)[0] : raw?.toString();
      if (barcode && /^\d{8,14}$/.test(barcode)) {
        return barcode;
      }
    }
    
    // Handle https://{share-web-host}/barcode/1234567890 (truescan.app or Vercel interim hosts)
    if (parsed.scheme === 'https' && parsed.hostname && isShareWebHostname(parsed.hostname)) {
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
 * Format: https://{share-web-host}/barcode/{barcode}
 * Temporary public host: truscoreapi.vercel.app (permanent domain deferred).
 * Native associations must include that host for verified App/Universal Links;
 * custom scheme truescan://barcode/{barcode} remains the explicit Open in Rveel fallback.
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

