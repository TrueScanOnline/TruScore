# Testing Logs Guide - Database Query Tracking

## Overview

Comprehensive logging has been added to track **exact database query order** and **results from each database** during user testing.

---

## Log Structure

### 1. Product Scan Start
```
═══════════════════════════════════════════════════════════════
🔍 PRODUCT SCAN: {barcode}
═══════════════════════════════════════════════════════════════
📋 Barcode Variants: {variants}
🌍 User Country: {country}
```

### 2. Tier 1: Open Facts Family (Parallel Query)
```
───────────────────────────────────────────────────────────────
📊 TIER 1: Open Facts Family (Parallel Query)
───────────────────────────────────────────────────────────────
✅ Open Food Facts: Found product | Quality: X%, Completion: Y%
❌ Open Beauty Facts: Not found
✅ Open Pet Food Facts: Found product | Quality: X%, Completion: Y%
```

### 3. Tier 1.5: Country-Specific Sources
```
───────────────────────────────────────────────────────────────
📊 TIER 1.5: Country-Specific Sources (NZ/AU)
───────────────────────────────────────────────────────────────
🔍 Trying NZ Store APIs...
✅ NZ Store API: Found product | Quality: X%, Completion: Y%

🔍 Trying FSANZ NZ Database (Gold Standard - Barcode Lookup)...
✅ FSANZ NZ: Found product | Quality: X%, Completion: Y%
```

### 4. FSANZ Query by Product Name (PRIMARY METHOD)
```
───────────────────────────────────────────────────────────────
📊 TIER 1.5: FSANZ Query by Product Name (NZ/AU)
───────────────────────────────────────────────────────────────
🔍 Querying FSANZ (NZ) by product name: "Milk"...
   📝 Product name from barcode scan: "Milk"

🔍 [FSANZ QUERY] Querying NZ database by product name: "Milk"
   📡 API URL: https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk

✅ [FSANZ QUERY] MATCH FOUND in nzfcd
   📦 Product: Milk, whole
   🏷️  Source: nzfcd
   🥗 Food Group: Dairy
   📊 Nutrition: Energy 61 kcal, Protein 3.2g, Fat 3.3g

   📊 Existing nutrients: 5, FSANZ nutrients: 12
✅ [FSANZ ENHANCEMENT] Product enhanced with official nutrition data
   📊 Final nutrients: 12 (added 7 from FSANZ)
   ➕ Added nutrients: calcium_100g, iron_100g, sodium_100g, ...
   🏷️  Source: openfoodfacts+nzfcd
```

### 5. For AU Users - Fallback Logging
```
❌ [FSANZ QUERY] No match found in AU database for "Apple"
   🔄 [FSANZ FALLBACK] Will try NZFCD fallback for AU user...

✅ [FSANZ QUERY] MATCH FOUND in nzfcd-fallback
   📦 Product: Apple, red delicious
   🏷️  Source: nzfcd-fallback
   ⚠️  [FALLBACK] Used NZFCD fallback (not found in AFCD)
```

### 6. Database Query Summary
```
═══════════════════════════════════════════════════════════════
📊 DATABASE QUERY SUMMARY
═══════════════════════════════════════════════════════════════
📦 Final Product: Milk, whole
🏷️  Sources: openfoodfacts → nzfcd
📊 Data Completeness: Quality: 85%, Completion: 78%
📈 Quality: 85, Completion: 78

🔍 Databases Queried:
   ✅ Open Food Facts - PRIMARY source
   ✅ FSANZ (NZFCD) - ENHANCED nutrition data

🥗 Nutrition Data: 12 nutrients available
   ✅ Energy data, ✅ Macros, ✅ Minerals

🏆 Best Database: OPENFOODFACTS
═══════════════════════════════════════════════════════════════
```

### 7. TruScore Calculation
```
───────────────────────────────────────────────────────────────
📊 TRUSCORE CALCULATION
───────────────────────────────────────────────────────────────
  TruScore: 78/100
  Body Pillar: 20/25
  Planet Pillar: 18/25
  Ethics Pillar: 22/25
  Open Pillar: 18/25
  Data Sources Used:
    Nutri-Score: Yes
    Eco-Score: Yes
    Origin Data: Yes
```

---

## What to Look For During Testing

### ✅ Success Indicators:
1. **FSANZ Query Executed**: Look for `[FSANZ QUERY]` logs
2. **Match Found**: Look for `✅ [FSANZ QUERY] MATCH FOUND`
3. **Enhancement Applied**: Look for `✅ [FSANZ ENHANCEMENT] Product enhanced`
4. **Nutrients Added**: Check `➕ Added nutrients:` list
5. **Fallback Working**: For AU users, check for `[FALLBACK] Used NZFCD fallback`

### ❌ Issues to Watch For:
1. **API Errors**: `❌ [FSANZ QUERY] API request failed`
2. **No Match**: `❌ [FSANZ QUERY] No match found`
3. **Missing Product Name**: If product name is missing, FSANZ won't query
4. **No Enhancement**: If `❌ [FSANZ ENHANCEMENT] No match found`

---

## Database Query Order (Complete Flow)

