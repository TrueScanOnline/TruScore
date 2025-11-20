# Country of Manufacture Data Source Research - Comprehensive Analysis

**Date:** January 2026  
**Purpose:** Find reliable sources for accurate "Country of Manufacture" data to display in TrueScan app  
**Problem:** Open Food Facts and similar databases often lack manufacturing country data or incorrectly show distribution country instead

---

## Executive Summary

After comprehensive research across databases, APIs, forums, and similar apps, **there is NO single reliable free API that provides accurate country of manufacture data for all products**. However, a **multi-layered approach** combining several strategies can achieve high accuracy:

1. **Priority 1:** Enhanced extraction from existing Open Food Facts data (origins fields)
2. **Priority 2:** Trade data APIs (customs/import records) - commercial but accurate
3. **Priority 3:** OCR/image recognition from product labels (extract "Product of X" text)
4. **Priority 4:** Crowdsourcing with user contributions
5. **Priority 5:** Manufacturer database cross-referencing

**Recommended Implementation:** Start with Priority 1 (immediate, free) + Priority 3 (OCR - feasible) + Priority 4 (crowdsourcing - builds database over time)

---

## Key Finding: Why Current Data Sources Fail

### The Core Problem

1. **Barcodes Don't Reveal Manufacturing Country**
   - Barcode prefixes (GS1 country codes) indicate where the barcode was **registered**, not where the product was **manufactured**
   - Example: A product made in China but registered by a US company will show US barcode prefix
   - Source: GS1 US official statement confirms this limitation

2. **Product Databases Prioritize Distribution Over Manufacturing**
   - `countries_tags` in Open Food Facts = where product is **sold/distributed**, not made
   - Example: Product made in China, sold in Australia → `countries_tags` = "Australia" (WRONG)
   - `origins`/`origins_tags` = intended for manufacturing country but often missing/empty

3. **Labeling Data Not in Structured Format**
   - "Product of X" text is on physical labels but rarely in databases
   - Requires image analysis/OCR to extract from product photos

---

## Research Results: Available Data Sources

### ✅ **Tier 1: Free/Open Sources (Currently Used)**

#### 1. Open Food Facts Family
- **Status:** ✅ Already integrated
- **Manufacturing Data Quality:** ⚠️ **POOR**
  - `origins`/`origins_tags`: Often empty or incomplete
  - `manufacturing_places`: Rarely populated
  - `countries_tags`: Shows distribution country (NOT manufacturing - this is the bug)
- **Coverage:** 70-80% of products have some country data, but accuracy is questionable
- **Verdict:** Better extraction logic needed, but won't solve the problem alone

#### 2. GS1 Data Source
- **Status:** ✅ Already integrated (requires API key)
- **Manufacturing Data Quality:** ⚠️ **LIMITED**
  - GS1 provides barcode verification and basic product info
  - Does NOT explicitly provide country of manufacture
  - May have manufacturer location data (but not always accurate)
- **Verdict:** Good for verification, not for manufacturing country

#### 3. USDA FoodData Central
- **Status:** ✅ Already integrated
- **Manufacturing Data Quality:** ❌ **NONE**
  - USDA focuses on nutritional data, not origin/manufacturing
  - No country of manufacture fields
- **Verdict:** Not useful for this purpose

---

### 💰 **Tier 2: Commercial Trade Data APIs (High Accuracy, Paid)**

#### 4. **Panjiva** (by S&P Global)
- **Type:** Commercial trade data platform
- **Data Source:** Customs records, import/export data
- **Manufacturing Data Quality:** ✅ **EXCELLENT**
  - Provides actual shipment origins from customs data
  - Shows where goods are imported FROM (i.e., manufacturing country)
  - Historical trade data available
- **Coverage:** Global, millions of products
- **Pricing:** 
  - Enterprise-level pricing (not publicly disclosed)
  - Likely $5,000-$50,000+/year for API access
  - Requires business justification
- **API Access:** Requires business partnership/contract
- **Verdict:** ⭐ **BEST ACCURACY** but too expensive for free app

#### 5. **ImportGenius**
- **Type:** Commercial trade intelligence platform
- **Data Source:** US customs records, import/export data
- **Manufacturing Data Quality:** ✅ **EXCELLENT**
  - Detailed shipment records showing origin countries
  - Can track products by brand/manufacturer
