# Geo-Location & Multi-Database Strategy for Rich TruScore

**Date:** January 2025  
**Purpose:** Comprehensive strategy for handling geo-location, multiple databases, and creating the most accurate, reliable, and consistent TruScore possible  
**Goal:** Maximize data richness by intelligently analyzing as many databases as possible

---

## Executive Summary

To create the most "rich" (accurate, reliable, consistent) TruScore, we need a sophisticated multi-dimensional geo-location and multi-database architecture that considers:

1. **User Location** - Where the user is scanning (determines regulatory context)
2. **Product Origin** - Where the product was manufactured (affects scoring)
3. **Regulatory Jurisdiction** - Which country's regulations apply (affects additive scoring, certifications)
4. **Data Source Priority** - Which databases to query and in what order
5. **Data Quality Scoring** - How to weight and merge data from multiple sources

**Key Principle:** The richest TruScore comes from intelligently merging the best available data from multiple sources, weighted by reliability, completeness, and geo-location relevance.

---

## Part 1: Multi-Dimensional Geo-Location Strategy

### 1.1 Three Dimensions of Geo-Location

#### Dimension 1: User Location (Regulatory Context)
**Purpose:** Determines which country's regulations apply to scoring

**Detection Methods:**
1. **Primary:** Device locale (`expo-localization`)
2. **Secondary:** IP geolocation (via API)
3. **Tertiary:** GPS coordinates (if permission granted)
4. **Fallback:** App settings (user can manually set country)

**Use Cases:**
- Determine which additive regulations to apply (FSANZ for AU/NZ, FDA for US, EFSA for EU)
- Select country-specific databases (USDA for US, Health Canada for CA)
- Show country-specific certifications (USDA Organic vs EU Organic)
- Display country-specific recall alerts (FDA for US, RASFF for EU)

#### Dimension 2: Product Origin (Manufacturing Location)
**Purpose:** Affects Planet pillar (transport impact) and Open pillar (transparency)

**Data Sources (Priority Order):**
1. `manufacturing_places_tags` (most accurate, rarely available)
2. `manufacturing_places` (accurate, rarely available)
3. `origins_tags` (accurate when available, often missing)
4. `origins` (accurate when available, often missing)
5. User-contributed data (with validation)
6. **DO NOT USE:** `countries_tags` (shows distribution, not manufacturing)

**Use Cases:**
- Calculate transport impact for Planet pillar
- Show manufacturing country transparency (Open pillar)
- Adjust scoring based on manufacturing country regulations

#### Dimension 3: Product Distribution (Sales Location)
**Purpose:** Determines which country-specific product databases to query

**Data Sources:**
- `countries_tags` (where product is sold)
- Country-specific OFF instances (us.openfoodfacts.org, etc.)
- Regional store APIs (Tesco UK, Walmart US)

**Use Cases:**
- Query country-specific OFF instances
- Query regional store databases
- Show local pricing (if available)

### 1.2 Geo-Location Configuration System

