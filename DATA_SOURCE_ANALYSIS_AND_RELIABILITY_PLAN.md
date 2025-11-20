# TrueScan Data Source Analysis & Reliability Enhancement Plan

**Date:** November 2025  
**Focus:** Making the app solid, bulletproof, reliable, and rich with data  
**Goal:** Build user trust through reliable, comprehensive data coverage

---

## 📊 Executive Summary

This document analyzes TrueScan's current data sources, identifies gaps, and provides a comprehensive plan to enhance data reliability, coverage, and richness using primarily free/open APIs. The focus is on building a bulletproof data foundation before adding advanced features.

**Current Status:**
- ✅ 4 data sources with fallback chain
- ✅ Smart caching system
- ⚠️ Limited Eco-Score extraction (not fully utilizing OFF data)
- ⚠️ No food recall/safety data
- ⚠️ No additional free nutrition databases
- ⚠️ Web scraping reliability issues (CORS proxies)

**Target State:**
- ✅ 8-10 reliable data sources
- ✅ Comprehensive Eco-Score integration (free, from OFF)
- ✅ Food recall/safety alerts
- ✅ Enhanced nutrition data
- ✅ 90%+ product coverage
- ✅ Bulletproof error handling

---

## 🔍 Current Data Source Analysis

### 1. Open Food Facts (OFF) - Primary Source ✅

**Current Implementation:**
- **File:** `src/services/openFoodFacts.ts`
- **API Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Coverage:** ~65-75% of food products (highest in EU/UK/US)
- **Status:** ✅ Working well

**Data Extracted:**
- ✅ Product name, brand, images
- ✅ Nutrition facts (nutriments)
- ✅ Ingredients list
- ✅ Certifications (labels_tags)
- ✅ Country of origin
- ⚠️ **Eco-Score:** Partially extracted (not using full breakdown)
- ⚠️ **Palm oil analysis:** Not extracted from `ingredients_analysis_tags`
- ⚠️ **Packaging data:** Not extracted from `packagings` array

**Available but NOT Extracted:**
```typescript
// These fields exist in OFF but we're not using them:
- ecoscore_data.agribalyse.co2_total (carbon footprint)
- ecoscore_data.agribalyse.water_footprint
- ecoscore_data.agribalyse.biodiversity_threats
- ingredients_analysis_tags (palm oil, vegan, vegetarian flags)
- packagings[] (packaging materials, recyclability)
- ecoscore_data.transport_impact
- ecoscore_data.packaging_impact
- ecoscore_data.origins_of_ingredients
```

**Issues Identified:**
1. **Eco-Score not fully utilized** - Only extracting grade/score, missing detailed breakdown
2. **Palm oil detection missing** - `ingredients_analysis_tags` not parsed
3. **Packaging sustainability not extracted** - `packagings` array ignored
4. **Carbon footprint not shown** - `co2_total` available but not displayed

**Recommendations:**
- ✅ Extract full `ecoscore_data` object
- ✅ Parse `ingredients_analysis_tags` for palm oil, vegan, vegetarian
- ✅ Extract `packagings` array for packaging sustainability
- ✅ Display carbon footprint (CO2e) when available
- ✅ Show water footprint and biodiversity impact

---

### 2. UPCitemdb - Secondary Source ✅

**Current Implementation:**
- **File:** `src/services/upcitemdb.ts`
- **API Endpoint:** `https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}`
- **Coverage:** Alcohol, household products, electronics, general products
- **Status:** ✅ Working, but limited data

**Data Extracted:**
- ✅ Product name, brand
- ✅ Basic description
- ✅ Images
- ✅ Category
- ⚠️ **No nutrition data**
- ⚠️ **No sustainability data**
- ⚠️ **No certifications**

**Limitations:**
- Trial API (rate limits)
- No nutrition information
- No sustainability metrics
- Basic product info only

**Recommendations:**
- ✅ Keep as fallback for non-food products
- ⚠️ Consider upgrading to paid tier if needed
- ✅ Use primarily for product identification when OFF fails

---

### 3. Barcode Spider - Tertiary Source ⚠️

