// Country detection utility
// Mobile: device locale via expo-localization (when available).
// Node / Vercel: TRUESCAN_DEFAULT_COUNTRY_CODE (ISO 3166-1 alpha-2) — optional.

type ExpoLocalization = typeof import('expo-localization');

/**
 * Get user's country code from device locale (Expo) or server env.
 * Returns ISO 3166-1 alpha-2 (e.g. 'NZ', 'AU').
 */
export function getUserCountryCode(): string | null {
  try {
    const Localization = require('expo-localization') as ExpoLocalization;
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const regionCode = locales[0]?.regionCode;
      if (regionCode) {
        return regionCode.toUpperCase();
      }
      const localeString = locales[0]?.languageTag || locales[0]?.languageCode || '';
      if (localeString) {
        const parts = localeString.split('-');
        if (parts.length >= 2) {
          const countryCode = parts[parts.length - 1].toUpperCase();
          if (countryCode.length === 2) {
            return countryCode;
          }
        }
      }
    }
  } catch {
    // No expo-localization (Vercel, plain Node, some tests)
  }

  const env = process.env.TRUESCAN_DEFAULT_COUNTRY_CODE?.trim();
  if (env && /^[A-Z]{2}$/i.test(env)) {
    return env.toUpperCase();
  }
  return null;
}

/**
 * Check if a country code is a member of the European Union
 * Returns true if the country is an EU member state
 */
export function isEUCountry(countryCode: string | null): boolean {
  if (!countryCode) return false;
  
  const euCountries = [
    'AT', // Austria
    'BE', // Belgium
    'BG', // Bulgaria
    'HR', // Croatia
    'CY', // Cyprus
    'CZ', // Czech Republic
    'DK', // Denmark
    'EE', // Estonia
    'FI', // Finland
    'FR', // France
    'DE', // Germany
    'GR', // Greece
    'HU', // Hungary
    'IE', // Ireland
    'IT', // Italy
    'LV', // Latvia
    'LT', // Lithuania
    'LU', // Luxembourg
    'MT', // Malta
    'NL', // Netherlands
    'PL', // Poland
    'PT', // Portugal
    'RO', // Romania
    'SK', // Slovakia
    'SI', // Slovenia
    'ES', // Spain
    'SE', // Sweden
  ];
  
  return euCountries.includes(countryCode.toUpperCase());
}

/**
 * Get list of country codes to try for product lookups
 * Priority: User's country > Common countries > Global
 */
export function getCountryCodesToTry(): string[] {
  const userCountry = getUserCountryCode();
  const countries: string[] = [];
  
  // Add user's country first (highest priority)
  if (userCountry) {
    countries.push(userCountry);
  }
  
  // Add common countries that have active Open Food Facts instances
  // These are countries with high product coverage
  const commonCountries = ['NZ', 'AU', 'GB', 'US', 'CA', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'TR'];
  
  for (const country of commonCountries) {
    if (country !== userCountry) {
      countries.push(country);
    }
  }
  
  return countries;
}

/**
 * Map country code to Open Food Facts country instance URL
 * Returns null if country doesn't have a dedicated instance (use world.openfoodfacts.org)
 */
export function getOFFCountryInstance(countryCode: string): string | null {
  // Countries with dedicated Open Food Facts instances
  const countryInstances: Record<string, string> = {
    'NZ': 'nz.openfoodfacts.org',
    'AU': 'au.openfoodfacts.org',
    'GB': 'uk.openfoodfacts.org', // UK uses 'uk' subdomain
    'US': 'us.openfoodfacts.org',
    'CA': 'ca.openfoodfacts.org',
    'FR': 'fr.openfoodfacts.org',
    'DE': 'de.openfoodfacts.org',
    'IT': 'it.openfoodfacts.org',
    'ES': 'es.openfoodfacts.org',
    'NL': 'nl.openfoodfacts.org',
    'BE': 'be.openfoodfacts.org',
    'TR': 'tr.openfoodfacts.org',
    'PL': 'pl.openfoodfacts.org',
    'CZ': 'cz.openfoodfacts.org',
    'IE': 'ie.openfoodfacts.org',
    'PT': 'pt.openfoodfacts.org',
    'GR': 'gr.openfoodfacts.org',
    'HU': 'hu.openfoodfacts.org',
    'RO': 'ro.openfoodfacts.org',
    'BG': 'bg.openfoodfacts.org',
    'HR': 'hr.openfoodfacts.org',
    'SK': 'sk.openfoodfacts.org',
    'SI': 'si.openfoodfacts.org',
    'LT': 'lt.openfoodfacts.org',
    'LV': 'lv.openfoodfacts.org',
    'EE': 'ee.openfoodfacts.org',
    'LU': 'lu.openfoodfacts.org',
    'MT': 'mt.openfoodfacts.org',
    'CY': 'cy.openfoodfacts.org',
    'JP': 'jp.openfoodfacts.org',
    'CN': 'cn.openfoodfacts.org',
    'KR': 'kr.openfoodfacts.org',
    'IN': 'in.openfoodfacts.org',
    'SG': 'sg.openfoodfacts.org',
    'MY': 'my.openfoodfacts.org',
    'TH': 'th.openfoodfacts.org',
    'VN': 'vn.openfoodfacts.org',
    'PH': 'ph.openfoodfacts.org',
    'ID': 'id.openfoodfacts.org',
    'TW': 'tw.openfoodfacts.org',
    'HK': 'hk.openfoodfacts.org',
    'MX': 'mx.openfoodfacts.org',
    'BR': 'br.openfoodfacts.org',
    'AR': 'ar.openfoodfacts.org',
    'CL': 'cl.openfoodfacts.org',
    'CO': 'co.openfoodfacts.org',
    'PE': 'pe.openfoodfacts.org',
    'ZA': 'za.openfoodfacts.org',
    'EG': 'eg.openfoodfacts.org',
    'IL': 'il.openfoodfacts.org',
    'PS': 'ps.openfoodfacts.org',
    'AE': 'ae.openfoodfacts.org',
    'SA': 'sa.openfoodfacts.org',
    'KW': 'kw.openfoodfacts.org',
    'QA': 'qa.openfoodfacts.org',
    'BH': 'bh.openfoodfacts.org',
    'OM': 'om.openfoodfacts.org',
    'YE': 'ye.openfoodfacts.org',
    'IQ': 'iq.openfoodfacts.org',
    'JO': 'jo.openfoodfacts.org',
    'LB': 'lb.openfoodfacts.org',
    'SY': 'sy.openfoodfacts.org',
    'PK': 'pk.openfoodfacts.org',
    'BD': 'bd.openfoodfacts.org',
    'LK': 'lk.openfoodfacts.org',
    'MV': 'mv.openfoodfacts.org',
    'NP': 'np.openfoodfacts.org',
    'BT': 'bt.openfoodfacts.org',
    'AF': 'af.openfoodfacts.org',
    'RU': 'ru.openfoodfacts.org',
    'UA': 'ua.openfoodfacts.org',
    'BY': 'by.openfoodfacts.org',
    'KZ': 'kz.openfoodfacts.org',
    'UZ': 'uz.openfoodfacts.org',
    'TM': 'tm.openfoodfacts.org',
    'TJ': 'tj.openfoodfacts.org',
    'KG': 'kg.openfoodfacts.org',
    'MN': 'mn.openfoodfacts.org',
    'GE': 'ge.openfoodfacts.org',
    'AM': 'am.openfoodfacts.org',
    'AZ': 'az.openfoodfacts.org',
  };
  
  return countryInstances[countryCode.toUpperCase()] || null;
}

