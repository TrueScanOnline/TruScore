# Database Merger Strategy - Complete Explanation

**Date:** January 2025  
**Purpose:** Detailed explanation of how TruScan merges data from multiple databases to generate a "rich" TruScore

---

## Table of Contents

1. [Overview](#overview)
2. [The Problem: Why Merge?](#the-problem-why-merge)
3. [The Solution: Intelligent Merging](#the-solution-intelligent-merging)
4. [Step-by-Step Process](#step-by-step-process)
5. [Concrete Example](#concrete-example)
6. [Merging Rules](#merging-rules)
7. [Source Priority & Weights](#source-priority--weights)
8. [Data Completeness Metrics](#data-completeness-metrics)
9. [Logging Output](#logging-output)

---

## Overview

When a user scans a product, TruScan queries **multiple databases in parallel** to find product information. Often, **multiple databases return data for the same product**, but each database may have:

- **Different completeness** (one has nutrition, another has ingredients)
- **Different accuracy** (government sources vs. community sources)
- **Different focus** (nutrition-focused vs. sustainability-focused)

The **Database Merger** intelligently combines this data to create a single, "rich" product with the **best information from all sources**.

---

## The Problem: Why Merge?

### Scenario: User Scans "Coca-Cola 330ml"

**Database 1: Open Food Facts**
- ✅ Product name: "Coca-Cola"
- ✅ Nutrition data: Complete (energy, macros, micros)
- ✅ Ingredients: Complete list
- ✅ Eco-Score: B
- ❌ Certifications: None
- ❌ Brand details: Basic

**Database 2: USDA FoodData Central**
- ✅ Product name: "Coca-Cola"
- ✅ Nutrition data: Very detailed (government-verified)
- ✅ Brand: "The Coca-Cola Company"
- ❌ Ingredients: Partial
- ❌ Eco-Score: None
- ❌ Certifications: None

**Database 3: Open Beauty Facts** (if scanned as cosmetic)
- ✅ Product name: "Coca-Cola"
- ❌ Nutrition: None (wrong category)
- ❌ Ingredients: None
- ✅ Image: High quality

**Without Merging:**
- User sees incomplete data
- Missing certifications
- Missing brand details
- Lower TruScore accuracy

**With Merging:**
- ✅ Complete nutrition (from USDA - most accurate)
- ✅ Complete ingredients (from OFF - most complete)
- ✅ Eco-Score (from OFF)
- ✅ Brand details (from USDA)
- ✅ High-quality image (from OBF)
- ✅ **Rich TruScore** with all data

---

## The Solution: Intelligent Merging

The merger uses a **weighted priority system**:

1. **Sort sources by reliability** (government > official > community > fallback)
2. **Use highest-weight source as base** (primary structure)
3. **Fill gaps from other sources** (weighted by source reliability)
4. **Resolve conflicts** (higher-priority source wins)
5. **Merge specific fields intelligently** (nutrition = weighted average, ingredients = longest, etc.)

---

## Step-by-Step Process

### Phase 1: Query Multiple Databases (Parallel)

```
User scans barcode: 5449000000996
```

**Tier 1: Open Facts Family (Parallel Query)**
- Open Food Facts → ✅ Found (Completeness: 75%)
- Open Beauty Facts → ❌ Not found
- Open Pet Food Facts → ❌ Not found
- Open Products Facts → ❌ Not found

**Tier 2: Official Sources (Parallel Query)**
- USDA FoodData → ✅ Found (Completeness: 85%)
- GS1 Data Source → ❌ Not found

**Result:** 2 products found from different sources

---

### Phase 2: Data Completeness Analysis

**Product 1: Open Food Facts**
```
Total: 75%
├─ Nutrition: 20/25 (has energy, macros, micros, Nutri-Score)
├─ Ingredients: 25/25 (complete list)
├─ Certifications: 5/15 (has labels, no organic/vegan)
├─ Sustainability: 12/15 (has Eco-Score, palm oil analysis, packaging)
├─ Brand: 7/10 (has brand name)
└─ Images: 8/10 (has image)
```

**Product 2: USDA FoodData**
```
Total: 85%
├─ Nutrition: 25/25 (government-verified, very detailed)
├─ Ingredients: 15/25 (partial list)
├─ Certifications: 0/15 (none)
├─ Sustainability: 0/15 (no Eco-Score, no palm oil)
├─ Brand: 10/10 (complete brand details)
└─ Images: 0/10 (no image)
```

---

### Phase 3: Source Weighting

**Source Weights:**
- USDA FoodData: **40%** (government source - highest priority)
- Open Food Facts: **40%** (community source - high priority)

**Decision:** USDA is base (highest weight), but OFF has valuable data to merge

---

### Phase 4: Merging Process

#### Step 1: Base Product Selection
- **Base:** USDA FoodData (weight: 40%)
- **Reason:** Highest weight, most reliable nutrition data

#### Step 2: Field-by-Field Merging

**Product Name:**
- USDA: "Coca-Cola"
- OFF: "Coca-Cola"
- **Result:** "Coca-Cola" (same, use base)

**Nutrition Data:**
- USDA: Complete, government-verified
- OFF: Complete, community-verified
- **Strategy:** Weighted average (USDA 40%, OFF 40%)
- **Result:** Merged nutrition (USDA values weighted higher)

**Ingredients:**
- USDA: "Carbonated water, sugar, caramel color, phosphoric acid, natural flavors, caffeine"
- OFF: "Carbonated water, sugar, caramel color (E150d), phosphoric acid, natural flavors, caffeine"
- **Strategy:** Use longest/most complete (OFF has E-numbers)
- **Result:** OFF ingredients (more complete)

**Certifications:**
- USDA: None
- OFF: ["en:vegan", "en:gluten-free"]
- **Strategy:** Union (combine all)
- **Result:** ["en:vegan", "en:gluten-free"] (from OFF)

**Eco-Score:**
- USDA: None
- OFF: B (score: 45)
- **Strategy:** Use if available (OFF has it)
- **Result:** Eco-Score B (from OFF)

**Brand:**
- USDA: "The Coca-Cola Company" (complete)
- OFF: "Coca-Cola" (basic)
- **Strategy:** Use most complete (USDA)
- **Result:** "The Coca-Cola Company" (from USDA)

**Image:**
- USDA: None
- OFF: "https://images.openfoodfacts.org/..."
- **Strategy:** Use if available (OFF has it)
- **Result:** Image from OFF

**Categories:**
- USDA: "Beverages, Carbonated drinks"
- OFF: "Beverages, Carbonated drinks, Cola"
- **Strategy:** Use most specific/longest (OFF)
- **Result:** "Beverages, Carbonated drinks, Cola" (from OFF)

---

### Phase 5: Final Merged Product

**Merged Product:**
```
Source: usda_fooddata (base source)
Total Completeness: 92% (up from 75% and 85%)

Nutrition: 25/25 ✅ (from USDA, weighted with OFF)
Ingredients: 25/25 ✅ (from OFF - most complete)
Certifications: 10/15 ✅ (from OFF - union)
Sustainability: 12/15 ✅ (from OFF - Eco-Score, palm oil)
Brand: 10/10 ✅ (from USDA - most complete)
Images: 8/10 ✅ (from OFF)
```

**Improvement:**
- Started with: 75% (OFF) or 85% (USDA)
- Ended with: **92%** (merged)
- **+17% completeness** from merging

---

## Concrete Example

### Example: Scanning "Cadbury Dairy Milk Chocolate Bar"

**Barcode:** 5000159461125

---

### Step 1: Database Queries (Parallel)

```
═══════════════════════════════════════════════════════════════
🔍 PRODUCT SCAN: 5000159461125
═══════════════════════════════════════════════════════════════
📋 Barcode Variants: 5000159461125, 05000159461125
🌍 User Country: GB

───────────────────────────────────────────────────────────────
📊 TIER 1: Open Facts Family (Parallel Query)
───────────────────────────────────────────────────────────────
✅ Open Food Facts: Found product | [OFF] Total: 78% | Nutrition: 22/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 15/15 | Brand: 5/10 | Images: 3/10
❌ Open Beauty Facts: Not found
❌ Open Pet Food Facts: Not found
❌ Open Products Facts: Not found

───────────────────────────────────────────────────────────────
📊 TIER 2: Official Sources (Parallel Query)
───────────────────────────────────────────────────────────────
❌ USDA FoodData: Not found (US-only)
✅ GS1 Data Source: Found product | [GS1] Total: 65% | Nutrition: 15/25 | Ingredients: 10/25 | Certifications: 0/15 | Sustainability: 0/15 | Brand: 10/10 | Images: 0/10
```

---

### Step 2: Multiple Sources Found - Merging

```
🔄 Multiple sources found (2), merging...
═══════════════════════════════════════════════════════════════
📊 DATABASE MERGER: Merging 2 products
═══════════════════════════════════════════════════════════════
Source 1: openfoodfacts (Weight: 40.0%)
  [openfoodfacts] Total: 78% | Nutrition: 22/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 15/15 | Brand: 5/10 | Images: 3/10
Source 2: gs1_datasource (Weight: 40.0%)
  [gs1_datasource] Total: 65% | Nutrition: 15/25 | Ingredients: 10/25 | Certifications: 0/15 | Sustainability: 0/15 | Brand: 10/10 | Images: 0/10
───────────────────────────────────────────────────────────────
🔀 MERGING DECISIONS:
  Base Product: openfoodfacts (highest weight)
  Nutrition: Merged from 2 sources (weighted average)
  Ingredients: Used from openfoodfacts (longest/most complete)
  Certifications: Merged from 2 sources (union)
  Categories: Used from openfoodfacts (most specific)
───────────────────────────────────────────────────────────────
✅ FINAL MERGED PRODUCT:
  [MERGED] Total: 88% | Nutrition: 23/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 15/15 | Brand: 10/10 | Images: 3/10
  Source: openfoodfacts
  Quality: 88
  Completion: 88
═══════════════════════════════════════════════════════════════
```

---

### Step 3: Enhancement Layer

```
───────────────────────────────────────────────────────────────
✨ ENHANCEMENT LAYER: Applying MVP Enhancements
───────────────────────────────────────────────────────────────
📊 Before Enhancement: [PRE] Total: 88% | Nutrition: 23/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 15/15 | Brand: 10/10 | Images: 3/10

[EWG Skin Deep] Checking cosmetics... Not a cosmetic product
[WWF Palm Oil] Checking brand... Found in WWF scorecard
  → Brand: Cadbury (Mondelez)
  → Palm Oil Status: Certified Sustainable (RSPO)
  → Updated palm_oil_analysis.isCertifiedSustainable = true
[Leaping Bunny] Checking brand... Not in Leaping Bunny database

📊 After Enhancement: [POST] Total: 90% | Nutrition: 23/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 18/15 | Brand: 10/10 | Images: 3/10
✅ MVP enhancements applied successfully
```

**Note:** Sustainability increased from 15/15 to 18/15 (over 100%) because WWF enhancement added certified sustainable palm oil flag, which improves the score.

---

### Step 4: Final Product Data & Scoring

```
───────────────────────────────────────────────────────────────
🎯 FINAL PRODUCT DATA (Before Scoring)
───────────────────────────────────────────────────────────────
  [FINAL] Total: 90% | Nutrition: 23/25 | Ingredients: 25/25 | Certifications: 8/15 | Sustainability: 18/15 | Brand: 10/10 | Images: 3/10
  Source: openfoodfacts
  Product Name: Cadbury Dairy Milk Chocolate Bar
  Brand: Cadbury
  Has Nutrition: Yes
  Has Ingredients: Yes
  Has Eco-Score: Yes
  Has Palm Oil Analysis: Yes
  Has Certifications: Yes

───────────────────────────────────────────────────────────────
📊 TRUSCORE CALCULATION
───────────────────────────────────────────────────────────────
  TruScore: 72/100
  Body Pillar: 18/25 (Nutri-Score C, some additives)
  Planet Pillar: 20/25 (Eco-Score B, certified sustainable palm oil - reduced penalty)
  Care Pillar: 15/25 (No cruelty-free, parent company concerns)
  Open Pillar: 19/25 (Good transparency, some hidden terms)
  Trust Score: 90/100 (high data completeness)
═══════════════════════════════════════════════════════════════
✅ PRODUCT SCAN COMPLETE
═══════════════════════════════════════════════════════════════
```

---

## Merging Rules

### Rule 1: Base Product Selection
- **Use highest-weight source as base**
- **Reason:** Most reliable source provides structure

### Rule 2: Nutrition Data
- **Strategy:** Weighted average
- **Formula:** `(value1 × weight1 + value2 × weight2) / (weight1 + weight2)`
- **Reason:** Combine accuracy from multiple sources

### Rule 3: Ingredients
- **Strategy:** Use longest/most complete
- **Reason:** Longer list = more detailed = better for scoring

### Rule 4: Certifications
- **Strategy:** Union (combine all, no duplicates)
- **Reason:** Each source may have different certifications

### Rule 5: Categories
- **Strategy:** Use most specific (longest)
- **Reason:** More specific = better categorization

### Rule 6: Brand
- **Strategy:** Use most complete
- **Reason:** Some sources have full company names, others have abbreviations

### Rule 7: Images
- **Strategy:** Use first available
- **Reason:** Any image is better than none

### Rule 8: Eco-Score / Sustainability
- **Strategy:** Use if available (prefer higher-weight source)
- **Reason:** Not all sources have sustainability data

### Rule 9: Conflict Resolution
- **Strategy:** Higher-weight source wins
- **Reason:** More reliable source takes precedence

---

## Source Priority & Weights

### Weight Table

| Source Type | Weight | Examples |
|-------------|--------|----------|
| **Government** | 0.40 | USDA, FSANZ, Health Canada, GS1 |
| **Open Facts** | 0.35-0.40 | OFF, OBF, OPFF, OPF |
| **Store APIs** | 0.30 | Woolworths, Coles, NZ stores |
| **Verified APIs** | 0.20 | Go UPC, Buycott |
| **Free APIs** | 0.20 | UPCitemdb, Barcode Spider |
| **Web Search** | 0.10 | DuckDuckGo fallback |

### Priority Order (When Multiple Found)

1. **Government sources** (USDA, FSANZ, Health Canada, GS1)
2. **Open Facts family** (OFF, OBF, OPFF, OPF)
3. **Store APIs** (country-specific)
4. **Verified APIs** (Go UPC, Buycott)
5. **Free APIs** (UPCitemdb, Barcode Spider)
6. **Web Search** (last resort)

---

## Data Completeness Metrics

### Completeness Calculation

**Total Score (0-100) =**
- Nutrition (0-25)
- Ingredients (0-25)
- Certifications (0-15)
- Sustainability (0-15)
- Brand (0-10)
- Images (0-10)

### Nutrition Score (0-25)
- Energy: +5 points
- Macros (fat, carbs, protein): +10 points
- Micros (salt, fiber, sugars): +5 points
- Nutri-Score: +5 points

### Ingredients Score (0-25)
- Ingredients text: +15 points
- Ingredients array: +5 points
- Analysis tags: +3 points
- Additives: +2 points

### Certifications Score (0-15)
- Certifications array: +10 points
- Labels tags: +3 points
- Organic/Vegan: +2 points

### Sustainability Score (0-15)
- Eco-Score: +8 points
- Palm oil analysis: +4 points
- Packaging: +2 points
- Origin: +1 point

### Brand Score (0-10)
- Brand name: +7 points
- Brand tags: +3 points

### Images Score (0-10)
- Image URL: +8 points
- Images object: +2 points

---

## Logging Output

### What You'll See in PowerShell

When you scan a product, you'll see detailed logs showing:

1. **Product Scan Start**
   - Barcode and variants
   - User country

2. **Tier 1: Open Facts Family**
   - Each database query (✅ Found / ❌ Not found)
   - Data completeness for each found product

3. **Tier 1.5: Country-Specific Sources**
   - Country-specific queries (if applicable)
   - Data completeness

4. **Tier 2: Official Sources**
   - USDA, GS1 queries
   - Data completeness

5. **Merging Process** (if multiple sources)
   - All sources found
   - Source weights
   - Merging decisions
   - Final merged product completeness

6. **Enhancement Layer**
   - Before/after completeness
   - Enhancements applied (EWG, WWF, Leaping Bunny)

7. **Final Product Data**
   - Complete data breakdown
   - What data is available

8. **TruScore Calculation**
   - Final TruScore
   - Pillar breakdown
   - Trust score

---

## Summary

The Database Merger Strategy ensures:

1. **Maximum Data Completeness** - Combines best data from all sources
2. **Highest Accuracy** - Prioritizes reliable sources (government > official > community)
3. **Intelligent Merging** - Field-specific rules (nutrition = weighted average, ingredients = longest, etc.)
4. **Rich TruScore** - More complete data = more accurate scoring
5. **Transparency** - Detailed logging shows exactly what data came from where

**Result:** Users get the **richest, most accurate product information** possible, leading to a **more reliable TruScore**.

---

**End of Database Merger Strategy Explanation**
















