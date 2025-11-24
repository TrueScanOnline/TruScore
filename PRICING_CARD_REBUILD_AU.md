# Pricing Card Rebuild - Australia Implementation

## Overview
The pricing card has been updated to use only a curated list of stores for Australia. This ensures accurate, local pricing information from trusted sources, with all prices displayed in Australian Dollars (AUD).

## Changes Made

### 1. Curated Store List for Australia
The pricing system now uses **ONLY** the following 6 stores for Australia:

1. **Woolworths** - `https://www.woolworths.com.au/shop/search/products?searchTerm={query}`
2. **Coles** - `https://www.coles.com.au/search?q={query}`
3. **IGA** - `https://www.iga.com.au/search?q={query}`
4. **Amazon** - `https://www.amazon.com.au/s?k={query}`
5. **Kogan** - `https://www.kogan.com/au/search/?q={query}`
6. **Catch** - `https://www.catch.com.au/search?query={query}`

**Removed stores:** Aldi, Foodworks, Foodland

### 2. Currency Handling
- All prices are automatically displayed in **AUD (Australian Dollars)**
- Currency symbol: **A$** (e.g., A$12.99)
- Prices are normalized to AUD if they come from other currencies
- The system automatically detects Australia (countryCode === 'AU') and uses AUD

### 3. Files Modified

#### `src/services/pricingApis/countryStores.ts`
- **Updated** `AU_STORES` array to only include the 6 curated stores
- **Removed:** Aldi, Foodworks, Foodland
- **Added:** Amazon, Kogan, Catch with proper search URLs

#### Currency Support
- `src/services/currencyService.ts` - Already configured for AUD
- `src/services/pricingApis/storeWebScraping.ts` - Already detects AU and uses AUD
- `src/services/pricingApis/googleShoppingPricing.ts` - Already supports AUD for AU

## How It Works

1. **User Location Detection**: The system detects the user's country code from their geolocation
2. **Store Selection**: For Australia (AU), only the 6 curated stores are used
3. **Price Scraping**: Each store's website is scraped for product prices
4. **Currency Normalization**: All prices are automatically converted/normalized to AUD
5. **Price Aggregation**: All prices are aggregated by retailer
6. **Filtering**: Only prices from the curated stores are displayed

## Store URLs

All stores have been configured with their Australian-specific search URLs:

- **Woolworths**: Uses product search endpoint
- **Coles**: Uses standard search query parameter
- **IGA**: Uses search query parameter
- **Amazon**: Uses Amazon Australia (.com.au) with search parameter
- **Kogan**: Uses Kogan Australia with search query
- **Catch**: Uses Catch.com.au search endpoint

## Testing

To test the Australia pricing:

1. **Set location to Australia** (or use a VPN/emulator)
2. **Scan a product** with barcode
3. **Check pricing card** - should only show prices from:
   - Woolworths
   - Coles
   - IGA
   - Amazon
   - Kogan
   - Catch

4. **Verify currency** - All prices should be in AUD (A$)
5. **Verify no international stores** appear (e.g., US stores, NZ stores, etc.)

## Currency Details

- **Currency Code**: AUD
- **Currency Symbol**: A$
- **Format**: A$12.99 (symbol before number)
- **Automatic Detection**: Based on country code (AU)

## Notes

- **Amazon Australia**: Uses the `.com.au` domain for Australian products
- **Kogan**: Australian e-commerce platform, good for electronics and general products
- **Catch**: Australian online marketplace, good for deals and variety
- **Location Required**: The pricing system requires user location to determine country and fetch local prices
- **No Google Shopping**: Unlike New Zealand, Google Shopping is not included for Australia (per your requirements)

## Next Steps

1. **Test with real products** in Australia
2. **Verify store URLs** are correct and accessible
3. **Monitor pricing accuracy** and adjust scraping logic if needed
4. **Add more countries** using the same pattern if needed



