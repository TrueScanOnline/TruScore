# Database Strategy Implementation - TruScore Backbone

**Date:** January 2025  
**Purpose:** Implementation guide for maximum TruScore data quality

---

## Critical Requirements

### 1. Maximum Database Coverage
- ✅ Query ALL relevant databases for each product
- ✅ Location-specific databases prioritized
- ✅ Parallel querying for efficiency
- ✅ No database left unqueried if relevant

### 2. TruScore Data Quality
- ✅ All 4 pillars have maximum data completeness
- ✅ TruScore-critical fields prioritized in merging
- ✅ Gold Standard databases take priority
- ✅ Data merged intelligently for completeness

---

## Current Implementation Analysis

### ✅ What's Working Well

1. **Location Detection** - `getUserCountryCode()` works
2. **Country-Specific Queries** - FSANZ, USDA, Health Canada queried
3. **Parallel Querying** - Some queries are parallel (Tier 1, Tier 3)
4. **TruScore-Aware Merger** - `productDataMerger.ts` prioritizes TruScore completeness
5. **Multiple Databases** - 20+ databases available

### ⚠️ Areas for Improvement

1. **Sequential Queries** - Tier 1.5 queries sequentially (could be parallel)
2. **Missing Queries** - Some databases not queried for all location-specific users
3. **Inefficient Merging** - Could be more aggressive about TruScore fields
4. **No Early Termination** - Queries all databases even if complete data found

---

## Enhanced Database Query Strategy

### Optimized Query Flow