**Current Implementation:**
- **File:** `src/services/barcodeSpider.ts`
- **API Endpoint:** `https://api.barcodespider.com/v1/lookup?token={token}&upc={barcode}`
- **Status:** ⚠️ API key empty (not configured)

**Issues:**
- ❌ API key not set (free tier may not require key, but needs verification)
- ⚠️ Limited data quality
- ⚠️ No nutrition/sustainability data

**Recommendations:**
- ✅ Verify if free tier works without key
- ✅ Test API and add error handling
- ✅ Use only as last resort before web search

---

### 4. Web Search Fallback - Final Fallback ⚠️

**Current Implementation:**
- **File:** `src/services/webSearchFallback.ts`
- **Status:** ⚠️ Working but unreliable

**Issues:**
- ❌ CORS proxy failures (rate-limited, unreliable)
- ⚠️ Low-quality data for many products
- ⚠️ No structured data extraction
- ⚠️ Timeout issues

**Recommendations:**
- ✅ Keep as final fallback
- ✅ Improve error handling
- ✅ Add more CORS proxy fallbacks
- ✅ Better quality scoring

---

## 🆕 Recommended Additional Data Sources (Free/Open)

### Priority 1: Enhanced Open Food Facts Integration (FREE) ⭐⭐⭐

**Why:** We're already using OFF but not extracting all available data. This is the #1 priority.

**Available Data Not Currently Extracted:**

1. **Full Eco-Score Breakdown:**
```json
{
  "ecoscore_data": {
    "agribalyse": {
      "co2_total": 2.5,  // kg CO2e per kg
      "ef_total": 0.15,  // Environmental footprint
      "land_use": 3.2,   // m² per kg
      "water_usage": 500, // liters per kg
      "biodiversity_threats": 0.05
    },
    "transport_impact": 0.3,
    "packaging_impact": 0.2,
    "origins_of_ingredients": {...}
  }
}
```

2. **Ingredients Analysis Tags:**
```json
{
  "ingredients_analysis_tags": [
    "en:palm-oil",           // Contains palm oil
    "en:palm-oil-free",      // No palm oil
    "en:non-sustainable-palm-oil", // Unsustainable palm oil
    "en:vegan",              // Vegan
    "en:vegetarian",         // Vegetarian
    "en:non-vegan"           // Contains animal products
  ]
}
```

3. **Packaging Data:**
```json
{
  "packagings": [
    {
      "material": "en:plastic",
      "recycling": "en:recyclable",
      "shape": "en:bottle"
    }
  ],
  "packaging_tags": ["en:recyclable", "en:reusable"]
}
```

**Implementation Plan:**
- Extract full `ecoscore_data` object
- Parse `ingredients_analysis_tags` for palm oil, vegan, vegetarian flags
- Extract `packagings` array for packaging sustainability
- Display carbon footprint, water usage, biodiversity impact
- Show packaging recyclability score

**Estimated Coverage Improvement:**
- Current: ~70% products with basic Eco-Score
- After: ~70% products with FULL sustainability breakdown
- Impact: **High** - No cost, immediate improvement

---

### Priority 2: Open Beauty Facts (FREE) ⭐⭐⭐

**Why:** Extends coverage to cosmetics and personal care products.

**API Endpoint:** `https://world.openbeautyfacts.org/api/v2/product/{barcode}.json`

**Available Data:**
- Product information
- Ingredients (cosmetic ingredients)
- Certifications (cruelty-free, organic, etc.)
- Images

**Coverage:** ~50-60% of cosmetics (growing)

**Implementation:**
- Add `openBeautyFacts.ts` service
- Integrate into productService fallback chain
- Use for cosmetics, personal care, beauty products

**Estimated Coverage Improvement:**
- Adds ~10-15% coverage for cosmetics
- Impact: **Medium** - Extends product category coverage

---

### Priority 3: Open Pet Food Facts (FREE) ⭐⭐

**Why:** Better coverage for pet food products.

**API Endpoint:** `https://world.openpetfoodfacts.org/api/v2/product/{barcode}.json`