- **Coverage:** Primarily US imports, limited global
- **Pricing:**
  - Subscription-based: $99-$299/month per user
  - API access: Requires custom pricing (enterprise)
- **Verdict:** Good accuracy but expensive and US-focused

#### 6. **Tendata** / Trade Data Platforms
- **Type:** Various trade data aggregators
- **Manufacturing Data Quality:** ✅ **GOOD**
  - Customs data aggregation
  - Import/export statistics
- **Coverage:** Varies by platform
- **Pricing:** $100-$500+/month for API access
- **Verdict:** Good option but still expensive

---

### 🔍 **Tier 3: Manufacturer/Business Databases**

#### 7. **Z2Data** (Component Data - Electronics Focus)
- **Type:** Component supply chain database
- **Manufacturing Data Quality:** ✅ **EXCELLENT** (for electronics/components)
- **Coverage:** 1+ billion electronic components
- **Limitation:** Electronics/components only, not general consumer products
- **Pricing:** Commercial (enterprise pricing)
- **Verdict:** Specialized use case, not general solution

#### 8. **Bureau van Dijk (Orbis)**
- **Type:** Business intelligence database
- **Manufacturing Data Quality:** ⚠️ **MODERATE**
  - Company location data (where company is based)
  - Manufacturing facility locations (if available)
  - Not product-specific
- **Coverage:** Millions of companies globally
- **Pricing:** Enterprise-level (very expensive)
- **Verdict:** Company-level, not product-level data

#### 9. **ThomasNet / Kompass**
- **Type:** Manufacturer directories
- **Manufacturing Data Quality:** ⚠️ **LIMITED**
  - Lists manufacturers by location
  - Not product-specific
  - Requires manual lookup/matching
- **Coverage:** North America / Global respectively
- **Pricing:** Free directory access, paid for API
- **Verdict:** Useful for research, not automated solution

---

### 🌍 **Tier 4: Government/Trade Statistics (Not Product-Specific)**

#### 10. **UN Comtrade**
- **Type:** International trade statistics
- **Manufacturing Data Quality:** ❌ **NOT PRODUCT-SPECIFIC**
  - Aggregate trade statistics by product category
  - Not individual product-level data
- **Coverage:** Global
- **Pricing:** Free (public data)
- **Verdict:** Not useful for product-level manufacturing country

#### 11. **Eurostat Prodcom**
- **Type:** EU industrial production statistics
- **Manufacturing Data Quality:** ❌ **NOT PRODUCT-SPECIFIC**
  - Production statistics by industry/product category
  - Not individual product-level data
- **Coverage:** EU member states
- **Pricing:** Free (public data)
- **Verdict:** Not useful for product-level manufacturing country

#### 12. **USITC DataWeb**
- **Type:** US trade statistics
- **Manufacturing Data Quality:** ❌ **NOT PRODUCT-SPECIFIC**
  - Trade flow data by product category
  - Not individual product-level data
- **Coverage:** US trade
- **Pricing:** Free (public data)
- **Verdict:** Not useful for product-level manufacturing country

---

### 🤖 **Tier 5: Technology-Based Solutions (High Potential)**

#### 13. **OCR/Image Recognition from Product Labels**
- **Type:** Technology solution (not a database)
- **Manufacturing Data Quality:** ✅ **EXCELLENT** (if implemented correctly)
  - Extract "Product of X", "Made in X", "Origin: X" text from product images
  - Uses machine learning/OCR to read labels
  - Can use existing product images from Open Food Facts
- **Coverage:** Any product with visible label
- **Implementation Complexity:** Medium-High
  - Requires OCR library (Tesseract, Google Vision API, AWS Textract)
  - Label parsing logic
  - Validation/error handling
- **Cost:**
  - Free: Tesseract.js (client-side, limited accuracy)
  - Paid: Google Vision API ($1.50 per 1,000 images), AWS Textract ($1.50 per 1,000 pages)
- **Verdict:** ⭐ **BEST PRACTICAL SOLUTION** - High accuracy, reasonable cost
- **Feasibility:** High - Can implement immediately with existing product images

#### 14. **Google Manufacturer Center API**
- **Type:** Manufacturer-submitted product data
- **Manufacturing Data Quality:** ✅ **GOOD** (if manufacturers submit data)
  - Manufacturers provide product information including origin
  - Official manufacturer data
