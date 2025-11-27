# TruScore Codebase Analysis - Current Implementation

**Date:** Comprehensive analysis of active TruScore v1.4 engine  
**Engine File:** `src/lib/truscoreEngine.ts`  
**Purpose:** Baseline documentation of current TruScore calculation logic

---

## Executive Summary

**Active Engine:** `src/lib/truscoreEngine.ts` (v1.4)  
**Total Score Range:** 0-100 (4 pillars × 25 points each)  
**Execution Time:** <150ms (offline-first, client-side)  
**Data Sources:** Open Food Facts API, Internal Brand Database, Internal Additive Database

---

## Data Sources Overview

| Data Source | Owner/Administrator | Used In Pillar(s) | Reliability |
|------------|---------------------|-------------------|-------------|
| **Open Food Facts API** | Open Food Facts (non-profit) | Body, Planet, Care, Open | High |
| **Internal Additive Database** | Internal (400+ E-numbers) | Body | High |
| **Internal Brand Database** | Internal (500+ companies) | Care | High |
| **São Paulo University NOVA** | Via Open Food Facts | Body | High |
| **French Agence Eco-Score** | Via Open Food Facts | Planet | High |

---

## BODY PILLAR (25 points)

### Base Score Logic

| Condition | Base Score | Code Location | Notes |
|-----------|------------|---------------|-------|
| **Nutri-Score Present** | Uses Nutri-Score mapping | Line 109-114 | Overrides base |
| **Nutri-Score Missing** | **25** | Line 105 | Default assumption: neutral until proven bad |

**Decision Tree:**
1. Check if `product.nutriscore_grade` exists
2. If YES: Map to score (a=25, b=20, c=15, d=10, e=5)
3. If NO: Use base score of **25**

### Nutri-Score Mapping

| Grade | Score | Data Source | Code Location |
|-------|-------|-------------|---------------|
| A | 25 | Open Food Facts | Line 112 |
| B | 20 | Open Food Facts | Line 112 |
| C | 15 | Open Food Facts | Line 112 |
| D | 10 | Open Food Facts | Line 112 |
| E | 5 | Open Food Facts | Line 112 |
| Missing/Invalid | 25 | Internal Logic | Line 105 |

**Data Location:** `product.nutriscore_grade` (string: "a", "b", "c", "d", "e")

### NOVA Group Adjustments

| NOVA Group | Adjustment | Data Source | Code Location | Notes |
|------------|-----------|-------------|---------------|-------|
| 1 | **None** | Open Food Facts | Not implemented | Spec mentions +3, but not in code |
| 2 | None | Open Food Facts | Not checked | No adjustment |
| 3 | **-5** | Open Food Facts | Line 169 | Penalty for processed foods |
| 4 | **-10** | Open Food Facts | Line 168 | Penalty for ultra-processed foods |

**Data Location:** `product.nova_group` (number: 1-4)  
**Decision Tree:** Applied after Nutri-Score/base score, before other penalties

### Additives Penalty

**Methodology:** Weighted by safety rating (not simple count)

| Safety Rating | Penalty Per Additive | Code Location |
|---------------|---------------------|---------------|
| **avoid** | -3.0 | Line 129 |
| **caution** | -1.5 | Line 131 |
| **safe** | -0.5 | Line 133 |
| **unknown/not in DB** | -1.5 (default) | Line 136, 140 |

**Calculation:**
1. Loop through `product.additives_tags` array
2. Extract E-number from tag (handles "en:e412" and "e412" formats)
3. Look up additive in internal database (`src/services/additiveDatabase.ts`)
4. Apply penalty based on safety rating
5. **Cap total penalty at 15 points** (line 144)

**Data Sources:**
- **Additives List:** `product.additives_tags` (array of strings from Open Food Facts)
- **Safety Database:** `src/services/additiveDatabase.ts` (400+ E-numbers with safety ratings)

