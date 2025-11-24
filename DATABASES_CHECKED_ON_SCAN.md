# All Databases Checked When User Scans a Product

This document provides a comprehensive list of **ALL databases and data sources** that the TrueScan app checks when a user scans a product barcode.

## Scan Flow Overview

When a user scans a barcode, the app follows this sequence:

1. **Manual Products Database** (Local - checked first)
2. **Cache** (Local - checked second)
3. **Tier 1: Open Facts Databases** (Parallel queries)
4. **Tier 1.5: Country-Specific Databases** (If user is in NZ/AU)
5. **Tier 2: Official Government Databases** (Parallel queries)
6. **Tier 3: Fallback Commercial APIs** (Parallel queries)
7. **Final Fallback: Web Search** (Ensures result is always returned)
8. **Safety Check: FDA Recalls** (Non-blocking, for food products)

---

## Complete Database List

### 1. Manual Products Database
- **Type**: Local Storage (AsyncStorage)
- **Source**: User-contributed products
- **When Checked**: First, before any API calls
- **Coverage**: Only products manually entered by users
- **Details**: 
  - Stored locally on device
  - Users can manually add product information when product is not found
  - Source identifier: `user_contributed`
  - Maximum 100 manual products stored

### 2. Cache Database
- **Type**: Local Storage (AsyncStorage)
- **Source**: Previously fetched products
- **When Checked**: Second, after manual products
- **Coverage**: All previously scanned products
- **Details**:
  - Premium users get larger cache
  - Cached products include all metadata
  - Low-quality cached results may trigger re-fetch

---

## Tier 1: Open Facts Databases (Parallel Queries)

These databases are queried **in parallel** for maximum speed. All barcode variants are tried simultaneously.

### 3. Open Food Facts (OFF)
- **Type**: Public API (Free, no key required)
- **URL**: `https://world.openfoodfacts.org/api/v2/product/`
- **Coverage**: Food & drinks worldwide
- **Source Identifier**: `openfoodfacts`
- **Data Provided**:
  - Product name, brand, categories
  - Full nutrition facts (Nutri-Score)
  - Ingredients list
  - Eco-Score
  - Images
  - Allergens
  - Packaging information
  - Manufacturing countries
  - Certifications (organic, fair trade, etc.)
- **Quality**: High (community-verified)
- **Notes**: Largest food product database globally

### 4. Open Beauty Facts (OBF)
- **Type**: Public API (Free, no key required)
- **URL**: `https://world.openbeautyfacts.org/api/v2/product/`
- **Coverage**: Cosmetics, personal care products, beauty products
- **Source Identifier**: `openbeautyfacts`
- **Data Provided**:
  - Product name, brand
  - Ingredients list
  - Images
  - Categories
- **Quality**: Good (community-verified)
- **Notes**: Specialized for beauty and personal care products

### 5. Open Pet Food Facts (OPFF)
- **Type**: Public API (Free, no key required)
- **URL**: `https://world.openpetfoodfacts.org/api/v2/product/`
- **Coverage**: Pet food products (dog, cat, etc.)
- **Source Identifier**: `openpetfoodfacts`
- **Data Provided**:
  - Product name, brand
  - Nutrition facts
  - Ingredients list
  - Images
  - Pet-specific information
- **Quality**: Good (community-verified)
- **Notes**: Specialized database for pet food

### 6. Open Products Facts (OPF)
- **Type**: Public API (Free, no key required)
- **URL**: `https://world.openproductsfacts.org/api/v2/product/`
- **Coverage**: General products (electronics, household items, tools, hardware, etc.)
- **Source Identifier**: `openproductsfacts`
- **Data Provided**:
  - Product name, brand
  - Categories
  - Images
  - Basic product information
- **Quality**: Moderate (smaller database)
- **Notes**: Covers non-food products

---

## Tier 1.5: Country-Specific Databases

These are checked **only if the user is in the corresponding country** (detected via country detection).

### 7. New Zealand Store APIs
- **Type**: Retailer APIs (Free, no key required)
- **Coverage**: Products from NZ retailers
- **When Checked**: Only if user country is 'NZ'
- **Retailers Included**:
  - **Woolworths NZ / Countdown**
    - Source: `woolworths_nz`
    - API: `https://www.woolworths.co.nz/api/v1/products`
  - **Pak'nSave**
    - Source: `paknsave_nz`
    - Web scraping
  - **New World**
    - Source: `newworld_nz`
    - Web scraping
- **Data Provided**:
  - Product name, brand
  - Nutrition facts
  - Images
  - Ingredients
  - Pricing information
- **Quality**: High (official retailer data)

