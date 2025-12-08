# Database Strategy for Maximum TruScore Accuracy

**Date:** January 2025  
**Purpose:** Ensure maximum data quality, completeness, and accuracy for TruScore calculation

---

## Executive Summary

This document defines the **database querying and merging strategy** to ensure TruScore receives the **most accurate, complete, and reliable data** possible. This is the **backbone** of the app.

### Core Principles

1. **Maximum Database Coverage** - Query ALL relevant databases
2. **Location-Specific Priority** - Prioritize country-specific databases
3. **Parallel Querying** - Query databases simultaneously for speed
4. **Intelligent Merging** - Merge data to maximize TruScore completeness
5. **TruScore-First** - Prioritize fields critical for TruScore calculation

---

## Current Database Inventory

### Tier 1: Gold Standard (Government/Official Databases)
**Priority: HIGHEST - Always query for location-specific users**

| Database | Countries | TruScore Value | Fields Provided |
|----------|-----------|----------------|-----------------|
| **FSANZ (AU)** | AU | ⭐⭐⭐⭐⭐ | Nutrition, ingredients, additives, allergens |
| **FSANZ (NZ)** | NZ | ⭐⭐⭐⭐⭐ | Nutrition, ingredients, additives, allergens |
| **USDA FoodData** | US | ⭐⭐⭐⭐⭐ | Official nutrition, ingredients, branded foods |
| **Health Canada CNF** | CA | ⭐⭐⭐⭐⭐ | Nutrition, ingredients, Canadian foods |
| **UK FSA** | GB | ⭐⭐⭐⭐ | Food safety, allergens, regulations |
| **EFSA** | EU | ⭐⭐⭐⭐ | Food safety, additives, allergens |
| **GS1 DataSource** | Global | ⭐⭐⭐⭐ | Official barcode verification, product info |

### Tier 2: Open Facts Family (Community Databases)
**Priority: HIGH - Always query in parallel**

| Database | Coverage | TruScore Value | Fields Provided |
|----------|----------|----------------|-----------------|
| **Open Food Facts** | Global | ⭐⭐⭐⭐⭐ | Nutrition, ingredients, Nutri-Score, Eco-Score, certifications, palm oil, packaging |
| **Open Beauty Facts** | Global | ⭐⭐⭐⭐ | Cosmetics, ingredients, certifications |
| **Open Pet Food Facts** | Global | ⭐⭐⭐⭐ | Pet food, nutrition, ingredients |
| **Open Products Facts** | Global | ⭐⭐⭐ | General products, electronics, household |

### Tier 3: Country-Specific Store APIs
**Priority: MEDIUM-HIGH - Query for location-specific users**

| Database | Countries | TruScore Value | Fields Provided |
|----------|-----------|----------------|-----------------|
| **NZ Store APIs** | NZ | ⭐⭐⭐ | Product name, price, availability |
| **AU Retailer APIs** | AU | ⭐⭐⭐ | Product name, price, availability |
| **Tesco Labs** | GB | ⭐⭐⭐ | Product info, nutrition |
| **Walmart Open** | US | ⭐⭐⭐ | Product info, pricing |

### Tier 4: Global Product Databases
**Priority: MEDIUM - Query as fallback**

| Database | Coverage | TruScore Value | Fields Provided |
|----------|----------|----------------|-----------------|
| **UPCitemdb** | Global | ⭐⭐⭐ | Product name, brand, image |
| **EAN-Search** | Global (1B+) | ⭐⭐⭐ | Regional products, EU/AU coverage |
| **Barcode Spider** | Global | ⭐⭐ | Basic product info |
| **UPC Database** | Global (4.3M+) | ⭐⭐ | Product validation |

### Tier 5: Nutrition-Focused APIs
**Priority: MEDIUM - Query for nutrition enhancement**