**Available Data:**
- Pet food specific nutrition
- Ingredients
- Certifications
- Images

**Coverage:** ~40-50% of pet food products

**Implementation:**
- Add `openPetFoodFacts.ts` service
- Integrate into productService fallback chain
- Use for pet food products

**Estimated Coverage Improvement:**
- Adds ~5-10% coverage for pet food
- Impact: **Low-Medium** - Niche category

---

### Priority 4: Open Products Facts (FREE) ⭐⭐

**Why:** Covers non-food products (household, electronics, etc.)

**API Endpoint:** `https://world.openproductsfacts.org/api/v2/product/{barcode}.json`

**Available Data:**
- Product information
- Images
- Basic product details

**Coverage:** ~30-40% of general products

**Implementation:**
- Add `openProductsFacts.ts` service
- Integrate into productService fallback chain
- Use for non-food products

**Estimated Coverage Improvement:**
- Adds ~5-10% coverage for household products
- Impact: **Low-Medium** - Complements UPCitemdb

---

### Priority 5: FDA Food Recall Database (FREE) ⭐⭐⭐

**Why:** Critical for food safety - users need to know about recalls.

**API Endpoint:** `https://api.fda.gov/food/enforcement.json`

**Available Data:**
- Food recall information
- Recall reasons
- Affected products (by brand, product name)
- Recall dates
- Distribution information

**Coverage:** All FDA-regulated food products

**Implementation:**
- Add `fdaRecallService.ts` service
- Check recalls when product is scanned
- Display recall alerts prominently
- Cache recall data (updates weekly)

**Query Example:**
```
https://api.fda.gov/food/enforcement.json?search=product_description:"Product Name"&limit=10
```

**Estimated Coverage Improvement:**
- Adds critical safety information
- Impact: **High** - Builds trust through safety alerts

---

### Priority 6: EU RASFF (Rapid Alert System for Food and Feed) (FREE) ⭐⭐

**Why:** European food safety alerts (complements FDA for EU products).

**Data Source:** EU RASFF Portal (may require scraping or RSS feed)

**Available Data:**
- Food safety alerts
- Product notifications
- Risk assessments
- Affected countries

**Coverage:** EU/EEA food products

**Implementation:**
- Add `rasffService.ts` service
- Parse RSS feed or scrape portal
- Check alerts when product is scanned
- Display safety warnings

**Estimated Coverage Improvement:**
- Adds EU food safety information
- Impact: **Medium** - Important for EU users

---

### Priority 7: USDA FoodData Central (FREE) ⭐⭐⭐

**Why:** Most comprehensive nutrition database (US-focused but extensive).

**API Endpoint:** `https://api.nal.usda.gov/fdc/v1/foods/search`

**Available Data:**
- Comprehensive nutrition facts
- Scientific nutrition data
- Ingredient analysis
- Food composition

**Coverage:** ~300,000+ foods (US-focused)

**Limitations:**
- Requires API key (free registration)
- US-focused (less coverage for international products)
- No barcode lookup (requires product name search)

**Implementation:**
- Register for free API key
- Add `usdaService.ts` service
- Use product name to search (fuzzy matching)
- Merge nutrition data with existing product data
- Use as nutrition data enhancement (not primary source)

**Estimated Coverage Improvement:**
- Enhances nutrition data for ~20-30% of products
- Impact: **Medium-High** - Improves nutrition accuracy

---

### Priority 8: Agribalyse LCA Database (FREE) ⭐⭐

**Why:** Already used by Open Food Facts, but we can access directly for more details.

**Data Source:** Agribalyse (French LCA database)

**Available Data:**
- Life Cycle Assessment (LCA) data
- Carbon footprint
- Water usage
- Land use
- Biodiversity impact

**Coverage:** ~2,500 food products (French/European focus)

**Limitations:**
- Limited product coverage
- European bias
- Already included in OFF Eco-Score (but we can get more detail)

**Implementation:**
- Access through OFF (already available)
- Extract more detailed LCA data from `ecoscore_data.agribalyse`
- Display detailed breakdown

