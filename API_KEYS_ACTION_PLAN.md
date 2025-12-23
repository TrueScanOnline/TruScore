# API Keys - Complete Action Plan

## Current Status: ALL KEYS MISSING

**Configured:** 0/14  
**Working:** 0/0  
**Missing:** 14  
**Failed:** 0

---

## Quick Start: Get These Keys First

### 1. USDA FoodData Central ⭐ **DO THIS FIRST**

**Time:** 5 minutes  
**Priority:** HIGH  
**Cost:** FREE  
**Limits:** Unlimited

**Get It Now:**
1. Visit: **https://fdc.nal.usda.gov/api-key-signup**
2. Fill form (name, email, description)
3. Submit
4. Check email for key
5. Add to `.env`: `EXPO_PUBLIC_USDA_API_KEY=your_key`

**Why First:** Critical for US users, free, unlimited, high reliability

---

### 2. EAN-Search

**Time:** 10 minutes  
**Priority:** MEDIUM  
**Cost:** FREE  
**Limits:** Unlimited light use

**Get It:**
1. Visit: **https://www.ean-search.org/ean-database-api.html**
2. Register
3. Confirm email
4. Get key from dashboard
5. Add to `.env`: `EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_key`

---

### 3. UPC Database

**Time:** 5 minutes  
**Priority:** MEDIUM  
**Cost:** FREE  
**Limits:** 100/day

**Get It:**
1. Visit: **https://www.upcdatabase.com/api**
2. Register
3. Get key
4. Add to `.env`: `EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_key`

---

### 4. Edamam

**Time:** 10 minutes  
**Priority:** MEDIUM  
**Cost:** FREE (attribution required)  
**Limits:** 10,000/month

**Get It:**
1. Visit: **https://developer.edamam.com/signup**
2. Create account
3. Select "Food Database API"
4. Choose "Free Trial"
5. Get App ID and App Key
6. Add to `.env`:
   ```
   EXPO_PUBLIC_EDAMAM_APP_ID=your_app_id
   EXPO_PUBLIC_EDAMAM_APP_KEY=your_app_key
   ```
7. **Add "Powered by Edamam" badge to app** (required!)
   - Badge: https://developer.edamam.com/attribution

---

### 5. Nutritionix

**Time:** 10 minutes  
**Priority:** MEDIUM  
**Cost:** FREE  
**Limits:** 100/day

**Get It:**
1. Visit: **https://developer.nutritionix.com**
2. Sign up
3. Create application
4. Get App ID and API Key
5. Add to `.env`:
   ```
   EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
   EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
   ```

---

### 6. Spoonacular

**Time:** 5 minutes  
**Priority:** MEDIUM  
**Cost:** FREE  
**Limits:** 150 points/day

**Get It:**
1. Visit: **https://spoonacular.com/food-api**
2. Sign up
3. Get key
4. Add to `.env`: `EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key`

---

## Complete List: All 14 API Keys

| # | Database | Env Variable | Free? | Priority | Registration URL |
|---|----------|--------------|-------|----------|------------------|
| 1 | **USDA** | `EXPO_PUBLIC_USDA_API_KEY` | ✅ | ⭐ **HIGH** | https://fdc.nal.usda.gov/api-key-signup |
| 2 | EAN-Search | `EXPO_PUBLIC_EAN_SEARCH_API_KEY` | ✅ | ⭐ Medium | https://www.ean-search.org/ean-database-api.html |
| 3 | UPC Database | `EXPO_PUBLIC_UPC_DATABASE_API_KEY` | ✅ | ⭐ Medium | https://www.upcdatabase.com/api |
| 4 | Edamam | `EXPO_PUBLIC_EDAMAM_APP_ID` + `APP_KEY` | ✅* | ⭐ Medium | https://developer.edamam.com/signup |
| 5 | Nutritionix | `EXPO_PUBLIC_NUTRITIONIX_APP_ID` + `API_KEY` | ✅ | ⭐ Medium | https://developer.nutritionix.com |
| 6 | Spoonacular | `EXPO_PUBLIC_SPOONACULAR_API_KEY` | ✅ | ⭐ Medium | https://spoonacular.com/food-api |
| 7 | Barcode Lookup | `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY` | ✅ Test | Low | https://www.barcodelookup.com/api |
| 8 | Barcode Lookup Com | `BARCODE_LOOKUP_API_KEY` | ✅ Test | Low | https://www.barcodelookup.com/api |
| 9 | Best Buy | `EXPO_PUBLIC_BESTBUY_API_KEY` | ✅ | Low | https://developer.bestbuy.com/ |
| 10 | EANData | `EXPO_PUBLIC_EANDATA_API_KEY` | ✅ | Low | https://eandata.com/register |
| 11 | Walmart | `EXPO_PUBLIC_WALMART_API_KEY` | ✅ | Low | https://developer.walmart.com/ |
| 12 | OpenCorporates | `EXPO_PUBLIC_OPENCORPORATES_API_KEY` | ✅ | Low | https://opencorporates.com/api_accounts/new |
| 13 | GS1 | `EXPO_PUBLIC_GS1_API_KEY` | ✅ Trial | Low | https://store.gs1us.org/view-use-api-trial/p |
| 14 | Tesco | `EXPO_PUBLIC_TESCO_API_KEY` | ❌ | Low | ❌ **DISCONTINUED** |

*Edamam requires attribution badge

---

## Keys That Cannot Be Obtained

### ❌ Tesco Labs API
- **Status:** Service discontinued December 2025
- **Action:** Remove from codebase
- **Reason:** Service no longer available

---

## Estimated Time to Get All Keys

- **High Priority (1 key):** 5 minutes
- **Medium Priority (6 keys):** 50 minutes
- **Low Priority (7 keys):** 50 minutes
- **Total:** ~2 hours for all keys

**Recommended:** Get high + medium priority keys first (1 hour), then add low priority as needed.

---

## After Getting Keys

### Step 1: Add to `.env`

Create/update `.env` file:

```env
# High Priority
EXPO_PUBLIC_USDA_API_KEY=your_key_here

# Medium Priority
EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_key_here
EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_key_here
EXPO_PUBLIC_EDAMAM_APP_ID=your_app_id
EXPO_PUBLIC_EDAMAM_APP_KEY=your_app_key
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key_here
```

### Step 2: Test Keys

```bash
npx ts-node scripts/testAPIKeysComprehensive.ts
```

### Step 3: Rebuild App

```bash
npm run build
```

---

## Summary

**All 14 API keys are missing.** However:
- ✅ **13 keys have free tiers available**
- ✅ **1 key (Tesco) is discontinued** (cannot get)
- ✅ **All can be obtained in ~2 hours**

**Start with USDA (5 minutes), then get medium priority keys (50 minutes).**

---

**For detailed step-by-step instructions, see:** `API_KEYS_COMPLETE_GUIDE.md`
