# Complete API Keys Guide - How to Get All Missing Keys

**Date:** December 20, 2024  
**Status:** All API keys are currently missing - this guide provides step-by-step instructions to obtain them

---

## Executive Summary

### Current Status
- **Configured:** 0/14 API keys
- **Working:** 0/0 (none configured)
- **Missing:** 14 API keys
- **Failed:** 0 (none configured to test)

### Priority Breakdown
- **High Priority:** 1 database (USDA)
- **Medium Priority:** 6 databases
- **Low Priority:** 7 databases

---

## Complete API Key Inventory

### Tier 2: Local-First & Gold Standard

#### 1. USDA FoodData Central ⭐ HIGH PRIORITY

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_USDA_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://fdc.nal.usda.gov/api-key-signup
2. Fill out the registration form:
   - Name
   - Email address
   - Brief description of intended use
3. Submit the form
4. Receive API key via email
5. Add to `.env` file: `EXPO_PUBLIC_USDA_API_KEY=your_key_here`

**Free Tier Limits:** Unlimited (completely free)

**Cost:** Free

**Why It's Important:**
- Official US nutritional data
- Comprehensive nutrition information for US branded foods
- High reliability (90% for US products)
- Critical for US users

**Registration URL:** https://fdc.nal.usda.gov/api-key-signup

---

#### 2. GS1 DataSource

**Status:** ❌ **NOT CONFIGURED** (but uses free Digital Link service)

**Environment Variables:**
- `EXPO_PUBLIC_GS1_API_KEY` (optional - free Digital Link works without key)

**Free Tier:** ✅ **YES - 60-day free trial** (then paid subscription)

**How to Get (Optional - Free Digital Link Available):**
1. **Option 1: Use Free Digital Link (No Key Needed)**
   - Current implementation uses free GS1 Digital Link service
   - No API key required
   - Works for products with GS1 Digital Links
   - **Recommendation:** Keep using free Digital Link (no action needed)

2. **Option 2: Get 60-Day Free Trial**
   - Visit: https://store.gs1us.org/view-use-api-trial/p
   - Click "Add to Cart"
   - Complete registration
   - Receive API key after approval
   - Add to `.env`: `EXPO_PUBLIC_GS1_API_KEY=your_key_here`

**Free Tier Limits:** 60-day free trial

**Cost:** Free trial, then $6,500+ subscription

**Why It's Optional:**
- Current implementation uses free Digital Link (no key needed)
- Paid subscription is expensive ($6,500+)
- Free Digital Link works for many products
- **Recommendation:** Skip unless you need official barcode verification

**Registration URL:** https://store.gs1us.org/view-use-api-trial/p

---

#### 3. Tesco Labs ⚠️ DISCONTINUED

**Status:** ❌ **SERVICE DISCONTINUED**

**Environment Variables:**
- `EXPO_PUBLIC_TESCO_API_KEY`

**Free Tier:** ❌ **NO - Service Discontinued**

**Status:** Tesco Labs API has been discontinued as of December 2025. The service is no longer available.

**Action:** Remove from codebase or mark as unavailable

**Registration URL:** N/A - Service discontinued

---

#### 4. Walmart Open API

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_WALMART_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://developer.walmart.com/
2. Sign up for developer account
3. Complete registration
4. Get API key from dashboard
5. Add to `.env`: `EXPO_PUBLIC_WALMART_API_KEY=your_key_here`

**Free Tier Limits:** Varies (check developer portal)

**Cost:** Free

**Why It's Low Priority:**
- US-specific (only useful for US users)
- Store API (not comprehensive nutrition database)
- Lower priority than nutrition databases

**Registration URL:** https://developer.walmart.com/

---

#### 5. OpenCorporates

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_OPENCORPORATES_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://opencorporates.com/api_accounts/new
2. Sign up for free plan
3. Get API key from dashboard
4. Add to `.env`: `EXPO_PUBLIC_OPENCORPORATES_API_KEY=your_key_here`

**Free Tier Limits:** 1,000 requests/month (33/day)

**Cost:** Free

**Why It's Low Priority:**
- Not a product database (used for company enrichment)
- Parent-subsidiary relationships only
- Not critical for product scanning

**Registration URL:** https://opencorporates.com/api_accounts/new

---

### Tier 3: Nutrition APIs