```typescript
// src/data/databases/truScoreOptimizedDatabase.ts

export class TruScoreOptimizedDatabase {
  /**
   * Query ALL databases in parallel, optimized for TruScore
   */
  async queryForTruScore(
    barcode: string,
    userCountry: string | null
  ): Promise<Product> {
    // Phase 1: Gold Standard + Open Facts (parallel)
    const [goldStandard, openFacts] = await Promise.all([
      this.queryGoldStandardParallel(barcode, userCountry),
      this.queryOpenFactsParallel(barcode),
    ]);
    
    // Phase 2: Enhancements (parallel)
    const enhancements = await this.queryEnhancementsParallel(barcode, userCountry);
    
    // Phase 3: Fallbacks (only if needed)
    let fallbacks: Product[] = [];
    const allProducts = [...goldStandard, ...openFacts, ...enhancements];
    if (allProducts.length === 0) {
      fallbacks = await this.queryFallbacksParallel(barcode);
    }
    
    // Phase 4: Product Name Queries (after product found)
    let nameQueries: Product[] = [];
    if (allProducts.length > 0) {
      const productName = allProducts[0]?.product_name;
      if (productName) {
        nameQueries = await this.queryByNameParallel(productName, userCountry);
      }
    }
    
    // Merge ALL products with TruScore optimization
    const allProductsToMerge = [...allProducts, ...fallbacks, ...nameQueries];
    return this.mergeForTruScore(allProductsToMerge);
  }
  
  /**
   * Query Gold Standard databases in parallel
   */
  private async queryGoldStandardParallel(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // Location-specific Gold Standard (ALL in parallel)
    if (userCountry === 'AU') {
      queries.push(fetchProductFromFSANZ(barcode, 'AU'));
      queries.push(enhanceProductWithAFCD(barcode)); // By product name after found
    }
    if (userCountry === 'NZ') {
      queries.push(fetchProductFromFSANZ(barcode, 'NZ'));
      queries.push(enhanceProductWithNZFCD(barcode)); // By product name after found
    }
    if (userCountry === 'US') {
      queries.push(fetchProductFromUSDA(barcode));
    }
    if (userCountry === 'CA') {
      queries.push(fetchProductFromHealthCanada(barcode));
    }
    if (userCountry === 'GB') {
      queries.push(fetchProductFromUKFSA(barcode));
    }
    if (isEUCountry(userCountry)) {
      queries.push(fetchProductFromEFSA(barcode));
    }
    
    // Global Gold Standard (always query)
    queries.push(fetchProductFromGS1(barcode));
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Query Open Facts databases in parallel
   */
  private async queryOpenFactsParallel(barcode: string): Promise<Product[]> {
    const queries = [
      fetchProductFromOFF(barcode),
      fetchProductFromOBF(barcode),
      fetchProductFromOPFF(barcode),
      fetchProductFromOPF(barcode),
    ];
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Query enhancement databases in parallel
   */
  private async queryEnhancementsParallel(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // Location-specific store APIs
    if (userCountry === 'NZ') {
      queries.push(fetchProductFromNZStores(barcode));
    }
    if (userCountry === 'AU') {
      queries.push(fetchProductFromAURetailers(barcode));
    }
    if (userCountry === 'GB') {
      queries.push(fetchProductFromTesco(barcode));
    }
    if (userCountry === 'US') {
      queries.push(fetchProductFromWalmart(barcode));
      queries.push(fetchProductFromFoodRepo(barcode));
    }
    
    // Nutrition APIs (always query for enhancement)
    queries.push(fetchProductFromEdamam(barcode));
    queries.push(fetchProductFromNutritionix(barcode));
    queries.push(fetchProductFromSpoonacular(barcode));
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Query fallback databases in parallel
   */
  private async queryFallbacksParallel(barcode: string): Promise<Product[]> {
    const queries = [
      fetchProductFromUPCitemdb(barcode),
      fetchProductFromEANSearch(barcode),
      fetchProductFromBarcodeSpider(barcode),
      fetchProductFromGoUpc(barcode),
      fetchProductFromBuycott(barcode),
      fetchProductFromOpenGtin(barcode),
      fetchProductFromBarcodeMonster(barcode),
      fetchProductFromUPCDatabase(barcode),
      fetchProductFromBarcodeLookup(barcode),
      fetchProductFromEANData(barcode),
      fetchProductFromBestBuy(barcode),
    ];
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Query by product name (after product found)
   * This is CRITICAL for FSANZ databases
   */
  private async queryByNameParallel(
    productName: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // FSANZ by product name (AU/NZ)
    if (userCountry === 'AU') {
      queries.push(queryFSANZByProductName(productName, 'AU'));
    }
    if (userCountry === 'NZ') {
      queries.push(queryFSANZByProductName(productName, 'NZ'));
    }
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
  
  /**
   * Merge products with TruScore-first strategy
   */
  private mergeForTruScore(products: Product[]): Product {
    if (products.length === 0) {
      throw new Error('No products to merge');
    }
    
    if (products.length === 1) {
      return products[0];
    }
    
    // Use existing merger but ensure TruScore optimization
    return mergeProducts(products, {
      sourceWeights: this.getTruScoreSourceWeights(),
      normalizeNutrition: true,
      shouldMergeCertifications: true,
    });
  }
  
  /**
   * Get source weights optimized for TruScore
   */
  private getTruScoreSourceWeights(): Record<string, number> {
    return {
      // Gold Standard (highest)
      'fsanz_au': 0.50,
      'fsanz_nz': 0.50,
      'nzfcd': 0.50,
      'afcd': 0.50,
      'usda_fooddata': 0.50,
      'health_canada_cnf': 0.50,
      'uk_fsa': 0.50,
      'efsa': 0.50,
      'gs1_datasource': 0.45,
      
      // Open Facts (high)
      'openfoodfacts': 0.45,
      'openbeautyfacts': 0.40,
      'openpetfoodfacts': 0.40,
      'openproductsfacts': 0.35,
      
      // Store APIs (medium)
      'woolworths_au': 0.35,
      'coles_au': 0.35,
      'woolworths_nz': 0.35,
      'paknsave': 0.35,
      'newworld': 0.35,
      'tesco_labs': 0.35,
      'walmart_open': 0.35,
      'foodrepo': 0.35,
      
      // Nutrition APIs (medium)
      'edamam': 0.30,
      'nutritionix': 0.30,
      'spoonacular': 0.30,
      
      // Fallback (low)
      'upcitemdb': 0.20,
      'ean_search': 0.20,
      'barcode_spider': 0.20,
      'web_search': 0.10,
    };
  }
}
```

---

## Enhanced Merging for TruScore

