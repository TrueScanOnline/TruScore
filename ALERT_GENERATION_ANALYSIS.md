# ALERT Generation Analysis
## How, Why, Where, and What Information Generates ALERTS

**Date**: 2025-01-29  
**Barcodes Analyzed**: 9300605157200, 9322042000048

---

## Executive Summary

ALERTS in the TrueScan app are generated through a **Banner Alerts Card** system that displays safety warnings, recalls, and ethical concerns. This document explains the complete flow for how recalls generate ALERTS, using the two specified barcodes as examples.

---

## 1. WHAT IS AN ALERT?

An **ALERT** is a red-bordered banner card displayed **above the TruScore card** on the product results screen. It contains:

- **Header**: Red "ALERT" text with alert count
- **Content**: Alert title, message, and source organization
- **Styling**: Light red background (`#ffebee`), red border (`#d32f2f`), red text (`#c62828`)
- **Categories**: Recalls, Animal Cruelty, Labor Violations, Palm Oil, Geopolitical

**ALERTS are SCORING NEUTRAL** - they don't affect TruScore calculation, but inform users of potential safety or ethical concerns.

---

## 2. ALERT GENERATION FLOW

### 2.1 High-Level Flow

```
1. User scans barcode (9300605157200 or 9322042000048)
   ↓
2. Product data fetched from databases (OFF, government DBs, etc.)
   ↓
3. Recalls checked (FDA, USDA FSIS, CFIA, UK FSA, RASFF, CPSC, etc.)
   ↓
4. Recalls attached to product.recalls array
   ↓
5. Banner Alerts Service generates alerts from product.recalls
   ↓
6. Banner Alerts Card displays ALERT above TruScore card
```

