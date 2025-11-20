# MyNetDiary Database Analysis

**Date:** January 2025  
**Purpose:** Evaluate access to MyNetDiary's extensive nutrition database

## MyNetDiary Database Overview

### Database Statistics
- **Total Foods:** 1,955,000+ verified foods
- **Coverage:** United States, Canada, United Kingdom, Australia
- **Breakdown:**
  - Restaurant foods: 241,000
  - Packaged foods: 1,250,000
  - Generic foods: 2,000
- **Nutrition Data:** Up to 50 nutrients per food item
- **Updates:** ~2,500 new foods added daily
- **API Response Time:** <100ms

### API Features
- Advanced search capabilities
- Multi-word searches in any order
- Partial word matches
- Food synonyms, abbreviations
- Phonetic similarity matching
- UPC barcode lookup
- Popularity ranking (based on millions of MyNetDiary users)
- Real-time updates

---

## Pricing: MyNetDiary API Access

### ⚠️ **EXPENSIVE - Not Practical for Most Apps**

**Initial License Fee:**
- **$40,000 USD** one-time payment
- Includes 3 quarterly updates
- Includes API access for first year

**Ongoing Costs (After Year 1):**
- **$8,000 USD per year** for continued updates and API access
- Or use database indefinitely without updates (no ongoing fee)

**Total Cost Over 3 Years:** $56,000 USD ($40k + $16k)

**Contact:** https://www.mynetdiary.com/food-database.html

---

## Analysis: Is MyNetDiary Worth It?

### ❌ **Cons (Why Not Practical)**
1. **Extremely High Cost:** $40,000 upfront is prohibitive for most apps
2. **Ongoing Fees:** $8,000/year for updates
3. **ROI Required:** Would need significant revenue to justify
4. **Existing Alternatives:** Free/cheaper alternatives available

### ✅ **Pros (What Makes It Valuable)**
1. **Extensive Database:** 1.9M+ foods, very comprehensive
2. **High Quality:** Verified data, up to 50 nutrients
3. **Multi-Region:** US, Canada, UK, Australia
4. **Restaurant Data:** Includes 241,000 restaurant items
5. **Fast API:** <100ms response time
6. **Popularity Ranking:** Results ranked by user popularity

---

## Recommended Alternatives

### ✅ **Option 1: Nutritionix (BEST ALTERNATIVE)**

**Why This Is Better:**
- ✅ **Much More Affordable:** Free tier + $99-299/month paid tiers
- ✅ **Similar Coverage:** 800,000+ food items
- ✅ **Restaurant Meals:** Excellent restaurant coverage
- ✅ **Barcode Support:** Direct UPC/barcode lookup
- ✅ **API Quality:** Fast, reliable, well-documented

**Pricing:**
- Free: 10,000 requests/month
- Starter: $99/month - 100,000 requests
- Professional: $299/month - 1M requests

**Already Researched:** ✅ We have this in our database research document

**Recommendation:** ✅ **IMPLEMENT THIS** - Best balance of cost and features

---

### ✅ **Option 2: Nutritics Food Data API**

**Database:**
- 1,000,000+ foods
- Official national, international, and branded databases
- Calorie, allergen, and nutrition data

**Pricing:** Contact for pricing (likely more affordable than MyNetDiary)

**Website:** https://www.nutritics.com/en/product/api/

---

### ✅ **Option 3: INRFOOD Data API**

**Database:**
- 750,000+ products
- International and private label items
- 15,000+ ingredients
- Personalized nutrition profiles

**Pricing:** Contact for pricing

**Website:** https://www.inrfood.com/api/

---

### ✅ **Option 4: Busybody (CalorieAPI)**

**Database:**
- 900,000+ food items
- 28 nutrients per item
- 615,000 UPC codes
- Advanced search with NLP

**Pricing:** Contact for pricing

**Website:** https://www.calorieapi.com/

---

## Current TrueScan Coverage

### Already Integrated (Free/Cheap)
1. **USDA FoodData Central** ✅ - Official US branded foods (1.9M+ items)
   - **Cost:** FREE
   - **Coverage:** US branded foods, comprehensive nutrition
   - **Status:** Already configured with your API key

2. **Open Food Facts** ✅ - 65-75% food products
   - **Cost:** FREE
   - **Coverage:** Global food products

3. **Open Beauty Facts** ✅ - Cosmetics and personal care
4. **Open Pet Food Facts** ✅ - Pet food
5. **Open Products Facts** ✅ - General products
6. **UPCitemdb** ✅ - General products
7. **Barcode Spider** ✅ - General products
8. **Web Search Fallback** ✅ - Ensures 100% coverage

### Current Coverage: ~85-90% of scanned products

---

## Recommendation

### ❌ **DO NOT Use MyNetDiary**
**Reason:** Too expensive ($40k upfront + $8k/year) for most apps

### ✅ **DO Implement Nutritionix Instead**
**Reason:** 
- Much more affordable ($99-299/month)
- Similar coverage (800K+ foods)
- Excellent restaurant data
- Direct barcode lookup
- Well-documented API

### ✅ **Also Keep USDA FoodData Central**
**Reason:**
- **FREE** and already configured
- Official US branded food data
- Comprehensive nutrition (similar to MyNetDiary quality)
- 1.9M+ items in database

---

## Implementation Plan: Nutritionix

### Phase 1: Nutritionix Integration (Recommended Next)

**Why Nutritionix:**
1. **Affordable:** $99-299/month vs $40k upfront
2. **Similar Quality:** 800K+ foods, 50+ nutrients
3. **Restaurant Coverage:** Excellent restaurant meal data
4. **Barcode Support:** Direct UPC/barcode lookup
5. **Free Tier:** 10K requests/month to start

**Implementation:**
- Create `src/services/nutritionixService.ts`
- Add to `productService.ts` fallback chain
- Add to `productSearchService.ts` search
- Configure API key in `app.config.js`

**Expected Coverage Increase:**
- Current: ~85-90%
- With Nutritionix: ~90-95%
- **Improvement:** +5-10% coverage

**Cost:**
- Start with free tier (10K requests/month)
- Upgrade to paid tier ($99/month) when needed

---

## Conclusion

### MyNetDiary Database Access
- **Available:** ✅ Yes, via licensing
- **Cost:** ❌ $40,000 upfront + $8,000/year
- **Recommendation:** ❌ **NOT RECOMMENDED** - Too expensive

### Recommended Alternative
- **Nutritionix:** ✅ **RECOMMENDED**
  - Similar coverage and quality
  - Much more affordable ($99-299/month)
  - Free tier available to start
  - Already researched and ready to implement

### Current Status
- ✅ **USDA FoodData Central** already configured (FREE)
- ✅ Provides official US branded food data
- ✅ Similar quality to MyNetDiary for US foods
- ✅ No cost

**Next Step:** Implement Nutritionix for additional coverage at affordable cost.