| Database | Coverage | TruScore Value | Fields Provided |
|----------|----------|----------------|-----------------|
| **Edamam** | Global | ⭐⭐⭐ | Nutrition data, analysis |
| **Nutritionix** | Global | ⭐⭐⭐ | Nutrition, ingredients |
| **Spoonacular** | Global | ⭐⭐⭐ | Food data, nutrition |

### Tier 6: Fallback
**Priority: LOW - Last resort**

| Database | Coverage | TruScore Value | Fields Provided |
|----------|----------|----------------|-----------------|
| **Web Search** | Global | ⭐ | Minimal product info |

---

## TruScore-Critical Fields

### Body Pillar (25 points)
**Critical Fields:**
- ✅ `nutriscore_grade` - Direct score (A=25, B=20, C=15, D=10, E=5)
- ✅ `nova_group` - Processing level (1=+3, 2=0, 3=-3, 4=-8)
- ✅ `additives_tags` - Additive penalties (IARC classes: 1=-10, 2A=-5, 2B=-3)
- ✅ `ingredients_analysis_tags` - Risk tags (carcinogenic, endocrine, etc.)
- ✅ `nutriments` - Nutrition data (for base score if no Nutri-Score)

**Best Sources:**
1. Open Food Facts (Nutri-Score, NOVA, additives)
2. FSANZ (AU/NZ) - Official nutrition data
3. USDA (US) - Official nutrition data
4. Health Canada (CA) - Official nutrition data

### Planet Pillar (25 points)
**Critical Fields:**
- ✅ `ecoscore_grade` - Direct score (A=25, B=20, C=15, D=10, E=5)
- ✅ `palm_oil_analysis` - Palm oil status (-8 for non-sustainable)
- ✅ `packagings` - Packaging recyclability (+5 all, +2 some)
- ✅ `ingredients_analysis.en:palm-oil` - Palm oil detection

**Best Sources:**
1. Open Food Facts (Eco-Score, palm oil, packaging)
2. FSANZ (AU/NZ) - Official data
3. Country-specific regulations

### Care Pillar (25 points)
**Critical Fields:**
- ✅ `labels_tags` - Certifications (Fairtrade=+8, Organic=+7, etc.)
- ✅ `certifications` - Certification objects
- ✅ Brand database - Cruel parent detection (-15)
- ✅ Recalls - Food recall data (-10)

**Best Sources:**
1. Open Food Facts (certifications, labels)
2. Brand database (cruel parent detection)
3. Recall services (FDA, CFIA, RASFF, etc.)

### Open Pillar (25 points)
**Critical Fields:**
- ✅ `ingredients_text` - Full ingredients list (critical for transparency)
- ✅ `origins_tags` - Country of origin (-8 if missing)
- ✅ `manufacturing_places_tags` - Manufacturing location
- ✅ Hidden terms detection - Generic descriptors (-10/-20)

**Best Sources:**
1. Open Food Facts (ingredients, origins)
2. GS1 DataSource (official origin data)
3. Country-specific databases

---

## Location-Specific Database Strategy

### Australia (AU)
**Priority Order:**
1. **FSANZ AU** (Gold Standard) - Always query first
2. **AFCD** (Australian Food Composition Database) - Query by product name
3. **Open Food Facts AU** - Country-specific instance
4. **AU Retailer APIs** - Woolworths, Coles, IGA
5. **Global databases** - Fallback

**TruScore Enhancement:**
- FSANZ provides official nutrition data
- AFCD provides comprehensive food composition
- Merge with OFF for certifications, Eco-Score, palm oil

### New Zealand (NZ)
**Priority Order:**
1. **FSANZ NZ** (Gold Standard) - Always query first
2. **NZFCD** (New Zealand Food Composition Database) - Query by product name
3. **Open Food Facts NZ** - Country-specific instance
4. **NZ Store APIs** - Woolworths NZ, Pak'nSave, New World
5. **Global databases** - Fallback

**TruScore Enhancement:**
- FSANZ provides official nutrition data
- NZFCD provides comprehensive food composition
- Merge with OFF for certifications, Eco-Score, palm oil

