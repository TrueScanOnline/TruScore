# Database Query Flow - Visual Diagram

## Terminology: "Tiers" = "Phases"

**They are the same concept!**
- **"TIERS"** = Used in `TruScoreOptimizedDatabase.ts` (internal organization)
- **"PHASES"** = Used in `productServiceOptimized.ts` (high-level flow)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SCANS BARCODE                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Check Cache/SQLite (instant - <100ms)                 │
│  ────────────────────────────────────────────────────────────   │
│  • SQLite (local database)                                       │
│  • AsyncStorage Cache                                            │
│                                                                   │
│  If found → Return immediately (fastest path)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ (if not found)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Fast Sources (<2s)                                    │
│  ────────────────────────────────────────────────────────────   │
│  Calls: queryOpenFactsParallel()                                 │
│                                                                   │
│  TIER 1 Databases (all queried in parallel):                    │
│  ├─ Open Food Facts (OFF)          [Weight: 0.45]                │
│  ├─ Open Beauty Facts (OBF)        [Weight: 0.40]                │
│  ├─ Open Pet Food Facts (OPFF)     [Weight: 0.40]                │
│  └─ Open Products Facts (OPF)     [Weight: 0.35]                │
│                                                                   │
│  First result → Display immediately (progressive display)        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  If good data found → Display Product NOW                       │
│  ────────────────────────────────────────────────────────────   │
│  • Product sent to UI immediately                                │
│  • TruScore calculated and displayed                             │
│  • User sees product in <3 seconds                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (in background - non-blocking)
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Enhancement Sources (Background)                       │
│  ────────────────────────────────────────────────────────────   │
│  Calls: queryAllDatabases() → TIER 2                            │
│                                                                   │
│  TIER 2 Databases (all queried in parallel):                     │
│                                                                   │
│  ┌─ Local-First (queryLocalFirstParallel) ───────────────────┐  │
│  │ • FSANZ (AU/NZ)              [Weight: 0.50]              │  │
│  │ • USDA (US)                  [Weight: 0.50]              │  │
│  │ • Health Canada (CA)          [Weight: 0.50]              │  │
│  │ • UK FSA (GB)                 [Weight: 0.50]              │  │
│  │ • EFSA (EU)                   [Weight: 0.50]              │  │
│  │ • NZ Store APIs               [Weight: 0.35]              │  │
│  │ • AU Retailers                [Weight: 0.35]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Gold Standard (queryGoldStandardParallel) ──────────────┐  │
│  │ • GS1                        [Weight: 0.45]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Enhancements (queryEnhancementsParallel) ────────────────┐  │
│  │ • Spoonacular               [Weight: 0.30]              │  │
│  │ • Nutritionix               [Weight: 0.30]              │  │
│  │ • Edamam                    [Weight: 0.30]              │  │
│  │ • FoodRepo                  [Weight: 0.35]              │  │
│  │ • Walmart Open API          [Weight: 0.35]              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Results merge progressively as they arrive                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (in background - non-blocking)
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Fallback Sources (Background, if needed)              │
│  ────────────────────────────────────────────────────────────   │
│  Calls: queryAllDatabases() → TIER 3                            │
│                                                                   │
│  TIER 3 Databases (all queried in parallel):                    │
│  ├─ Datakick                    [Weight: 0.25]                  │
│  ├─ OpenEAN                     [Weight: 0.22]                  │
│  ├─ Product Open Data           [Weight: 0.25]                  │
│  ├─ UPCitemdb                   [Weight: 0.20]                   │
│  ├─ EAN-Search                  [Weight: 0.20]                  │
│  ├─ Barcode Spider              [Weight: 0.20]                  │
│  ├─ GoUpc                       [Weight: 0.20]                  │
│  ├─ Buycott                     [Weight: 0.20]                  │
│  ├─ OpenGtin                    [Weight: 0.20]                  │
│  ├─ Barcode Monster             [Weight: 0.20]                  │
│  ├─ UPCDatabase                 [Weight: 0.20]                  │
│  ├─ Barcode Lookup              [Weight: 0.25]                  │
│  ├─ EANData                     [Weight: 0.20]                  │
│  ├─ Best Buy                    [Weight: 0.20]                  │
│  ├─ Barcode Lookup Com          [Weight: 0.25]                  │
│  └─ World Food Database         [Weight: 0.30]                  │
│                                                                   │
│  Results merge progressively as they arrive                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA MERGING PROCESS                          │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  1. Select Base Product:                                         │
│     • Calculate "TruScore Completeness" for each product         │
│     • Calculate "Combined Score" =                               │
│       (TruScore Completeness × 0.6) + (Source Weight × 0.4)      │
│     • Select product with highest combined score                 │
│                                                                   │
│  2. Merge Fields:                                                │
│     • Nutrition: Weighted average (by source weight)            │
│     • Ingredients: Longest text (most complete)                  │
│     • Certifications: Union of all certifications                │
│     • Images: Best quality (highest resolution)                 │
│     • Categories: Most specific (longest category path)          │
│     • Brands: Merged from all sources                            │
│     • Labels: Merged from all sources                            │
│                                                                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TRUSCORE CALCULATION                                │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  Input: Merged Product (from all databases)                      │
│                                                                   │
│  Calculate 4 Pillars:                                            │
│  ┌─ Body Pillar (0-25 points) ───────────────────────────────┐  │
│  │ • Nutri-Score grade (from OFF)                            │  │
│  │ • Additives (IARC risk assessment)                        │  │
│  │ • Risky tags                                              │  │
│  │ • Universal irritants                                     │  │
│  │ • NOVA group                                              │  │
│  │ • EWG rating (household products)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Planet Pillar (0-25 points) ─────────────────────────────┐  │
│  │ • Eco-Score grade (from OFF)                              │  │
│  │ • Palm oil presence                                       │  │
│  │ • Recyclable packaging                                    │  │
│  │ • Packaging eco-cost                                      │  │
│  │ • Non-animal farming impact                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Ethics Pillar (0-25 points) ─────────────────────────────┐  │
│  │ • Certifications (Fairtrade, Organic, etc.)               │  │
│  │ • BBFAW animal cruelty tiers                              │  │
│  │ • Labor violations                                        │  │
│  │ • Product/brand recall history                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─ Open Pillar (0-25 points) ───────────────────────────────┐  │
│  │ • Ingredients disclosure                                  │  │
│  │ • Hidden terms (fragrance, flavor, proprietary blends)    │  │
│  │ • Origin transparency                                     │  │
│  │ • Brand ownership transparency                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Final TruScore = Body + Planet + Ethics + Open (0-100)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         PRODUCT INFORMATION PAGE DISPLAY                          │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  Receives: ProductWithTrustScore                                 │
│  {                                                                │
│    ...product data (merged from all databases),                  │
│    trust_score: 54,                                              │
│    trust_score_breakdown: {                                       │
│      Body: 14,                                                   │
│      Planet: 12,                                                 │
│      Ethics: 15,                                                 │
│      Open: 13                                                    │
│    }                                                              │
│  }                                                                │
│                                                                   │
│  Displays:                                                       │
│  ├─ TruScore Card (54/100)                                       │
│  ├─ Nutrition Card (from merged nutriments)                      │
│  ├─ Ingredients Card (from merged ingredients_text)              │
│  ├─ Certifications Card (from merged labels_tags)                │
│  ├─ Eco-Score Card (from merged ecoscore_grade)                  │
│  ├─ Nutri-Score Card (from merged nutriscore_grade)             │
│  ├─ Additives Card (from merged additives_tags)                  │
│  └─ Origin Card (from merged origins_tags)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Points