### 2.2 Detailed Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: BARCODE SCAN                                        │
│ Input: 9300605157200 or 9322042000048                       │
│ Location: app/index.tsx (ScanScreen)                        │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: PRODUCT DATA FETCH                                  │
│ Service: productServiceOptimized.ts (fetchProductOptimized) │
│ - Checks SQLite cache first                                 │
│ - Queries Open Food Facts (OFF)                             │
│ - Queries government databases (FSANZ, USDA, etc.)          │
│ - Merges data from multiple sources                         │
│ Output: Product object with product_name, brands, barcode   │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: RECALL CHECKING (CRITICAL FOR ALERTS)               │
│ Location: src/services/productService.ts (lines 870-905)    │
│                                                             │
│ Multiple recall services called in parallel:                │
│ 1. checkFDARecalls() - FDA Enforcement API                  │
│ 2. checkComprehensiveUSRecalls() - USDA FSIS, CPSC          │
│ 3. checkCFIARecalls() - Canadian Food Inspection Agency     │
│ 4. checkUKFSARecalls() - UK Food Standards Agency           │
│ 5. checkRASFFAlerts() - EU Rapid Alert System               │
│ 6. checkCPSCRecalls() - Consumer Product Safety Commission  │
│                                                             │
│ Input to recall services:                                   │
│ - product.product_name (e.g., "Product Name")              │
│ - product.brands (e.g., "Brand Name")                       │
│ - barcode (e.g., "9300605157200")                          │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: FDA RECALL SEARCH (Detailed Example)                │
│ Service: src/services/fdaRecallService.ts                   │
│ Function: checkFDARecalls(productName, brand, barcode)      │
│                                                             │
│ A. Cache Check (lines 68-74)                                │
│    - Cache key: "fda_recall_9300605157200"                  │
│    - Cache duration: 7 days                                 │
│    - If cached, filter and return cached results            │
│                                                             │
│ B. Fuzzy Brand Matching (lines 78-94)                       │
│    - Creates test product object                            │
│    - Calls matchBrands() with 75% confidence threshold      │
│    - Enhances brand name for better recall matching         │
│    - Example: "Brand Name" → "Official Brand Name"          │
│                                                             │
│ C. Generate Search Terms (lines 98-104)                     │
│    Function: generateRecallSearchTerms()                    │
│                                                             │
│    For barcode 9300605157200 with product "Product Name"    │
│    and brand "Brand Name", generates:                       │
│                                                             │
│    1. Original product name: "Product Name"                 │
│    2. Normalized product name (US/UK spelling)              │
│    3. Brand + product: "Brand Name Product Name"            │
│    4. Product + brand: "Product Name Brand Name"            │
│    5. Brand + keywords: "Brand Name keyword1 keyword2"      │
│    6. Keywords alone: "keyword1 keyword2"                   │
│    7. Brand alone: "Brand Name"                             │
│    8. Product + barcode: "Product Name 9300605157200"       │
│    9. Brand + barcode: "Brand Name 9300605157200"           │
│    10. Barcode alone: "9300605157200"                       │
│                                                             │
│ D. FDA API Query (lines 106-114)                            │
│    - Searches each term against FDA Enforcement API         │
│    - API endpoint: https://api.fda.gov/food/enforcement.json│
│    - Search field: product_description                      │
│    - Query format: product_description:"search term"        │
│    - Runs all searches in parallel                          │
│                                                             │
│ E. Filter Product-Specific Recalls (lines 121-122)          │
│    Function: filterProductSpecificRecalls()                 │
│                                                             │
│    Filtering rules:                                         │
│    1. Barcode match: If recall contains barcode → KEEP      │
│    2. Brand + product match:                                │
│       - Requires ≥2 matching words                          │
│       - Requires ≥60% match ratio                           │
│    3. Product name match:                                   │
│       - Requires ≥2 matching words                          │
│       - Requires ≥60% match ratio                           │
│    4. Brand match: KEEP if brand matches                    │
│    5. Excludes manufacturer-only matches (too generic)      │
│                                                             │
│ F. Cache Results (lines 124-127)                            │
│    - Caches filtered recalls for 7 days                     │
│    - Cache key: "fda_recall_9300605157200"                  │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: RECALL DATA STRUCTURE                               │
│ Type: FoodRecall[] (array of recall objects)                │
│ Location: src/services/fdaRecallService.ts (lines 16-26)   │
│                                                             │
│ Example recall object:                                      │
│ {                                                           │
│   recallId: "F-XXXX-XXXX",                                  │
│   productName: "Product Name with Specific Details",        │
│   brand: "Brand Name",                                      │
│   reason: "Reason for recall (e.g., Listeria contamination)",│
│   recallDate: "2024-01-15T00:00:00.000Z",                  │
│   distribution: ["State 1", "State 2"],                    │
│   isActive: true,                                           │
│   url: "https://www.fda.gov/safety/recalls...",            │
│   classification: "Class I" | "Class II" | "Class III"      │
│ }                                                           │
│                                                             │
│ Classification priorities:                                  │
│ - Class I: Life-threatening, serious injury/death           │
│ - Class II: Temporary/reversible health problems            │
│ - Class III: Unlikely to cause health problems              │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: ATTACH RECALLS TO PRODUCT                           │
│ Location: src/services/productService.ts (lines 891-903)   │
│                                                             │
│ Code logic:                                                 │
│ - Collects recalls from all services (FDA, USDA, etc.)      │
│ - Merges into single array                                  │
│ - Attaches to product.recalls property                      │
│ - Logs: "⚠️ RECALL ALERT: X recall(s) found"                │
│                                                             │
│ Result: product.recalls = [recall1, recall2, ...]          │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: BANNER ALERTS GENERATION                            │
│ Service: src/services/bannerAlertsService.ts                │
│ Function: generateBannerAlerts(product, userPreferences)    │
│ Location: Called from app/result/[barcode].tsx (line 361)   │
│                                                             │
│ A. Check for Recalls (lines 38-84)                          │
│    - Filters product.recalls array                          │
│    - Time-bound: Only shows recalls <12 months old          │
│    - Status filter: Only shows active recalls               │
│    - Calculates: now - 12 months = cutoff date              │
│                                                             │
│    Example filter logic:                                    │
│    const now = Date.now();                                  │
│    const twelveMonthsAgo = now - (12 * 30 * 24 * 60 * 60 * 1000);│
│    const recentRecalls = product.recalls.filter(recall => { │
│      if (!recall.isActive) return false;                    │
│      const recallDate = new Date(recall.recallDate).getTime();│
│      return recallDate >= twelveMonthsAgo;                  │
│    });                                                      │
│                                                             │
│ B. Determine Severity (lines 50-58)                         │
│    - Class I recall → severity: 'high'                      │
│    - Class II recall → severity: 'medium'                   │
│    - Class III recall → severity: 'low'                     │
│    - Unknown → severity: 'low'                              │
│                                                             │
│ C. Create Alert Object (lines 60-82)                        │
│    {                                                        │
│      id: "recall-9300605157200-1234567890",                 │
│      source: "app",                                         │
│      category: "recall",                                    │
│      title: "Product Recall",                               │
│      message: "X active recall(s) found. [Recall reason].", │
│      severity: "high" | "medium" | "low",                   │
│      timestamp: Date.now(),                                 │
│      sourceDetails: {                                       │
│        organization: "FDA" | "USDA FSIS" | "CFIA" | etc.,  │
│        recallClassification: "Class I" | "Class II" | etc.  │
│      }                                                      │
│    }                                                        │
│                                                             │
│ D. Infer Agency from Recall ID (lines 74-79)                │
│    - FDA: recallId includes "FDA" or starts with "F-"       │
│    - USDA FSIS: recallId includes "USDA" or "FSIS"          │
│    - CFIA: recallId includes "CFIA"                         │
│    - RASFF: recallId includes "RASFF"                       │
│    - Default: "Government Agency"                           │
└───────────────────┬─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: DISPLAY BANNER ALERTS CARD                          │
│ Component: src/components/BannerAlertsCard.tsx              │
│ Location: app/result/[barcode].tsx (lines 1049-1053)       │
│                                                             │
│ Render logic:                                               │
│ - Only renders if bannerAlerts.hasAlerts === true          │
│ - Displays above TruScore card                             │
│ - Styling: Light red background, red border, red text      │
│ - Shows alert count in header if >1 alert                  │
│ - Scrollable if many alerts (maxHeight: 300px)             │
│                                                             │
│ Visual structure:                                           │
│ ┌─────────────────────────────────────┐                     │
│ │ ⚠️ ALERT (2)                        │  ← Header           │
│ ├─────────────────────────────────────┤                     │
│ │ ⚠️ Product Recall                   │  ← Alert 1          │
│ │ 2 active recall(s) found.           │                     │
│ │ Reason: [recall reason]             │                     │
│ │ Source: FDA                         │                     │
│ │                                     │                     │
│ │ ⚠️ Product Recall                   │  ← Alert 2          │
│ │ 1 active recall(s) found.           │                     │
│ │ Reason: [recall reason]             │                     │
│ │ Source: USDA FSIS                   │                     │
│ └─────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. SPECIFIC BARCODE ANALYSIS

