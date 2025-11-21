# TrueScan Food Scanner - Handover Document

**Date:** January 2025  
**Project:** TrueScan Food Scanner (React Native / Expo)  
**Repository:** TrueScanOnline/TruScore  
**Status:** Active Development - Pricing Card Rebuilt for Local-Only Pricing

---

## 📋 Executive Summary

This document provides a comprehensive handover for continuing work on the TrueScan Food Scanner app. The most recent major change was a **complete rebuild of the pricing card** to focus **ONLY on local, location-based pricing** from nearby supermarkets/stores, removing all international/online pricing sources.

---

## 🎯 Current State & Recent Changes

### Most Recent Work: Pricing Card Rebuild (January 2025)

**What Was Done:**
- **Completely rebuilt** `pricingService.ts` to fetch prices **ONLY from local stores** based on user's geo-location
- **Removed all international/online pricing APIs** (UPCitemdb, BarcodeSpider, Google Shopping, Price.com, etc.)
- **Rebuilt** `PricingCard.tsx` to display a clean comparison of local store prices
- **Made location REQUIRED** - pricing card shows clear message if location not enabled
- **Focus on country-specific supermarkets** - only scrapes stores relevant to user's detected country

**Key Files Changed:**
- `src/services/pricingService.ts` - Completely rewritten (LOCAL STORES ONLY)
- `src/components/PricingCard.tsx` - Rebuilt with store comparison view
- `src/services/pricingApis/countryStores.ts` - Country-specific store configurations
- `src/services/pricingApis/localStorePricing.ts` - Nearby store finder
- `src/services/pricingApis/storeWebScraping.ts` - Real-time web scraping for local stores

**How It Works Now:**
1. User scans barcode → Product Info page displays
2. Pricing card checks location → If enabled, fetches local store prices
3. Scrapes country-specific stores → e.g., Pack n Save, Countdown (NZ) or Walmart, Target (US)
4. Displays comparison → Shows prices from all local stores, sorted by price
5. User can compare → See which local store has the best price while shopping

**Current Status:**
- ✅ Pricing service rebuilt and tested
- ✅ Pricing card UI rebuilt with store comparison
- ✅ Location requirement enforced
- ✅ TypeScript compilation passes
- ⚠️ **Needs Testing** - Real-world testing with actual barcodes and locations required

---

## 📁 Project Structure

### Key Directories

```
TrueScan-FoodScanner/
├── app/                          # Expo Router pages
│   ├── index.tsx                 # Main Scan screen
│   ├── result/[barcode].tsx      # Product result screen
│   └── search.tsx                # Search screen
├── src/
│   ├── components/               # React Native components
│   │   ├── PricingCard.tsx       # ⭐ RECENTLY REBUILT - Local pricing only
│   │   ├── TrustScoreInfoModal.tsx
│   │   ├── RecallAlertModal.tsx
│   │   ├── AllergensAdditivesModal.tsx
│   │   ├── PalmOilInfoModal.tsx
│   │   ├── CameraCaptureModal.tsx
│   │   └── ...
│   ├── services/                 # Business logic services
│   │   ├── pricingService.ts     # ⭐ RECENTLY REBUILT - LOCAL STORES ONLY
│   │   ├── productService.ts     # Product data fetching (Open Food Facts)
│   │   ├── currencyService.ts    # Currency conversion & formatting
│   │   ├── priceStorageService.ts # Price caching & user submissions
│   │   ├── cacheService.ts       # Product image caching
│   │   ├── fdaRecallService.ts   # Food recall alerts
│   │   ├── pricingApis/          # Pricing API integrations
│   │   │   ├── countryStores.ts  # ⭐ Country-specific store configs
│   │   │   ├── localStorePricing.ts # Nearby store finder
│   │   │   ├── storeWebScraping.ts  # Real-time web scraping
│   │   │   ├── corsProxy.ts      # CORS bypass utility
│   │   │   └── ...
│   │   └── ...
│   ├── utils/                    # Utility functions
│   │   ├── trustScore.ts         # Trust Score calculation wrapper
│   │   └── ...
│   ├── lib/                      # Core libraries
│   │   ├── scoringEngine.ts      # TruScore v1.3 engine (4-pillar scoring)
│   │   └── ...
│   ├── types/                    # TypeScript definitions
│   │   ├── product.ts            # Product & Trust Score types
│   │   ├── pricing.ts            # Pricing types
│   │   └── ...
│   ├── theme/                    # App theming
│   ├── i18n/                     # Internationalization
│   │   └── locales/
│   │       └── en.json           # English translations
│   └── ...
├── HANDOVER_DOCUMENT.md          # ⭐ THIS FILE - Read this first!
└── ...
```