**Estimated Coverage Improvement:**
- Enhances sustainability data for ~30-40% of products
- Impact: **Medium** - Already partially available through OFF

---

## 📋 Sustainability Integration Plan (From PDF)

### Free-Only Stack for MVP Launch (Jan 2026)

**Goal:** Deliver highly credible sustainability sub-score using only free, open APIs.

**Data Sources (All Free):**

| Dimension | Source | Coverage | Key Fields | Weight in Score |
|-----------|--------|----------|------------|-----------------|
| **Overall Environmental Impact** | Open Food Facts Eco-Score | 65-75% of food products | `ecoscore_grade` (A-E), `ecoscore_score` (0-100), full `ecoscore_data` breakdown | 50-60% |
| **Carbon Footprint** | OFF Eco-Score subcomponent | Same as above | `ecoscore_data.agribalyse.co2_total` (kg CO2e per kg) | 15-20% |
| **Palm Oil / Deforestation** | OFF ingredients_analysis | 95%+ where ingredients known | `ingredients_analysis_tags`: `en:palm-oil`, `en:palm-oil-free`, `en:non-sustainable-palm-oil` | Penalty: -10 to +10 |
| **Packaging Sustainability** | OFF packaging tags | 80-90% | `packagings[]` array: material + recycling/reuse tags | 15% |
| **Water Usage / Biodiversity** | OFF Eco-Score subcomponents | Same as Eco-Score | `ecoscore_data.agribalyse`: water, eutrophication, land use, biodiversity | 10% |
| **Certifications & Labels** | OFF labels | 90%+ | `labels_tags`: EU Organic, Fairtrade, Rainforest Alliance, MSC/ASC, etc. | Bonus: +20 max |

**Expected Result:**
- **70-80% of scans** will show full A-E sustainability letter grade + breakdown screen
- **Missing data** = "Data incomplete — help us improve by uploading ingredients/photo!" (turns users into contributors)

**Implementation Steps:**

1. **Extract Full Eco-Score Data:**
```typescript
// In openFoodFacts.ts
export function extractFullEcoScoreData(product: Product): EcoScoreData {
  if (!product.ecoscore_data) {
    return null;
  }

  return {
    grade: product.ecoscore_data.grade, // A-E
    score: product.ecoscore_data.score, // 0-100
    carbonFootprint: product.ecoscore_data.agribalyse?.co2_total, // kg CO2e
    waterFootprint: product.ecoscore_data.agribalyse?.water_usage,
    landUse: product.ecoscore_data.agribalyse?.land_use,
    biodiversityThreats: product.ecoscore_data.agribalyse?.biodiversity_threats,
    transportImpact: product.ecoscore_data.transport_impact,
    packagingImpact: product.ecoscore_data.packaging_impact,
    originsOfIngredients: product.ecoscore_data.origins_of_ingredients,
  };
}
```

2. **Extract Palm Oil Analysis:**
```typescript
export function extractPalmOilAnalysis(product: Product): PalmOilAnalysis {
  const tags = product.ingredients_analysis_tags || [];
  
  return {
    containsPalmOil: tags.includes('en:palm-oil'),
    isPalmOilFree: tags.includes('en:palm-oil-free'),
    isNonSustainable: tags.includes('en:non-sustainable-palm-oil'),
    score: calculatePalmOilScore(tags), // -10 to +10
  };
}
```

3. **Extract Packaging Sustainability:**
```typescript
export function extractPackagingSustainability(product: Product): PackagingData {
  const packagings = product.packagings || [];
  const tags = product.packaging_tags || [];
  
  return {
    materials: packagings.map(p => p.material),
    recyclability: calculateRecyclabilityScore(packagings, tags),
    isRecyclable: tags.includes('en:recyclable'),
    isReusable: tags.includes('en:reusable'),
    score: calculatePackagingScore(packagings, tags), // 0-100
  };
}
```