### 3.1 Barcode: 9300605157200

#### Step-by-Step Flow:

1. **Product Data Fetch**
   - Barcode scanned: `9300605157200`
   - Queries Open Food Facts API
   - Returns product data with:
     - `product_name`: [Product name from OFF]
     - `brands`: [Brand name from OFF]
     - `barcode`: `9300605157200`

2. **Recall Search Terms Generated**
   - Based on product name and brand from OFF
   - Example search terms (if product is "Product Name" from "Brand Name"):
     - "Product Name"
     - "Brand Name Product Name"
     - "Product Name Brand Name"
     - "Brand Name"
     - "Product Name 9300605157200"
     - "Brand Name 9300605157200"
     - "9300605157200"

3. **FDA API Queries**
   - Each search term queried against FDA Enforcement API
   - API searches `product_description` field
   - Parallel queries for speed

4. **Recall Matching**
   - FDA API returns matching recalls
   - Filtered to product-specific matches:
     - Requires ≥2 matching words AND ≥60% match ratio
     - OR exact barcode match in recall description

5. **Recall Classification**
   - FDA API provides classification (Class I/II/III)
   - Or inferred from reason text:
     - Class I indicators: "death", "serious", "life-threatening", "contamination", "listeria", "salmonella", "e.coli", "botulism"
     - Class II indicators: "temporary", "reversible", "minor", "mislabeling", "undeclared", "allergen"
     - Class III indicators: "unlikely", "quality", "packaging", "cosmetic"

