# Complete Restoration Implementation Plan
## All 5 Phases - Methodical Implementation

**Date:** January 2025  
**Goal:** Restore all missing development work from previous conversations  
**Target:** Production-ready app with full feature set  
**Estimated Time:** 18-24 hours  
**Status:** In Progress

---

## 📋 Implementation Strategy

### Approach
1. **Phase-by-phase implementation** - Complete each phase fully before moving to next
2. **Test after each phase** - Verify functionality before proceeding
3. **Incremental commits** - Commit after each phase completion
4. **Documentation** - Document any changes or adaptations

### Quality Standards
- ✅ All TypeScript errors resolved
- ✅ All imports/exports correct
- ✅ All integrations tested
- ✅ Code follows existing patterns
- ✅ Proper error handling
- ✅ Logging included

---

## 🎯 Phase 1: FSANZ & AU Retailer Integration
**Priority:** HIGHEST  
**Impact:** +25-30% recognition for NZ/AU users  
**Estimated Time:** 4-6 hours  
**Status:** Pending

### Tasks

#### 1.1 Create FSANZ Database Service
**File:** `src/services/fsanDatabase.ts`
**Time:** 1-1.5 hours

**Requirements:**
- Local database query functions
- AU and NZ FSANZ integration
- AsyncStorage caching support
- Barcode variant matching
- Error handling and logging
- TypeScript types

**Key Functions:**
- `fetchProductFromFSANZ(barcode: string, country: 'AU' | 'NZ'): Promise<Product | null>`
- `queryFSANZLocalDatabase(barcode: string, country: 'AU' | 'NZ'): Promise<Product | null>`
- `getFSANZDatabaseStatus(country: 'AU' | 'NZ'): Promise<{ exists: boolean; productCount?: number }>`

**Dependencies:**
- `@react-native-async-storage/async-storage`
- `../types/product`
- `../utils/logger`
- `../utils/barcodeNormalization`

---

#### 1.2 Create AU Retailer Scraping Service
**File:** `src/services/auRetailerScraping.ts`
**Time:** 1-1.5 hours

**Requirements:**
- Woolworths AU integration
- Coles integration
- IGA Australia integration
- Parallel querying of all 3 retailers
- Error handling per retailer
- Timeout handling
- Product data normalization

**Key Functions:**
- `fetchProductFromAURetailers(barcode: string): Promise<Product | null>`
- `fetchFromWoolworthsAU(barcode: string): Promise<Product | null>`
- `fetchFromColes(barcode: string): Promise<Product | null>`
- `fetchFromIGA(barcode: string): Promise<Product | null>`

**Dependencies:**
- `../types/product`
- `../utils/logger`
- `../utils/timeoutHelper`
- `../utils/barcodeNormalization`

---

#### 1.3 Create FSANZ Auto-Update Service
**File:** `src/services/fsanDatabaseAutoUpdate.ts`
**Time:** 1 hour

**Requirements:**
- Periodic update checks (every 7 days = 10080 minutes)
- Automatic download when updates available
- Background update system
- Update status tracking
- Error handling

**Key Functions:**
- `initializeFSANZAutoUpdate(): Promise<void>`
- `checkForFSANZUpdates(): Promise<{ hasUpdate: boolean; updateUrl?: string }>`
- `downloadFSANZUpdate(url: string, country: 'AU' | 'NZ'): Promise<void>`

**Dependencies:**
- `@react-native-async-storage/async-storage`
- `expo-file-system`
- `../utils/logger`

---

#### 1.4 Update Product Service Integration
**File:** `src/services/productService.ts`
**Time:** 30 minutes

**Changes:**
- Add imports for FSANZ and AU retailer services
- Add FSANZ query in fallback chain (after NZ store APIs, before official sources)
- Add AU retailer query in fallback chain (after NZ store APIs, before FSANZ)
- Add country detection logic
- Update documentation

**Integration Points:**
- After `fetchProductFromNZStores()` call
- Before `fetchProductFromUSDA()` call
- Use `getUserCountryCode()` for country detection

---

#### 1.5 Update Product Types
**File:** `src/types/product.ts`
**Time:** 15 minutes