### 8. Australian Retailer APIs
- **Type**: Retailer APIs (Free, no key required)
- **Coverage**: Products from AU retailers
- **When Checked**: Only if user country is 'AU'
- **Retailers Included**:
  - **Woolworths Australia**
    - Source: `woolworths_au`
    - API: `https://www.woolworths.com.au/api/v3/ui/products/search`
  - **Coles**
    - Source: `coles_au`
    - Web scraping
  - **IGA Australia**
    - Source: `iga_au`
    - Web scraping
- **Data Provided**:
  - Product name, brand
  - Nutrition facts
  - Images
  - Ingredients
  - Pricing information
- **Quality**: High (official retailer data)

### 9. FSANZ Database (Food Standards Australia New Zealand)
- **Type**: Local Database (must be imported first)
- **Coverage**: Official government food product databases for AU and NZ
- **When Checked**: Only if user country is 'AU' or 'NZ' AND database is imported
- **Source Identifiers**: 
  - `fsanz_au` (Australian database)
  - `fsanz_nz` (New Zealand database)
- **Data Provided**:
  - Official product names
  - Complete nutrition data (per 100g)
  - Ingredients lists
  - Brand information
  - Package sizes
  - Serving sizes
- **Quality**: Very High (government-verified data)
- **Notes**: 
  - Database must be downloaded and imported by user
  - Stored locally in AsyncStorage
  - Official government data with high accuracy

---

## Tier 2: Official Government Databases (Parallel Queries)

These official sources are queried **in parallel** if Open Facts databases don't return results.

### 10. USDA FoodData Central
- **Type**: Government API (Free, requires API key)
- **URL**: `https://api.nal.usda.gov/fdc/v1/foods/search`
- **Coverage**: Official US branded foods database
- **Source Identifier**: `usda_fooddata`
- **Data Provided**:
  - Official product names
  - Complete nutrition facts (per 100g and per serving)
  - Brand information
  - Ingredients
  - Food categories
- **Quality**: Very High (official US government data)
- **Notes**: 
  - Requires API key (may be rate-limited)
  - Focuses on US products
  - Most comprehensive nutrition data available

### 11. GS1 Data Source
- **Type**: Official Barcode Registry (Requires API key)
- **URL**: GS1 Data Source API
- **Coverage**: Official barcode verification and product information
- **Source Identifier**: `gs1_datasource`
- **Data Provided**:
  - Official barcode verification
  - Product name
  - Brand information
  - Product images
  - Basic product details
- **Quality**: Very High (official barcode registry)
- **Notes**: 
  - Requires API key
  - Official source for GTIN/barcode verification
  - Covers all product types globally

---

## Tier 3: Fallback Commercial APIs (Parallel Queries)

These commercial APIs are queried **in parallel** as fallback sources if official databases don't return results.

### 12. UPCitemdb
- **Type**: Commercial API (Free, no key required)
- **URL**: `https://api.upcitemdb.com/prod/trial/lookup`
- **Coverage**: Wide range of products (alcohol, household items, electronics, general products)
- **Source Identifier**: `upcitemdb`
- **Data Provided**:
  - Product name, brand
  - Product description
  - Categories
  - Images
  - Weight/size information
- **Quality**: Moderate
- **Notes**: Good coverage for alcohol and household products

### 13. Barcode Spider
- **Type**: Commercial API (Free, requires API key)
- **URL**: Barcode Spider API
- **Coverage**: General products fallback
- **Source Identifier**: `barcode_spider`
- **Data Provided**:
  - Product name, brand
  - Product description
  - Categories
  - Images
  - Availability information
- **Quality**: Moderate
- **Notes**: Fallback for general products

### 14. Go-UPC API
- **Type**: Commercial API (Free tier available)
- **URL**: Go-UPC API
- **Coverage**: General products
- **Source Identifier**: `goupc`
- **Data Provided**:
  - Product name, brand
  - Basic product information
  - Images
- **Quality**: Moderate
- **Notes**: Additional fallback source

### 15. Buycott API
- **Type**: Commercial API (Free, no key required)
- **URL**: Buycott API
- **Coverage**: Products with ethical/company information
- **Source Identifier**: `buycott`
- **Data Provided**:
  - Product name, brand
  - Company ownership information
  - Ethical ratings
  - Basic product information
- **Quality**: Moderate
- **Notes**: Focuses on ethical/company information

### 16. Open GTIN Database
- **Type**: Public API (Free, no key required)
- **URL**: Open GTIN Database API
- **Coverage**: General products
- **Source Identifier**: `open_gtin`
- **Data Provided**:
  - Product name, brand
  - Basic product information
  - Images
- **Quality**: Moderate
- **Notes**: Community-maintained GTIN database