4. **Calculate Enhanced Sustainability Score:**
```typescript
export function calculateEnhancedSustainabilityScore(product: Product): number {
  const ecoScore = extractFullEcoScoreData(product);
  const palmOil = extractPalmOilAnalysis(product);
  const packaging = extractPackagingSustainability(product);
  const certifications = formatCertifications(product);
  
  let score = 50; // Base score
  
  // Eco-Score (50-60% weight)
  if (ecoScore) {
    score = ecoScore.score * 0.55;
  }
  
  // Carbon footprint (15-20% weight)
  if (ecoScore?.carbonFootprint) {
    const carbonScore = calculateCarbonScore(ecoScore.carbonFootprint);
    score += carbonScore * 0.18;
  }
  
  // Palm oil penalty/bonus (-10 to +10)
  score += palmOil.score;
  
  // Packaging (15% weight)
  if (packaging.score !== undefined) {
    score += packaging.score * 0.15;
  }
  
  // Water/biodiversity (10% weight)
  if (ecoScore?.waterFootprint && ecoScore?.biodiversityThreats) {
    const waterBiodiversityScore = calculateWaterBiodiversityScore(ecoScore);
    score += waterBiodiversityScore * 0.10;
  }
  
  // Certifications bonus (max +20)
  const certBonus = Math.min(certifications?.length * 5 || 0, 20);
  score += certBonus;
  
  return Math.max(0, Math.min(100, score));
}
```

**Timeline:** <2 weeks implementation

**Cost:** €0 (completely free)

**Result:** Better sustainability scoring than 95% of apps (including most paid ones)

---

## 🔧 Implementation Roadmap

### Phase 1: Enhance Existing OFF Integration (Week 1) ⭐⭐⭐

**Priority:** CRITICAL

**Tasks:**
1. ✅ Extract full `ecoscore_data` object
2. ✅ Parse `ingredients_analysis_tags` for palm oil, vegan, vegetarian
3. ✅ Extract `packagings` array for packaging sustainability
4. ✅ Display carbon footprint (CO2e) when available
5. ✅ Show water footprint and biodiversity impact
6. ✅ Calculate enhanced sustainability score

**Files to Modify:**
- `src/services/openFoodFacts.ts` - Add extraction functions
- `src/types/product.ts` - Add new type definitions
- `app/result/[barcode].tsx` - Display new data
- `src/components/EcoScore.tsx` - Enhance display

**Expected Impact:**
- 70-80% of products now show full sustainability breakdown
- Zero cost
- Immediate improvement

---

### Phase 2: Add Open Beauty Facts (Week 1-2) ⭐⭐

**Priority:** HIGH

**Tasks:**
1. Create `src/services/openBeautyFacts.ts`
2. Integrate into `productService.ts` fallback chain
3. Test with cosmetics barcodes
4. Display beauty-specific data

**Expected Impact:**
- +10-15% coverage for cosmetics
- Zero cost

---

### Phase 3: Add Food Recall Services (Week 2) ⭐⭐⭐

**Priority:** CRITICAL (Safety)

**Tasks:**
1. Create `src/services/fdaRecallService.ts`
2. Create `src/services/rasffService.ts` (EU)
3. Check recalls when product is scanned
4. Display recall alerts prominently
5. Cache recall data (weekly updates)

**Expected Impact:**
- Critical safety information
- Builds user trust
- Zero cost

---

### Phase 4: Add Open Pet Food Facts (Week 2) ⭐

**Priority:** MEDIUM

**Tasks:**
1. Create `src/services/openPetFoodFacts.ts`
2. Integrate into fallback chain
3. Test with pet food barcodes

**Expected Impact:**
- +5-10% coverage for pet food
- Zero cost

---

### Phase 5: Add USDA FoodData Central (Week 3) ⭐⭐

**Priority:** MEDIUM-HIGH

**Tasks:**
1. Register for free API key
2. Create `src/services/usdaService.ts`
3. Use product name to search (fuzzy matching)
4. Merge nutrition data with existing product
5. Use as enhancement (not primary source)

**Expected Impact:**
- Enhanced nutrition data for ~20-30% of products
- Free (requires registration)

---

### Phase 6: Add Open Products Facts (Week 3) ⭐

**Priority:** LOW