**Changes:**
- Add `'fsanz_au'` to Product source type union
- Add `'fsanz_nz'` to Product source type union
- Add `'iga_au'` to Product source type union
- Ensure all source types are properly typed

---

#### 1.6 Testing Phase 1
**Time:** 30 minutes

**Test Cases:**
- Test FSANZ query with NZ barcode
- Test FSANZ query with AU barcode
- Test AU retailer query with AU barcode
- Test fallback chain order
- Test error handling
- Verify TypeScript compilation

**Success Criteria:**
- ✅ No TypeScript errors
- ✅ All imports resolve
- ✅ Services can be called
- ✅ Products returned correctly
- ✅ Logging works

---

## 🎯 Phase 2: Confidence Scoring System
**Priority:** HIGH  
**Impact:** Transparent data quality, user trust  
**Estimated Time:** 2-3 hours  
**Status:** Pending

### Tasks

#### 2.1 Create Confidence Scoring Utility
**File:** `src/utils/confidenceScoring.ts`
**Time:** 45 minutes

**Requirements:**
- Source reliability mapping (high/medium/low)
- Confidence score calculation (0-1)
- `applyConfidenceScore()` function
- `getSourceConfidence()` function
- Source-to-reliability mapping

**Key Functions:**
- `getSourceConfidence(source: Product['source']): { confidence: number; reliability: 'high' | 'medium' | 'low' }`
- `applyConfidenceScore(product: Product): Product`

**Source Reliability Mapping:**
- High (0.8-1.0): `fsanz_au`, `fsanz_nz`, `usda_fooddata`, `gs1_datasource`, `openfoodfacts`
- Medium (0.5-0.7): `woolworths_au`, `coles_au`, `iga_au`, `woolworths_nz`, `paknsave`, `newworld`
- Low (0.3-0.5): `open_gtin`, `barcode_monster`, `upcitemdb`, `barcode_spider`, `web_search`

---

#### 2.2 Create Confidence Badge Component
**File:** `src/components/ConfidenceBadge.tsx`
**Time:** 1 hour

**Requirements:**
- Visual confidence badge
- High/Medium/Low reliability display
- User-friendly labels (not code-like)
- Small and large sizes
- Theme support
- i18n support

**Props:**
- `product: Product` - Product with confidence data
- `size?: 'small' | 'large'` - Badge size
- `showLabel?: boolean` - Show text label

**Display:**
- High: Green badge, "High confidence" or "Reliable data"
- Medium: Yellow badge, "Medium confidence" or "Moderate data"
- Low: Orange badge, "Low confidence" or "Limited data"

---

#### 2.3 Update Product Types with Confidence
**File:** `src/types/product.ts`
**Time:** 15 minutes

**Changes:**
- Add `confidence?: number;` (0-1 score)
- Add `sourceReliability?: 'high' | 'medium' | 'low';`
- Update Product interface

---

#### 2.4 Integrate Confidence Scoring in Product Service
**File:** `src/services/productService.ts`
**Time:** 30 minutes

**Changes:**
- Import `applyConfidenceScore` from confidenceScoring
- Apply confidence to cached products
- Apply confidence to fallback products
- Apply confidence before trust score calculation
- Ensure all returned products have confidence scores

**Integration Points:**
- After retrieving from cache
- After fetching from APIs
- Before calculating trust score
- Before returning product

---

#### 2.5 Integrate Confidence Badge in Result Page
**File:** `app/result/[barcode].tsx`
**Time:** 30 minutes

**Changes:**
- Import ConfidenceBadge component
- Display badge in TruScore card
- Add confidence explanation to TruScore info modal
- Ensure proper styling and positioning

**Display Location:**
- Inside TruScore card, below score
- Or as small badge next to score
- Include in info modal explanation

---

#### 2.6 Testing Phase 2
**Time:** 30 minutes

**Test Cases:**
- Test confidence scoring for different sources
- Test confidence badge display
- Test badge in TruScore card
- Test info modal explanation
- Verify translations work
- Test with products from different sources