### For NZ Users:
1. **SQLite** (offline-first)
2. **Cache** (if available)
3. **Open Food Facts** (parallel)
4. **Open Beauty Facts** (parallel)
5. **Open Pet Food Facts** (parallel)
6. **Open Products Facts** (parallel)
7. **NZ Store APIs** (if NZ user)
8. **FSANZ NZ (Barcode Lookup)** (if available)
9. **FSANZ Query by Product Name** ⭐ **PRIMARY**
10. **Other databases** (UPCitemdb, etc.)
11. **Web search** (fallback)

### For AU Users:
1. **SQLite** (offline-first)
2. **Cache** (if available)
3. **Open Food Facts** (parallel)
4. **Open Beauty Facts** (parallel)
5. **Open Pet Food Facts** (parallel)
6. **Open Products Facts** (parallel)
7. **AU Retailer APIs** (if AU user)
8. **FSANZ AU (Barcode Lookup)** (if available)
9. **FSANZ Query by Product Name** ⭐ **PRIMARY**
   - Tries AFCD first
   - **Automatically falls back to NZFCD** if not found
10. **Other databases** (UPCitemdb, etc.)
11. **Web search** (fallback)

---

## Key Log Messages

### FSANZ Query Success:
- `✅ [FSANZ QUERY] MATCH FOUND in {database}`
- `✅ [FSANZ ENHANCEMENT] Product enhanced with official nutrition data`
- `➕ Added nutrients: {list}`

### FSANZ Query Failure:
- `❌ [FSANZ QUERY] No match found in {country} database`
- `❌ [FSANZ ENHANCEMENT] No match found - product not enhanced`

### Fallback (AU Users):
- `🔄 [FSANZ FALLBACK] Will try NZFCD fallback for AU user...`
- `⚠️  [FALLBACK] Used NZFCD fallback (not found in AFCD)`

### Summary:
- `🏆 Best Database: {database}`
- `📊 Final nutrients: {count} (added {count} from FSANZ)`
- `🏷️  Sources: {source1} → {source2}`

---

## Testing Checklist

- [ ] FSANZ query executes after product name is obtained
- [ ] API URL is logged correctly
- [ ] Match found/missed is clearly logged
- [ ] Fallback works for AU users (tries NZFCD)
- [ ] Nutrients added are listed
- [ ] Summary shows all databases that contributed
- [ ] Best database is identified
- [ ] Nutrition data quality is tracked

---

## Example Complete Log Flow

```
═══════════════════════════════════════════════════════════════
🔍 PRODUCT SCAN: 9400580012345
═══════════════════════════════════════════════════════════════
📋 Barcode Variants: 9400580012345
🌍 User Country: NZ

───────────────────────────────────────────────────────────────
📊 TIER 1: Open Facts Family (Parallel Query)
───────────────────────────────────────────────────────────────
✅ Open Food Facts: Found product | Quality: 85%, Completion: 78%

───────────────────────────────────────────────────────────────
📊 TIER 1.5: Country-Specific Sources (NZ)
───────────────────────────────────────────────────────────────
🔍 Trying FSANZ NZ Database (Gold Standard - Barcode Lookup)...
❌ FSANZ NZ: Product not found in database

───────────────────────────────────────────────────────────────
📊 TIER 1.5: FSANZ Query by Product Name (NZ)
───────────────────────────────────────────────────────────────
🔍 Querying FSANZ (NZ) by product name: "Milk, whole"...
   📝 Product name from barcode scan: "Milk, whole"

🔍 [FSANZ QUERY] Querying NZ database by product name: "Milk, whole"
   📡 API URL: https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk%2C%20whole

✅ [FSANZ QUERY] MATCH FOUND in nzfcd
   📦 Product: Milk, whole
   🏷️  Source: nzfcd
   🥗 Food Group: Dairy
   📊 Nutrition: Energy 61 kcal, Protein 3.2g, Fat 3.3g

   📊 Existing nutrients: 5, FSANZ nutrients: 12
✅ [FSANZ ENHANCEMENT] Product enhanced with official nutrition data
   📊 Final nutrients: 12 (added 7 from FSANZ)
   ➕ Added nutrients: calcium_100g, iron_100g, sodium_100g, fiber_100g, ...
   🏷️  Source: openfoodfacts+nzfcd

═══════════════════════════════════════════════════════════════
📊 DATABASE QUERY SUMMARY
═══════════════════════════════════════════════════════════════
📦 Final Product: Milk, whole
🏷️  Sources: openfoodfacts → nzfcd
📊 Data Completeness: Quality: 90%, Completion: 85%
📈 Quality: 90, Completion: 85

🔍 Databases Queried:
   ✅ Open Food Facts - PRIMARY source
   ✅ FSANZ (NZFCD) - ENHANCED nutrition data

🥗 Nutrition Data: 12 nutrients available
   ✅ Energy data, ✅ Macros, ✅ Minerals

🏆 Best Database: OPENFOODFACTS
═══════════════════════════════════════════════════════════════
```

---

## Summary

✅ **Complete logging added** for database query tracking  
✅ **Query order clearly shown** in logs  
✅ **Results from each database** logged with details  
✅ **FSANZ queries** fully tracked (including fallback)  
✅ **Summary shows** which databases provided best results  
✅ **Ready for user testing!**