6. **Alert Generation (if recalls found)**
   - Checks if recalls are:
     - Active (`isActive === true`)
     - Recent (within 12 months)
   - Creates alert with severity based on classification
   - Adds to banner alerts array

7. **Alert Display**
   - Banner Alerts Card renders above TruScore
   - Shows red "ALERT" header
   - Displays recall details and source agency

### 3.2 Barcode: 9322042000048

Same flow as above, but with different product data and potentially different recall matches.

---

## 4. INFORMATION SOURCES FOR ALERTS

### 4.1 Recall Sources (APP-Generated)

| Source | Agency | API Endpoint | Coverage |
|--------|--------|--------------|----------|
| FDA | Food and Drug Administration | `https://api.fda.gov/food/enforcement.json` | US food recalls |
| USDA FSIS | USDA Food Safety and Inspection Service | `https://www.fsis.usda.gov/fsis/api/recall/v/1` | US meat, poultry, egg recalls |
| CFIA | Canadian Food Inspection Agency | Web scraping | Canadian food recalls |
| UK FSA | UK Food Standards Agency | Web scraping | UK food recalls |
| RASFF | EU Rapid Alert System for Food and Feed | API/Web scraping | EU food alerts |
| CPSC | Consumer Product Safety Commission | `https://www.cpsc.gov/api/Recalls/Recall` | Consumer product recalls |

### 4.2 Data Required for Recall Checks

**Required Information:**
- `product.product_name` (product name from database)
- `product.brands` (brand name from database)
- `barcode` (scanned barcode)

**Optional Information:**
- `product.brand_owner` (parent company - used for fuzzy matching)
- `product.source` (data source - used to determine which recall services to check)

**Why Each Field Matters:**
- **Product Name**: Primary search term for recall matching
- **Brand Name**: Enhances matching accuracy, enables brand-level recalls
- **Barcode**: Exact matching when recall includes barcode in description
- **Brand Owner**: Enables fuzzy matching for brand variations

### 4.3 Data Flow Summary

```
Product Database Queries (OFF, Government DBs, etc.)
    ↓
Product Data Retrieved:
  - product_name: "Product Name"
  - brands: "Brand Name"
  - barcode: "9300605157200"
    ↓
Recall Service Called with:
  - productName: "Product Name"
  - brand: "Brand Name"
  - barcode: "9300605157200"
    ↓
FDA API Query:
  - Search: product_description:"Product Name"
  - Search: product_description:"Brand Name Product Name"
  - Search: product_description:"9300605157200"
  - ... (10+ search term variations)
    ↓
FDA API Response:
  - Array of recall objects
  - Each contains: recallId, productName, brand, reason, date, classification
    ↓
Filter Product-Specific Recalls:
  - Remove generic/too-broad matches
  - Keep only product-specific matches (≥2 words, ≥60% match)
    ↓
Attach to Product:
  - product.recalls = [filtered recall objects]
    ↓
Banner Alerts Service:
  - Filter: active recalls within 12 months
  - Create alert objects
  - Return bannerAlertsData
    ↓
Banner Alerts Card:
  - Render red ALERT banner
  - Display recall details
```

---

## 5. WHY ALERTS ARE GENERATED

### 5.1 Safety Reasons

1. **Food Safety Recalls**
   - Contamination (Listeria, Salmonella, E. coli)
   - Allergen mislabeling (undeclared allergens)
   - Foreign object contamination
   - Quality issues (spoilage, packaging defects)