**Example:**
- Product with 3 additives: 1 "avoid" (-3), 1 "caution" (-1.5), 1 "safe" (-0.5) = -5 total
- Product with 10 "safe" additives: 10 × -0.5 = -5 (capped at -15 if needed)

### Risky Tags Penalty

**Methodology:** Fixed penalty per risky tag

| Risky Tag Type | Penalty Per Tag | Code Location |
|----------------|----------------|---------------|
| **carcinogenic** | -4 | Line 154 |
| **endocrine** | -4 | Line 154 |
| **allergen** | -4 | Line 154 |
| **irritant** | -4 | Line 154 |

**Calculation:**
1. Filter `product.ingredients_analysis_tags` for tags containing: "carcinogenic", "endocrine", "allergen", "irritant"
2. **Exclude "palm" tags** (handled separately in Planet pillar)
3. Count matches
4. Apply penalty: `riskyCount × 4`
5. **No cap** (applied separately from additives penalty)

**Data Location:** `product.ingredients_analysis_tags` (array of strings from Open Food Facts)

**Example:**
- Product with 2 risky tags (carcinogenic, allergen) = -8 points

### Irritants Block Penalty

**Methodology:** Single block penalty if any irritant found

| Condition | Penalty | Code Location |
|-----------|---------|---------------|
| **Any irritant found** | -10 | Line 158 |

**Irritants List:** (Line 47-56)
- paraben
- phthalate
- sulfate
- triclosan
- formaldehyde
- peg
- silicone
- phenoxyethanol

**Detection Method:** Word boundary matching in `product.ingredients_text` (case-insensitive)

**Data Location:** `product.ingredients_text` (string from Open Food Facts)

### Fragrance Penalty

**Methodology:** Single block penalty if any fragrance term found

| Condition | Penalty | Code Location |
|-----------|---------|---------------|
| **Any fragrance term found** | -10 | Line 163 |

**Fragrance Terms:** (Line 162)
- parfum
- fragrance
- aroma

**Detection Method:** Word boundary matching in `product.ingredients_text` (case-insensitive)

**Data Location:** `product.ingredients_text` (string from Open Food Facts)

### Final Body Score Calculation

**Formula:**
```
body = base_score (25 or Nutri-Score mapped)
     - Math.min(additivePenalty, 15)
     - (riskyCount × 4)
     - (irritantsFound ? 10 : 0)
     - (fragranceFound ? 10 : 0)
     - (nova === 4 ? 10 : nova === 3 ? 5 : 0)

body = Math.max(0, Math.min(25, Math.round(body)))
```

**Bounds:** 0-25 (clamped and rounded)

---

## PLANET PILLAR (25 points)

### Base Score Logic

| Condition | Base Score | Code Location | Notes |
|-----------|------------|---------------|-------|
| **Eco-Score Present** | Uses Eco-Score mapping | Line 178-183 | Overrides base |
| **Eco-Score Missing** | **25** | Line 174 | Default assumption: neutral until proven bad |

**Decision Tree:**
1. Check if `product.ecoscore_grade` exists
2. If YES: Map to score (a=25, b=20, c=15, d=10, e=5)
3. If NO: Use base score of **25**

### Eco-Score Mapping

| Grade | Score | Data Source | Code Location |
|-------|-------|-------------|---------------|
| A | 25 | French Agence via Open Food Facts | Line 181 |
| B | 20 | French Agence via Open Food Facts | Line 181 |
| C | 15 | French Agence via Open Food Facts | Line 181 |
| D | 10 | French Agence via Open Food Facts | Line 181 |
| E | 5 | French Agence via Open Food Facts | Line 181 |
| Missing/Invalid | 25 | Internal Logic | Line 174 |

**Data Location:** `product.ecoscore_grade` (string: "a", "b", "c", "d", "e")

### Palm Oil Penalty

**Methodology:** Single penalty if palm oil detected and not certified free

| Condition | Penalty | Code Location |
|-----------|---------|---------------|
| **Palm oil detected AND not palm-oil-free** | -10 | Line 191 |