### 1. **All Tiers/Phases Run in Parallel**
- TIER 1, 2, 3 all start simultaneously
- No sequential waiting
- Results arrive as they complete (fastest first)

### 2. **Progressive Merging**
- First result (TIER 1) → Display immediately
- Subsequent results → Merge progressively
- UI updates as more data arrives

### 3. **Source Weighting**
- Higher weight = More trusted source
- Used for:
  - Base product selection
  - Field merging (weighted averages)
  - Conflict resolution

### 4. **TruScore Calculation**
- Uses merged product data
- Calculates 4 pillars (Body, Planet, Ethics, Open)
- Each pillar = 0-25 points
- Total = 0-100 points

### 5. **Product Information Page**
- Receives `ProductWithTrustScore` object
- Contains all merged data + TruScore
- Displays in various cards

---

## Timing Example

```
Time 0ms:     All queries fire (TIER 1, 2, 3 all start)
Time 500ms:   First TIER 1 result (OFF) → Display immediately
Time 1000ms:  More TIER 1 results → Merge progressively
Time 2000ms:  TIER 2 results start arriving → Merge progressively
Time 3000ms:  More TIER 2 results → Merge progressively
Time 5000ms:  TIER 3 results start arriving → Merge progressively
Time 8000ms:  All queries complete → Final merged product
```

---

## Files Reference

- **Database Organization**: `src/data/databases/truScoreOptimizedDatabase.ts`
- **Service Flow**: `src/services/productServiceOptimized.ts`
- **Merging Logic**: `src/services/productDataMerger.ts`
- **TruScore Calculation**: `src/lib/truscoreEngine/index.ts`
- **Source Weights**: `src/data/databases/truScoreOptimizedDatabase.ts` (line 962)

