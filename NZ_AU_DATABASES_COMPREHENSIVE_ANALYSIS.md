# New Zealand & Australia Databases - Comprehensive Analysis

**Date:** November 25, 2025  
**Purpose:** Complete analysis of all NZ/AU-specific databases for food, supermarket, cosmetic, and animal products

---

## Executive Summary

This document provides a **complete analysis** of all available databases specific to New Zealand and Australia for:
- Food products
- Supermarket products
- Cosmetic products
- Animal products
- Commercial/retailer databases

**Status:** ✅ Already implemented several key databases  
**New Opportunities:** Identified 8+ additional databases (free and paid)

---

## Part 1: Already Implemented Databases

### ✅ New Zealand Store APIs (IMPLEMENTED)

#### 1. Woolworths NZ (formerly Countdown) API
- **Status:** ✅ Implemented
- **Service File:** `src/services/nzStoreApi.ts`
- **Coverage:** All Woolworths NZ products
- **Data Provided:** Product name, brand, images, nutrition, ingredients
- **API Endpoint:** `https://www.woolworths.co.nz/api/v1/products?searchTerm={barcode}`
- **Access:** Direct API (no key required, but may have rate limits)
- **Notes:** Countdown rebranded to Woolworths in 2023

#### 2. Foodstuffs (Pak'nSave & New World) API
- **Status:** ✅ Implemented
- **Service File:** `src/services/nzStoreApi.ts`
- **Coverage:** All Pak'nSave and New World products
- **Data Provided:** Product name, brand, images, nutrition, ingredients
- **API Endpoint:** 
  - Pak'nSave: `https://www.paknsave.co.nz/CommonApi/ProductSearch/Search`
  - New World: `https://www.newworld.co.nz/CommonApi/ProductSearch/Search`
- **Access:** Direct API (POST requests, no key required)
- **Notes:** Foodstuffs owns both chains

#### 3. Additional NZ Stores (Pricing Only)
- **Status:** ✅ Implemented (pricing data only)
- **Service File:** `src/services/pricingApis/countryStores.ts`
- **Stores:** Fresh Choice
- **Coverage:** Pricing information only
- **Access:** Web scraping for pricing

---

### ✅ Australian Retailer APIs (IMPLEMENTED)

#### 1. Woolworths Australia API
- **Status:** ✅ Implemented
- **Service File:** `src/services/auRetailerScraping.ts`
- **Coverage:** All Woolworths AU products
- **Data Provided:** Product name, brand, images, nutrition, ingredients
- **API Endpoint:** `https://www.woolworths.com.au/api/v3/ui/products/search?SearchTerm={barcode}`
- **Access:** Direct API (no key required, but may have rate limits)

#### 2. Coles Australia API
- **Status:** ✅ Implemented
- **Service File:** `src/services/auRetailerScraping.ts`
- **Coverage:** All Coles products
- **Data Provided:** Product name, brand, images, nutrition, ingredients
- **API Endpoint:** `https://www.coles.com.au/api/product/search?searchTerm={barcode}`
- **Access:** Direct API (no key required, but may have rate limits)

#### 3. IGA Australia API
- **Status:** ✅ Implemented
- **Service File:** `src/services/auRetailerScraping.ts`
- **Coverage:** All IGA products
- **Data Provided:** Product name, brand, images, nutrition, ingredients
- **API Endpoint:** `https://www.iga.com.au/api/products/search?term={barcode}`
- **Access:** Direct API (no key required, but may have rate limits)

---

### ✅ FSANZ Database (IMPLEMENTED)

#### Food Standards Australia New Zealand Database
- **Status:** ✅ Implemented
- **Service File:** `src/services/fsanDatabase.ts`
- **Coverage:** Official government food database for AU/NZ
- **Data Provided:** Comprehensive nutrition data, ingredients, allergens
- **Access:** Local database (must be imported first)
- **Import Service:** `src/services/fsanDatabaseImport.ts`
- **Notes:** 
  - Requires manual import/download
  - Covers both AU and NZ products
  - Official government data source

---

## Part 2: FREE Databases Available (Not Yet Implemented)

### 1. New Zealand Food Composition Database (NZFCD) ⭐⭐⭐⭐⭐
**Rank: #1 - HIGHLY RECOMMENDED**

#### Overview
- **Managed by:** Plant & Food Research and Ministry of Health
- **Coverage:** 2,850+ foods commonly consumed in New Zealand
- **Data Type:** Nutrient composition data
- **Access:** Free download/API