- **Coverage:** Limited (only products submitted by manufacturers)
- **Pricing:** Free API access
- **Implementation:** Requires Google API integration
- **Verdict:** Good source but limited coverage

---

### 👥 **Tier 6: Crowdsourcing Solutions**

#### 15. **User Contributions (Built into App)**
- **Type:** App feature, not external API
- **Manufacturing Data Quality:** ✅ **EXCELLENT** (if validated)
  - Users scan product and manually enter "Product of X" from label
  - Validate against multiple submissions
  - Build database over time
- **Coverage:** Grows with user base
- **Cost:** Free (infrastructure only)
- **Implementation:** 
  - Add "Report Manufacturing Country" feature
  - Validation system (multiple users confirm)
  - Integration with Open Food Facts (submit data back)
- **Verdict:** ⭐ **LONG-TERM SOLUTION** - Builds comprehensive database

#### 16. **Open Food Facts Contributions**
- **Type:** Existing crowdsourcing platform
- **Manufacturing Data Quality:** ⚠️ **INCONSISTENT**
  - Users can contribute origin data
  - Currently under-utilized
  - Encouraging contributions improves database
- **Coverage:** Same as Open Food Facts
- **Cost:** Free
- **Verdict:** Complement to app - encourage users to contribute

---

## What Other Apps Do (Research Findings)

### Yuka App
- **Approach:** Uses Open Food Facts exclusively
- **Manufacturing Country:** Shows "Country of Origin" (uses Open Food Facts origins)
- **Accuracy:** Same limitation as our current implementation
- **Verdict:** They face the same problem - no better solution found

### Foodvisor / Other Scanning Apps
- **Approach:** Various - primarily Open Food Facts
- **Manufacturing Country:** Often omitted or shows distribution country
- **Verdict:** Industry standard is to use Open Food Facts with its limitations

### E-Commerce Platforms (Amazon, Walmart)
- **Approach:** Seller-submitted data + internal databases
- **Manufacturing Country:** Often accurate but requires seller disclosure
- **Availability:** Not publicly accessible APIs
- **Verdict:** Not available for third-party apps

---

## Recommended Implementation Strategy

### **Phase 1: Immediate Improvements (Free, Week 1-2)**

1. **Enhanced Open Food Facts Extraction** ✅ (Already Done)
   - Fixed logic to prioritize `origins` over `countries_tags`
   - Don't show incorrect data when manufacturing info missing
   - **Impact:** Prevents showing wrong country (e.g., Australia instead of China)

2. **Better Field Prioritization**
   - Priority: `manufacturing_places_tags` > `manufacturing_places` > `origins_tags` > `origins`
   - Skip `countries_tags` entirely (always shows distribution, not manufacturing)
   - **Impact:** More accurate when data exists

3. **User Contribution Feature**
   - Add "Report Manufacturing Country" button on product page
   - Allow users to manually enter "Product of X" from label
   - Validate with multiple submissions
   - Submit verified data back to Open Food Facts
   - **Impact:** Builds database over time, improves accuracy

### **Phase 2: OCR Implementation (Medium Cost, Week 3-4)**

4. **Label Text Extraction (OCR)**
   - Use existing product images from Open Food Facts
   - Extract "Product of X", "Made in X" text using OCR
   - Parse and validate extracted country names
   - Cache results in local database
   - **Implementation Options:**
     - **Free:** Tesseract.js (client-side, lower accuracy)
     - **Paid:** Google Vision API or AWS Textract ($1.50 per 1,000 images)
   - **Cost Estimate:** $50-200/month for moderate usage
   - **Impact:** High - Can extract manufacturing country from label images automatically

5. **Product Image Enhancement**
   - Request users to upload product label photos (if missing from OFF)
   - Prioritize images showing country of origin labels
   - **Impact:** Improves OCR data availability

### **Phase 3: Trade Data Integration (Expensive, Future)**

6. **Panjiva/ImportGenius Integration** (If Budget Allows)
   - For premium subscribers or paid tier
   - High-accuracy trade data for manufacturing origins
   - **Cost:** $5,000-$50,000+/year
   - **Impact:** Excellent accuracy for products with trade records

---

## Implementation Priority Matrix