### Critical Files for Pricing Feature

1. **`src/services/pricingService.ts`** (Lines 1-385)
   - Main pricing service - **LOCAL STORES ONLY**
   - Requires user location
   - Fetches prices from country-specific supermarkets
   - Returns `ProductPricing | null` if no location

2. **`src/components/PricingCard.tsx`** (Lines 1-710)
   - UI component for displaying pricing
   - Shows store-by-store price comparison
   - Handles location errors gracefully
   - Displays average, min, max prices

3. **`src/services/pricingApis/countryStores.ts`** (Lines 1-401)
   - Country-specific supermarket configurations
   - Supports: NZ, US, GB, AU, CA
   - Defines store chains with search URLs

4. **`src/services/pricingApis/storeWebScraping.ts`** (Lines 1-342)
   - Real-time web scraping from store websites
   - Uses CORS proxy for bypassing restrictions
   - Extracts prices from HTML

---

## 🔧 Technical Architecture

### Pricing System Flow

```
User Scans Barcode
    ↓
Product Info Page Loads
    ↓
PricingCard Component Mounts
    ↓
Check Location Permission
    ├─→ DENIED → Show "Enable Location" message
    └─→ GRANTED → Get User Location (lat/lng + country)
        ↓
Reverse Geocode (get country code)
    ↓
Get Country-Specific Store Chains
    ↓
For Each Store Chain:
    ├─→ Build Search URL
    ├─→ Scrape Store Website (via CORS proxy)
    ├─→ Extract Price from HTML
    └─→ Add to Price List
    ↓
Also: Find Nearby Physical Stores (via Google Places/Geoapify)
    ↓
Aggregate All Prices
    ├─→ Filter Outliers
    ├─→ Calculate Min/Max/Average/Median
    └─→ Group by Retailer
    ↓
Display in PricingCard
    ├─→ Show Average Price
    ├─→ Show Price Range
    └─→ Show Store Comparison (sorted by price)
```

### Key Technologies

- **React Native / Expo** - Mobile framework
- **Expo Router** - File-based routing
- **TypeScript** - Type safety
- **expo-location** - Geolocation services
- **expo-camera** - Barcode scanning
- **AsyncStorage** - Local caching
- **React i18next** - Internationalization

### External Dependencies

- **Open Food Facts API** - Product database
- **Google Places API** - Nearby store finding (optional, requires API key)
- **Geoapify API** - Alternative nearby store finder (optional, requires API key)
- **CORS Proxies** - For web scraping (AllOrigins, etc.)

---

## 🐛 Known Issues & Pending Tasks

### Current Issues

1. **Pricing Card Testing Required**
   - ⚠️ New pricing system needs real-world testing
   - Need to verify scraping works for different countries
   - Need to test with actual barcodes and locations

2. **Location Permissions**
   - App requires location permission for pricing
   - Need to ensure proper error handling for denied permissions
   - May need better user messaging

3. **Store Web Scraping Reliability**
   - Web scraping can be fragile (store websites change)
   - May need regular updates to scraping patterns
   - Some stores may block scraping attempts

4. **Country Coverage**
   - Currently supports: NZ, US, GB, AU, CA
   - May need to add more countries
   - May need more stores per country

### Previously Completed (Not Currently Relevant)

- ✅ Trust Score v1.3 implementation
- ✅ Eco-Score card conditional display
- ✅ Palm Oil card with info modal
- ✅ Ingredients card barcode filtering
- ✅ Allergens & Additives modal with E-number database
- ✅ Food recall alerts (FDA API)
- ✅ Scanner functionality fixes
- ✅ Image caching fixes