#### Data Provided
- Comprehensive nutrient profiles
- Macronutrients (energy, protein, fat, carbs)
- Micronutrients (vitamins, minerals)
- Traditional and modern NZ foods
- Per 100g values

#### Access Method
- **Website:** https://www.foodcomposition.co.nz/
- **Download:** FOODfiles™ dataset (CSV/Excel)
- **API:** May be available (check website)
- **Format:** Structured data files

#### Implementation
- **Complexity:** Medium (requires data parsing)
- **Integration:** Download dataset, parse, store locally (SQLite)
- **Update Frequency:** Periodic updates
- **Cost:** FREE

#### Recommendation
**STRONGLY RECOMMENDED** - Essential for accurate NZ nutrition data. Can be integrated as a local SQLite database for offline access.

---

### 2. Australian Food Composition Database (AFCD) ⭐⭐⭐⭐⭐
**Rank: #2 - HIGHLY RECOMMENDED**

#### Overview
- **Managed by:** Food Standards Australia New Zealand (FSANZ)
- **Coverage:** 1,616 foods available in Australia
- **Data Type:** Nutrient composition data
- **Access:** Free download/API

#### Data Provided
- Detailed nutrient profiles (up to 256 nutrients per food)
- Comprehensive nutrition data
- Per 100g values
- Branded and generic foods

#### Access Method
- **Website:** https://www.foodstandards.govt.nz/science-data/monitoringnutrients/afcd
- **Download:** Searchable database and downloadable files
- **API:** May be available (check website)
- **Format:** Structured data files

#### Implementation
- **Complexity:** Medium (requires data parsing)
- **Integration:** Download dataset, parse, store locally (SQLite)
- **Update Frequency:** Periodic updates
- **Cost:** FREE

#### Recommendation
**STRONGLY RECOMMENDED** - Essential for accurate AU nutrition data. Can be integrated as a local SQLite database for offline access.

---

### 3. Australian Branded Food Database (FSANZ) ⭐⭐⭐⭐
**Rank: #3 - MONITOR FOR AVAILABILITY**

#### Overview
- **Managed by:** Food Standards Australia New Zealand (FSANZ)
- **Coverage:** Branded food products sold in Australia
- **Data Type:** Brand-specific product information
- **Status:** In development (expected completion: 2024-2025)
- **Access:** Subset will be publicly available

#### Data Provided
- Brand names
- Product names
- Pack sizes
- Nutrition information panels
- Ingredient statements
- Health Star Ratings

#### Access Method
- **Website:** https://www.foodstandards.govt.nz/science-data/monitoringnutrients/Branded-food-database
- **Status:** Data collection ongoing
- **Public Access:** Expected in 2024-2025
- **Format:** TBD (likely API or downloadable dataset)

#### Implementation
- **Complexity:** TBD (depends on access method)
- **Integration:** Monitor for public release
- **Update Frequency:** TBD
- **Cost:** FREE (public subset)

#### Recommendation
**MONITOR** - Will be valuable when publicly available. Check FSANZ website regularly for updates.

---

### 4. Barcodes NZ Product Database ⭐⭐⭐⭐
**Rank: #4 - GOOD FOR NZ PRODUCT COVERAGE**

#### Overview
- **Managed by:** International Barcodes Network
- **Coverage:** Products and barcodes registered in New Zealand
- **Data Type:** Product information database
- **Access:** Publicly accessible

#### Data Provided
- Product names
- Product descriptions
- Prices
- Manufacturer details
- Barcode numbers

#### Access Method
- **Website:** https://nzproducts.nz/
- **API:** May be available (check website)
- **Format:** Web interface or API (if available)

#### Implementation
- **Complexity:** Low-Medium (depends on API availability)
- **Integration:** API calls or web scraping (if no API)
- **Update Frequency:** Regular updates
- **Cost:** FREE

#### Recommendation
**RECOMMENDED** - Good for NZ product coverage. Check website for API availability. If no API, consider web scraping (ensure compliance with ToS).

---

### 5. Data.govt.nz API ⭐⭐⭐
**Rank: #5 - CONSIDER FOR SUPPLEMENTARY DATA**

#### Overview
- **Managed by:** New Zealand Government
- **Coverage:** Various datasets including food and agriculture
- **Data Type:** Open government data
- **Access:** Free API access

#### Data Provided
- Food prices
- Agricultural production data
- Various government datasets