```typescript
interface GeoLocationConfig {
  // User's current location (regulatory context)
  userCountry: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'AU', 'NZ')
  userRegion?: string; // State/province if available
  
  // Product origin (manufacturing)
  productOrigin?: string; // Country where product was made
  
  // Product distribution (sales)
  productDistribution?: string[]; // Countries where product is sold
  
  // Regulatory jurisdiction (which regulations apply)
  regulatoryJurisdiction: string; // Usually same as userCountry, but can differ
}

class GeoLocationManager {
  /**
   * Get comprehensive geo-location configuration
   */
  async getConfig(): Promise<GeoLocationConfig> {
    const userCountry = await this.detectUserCountry();
    const productOrigin = await this.detectProductOrigin();
    const productDistribution = await this.detectProductDistribution();
    
    return {
      userCountry,
      productOrigin,
      productDistribution,
      regulatoryJurisdiction: userCountry, // Default: user's country
    };
  }
  
  /**
   * Detect user's country (multiple methods with fallback)
   */
  private async detectUserCountry(): Promise<string> {
    // Method 1: Device locale (fastest, most reliable)
    const deviceLocale = getUserCountryCode(); // From countryDetection.ts
    if (deviceLocale) return deviceLocale;
    
    // Method 2: IP geolocation (requires API call)
    try {
      const ipLocation = await this.getIPLocation();
      if (ipLocation) return ipLocation.countryCode;
    } catch (error) {
      console.warn('IP geolocation failed:', error);
    }
    
    // Method 3: GPS coordinates (if permission granted)
    try {
      const gpsLocation = await this.getGPSLocation();
      if (gpsLocation) return gpsLocation.countryCode;
    } catch (error) {
      console.warn('GPS geolocation failed:', error);
    }
    
    // Fallback: Default to 'US' or app settings
    return 'US'; // Or get from app settings
  }
}
```

---

## Part 2: Multi-Database Query Strategy

### 2.1 Database Priority Matrix

**Strategy:** Query multiple databases in parallel, then intelligently merge results based on:
1. **Source Reliability** - Government sources > Open sources > Commercial > Web scraping
2. **Geo-Location Relevance** - Country-specific > Regional > Global
3. **Data Completeness** - Complete data > Partial data > Minimal data
4. **Data Freshness** - Recent data > Stale data

#### Priority Matrix by User Country

| User Country | Priority 1 | Priority 2 | Priority 3 | Priority 4 | Priority 5 |
|--------------|-----------|------------|-----------|------------|------------|
| **US** | USDA FoodData | US OFF | Global OFF | UPCitemdb | EAN-Search |
| **CA** | Health Canada | CA OFF | Global OFF | USDA (fallback) | UPCitemdb |
| **AU** | FSANZ | AU OFF | Global OFF | NZ OFF | UPCitemdb |
| **NZ** | FSANZ | NZ OFF | Global OFF | AU OFF | UPCitemdb |
| **GB** | UK FSA | UK OFF | Global OFF | Tesco Labs | UPCitemdb |
| **EU** | EFSA | Country OFF | Global OFF | FoodRepo | UPCitemdb |
| **Other** | Country OFF | Global OFF | UPCitemdb | EAN-Search | Web Search |

### 2.2 Parallel Query Architecture

