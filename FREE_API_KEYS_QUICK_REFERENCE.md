# Free API Keys - Quick Reference Guide

## 🎯 Top 10 Recommended FREE APIs to Add

### 1. UPC Database API ⭐ HIGH PRIORITY
- **Registration**: https://www.upcdatabase.com/api
- **Free Tier**: 100 lookups/day
- **Coverage**: 4.3M+ products
- **Key**: `EXPO_PUBLIC_UPC_DATABASE_API_KEY`
- **Why**: Different database than UPCitemdb, fills gaps

### 2. Edamam Food Database API ⭐ HIGH PRIORITY
- **Registration**: https://developer.edamam.com/
- **Free Tier**: 10,000 requests/month
- **Coverage**: Food products, nutrition
- **Keys**: `EXPO_PUBLIC_EDAMAM_APP_ID` + `EXPO_PUBLIC_EDAMAM_APP_KEY`
- **Why**: Strong nutrition data, generous free tier

### 3. Barcode Lookup API ⭐ HIGH PRIORITY
- **Registration**: https://www.barcodelookup.com/api
- **Free Tier**: 100 lookups/day
- **Coverage**: Product database
- **Key**: `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY`
- **Why**: Additional product source

### 4. Nutritionix API ⭐ MEDIUM PRIORITY
- **Registration**: https://www.nutritionix.com/business/api
- **Free Tier**: 100 requests/day
- **Coverage**: Nutrition facts, food database
- **Key**: `EXPO_PUBLIC_NUTRITIONIX_API_KEY`
- **Why**: Strong nutrition focus

### 5. Spoonacular API ⭐ MEDIUM PRIORITY
- **Registration**: https://spoonacular.com/food-api
- **Free Tier**: 150 points/day
- **Coverage**: Food products, recipes, nutrition
- **Key**: `EXPO_PUBLIC_SPOONACULAR_API_KEY`
- **Why**: Food-focused, points system

### 6. Best Buy API ⭐ MEDIUM PRIORITY
- **Registration**: https://developer.bestbuy.com/
- **Free Tier**: 5,000 requests/day
- **Coverage**: Electronics products
- **Key**: `EXPO_PUBLIC_BESTBUY_API_KEY`
- **Why**: Electronics focus, generous free tier

### 7. Chomp API
- **Registration**: https://chompthis.com/api/
- **Free Tier**: Limited requests
- **Coverage**: Grocery products, nutrition
- **Key**: `EXPO_PUBLIC_CHOMP_API_KEY`

### 8. FatSecret Platform API
- **Registration**: https://platform.fatsecret.com/api/
- **Free Tier**: Limited requests
- **Coverage**: Food database, nutrition
- **Key**: `EXPO_PUBLIC_FATSECRET_API_KEY`

### 9. Foursquare Places API
- **Registration**: https://developer.foursquare.com/
- **Free Tier**: Limited requests
- **Coverage**: Store locations
- **Key**: `EXPO_PUBLIC_FOURSQUARE_API_KEY`

### 10. REST Countries API (No Key Required)
- **URL**: `https://restcountries.com/v3.1/`
- **Coverage**: Country information
- **Key**: Not required
- **Why**: Could improve country detection

---

## 📊 Current vs. Potential Coverage

### Currently Integrated: 15 APIs
- 12 no-key APIs ✅
- 3 key-required APIs ✅

### Available to Add: 27 APIs
- 10 high/medium priority
- 17 low priority/nice-to-have

### Total Available: 42 FREE APIs

---

## 🚀 Quick Start: Add Top 3 APIs

### Step 1: Register for API Keys
1. UPC Database: https://www.upcdatabase.com/api
2. Edamam: https://developer.edamam.com/
3. Barcode Lookup: https://www.barcodelookup.com/api

### Step 2: Add to .env
```env
EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_key_here
EXPO_PUBLIC_EDAMAM_APP_ID=your_app_id_here
EXPO_PUBLIC_EDAMAM_APP_KEY=your_app_key_here
EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_key_here
```

### Step 3: Integration
- Create service files (similar to existing APIs)
- Add to `productService.ts` Tier 3 parallel queries
- Test and verify

---

## 📝 All Free APIs Summary

See `FREE_API_KEYS_COMPREHENSIVE_LIST.md` for complete details on all 42 APIs.