### 17. Barcode Monster API
- **Type**: Commercial API (Free tier available)
- **URL**: Barcode Monster API
- **Coverage**: General products
- **Source Identifier**: `barcode_monster`
- **Data Provided**:
  - Product name, brand
  - Basic product information
  - Images
- **Quality**: Moderate
- **Notes**: Additional fallback source

---

## Final Fallback: Web Search

### 18. Web Search Fallback (DuckDuckGo Instant Answer)
- **Type**: Web Search API (Free, no key required)
- **URL**: DuckDuckGo Instant Answer API
- **Coverage**: ANY product (ensures result is always returned)
- **Source Identifier**: `web_search`
- **Data Provided**:
  - Product name (extracted from web)
  - Basic product information
  - Images (if available)
  - Ingredients (if available, via web scraping)
  - Nutrition facts (if available, via web scraping)
- **Quality**: Variable (low to moderate)
- **Notes**: 
  - **GUARANTEES** that a product result is always returned
  - Used when all other databases fail
  - May perform web scraping on product pages
  - Creates minimal product entry if nothing else is found
  - Quality/completion scores are typically low (5-30%)

---

## Safety & Additional Checks

### 19. FDA Food Recall Database
- **Type**: Government API (Free, no key required)
- **URL**: `https://api.fda.gov/food/enforcement.json`
- **Coverage**: US food recalls and safety alerts
- **When Checked**: Non-blocking, for food and pet food products only
- **Data Provided**:
  - Recall information
  - Recall reasons
  - Recall dates
  - Distribution information
  - Active recall status
- **Quality**: Very High (official FDA data)
- **Notes**: 
  - Checked asynchronously (doesn't delay product display)
  - Only checked for food products (not cosmetics, household items)
  - Uses barcode, product name, and brand for matching
  - Results cached for 7 days
  - Filters to show only product-specific recalls

### 20. Additive Database (E-numbers)
- **Type**: Local Database (Built-in)
- **Coverage**: E-number food additives (E100-E999)
- **When Checked**: When processing ingredients list
- **Data Provided**:
  - Additive name and category
  - Safety rating (safe/caution/avoid)
  - Description
  - Health concerns
  - Alternatives
  - Common uses
- **Quality**: High (based on EU regulations and industry standards)
- **Notes**: 
  - Not a product database, but used to analyze product ingredients
  - Contains comprehensive information on food additives
  - Used to highlight potentially problematic additives in products

---

## Summary Statistics

### Total Databases Checked: **20**

**By Type:**
- **Local Databases**: 3 (Manual Products, Cache, FSANZ, Additive DB)
- **Public APIs (Free)**: 9 (Open Facts family, Web Search, FDA, etc.)
- **Government APIs**: 2 (USDA, GS1)
- **Commercial APIs**: 6 (UPCitemdb, Barcode Spider, etc.)
- **Country-Specific**: 3 (NZ Stores, AU Retailers, FSANZ)

**By Query Strategy:**
- **Parallel Queries**: 13 databases (Tier 1, 2, 3)
- **Sequential Queries**: 5 databases (Manual, Cache, Country-specific, Web Search)
- **Non-blocking**: 1 database (FDA Recalls)

**Expected Coverage**: ~85-90% of all scanned products

**Guarantee**: The app **ALWAYS** returns a product result (even if minimal) thanks to web search fallback.

---

## Query Order Summary

1. **Manual Products** (local, instant)
2. **Cache** (local, instant)
3. **Open Facts** (parallel: OFF, OBF, OPFF, OPF)
4. **Country-Specific** (if NZ/AU: NZ Stores, AU Retailers, FSANZ)
5. **Official Sources** (parallel: USDA, GS1)
6. **Fallback APIs** (parallel: UPCitemdb, Barcode Spider, Go-UPC, Buycott, Open GTIN, Barcode Monster)
7. **Web Search** (final fallback - ensures result)
8. **FDA Recalls** (non-blocking, background check)

---

## Notes

- **Barcode Normalization**: The app tries multiple barcode variants (EAN-8 → EAN-13, etc.) for each database
- **Product Merging**: If multiple databases return results, products are merged to combine the best data
- **Confidence Scoring**: All products receive confidence scores based on data completeness and source quality
- **Trust Score**: Products receive a TruScore (Body, Planet, Care, Open) based on available data
- **Caching**: All successful results are cached locally for offline access
- **Premium Features**: Premium users get larger cache and may have access to additional features

---

## File References

- Main product service: `src/services/productService.ts`
- Individual database services: `src/services/*.ts`
- Cache service: `src/services/cacheService.ts`
- Manual products: `src/services/manualProductService.ts`
- Additive database: `src/services/additiveDatabase.ts`