### United States (US)
**Priority Order:**
1. **USDA FoodData** (Gold Standard) - Always query first
2. **Open Food Facts US** - Country-specific instance
3. **Walmart Open API** - Store data
4. **FDA Recalls** - Food recall data
5. **Global databases** - Fallback

**TruScore Enhancement:**
- USDA provides official branded food nutrition
- Override OFF if USDA has better data
- Merge for comprehensive coverage

### Canada (CA)
**Priority Order:**
1. **Health Canada CNF** (Gold Standard) - Always query first
2. **Open Food Facts CA** - Country-specific instance
3. **CFIA Recalls** - Food recall data
4. **Global databases** - Fallback

**TruScore Enhancement:**
- Health Canada provides official nutrition data
- Merge with OFF for comprehensive coverage

### United Kingdom (GB)
**Priority Order:**
1. **UK FSA** (Gold Standard) - Always query first
2. **Tesco Labs** - Store API
3. **Open Food Facts UK** - Country-specific instance
4. **Global databases** - Fallback

**TruScore Enhancement:**
- UK FSA provides food safety data
- Tesco provides product information
- Merge with OFF for comprehensive coverage

### European Union (EU)
**Priority Order:**
1. **EFSA** (Gold Standard) - Always query first
2. **RASFF** - Food safety alerts
3. **Open Food Facts [Country]** - Country-specific instance
4. **Global databases** - Fallback

**TruScore Enhancement:**
- EFSA provides food safety data
- RASFF provides recall alerts
- Merge with OFF for comprehensive coverage

---

## Optimized Query Strategy

### Phase 1: Parallel Gold Standard Queries
**Execute simultaneously for maximum speed:**

```typescript
// Query all Gold Standard databases in parallel
const goldStandardQueries = await Promise.allSettled([
  // Location-specific (if user in that country)
  userCountry === 'AU' && fetchProductFromFSANZ(barcode, 'AU'),
  userCountry === 'NZ' && fetchProductFromFSANZ(barcode, 'NZ'),
  userCountry === 'US' && fetchProductFromUSDA(barcode),
  userCountry === 'CA' && fetchProductFromHealthCanada(barcode),
  userCountry === 'GB' && fetchProductFromUKFSA(barcode),
  isEUCountry(userCountry) && fetchProductFromEFSA(barcode),
  
  // Global Gold Standard
  fetchProductFromGS1(barcode),
]);
```

### Phase 2: Parallel Open Facts Queries
**Execute simultaneously:**

```typescript
// Query all Open Facts databases in parallel
const openFactsQueries = await Promise.allSettled([
  fetchProductFromOFF(barcode),      // Open Food Facts
  fetchProductFromOBF(barcode),      // Open Beauty Facts
  fetchProductFromOPFF(barcode),     // Open Pet Food Facts
  fetchProductFromOPF(barcode),      // Open Products Facts
]);
```

### Phase 3: Parallel Enhancement Queries
**Execute simultaneously for location-specific users:**

```typescript
// Query country-specific enhancements in parallel
const enhancementQueries = await Promise.allSettled([
  // Store APIs (if user in that country)
  userCountry === 'NZ' && fetchProductFromNZStores(barcode),
  userCountry === 'AU' && fetchProductFromAURetailers(barcode),
  userCountry === 'GB' && fetchProductFromTesco(barcode),
  userCountry === 'US' && fetchProductFromWalmart(barcode),
  
  // Nutrition APIs (always query for nutrition enhancement)
  fetchProductFromEdamam(barcode),
  fetchProductFromNutritionix(barcode),
  fetchProductFromSpoonacular(barcode),
]);
```

### Phase 4: Parallel Fallback Queries
**Execute simultaneously if no results:**

