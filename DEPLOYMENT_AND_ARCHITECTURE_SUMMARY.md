# Deployment & Architecture Summary

## ✅ Deployment Status

**Deployed to Vercel**: Production deployment initiated

**API Endpoint**: `https://truscoreapi-rdmgl22n6-leightons-projects-d328c774.vercel.app/api/fsanz-query`

**Changes Deployed**:
1. ✅ FSANZ matching algorithm improved (requires first keyword + 50% keywords)
2. ✅ Generic product name rejection
3. ✅ Combined NZFCD + AFCD database queries

---

## 📊 Database Search Order (Complete Flow)

### **TIER 0: Offline-First** (Instant, No Network)

1. **SQLite Database** (Local)
   - Previously scanned products
   - Country-specific
   - Instant return

2. **Cache** (AsyncStorage)
   - Cached product data
   - Premium users: extended cache
   - Fast return

---

### **TIER 1: Gold Standard + Open Facts** (Parallel)

**All queried simultaneously**:

**Gold Standard** (Location-Specific):
- USDA (US users)
- Health Canada (CA users)
- UK FSA (GB users)
- EFSA (EU users)
- GS1 (All users)

**Open Facts** (Always):
- Open Food Facts
- Open Beauty Facts
- Open Pet Food Facts
- Open Products Facts

---

### **TIER 2: Store APIs + Nutrition APIs** (Parallel, Enhancement)

**Only if Tier 1 found products**:

**Store APIs** (Location-Specific):
- NZ Stores (NZ users)
- AU Retailers (AU users)
- Tesco (GB users)
- Walmart/FoodRepo (US users)

**Nutrition APIs** (Always):
- Edamam
- Nutritionix
- Spoonacular

---

### **TIER 3: Fallback Databases** (Parallel)

**Only if Tier 1 found NO products**:

- UPCitemdb
- EAN-Search
- Barcode Spider
- GoUPC
- Buycott
- Open GTIN
- Barcode Monster
- UPC Database
- Barcode Lookup
- EANData
- Best Buy

---

### **TIER 4: Web Search** (Last Resort)

**Only if Tiers 1-3 found nothing**:
- DuckDuckGo Instant Answer
- Web scraping
- 5-second timeout

---

### **TIER 5: Product Name Queries** (FSANZ by Name)

**After product found from barcode**:

**For NZ Users**:
1. NZFCD (2,857 foods) - Server API
2. AFCD (17,109 foods) - Server API
3. Both queried in parallel

**For AU Users**:
1. AFCD (17,109 foods) - Server API
2. NZFCD (2,857 foods) - Server API
3. Both queried in parallel

**Matching Algorithm**:
- Requires first keyword to match (main product)
- Requires 50% of keywords to match
- Minimum score: 150 for multi-word searches

---

## 🔄 Complete Flow: Scan → TruScore

```
1. User Scans Barcode
   ↓
2. SQLite Check (instant, offline)
   ↓ (if not found)
3. Cache Check (fast, offline)
   ↓ (if not found)
4. Tier 1: Gold Standard + Open Facts (parallel, ~3-5 seconds)
   ↓
5. Tier 2: Store APIs + Nutrition APIs (parallel, if Tier 1 found product)
   ↓
6. Tier 3: Fallback Databases (parallel, if Tier 1 found nothing)
   ↓
7. Tier 4: Web Search (if Tiers 1-3 found nothing)
   ↓
8. Product Found (has product_name)
   ↓
9. Tier 5: FSANZ by Product Name (parallel, both NZFCD + AFCD)
   ↓
10. Product Merging (combine all sources)
   ↓
11. Enhancement Layer (MVP enhancements, palm oil, etc.)
   ↓
12. TruScore Calculation (Body + Planet + Care + Open pillars)
   ↓
13. Final Result (Product + TruScore)
```

---

## 🎯 Key Architecture Features

### **1. Parallel Execution**
- All databases in each tier queried simultaneously
- Maximum speed (not sequential)
- 15-second timeout protection

### **2. Location-Specific Prioritization**
- Country-specific databases queried first
- FSANZ for NZ/AU users
- USDA for US users
- Health Canada for CA users

### **3. Quality Over Quantity**
- Open Food Facts preferred over web search
- Gold Standard databases prioritized
- Fallbacks only if primary sources fail

### **4. Maximum Data Completeness**
- Merge all sources for complete product
- Weighted averages for nutrition
- Best data from each source

### **5. Offline-First**
- SQLite check happens first (no network)
- Cached products return immediately
- Premium users have extended cache

---

## 📈 TruScore Calculation

**Input**: Merged product with data from all databases

**Pillars** (25 points each):

1. **Body Pillar**:
   - Nutri-Score (if available)
   - Nutrition completeness
   - Additive penalties
   - NOVA group penalties

2. **Planet Pillar**:
   - Eco-Score (if available)
   - Packaging data
   - Sustainability indicators

3. **Ethics Pillar**:
   - Animal welfare certifications
   - Ethical sourcing

4. **Open Pillar**:
   - Ingredients transparency
   - Origin data
   - Manufacturing location
   - Data completeness

**Output**: TruScore 0-100 with breakdown

---

## ✅ Summary

The architecture ensures:
- ✅ **Maximum speed** (parallel queries, offline-first)
- ✅ **Maximum data quality** (merge all sources)
- ✅ **Maximum coverage** (location-specific + global)
- ✅ **Optimal TruScore accuracy** (complete data)

Every product scan gets the **best possible data** from **all available sources**, merged intelligently for accurate TruScore calculation.