### TruScore-First Merging Rules

```typescript
// Enhanced merger that prioritizes TruScore-critical fields

export function mergeForTruScore(products: Product[]): Product {
  // Step 1: Calculate TruScore completeness for each
  const scored = products.map(p => ({
    product: p,
    truScoreCompleteness: calculateTruScoreCompleteness(p),
    sourceWeight: getSourceWeight(p.source),
    combinedScore: calculateCombinedScore(p),
  }));
  
  // Step 2: Sort by combined score (60% completeness + 40% source weight)
  scored.sort((a, b) => b.combinedScore - a.combinedScore);
  
  // Step 3: Use highest as base
  const base = scored[0].product;
  const merged: Product = { ...base };
  
  // Step 4: Aggressively merge TruScore-critical fields
  mergeTruScoreCriticalFields(merged, scored.map(s => s.product));
  
  return merged;
}

function mergeTruScoreCriticalFields(
  merged: Product,
  products: Product[]
): void {
  // BODY PILLAR
  // Nutri-Score: Use from highest priority source
  if (!merged.nutriscore_grade) {
    merged.nutriscore_grade = products
      .find(p => p.nutriscore_grade)?.nutriscore_grade;
  }
  
  // NOVA: Use from highest priority source
  if (!merged.nova_group) {
    merged.nova_group = products
      .find(p => p.nova_group)?.nova_group;
  }
  
  // Additives: UNION ALL (critical for penalties)
  const allAdditives = products
    .map(p => p.additives_tags)
    .filter((tags): tags is string[] => Array.isArray(tags));
  if (allAdditives.length > 0) {
    const unique = new Set<string>();
    allAdditives.forEach(tags => tags.forEach(tag => unique.add(tag)));
    merged.additives_tags = Array.from(unique);
  }
  
  // Nutrition: Weighted average from ALL sources
  const allNutriments = products
    .map(p => p.nutriments)
    .filter((n): n is ProductNutriments => n !== undefined);
  if (allNutriments.length > 0) {
    merged.nutriments = mergeNutrimentsWeighted(allNutriments, products);
  }
  
  // PLANET PILLAR
  // Eco-Score: Use from highest priority source
  if (!merged.ecoscore_grade) {
    merged.ecoscore_grade = products
      .find(p => p.ecoscore_grade)?.ecoscore_grade;
  }
  
  // Palm Oil: Use MOST COMPLETE analysis
  const palmOilAnalyses = products
    .map(p => p.palm_oil_analysis)
    .filter((a): a is NonNullable<Product['palm_oil_analysis']> => a !== undefined);
  if (palmOilAnalyses.length > 0) {
    merged.palm_oil_analysis = palmOilAnalyses.reduce((best, current) => {
      const bestScore = scorePalmOilAnalysis(best);
      const currentScore = scorePalmOilAnalysis(current);
      return currentScore > bestScore ? current : best;
    });
  }
  
  // Packaging: UNION ALL (critical for recyclability)
  const allPackagings = products
    .map(p => p.packagings)
    .filter((p): p is NonNullable<Product['packagings']> => Array.isArray(p));
  if (allPackagings.length > 0) {
    const unique = new Map<string, PackagingItem>();
    allPackagings.forEach(packagings => {
      packagings.forEach(pkg => {
        const key = `${pkg.material}_${pkg.shape}_${pkg.recycling}`;
        if (!unique.has(key)) {
          unique.set(key, pkg);
        }
      });
    });
    merged.packagings = Array.from(unique.values());
  }
  
  // Ethics Pillar
  // Certifications: UNION ALL (critical for bonuses)
  const allLabels = products
    .map(p => p.labels_tags)
    .filter((tags): tags is string[] => Array.isArray(tags));
  if (allLabels.length > 0) {
    const unique = new Set<string>();
    allLabels.forEach(tags => tags.forEach(tag => unique.add(tag)));
    merged.labels_tags = Array.from(unique);
  }
  
  const allCerts = products
    .map(p => p.certifications)
    .filter((c): c is Certification[] => Array.isArray(c));
  if (allCerts.length > 0) {
    const unique = new Map<string, Certification>();
    allCerts.forEach(certs => {
      certs.forEach(cert => {
        const key = cert.tag || cert.id || cert.name || '';
        if (key && !unique.has(key)) {
          unique.set(key, cert);
        }
      });
    });
    merged.certifications = Array.from(unique.values());
  }
  
  // OPEN PILLAR
  // Ingredients: Use LONGEST (most complete)
  const allIngredients = products
    .map(p => p.ingredients_text)
    .filter((i): i is string => !!i && i.length > 10);
  if (allIngredients.length > 0) {
    merged.ingredients_text = allIngredients.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }
  
  // Origins: UNION ALL (critical for transparency)
  const allOrigins = products
    .map(p => p.origins_tags)
    .filter((tags): tags is string[] => Array.isArray(tags));
  if (allOrigins.length > 0) {
    const unique = new Set<string>();
    allOrigins.forEach(tags => tags.forEach(tag => unique.add(tag)));
    merged.origins_tags = Array.from(unique);
  }
  
  // Manufacturing: UNION ALL
  const allManufacturing = products
    .map(p => p.manufacturing_places_tags)
    .filter((tags): tags is string[] => Array.isArray(tags));
  if (allManufacturing.length > 0) {
    const unique = new Set<string>();
    allManufacturing.forEach(tags => tags.forEach(tag => unique.add(tag)));
    merged.manufacturing_places_tags = Array.from(unique);
  }
}
```