#### 6. Edamam ⭐ MEDIUM PRIORITY

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_EDAMAM_APP_ID`
- `EXPO_PUBLIC_EDAMAM_APP_KEY`

**Free Tier:** ✅ **YES - FREE** (with attribution)

**How to Get:**
1. Visit: https://developer.edamam.com/signup
2. Create account
3. Select "Food Database API"
4. Choose "Free Trial" plan
5. Get App ID and App Key from dashboard
6. Add to `.env`:
   ```
   EXPO_PUBLIC_EDAMAM_APP_ID=your_app_id
   EXPO_PUBLIC_EDAMAM_APP_KEY=your_app_key
   ```

**Free Tier Limits:** 10,000 requests/month

**Cost:** Free (attribution required - must display "Powered by Edamam" badge)

**Attribution Required:** Yes - must display "Powered by Edamam" badge
- Badge URL: https://developer.edamam.com/attribution
- Implementation guidelines available on Edamam website

**Why It's Medium Priority:**
- Good nutrition data
- Free tier with reasonable limits
- Requires attribution (may affect UI)

**Registration URL:** https://developer.edamam.com/signup

---

#### 7. Nutritionix ⭐ MEDIUM PRIORITY

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_NUTRITIONIX_APP_ID`
- `EXPO_PUBLIC_NUTRITIONIX_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://developer.nutritionix.com
2. Click "Sign Up"
3. Create account with email and password
4. Fill in developer information
5. Navigate to "Applications" section
6. Create new application
7. Get App ID and API Key
8. Add to `.env`:
   ```
   EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
   EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
   ```

**Free Tier Limits:** 100 requests/day

**Cost:** Free

**Why It's Medium Priority:**
- Good nutrition data
- Free tier available
- Limited to 100 requests/day (may need rate limiting)

**Registration URL:** https://developer.nutritionix.com

---

#### 8. Spoonacular ⭐ MEDIUM PRIORITY

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_SPOONACULAR_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://spoonacular.com/food-api
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env`: `EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key_here`

**Free Tier Limits:** 150 points/day (points-based system)

**Cost:** Free

**Why It's Medium Priority:**
- Good food and recipe data
- Points-based system (each request costs points)
- Free tier with reasonable limits

**Registration URL:** https://spoonacular.com/food-api

---

### Tier 4: Fallback Databases

#### 9. EAN-Search ⭐ MEDIUM PRIORITY

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_EAN_SEARCH_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://www.ean-search.org/ean-database-api.html
2. Register for account
3. Complete registration form
4. Confirm email address (check inbox for confirmation link)
5. Log in to account dashboard
6. Get API key from dashboard
7. Add to `.env`: `EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_key_here`

**Free Tier Limits:** Unlimited light use

**Cost:** Free

**Why It's Medium Priority:**
- Large database (1B+ products)
- Free tier available
- Good fallback database

**Registration URL:** https://www.ean-search.org/ean-database-api.html

---

#### 10. UPC Database

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_UPC_DATABASE_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://www.upcdatabase.com/api
2. Register for free account
3. Get API key from account
4. Add to `.env`: `EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_key_here`

**Free Tier Limits:** 100 lookups/day

**Cost:** Free

**Why It's Medium Priority:**
- Good database (4.3M+ products)
- Free tier available
- Limited to 100/day (may need rate limiting)

**Registration URL:** https://www.upcdatabase.com/api

---