**Primary Detection Method:** (Line 187-192)
- Uses `product.palm_oil_analysis` (extracted from Open Food Facts)
- Checks `containsPalmOil === true` AND `isPalmOilFree === false`

**Fallback Detection Method:** (Line 194-201)
- If `palm_oil_analysis` doesn't exist, checks:
  - `ingredients_analysis_tags` for tags containing "palm"
  - `ingredients_analysis_tags` or `labels_tags` for "palm-oil-free"
- Applies penalty if palm found AND not palm-oil-free

**Data Sources:**
- **Primary:** `product.palm_oil_analysis` (object with `containsPalmOil`, `isPalmOilFree` booleans)
- **Fallback:** `product.ingredients_analysis_tags`, `product.labels_tags` (from Open Food Facts)

**Extraction:** `palm_oil_analysis` is extracted in `src/services/openFoodFacts.ts` from `ingredients_analysis_tags` and `ingredients_text`

### Packaging Recyclability Bonus

**Methodology:** Bonus based on recyclability percentage

| Condition | Bonus | Code Location |
|-----------|-------|---------------|
| **100% recyclable** (all packaging recyclable) | +5 | Line 211 |
| **Partial recyclable** (some packaging recyclable) | +2 | Line 213 |
| **No recyclable packaging** | 0 | No bonus |

**Calculation:**
1. Filter `product.packagings` array for items with `recycling === "recycle"` OR `"widely recycled"`
2. Count recyclable items
3. If `recyclableCount === packagings.length && packagings.length > 0`: +5
4. Else if `recyclableCount > 0`: +2

**Data Location:** `product.packagings` (array of objects with `recycling` property from Open Food Facts)

**Example:**
- Product with 2 packagings, both recyclable: +5
- Product with 3 packagings, 2 recyclable: +2
- Product with 1 packaging, not recyclable: 0

### Final Planet Score Calculation

**Formula:**
```
planet = base_score (25 or Eco-Score mapped)
       - (palmOilDetected ? 10 : 0)
       + (allRecyclable ? 5 : someRecyclable ? 2 : 0)

planet = Math.max(0, Math.min(25, Math.round(planet)))
```

**Bounds:** 0-25 (clamped and rounded)

---

## CARE PILLAR (25 points)

### Base Score Logic

| Condition | Base Score | Code Location | Notes |
|-----------|------------|---------------|-------|
| **Default** | **18** | Line 219 | "Absence of known cruelty" |

**Rationale:** Starts at 18 (above neutral) assuming no known cruelty until proven otherwise.

### Ethical & Welfare Label Bonuses

**Methodology:** Stacking bonuses (multiple labels can add up)

| Label | Bonus | Detection Method | Code Location |
|-------|-------|------------------|---------------|
| **Fair Trade** | +8 | `labels_tags` contains "fair-trade" | Line 222 |
| **Organic** | +8 | `labels_tags` contains "organic" | Line 223 |
| **Rainforest Alliance** | +7 | `labels_tags` contains "rainforest-alliance" | Line 224 |
| **MSC / ASC / Dolphin-Safe** | +8 | `labels_tags` contains "en:msc", "en:asc", or "en:dolphin-safe" | Line 225-226 |
| **RSPCA** | +6 | `labels_tags` contains "rspca" | Line 228 |
| **Vegan / Cruelty-Free** | +10 | `labels_tags` contains "en:vegan" or "en:cruelty-free" | Line 229-230 |
| **UTZ** | +7 | `labels_tags` contains "utz" | Line 232 |

**Detection Method:** Case-insensitive substring matching in `product.labels_tags` array

**Data Location:** `product.labels_tags` (array of strings from Open Food Facts)

**Example:**
- Product with Fair Trade (+8) + Organic (+8) + Vegan (+10) = +26 total (capped at 25 max)

### Cruelty Brand Penalty

**Methodology:** Large penalty for products from known cruelty parent companies

| Condition | Penalty | Code Location |
|-----------|---------|---------------|
| **Brand matches cruel parent** | -30 | Line 236 |