---

## Location-Specific Database Priority Matrix

### Australia (AU)
```
Priority 1 (Gold Standard - Parallel):
  ✅ FSANZ AU (by barcode)
  ✅ AFCD (by product name - after product found)
  ✅ GS1 DataSource

Priority 2 (Open Facts - Parallel):
  ✅ Open Food Facts AU
  ✅ Open Food Facts (global)
  ✅ Open Beauty Facts
  ✅ Open Pet Food Facts
  ✅ Open Products Facts

Priority 3 (Store APIs - Parallel):
  ✅ Woolworths AU
  ✅ Coles AU
  ✅ IGA AU

Priority 4 (Enhancements - Parallel):
  ✅ Edamam
  ✅ Nutritionix
  ✅ Spoonacular

Priority 5 (Fallbacks - Only if needed):
  ✅ UPCitemdb
  ✅ EAN-Search
  ✅ Barcode Spider
  ✅ ... (all fallbacks)
```

### New Zealand (NZ)
```
Priority 1 (Gold Standard - Parallel):
  ✅ FSANZ NZ (by barcode)
  ✅ NZFCD (by product name - after product found)
  ✅ GS1 DataSource

Priority 2 (Open Facts - Parallel):
  ✅ Open Food Facts NZ
  ✅ Open Food Facts (global)
  ✅ Open Beauty Facts
  ✅ Open Pet Food Facts
  ✅ Open Products Facts

Priority 3 (Store APIs - Parallel):
  ✅ Woolworths NZ
  ✅ Pak'nSave
  ✅ New World

Priority 4 (Enhancements - Parallel):
  ✅ Edamam
  ✅ Nutritionix
  ✅ Spoonacular

Priority 5 (Fallbacks - Only if needed):
  ✅ UPCitemdb
  ✅ EAN-Search
  ✅ ... (all fallbacks)
```

### United States (US)
```
Priority 1 (Gold Standard - Parallel):
  ✅ USDA FoodData
  ✅ GS1 DataSource

Priority 2 (Open Facts - Parallel):
  ✅ Open Food Facts US
  ✅ Open Food Facts (global)
  ✅ Open Beauty Facts
  ✅ Open Pet Food Facts
  ✅ Open Products Facts

Priority 3 (Store APIs - Parallel):
  ✅ Walmart Open
  ✅ FoodRepo

Priority 4 (Enhancements - Parallel):
  ✅ Edamam
  ✅ Nutritionix
  ✅ Spoonacular

Priority 5 (Recalls - Parallel):
  ✅ FDA Recalls
  ✅ USDA FSIS Recalls

Priority 6 (Fallbacks - Only if needed):
  ✅ UPCitemdb
  ✅ EAN-Search
  ✅ ... (all fallbacks)
```