```typescript
// Query fallback databases in parallel
const fallbackQueries = await Promise.allSettled([
  fetchProductFromUPCitemdb(barcode),
  fetchProductFromEANSearch(barcode),
  fetchProductFromBarcodeSpider(barcode),
  fetchProductFromUPCDatabase(barcode),
  fetchProductFromBarcodeLookup(barcode),
  fetchProductFromEANData(barcode),
]);
```

### Phase 5: Product Name Queries (After Product Found)
**Query by product name for additional data:**

```typescript
// If product found, query by product name for additional data
if (product && product.product_name) {
  const nameQueries = await Promise.allSettled([
    // FSANZ by product name (AU/NZ)
    (userCountry === 'AU' || userCountry === 'NZ') && 
      queryFSANZByProductName(product.product_name, userCountry),
    
    // NZFCD/AFCD by product name
    userCountry === 'NZ' && enhanceProductWithNZFCD(product),
    userCountry === 'AU' && enhanceProductWithAFCD(product),
  ]);
}
```

---

## Intelligent Data Merging Strategy

### Merging Priority (TruScore-First)

**Step 1: Select Base Product**
- Calculate TruScore completeness for each product
- Combine with source weight (60% completeness + 40% source weight)
- Select highest combined score as base

**Step 2: Merge TruScore-Critical Fields**
- **Body Pillar:**
  - Nutri-Score: Use highest priority source
  - NOVA: Use highest priority source
  - Additives: Union all additives_tags
  - Nutrition: Weighted average from all sources
  
- **Planet Pillar:**
  - Eco-Score: Use highest priority source
  - Palm Oil: Use most complete analysis
  - Packaging: Union all packagings
  
- **Care Pillar:**
  - Certifications: Union all labels_tags and certifications
  - Cruel Parent: Check brand database
  
- **Open Pillar:**
  - Ingredients: Use longest/most complete
  - Origins: Union all origins_tags
  - Manufacturing: Union all manufacturing_places_tags

**Step 3: Merge Supporting Fields**
- Product name: Use most complete
- Brand: Use most complete
- Image: Use highest quality
- Categories: Use most specific

### Merging Rules

```typescript
// TruScore-aware merging rules
const MERGING_RULES = {
  // Body Pillar
  nutriscore_grade: 'highest_priority', // Use Gold Standard if available
  nova_group: 'highest_priority',
  additives_tags: 'union', // Combine all additives
  nutriments: 'weighted_average', // Weight by source priority
  
  // Planet Pillar
  ecoscore_grade: 'highest_priority',
  palm_oil_analysis: 'most_complete', // Use most detailed analysis
  packagings: 'union', // Combine all packaging items
  
  // Care Pillar
  labels_tags: 'union', // Combine all certifications
  certifications: 'union',
  
  // Open Pillar
  ingredients_text: 'longest', // Use most complete ingredients list
  origins_tags: 'union',
  manufacturing_places_tags: 'union',
};
```

---

## Database Query Efficiency

### Current Issues
1. **Sequential Queries** - Some queries wait for others
2. **No Prioritization** - All databases queried equally
3. **Inefficient Merging** - Not optimized for TruScore
4. **Missing Queries** - Some databases not queried for location-specific users

### Optimized Strategy

**1. Parallel Querying**
- Query all databases simultaneously
- Don't wait for one to finish before starting another
- Use `Promise.allSettled()` for parallel execution

**2. Smart Prioritization**
- Query Gold Standard first (if location-specific)
- Query Open Facts in parallel
- Query enhancements in parallel
- Query fallbacks only if needed

**3. Early Termination**
- If Gold Standard returns complete data, skip lower tiers
- If Open Facts returns complete data, skip fallbacks
- Only query fallbacks if no results

**4. Caching Strategy**
- Cache merged products (not individual sources)
- Cache by barcode + country (location-specific)
- Cache TruScore completeness score

---

## Implementation: Enhanced Database Service

### New Structure