```typescript
interface DatabaseQueryConfig {
  userCountry: string;
  productOrigin?: string;
  barcode: string;
}

class MultiDatabaseQueryEngine {
  /**
   * Query all relevant databases in parallel
   */
  async queryAllDatabases(config: DatabaseQueryConfig): Promise<Product[]> {
    const { userCountry, productOrigin, barcode } = config;
    
    // Build query list based on user country and product origin
    const queries = this.buildQueryList(userCountry, productOrigin, barcode);
    
    // Execute all queries in parallel
    const results = await Promise.allSettled(
      queries.map(query => this.executeQuery(query))
    );
    
    // Filter successful results
    const products = results
      .filter((r): r is PromiseFulfilledResult<Product> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter((p): p is Product => p !== null);
    
    return products;
  }
  
  /**
   * Build prioritized query list
   */
  private buildQueryList(
    userCountry: string,
    productOrigin: string | undefined,
    barcode: string
  ): DatabaseQuery[] {
    const queries: DatabaseQuery[] = [];
    
    // Layer 1: Country-specific government databases (highest priority)
    if (userCountry === 'US') {
      queries.push({
        source: 'usda_fooddata',
        priority: 1,
        query: () => fetchProductFromUSDA(barcode),
      });
    }
    
    if (userCountry === 'CA') {
      queries.push({
        source: 'health_canada',
        priority: 1,
        query: () => fetchProductFromHealthCanada(barcode),
      });
    }
    
    if (userCountry === 'AU' || userCountry === 'NZ') {
      queries.push({
        source: 'fsanz',
        priority: 1,
        query: () => fetchProductFromFSANZ(barcode),
      });
    }
    
    // Layer 2: Country-specific OFF instances
    const countryOFFInstance = getOFFCountryInstance(userCountry);
    if (countryOFFInstance) {
      queries.push({
        source: 'openfoodfacts',
        priority: 2,
        query: () => fetchProductFromOFFInstance(barcode, countryOFFInstance),
      });
    }
    
    // Layer 3: Global OFF
    queries.push({
      source: 'openfoodfacts',
      priority: 3,
      query: () => fetchProductFromOFF(barcode),
    });
    
    // Layer 4: Regional store APIs
    if (userCountry === 'GB') {
      queries.push({
        source: 'tesco_labs',
        priority: 4,
        query: () => fetchProductFromTesco(barcode),
      });
    }
    
    if (userCountry === 'US') {
      queries.push({
        source: 'walmart_open',
        priority: 4,
        query: () => fetchProductFromWalmart(barcode),
      });
    }
    
    // Layer 5: Global fallback databases
    queries.push({
      source: 'upcitemdb',
      priority: 5,
      query: () => fetchProductFromUPCitemdb(barcode),
    });
    
    queries.push({
      source: 'ean_search',
      priority: 5,
      query: () => fetchProductFromEANSearch(barcode),
    });
    
    // Layer 6: Web search (last resort)
    queries.push({
      source: 'web_search',
      priority: 6,
      query: () => fetchProductFromWebSearch(barcode),
    });
    
    return queries;
  }
}
```

---

## Part 3: Data Quality & Richness Scoring

### 3.1 Data Richness Metrics

**Richness = Accuracy × Reliability × Completeness × Geo-Relevance**

#### Accuracy Score (0-100)
- **Government sources:** 95-100 (official data)
- **Open Facts databases:** 80-90 (community-verified)
- **Commercial APIs:** 70-85 (verified but may have errors)
- **Web scraping:** 50-70 (unverified, may be inaccurate)

#### Reliability Score (0-100)
- **Source reputation:** Based on historical accuracy
- **Data freshness:** Recent data > stale data
- **Verification status:** Verified > Unverified
- **Multiple confirmations:** Data confirmed by multiple sources

#### Completeness Score (0-100)
- **Nutrition data:** 0-25 points
- **Ingredients:** 0-25 points
- **Certifications:** 0-15 points
- **Sustainability data:** 0-15 points
- **Brand information:** 0-10 points
- **Images:** 0-10 points

#### Geo-Relevance Score (0-100)
- **Country-specific match:** 100 (user country = data country)
- **Regional match:** 75 (same region, different country)
- **Global data:** 50 (no geo-specificity)
- **Wrong region:** 25 (different region entirely)

### 3.2 Richness Calculation