#### Access Method
- **Website:** https://www.data.govt.nz/
- **API:** Available for developers
- **Documentation:** https://www.data.govt.nz/catalogue-guide/using-data-govt-nz-apis
- **Format:** JSON/CSV

#### Implementation
- **Complexity:** Low-Medium
- **Integration:** API calls for relevant datasets
- **Update Frequency:** Varies by dataset
- **Cost:** FREE

#### Recommendation
**CONSIDER** - Useful for supplementary data (prices, agriculture). May not have direct barcode lookup.

---

### 6. DigitalNZ API ⭐⭐⭐
**Rank: #6 - CONSIDER FOR SUPPLEMENTARY DATA**

#### Overview
- **Managed by:** National Library of New Zealand
- **Coverage:** Aggregates metadata from 150+ NZ organizations
- **Data Type:** Digital content metadata
- **Access:** Free API access

#### Data Provided
- Digital content metadata
- May include product information
- Various NZ digital collections

#### Access Method
- **Website:** https://natlib.govt.nz/about-us/open-data/digitalnz-api
- **API:** Available for developers
- **Documentation:** DigitalNZ API documentation
- **Format:** JSON

#### Implementation
- **Complexity:** Low
- **Integration:** API calls
- **Update Frequency:** Regular updates
- **Cost:** FREE

#### Recommendation
**CONSIDER** - May have some product information, but not primary focus. Useful for supplementary data.

---

## Part 3: PAID Databases Available

### 1. GS1 New Zealand's OnPack Database ⭐⭐⭐⭐⭐
**Rank: #1 - BEST FOR NZ PRODUCT COVERAGE**

#### Overview
- **Managed by:** GS1 New Zealand
- **Coverage:** 46,000+ product records (80%+ of on-shelf products in NZ)
- **Data Type:** Comprehensive product label data
- **Access:** Licensing required

#### Data Provided
- Full on-pack label data
- Nutritional information panels
- Ingredients lists
- Allergen alerts and warnings
- Health Star Ratings
- Marketing claims
- Product images
- Barcode information

#### Access Method
- **Website:** https://www.gs1nz.org/
- **Contact:** GS1 New Zealand for licensing
- **Format:** API or data export
- **Support:** GS1 provides integration support

#### Cost
- **Pricing:** Contact GS1 New Zealand for custom pricing
- **Typical Range:** $5,000-$50,000+ per year (estimated)
- **Factors:** Usage volume, data scope, integration support

#### Implementation
- **Complexity:** Low-Medium (GS1 provides support)
- **Integration:** API or data import
- **Update Frequency:** Regular updates
- **Ease:** GS1 provides integration support

#### Recommendation
**STRONGLY RECOMMENDED** - Best coverage for NZ products. Essential for comprehensive NZ product database. Contact GS1 NZ for pricing and licensing.

---

### 2. GS1 Australia's National Product Catalogue (NPC) ⭐⭐⭐⭐⭐
**Rank: #2 - BEST FOR AU PRODUCT COVERAGE**

#### Overview
- **Managed by:** GS1 Australia
- **Coverage:** Comprehensive database used by major AU retailers
- **Data Type:** Standardized product data
- **Access:** Licensing required

#### Data Provided
- Detailed product information
- Nutritional information
- Ingredients lists
- Packaging details
- Barcode information
- Product images
- Health Star Ratings

#### Access Method
- **Website:** https://www.gs1au.org/services/data-and-content/branded-food-database
- **Contact:** GS1 Australia for licensing
- **Format:** API or data export
- **Support:** GS1 provides integration support

#### Cost
- **Pricing:** Contact GS1 Australia for custom pricing
- **Typical Range:** $5,000-$50,000+ per year (estimated)
- **Factors:** Usage volume, data scope, integration support

#### Implementation
- **Complexity:** Low-Medium (GS1 provides support)
- **Integration:** API or data import
- **Update Frequency:** Regular updates
- **Ease:** GS1 provides integration support

#### Recommendation
**STRONGLY RECOMMENDED** - Best coverage for AU products. Essential for comprehensive AU product database. Contact GS1 AU for pricing and licensing.

---

### 3. FoodSwitch Database ⭐⭐⭐⭐
**Rank: #3 - GOOD FOR HEALTH STAR RATINGS**

#### Overview
- **Managed by:** The George Institute for Global Health
- **Coverage:** Packaged foods in Australia and New Zealand
- **Data Type:** Nutritional information and Health Star Ratings
- **Access:** Subscription-based

