# Product Geography Data Analysis - Available Information

**Date:** January 2026  
**Purpose:** Comprehensive analysis of geographic/origin data available when scanning barcodes

---

## Question 1: What Geographic/Origin Information is Available?

When a user scans a barcode, the following geographic/origin fields are potentially available from our data sources:

### **Available Fields from Open Food Facts (Primary Source)**

1. **`origins`** (String)
   - **What it represents:** Country of origin/manufacture (where "Product of X" label data goes)
   - **Format:** "China", "France", "United States", etc.
   - **Reliability:** ⚠️ Often empty or incomplete (60-70% missing)
   - **Accuracy:** High when populated (represents actual label data)
   - **Example:** "Product of China" → `origins: "China"`

2. **`origins_tags`** (Array)
   - **What it represents:** Standardized origin country tags
   - **Format:** `["en:china", "en:france"]`
   - **Reliability:** ⚠️ Often empty (60-70% missing)
   - **Accuracy:** High when populated
   - **Note:** This is where "Product of X" label information is stored

3. **`manufacturing_places`** (String)
   - **What it represents:** Where product was manufactured (explicit manufacturing location)
   - **Format:** "China", "Germany", etc.
   - **Reliability:** ❌ Rarely populated (< 10% of products)
   - **Accuracy:** Very high when available (most accurate field)
   - **Note:** Different from origin - this is explicit manufacturing location

4. **`manufacturing_places_tags`** (Array)
   - **What it represents:** Standardized manufacturing place tags
   - **Format:** `["en:china"]`
   - **Reliability:** ❌ Rarely populated (< 10% of products)
   - **Accuracy:** Very high when available

5. **`countries`** (String)
   - **What it represents:** Where product is **SOLD/DISTRIBUTED**, NOT manufactured
   - **Format:** "Australia, New Zealand", "United States, Canada"
   - **Reliability:** ✅ Usually populated (80-90% of products)
   - **Accuracy:** ⚠️ **INCORRECT FOR MANUFACTURING** - This is distribution country
   - **Critical Note:** Using this for "Country of Manufacture" is WRONG
   - **Example:** Product made in China, sold in Australia → `countries: "Australia"` (WRONG for manufacturing)

6. **`countries_tags`** (Array)
   - **What it represents:** Where product is **SOLD**, NOT manufactured
   - **Format:** `["en:australia", "en:new-zealand"]`
   - **Reliability:** ✅ Usually populated (80-90%)
   - **Accuracy:** ⚠️ **INCORRECT FOR MANUFACTURING** - This is distribution country
   - **Critical Note:** Do NOT use this for manufacturing country

### **Available Fields from Other Sources**

7. **USDA FoodData Central**
   - **Geographic Data:** ❌ None available
   - **Focus:** Nutritional data only

8. **GS1 Data Source**
   - **Geographic Data:** ⚠️ Limited
   - **Manufacturer Location:** May have manufacturer company location (where company is based, not necessarily where product is made)
   - **Reliability:** Medium - company location ≠ manufacturing location

9. **UPCitemdb / Barcode Spider**
   - **Geographic Data:** ❌ None available
   - **Focus:** Product name, brand, category only

### **Summary: What We Can Access**

| Field | Represents | Reliability | Accuracy for Manufacturing |
|-------|-----------|-------------|---------------------------|
| `origins` / `origins_tags` | Country of origin/manufacture | ⚠️ Low (60-70% missing) | ✅ High when available |
| `manufacturing_places` / `manufacturing_places_tags` | Manufacturing location | ❌ Very low (<10%) | ✅✅ Very high when available |
| `countries` / `countries_tags` | Distribution/sales country | ✅ High (80-90%) | ❌ **WRONG - Do not use** |

**Current Implementation Priority:**
1. `manufacturing_places_tags` (most accurate, rarely available)
2. `manufacturing_places` (accurate, rarely available)
3. `origins_tags` (accurate when available, often missing)
4. `origins` (accurate when available, often missing)
5. **DO NOT USE** `countries_tags` (shows distribution, not manufacturing)

---

## Question 2: User Contribution System for Country of Manufacture

