# TrueScan Codebase Index for GROK

This document provides a comprehensive index of the TrueScan codebase to help GROK understand the project structure and locate specific code.

## 📁 Project Structure

### Core Application Files

```
TrueScan-FoodScanner/
├── app/                          # Expo Router screens (main app UI)
│   ├── _layout.tsx              # Root navigation layout
│   ├── index.tsx                # Scan screen (barcode scanner)
│   ├── onboarding.tsx            # Onboarding flow
│   ├── result/[barcode].tsx     # Product result screen (MAIN PRODUCT PAGE)
│   ├── search.tsx               # Product search screen
│   ├── history.tsx              # Scan history
│   ├── favourites.tsx           # Favourites list
│   ├── settings.tsx             # Settings screen
│   ├── profile.tsx              # User profile
│   ├── subscription.tsx         # Subscription management
│   └── values.tsx                # Values/preferences screen
│
├── src/                          # Core application code
│   ├── components/               # React components
│   │   ├── TrustScoreInfoModal.tsx      # Trust Score explanation modal
│   │   ├── ConfidenceBadge.tsx          # Data quality confidence badge
│   │   ├── PackagingInfoModal.tsx        # Packaging/recycling info modal
│   │   ├── ManualProductEntryModal.tsx  # Manual product entry form
│   │   ├── AllergensAdditivesModal.tsx  # Allergens & additives display
│   │   ├── PalmOilInfoModal.tsx         # Palm oil analysis modal
│   │   ├── EcoScore.tsx                 # Eco-Score display
│   │   ├── TruScore.tsx                 # TruScore display component
│   │   ├── NutritionTable.tsx            # Nutrition facts table
│   │   └── [many more components...]
│   │
│   ├── services/                # API services and data fetching
│   │   ├── productService.ts            # MAIN PRODUCT FETCHING SERVICE
│   │   ├── openFoodFacts.ts             # Open Food Facts API
│   │   ├── openBeautyFacts.ts           # Open Beauty Facts API
│   │   ├── openPetFoodFacts.ts          # Open Pet Food Facts API
│   │   ├── openProductsFacts.ts          # Open Products Facts API
│   │   ├── usdaFoodData.ts              # USDA FoodData Central API
│   │   ├── gs1DataSource.ts             # GS1 Data Source API
│   │   ├── upcitemdb.ts                 # UPCitemdb API
│   │   ├── barcodeSpider.ts             # Barcode Spider API
│   │   ├── barcodeMonsterApi.ts         # Barcode Monster API
│   │   ├── goUpcApi.ts                  # Go-UPC API
│   │   ├── buycottApi.ts                # Buycott API
│   │   ├── openGtindbApi.ts             # Open GTIN Database API
│   │   ├── nzStoreApi.ts                # New Zealand store APIs
│   │   ├── auRetailerScraping.ts        # Australian retailer APIs
│   │   ├── fsanDatabase.ts               # FSANZ database service
│   │   ├── fdaRecallService.ts           # FDA recall checking
│   │   ├── additiveDatabase.ts          # E-number additives database
│   │   ├── manualProductService.ts      # Manual product entry service
│   │   ├── webSearchFallback.ts         # Web search fallback
│   │   ├── cacheService.ts              # Offline caching
│   │   ├── productDataMerger.ts         # Product data merging
│   │   └── pricingService.ts            # Pricing data service
│   │
│   ├── utils/                    # Utility functions
│   │   ├── confidenceScoring.ts         # Confidence score calculation
│   │   ├── trustScore.ts                # Trust Score calculation
│   │   ├── packagingRecyclability.ts    # Packaging recyclability logic
│   │   ├── barcodeNormalization.ts      # Barcode format normalization
│   │   ├── countryDetection.ts          # User country detection
│   │   └── [many more utilities...]
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── product.ts                   # Product type definitions
│   │   └── pricing.ts                   # Pricing type definitions
│   │
│   ├── store/                     # Zustand state management
│   │   ├── useSettingsStore.ts          # App settings
│   │   ├── useScanStore.ts              # Scan history
│   │   ├── useFavoritesStore.ts         # Favourites
│   │   ├── useSubscriptionStore.ts     # Subscription state
│   │   └── useValuesStore.ts            # User values/preferences
│   │
│   ├── lib/                       # Core libraries
│   │   ├── truscoreEngine.ts            # TruScore calculation engine
│   │   └── scoringEngine.ts             # Scoring engine
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── locales/
│   │   │   ├── en.json                 # English translations
│   │   │   ├── es.json                 # Spanish translations
│   │   │   └── fr.json                 # French translations
│   │
│   └── theme/                     # Theming
│       ├── colors.ts                   # Color definitions
│       └── index.ts                    # Theme provider
│
├── app.config.js                 # Expo app configuration
├── package.json                  # Dependencies and scripts
├── eas.json                      # EAS build configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## 🔑 Key Files for GROK

### Main Product Information Page
- **File:** `app/result/[barcode].tsx`
- **Purpose:** Displays product information after barcode scan
- **Key Features:**
  - Trust Score display
  - Confidence badge (data quality indicator)
  - Packaging information modal
  - Manual product entry for unknown products
  - All product cards (Nutrition, Allergens, Palm Oil, etc.)

### Product Data Fetching
- **File:** `src/services/productService.ts`
- **Purpose:** Main service that orchestrates all API calls
- **Key Features:**
  - Comprehensive fallback strategy across 20+ databases
  - Parallel API calls for performance
  - Caching system
  - Confidence scoring

### Trust Score Calculation
- **File:** `src/utils/trustScore.ts` and `src/lib/truscoreEngine.ts`
- **Purpose:** Calculates TruScore (0-100) based on 4 pillars
- **Key Features:**
  - Body pillar (nutrition, additives, allergens)
  - Planet pillar (eco-score, packaging, palm oil)
  - Care pillar (certifications, ethics)
  - Open pillar (transparency, ingredient disclosure)

### Confidence Score System
- **File:** `src/utils/confidenceScoring.ts`
- **Purpose:** Assigns confidence scores (0-1) based on data source
- **Key Features:**
  - Source reliability mapping
  - High/Medium/Low confidence levels
  - Used in ConfidenceBadge component

### Packaging & Recycling
- **File:** `src/utils/packagingRecyclability.ts`
- **Purpose:** Determines recyclability based on local laws
- **File:** `src/components/PackagingInfoModal.tsx`
- **Purpose:** Displays detailed packaging and recycling information

### Manual Product Entry
- **File:** `src/components/ManualProductEntryModal.tsx`
- **Purpose:** Allows users to manually add product information
- **File:** `src/services/manualProductService.ts`
- **Purpose:** Saves manually entered products to local cache

## 📊 Database Integration

### Primary Databases (High Confidence)
- Open Food Facts (`src/services/openFoodFacts.ts`)
- FSANZ Database (`src/services/fsanDatabase.ts`)
- USDA FoodData Central (`src/services/usdaFoodData.ts`)
- GS1 Data Source (`src/services/gs1DataSource.ts`)

### Secondary Databases (Medium Confidence)
- Open Beauty Facts (`src/services/openBeautyFacts.ts`)
- Open Pet Food Facts (`src/services/openPetFoodFacts.ts`)
- Open Products Facts (`src/services/openProductsFacts.ts`)
- Store APIs (NZ/AU) (`src/services/nzStoreApi.ts`, `src/services/auRetailerScraping.ts`)

### Fallback Databases (Low Confidence)
- UPCitemdb (`src/services/upcitemdb.ts`)
- Barcode Spider (`src/services/barcodeSpider.ts`)
- Barcode Monster (`src/services/barcodeMonsterApi.ts`)
- Go-UPC (`src/services/goUpcApi.ts`)
- Buycott (`src/services/buycottApi.ts`)
- Open GTIN (`src/services/openGtindbApi.ts`)
- Web Search (`src/services/webSearchFallback.ts`)

## 🎯 Key Features Implementation

### Barcode Scanning
- **File:** `app/index.tsx`
- Uses Expo Camera for barcode scanning
- Normalizes barcode formats via `src/utils/barcodeNormalization.ts`

### Product Search
- **File:** `app/search.tsx`
- **Service:** `src/services/productSearchService.ts`
- Searches across multiple databases

### Pricing Information
- **File:** `src/components/PricingCard.tsx`
- **Service:** `src/services/pricingService.ts`
- Integrates with store APIs and web scraping

### Subscription Management
- **File:** `app/subscription.tsx`
- **Service:** `src/services/subscriptionService.ts`
- Uses Qonversion SDK for subscriptions

### Offline Support
- **Service:** `src/services/cacheService.ts`
- Caches last 100 scanned products
- Premium users get extended cache

## 🔧 Configuration Files

### App Configuration
- `app.config.js` - Expo app configuration (name, bundle ID, permissions, etc.)
- `eas.json` - EAS build configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Build Configuration
- `android/` - Android native code (generated by prebuild)
- `ios/` - iOS native code (generated by prebuild, not in repo)

## 📝 Important Documentation Files

- `README.md` - Project overview
- `DATABASES_CHECKED_ON_SCAN.md` - Complete list of databases
- `COMPLETE_EAS_BUILD_WORKFLOW.md` - EAS build workflow
- `PREVIOUS_ENHANCEMENTS_ANALYSIS.md` - Previous work summary

## 🚀 Quick Reference for GROK

### To understand product data flow:
1. Start with `app/result/[barcode].tsx` (UI)
2. Check `src/services/productService.ts` (data fetching)
3. Review `src/types/product.ts` (data structure)

### To understand Trust Score:
1. Check `src/utils/trustScore.ts` (calculation)
2. Review `src/lib/truscoreEngine.ts` (engine)
3. See `src/components/TrustScoreInfoModal.tsx` (UI/explanation)

### To understand confidence scoring:
1. Check `src/utils/confidenceScoring.ts` (calculation)
2. Review `src/components/ConfidenceBadge.tsx` (display)
3. See source mappings in `confidenceScoring.ts`

### To modify product information page:
1. Edit `app/result/[barcode].tsx`
2. Check related components in `src/components/`
3. Update translations in `src/i18n/locales/en.json`

### To add new database:
1. Create service in `src/services/`
2. Add to `productService.ts` fallback chain
3. Update confidence scoring if needed

## 📦 All Source Files Tracked in Git

All source code files are committed and pushed to GitHub. GROK can access:
- ✅ All TypeScript/JavaScript source files
- ✅ All React components
- ✅ All service files
- ✅ All utility functions
- ✅ All type definitions
- ✅ All configuration files
- ✅ All documentation files

**Repository:** https://github.com/TrueScanOnline/TruScore

## 🔍 File Count Summary

- **Source files (src/):** ~100+ TypeScript/React files
- **App screens (app/):** 10+ screen files
- **Components:** 20+ reusable components
- **Services:** 20+ API integration services
- **Utilities:** 15+ utility modules
- **Total tracked files:** All source code is in Git

---

**This codebase is fully accessible to GROK for code analysis and assistance!**