**Success Criteria:**
- ✅ Confidence scores calculated correctly
- ✅ Badge displays correctly
- ✅ Badge in TruScore card
- ✅ Info modal includes explanation
- ✅ No TypeScript errors

---

## 🎯 Phase 3: FSANZ Import System
**Priority:** MEDIUM  
**Impact:** Enables 95%+ recognition with imported databases  
**Estimated Time:** 3-4 hours  
**Status:** Pending

### Tasks

#### 3.1 Create FSANZ Import Script
**File:** `scripts/importFSANZDatabase.js`
**Time:** 1 hour

**Requirements:**
- Convert Excel/CSV exports to JSON
- Field mapping automation
- Support both AU and NZ databases
- Error handling and validation
- Command-line interface

**Usage:**
```bash
npm run import-fsanz -- --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU
npm run import-fsanz -- --input downloads/fsanz-nz-export.xlsx --output data/fsanz-nz.json --country NZ
```

**Dependencies:**
- `xlsx` package
- `fs` (Node.js)
- `path` (Node.js)

---

#### 3.2 Enhance FSANZ Import Service
**File:** `src/services/fsanDatabaseImport.ts`
**Time:** 1 hour

**Requirements:**
- Import from file or JSON string
- Metadata tracking (product count, import date, size)
- Database status checking
- Clear/update functionality
- Progress tracking
- Error handling

**Key Functions:**
- `importFSANZDatabaseFromFile(fileUri: string, country: 'AU' | 'NZ'): Promise<{ success: boolean; productCount: number }>`
- `importFSANZDatabaseFromJSON(jsonData: string, country: 'AU' | 'NZ'): Promise<{ success: boolean; productCount: number }>`
- `getFSANZImportStatus(country: 'AU' | 'NZ'): Promise<{ imported: boolean; productCount?: number; importDate?: Date }>`
- `clearFSANZDatabase(country: 'AU' | 'NZ'): Promise<void>`

**Note:** Enhance existing `fsanDatabaseImporter.ts` or create new service

---

#### 3.3 Create FSANZ Import Modal Component
**File:** `src/components/FSANZDatabaseImportModal.tsx`
**Time:** 1.5 hours

**Requirements:**
- File picker integration (expo-document-picker)
- Progress display
- Status management
- Import from JSON files
- Error display
- Success confirmation
- Theme support

**Props:**
- `visible: boolean`
- `onClose: () => void`

**Features:**
- File selection button
- Progress indicator
- Status messages
- Error handling
- Success confirmation
- Instructions display

---

#### 3.4 Integrate FSANZ Import in Settings
**File:** `app/settings.tsx`
**Time:** 30 minutes

**Changes:**
- Import FSANZDatabaseImportModal
- Add "FSANZ Database Import" option in Data section
- Add modal state management
- Add import status display
- Add instructions link

**UI Location:**
- Settings → Data section
- After "Clear Cache" option
- Icon: `cloud-download-outline`

---

#### 3.5 Update Package.json
**File:** `package.json`
**Time:** 15 minutes

**Changes:**
- Add `"import-fsanz": "node scripts/importFSANZDatabase.js"` script
- Ensure `xlsx` dependency is listed
- Install if missing: `npm install xlsx --save`

---

#### 3.6 Testing Phase 3
**Time:** 30 minutes

**Test Cases:**
- Test import script with sample data
- Test import service with JSON file
- Test modal file picker
- Test import workflow end-to-end
- Test error handling
- Test status display

**Success Criteria:**
- ✅ Import script works
- ✅ Import service works
- ✅ Modal displays correctly
- ✅ Settings integration works
- ✅ Import workflow complete
- ✅ No TypeScript errors

---

## 🎯 Phase 4: Data Merging & Rate Limiting
**Priority:** MEDIUM  
**Impact:** Better data quality, prevents API bans  
**Estimated Time:** 4-6 hours  
**Status:** Pending

### Tasks

#### 4.1 Create Product Data Merger Service
**File:** `src/services/productDataMerger.ts`
**Time:** 2-3 hours

