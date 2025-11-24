# Pricing Card Rebuild - New Zealand Implementation

## Overview
The pricing card has been completely rebuilt to use only a curated list of top supermarkets/stores for New Zealand. This ensures accurate, local pricing information from trusted sources.

## Changes Made

### 1. Curated Store List for New Zealand
The pricing system now uses **ONLY** the following 5 stores for New Zealand:

1. **New World** - `https://www.newworld.co.nz/shop/search?q={query}`
2. **Pack n Save** (Pak'nSave) - `https://www.paknsave.co.nz/shop/search?q={query}`
3. **Countdown** - `https://www.countdown.co.nz/shop/searchproducts?q={query}`
4. **Woolworths** - `https://www.woolworths.co.nz/shop/search?q={query}`
5. **Fresh Choice** - `https://www.freshchoice.co.nz/shop/search?q={query}`

**Note:** Countdown was rebranded to Woolworths in 2023, but both are included as requested.

### 2. Google Shopping Integration
Google Shopping has been added as a **special pricing source** for New Zealand only:
- Fetches prices from Google Shopping search results
- Automatically uses NZD currency for New Zealand
- Results are marked as "Google Shopping" retailer
- Only enabled for New Zealand (countryCode === 'NZ')

### 3. Files Modified

#### `src/services/pricingApis/countryStores.ts`
- **Removed** all stores except the 5 curated ones for New Zealand
- **Removed:** Four Square, SuperValue, The Warehouse
- **Kept:** New World, Pack n Save, Countdown, Woolworths, Fresh Choice

#### `src/services/pricingService.ts`
- Added import for `fetchGoogleShoppingPrices`
- Added Google Shopping fetch for New Zealand in `fetchLocalStorePricesOnly()`
- Updated retailer filtering to allow Google Shopping for NZ
- Enhanced filtering logic to properly handle Google Shopping results

#### `src/services/pricingApis/googleShoppingPricing.ts`
- Added `countryCode` parameter to `fetchGoogleShoppingPrices()`
- Added currency detection based on country code (NZD for NZ)
- Improved currency handling for country-specific results

## How It Works

1. **User Location Detection**: The system detects the user's country code from their geolocation
2. **Store Selection**: For New Zealand (NZ), only the 5 curated stores are used
3. **Price Scraping**: Each store's website is scraped for product prices
4. **Google Shopping**: For NZ, Google Shopping is also queried as an additional source
5. **Price Aggregation**: All prices are normalized to NZD and aggregated by retailer
6. **Filtering**: Only prices from the curated stores + Google Shopping are displayed

## Extending to Other Countries

To add curated store lists for other countries:

1. **Update `countryStores.ts`**:
   ```typescript
   const COUNTRY_STORES: StoreChain[] = [
     {
       name: 'Store Name',
       searchUrl: 'https://store-website.com/search?q={query}',
       patterns: ['store name', 'storename'],
       countryCodes: ['COUNTRY_CODE'],
     },
     // ... add up to 5 stores
   ];
   ```

2. **Add to `COUNTRY_STORE_CONFIGS`**:
   ```typescript
   COUNTRY_CODE: {
     countryCode: 'COUNTRY_CODE',
     countryName: 'Country Name',
     chains: COUNTRY_STORES,
   }
   ```

3. **Enable Google Shopping (optional)**:
   - In `pricingService.ts`, add the country code to the Google Shopping check:
   ```typescript
   if (countryCode === 'NZ' || countryCode === 'YOUR_COUNTRY') {
     // Fetch Google Shopping prices
   }
   ```

## Testing

To test the New Zealand pricing:

1. **Set location to New Zealand** (or use a VPN/emulator)
2. **Scan a product** with barcode (e.g., `9416050589418` - Sun Valley Foods Cocoa Powder)
3. **Check pricing card** - should only show prices from:
   - New World
   - Pack n Save
   - Countdown
   - Woolworths
   - Fresh Choice
   - Google Shopping

4. **Verify no international stores** appear (e.g., Home Depot, Target, etc.)

## Notes

- **Countdown vs Woolworths**: Countdown was rebranded to Woolworths in 2023. Both are included as separate entries per your request, but they may point to the same company.
- **Google Shopping**: This is a fallback/aggregator source that provides additional pricing data from various retailers. It's only enabled for New Zealand.
- **Currency**: All prices are automatically normalized to NZD for New Zealand users.
- **Location Required**: The pricing system requires user location to determine country and fetch local prices.

## Next Steps

1. **Test with real products** in New Zealand
2. **Verify store URLs** are correct and accessible
3. **Add other countries** using the same pattern
4. **Monitor pricing accuracy** and adjust scraping logic if needed



