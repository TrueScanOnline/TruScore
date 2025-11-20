// Deep linking configuration
import * as Linking from 'expo-linking';

export const linking = {
  prefixes: ['truescan://', 'https://truescan.app'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Main: {
        screens: {
          Scan: '',
          Search: 'search',
          History: 'history',
          Favourites: 'favourites',
          Profile: 'profile',
        },
      },
      Result: {
        path: 'barcode/:barcode',
        parse: {
          barcode: (barcode: string) => barcode,
        },
      },
      Settings: 'settings',
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
        const barcode = pathParts[1];
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
 * Generate share URL for a barcode
 */
export function generateBarcodeShareUrl(barcode: string): string {
  return `https://truescan.app/barcode/${barcode}`;
}

/**
 * Generate deep link for a barcode
 */
export function generateBarcodeDeepLink(barcode: string): string {
  return `truescan://barcode/${barcode}`;
}