**Requirements:**
- Source weight mapping (government DBs = 40%, OFF = 40%, etc.)
- Ethics-specific weights (40% OFF, 30% Buycott, 30% custom)
- Nutrition merging (weighted averages)
- Certification merging (union with priority)
- Schema normalization (per-100g nutrition values)
- Best-value selection for name, brand, image

**Key Functions:**
- `mergeProducts(products: Product[], options?: MergeOptions): Product`
- `mergeNutriments(nutriments: ProductNutriments[], weights: number[]): ProductNutriments`
- `mergeCertifications(certs: Certification[][], weights: number[]): Certification[]`
- `normalizeNutrition(product: Product): Product`

**Source Weights:**
- Government DBs (FSANZ, USDA, GS1): 40%
- Open Food Facts: 40%
- Store APIs: 30%
- Free APIs: 20%
- Web Search: 10%

---

#### 4.2 Enhance Timeout Helper with Rate Limiting
**File:** `src/utils/timeoutHelper.ts`
**Time:** 2-3 hours

**Requirements:**
- RateLimiter class with exponential backoff
- Shared queue for concurrent requests
- Configurable per-source limits
- `fetchWithRateLimit()` helper function
- Global rate limiter instance

**Key Classes/Functions:**
- `class RateLimiter`
- `fetchWithRateLimit(url: string, options: RequestInit, source: string): Promise<Response>`
- `getGlobalRateLimiter(): RateLimiter`

**Rate Limits:**
- Open Food Facts: 1 request/second
- Store APIs: 2 requests/second
- Free APIs: 1 request/2 seconds
- Government APIs: 1 request/second

---

#### 4.3 Integrate Data Merger in Product Service
**File:** `src/services/productService.ts`
**Time:** 1 hour

**Changes:**
- Import productDataMerger
- When multiple sources return data, merge them
- Use merged product for final result
- Log merging decisions

**Integration Points:**
- After parallel API calls
- Before caching
- When multiple products found

---

#### 4.4 Apply Rate Limiting to Key Services
**Files:** Multiple service files
**Time:** 1 hour

**Services to Update:**
- `openFoodFacts.ts`
- `nzStoreApi.ts`
- `auRetailerScraping.ts`
- `openGtindbApi.ts`
- `barcodeMonsterApi.ts`
- `upcitemdb.ts`

**Changes:**
- Replace `fetch()` with `fetchWithRateLimit()`
- Add source identifier
- Handle rate limit errors

---

#### 4.5 Testing Phase 4
**Time:** 1 hour

**Test Cases:**
- Test data merging with multiple sources
- Test rate limiting with concurrent requests
- Test exponential backoff
- Test queue management
- Test error handling
- Verify data quality improvements

**Success Criteria:**
- ✅ Data merging works correctly
- ✅ Rate limiting prevents API bans
- ✅ Queue manages concurrent requests
- ✅ Exponential backoff works
- ✅ No TypeScript errors

---

## 🎯 Phase 5: Modular Scorers
**Priority:** LOW (Optional but Recommended)  
**Impact:** Better code organization, easier testing  
**Estimated Time:** 4-5 hours  
**Status:** Pending

### Tasks

#### 5.1 Create Base Scorer
**File:** `src/lib/scorers/baseScorer.ts`
**Time:** 45 minutes

**Requirements:**
- Base scorer interface
- ScorerResult interface
- ScorerOptions interface
- Base scorer utilities
- Common helper functions

**Key Interfaces:**
- `interface ScorerResult`
- `interface ScorerOptions`
- `abstract class BaseScorer`

---

#### 5.2 Create Nutrition Scorer
**File:** `src/lib/scorers/nutritionScorer.ts`
**Time:** 1 hour

**Requirements:**
- Nutrition/Body pillar scorer (0-25 points)
- Nutri-Score calculation
- Additives penalty
- Allergens handling
- NOVA processing level

**Key Functions:**
- `calculateNutritionScore(product: Product, options?: ScorerOptions): ScorerResult`

---

#### 5.3 Create Eco Scorer
**File:** `src/lib/scorers/ecoScorer.ts`
**Time:** 1 hour

