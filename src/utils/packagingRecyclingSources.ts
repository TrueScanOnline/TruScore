/**
 * Open Food Facts product URL + government recycling pages by user region.
 */

import { getUserCountryCode, isEUCountry } from './countryDetection';

/** NZ region: Australasian Recycling Label. */
const NZ_RECYCLING_SOURCE = 'https://www.arl.org.nz/';
const AU_GOV_WASTE = 'https://www.dcceew.gov.au/environment/waste';

export function openFoodFactsProductUrl(barcode: string): string {
  const b = (barcode || '').trim();
  return b
    ? `https://world.openfoodfacts.org/product/${encodeURIComponent(b)}`
    : 'https://world.openfoodfacts.org/';
}

export function resolvePackagingCountryCode(explicit?: string | null): string {
  const raw = (explicit ?? getUserCountryCode() ?? 'GLOBAL').toUpperCase();
  if (raw.length === 2 && /^[A-Z]{2}$/.test(raw)) {
    return raw;
  }
  return 'GLOBAL';
}

/**
 * Single government (or official national) recycling guidance URL for the packaging sources modal.
 * Returns null when region is unknown / GLOBAL.
 */
export function getGovernmentRecyclingPageUrl(
  countryCode?: string | null
): { url: string; labelKey: string; label: string } | null {
  const code = resolvePackagingCountryCode(countryCode);
  switch (code) {
    case 'NZ':
      return {
        url: NZ_RECYCLING_SOURCE,
        labelKey: 'result.packagingSourceArlNz',
        label: 'Australasian Recycling Label — arl.org.nz',
      };
    case 'AU':
      return {
        url: AU_GOV_WASTE,
        labelKey: 'result.packagingSourceGovAu',
        label: 'Australian Government — waste & recycling',
      };
    case 'US':
      return {
        url: 'https://www.epa.gov/recycle',
        labelKey: 'result.packagingSourceGovUs',
        label: 'US EPA — Recycling',
      };
    case 'GB':
      return {
        url: 'https://www.recyclenow.com/',
        labelKey: 'result.packagingSourceRecycleNowUk',
        label: 'Recycle Now (UK)',
      };
    default:
      if (isEUCountry(code)) {
        return {
          url: 'https://environment.ec.europa.eu/topics/waste-and-recycling_en',
          labelKey: 'result.packagingSourceEu',
          label: 'European Commission — waste & recycling',
        };
      }
      return null;
  }
}
