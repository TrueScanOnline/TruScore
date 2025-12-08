# Complete Database Architecture: Product Scan → TruScore Calculation

## Overview

This document explains the **complete flow** from when a user scans a product barcode through to the final TruScore calculation. The architecture is designed for **maximum data quality** and **optimal TruScore accuracy**.

---

## 🎯 High-Level Flow

```
User Scans Barcode
    ↓
1. SQLite Check (Offline-First)
    ↓
2. Cache Check
    ↓
3. TruScore-Optimized Database Query (Parallel Phases)
    ↓
4. Product Name Queries (FSANZ by Name)
    ↓
5. Product Merging & Enhancement
    ↓
6. TruScore Calculation
```

---

## 📊 Detailed Architecture

### **STEP 1: SQLite Database Check** (Offline-First)

**Location**: `src/services/productService.ts` → `executeFetchProduct()`

**Purpose**: Instant lookup for previously scanned products (offline support)

**Order**: **FIRST** (before any network calls)

**Databases**:
- Local SQLite database (country-specific)
- Stores previously scanned products

**Behavior**:
- ✅ If found → Return immediately (no network calls)
- ❌ If not found → Continue to Step 2

**Timeout**: None (local database)

---

### **STEP 2: Cache Check**

**Location**: `src/services/productService.ts` → `executeFetchProduct()`

**Purpose**: Return cached product data (fast, no network)

**Order**: **SECOND** (after SQLite, before network queries)

**Databases**:
- AsyncStorage cache (premium users have extended cache)

**Behavior**:
- ✅ If found → Return cached product
- ❌ If not found → Continue to Step 3

**Timeout**: None (local cache)

---

### **STEP 3: TruScore-Optimized Database Query** (Parallel Phases)

**Location**: `src/data/databases/truScoreOptimizedDatabase.ts` → `queryAllDatabases()`

**Purpose**: Query all databases in parallel, optimized for maximum data quality

**Order**: **THIRD** (after SQLite and cache)

**Timeout**: 15 seconds maximum

**Architecture**: **3 Parallel Phases**

#### **PHASE 1: Gold Standard + Open Facts** (Parallel)

**Databases Queried in Parallel**:

1. **Gold Standard Databases** (Location-Specific):
   - **US Users**: USDA FoodData Central
   - **CA Users**: Health Canada Database
   - **GB Users**: UK FSA Database
   - **EU Users**: EFSA Database
   - **All Users**: GS1 Data Source (global)

2. **Open Facts Databases** (Always Queried):
   - Open Food Facts (food products)
   - Open Beauty Facts (cosmetics)
   - Open Pet Food Facts (pet food)
   - Open Products Facts (general products)

**Execution**: All databases queried **simultaneously** (parallel)

**Result**: Products from all matching databases

---

#### **PHASE 2: Store APIs + Nutrition APIs** (Parallel)

**Only Executes**: If Phase 1 found products (enhancement phase)

**Databases Queried in Parallel**:

