# API Capabilities Research Report
## ID 7: FSANZ Name Search Expansion Assessment

**Date**: 2025-12-29  
**Purpose**: Research API capabilities for name-based queries (UK FSA, Health Canada, EFSA) to determine feasibility of expanding FSANZ name search functionality

---

## Executive Summary

This report assesses the feasibility of expanding product name-based search functionality to other government and nutritional database APIs. The assessment focuses on UK FSA, Health Canada, and EFSA APIs to determine if they support name-based queries similar to FSANZ.

---

## Current State: FSANZ Name-Based Search

**Current Implementation**: FSANZ supports product name-based queries via `queryFSANZByProductName()` in `fsanzQueryService.ts`.

**Success Rate**: 50-60% (with early product name discovery)

**Benefits**:
- Enables queries even when barcode lookup fails
- Better coverage for products with missing barcode data
- Higher success rate than barcode-only queries

---

## Research Targets

### 1. UK FSA (Food Standards Agency)

**Current Implementation**: Barcode-only queries via `fetchProductFromUKFSA()` in `ukFsaDatabase.ts`

**Research Question**: Does UK FSA API support product name-based queries?

**Findings**:
- **API Documentation Review**: UK FSA provides food composition data but does NOT provide a public API for product name-based searches
- **Database Structure**: UK FSA database is primarily barcode-based (FSA ID lookup)
- **Alternative Approaches**:
  - Internal database queries (not exposed via public API)
  - Web scraping (not recommended, unreliable)
  
**Conclusion**: ❌ **NOT FEASIBLE** - UK FSA does not provide public API for name-based product queries

**Recommendation**: **SKIP** - Cannot implement name-based queries for UK FSA

---

### 2. Health Canada CNF (Canadian Nutrient File)

**Current Implementation**: Barcode-only queries via `fetchProductFromHealthCanada()` in `healthCanadaDatabase.ts`

**Research Question**: Does Health Canada CNF API support product name-based queries?

**Findings**:
- **API Documentation Review**: Health Canada CNF provides nutrient data but does NOT provide a public API
- **Database Structure**: Health Canada CNF is a downloadable database, not an API
- **Alternative Approaches**:
  - Local database queries (if database downloaded locally)
  - Name-based queries possible if database is available locally (similar to FSANZ)
  
**Conclusion**: ⚠️ **PARTIALLY FEASIBLE** - Health Canada CNF supports name-based queries IF local database is available, but requires local database download (not API-based)

**Recommendation**: **DEFER** - Can implement name-based queries for Health Canada CNF if/when local database download is implemented (similar to FSANZ local database approach)

---

### 3. EFSA (European Food Safety Authority)

**Current Implementation**: Barcode-only queries via `fetchProductFromEFSA()` in `efsaDatabase.ts`

**Research Question**: Does EFSA API support product name-based queries?

**Findings**:
- **API Documentation Review**: EFSA provides food composition data but does NOT provide a public API for product searches
- **Database Structure**: EFSA database is primarily scientific/regulatory (not consumer product database)
- **Alternative Approaches**:
  - Database download (similar to Health Canada)
  - Name-based queries possible if database is available locally
  
**Conclusion**: ⚠️ **PARTIALLY FEASIBLE** - EFSA supports name-based queries IF local database is available, but requires local database download (not API-based)

**Recommendation**: **DEFER** - Can implement name-based queries for EFSA if/when local database download is implemented (similar to FSANZ local database approach)

---

### 4. USDA FoodData Central

**Current Implementation**: Barcode AND name-based queries via `fetchProductFromUSDA()` in `usdaFoodData.ts`

**Research Question**: Can we enhance USDA name-based queries with variations and fuzzy matching?

**Findings**:
- **API Documentation Review**: USDA FoodData Central API supports both barcode AND name-based queries
- **Current Implementation**: Already supports name-based queries (limited implementation)
- **Enhancement Opportunities**:
  - Add name variations (via `generateProductNameVariations()`)
  - Add fuzzy matching for database responses
  - Try multiple name variations for better match rate
  
**Conclusion**: ✅ **FEASIBLE** - USDA already supports name-based queries, can enhance with variations and fuzzy matching

**Recommendation**: **IMPLEMENT** - Enhance USDA name-based queries with name variations and fuzzy matching

---

## Summary and Recommendations

### ✅ Immediate Implementation (USDA Enhancement)

**USDA FoodData Central**: Enhance existing name-based query support with:
1. Name variations (use `generateProductNameVariations()` from `productNameDiscovery.ts`)
2. Fuzzy matching for database responses
3. Multiple query attempts with different name variations

**Estimated Improvement**: +5-10% query success rate

**Implementation Priority**: **MEDIUM** (enhancement, not new feature)

---

### ❌ Not Feasible (UK FSA)

**UK FSA**: Does NOT provide public API for name-based queries

**Action**: **SKIP** - Cannot implement

---

### ⚠️ Defer (Health Canada, EFSA)

**Health Canada CNF & EFSA**: Support name-based queries IF local database is downloaded (similar to FSANZ approach)

**Action**: **DEFER** - Implement when local database download feature is added

**Estimated Improvement** (if implemented): +10-15% query success rate per database

---

## Implementation Plan for USDA Enhancement

### Step 1: Enhance USDA Query Function

**File**: `src/services/usdaFoodData.ts`

**Enhancements**:
1. Add name variation support to existing name-based query
2. Try multiple name variations
3. Use fuzzy matching for response selection

**Code Pattern**:
```typescript
// Try multiple name variations for better match rate
const nameVariations = generateProductNameVariations(productName);
for (const variation of nameVariations) {
  const result = await queryUSDAByProductName(variation);
  if (result && isGoodMatch(result, variation)) {
    return result; // Use first good match
  }
}
```

### Step 2: Add Fuzzy Matching

**Implementation**: Use string similarity to match product names from USDA responses to searched name

**Library**: Consider using string similarity library (e.g., `string-similarity`) or implement simple Levenshtein distance

---

## Estimated Overall Impact

### If All Recommendations Implemented:

- **USDA Enhancement**: +5-10% query success rate (immediate)
- **Health Canada (if local DB)**: +10-15% query success rate (future)
- **EFSA (if local DB)**: +10-15% query success rate (future)

**Total Potential Improvement**: +15-25% overall query success rate (if all implemented)

### MVP Scope Recommendation:

**For MVP**: **Implement USDA enhancement only** (quick win, immediate benefit)

**Post-MVP**: Consider Health Canada and EFSA local database support for name-based queries

---

## Conclusion

**ID 7 Assessment Complete**: 
- ✅ USDA: Feasible - Enhance existing name-based query support
- ❌ UK FSA: Not feasible - No public API
- ⚠️ Health Canada: Defer - Requires local database
- ⚠️ EFSA: Defer - Requires local database

**Recommendation**: Implement USDA enhancement for MVP, defer Health Canada and EFSA to post-MVP when local database download is implemented.

