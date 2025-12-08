# Database Query Flow & TruScore Logic - Complete Explanation

## When a User Scans a Product Barcode

### 🇳🇿 New Zealand Users

#### Step 1: Barcode Lookup (Tier 1 - Primary Sources)
1. **SQLite Database** (offline-first, country-specific)
   - Instant lookup if product was previously scanned
   - Country-specific cache

2. **Open Food Facts (OFF)**
   - Primary global food database
   - Gets product name, nutrition, ingredients, etc.

3. **Open Beauty Facts (OBF)**
   - For cosmetics/personal care products

4. **Open Pet Food Facts (OPFF)**
   - For pet food products

#### Step 2: FSANZ Enhancement (Tier 1.5 - Gold Standard)
5. **FSANZ NZ Database (Barcode Lookup)**
   - If product found in OFF, tries to match barcode in FSANZ NZ database
   - Official New Zealand food composition database
   - Merges official nutrition data if found

6. **FSANZ Query by Product Name** ⭐ **PRIMARY METHOD**
   - **Uses product name from OFF** to query FSANZ API
   - **API Endpoint:** `https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName={name}`
   - **Database:** NZFCD (221,851 foods)
   - **Method:** Fuzzy matching by food name
   - **Result:** Official nutrition data merged into product

#### Step 3: Additional Sources (Tier 2-3)
7. Other databases (UPCitemdb, Barcode Spider, etc.)
8. Web search fallback (ensures always returns something)

---

### 🇦🇺 Australian Users

#### Step 1: Barcode Lookup (Tier 1 - Primary Sources)
1. **SQLite Database** (offline-first, country-specific)
2. **Open Food Facts (OFF)**
3. **Open Beauty Facts (OBF)**
4. **Open Pet Food Facts (OPFF)**

#### Step 2: FSANZ Enhancement (Tier 1.5 - Gold Standard)
5. **FSANZ AU Database (Barcode Lookup)**
   - Tries to match barcode in FSANZ AU database
   - Official Australian food composition database

6. **FSANZ Query by Product Name** ⭐ **PRIMARY METHOD**
   - **Uses product name from OFF** to query FSANZ API
   - **API Endpoint:** `https://truscoreapi.vercel.app/api/fsanz-query?country=au&productName={name}`
   - **Database:** AFCD (3,422 foods) + **NZFCD Fallback** (221,851 foods)
   - **Method:** 
     - First tries AFCD with fuzzy matching
     - **If not found, automatically falls back to NZFCD**
   - **Result:** Official nutrition data merged into product

#### Step 3: Additional Sources (Tier 2-3)
7. Other databases
8. Web search fallback

---

## FSANZ Query Logic (The PRIMARY Method)

### How It Works:

1. **User scans barcode** → App gets product name from Open Food Facts
2. **App calls FSANZ API** with product name:
   ```
   GET /api/fsanz-query?country={nz|au}&productName={name}
   ```
3. **API searches database:**
   - **NZ users:** Searches NZFCD (221,851 foods)
   - **AU users:** 
     - First searches AFCD (3,422 foods)
     - If not found, automatically searches NZFCD (221,851 foods)
4. **Fuzzy matching** finds closest food name match
5. **Returns official nutrition data:**
   - Energy (kcal/kJ)
   - Protein, Fat, Carbohydrates
   - Vitamins, Minerals (Calcium, Iron, etc.)
   - Food Group classification
6. **App merges FSANZ data** into product:
   - Fills missing nutrition gaps
   - Adds official government data
   - Enhances TruScore accuracy

---

## TruScore Calculation Logic

### Overview
TruScore is calculated from **4 equal pillars** (25 points each = 100 total):
- **Body** (25 pts): Nutrition & health
- **Planet** (25 pts): Environmental impact
- **Care** (25 pts): Ethics & certifications
- **Open** (25 pts): Transparency & data completeness

### Data Sources Used:

#### 1. Body Pillar (25 points)
- **Primary:** Nutri-Score grade (if available)
  - A = 25 pts, B = 20 pts, C = 15 pts, D = 10 pts, E = 5 pts
- **Fallback:** Calculated from nutrition data
  - Uses FSANZ nutrition data if available
  - Uses OFF nutrition data otherwise
  - Baseline: 12 points if no Nutri-Score

#### 2. Planet Pillar (25 points)
- **Primary:** Eco-Score grade (if available)
  - A = 25 pts, B = 20 pts, C = 15 pts, D = 10 pts, E = 5 pts
- **Fallback:** Calculated from:
  - Packaging materials
  - Origin information
  - Certifications (organic, fair trade, etc.)
  - Baseline: 12 points if no Eco-Score

#### 3. Care Pillar (25 points)
- Based on certifications and labels:
  - Organic, Fair Trade, B-Corp, etc.
  - Palm oil free, Vegan, etc.
  - Calculated from OFF labels and certifications

#### 4. Open Pillar (25 points)
- Based on data completeness:
  - Product name, brand, ingredients
  - Nutrition facts completeness
  - Origin information
  - Certifications available
  - **FSANZ data enhances this** by providing official nutrition data

---

## How FSANZ Data Enhances TruScore

### For NZ Users:
1. **Product scanned** → OFF provides basic data
2. **FSANZ query** → Gets official NZFCD nutrition data
3. **Data merged** → Product now has:
   - Official government nutrition values
   - Complete nutrient profile (calcium, iron, etc.)
   - Food group classification
4. **TruScore calculated** with:
   - More accurate Body score (official nutrition)
   - Higher Open score (more complete data)
   - Better overall accuracy

### For AU Users:
1. **Product scanned** → OFF provides basic data
2. **FSANZ query** → Tries AFCD first
3. **If not in AFCD** → Automatically tries NZFCD (fallback)
4. **Data merged** → Product has official nutrition data
5. **TruScore calculated** with:
   - Official government nutrition values
   - Access to both AU and NZ databases
   - Maximum data coverage

---

## Database Coverage Summary

### 🇳🇿 New Zealand
- **NZFCD:** 221,851 foods
- **Access:** Direct query by product name
- **Coverage:** Complete New Zealand food database

### 🇦🇺 Australia
- **AFCD:** 3,422 foods (Nutrient file + Food Details)
- **NZFCD Fallback:** 221,851 foods (if not in AFCD)
- **Total Access:** 225,273+ foods
- **Coverage:** Complete Australian + New Zealand databases

---

## Example Flow

### NZ User Scans "Milk"
1. OFF returns: "Milk, whole, 3.25% fat"
2. App queries: `FSANZ?country=nz&productName=Milk`
3. NZFCD finds: "Milk, whole" with official nutrition
4. Data merged: Product now has official NZ nutrition values
5. TruScore calculated: Higher Body score (official data), higher Open score (complete data)

### AU User Scans "Apple"
1. OFF returns: "Apple, red delicious"
2. App queries: `FSANZ?country=au&productName=Apple`
3. AFCD searched: Not found
4. **NZFCD fallback:** Found "Apple, red delicious" with official nutrition
5. Data merged: Product has official nutrition (from NZFCD)
6. TruScore calculated: Accurate score using official data

---

## Key Points

✅ **FSANZ is queried AFTER Open Food Facts** (needs product name)  
✅ **Uses fuzzy matching** to find closest food name  
✅ **AU users get NZFCD fallback** automatically  
✅ **Official government data** enhances TruScore accuracy  
✅ **Both databases fully deployed** and accessible  