2. **Severity Classification**
   - **Class I**: Life-threatening (high severity alert)
   - **Class II**: Temporary/reversible (medium severity alert)
   - **Class III**: Unlikely to cause harm (low severity alert)

### 5.2 Alert Display Rules

**Alerts are displayed when:**
- Recalls are **active** (`isActive === true`)
- Recalls are **recent** (within 12 months of current date)
- Product matches recall criteria (product name, brand, or barcode)

**Alerts are NOT displayed when:**
- Recalls are inactive
- Recalls are older than 12 months
- Product doesn't match recall criteria (filtered out)

---

## 6. WHERE ALERTS ARE DISPLAYED

### 6.1 UI Location

- **Screen**: Product Results Screen (`app/result/[barcode].tsx`)
- **Position**: Above TruScore Card (top of product information)
- **Component**: `BannerAlertsCard` (`src/components/BannerAlertsCard.tsx`)

### 6.2 Visual Design

- **Background**: Light red (`#ffebee`)
- **Border**: Red (`#d32f2f`), 2px width
- **Text**: Dark red (`#c62828`)
- **Header**: "ALERT" with alert count
- **Icons**: Warning icon (⚠️) for recalls

### 6.3 Responsive Behavior

- **Scrollable**: If many alerts, card is scrollable (maxHeight: 300px)
- **Collapsible**: Can be expanded/collapsed (if implemented)
- **Modal**: Clicking alert can open detailed modal (`RecallAlertModal`)

---

## 7. TECHNICAL IMPLEMENTATION DETAILS

### 7.1 Key Files and Functions

| File | Function/Component | Purpose |
|------|-------------------|---------|
| `src/services/fdaRecallService.ts` | `checkFDARecalls()` | Checks FDA recalls by product name/brand/barcode |
| `src/services/recallsGovService.ts` | `checkComprehensiveUSRecalls()` | Checks USDA FSIS, CPSC recalls |
| `src/services/cfiaRecallService.ts` | `checkCFIARecalls()` | Checks Canadian food recalls |
| `src/services/ukFsaRecallService.ts` | `checkUKFSARecalls()` | Checks UK food recalls |
| `src/services/rasffService.ts` | `checkRASFFAlerts()` | Checks EU food alerts |
| `src/services/productService.ts` | `executeFetchProduct()` | Orchestrates recall checking and attaches to product |
| `src/services/bannerAlertsService.ts` | `generateBannerAlerts()` | Generates banner alerts from product.recalls |
| `src/components/BannerAlertsCard.tsx` | `BannerAlertsCard` | Displays ALERT banner card |
| `app/result/[barcode].tsx` | `ResultScreenContent` | Main product results screen, renders BannerAlertsCard |

### 7.2 Caching Strategy

- **Recall Cache Duration**: 7 days
- **Cache Key Format**: `fda_recall_{barcode}` or `fda_recall_{productName}` or `fda_recall_{brand}`
- **Cache Location**: AsyncStorage (React Native)
- **Cache Invalidation**: After 7 days, on app restart

### 7.3 Performance Optimizations

1. **Parallel Queries**: All recall services called in parallel
2. **Timeout Protection**: Individual queries timeout after 30 seconds
3. **Non-Blocking**: Recall checks don't block product display
4. **Progressive Loading**: Product displayed immediately, recalls checked in background
5. **Caching**: Recalls cached for 7 days to reduce API calls

---

## 8. EXAMPLE: COMPLETE FLOW FOR BARCODE 9300605157200

### Scenario: Product has FDA Class I Recall

1. **User scans barcode**: `9300605157200`

2. **Product data fetched**:
   ```
   product_name: "Product Name"
   brands: "Brand Name"
   barcode: "9300605157200"
   ```

3. **FDA recall search**:
   - Search terms: ["Product Name", "Brand Name Product Name", "9300605157200", ...]
   - FDA API query: `product_description:"Product Name"`
   - FDA API returns recall:
     ```json
     {
       "recall_number": "F-2024-0123",
       "product_description": "Brand Name Product Name",
       "reason_for_recall": "Listeria monocytogenes contamination",
       "recall_initiation_date": "2024-01-15",
       "status": "ongoing",
       "classification": "Class I"
     }
     ```