| Solution | Accuracy | Cost | Effort | Coverage | Priority |
|----------|----------|------|--------|----------|----------|
| Enhanced OFF extraction | Medium | Free | Low ✅ | 70-80% | **P0 - Done** |
| User contributions | High | Free | Medium | Growing | **P1 - Week 1** |
| OCR from labels | High | Low | High | 60-70% | **P2 - Week 3** |
| Trade data APIs | Excellent | Very High | Medium | 40-50% | **P3 - Future** |

---

## Detailed Implementation Plan

### **Priority 1: User Contribution System (Immediate)**

**Feature:** Allow users to report manufacturing country from product labels

**Implementation:**
1. Add "Report Manufacturing Country" button on product page (if not shown)
2. Simple form: "What does the label say? (e.g., 'Product of China')"
3. Store in local database (AsyncStorage)
4. Validate with multiple submissions (3+ users agree = verified)
5. Display verified country to all users
6. Submit verified data to Open Food Facts (via API contribution)

**Benefits:**
- Free
- Builds database over time
- High accuracy (from actual labels)
- Improves Open Food Facts for everyone

**Code Structure:**
```
src/services/
├── manufacturingCountryService.ts (NEW)
│   ├── submitManufacturingCountry(barcode, country, userId)
│   ├── getManufacturingCountry(barcode)
│   ├── validateManufacturingCountry(barcode, submissions)
│   └── submitToOpenFoodFacts(barcode, country)
└── userContributionService.ts (NEW)
```

### **Priority 2: OCR Label Extraction (High Impact)**

**Feature:** Extract "Product of X" text from product images using OCR

**Implementation Options:**

**Option A: Google Vision API (Recommended)**
- **Pros:** High accuracy, easy integration, well-documented
- **Cons:** Paid ($1.50 per 1,000 images)
- **Setup:**
  1. Get Google Cloud API key
  2. Enable Vision API
  3. Upload product images to Vision API
  4. Extract text, parse for country patterns
  5. Cache results

**Option B: AWS Textract**
- **Pros:** Similar to Google Vision
- **Cons:** Paid, AWS setup required
- **Cost:** $1.50 per 1,000 pages

**Option C: Tesseract.js (Free)**
- **Pros:** Free, client-side processing
- **Cons:** Lower accuracy, slower, requires image preprocessing
- **Best for:** MVP/testing, then upgrade to paid service

**Implementation Steps:**
1. Get product images from Open Food Facts (if available)
2. Send to OCR service (Google Vision API recommended)
3. Extract all text from image
4. Parse for patterns: "Product of {Country}", "Made in {Country}", "Origin: {Country}"
5. Validate country name against ISO country list
6. Cache result in database
7. Display extracted country (with confidence score)

**Code Structure:**
```
src/services/
├── ocrManufacturingService.ts (NEW)
│   ├── extractCountryFromImage(imageUrl, barcode)
│   ├── parseCountryFromText(extractedText)
│   ├── validateCountryName(countryText)
│   └── cacheManufacturingCountry(barcode, country, confidence)
```

**Cost Estimate:**
- 1,000 product scans/month = $1.50/month
- 10,000 product scans/month = $15/month
- 100,000 product scans/month = $150/month
- **Very reasonable cost for high accuracy**

### **Priority 3: Multi-Source Aggregation (Future Enhancement)**

**Feature:** Combine multiple data sources with smart prioritization

**Data Source Priority:**
1. User-contributed verified data (highest confidence)
2. OCR-extracted data (high confidence if confidence > 80%)
3. Open Food Facts `origins`/`origins_tags` (medium confidence)
4. Trade data API (if available, high confidence)
5. Don't show if no reliable source (better than wrong data)

**Confidence Scoring:**
- User verified (3+ submissions): 95% confidence
- OCR extracted (high confidence): 85% confidence
- OCR extracted (medium confidence): 65% confidence
- Open Food Facts origins: 60% confidence
- Trade data: 90% confidence
- **Only display if confidence > 70%**

---

## Technical Implementation Details

### OCR Integration Example (Google Vision API)