```typescript
interface DataRichnessScore {
  accuracy: number; // 0-100
  reliability: number; // 0-100
  completeness: number; // 0-100
  geoRelevance: number; // 0-100
  overall: number; // Weighted average
}

class DataRichnessCalculator {
  /**
   * Calculate overall richness score
   */
  calculateRichness(
    product: Product,
    userCountry: string,
    source: string
  ): DataRichnessScore {
    const accuracy = this.calculateAccuracy(source);
    const reliability = this.calculateReliability(product, source);
    const completeness = this.calculateCompleteness(product);
    const geoRelevance = this.calculateGeoRelevance(product, userCountry);
    
    // Weighted average (accuracy and reliability most important)
    const overall = (
      accuracy * 0.30 +
      reliability * 0.30 +
      completeness * 0.25 +
      geoRelevance * 0.15
    );
    
    return {
      accuracy,
      reliability,
      completeness,
      geoRelevance,
      overall: Math.round(overall),
    };
  }
  
  /**
   * Calculate accuracy based on source
   */
  private calculateAccuracy(source: string): number {
    const accuracyMap: Record<string, number> = {
      // Government sources
      'usda_fooddata': 98,
      'health_canada': 98,
      'fsanz': 98,
      'gs1_datasource': 95,
      
      // Open Facts databases
      'openfoodfacts': 85,
      'openbeautyfacts': 85,
      'openpetfoodfacts': 85,
      'openproductsfacts': 80,
      
      // Commercial APIs
      'nutritionix': 80,
      'upcitemdb': 75,
      'ean_search': 70,
      
      // Web scraping
      'web_search': 60,
    };
    
    return accuracyMap[source] || 50;
  }
  
  /**
   * Calculate reliability based on data freshness and verification
   */
  private calculateReliability(product: Product, source: string): number {
    let score = 80; // Base reliability
    
    // Check data freshness (if available)
    if (product.last_modified) {
      const daysSinceUpdate = (Date.now() - new Date(product.last_modified).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) score += 10; // Recent data
      else if (daysSinceUpdate < 90) score += 5; // Moderately recent
      else if (daysSinceUpdate > 365) score -= 10; // Stale data
    }
    
    // Check verification status
    if (product.data_quality_tags?.includes('en:complete')) score += 10;
    if (product.data_quality_tags?.includes('en:verified')) score += 10;
    
    // Government sources are more reliable
    if (source.includes('usda') || source.includes('health_canada') || source.includes('fsanz')) {
      score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calculate completeness based on available fields
   */
  private calculateCompleteness(product: Product): number {
    let score = 0;
    
    // Nutrition data (0-25 points)
    if (product.nutriments) {
      const nutrientCount = Object.keys(product.nutriments).length;
      score += Math.min(25, nutrientCount * 2);
    }
    
    // Ingredients (0-25 points)
    if (product.ingredients_text && product.ingredients_text.length > 10) {
      score += 25;
    } else if (product.ingredients && product.ingredients.length > 0) {
      score += 20;
    }
    
    // Certifications (0-15 points)
    if (product.certifications && product.certifications.length > 0) {
      score += Math.min(15, product.certifications.length * 3);
    }
    
    // Sustainability data (0-15 points)
    if (product.ecoscore_data) score += 10;
    if (product.packaging_data) score += 5;
    
    // Brand information (0-10 points)
    if (product.brands) score += 5;
    if (product.brand_owner) score += 5;
    
    // Images (0-10 points)
    if (product.image_url) score += 10;
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate geo-relevance based on user country and product data
   */
  private calculateGeoRelevance(product: Product, userCountry: string): number {
    // Check if product has country-specific data
    const productCountries = product.countries_tags || [];
    const userCountryTag = `en:${userCountry.toLowerCase()}`;
    
    if (productCountries.includes(userCountryTag)) {
      return 100; // Perfect match
    }
    
    // Check if product is from same region
    const regions = this.getRegions();
    const userRegion = regions[userCountry];
    const productRegion = this.getProductRegion(product);
    
    if (userRegion === productRegion) {
      return 75; // Regional match
    }
    
    // Global data (no specific country)
    if (productCountries.length === 0) {
      return 50; // Neutral
    }
    
    // Different region
    return 25;
  }
  
  private getRegions(): Record<string, string> {
    return {
      'US': 'north_america',
      'CA': 'north_america',
      'MX': 'north_america',
      'AU': 'oceania',
      'NZ': 'oceania',
      'GB': 'europe',
      'FR': 'europe',
      'DE': 'europe',
      // ... more mappings
    };
  }
  
  private getProductRegion(product: Product): string | null {
    const countries = product.countries_tags || [];
    if (countries.length === 0) return null;
    
    const firstCountry = countries[0].replace('en:', '').toUpperCase();
    const regions = this.getRegions();
    return regions[firstCountry] || null;
  }
}
```

---

## Part 4: Intelligent Data Merging Strategy

### 4.1 Multi-Source Merging Algorithm