---

## Implementation: Replace Current Query Strategy

### Current Flow (Sequential in Some Areas)
```
1. SQLite (offline)
2. Cache
3. Tier 1: Open Facts (parallel) ✅
4. Tier 1.5: Country-specific (SEQUENTIAL) ❌
5. Tier 2: Official (parallel) ✅
6. Tier 3: Fallbacks (parallel) ✅
7. Tier 4: Web Search (if needed)
```

### Optimized Flow (All Parallel)
```
1. SQLite (offline) - Check first
2. Cache - Check second
3. ALL DATABASES IN PARALLEL:
   - Gold Standard (location-specific + global)
   - Open Facts (all 4)
   - Store APIs (location-specific)
   - Nutrition APIs (all 3)
   - Fallbacks (if needed)
4. Product Name Queries (after product found):
   - FSANZ by name (AU/NZ)
   - NZFCD/AFCD by name
5. Merge ALL results with TruScore optimization
```

---

## Key Improvements

### 1. Parallel Querying
**Current:** Some queries sequential  
**Optimized:** ALL queries parallel

```typescript
// Execute ALL database queries in parallel
const allQueries = [
  ...goldStandardQueries,
  ...openFactsQueries,
  ...storeApiQueries,
  ...nutritionApiQueries,
  ...fallbackQueries,
];

const results = await Promise.allSettled(allQueries);
// Process all results
```

### 2. Location-Specific Aggressiveness
**Current:** Some location-specific databases not queried  
**Optimized:** ALL location-specific databases ALWAYS queried

```typescript
// For AU users, ALWAYS query:
- FSANZ AU (by barcode)
- AFCD (by product name)
- AU Retailer APIs (Woolworths, Coles, IGA)
- Open Food Facts AU
```

### 3. Product Name Queries
**Current:** Sometimes skipped  
**Optimized:** ALWAYS query by product name after product found

```typescript
// After product found, query by name:
if (product && product.product_name) {
  // FSANZ by product name (AU/NZ)
  // NZFCD/AFCD by product name
  // This gets additional data not available by barcode
}
```

### 4. TruScore-Optimized Merging
**Current:** Good, but could be more aggressive  
**Optimized:** Maximum TruScore completeness

```typescript
// Merge strategy:
1. Calculate TruScore completeness for each product
2. Select base product (highest combined score)
3. Aggressively merge ALL TruScore-critical fields:
   - Union all additives_tags
   - Union all labels_tags
   - Union all packagings
   - Use longest ingredients_text
   - Weighted average for nutrition
```

---

## Implementation Steps

### Step 1: Create Enhanced Database Service
**File:** `src/data/databases/truScoreOptimizedDatabase.ts`

- Implement parallel querying
- Implement location-specific mapping
- Implement product name queries

### Step 2: Enhance Merger
**File:** `src/services/productDataMerger.ts` (enhance existing)

- More aggressive TruScore field merging
- Better completeness calculation
- Optimized source weights

### Step 3: Integrate with Product Service
**File:** `src/services/productService.ts` (update)

- Replace sequential queries with parallel
- Use enhanced database service
- Use enhanced merger

### Step 4: Test & Verify
- Test with AU products (FSANZ + AFCD)
- Test with NZ products (FSANZ + NZFCD)
- Test with US products (USDA)
- Verify TruScore completeness > 80%

---

## Success Criteria

### Data Quality
- ✅ **TruScore Completeness**: > 80% for 90%+ of products
- ✅ **Database Coverage**: 10+ databases queried per product
- ✅ **Location-Specific**: 100% of location databases queried

### Performance
- ✅ **Query Time**: < 3 seconds (parallel execution)
- ✅ **Cache Efficiency**: > 60% cache hit rate

### TruScore Accuracy
- ✅ **All 4 Pillars**: Have data for 90%+ products
- ✅ **Gold Standard**: Used when available
- ✅ **Complete Merging**: Best data from all sources

---

**This strategy ensures TruScore receives the most accurate, complete, and reliable data possible! 🎯**