#### 11. Barcode Lookup

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY`

**Free Tier:** ✅ **YES - FREE TEST ACCOUNT**

**How to Get:**
1. Visit: https://www.barcodelookup.com/api
2. Sign up for free test account
3. Get API key
4. Add to `.env`: `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_key_here`

**Free Tier Limits:** 100 lookups/day (free test)

**Cost:** Free test, then $99+/month for paid plans

**Why It's Low Priority:**
- Free test account available
- Paid plans are expensive ($99+/month)
- Other free alternatives available

**Registration URL:** https://www.barcodelookup.com/api

---

#### 12. Barcode Lookup Com

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `BARCODE_LOOKUP_API_KEY` (note: different env var name)

**Free Tier:** ✅ **YES - FREE TEST ACCOUNT**

**How to Get:**
1. Visit: https://www.barcodelookup.com/api
2. Sign up for free test account
3. Get API key
4. Add to `.env`: `BARCODE_LOOKUP_API_KEY=your_key_here`

**Free Tier Limits:** 100 lookups/day (free test)

**Cost:** Free test, then $99+/month

**Why It's Low Priority:**
- Same service as Barcode Lookup (duplicate)
- Consider removing one

**Registration URL:** https://www.barcodelookup.com/api

---

#### 13. Best Buy

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_BESTBUY_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://developer.bestbuy.com/
2. Click "Get API Key"
3. Register and provide accurate information
4. Review and agree to Terms of Service: https://developer.bestbuy.com/legal
5. Get API key after registration
6. Add to `.env`: `EXPO_PUBLIC_BESTBUY_API_KEY=your_key_here`

**Free Tier Limits:** 5,000 requests/day (max 5 calls/second)

**Cost:** Free

**Why It's Low Priority:**
- Electronics only (not food products)
- Smart selection already skips for non-electronics
- Only useful for tech/electronics products

**Registration URL:** https://developer.bestbuy.com/

**Terms of Service:** https://developer.bestbuy.com/legal

---

#### 14. EANData

**Status:** ❌ **NOT CONFIGURED**

**Environment Variables:**
- `EXPO_PUBLIC_EANDATA_API_KEY`

**Free Tier:** ✅ **YES - FREE**

**How to Get:**
1. Visit: https://eandata.com/register
2. Register for account
3. Get API key after registration
4. Add to `.env`: `EXPO_PUBLIC_EANDATA_API_KEY=your_key_here`

**Free Tier Limits:** 100/day (light use)

**Cost:** Free

**Why It's Low Priority:**
- Fallback database
- Limited free tier (100/day)
- Other alternatives available

**Registration URL:** https://eandata.com/register

---

## Quick Reference: All API Keys

| Database | Env Variable | Free Tier | Limits | Cost | Priority | Status |
|----------|--------------|-----------|--------|------|----------|--------|
| **USDA** | `EXPO_PUBLIC_USDA_API_KEY` | ✅ Yes | Unlimited | Free | ⭐ High | ❌ Missing |
| **EAN-Search** | `EXPO_PUBLIC_EAN_SEARCH_API_KEY` | ✅ Yes | Unlimited light | Free | ⭐ Medium | ❌ Missing |
| **UPC Database** | `EXPO_PUBLIC_UPC_DATABASE_API_KEY` | ✅ Yes | 100/day | Free | ⭐ Medium | ❌ Missing |
| **Edamam** | `EXPO_PUBLIC_EDAMAM_APP_ID` + `APP_KEY` | ✅ Yes | 10K/month | Free* | ⭐ Medium | ❌ Missing |
| **Nutritionix** | `EXPO_PUBLIC_NUTRITIONIX_APP_ID` + `API_KEY` | ✅ Yes | 100/day | Free | ⭐ Medium | ❌ Missing |
| **Spoonacular** | `EXPO_PUBLIC_SPOONACULAR_API_KEY` | ✅ Yes | 150 points/day | Free | ⭐ Medium | ❌ Missing |
| **Barcode Lookup** | `EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY` | ✅ Yes | 100/day | Free test | Low | ❌ Missing |
| **Barcode Lookup Com** | `BARCODE_LOOKUP_API_KEY` | ✅ Yes | 100/day | Free test | Low | ❌ Missing |
| **Best Buy** | `EXPO_PUBLIC_BESTBUY_API_KEY` | ✅ Yes | 5K/day | Free | Low | ❌ Missing |
| **EANData** | `EXPO_PUBLIC_EANDATA_API_KEY` | ✅ Yes | 100/day | Free | Low | ❌ Missing |
| **Walmart** | `EXPO_PUBLIC_WALMART_API_KEY` | ✅ Yes | Varies | Free | Low | ❌ Missing |
| **OpenCorporates** | `EXPO_PUBLIC_OPENCORPORATES_API_KEY` | ✅ Yes | 1K/month | Free | Low | ❌ Missing |
| **GS1** | `EXPO_PUBLIC_GS1_API_KEY` | ✅ Trial | 60-day trial | Free trial | Low | ⚠️ Optional |
| **Tesco** | `EXPO_PUBLIC_TESCO_API_KEY` | ❌ No | N/A | N/A | Low | ❌ Discontinued |

*Edamam requires attribution (must display "Powered by Edamam" badge)

---

## Step-by-Step Registration Guide

### High Priority (Do First)

#### 1. USDA FoodData Central

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://fdc.nal.usda.gov/api-key-signup
2. Fill out form:
   - Name
   - Email
   - Description: "Mobile app for food product scanning and nutrition information"
3. Submit form
4. Check email for API key
5. Add to `.env`:
   ```
   EXPO_PUBLIC_USDA_API_KEY=your_key_from_email
   ```

**Expected Result:** API key received via email within minutes

---

### Medium Priority (Do Next)

#### 2. EAN-Search

**Time Required:** 10 minutes (includes email confirmation)

**Steps:**
1. Go to: https://www.ean-search.org/ean-database-api.html
2. Click "Register" or "Sign Up"
3. Fill out registration form
4. Confirm email (check inbox)
5. Log in to dashboard
6. Copy API key
7. Add to `.env`:
   ```
   EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_key_from_dashboard
   ```

**Expected Result:** API key available in dashboard after email confirmation

---

#### 3. UPC Database

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://www.upcdatabase.com/api
2. Register for account
3. Get API key from account page
4. Add to `.env`:
   ```
   EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_key_from_account
   ```

**Expected Result:** API key available immediately after registration

---

#### 4. Edamam

**Time Required:** 10 minutes

**Steps:**
1. Go to: https://developer.edamam.com/signup
2. Create account
3. Select "Food Database API"
4. Choose "Free Trial" plan
5. Get App ID and App Key from dashboard
6. Add to `.env`:
   ```
   EXPO_PUBLIC_EDAMAM_APP_ID=your_app_id
   EXPO_PUBLIC_EDAMAM_APP_KEY=your_app_key
   ```
7. **IMPORTANT:** Add "Powered by Edamam" badge to app (required for free tier)
   - Badge URL: https://developer.edamam.com/attribution

**Expected Result:** App ID and App Key available in dashboard

**Attribution Required:** Yes - must display badge in app

---

#### 5. Nutritionix

**Time Required:** 10 minutes

**Steps:**
1. Go to: https://developer.nutritionix.com
2. Click "Sign Up"
3. Create account (email + password)
4. Fill in developer information
5. Go to "Applications" section
6. Create new application
7. Get App ID and API Key
8. Add to `.env`:
   ```
   EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_app_id
   EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_api_key
   ```

**Expected Result:** App ID and API Key available in Applications section

---

#### 6. Spoonacular

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://spoonacular.com/food-api
2. Sign up for free account
3. Get API key from dashboard
4. Add to `.env`:
   ```
   EXPO_PUBLIC_SPOONACULAR_API_KEY=your_key_from_dashboard
   ```

**Expected Result:** API key available in dashboard

---

### Low Priority (Optional)

#### 7. Barcode Lookup

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://www.barcodelookup.com/api
2. Sign up for free test account
3. Get API key
4. Add to `.env`:
   ```
   EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_test_key
   ```

**Note:** Free test account has 100/day limit. Paid plans start at $99/month.

---

#### 8. Best Buy

**Time Required:** 10 minutes

**Steps:**
1. Go to: https://developer.bestbuy.com/
2. Click "Get API Key"
3. Register and provide information
4. Read and agree to Terms of Service
5. Get API key
6. Add to `.env`:
   ```
   EXPO_PUBLIC_BESTBUY_API_KEY=your_key
   ```

**Note:** Only useful for electronics/tech products. Smart selection already skips for food products.

---

#### 9. EANData

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://eandata.com/register
2. Register for account
3. Get API key
4. Add to `.env`:
   ```
   EXPO_PUBLIC_EANDATA_API_KEY=your_key
   ```

---

#### 10. Walmart Open API

**Time Required:** 10 minutes

**Steps:**
1. Go to: https://developer.walmart.com/
2. Sign up for developer account
3. Get API key from dashboard
4. Add to `.env`:
   ```
   EXPO_PUBLIC_WALMART_API_KEY=your_key
   ```

---

#### 11. OpenCorporates

**Time Required:** 5 minutes

**Steps:**
1. Go to: https://opencorporates.com/api_accounts/new
2. Sign up for free plan
3. Get API key
4. Add to `.env`:
   ```
   EXPO_PUBLIC_OPENCORPORATES_API_KEY=your_key
   ```

**Note:** Not a product database - used for company enrichment only.

---

## API Keys That Cannot Be Obtained

### 1. Tesco Labs API
- **Status:** ❌ **DISCONTINUED**
- **Reason:** Service discontinued as of December 2025
- **Action:** Remove from codebase or mark as unavailable
- **Alternative:** None (UK-specific store API)

---

## Summary of Missing Keys

### High Priority (1 key)
1. ❌ **USDA FoodData Central** - Get this first!

### Medium Priority (6 keys)
2. ❌ **EAN-Search** - Large database, free tier
3. ❌ **UPC Database** - Good fallback, free tier
4. ❌ **Edamam** - Good nutrition data (requires attribution)
5. ❌ **Nutritionix** - Good nutrition data
6. ❌ **Spoonacular** - Good food data

### Low Priority (7 keys)
7. ❌ **Barcode Lookup** - Free test available
8. ❌ **Barcode Lookup Com** - Same as above (duplicate)
9. ❌ **Best Buy** - Electronics only
10. ❌ **EANData** - Fallback database
11. ❌ **Walmart** - US store API
12. ❌ **OpenCorporates** - Company enrichment only
13. ⚠️ **GS1** - Optional (free Digital Link works without key)

### Discontinued (1 service)
14. ❌ **Tesco Labs** - Service no longer available

---

## Recommended Registration Order

### Phase 1: Critical (Do Immediately)
1. **USDA** - High priority, free, unlimited
   - Time: 5 minutes
   - Impact: High (US users)

### Phase 2: Important (Do Soon)
2. **EAN-Search** - Large database, free
   - Time: 10 minutes
   - Impact: Medium (fallback database)
3. **UPC Database** - Good fallback, free
   - Time: 5 minutes
   - Impact: Medium (fallback database)

### Phase 3: Enhancement (Do When Time Permits)
4. **Edamam** - Good nutrition data (requires attribution)
   - Time: 10 minutes
   - Impact: Medium (nutrition enhancement)
5. **Nutritionix** - Good nutrition data
   - Time: 10 minutes
   - Impact: Medium (nutrition enhancement)
6. **Spoonacular** - Good food data
   - Time: 5 minutes
   - Impact: Medium (food data)

### Phase 4: Optional (Low Priority)
7-13. Other databases (low priority, optional)

---

## After Getting API Keys

### 1. Add to `.env` File

Create or update `.env` file in project root:

```env
# High Priority
EXPO_PUBLIC_USDA_API_KEY=your_usda_key_here