**Goal:** Create the richest possible product data by intelligently combining data from multiple sources.

**Strategy:**
1. **Weight by Richness** - Higher richness scores get more weight
2. **Fill Gaps** - Use data from lower-priority sources to fill gaps in higher-priority sources
3. **Resolve Conflicts** - Higher-priority sources win conflicts
4. **Preserve Best Data** - Keep the best version of each field

```typescript
class IntelligentDataMerger {
  /**
   * Merge multiple products into richest possible result
   */
  mergeProducts(
    products: Product[],
    userCountry: string
  ): Product {
    if (products.length === 0) {
      throw new Error('Cannot merge empty product array');
    }
    
    if (products.length === 1) {
      return products[0];
    }
    
    // Calculate richness scores for all products
    const richnessCalculator = new DataRichnessCalculator();
    const productsWithRichness = products.map(p => ({
      product: p,
      richness: richnessCalculator.calculateRichness(p, userCountry, p.source || 'unknown'),
    }));
    
    // Sort by overall richness (highest first)
    productsWithRichness.sort((a, b) => b.richness.overall - a.richness.overall);
    
    // Use highest-richness product as base
    const baseProduct = productsWithRichness[0].product;
    const merged: Product = { ...baseProduct };
    
    // Merge fields intelligently
    this.mergeField(merged, productsWithRichness, 'product_name', 'string', 'longest');
    this.mergeField(merged, productsWithRichness, 'brands', 'string', 'best');
    this.mergeField(merged, productsWithRichness, 'image_url', 'string', 'best');
    this.mergeNutriments(merged, productsWithRichness);
    this.mergeIngredients(merged, productsWithRichness);
    this.mergeCertifications(merged, productsWithRichness);
    this.mergeSustainability(merged, productsWithRichness);
    
    // Set source to highest-richness source
    merged.source = baseProduct.source;
    
    // Calculate merged richness score
    merged.richness_score = this.calculateMergedRichness(productsWithRichness);
    
    return merged;
  }
  
  /**
   * Merge a simple field (string, number, etc.)
   */
  private mergeField(
    merged: Product,
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>,
    field: keyof Product,
    type: 'string' | 'number',
    strategy: 'best' | 'longest' | 'highest'
  ): void {
    const values = productsWithRichness
      .map(p => p.product[field])
      .filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) return;
    
    if (strategy === 'best') {
      // Use value from highest-richness product
      merged[field] = productsWithRichness[0].product[field];
    } else if (strategy === 'longest' && type === 'string') {
      // Use longest string (most complete)
      merged[field] = values.reduce((longest, current) => 
        String(current).length > String(longest).length ? current : longest
      ) as any;
    } else if (strategy === 'highest' && type === 'number') {
      // Use highest number
      merged[field] = values.reduce((highest, current) => 
        Number(current) > Number(highest) ? current : highest
      ) as any;
    }
  }
  
  /**
   * Merge nutrition data (weighted average by richness)
   */
  private mergeNutriments(
    merged: Product,
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>
  ): void {
    const allNutriments = productsWithRichness
      .map(p => p.product.nutriments)
      .filter((n): n is ProductNutriments => n !== undefined);
    
    if (allNutriments.length === 0) return;
    
    // Calculate weights based on richness
    const weights = productsWithRichness
      .map(p => p.richness.overall / 100)
      .filter((_, i) => productsWithRichness[i].product.nutriments !== undefined);
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    // Merge with weighted average
    merged.nutriments = this.mergeNutrimentsWeighted(allNutriments, normalizedWeights);
  }
  
  /**
   * Merge ingredients (use most complete)
   */
  private mergeIngredients(
    merged: Product,
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>
  ): void {
    const ingredientsList = productsWithRichness
      .map(p => p.product.ingredients_text)
      .filter((i): i is string => !!i && i.length > 0);
    
    if (ingredientsList.length === 0) return;
    
    // Use longest ingredients list (most complete)
    merged.ingredients_text = ingredientsList.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  /**
   * Merge certifications (union, prioritize by richness)
   */
  private mergeCertifications(
    merged: Product,
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>
  ): void {
    const certificationMap = new Map<string, Certification>();
    
    // Process in order of richness (highest first)
    productsWithRichness.forEach(({ product }) => {
      if (product.certifications && Array.isArray(product.certifications)) {
        product.certifications.forEach(cert => {
          const key = cert.tag || cert.id || cert.name || '';
          if (key && !certificationMap.has(key)) {
            certificationMap.set(key, cert);
          }
        });
      }
    });
    
    if (certificationMap.size > 0) {
      merged.certifications = Array.from(certificationMap.values());
    }
  }
  
  /**
   * Merge sustainability data (use best available)
   */
  private mergeSustainability(
    merged: Product,
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>
  ): void {
    // Find best ecoscore_data
    const bestEcoScore = productsWithRichness
      .map(p => p.product.ecoscore_data)
      .filter((e): e is NonNullable<Product['ecoscore_data']> => e !== undefined)
      .sort((a, b) => {
        // Prefer complete ecoscore with grade and score
        const aComplete = a.grade && a.score ? 1 : 0;
        const bComplete = b.grade && b.score ? 1 : 0;
        return bComplete - aComplete;
      })[0];
    
    if (bestEcoScore) {
      merged.ecoscore_data = bestEcoScore;
    }
    
    // Find best packaging_data
    const bestPackaging = productsWithRichness
      .map(p => p.product.packaging_data)
      .filter((p): p is NonNullable<Product['packaging_data']> => p !== undefined)
      .sort((a, b) => {
        // Prefer more complete packaging data
        const aComplete = (a.items?.length || 0) + (a.isRecyclable ? 1 : 0);
        const bComplete = (b.items?.length || 0) + (b.isRecyclable ? 1 : 0);
        return bComplete - aComplete;
      })[0];
    
    if (bestPackaging) {
      merged.packaging_data = bestPackaging;
    }
  }
  
  /**
   * Calculate merged richness score
   */
  private calculateMergedRichness(
    productsWithRichness: Array<{ product: Product; richness: DataRichnessScore }>
  ): number {
    // Merged product should have higher richness than any single source
    const maxRichness = Math.max(...productsWithRichness.map(p => p.richness.overall));
    const avgRichness = productsWithRichness.reduce((sum, p) => sum + p.richness.overall, 0) / productsWithRichness.length;
    
    // Merged richness = max + bonus for multiple sources
    const sourceBonus = Math.min(10, productsWithRichness.length * 2);
    return Math.min(100, maxRichness + sourceBonus);
  }
}
```