#### Data Provided
- Nutritional information
- Ingredients lists
- Health Star Ratings
- Product images
- Barcode information

#### Access Method
- **Website:** Contact The George Institute
- **Format:** API access
- **Support:** API documentation provided

#### Cost
- **Pricing:** Contact for pricing details
- **Typical Range:** $1,000-$10,000+ per year (estimated)
- **Factors:** Usage volume, data scope

#### Implementation
- **Complexity:** Low (API-based)
- **Integration:** API calls
- **Update Frequency:** Regular updates
- **Ease:** Straightforward API integration

#### Recommendation
**RECOMMENDED** - Good for Health Star Ratings and packaged food data. Consider if Health Star Ratings are important for your app.

---

### 4. NielsenIQ Retail Measurement Services ⭐⭐⭐
**Rank: #4 - MARKET ANALYSIS FOCUS**

#### Overview
- **Managed by:** NielsenIQ
- **Coverage:** Retail measurement data for AU/NZ
- **Data Type:** Sales data, market share, distribution
- **Access:** Custom pricing

#### Data Provided
- Sales data
- Market share information
- Distribution metrics
- Product performance data

#### Access Method
- **Website:** Contact NielsenIQ
- **Format:** Reports or API
- **Support:** Enterprise support

#### Cost
- **Pricing:** Custom pricing (very expensive)
- **Typical Range:** $50,000-$500,000+ per year (estimated)
- **Factors:** Data scope, usage, market coverage

#### Implementation
- **Complexity:** Medium-High (enterprise integration)
- **Integration:** Reports or API
- **Update Frequency:** Regular updates
- **Ease:** Enterprise-level integration

#### Recommendation
**ENTERPRISE ONLY** - Too expensive for startups. Only consider if you need market analysis data and have enterprise budget.

---

### 5. Data Scraping Services (Various Providers) ⭐⭐
**Rank: #5 - LAST RESORT**

#### Overview
- **Providers:** Actowiz Solutions, FoodDataScrape, ProductDataScrape
- **Coverage:** Various (supermarket websites, retailers)
- **Data Type:** Scraped product data
- **Access:** Custom pricing

#### Data Provided
- Product listings
- Pricing information
- Nutritional data (if available on websites)
- Product images
- Availability

#### Access Method
- **Providers:**
  - Actowiz Solutions: https://www.actowizsolutions.com/
  - FoodDataScrape: https://www.fooddatascrape.com/
  - ProductDataScrape: https://www.productdatascrape.com/
- **Format:** Datasets (CSV, JSON, Parquet) or API
- **Support:** Varies by provider

#### Cost
- **Pricing:** Custom pricing
- **Typical Range:** $500-$5,000+ per dataset or subscription
- **Factors:** Data scope, update frequency, format

#### Implementation
- **Complexity:** Low-Medium (depends on format)
- **Integration:** Dataset import or API
- **Update Frequency:** Varies (one-time or subscription)
- **Ease:** Straightforward if data is well-formatted

#### Recommendation
**CONSIDER AS LAST RESORT** - Only if official databases unavailable. Data quality may vary. Ensure compliance with website terms of service.

---

## Part 4: Implementation Recommendations

### Immediate Actions (Free Databases)