**Tasks:**
1. Create `src/services/openProductsFacts.ts`
2. Integrate into fallback chain
3. Test with household product barcodes

**Expected Impact:**
- +5-10% coverage for household products
- Zero cost

---

## 📊 Data Coverage Projections

### Current Coverage:
- **Food Products:** ~70% (OFF primary)
- **Alcohol:** ~60% (UPCitemdb)
- **Cosmetics:** ~40% (UPCitemdb basic)
- **Pet Food:** ~50% (OFF)
- **Household:** ~50% (UPCitemdb)
- **Overall:** ~65-70%

### After All Enhancements:
- **Food Products:** ~80-85% (OFF + enhanced extraction)
- **Alcohol:** ~60% (UPCitemdb, no change)
- **Cosmetics:** ~55-60% (OFF + Open Beauty Facts)
- **Pet Food:** ~60-65% (OFF + Open Pet Food Facts)
- **Household:** ~60-65% (UPCitemdb + Open Products Facts)
- **Overall:** ~75-80%

### With Web Search Fallback:
- **Overall:** ~95%+ (always returns something)

---

## 🛡️ Reliability Enhancements

### 1. Request Deduplication

**Issue:** Multiple simultaneous scans of same barcode = duplicate API calls

**Solution:**
```typescript
// In productService.ts
const pendingRequests = new Map<string, Promise<Product | null>>();

export async function fetchProduct(barcode: string, ...) {
  // Check if request already in flight
  const existing = pendingRequests.get(barcode);
  if (existing) {
    return existing;
  }
  
  // Create new request
  const request = performFetch(barcode, ...);
  pendingRequests.set(barcode, request);
  
  // Clean up after completion
  request.finally(() => {
    pendingRequests.delete(barcode);
  });
  
  return request;
}
```

---

### 2. Circuit Breaker Pattern

**Issue:** Failing APIs cause repeated failures