---

## Part 5: Geo-Location Aware Scoring Engine

### 5.1 Country-Specific Scoring Adjustments

**Principle:** TruScore should reflect the regulatory context of the user's location.

```typescript
class GeoLocationAwareScoringEngine {
  /**
   * Calculate TruScore with geo-location awareness
   */
  calculateTruScore(
    product: Product,
    userCountry: string,
    productOrigin?: string
  ): TruScoreResult {
    // Get country-specific configuration
    const config = this.getCountryConfig(userCountry);
    
    // Calculate base scores for each pillar
    const bodyScore = this.calculateBodyScore(product, config);
    const planetScore = this.calculatePlanetScore(product, config, productOrigin);
    const careScore = this.calculateCareScore(product, config);
    const openScore = this.calculateOpenScore(product, config, productOrigin);
    
    return {
      truscore: bodyScore + planetScore + careScore + openScore,
      breakdown: {
        Body: bodyScore,
        Planet: planetScore,
        Care: careScore,
        Open: openScore,
      },
      adjustedFor: userCountry,
      dataRichness: product.richness_score || 0,
    };
  }
  
  /**
   * Get country-specific configuration
   */
  private getCountryConfig(countryCode: string): CountryScoringConfig {
    const configs: Record<string, CountryScoringConfig> = {
      'US': {
        additiveRegulations: FDA_ADDITIVE_DB,
        allergenRegulations: FDA_ALLERGEN_DB,
        nutritionDatabase: 'usda',
        recallService: 'fda',
        certifications: ['usda_organic', 'non_gmo_project'],
      },
      'CA': {
        additiveRegulations: HEALTH_CANADA_ADDITIVE_DB,
        allergenRegulations: CFIA_ALLERGEN_DB,
        nutritionDatabase: 'health_canada',
        recallService: 'cfia',
        certifications: ['canada_organic', 'non_gmo_project'],
      },
      'AU': {
        additiveRegulations: FSANZ_ADDITIVE_DB,
        allergenRegulations: FSANZ_ALLERGEN_DB,
        nutritionDatabase: 'fsanz',
        recallService: 'fsanz',
        certifications: ['australia_organic', 'australia_made'],
      },
      'NZ': {
        additiveRegulations: FSANZ_ADDITIVE_DB,
        allergenRegulations: FSANZ_ALLERGEN_DB,
        nutritionDatabase: 'fsanz',
        recallService: 'fsanz',
        certifications: ['new_zealand_organic', 'new_zealand_made'],
      },
      'GB': {
        additiveRegulations: FSA_ADDITIVE_DB,
        allergenRegulations: FSA_ALLERGEN_DB,
        nutritionDatabase: 'uk_fsa',
        recallService: 'fsa',
        certifications: ['eu_organic', 'red_tractor'],
      },
      // ... more countries
    };
    
    return configs[countryCode] || DEFAULT_CONFIG;
  }
  
  /**
   * Calculate Body pillar with country-specific adjustments
   */
  private calculateBodyScore(
    product: Product,
    config: CountryScoringConfig
  ): number {
    // Base score from truscoreEngine.ts
    let score = this.calculateBaseBodyScore(product);
    
    // Apply country-specific additive penalties
    if (product.additives_tags && config.additiveRegulations) {
      const countrySpecificPenalties = this.calculateCountrySpecificAdditivePenalties(
        product.additives_tags,
        config.additiveRegulations
      );
      score += countrySpecificPenalties;
    }
    
    // Apply country-specific allergen warnings
    if (product.allergens_tags && config.allergenRegulations) {
      const allergenPenalties = this.calculateAllergenPenalties(
        product.allergens_tags,
        config.allergenRegulations
      );
      score += allergenPenalties;
    }
    
    return Math.max(0, Math.min(25, Math.round(score)));
  }
  
  /**
   * Calculate Planet pillar with transport impact
   */
  private calculatePlanetScore(
    product: Product,
    config: CountryScoringConfig,
    productOrigin?: string
  ): number {
    // Base score from truscoreEngine.ts
    let score = this.calculateBasePlanetScore(product);
    
    // Add transport impact if we know product origin
    if (productOrigin && config.userCountry) {
      const transportImpact = this.calculateTransportImpact(
        productOrigin,
        config.userCountry
      );
      score += transportImpact;
    }
    
    return Math.max(0, Math.min(25, Math.round(score)));
  }
  
  /**
   * Calculate Care pillar with country-specific certifications
   */
  private calculateCareScore(
    product: Product,
    config: CountryScoringConfig
  ): number {
    // Base score from truscoreEngine.ts
    let score = this.calculateBaseCareScore(product);
    
    // Apply country-specific certification bonuses
    if (product.certifications && config.certifications) {
      const countryCertBonuses = this.calculateCountryCertificationBonuses(
        product.certifications,
        config.certifications
      );
      score += countryCertBonuses;
    }
    
    return Math.max(0, Math.min(25, Math.round(score)));
  }
  
  /**
   * Calculate Open pillar with manufacturing transparency
   */
  private calculateOpenScore(
    product: Product,
    config: CountryScoringConfig,
    productOrigin?: string
  ): number {
    // Base score from truscoreEngine.ts
    let score = this.calculateBaseOpenScore(product);
    
    // Bonus for manufacturing country transparency
    if (productOrigin) {
      score += 5; // Bonus for knowing manufacturing country
    }
    
    return Math.max(0, Math.min(25, Math.round(score)));
  }
}
```