1. **Store APIs** (Location-Specific):
   - **NZ Users**: NZ Store APIs (Woolworths, Pak'nSave, New World)
   - **AU Users**: AU Retailer APIs
   - **GB Users**: Tesco Labs API
   - **US Users**: Walmart Open API, FoodRepo API

2. **Nutrition APIs** (Always Queried):
   - Edamam Food Database
   - Nutritionix API
   - Spoonacular API

**Execution**: All databases queried **simultaneously** (parallel)

**Purpose**: Enhance existing products with additional data

---

#### **PHASE 3: Fallback Databases** (Parallel)

**Only Executes**: If Phase 1 found **NO products** (not if Open Food Facts found something)

**Databases Queried in Parallel**:
- UPCitemdb
- EAN-Search.org
- Barcode Spider
- GoUPC API
- Buycott API
- Open GTIN Database
- Barcode Monster
- UPC Database API
- Barcode Lookup API
- EANData API
- Best Buy API

**Execution**: All databases queried **simultaneously** (parallel)

**Purpose**: Last resort if primary databases don't have the product

**Note**: `web_search` is handled separately in `productService.ts` as absolute last resort

---

### **STEP 4: Product Name Queries** (FSANZ by Name)

**Location**: `src/data/databases/truScoreOptimizedDatabase.ts` → `queryByNameForTruScore()`

**Purpose**: Query FSANZ databases by product name (not barcode)

**Order**: **FOURTH** (after product found from barcode scan)

**When Executes**: After a product is found (has `product_name`)

**Why This Order**: 
- FSANZ databases are **food composition databases** (not barcode databases)
- They don't have barcodes, only food names
- We need the product name from barcode scan first

**Databases Queried in Parallel**:

1. **For NZ Users**:
   - NZFCD (New Zealand Food Composition Database) - 2,857 foods
   - AFCD (Australian Food Composition Database) - 17,109 foods

2. **For AU Users**:
   - AFCD (Australian Food Composition Database) - 17,109 foods
   - NZFCD (New Zealand Food Composition Database) - 2,857 foods

**API Endpoint**: `/api/fsanz-query?country={country}&productName={name}`

**Matching Algorithm**:
- Fuzzy matching with similarity scoring
- Requires first keyword to match (main product name)
- Requires at least 50% of keywords to match
- Minimum score threshold: 150 for multi-word searches

**Result**: Additional nutrition data merged into product

---

### **STEP 5: Product Merging & Enhancement**

**Location**: `src/services/productDataMerger.ts` → `mergeProducts()`

**Purpose**: Merge all products from different databases into one complete product

**Order**: **FIFTH** (after all database queries complete)

**Process**:

1. **Base Product Selection**:
   - Select product with highest TruScore completeness + source weight
   - Usually Open Food Facts (most complete data)

2. **Data Merging**:
   - **Nutrition**: Weighted average from all sources
   - **Ingredients**: Use longest/most complete
   - **Categories**: Use most specific
   - **Images**: Use highest quality
   - **Certifications**: Merge all unique certifications
   - **Allergens**: Merge all unique allergens

3. **Enhancement Layer**:
   - MVP enhancements (EWG, Leaping Bunny, WWF)
   - Brand enrichment
   - Palm oil analysis
   - Additive detection

**Result**: Single merged product with maximum data completeness

---

### **STEP 6: TruScore Calculation**

**Location**: `src/utils/truScore.ts` → `calculateTruScore()`

**Purpose**: Calculate final TruScore from merged product data

**Order**: **SIXTH** (final step)

**Input**: Merged product with all data from all databases

**Calculation**:

1. **Body Pillar** (25 points):
   - Nutri-Score (if available)
   - Nutrition data completeness
   - Additive penalties
   - NOVA group penalties

2. **Planet Pillar** (25 points):
   - Eco-Score (if available)
   - Packaging data
   - Sustainability indicators

3. **Care Pillar** (25 points):
   - Animal welfare certifications
   - Ethical sourcing indicators

4. **Open Pillar** (25 points):
   - Ingredients transparency
   - Origin data
   - Manufacturing location
   - Data completeness

**Output**: TruScore (0-100) with breakdown by pillar

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SCANS BARCODE                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: SQLite Check (Offline-First)                       │
│  • Local SQLite database                                     │
│  • Country-specific                                          │
│  • Instant (no network)                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (if not found)
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Cache Check                                        │
│  • AsyncStorage cache                                        │
│  • Premium users: extended cache                             │
│  • Fast (no network)                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (if not found)
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: TruScore-Optimized Database Query                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 1: Gold Standard + Open Facts (Parallel)     │    │
│  │ • USDA (US) / Health Canada (CA) / UK FSA (GB)     │    │
│  │ • EFSA (EU) / GS1 (Global)                          │    │
│  │ • Open Food Facts / Beauty / Pet Food / Products    │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 2: Store APIs + Nutrition APIs (Parallel)    │    │
│  │ • NZ Stores / AU Retailers / Tesco / Walmart        │    │
│  │ • Edamam / Nutritionix / Spoonacular                │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                      │
│                       ▼ (if Phase 1 found nothing)           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ PHASE 3: Fallback Databases (Parallel)              │    │
│  │ • UPCitemdb / EAN-Search / Barcode Spider          │    │
│  │ • GoUPC / Buycott / Open GTIN / etc.               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (if still no product)
┌─────────────────────────────────────────────────────────────┐
│  Web Search Fallback (Absolute Last Resort)                 │
│  • DuckDuckGo Instant Answer                                │
│  • Web scraping                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (product found)
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Product Name Queries (FSANZ by Name)               │
│  • Query NZFCD by product name (NZ users)                   │
│  • Query AFCD by product name (AU users)                    │
│  • Query BOTH for maximum coverage                          │
│  • Server-side API: /api/fsanz-query                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Product Merging & Enhancement                      │
│  • Select base product (highest TruScore completeness)      │
│  • Merge nutrition (weighted average)                       │
│  • Merge ingredients (longest/most complete)                │
│  • Merge certifications, allergens, etc.                    │
│  • Apply MVP enhancements                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: TruScore Calculation                               │
│  • Body Pillar (25 points)                                  │
│  • Planet Pillar (25 points)                                │
│  • Care Pillar (25 points)                                  │
│  • Open Pillar (25 points)                                  │
│  • Total: 0-100                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL RESULT                              │
│  • Product with complete data                               │
│  • TruScore: 0-100                                          │
│  • Breakdown by pillar                                      │
│  • Saved to SQLite for future scans                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Principles

### 1. **Offline-First**
- SQLite check happens first (no network)
- Cached products return immediately
- Premium users have extended cache

### 2. **Parallel Querying**
- All databases in each phase queried simultaneously
- Maximum speed (not sequential)
- 15-second timeout prevents hanging

### 3. **Location-Specific Prioritization**
- Country-specific databases queried first
- FSANZ for NZ/AU users
- USDA for US users
- Health Canada for CA users

### 4. **Quality Over Quantity**
- Open Food Facts preferred over web search
- Gold Standard databases prioritized
- Fallbacks only if primary sources fail

### 5. **Maximum Data Completeness**
- Merge all sources for complete product
- Weighted averages for nutrition
- Best data from each source

---

## 📊 Database Query Order Summary

### **By Barcode** (Steps 1-3):

1. **SQLite** (local, instant)
2. **Cache** (local, instant)
3. **Phase 1**: Gold Standard + Open Facts (parallel)
4. **Phase 2**: Store APIs + Nutrition APIs (parallel, if Phase 1 found product)
5. **Phase 3**: Fallback Databases (parallel, if Phase 1 found nothing)
6. **Web Search** (absolute last resort)

### **By Product Name** (Step 4):

1. **FSANZ NZFCD** (NZ users, or AU users for coverage)
2. **FSANZ AFCD** (AU users, or NZ users for coverage)
3. Both queried in parallel for maximum coverage

---

## 🔧 Technical Details

### **Parallel Execution**
- Uses `Promise.allSettled()` for parallel queries
- Continues even if some databases fail
- Returns all successful results

### **Timeout Protection**
- 15-second maximum for barcode queries
- Prevents app from hanging
- Returns partial results if timeout

### **Error Handling**
- Graceful degradation
- Continues to next phase if one fails
- Always returns something (even if minimal)

### **Caching Strategy**
- SQLite: Persistent local storage
- AsyncStorage: In-memory cache
- Premium users: Extended cache duration

---

## ✅ Summary

The architecture is designed for:
- ✅ **Maximum speed** (parallel queries, offline-first)
- ✅ **Maximum data quality** (merge all sources)
- ✅ **Maximum coverage** (location-specific + global databases)
- ✅ **Optimal TruScore accuracy** (complete data from all sources)

The flow ensures that every product scan gets the **best possible data** from **all available sources**, merged intelligently to create the most complete product profile for accurate TruScore calculation.