1. **✅ Already Implemented:**
   - NZ Store APIs (Woolworths NZ, Pak'nSave, New World)
   - AU Retailer APIs (Woolworths AU, Coles, IGA)
   - FSANZ Database (local import)

2. **⏳ Implement Next (Free):**
   - **New Zealand Food Composition Database (NZFCD)**
     - Download FOODfiles™ dataset
     - Parse and store in SQLite
     - Integrate into product lookup
   - **Australian Food Composition Database (AFCD)**
     - Download dataset
     - Parse and store in SQLite
     - Integrate into product lookup

3. **⏳ Monitor:**
   - **Australian Branded Food Database (FSANZ)**
     - Check FSANZ website regularly
     - Implement when publicly available

### Future Considerations (Paid Databases)

1. **Priority 1: GS1 Databases**
   - **GS1 New Zealand OnPack** - Essential for NZ coverage
   - **GS1 Australia NPC** - Essential for AU coverage
   - **Action:** Contact GS1 NZ and GS1 AU for pricing

2. **Priority 2: FoodSwitch Database**
   - **Action:** Contact The George Institute for pricing
   - **Consider if:** Health Star Ratings are important

3. **Priority 3: Data Scraping Services**
   - **Action:** Only if official databases unavailable
   - **Consider:** Data quality and compliance

---

## Part 5: Coverage Analysis

### Current Coverage (With Implemented Databases)

#### New Zealand
- **Store APIs:** ✅ Woolworths NZ, Pak'nSave, New World
- **Government Database:** ✅ FSANZ (local import)
- **Coverage Estimate:** ~60-70% of NZ supermarket products

#### Australia
- **Retailer APIs:** ✅ Woolworths AU, Coles, IGA
- **Government Database:** ✅ FSANZ (local import)
- **Coverage Estimate:** ~70-80% of AU supermarket products

### Potential Coverage (With All Free Databases)

#### New Zealand
- **Store APIs:** ✅ Woolworths NZ, Pak'nSave, New World
- **Government Databases:** ✅ FSANZ + NZFCD (if implemented)
- **Coverage Estimate:** ~75-85% of NZ products

#### Australia
- **Retailer APIs:** ✅ Woolworths AU, Coles, IGA
- **Government Databases:** ✅ FSANZ + AFCD (if implemented)
- **Coverage Estimate:** ~80-90% of AU products

### Maximum Coverage (With Paid Databases)

#### New Zealand
- **GS1 OnPack:** 80%+ of on-shelf products
- **Coverage Estimate:** ~90-95% of NZ products

#### Australia
- **GS1 NPC:** Comprehensive coverage
- **Coverage Estimate:** ~90-95% of AU products

---

## Part 6: Implementation Guide

### Free Databases Implementation

#### New Zealand Food Composition Database (NZFCD)

1. **Download Dataset:**
   - Visit: https://www.foodcomposition.co.nz/
   - Download FOODfiles™ dataset (CSV/Excel)

2. **Parse and Store:**
   - Create parser for dataset format
   - Store in SQLite database
   - Map to product lookup by name/brand

3. **Integrate:**
   - Add lookup function in `productService.ts`
   - Use as supplement to barcode-based lookups
   - Match by product name/brand when barcode not found

#### Australian Food Composition Database (AFCD)

1. **Download Dataset:**
   - Visit: https://www.foodstandards.govt.nz/science-data/monitoringnutrients/afcd
   - Download dataset files

2. **Parse and Store:**
   - Create parser for dataset format
   - Store in SQLite database
   - Map to product lookup by name/brand

3. **Integrate:**
   - Add lookup function in `productService.ts`
   - Use as supplement to barcode-based lookups
   - Match by product name/brand when barcode not found

---

## Part 7: Cost-Benefit Analysis

### Free Databases
- **Cost:** $0
- **Coverage Improvement:** +10-15%
- **Implementation Effort:** Medium (data parsing)
- **ROI:** High (free coverage improvement)

### GS1 Databases (Paid)
- **Cost:** $5,000-$50,000+ per year
- **Coverage Improvement:** +15-20%
- **Implementation Effort:** Low-Medium (GS1 support)
- **ROI:** High (if budget allows)

### FoodSwitch Database (Paid)
- **Cost:** $1,000-$10,000+ per year
- **Coverage Improvement:** +5-10% (Health Star Ratings focus)
- **Implementation Effort:** Low (API-based)
- **ROI:** Medium (if Health Star Ratings important)

---

## Part 8: Next Steps

### Immediate (Free)
1. ✅ **Already Implemented:** NZ/AU store APIs, FSANZ
2. ⏳ **Implement Next:** NZFCD and AFCD (download and parse)
3. ⏳ **Monitor:** Australian Branded Food Database (FSANZ)

### Short-term (Paid - If Budget Allows)
1. ⏳ **Contact GS1 NZ:** Request pricing for OnPack database
2. ⏳ **Contact GS1 AU:** Request pricing for NPC database
3. ⏳ **Evaluate:** Cost vs. coverage improvement

### Long-term
1. ⏳ **Evaluate Paid Options:** Based on user growth and needs
2. ⏳ **Monitor New Databases:** Watch for new free/paid options
3. ⏳ **Optimize:** Focus on highest-value databases

---

## Conclusion

**Current Status:** ✅ Good coverage with implemented databases  
**Free Opportunities:** 2-3 additional free databases available  
**Paid Opportunities:** GS1 databases offer best coverage (if budget allows)

**Recommendation:** 
1. Implement NZFCD and AFCD (free, high value)
2. Monitor Australian Branded Food Database (free, coming soon)
3. Contact GS1 NZ and GS1 AU for paid database pricing (if budget allows)

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025  
**Next Review:** When new databases become available