---

## Part 6: Implementation Architecture

### 6.1 Complete Flow

```
1. User scans barcode
   ↓
2. Detect user country (device locale, IP, GPS, settings)
   ↓
3. Query multiple databases in parallel:
   - Country-specific government DB (USDA, Health Canada, FSANZ)
   - Country-specific OFF instance
   - Global OFF
   - Regional store APIs
   - Global fallback databases
   ↓
4. Calculate richness scores for all results
   ↓
5. Merge products intelligently (weighted by richness)
   ↓
6. Detect product origin (manufacturing country)
   ↓
7. Get country-specific scoring configuration
   ↓
8. Calculate TruScore with geo-location awareness
   ↓
9. Display rich TruScore with data source attribution
```

### 6.2 Key Components

1. **GeoLocationManager** - Detects and manages user/product geo-location
2. **MultiDatabaseQueryEngine** - Queries multiple databases in parallel
3. **DataRichnessCalculator** - Calculates richness scores
4. **IntelligentDataMerger** - Merges products intelligently
5. **GeoLocationAwareScoringEngine** - Calculates geo-aware TruScore

---

## Part 7: Best Practices for Rich TruScore

### 7.1 Data Source Selection

1. **Always query country-specific sources first** - Highest geo-relevance
2. **Query in parallel** - Faster response times
3. **Use government sources when available** - Highest accuracy
4. **Fill gaps from multiple sources** - Maximum completeness
5. **Resolve conflicts intelligently** - Higher-priority sources win