**Requirements:**
- Eco/Planet pillar scorer (0-25 points)
- Eco-Score calculation
- Packaging recyclability
- Palm oil analysis

**Key Functions:**
- `calculateEcoScore(product: Product, options?: ScorerOptions): ScorerResult`

---

#### 5.4 Create Ethics Scorer
**File:** `src/lib/scorers/ethicsScorer.ts`
**Time:** 1 hour

**Requirements:**
- Ethics/Care pillar scorer (0-25 points)
- Certifications scoring
- Labels analysis
- Cruel parent company detection

**Key Functions:**
- `calculateEthicsScore(product: Product, options?: ScorerOptions): ScorerResult`

---

#### 5.5 Create Transparency Scorer
**File:** `src/lib/scorers/transparencyScorer.ts`
**Time:** 1 hour

**Requirements:**
- Transparency/Open pillar scorer (0-25 points)
- Ingredient disclosure
- Hidden terms detection
- Origin transparency

**Key Functions:**
- `calculateTransparencyScore(product: Product, options?: ScorerOptions): ScorerResult`

---

#### 5.6 Create Scorers Index
**File:** `src/lib/scorers/index.ts`
**Time:** 15 minutes

**Requirements:**
- Export all scorers
- Export types
- Export configurable weights
- Default weight configuration

---

#### 5.7 Refactor TruScore Engine
**File:** `src/lib/truscoreEngine.ts`
**Time:** 1.5 hours

**Requirements:**
- Import modular scorers
- Use modular scorers instead of inline logic
- Add missing data imputation
- Configurable weights via TRUSCORE_WEIGHTS
- Maintain backward compatibility

**Key Changes:**
- Replace inline scoring with scorer calls
- Add `imputeMissingData()` function
- Use configurable weights
- Extract metadata from scorer results

**Missing Data Imputation:**
- Default nutriments (0 values)
- Default origins (empty)
- Default ingredients (empty string)
- Default categories (empty array)

---

#### 5.8 Testing Phase 5
**Time:** 1 hour

**Test Cases:**
- Test each scorer independently
- Test TruScore with modular scorers
- Test missing data imputation
- Test configurable weights
- Test backward compatibility
- Verify scoring accuracy

**Success Criteria:**
- ✅ All scorers work correctly
- ✅ TruScore uses modular scorers
- ✅ Missing data imputation works
- ✅ Weights are configurable
- ✅ Backward compatible
- ✅ No TypeScript errors

---

## 📊 Overall Progress Tracking

### Phase Completion Status

- [ ] **Phase 1:** FSANZ & AU Retailer (0/6 tasks)
- [ ] **Phase 2:** Confidence Scoring (0/6 tasks)
- [ ] **Phase 3:** FSANZ Import System (0/6 tasks)
- [ ] **Phase 4:** Data Merging & Rate Limiting (0/5 tasks)
- [ ] **Phase 5:** Modular Scorers (0/8 tasks)

**Total Tasks:** 31 tasks  
**Completed:** 0 tasks  
**Remaining:** 31 tasks

---

## 🔄 Implementation Workflow

### For Each Task:
1. **Read requirements** from this plan
2. **Check existing code** for patterns
3. **Create/update file** with implementation
4. **Add imports/exports** as needed
5. **Test locally** (TypeScript check)
6. **Update TODO** when complete
7. **Move to next task**

### After Each Phase:
1. **Run TypeScript check:** `npx tsc --noEmit`
2. **Test functionality** with real barcodes
3. **Fix any errors**
4. **Update progress** in this document
5. **Commit changes:** `git commit -m "feat: Complete Phase X - [Description]"`
6. **Move to next phase**

---

## ✅ Final Checklist

Before considering complete:
- [ ] All 31 tasks completed
- [ ] All TypeScript errors resolved
- [ ] All imports/exports correct
- [ ] All integrations tested
- [ ] All phases tested end-to-end
- [ ] Documentation updated
- [ ] Code follows existing patterns
- [ ] Ready for EAS Build

---

## 🚀 Ready to Begin

**Starting with Phase 1, Task 1.1: Create FSANZ Database Service**

Let's restore all missing development work systematically!