---

## 🚀 Next Steps & Recommendations

### Immediate Next Steps

1. **Test Pricing Card**
   - Test with real barcodes in different countries
   - Verify location detection works correctly
   - Check that store scraping returns valid prices
   - Test with location permission denied

2. **Improve Error Handling**
   - Better messages when no prices found
   - Handle network errors gracefully
   - Provide fallback options

3. **Enhance Store Coverage**
   - Add more stores per country
   - Verify search URLs are still valid
   - Test scraping patterns for each store

4. **User Experience**
   - Add loading states for store scraping
   - Show progress when fetching multiple stores
   - Allow user to refresh prices

### Future Enhancements

1. **User Price Submissions**
   - Allow users to submit prices from stores
   - Verify submissions with moderation
   - Use submissions to fill gaps

2. **Price History**
   - Track price changes over time
   - Show price trends
   - Alert users to price drops

3. **Store Distance**
   - Show distance to each store
   - Sort by distance + price
   - Show store hours/availability

4. **Offline Support**
   - Cache prices for offline viewing
   - Allow viewing cached prices without location

---

## 📝 Key Code Patterns

### How to Fetch Prices

```typescript
import { pricingService } from '../services/pricingService';

// In your component
const pricing = await pricingService.getProductPricing(
  barcode,
  undefined, // targetCurrency (auto-detected from location)
  false,     // forceRefresh
  productName // optional
);

// Returns ProductPricing | null (null if no location or no prices found)
```

### Pricing Data Structure

```typescript
interface ProductPricing {
  barcode: string;
  currency: string;
  location?: LocationInfo; // REQUIRED - user's location
  prices: PriceEntry[];    // All price entries
  priceRange: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  retailers?: RetailerPrice[]; // Grouped by retailer
  trends: {
    currentPrice: number;
    priceChangeDirection: 'up' | 'down' | 'stable';
    volatility: 'low' | 'medium' | 'high';
  };
  dataQuality: 'high' | 'medium' | 'low' | 'insufficient';
  lastUpdated: number;
}
```

### Adding a New Country Store

Edit `src/services/pricingApis/countryStores.ts`:

```typescript
const NEW_COUNTRY_STORES: StoreChain[] = [
  {
    name: 'Store Name',
    searchUrl: 'https://store.com/search?q={query}',
    patterns: ['store name', 'storename'],
    countryCodes: ['XX'], // ISO country code
  },
];

// Add to COUNTRY_STORE_CONFIGS
export const COUNTRY_STORE_CONFIGS: Record<string, CountryStoreConfig> = {
  // ... existing countries
  XX: {
    countryCode: 'XX',
    countryName: 'Country Name',
    chains: NEW_COUNTRY_STORES,
  },
};
```

---

## 🔍 Debugging Tips

### Check Location Status

```typescript
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
console.log('Location permission:', status); // 'granted' | 'denied'

const location = await Location.getCurrentPositionAsync({});
console.log('Location:', location.coords.latitude, location.coords.longitude);

const reverseGeocode = await Location.reverseGeocodeAsync({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
});
console.log('Country:', reverseGeocode[0]?.isoCountryCode);
```

### Debug Pricing Service

```typescript
// In pricingService.ts, add console.logs:
console.log(`[pricingService] Location: ${location.city || location.region || location.country} (${location.countryCode})`);
console.log(`[pricingService] Found ${storeChains.length} store chains for ${countryCode}`);
console.log(`[pricingService] Total local prices found: ${allPrices.length}`);
```

### Check Store Scraping

```typescript
// In storeWebScraping.ts, check:
console.log(`[StoreWebScraping] Scraping ${store.name} for ${barcode}: ${searchUrl}`);
console.log(`[StoreWebScraping] HTML length: ${html?.length || 0}`);
console.log(`[StoreWebScraping] Extracted prices: ${extractedPrices.length}`);
```

---

## 📚 Important Notes

### Location Requirement