```typescript
// src/data/databases/enhancedProductDatabase.ts

export class EnhancedProductDatabase {
  /**
   * Query ALL relevant databases in parallel
   * Optimized for maximum TruScore data completeness
   */
  async queryAllDatabases(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const products: Product[] = [];
    
    // Phase 1: Gold Standard (parallel)
    const goldStandard = await this.queryGoldStandard(barcode, userCountry);
    products.push(...goldStandard);
    
    // Phase 2: Open Facts (parallel)
    const openFacts = await this.queryOpenFacts(barcode);
    products.push(...openFacts);
    
    // Phase 3: Enhancements (parallel)
    const enhancements = await this.queryEnhancements(barcode, userCountry);
    products.push(...enhancements);
    
    // Phase 4: Fallbacks (only if no results)
    if (products.length === 0) {
      const fallbacks = await this.queryFallbacks(barcode);
      products.push(...fallbacks);
    }
    
    return products;
  }
  
  /**
   * Query Gold Standard databases (location-specific)
   */
  private async queryGoldStandard(
    barcode: string,
    userCountry: string | null
  ): Promise<Product[]> {
    const queries: Promise<Product | null>[] = [];
    
    // Location-specific Gold Standard
    if (userCountry === 'AU') {
      queries.push(fetchProductFromFSANZ(barcode, 'AU'));
    }
    if (userCountry === 'NZ') {
      queries.push(fetchProductFromFSANZ(barcode, 'NZ'));
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
   * Query Open Facts databases (always parallel)
   */
  private async queryOpenFacts(barcode: string): Promise<Product[]> {
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
   * Query enhancement databases (location-specific)
   */
  private async queryEnhancements(
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
   * Query fallback databases (only if no results)
   */
  private async queryFallbacks(barcode: string): Promise<Product[]> {
    const queries = [
      fetchProductFromUPCitemdb(barcode),
      fetchProductFromEANSearch(barcode),
      fetchProductFromBarcodeSpider(barcode),
      fetchProductFromUPCDatabase(barcode),
      fetchProductFromBarcodeLookup(barcode),
      fetchProductFromEANData(barcode),
      fetchProductFromWebSearch(barcode), // Last resort
    ];
    
    const results = await Promise.allSettled(queries);
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => (r as PromiseFulfilledResult<Product>).value);
  }
}
```

---

## Enhanced Merging for TruScore

### TruScore-Aware Merger

