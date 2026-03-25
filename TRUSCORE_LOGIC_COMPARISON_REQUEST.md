# TruScore Logic Comparison - Document Access Required

## Current Situation

I've reviewed the current pillar implementation code and found the following structure:

### Current Pillar Implementations

#### **Body Pillar** (`src/lib/truscoreEngine/pillars/bodyPillar.ts`)
- **Base Score:** 15/25
- **Nutri-Score:** A=22, B=18, C=15, D=12, E=8 (adjustments from base 15)
- **Additives:** IARC hybrid system (IARC Class 1=-10, 2A=-5, 2B=-3)
- **NOVA:** 1=+3, 2=+1, 3=-1, 4=-6 (cap -10)
- **EWG:** A=+5, B=+2, C=0, D=-3, F=-5 (household only, cap -10)
- **Final:** Capped at 2-25

#### **Planet Pillar** (`src/lib/truscoreEngine/pillars/planetPillar.ts`)
- **Base Score:** 15/25
- **Eco-Score:** A=22, B=18, C=15, D=12, E=8 (adjustments from base 15)
- **Palm Oil:** Non-certified=-8, RSPO certified=0, Brand overlay=-4
- **Recyclable Packaging:** All=+3, Some=+1
- **Packaging Eco-Cost:** High eco-cost=-6
- **Farming Impact:** High=-5, Low=+3, Brand overlay=-3
- **Final:** Capped at 0-25

#### **Ethics Pillar** (`src/lib/truscoreEngine/pillars/ethicsPillar.ts`)
- **Base Score:** 15/25
- **Certifications:** Fairtrade=+8, Organic=+7, Rainforest/UTZ=+6, MSC/ASC=+6, RSPO=+6, RSPCA/Leaping Bunny/B-Corp=+5, Cage-Free/Free-Range=+4 (cap +15)
- **Animal Cruelty:** Major=-15, Minor=-5, Brand overlay=-3
- **Labor Violations:** Minor=-5, Major=-15, Brand overlay=-3
- **Recalls:** Within 12 months=-10, Brand overlay=-3
- **Final:** Capped at 0-25

#### **Open Pillar** (`src/lib/truscoreEngine/pillars/openPillar.ts`)
- **Base Score:** 15/25
- **Ingredients Disclosure:** Present=+2, None=-3
- **Hidden Terms:** 1=-4, 2=-8, ≥3=-11 (NOVA amplification: +1 if NOVA≥3)
- **Zero Hidden Bonus:** NOVA 1-2=+4, NOVA 3-4=+2
- **Nutritional Info:** Complete=+3, Partial=+1, None=-3
- **Origin:** Complete=+4, None=-4
- **Brand Ownership:** Hidden/opaque=-3
- **Final:** Capped at 0-25

---

## External Resources Currently Used

### **Body Pillar Resources:**
1. **IARC Monographs Database** - `src/data/iarcAgents.ts` (1,055 agents)
2. **EWG Skin Deep** - For household/cosmetics products
3. **Additive Database** - `src/services/additiveDatabase.ts` (includes IARC classifications)
4. **Nutri-Score** - From Open Food Facts
5. **NOVA Classification** - From Open Food Facts

### **Planet Pillar Resources:**
1. **Eco-Score** - From Open Food Facts (Agribalyse)
2. **EWG Dirty Dozen** - `src/services/csvDatabases/csvDatabaseService.ts`
3. **RSPO Certified Database** - `src/services/csvDatabases/csvDatabaseService.ts`
4. **FAO Crop Data** - `src/services/csvDatabases/csvDatabaseService.ts` (water usage, carbon, land use)
5. **USDA PDP** - `src/services/csvDatabases/csvDatabaseService.ts` (pesticide residue)
6. **Idemat Eco-Cost** - `src/services/csvDatabases/csvDatabaseService.ts` (packaging materials)
7. **Agribalyse Fallback** - `src/services/csvDatabases/csvDatabaseService.ts` (carbon footprint)

### **Ethics Pillar Resources:**
1. **Brand Database** - `src/data/brandDatabase.ts` (animal cruelty, labor violations, recalls)
2. **Animal Cruelty Service** - `src/services/animalCrueltyService.ts`
3. **Labor Violations Service** - `src/services/laborViolationsService.ts`
4. **FDA/Recall Services** - Multiple recall APIs
5. **Certification Labels** - From Open Food Facts (labels_tags)

### **Open Pillar Resources:**
1. **Open Food Facts** - Ingredients, nutritional info, origin data
2. **Brand Database** - For parent company transparency

---

## Request for Document Access

**Issue:** The Word document (`X_Pillar_Score_and Commentary_Table_20251217.docx`) is in binary format and cannot be directly read by code analysis tools.

**To proceed with comparison and updates, please provide ONE of the following:**

### **Option 1: Convert to Text/CSV** (Recommended)
- Open the Word document
- Copy the table content
- Paste into a `.txt` or `.csv` file
- Save in the same directory: `C:\TrueScan-FoodScanner\TruScore logic\`

### **Option 2: Export to Excel**
- Open the Word document
- Copy the table
- Paste into Excel
- Save as `.xlsx` or `.csv`

### **Option 3: Provide Key Information**
If conversion is difficult, please provide:
- Data elements for each pillar
- Scoring measures and values
- External resources mentioned in the "External resources" column
- Any differences from current implementation

---

## What I Will Do Once I Have Access

1. **Compare** each pillar's:
   - Data elements
   - Scoring measures
   - Score values
   - Highlights commentary
   - Explainer text
   - External resources

2. **Update Code** to match the document:
   - Adjust scoring formulas
   - Update data sources
   - Modify highlight generation
   - Ensure all external resources are accessible

3. **Verify External Resources:**
   - Check all databases are loaded
   - Verify API access
   - Ensure CSV databases are complete
   - Add any missing resources

4. **Test** changes with sample products

---

## Current External Resource Status

### ✅ **Currently Implemented:**
- IARC Monographs Database (1,055 agents)
- EWG Dirty Dozen (CSV)
- EWG Skin Deep (for household products)
- RSPO Certified Database (CSV)
- FAO Crop Data (CSV - water, carbon, land use)
- USDA PDP (CSV - pesticide residue)
- Idemat Eco-Cost (CSV - packaging materials)
- Agribalyse Fallback (CSV - carbon footprint)
- Brand Database (animal cruelty, labor, recalls)
- Open Food Facts API
- Open Beauty Facts API
- FDA Recall API
- Multiple recall APIs (RASFF, CFIA, etc.)

### ⚠️ **May Need Verification:**
- Full FAO FAOSTAT database (currently using subset)
- Full USDA PDP database (currently using subset)
- Full RSPO member directory (currently using subset)
- Complete Idemat database (currently using subset)

---

**Please provide the document content in a readable format so I can proceed with the comparison and updates.**