**CRITICAL:** The pricing system **REQUIRES** user location. If location is not available:
- `pricingService.getProductPricing()` returns `null`
- `PricingCard` shows "Enable Location" message
- No fallback to international pricing

### Country-Specific Stores

The system only scrapes stores relevant to the user's detected country:
- **NZ:** Pack n Save, Countdown, New World, Fresh Choice, etc.
- **US:** Walmart, Target, Kroger, Safeway, Costco, etc.
- **GB:** Tesco, Sainsbury's, Asda, Morrisons, Waitrose, etc.
- **AU:** Woolworths, Coles, IGA, Aldi, etc.
- **CA:** Loblaws, Sobeys, Metro, Save-On-Foods, etc.

### Currency Detection

Currency is automatically detected from user's location:
- Uses `currencyService.getLocalCurrency()` which detects from device locale
- Prices are normalized to local currency
- Currency symbol formatting handled by `currencyService.formatPrice()`

---

## 🔗 Related Documentation

### Configuration Files

- `app.json` / `app.config.js` - Expo configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration

### Translation Files

- `src/i18n/locales/en.json` - English translations
  - Look for `pricing.*` keys for pricing-related text

### Environment Variables

Check for these (may be in `.env` or `app.config.js`):
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` - For nearby store finding
- `EXPO_PUBLIC_GEOAPIFY_API_KEY` - Alternative store finder

---

## 💬 Conversation Context

### Recent User Feedback

**User's Core Requirement:**
> "When the user scans a barcode (usually at the supermarket), then the 'Product Information card will display. The PRICING INFORMATION card needs to only find pricing information from the users actual location (geo-location eg country/city). ONLY source pricing from local supermarkets, local websites, local stores, etc (not international pricing, only local pricing in local currency from local supermarkets). Ideally the user can see prices of that scanned product being sold in different stores to see the price variation, so they can make an informed choice while they scan the product."

**Previous Issues Resolved:**
- Pricing card was showing incorrect/widespread prices
- Too many international sources causing confusion
- Location not being properly used
- Price trends showing inaccurate percentages

**Solution Implemented:**
- Complete rebuild focusing ONLY on local stores
- Removed all international APIs
- Made location required
- Clean store comparison UI

---

## 📞 Support & Questions

### If You Need Help Understanding:

1. **Pricing System** - Check `src/services/pricingService.ts` comments
2. **Store Configurations** - Check `src/services/pricingApis/countryStores.ts`
3. **UI Components** - Check `src/components/PricingCard.tsx`
4. **Location Services** - Check expo-location documentation

### Common Questions:

**Q: Why is pricing returning null?**  
A: Check if location permission is granted and location is available. The system requires location.

**Q: How do I add a new store?**  
A: Edit `countryStores.ts` and add the store to the appropriate country's store list.

**Q: Why are prices not showing for a store?**  
A: The store's website may have changed their HTML structure, or they may be blocking scraping. Check scraping logs.

**Q: Can I test without location?**  
A: No, the pricing system requires location. You can mock location in development, but it won't work in production without real location.

---

## ✅ Testing Checklist

Before considering the pricing card "complete":

- [ ] Test with location permission granted
- [ ] Test with location permission denied (should show enable location message)
- [ ] Test in different countries (NZ, US, GB, AU, CA)
- [ ] Test with real barcodes (not just test data)
- [ ] Verify store scraping returns valid prices
- [ ] Check that price comparison displays correctly
- [ ] Test with products that have no local prices
- [ ] Verify currency formatting is correct
- [ ] Test price outlier filtering works
- [ ] Verify caching works (prices cached for 30 minutes)

---

## 📌 Final Notes

This handover document is your starting point. When you begin a new chat, reference this document:

1. **Read this file first** - `HANDOVER_DOCUMENT.md`
2. **Check recent changes** - Focus on pricing-related files
3. **Review code comments** - Important logic is commented
4. **Test incrementally** - Start with one country/store before expanding

**Last Updated:** January 2025  
**Next Review:** After pricing system testing is complete

---

**Good luck! 🚀**