```typescript
// src/data/repositories/truScoreOptimizedMerger.ts

export class TruScoreOptimizedMerger {
  /**
   * Merge products with TruScore completeness as primary factor
   */
  mergeForTruScore(products: Product[]): Product {
    if (products.length === 0) {
      throw new Error('Cannot merge empty product array');
    }
    
    if (products.length === 1) {
      return products[0];
    }
    
    // Calculate TruScore completeness for each product
    const scoredProducts = products.map(p => ({
      product: p,
      truScoreCompleteness: this.calculateTruScoreCompleteness(p),
      sourceWeight: this.getSourceWeight(p.source),
    }));
    
    // Sort by combined score: 60% TruScore completeness + 40% source weight
    const sorted = scoredProducts.sort((a, b) => {
      const scoreA = (a.truScoreCompleteness / 100) * 0.6 + a.sourceWeight * 0.4;
      const scoreB = (b.truScoreCompleteness / 100) * 0.6 + b.sourceWeight * 0.4;
      return scoreB - scoreA;
    });
    
    // Use highest score as base
    const base = sorted[0].product;
    const merged: Product = { ...base };
    
    // Merge TruScore-critical fields
    this.mergeTruScoreFields(merged, sorted.map(s => s.product));
    
    return merged;
  }
  
  /**
   * Calculate TruScore completeness (0-100)
   * Higher = more TruScore-critical fields present
   */
  private calculateTruScoreCompleteness(product: Product): number {
    let score = 0;
    
    // Body Pillar (25 points)
    if (product.nutriscore_grade) score += 15; // Critical
    if (product.nova_group) score += 5;
    if (product.nutriments && Object.keys(product.nutriments).length > 0) score += 3;
    if (product.additives_tags?.length) score += 2;
    
    // Planet Pillar (25 points)
    if (product.ecoscore_grade) score += 15; // Critical
    if (product.palm_oil_analysis) score += 5;
    if (product.packagings?.length) score += 5;
    
    // Care Pillar (25 points)
    if (product.labels_tags?.length) score += 15; // Critical
    if (product.certifications?.length) score += 10;
    
    // Open Pillar (25 points)
    if (product.ingredients_text && product.ingredients_text.length > 10) score += 20; // Critical
    if (product.origins_tags?.length) score += 5;
    
    return Math.min(100, score);
  }
  
  /**
   * Merge TruScore-critical fields intelligently
   */
  private mergeTruScoreFields(
    merged: Product,
    products: Product[]
  ): void {
    // Body Pillar
    // Nutri-Score: Use highest priority source
    if (!merged.nutriscore_grade) {
      merged.nutriscore_grade = products.find(p => p.nutriscore_grade)?.nutriscore_grade;
    }
    
    // NOVA: Use highest priority source
    if (!merged.nova_group) {
      merged.nova_group = products.find(p => p.nova_group)?.nova_group;
    }
    
    // Additives: Union all
    const allAdditives = products
      .map(p => p.additives_tags)
      .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
    if (allAdditives.length > 0) {
      const unique = new Set<string>();
      allAdditives.forEach(tags => tags.forEach(tag => unique.add(tag)));
      merged.additives_tags = Array.from(unique);
    }
    
    // Nutrition: Weighted average
    const allNutriments = products
      .map(p => p.nutriments)
      .filter((n): n is ProductNutriments => n !== undefined);
    if (allNutriments.length > 0) {
      merged.nutriments = this.mergeNutrimentsWeighted(allNutriments, products);
    }
    
    // Planet Pillar
    // Eco-Score: Use highest priority source
    if (!merged.ecoscore_grade) {
      merged.ecoscore_grade = products.find(p => p.ecoscore_grade)?.ecoscore_grade;
    }
    
    // Palm Oil: Use most complete analysis
    const palmOilAnalyses = products
      .map(p => p.palm_oil_analysis)
      .filter((a): a is NonNullable<Product['palm_oil_analysis']> => a !== undefined);
    if (palmOilAnalyses.length > 0) {
      // Use most detailed analysis
      merged.palm_oil_analysis = palmOilAnalyses.reduce((best, current) => {
        const bestScore = this.scorePalmOilAnalysis(best);
        const currentScore = this.scorePalmOilAnalysis(current);
        return currentScore > bestScore ? current : best;
      });
    }
    
    // Packaging: Union all
    const allPackagings = products
      .map(p => p.packagings)
      .filter((p): p is NonNullable<Product['packagings']> => Array.isArray(p) && p.length > 0);
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
    
    // Care Pillar
    // Certifications: Union all
    const allLabels = products
      .map(p => p.labels_tags)
      .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
    if (allLabels.length > 0) {
      const unique = new Set<string>();
      allLabels.forEach(tags => tags.forEach(tag => unique.add(tag)));
      merged.labels_tags = Array.from(unique);
    }
    
    // Open Pillar
    // Ingredients: Use longest/most complete
    const allIngredients = products
      .map(p => p.ingredients_text)
      .filter((i): i is string => !!i && i.length > 10);
    if (allIngredients.length > 0) {
      merged.ingredients_text = allIngredients.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      );
    }
    
    // Origins: Union all
    const allOrigins = products
      .map(p => p.origins_tags)
      .filter((tags): tags is string[] => Array.isArray(tags) && tags.length > 0);
    if (allOrigins.length > 0) {
      const unique = new Set<string>();
      allOrigins.forEach(tags => tags.forEach(tag => unique.add(tag)));
      merged.origins_tags = Array.from(unique);
    }
  }
}
```

---

## Location-Specific Database Mapping