### 7.2 Data Quality Assurance

1. **Calculate richness for all sources** - Know data quality
2. **Weight by richness** - Better data gets more influence
3. **Validate data consistency** - Flag inconsistencies
4. **Track data freshness** - Prefer recent data
5. **Show data source attribution** - Transparency builds trust

### 7.3 User Experience

1. **Show "TruScore adjusted for [Country]"** - User knows it's geo-aware
2. **Display data richness indicator** - User knows data quality
3. **Show data sources** - Transparency
4. **Explain scoring adjustments** - User understands why
5. **Allow manual country override** - User control

---

## Part 8: Expected Outcomes

### 8.1 Data Richness Improvements

**Before:**
- Single source (OFF only)
- No geo-location awareness
- Limited data completeness
- No data quality scoring

**After:**
- Multiple sources merged intelligently
- Full geo-location awareness
- Maximum data completeness
- Richness scoring for all data

### 8.2 TruScore Accuracy Improvements

**Before:**
- Generic scoring (same for all countries)
- Limited data → lower accuracy
- No country-specific regulations

**After:**
- Country-specific scoring
- Rich data → higher accuracy
- Full regulatory compliance

### 8.3 User Trust Improvements

**Before:**
- Unknown data quality
- No transparency
- Generic results

**After:**
- Richness scores visible
- Full source attribution
- Geo-aware, personalized results

---

## Conclusion

The richest TruScore comes from:

1. **Multi-dimensional geo-location** - User location, product origin, regulatory jurisdiction
2. **Intelligent multi-database querying** - Parallel queries, prioritized by relevance
3. **Data richness scoring** - Accuracy, reliability, completeness, geo-relevance
4. **Intelligent merging** - Weighted combination of best available data
5. **Geo-location aware scoring** - Country-specific regulations and adjustments

**Result:** The most accurate, reliable, and consistent TruScore possible, personalized for each user's location and regulatory context.

---

**End of Strategy Document**