### **Problem**
When manufacturing country data is missing, we need a reliable way for users to contribute this information while ensuring accuracy.

### **Proposed Solution: Multi-Tier Validation System**

#### **Tier 1: Simple User Submission**
- Allow any user to submit "Product of X" from label
- Store submission with user ID, timestamp, country value
- Display with "pending" status until validated

#### **Tier 2: Validation Rules**
- **Single Submission:** Display as "unverified" with user attribution
- **2 Matching Submissions:** Display with "community verified" badge
- **3+ Matching Submissions:** Display as "verified" (high confidence)
- **Conflicting Submissions:** Hold for manual review, show most common answer with "disputed" flag

#### **Tier 3: Trusted User System**
- Users with 10+ verified contributions become "trusted contributors"
- Trusted user submissions count as 2 regular submissions
- Trusted user submissions are auto-verified faster

#### **Tier 4: Submission Requirements**
- Must provide country name (can't be empty)
- Must match ISO country name or common country name
- Validate against country name list
- Optional: Upload photo of label showing "Product of X"

#### **Tier 5: Integration with Open Food Facts**
- Once verified (3+ matching submissions), automatically submit to Open Food Facts
- Improves database for all users globally
- Users get credit for contributions

### **Implementation Features**

1. **"Report Manufacturing Country" Button**
   - Location: Product Information page (below Country of Manufacture card if not shown)
   - Action: Opens modal for country input

2. **Input Modal**
   - Text input: "What does the label say? (e.g., 'Product of China')"
   - Optional: Photo upload button
   - Submit button
   - Cancel button

3. **Display Logic**
   - Show manufacturing country if:
     - Validated (3+ matching submissions) OR
     - Verified by trusted user OR
     - Single submission (show as "unverified")
   - Don't show if:
     - No data available (better than showing wrong data)
     - Disputed (conflicting submissions)

4. **Data Storage**
   - Local: AsyncStorage for user submissions
   - Future: Backend API for multi-user validation
   - Sync with Open Food Facts API

---

## Question 3: Eco-Score Grade Missing Issue

### **Problem**
Eco-Score shows score (e.g., 91/100) but no corresponding letter grade (A, B, C, D, E).

### **Root Cause**
When Open Food Facts provides `ecoscore_score` (0-100) but `ecoscore_grade` is missing or 'unknown', we need to calculate the grade from the score.

### **Eco-Score Grade Ranges (Official Open Food Facts)**
- **A:** 80-100 points (Excellent environmental impact)
- **B:** 70-79 points (Good environmental impact)
- **C:** 55-69 points (Average environmental impact)
- **D:** 40-54 points (Poor environmental impact)
- **E:** 0-39 points (Very poor environmental impact)
- **Unknown:** No score available

### **Solution**
Add grade calculation function that derives letter grade from score when grade is missing.

---

## Implementation Plan

### **Priority 1: Fix Eco-Score Grade Display (Immediate)**
- Calculate grade from score if grade is missing
- Update `calculateEcoScore` function
- Update `EcoScore.tsx` component

### **Priority 2: User Contribution System (Week 1-2)**
- Create user contribution service
- Add "Report Manufacturing Country" button
- Implement validation logic
- Store submissions locally (AsyncStorage)
- Display with confidence levels

### **Priority 3: Backend Integration (Future)**
- Create backend API for multi-user validation
- Sync with Open Food Facts
- Trusted user system

---

## Expected Outcomes

1. **Eco-Score:** Always shows letter grade when score is available
2. **Country of Manufacture:** 
   - Shows accurate data when available from Open Food Facts
   - Allows user contributions to fill gaps
   - Builds comprehensive database over time
3. **User Engagement:** 
   - Users become part of solution
   - Improves data quality for everyone
   - Builds community around app

---

## Technical Details

See implementation files:
- `src/services/manufacturingCountryService.ts` (NEW - user contributions)
- `src/services/openFoodFacts.ts` (UPDATE - grade calculation)
- `src/components/EcoScore.tsx` (UPDATE - grade display)
- `app/result/[barcode].tsx` (UPDATE - contribution button)