**Solution:**
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) { // 1 min
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

---

### 3. Progressive Loading

**Issue:** Users wait for all data before seeing anything

**Solution:**
```typescript
// Show cached data immediately
const cached = await getCachedProduct(barcode);
if (cached) {
  setProduct(cached); // Show immediately
}

// Update in background
const fresh = await fetchProduct(barcode, false);
if (fresh) {
  setProduct(fresh); // Update with fresh data
}
```

---

### 4. Better Error Messages

**Issue:** Generic error messages don't help users

**Solution:**
```typescript
// User-friendly error messages
if (error.type === 'NETWORK_ERROR') {
  return 'No internet connection. Showing cached data.';
}
if (error.type === 'PRODUCT_NOT_FOUND') {
  return 'Product not found. Try contributing to Open Food Facts!';
}
if (error.type === 'API_RATE_LIMIT') {
  return 'Too many requests. Please wait a moment.';
}
```

---

### 5. Data Quality Scoring

**Issue:** No way to know if data is reliable

**Solution:**
```typescript
export function calculateDataQualityScore(product: Product): number {
  let score = 0;
  
  // Source quality
  if (product.source === 'openfoodfacts') score += 40;
  else if (product.source === 'upcitemdb') score += 20;
  else if (product.source === 'web_search') score += 10;
  
  // Completeness
  if (product.product_name) score += 10;
  if (product.image_url) score += 10;
  if (product.nutriments) score += 15;
  if (product.ingredients_text) score += 15;
  if (product.ecoscore_data) score += 10;
  
  return Math.min(100, score);
}
```

---

## 📝 Type Definitions Updates

### New Types Needed:

```typescript
// Enhanced Eco-Score data
export interface EcoScoreData {
  grade: 'a' | 'b' | 'c' | 'd' | 'e' | 'unknown';
  score: number; // 0-100
  carbonFootprint?: number; // kg CO2e per kg
  waterFootprint?: number; // liters per kg
  landUse?: number; // m² per kg
  biodiversityThreats?: number;
  transportImpact?: number;
  packagingImpact?: number;
  originsOfIngredients?: any;
}

// Palm oil analysis
export interface PalmOilAnalysis {
  containsPalmOil: boolean;
  isPalmOilFree: boolean;
  isNonSustainable: boolean;
  score: number; // -10 to +10
}

// Packaging data
export interface PackagingData {
  materials: string[];
  recyclability: number; // 0-100
  isRecyclable: boolean;
  isReusable: boolean;
  score: number; // 0-100
}

// Food recall data
export interface FoodRecall {
  recallId: string;
  productName: string;
  brand: string;
  reason: string;
  recallDate: string;
  distribution: string[];
  isActive: boolean;
}
```

---

## ✅ Testing Plan

### 1. Data Source Testing

**Test Barcodes:**
- Food product with full OFF data: `3017620422003` (Nutella)
- Food product with partial data: `5000159461125` (Coca-Cola)
- Cosmetics: Test with Open Beauty Facts
- Pet food: Test with Open Pet Food Facts
- Product not in any database: Random 13-digit number

### 2. Reliability Testing

- Test with network offline
- Test with slow network
- Test with API failures
- Test with rate limits
- Test with invalid barcodes

### 3. Data Quality Testing

- Verify Eco-Score extraction
- Verify palm oil detection
- Verify packaging data
- Verify recall alerts
- Verify nutrition data accuracy

---

## 🎯 Success Metrics

**Data Coverage:**
- Target: 80%+ products with comprehensive data
- Current: ~70%
- After enhancements: ~80-85%

**Data Quality:**
- Target: 90%+ products with Trust Score
- Current: ~70% (only when sufficient data)
- After enhancements: ~80-85%

**Reliability:**
- Target: 99.9% uptime
- Current: ~95% (CORS proxy issues)
- After enhancements: ~99%+ (better error handling)

**User Trust:**
- Target: Users see reliable, comprehensive data
- Measure: User retention, share rate, contribution rate

---

## 📋 TODO: Future Enhancements (Keep for Later)

These are the enhancement suggestions from the previous analysis. Keep as future todos:

1. **Social Sharing Enhancement** - Visual share cards, Instagram integration
2. **Educational Content** - Interactive learning, nutrition education hub
3. **Product Alternatives** - Better alternatives feature, comparisons
4. **Gamification** - Achievements, badges, challenges
5. **Community Features** - User reviews, ratings, discussions
6. **Health Tracking** - Personal health profile, nutrition tracking
7. **Advanced Search** - Global product search, visual search
8. **Personalization** - Tailored recommendations, dietary preferences

**Focus Now:** Make the app solid, bulletproof, reliable, and rich with data.

---

## 🚀 Quick Start Implementation

### Step 1: Enhance OFF Integration (This Week)

1. Update `src/services/openFoodFacts.ts`:
   - Add `extractFullEcoScoreData()`
   - Add `extractPalmOilAnalysis()`
   - Add `extractPackagingSustainability()`

2. Update `src/types/product.ts`:
   - Add new type definitions

3. Update `app/result/[barcode].tsx`:
   - Display carbon footprint
   - Display palm oil status
   - Display packaging sustainability

4. Test with known products

### Step 2: Add Food Recall Service (Next Week)

1. Create `src/services/fdaRecallService.ts`
2. Integrate into product lookup
3. Display recall alerts

### Step 3: Add Open Beauty Facts (Next Week)

1. Create `src/services/openBeautyFacts.ts`
2. Integrate into fallback chain
3. Test with cosmetics

---

## 📚 Resources

- **Open Food Facts API:** https://world.openfoodfacts.org/api/v2/product/{barcode}.json
- **Open Beauty Facts:** https://world.openbeautyfacts.org/api/v2/product/{barcode}.json
- **Open Pet Food Facts:** https://world.openpetfoodfacts.org/api/v2/product/{barcode}.json
- **Open Products Facts:** https://world.openproductsfacts.org/api/v2/product/{barcode}.json
- **FDA Recall API:** https://api.fda.gov/food/enforcement.json
- **USDA FoodData Central:** https://fdc.nal.usda.gov/api-guide.html
- **Agribalyse:** https://agribalyse.ademe.fr/

---

**End of Data Source Analysis Document**