# Medium Priority
EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_ean_search_key
EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_upc_database_key
EXPO_PUBLIC_EDAMAM_APP_ID=your_edamam_app_id
EXPO_PUBLIC_EDAMAM_APP_KEY=your_edamam_app_key
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_nutritionix_api_key
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key

# Low Priority (optional)
EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_barcode_lookup_key
EXPO_PUBLIC_BESTBUY_API_KEY=your_bestbuy_key
EXPO_PUBLIC_EANDATA_API_KEY=your_eandata_key
EXPO_PUBLIC_WALMART_API_KEY=your_walmart_key
EXPO_PUBLIC_OPENCORPORATES_API_KEY=your_opencorporates_key
```

### 2. Test API Keys

Run the test script to verify keys work:
```bash
npx ts-node scripts/testAPIKeysComprehensive.ts
```

### 3. Rebuild App

After adding keys, rebuild the app:
```bash
npm run build
# or
eas build
```

---

## Special Notes

### Edamam Attribution Requirement

If you use Edamam API, you **MUST** display the "Powered by Edamam" badge:
- Badge URL: https://developer.edamam.com/attribution
- Implementation guidelines: https://developer.edamam.com/attribution
- **This is required for free tier compliance**

### GS1 Digital Link (No Key Needed)

Current implementation uses **free GS1 Digital Link service** which doesn't require an API key. The paid GS1 API key is optional and expensive ($6,500+). **Recommendation:** Keep using free Digital Link (no action needed).

### Tesco Labs Discontinued

Tesco Labs API has been discontinued. Consider removing from codebase or marking as unavailable.

---

## Estimated Time to Get All Keys

- **High Priority (1 key):** 5 minutes
- **Medium Priority (6 keys):** 50 minutes
- **Low Priority (7 keys):** 50 minutes
- **Total:** ~2 hours to get all keys

**Recommendation:** Start with high and medium priority keys (1 hour), then add low priority keys as needed.

---

## Next Steps

1. **Get USDA API key first** (5 minutes, high priority)
2. **Get EAN-Search and UPC Database keys** (15 minutes, medium priority)
3. **Get nutrition API keys** (Edamam, Nutritionix, Spoonacular) - 25 minutes
4. **Test all keys** using test script
5. **Add keys to `.env` file**
6. **Rebuild app**

---

**End of Guide**