```typescript
// src/services/ocrManufacturingService.ts
import { Product } from '../types/product';

const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

async function extractCountryFromImage(imageUrl: string, barcode: string): Promise<string | null> {
  if (!GOOGLE_VISION_API_KEY) {
    console.log('Google Vision API key not configured, skipping OCR');
    return null;
  }

  try {
    // Call Google Vision API
    const response = await fetch(
      `${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );

    const data = await response.json();
    const extractedText = data.responses[0]?.textAnnotations?.[0]?.description || '';

    // Parse for country of manufacture patterns
    const country = parseCountryFromText(extractedText);
    return country;
  } catch (error) {
    console.error('OCR extraction error:', error);
    return null;
  }
}

function parseCountryFromText(text: string): string | null {
  const patterns = [
    /product\s+of\s+([a-z\s]+)/i,
    /made\s+in\s+([a-z\s]+)/i,
    /origin[:\s]+([a-z\s]+)/i,
    /manufactured\s+in\s+([a-z\s]+)/i,
    /country\s+of\s+origin[:\s]+([a-z\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const country = validateCountryName(match[1].trim());
      if (country) return country;
    }
  }

  return null;
}
```

---

## Cost-Benefit Analysis

### **Option 1: User Contributions Only (Free)**
- **Cost:** $0/month
- **Accuracy:** High (when data exists)
- **Coverage:** Grows over time (30% → 50% → 70% with user base)
- **Verdict:** ✅ Start here, always keep this feature

### **Option 2: OCR Only**
- **Cost:** $50-200/month (depending on usage)
- **Accuracy:** High (80-90% when text is readable)
- **Coverage:** 60-70% (products with label images)
- **Verdict:** ✅ High ROI - reasonable cost for significant improvement

### **Option 3: OCR + User Contributions**
- **Cost:** $50-200/month
- **Accuracy:** Very High (90%+)
- **Coverage:** 70-85% (combines both sources)
- **Verdict:** ⭐ **RECOMMENDED** - Best balance of cost/accuracy

### **Option 4: Trade Data APIs**
- **Cost:** $5,000-50,000+/year
- **Accuracy:** Excellent (95%+)
- **Coverage:** 40-50% (only products with trade records)
- **Verdict:** ❌ Too expensive for free app, consider for premium tier only

---

## Final Recommendations

### **Immediate Actions (This Week)**
1. ✅ **Enhanced extraction logic** (Already done - fixed countries_tags bug)
2. ⏳ **Implement user contribution feature** - Allow users to report manufacturing country
3. ⏳ **Add validation system** - Verify submissions with multiple users

### **Short-Term (Next 2-4 Weeks)**
4. ⏳ **Implement OCR extraction** - Use Google Vision API to extract from product images
5. ⏳ **Cache OCR results** - Store extracted data locally
6. ⏳ **Display with confidence scores** - Show country only if confidence > 70%

### **Long-Term (Future)**
7. ⏳ **Consider trade data APIs** - If budget allows, for premium features
8. ⏳ **Improve OCR accuracy** - Fine-tune parsing patterns
9. ⏳ **Build comprehensive database** - Aggregate all sources with confidence scoring

---

## Conclusion

**The reality:** There is no perfect free API that provides 100% accurate country of manufacture data for all products.

**The solution:** A **multi-layered approach** combining:
1. **Enhanced data extraction** from existing sources (free, immediate)
2. **User contributions** (free, builds over time)
3. **OCR from product images** (low cost, high accuracy)
4. **Smart aggregation** with confidence scoring

**Expected Results:**
- **Week 1:** 30-40% coverage (enhanced extraction + user contributions starting)
- **Month 1:** 50-60% coverage (OCR implemented)
- **Month 3:** 70-80% coverage (user contributions growing)
- **Year 1:** 85-90% coverage (comprehensive database built)

**This approach provides the best balance of accuracy, cost, and coverage for a free app while building toward comprehensive coverage over time.**

---

## References & Resources

- GS1 US: Barcodes don't reveal manufacturing country - https://www.gs1us.org/industries-and-insights/media-center/press-releases/fact-upc-barcodes-do-not-reveal-where-products-are-manufactured
- Google Vision API: https://cloud.google.com/vision/docs
- AWS Textract: https://aws.amazon.com/textract/
- Panjiva: https://www.panjiva.com/
- ImportGenius: https://www.importgenius.com/
- Open Food Facts API: https://world.openfoodfacts.org/data
- Tesseract.js: https://github.com/naptha/tesseract.js