**Detection Method:**
1. Check `product.brands` (string) against internal brand database
2. Uses `isCruelParent(brands)` function from `src/data/brandDatabase.ts`
3. Checks brand name and aliases against cruel parent list
4. Also checks subsidiaries (e.g., "Dove" → "Unilever" → cruel parent)

**Data Sources:**
- **Brand Name:** `product.brands` (string from Open Food Facts)
- **Brand Database:** `src/data/brandDatabase.ts` (500+ companies with parent-subsidiary relationships)

**Known Cruel Parents:** (from brand database)
- Unilever (Dove, Axe, Lipton, Hellmann's, etc.)
- Procter & Gamble (Tide, Pampers, Crest, Olay, etc.)
- L'Oréal (Maybelline, Lancôme, Garnier, etc.)
- Estée Lauder (MAC, Clinique, Bobbi Brown, etc.)
- And 20+ more companies

**Example:**
- Product from "Dove" → detected as Unilever subsidiary → -30 penalty

### Final Care Score Calculation

**Formula:**
```
care = 18 (base)
     + fairTradeBonus (8 if present)
     + organicBonus (8 if present)
     + rainforestAllianceBonus (7 if present)
     + mscAscBonus (8 if present)
     + rspcaBonus (6 if present)
     + veganBonus (10 if present)
     + utzBonus (7 if present)
     - (cruelParent ? 30 : 0)

care = Math.max(0, Math.min(25, Math.round(care)))
```

**Bounds:** 0-25 (clamped and rounded)

**Note:** Bonuses can stack up to 25 maximum, but cruel parent penalty can bring score below 0 (then clamped to 0).

---

## OPEN PILLAR (25 points)

### Base Score Logic

| Condition | Base Score | Code Location | Notes |
|-----------|------------|---------------|-------|
| **Ingredients text present** | 25 | Line 242 | Default assumption: transparent |
| **Ingredients text missing/empty** | 5 | Line 254 | Severe penalty for opacity |
| **Placeholder text detected** | 5 | Line 261 | Penalty for generic/placeholder text |

**Decision Tree:**
1. Check if `product.ingredients_text` exists and is not empty
2. If NO: Set to 5
3. If YES: Check if it's a placeholder (regex match)
4. If placeholder: Set to 5
5. If valid: Start with 25

**Placeholder Detection:** (Line 257-259)
- Regex: `/^(product|item|n\/a|not available|unknown|missing|no ingredients|ingredients not listed)/i`
- Matches common placeholder text at start of ingredients list

**Data Location:** `product.ingredients_text` (string from Open Food Facts)

### Hidden Terms Penalty

**Methodology:** Penalty based on count of hidden ingredient terms

| Hidden Terms Count | Penalty | Code Location |
|-------------------|---------|---------------|
| **≥3 terms** | -20 | Line 247 |
| **1-2 terms** | -12 | Line 249 |
| **0 terms** | 0 | No penalty |

**Hidden Terms List:** (Line 36-44)
- parfum
- fragrance
- aroma
- flavor
- natural flavor
- natural flavour
- proprietary

**Detection Method:** Word boundary matching in `product.ingredients_text` (case-insensitive)

**Data Location:** `product.ingredients_text` (string from Open Food Facts)

**Example:**
- Product with "parfum, fragrance, aroma" = 3 terms = -20
- Product with "natural flavor" = 1 term = -12

### Origin Missing Penalty

**Methodology:** Penalty if manufacturing origin is unknown

| Condition | Penalty | Code Location |
|-----------|---------|---------------|
| **No origin data** | -15 | Line 272 |

**Detection Method:**
1. Check if any of these fields exist:
   - `product.origins_tags`
   - `product.manufacturing_places_tags`
   - `product.origins`
   - `product.manufacturing_places`
2. Also check if value contains "unknown" (case-insensitive)
3. If missing or "unknown": Apply -15 penalty

**Data Location:** Multiple fields from Open Food Facts:
- `product.origins_tags` (array)
- `product.manufacturing_places_tags` (array)
- `product.origins` (string)
- `product.manufacturing_places` (string)

### Final Open Score Calculation

**Formula:**
```
if (!ingredients_text || placeholder):
  open = 5
else:
  open = 25
  - (hiddenCount >= 3 ? 20 : hiddenCount >= 1 ? 12 : 0)
  - (noOrigin ? 15 : 0)

open = Math.max(0, Math.min(25, Math.round(open)))
```

**Bounds:** 0-25 (clamped and rounded)

**Note:** If ingredients text is missing/placeholder, score is set to 5 immediately (other penalties don't apply).

---

## TOTAL TRUSCORE CALCULATION

**Formula:**
```
truscore = body + planet + care + open
truscore = Math.max(0, Math.min(100, Math.round(truscore)))
```

**Bounds:** 0-100 (clamped and rounded)

**Breakdown Returned:**
- `Body`: 0-25
- `Planet`: 0-25
- `Care`: 0-25
- `Open`: 0-25

---

## Data Source Details

### Open Food Facts API

**Endpoint:** `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`

**Fields Used:**
- `nutriscore_grade` → Body pillar
- `ecoscore_grade` → Planet pillar
- `nova_group` → Body pillar
- `additives_tags` → Body pillar
- `ingredients_analysis_tags` → Body pillar (risky tags), Planet pillar (palm oil)
- `ingredients_text` → Body pillar (irritants, fragrance), Open pillar (hidden terms, presence check)
- `labels_tags` → Care pillar (certifications), Planet pillar (palm-oil-free check)
- `packagings` → Planet pillar (recyclability)
- `origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places` → Open pillar
- `brands` → Care pillar (cruelty detection)

**Coverage:** ~65-75% of food products (highest in EU/UK/US)

### Internal Additive Database

**File:** `src/services/additiveDatabase.ts`

**Content:** 400+ E-numbers with:
- Name
- Category
- Description
- Safety rating: 'safe', 'caution', or 'avoid'
- Uses, concerns, alternatives

**Used For:** Body pillar additive penalty calculation (weighted by safety)

### Internal Brand Database

**File:** `src/data/brandDatabase.ts`

**Content:** 500+ companies with:
- Brand name and aliases
- Parent company relationships
- Subsidiary relationships
- Ethical ratings
- Animal testing status
- Country of origin
- Industry sectors

**Used For:** Care pillar cruelty brand detection (checks parent companies and subsidiaries)

---

## Helper Functions

### Word Boundary Matching

**Function:** `hasTerm(term: string): boolean` (Line 94-97)

**Purpose:** Case-insensitive word boundary matching in ingredients text

**Implementation:**
```typescript
const regex = new RegExp(`\\b${term}\\b`, 'i');
return regex.test(text);
```

**Used For:** Detecting irritants, fragrance, hidden terms (prevents false positives from partial matches)

### Label Matching

**Function:** `hasLabel(pattern: string): boolean` (Line 100-102)

**Purpose:** Case-insensitive substring matching in labels array

**Implementation:**
```typescript
return labels.some((l: string) => l.includes(pattern.toLowerCase()));
```

**Used For:** Detecting certifications in Care pillar

---

## Error Handling

**Input Validation:** (Line 71-79)
- Returns `{ truscore: 0, breakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 } }` if product is null/undefined

**Try-Catch:** (Line 81-325)
- Wraps entire calculation in try-catch
- Returns safe default on error: `{ truscore: 0, breakdown: { Body: 0, Planet: 0, Care: 0, Open: 0 } }`
- Logs error to console

---

## Additional Features

### Insights Generation

**Function:** `generateInsights(product, preferences)` (Line 287)

**Purpose:** Generate user-specific insights based on values preferences

**Condition:** Only called if `preferences` parameter provided

**Source:** `src/lib/valuesInsights.ts`

**Not Part of Core Score:** Insights are metadata, not included in TruScore calculation

---

## Summary Table: All Scoring Elements

| Pillar | Element | Data Source | Score Impact | Code Line |
|--------|---------|-------------|-------------|-----------|
| **Body** | Base (no Nutri-Score) | Internal | +25 | 105 |
| **Body** | Nutri-Score A | OFF | +25 | 112 |
| **Body** | Nutri-Score B | OFF | +20 | 112 |
| **Body** | Nutri-Score C | OFF | +15 | 112 |
| **Body** | Nutri-Score D | OFF | +10 | 112 |
| **Body** | Nutri-Score E | OFF | +5 | 112 |
| **Body** | NOVA 3 | OFF | -5 | 169 |
| **Body** | NOVA 4 | OFF | -10 | 168 |
| **Body** | Additives (avoid) | OFF + Internal DB | -3 each (cap 15) | 129 |
| **Body** | Additives (caution) | OFF + Internal DB | -1.5 each (cap 15) | 131 |
| **Body** | Additives (safe) | OFF + Internal DB | -0.5 each (cap 15) | 133 |
| **Body** | Risky tags | OFF | -4 each | 154 |
| **Body** | Irritants | OFF | -10 (block) | 158 |
| **Body** | Fragrance | OFF | -10 (block) | 163 |
| **Planet** | Base (no Eco-Score) | Internal | +25 | 174 |
| **Planet** | Eco-Score A | OFF | +25 | 181 |
| **Planet** | Eco-Score B | OFF | +20 | 181 |
| **Planet** | Eco-Score C | OFF | +15 | 181 |
| **Planet** | Eco-Score D | OFF | +10 | 181 |
| **Planet** | Eco-Score E | OFF | +5 | 181 |
| **Planet** | Palm oil | OFF | -10 | 191 |
| **Planet** | Packaging (100% recyclable) | OFF | +5 | 211 |
| **Planet** | Packaging (partial recyclable) | OFF | +2 | 213 |
| **Care** | Base | Internal | +18 | 219 |
| **Care** | Fair Trade | OFF | +8 | 222 |
| **Care** | Organic | OFF | +8 | 223 |
| **Care** | Rainforest Alliance | OFF | +7 | 224 |
| **Care** | MSC/ASC/Dolphin-Safe | OFF | +8 | 225-226 |
| **Care** | RSPCA | OFF | +6 | 228 |
| **Care** | Vegan/Cruelty-Free | OFF | +10 | 229-230 |
| **Care** | UTZ | OFF | +7 | 232 |
| **Care** | Cruel parent | Internal DB | -30 | 236 |
| **Open** | Base (ingredients present) | Internal | +25 | 242 |
| **Open** | No ingredients/placeholder | OFF | =5 (override) | 254, 261 |
| **Open** | Hidden terms (≥3) | OFF | -20 | 247 |
| **Open** | Hidden terms (1-2) | OFF | -12 | 249 |
| **Open** | No origin | OFF | -15 | 272 |

---

## Notes and Observations

1. **Base Scores:** Body and Planet pillars use 25 as default (assumes neutral until proven bad), while Care uses 18 (assumes good until proven bad)

2. **Additives Logic:** Uses weighted safety system (not simple count), which is more sophisticated than simple multiplication

3. **Palm Oil:** Uses extracted `palm_oil_analysis` object for consistency with other app features

4. **Cruelty Detection:** Sophisticated parent-subsidiary relationship checking in brand database

5. **Word Boundaries:** Uses regex word boundaries for ingredient matching to prevent false positives

6. **Stacking:** Care pillar bonuses can stack (multiple certifications add up)

7. **Caps:** Additives penalty capped at 15, but risky tags penalty is not capped (applied separately)

8. **Origin Penalty:** Not mentioned in some specs but present in code (-15 for missing origin)

9. **NOVA 1:** Spec mentions +3 bonus for NOVA 1, but not implemented in code

10. **Placeholder Detection:** More sophisticated than simple length check - uses regex to detect placeholder text

---

**End of Analysis**