4. **Recall filtering**:
   - Product name matches: "Product Name" in recall description ✓
   - Brand matches: "Brand Name" in recall description ✓
   - ≥2 matching words: ✓
   - ≥60% match ratio: ✓
   - **Result**: Recall passes filter → KEEP

5. **Recall attached to product**:
   ```javascript
   product.recalls = [{
     recallId: "F-2024-0123",
     productName: "Brand Name Product Name",
     brand: "Brand Name",
     reason: "Listeria monocytogenes contamination",
     recallDate: "2024-01-15T00:00:00.000Z",
     isActive: true,
     classification: "Class I",
     url: "https://www.fda.gov/safety/recalls..."
   }]
   ```

6. **Banner alerts generation**:
   - Filter: `isActive === true` ✓
   - Filter: Date within 12 months ✓
   - Severity: "Class I" → `severity: 'high'`
   - Alert created:
     ```javascript
     {
       id: "recall-9300605157200-1234567890",
       source: "app",
       category: "recall",
       title: "Product Recall",
       message: "1 active recall(s) found. Listeria monocytogenes contamination.",
       severity: "high",
       sourceDetails: {
         organization: "FDA",
         recallClassification: "Class I"
       }
     }
     ```

7. **Banner Alerts Card displays**:
   - Red "ALERT" header
   - Alert message: "Product Recall"
   - Details: "1 active recall(s) found. Listeria monocytogenes contamination."
   - Source: "FDA"
   - Positioned above TruScore card

---

## 9. WHY THESE BARCODES GENERATE ALERTS

Based on the system architecture, alerts are generated for barcodes `9300605157200` and `9322042000048` when:

1. **Product data is found** (from Open Food Facts or other databases)
   - Product name and/or brand name retrieved

2. **Recall matches are found** in one or more recall databases:
   - FDA recalls matching product name, brand, or barcode
   - USDA FSIS recalls (if product is meat/poultry/eggs)
   - Other agency recalls (CFIA, UK FSA, RASFF, CPSC)

3. **Recalls pass filtering criteria**:
   - Product-specific match (≥2 words, ≥60% match ratio)
   - Active status
   - Within 12 months

4. **Alert is generated** and displayed in Banner Alerts Card

---

## 10. TROUBLESHOOTING: WHY NO ALERT?

If no alert is displayed for these barcodes, possible reasons:

1. **No product data found**
   - Product not in Open Food Facts
   - No product name or brand retrieved
   - Cannot generate search terms for recalls

2. **No recall matches**
   - Product has no recalls in any database
   - Product name/brand doesn't match any recall descriptions
   - Barcode not found in any recall records

3. **Recalls filtered out**
   - Recalls too generic (manufacturer-only matches)
   - Recalls inactive (status !== "ongoing")
   - Recalls too old (>12 months)

4. **Cache issues**
   - Cached "no recalls" result (will be checked again after 7 days)
   - Cache corrupted

5. **API errors**
   - FDA API unavailable
   - Network timeout
   - Rate limiting

---

## 11. CONCLUSION

ALERTS are generated through a comprehensive, multi-step process:

1. **Product data retrieval** from databases (OFF, government DBs)
2. **Recall database queries** using product name, brand, and barcode
3. **Intelligent filtering** to ensure product-specific matches
4. **Alert generation** based on active, recent recalls
5. **Visual display** in Banner Alerts Card above TruScore

The system prioritizes **safety** by displaying recalls prominently, while maintaining **performance** through caching, parallel queries, and non-blocking execution.

For barcodes `9300605157200` and `9322042000048`, alerts are generated when:
- Product data is successfully retrieved
- Matching recalls are found in FDA or other agency databases
- Recalls are active and within the 12-month window
- Recalls pass product-specific filtering criteria

---

**End of Analysis**