### Complete Database Map by Country

```typescript
// src/data/databases/locationDatabaseMap.ts

export const LOCATION_DATABASE_MAP: Record<string, DatabaseConfig[]> = {
  'AU': [
    { database: 'fsanz_au', priority: 1, type: 'gold_standard' },
    { database: 'afcd', priority: 1, type: 'gold_standard' },
    { database: 'openfoodfacts_au', priority: 2, type: 'open_facts' },
    { database: 'au_retailers', priority: 3, type: 'store_api' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  'NZ': [
    { database: 'fsanz_nz', priority: 1, type: 'gold_standard' },
    { database: 'nzfcd', priority: 1, type: 'gold_standard' },
    { database: 'openfoodfacts_nz', priority: 2, type: 'open_facts' },
    { database: 'nz_stores', priority: 3, type: 'store_api' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  'US': [
    { database: 'usda_fooddata', priority: 1, type: 'gold_standard' },
    { database: 'openfoodfacts_us', priority: 2, type: 'open_facts' },
    { database: 'walmart_open', priority: 3, type: 'store_api' },
    { database: 'fda_recalls', priority: 2, type: 'recall' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  'CA': [
    { database: 'health_canada_cnf', priority: 1, type: 'gold_standard' },
    { database: 'openfoodfacts_ca', priority: 2, type: 'open_facts' },
    { database: 'cfia_recalls', priority: 2, type: 'recall' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  'GB': [
    { database: 'uk_fsa', priority: 1, type: 'gold_standard' },
    { database: 'tesco_labs', priority: 2, type: 'store_api' },
    { database: 'openfoodfacts_uk', priority: 3, type: 'open_facts' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  // EU countries
  'EU': [
    { database: 'efsa', priority: 1, type: 'gold_standard' },
    { database: 'rasff', priority: 2, type: 'recall' },
    { database: 'openfoodfacts_[country]', priority: 3, type: 'open_facts' },
    { database: 'openfoodfacts', priority: 4, type: 'open_facts' },
    { database: 'global', priority: 5, type: 'fallback' },
  ],
  
  // Default (other countries)
  'DEFAULT': [
    { database: 'gs1_datasource', priority: 1, type: 'gold_standard' },
    { database: 'openfoodfacts_[country]', priority: 2, type: 'open_facts' },
    { database: 'openfoodfacts', priority: 3, type: 'open_facts' },
    { database: 'global', priority: 4, type: 'fallback' },
  ],
};
```

---

## Query Optimization Strategy

### Parallel Query Execution

```typescript
// Execute all queries in parallel for maximum speed
async function queryAllDatabasesOptimized(
  barcode: string,
  userCountry: string | null
): Promise<Product[]> {
  const allQueries: Promise<Product | null>[] = [];
  
  // Get database map for user's country
  const databaseMap = LOCATION_DATABASE_MAP[userCountry || 'DEFAULT'] || 
                      LOCATION_DATABASE_MAP['DEFAULT'];
  
  // Execute all queries in parallel
  databaseMap.forEach(config => {
    const query = getDatabaseQuery(config.database, barcode, userCountry);
    if (query) {
      allQueries.push(query);
    }
  });
  
  // Wait for all queries (parallel execution)
  const results = await Promise.allSettled(allQueries);
  
  // Filter successful results
  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<Product>).value);
}
```

### Smart Query Prioritization

```typescript
// Query in priority order, but execute in parallel
// Stop early if we have complete data

async function queryWithEarlyTermination(
  barcode: string,
  userCountry: string | null
): Promise<Product[]> {
  const products: Product[] = [];
  
  // Phase 1: Gold Standard (highest priority)
  const goldStandard = await this.queryGoldStandard(barcode, userCountry);
  products.push(...goldStandard);
  
  // Check if we have complete TruScore data
  if (this.hasCompleteTruScoreData(products)) {
    return products; // Early termination
  }
  
  // Phase 2: Open Facts (high priority)
  const openFacts = await this.queryOpenFacts(barcode);
  products.push(...openFacts);
  
  // Check again
  if (this.hasCompleteTruScoreData(products)) {
    return products; // Early termination
  }
  
  // Phase 3: Enhancements (medium priority)
  const enhancements = await this.queryEnhancements(barcode, userCountry);
  products.push(...enhancements);
  
  // Phase 4: Fallbacks (only if still incomplete)
  if (!this.hasCompleteTruScoreData(products)) {
    const fallbacks = await this.queryFallbacks(barcode);
    products.push(...fallbacks);
  }
  
  return products;
}

/**
 * Check if we have complete TruScore data
 */
function hasCompleteTruScoreData(products: Product[]): boolean {
  if (products.length === 0) return false;
  
  // Check if any product has all critical TruScore fields
  return products.some(p => {
    const completeness = calculateTruScoreCompleteness(p);
    return completeness >= 80; // 80%+ completeness = sufficient
  });
}
```

---

## Data Quality Metrics

### TruScore Completeness Score

```typescript
/**
 * Calculate how complete product data is for TruScore calculation
 * Returns 0-100 score
 */
function calculateTruScoreCompleteness(product: Product): number {
  let score = 0;
  const maxScore = 100;
  
  // Body Pillar (25 points = 25% of total)
  if (product.nutriscore_grade) score += 15; // Critical
  else if (product.nutriments && Object.keys(product.nutriments).length > 5) score += 10;
  if (product.nova_group) score += 5;
  if (product.additives_tags?.length) score += 3;
  if (product.ingredients_analysis_tags?.length) score += 2;
  
  // Planet Pillar (25 points = 25% of total)
  if (product.ecoscore_grade) score += 15; // Critical
  if (product.palm_oil_analysis) score += 5;
  if (product.packagings?.length) score += 5;
  
  // Care Pillar (25 points = 25% of total)
  if (product.labels_tags?.length) score += 15; // Critical
  if (product.certifications?.length) score += 10;
  
  // Open Pillar (25 points = 25% of total)
  if (product.ingredients_text && product.ingredients_text.length > 20) score += 20; // Critical
  if (product.origins_tags?.length) score += 5;
  
  return Math.min(maxScore, score);
}
```

### Data Quality Thresholds

```typescript
const DATA_QUALITY_THRESHOLDS = {
  EXCELLENT: 80,  // 80%+ completeness - use as-is
  GOOD: 60,       // 60-79% - merge with other sources
  FAIR: 40,       // 40-59% - definitely merge
  POOR: 0,        // <40% - always merge or skip
};
```

---

## Implementation Plan

### Phase 1: Enhanced Database Service (Week 1)
1. Create `EnhancedProductDatabase` class
2. Implement parallel querying
3. Implement location-specific database mapping
4. Test query efficiency

### Phase 2: TruScore-Optimized Merger (Week 2)
1. Create `TruScoreOptimizedMerger` class
2. Implement TruScore completeness calculation
3. Implement intelligent field merging
4. Test merging accuracy

### Phase 3: Integration (Week 3)
1. Integrate with existing `productService.ts`
2. Update result page to use enhanced service
3. Test end-to-end TruScore accuracy
4. Performance optimization

---

## Success Metrics

### Data Quality
- **TruScore Completeness**: > 80% for 90% of products
- **Database Coverage**: Query 10+ databases per product
- **Location-Specific**: 100% of location-specific databases queried

### Performance
- **Query Time**: < 3 seconds for all databases
- **Parallel Efficiency**: 80%+ time savings vs sequential
- **Cache Hit Rate**: > 60% for repeat scans

### TruScore Accuracy
- **Data Completeness**: All 4 pillars have data for 90%+ products
- **Source Quality**: Gold Standard data used when available
- **Merging Quality**: Best data from each source combined

---

**This database strategy ensures TruScore receives the most accurate, complete, and reliable data possible! 🎯**


