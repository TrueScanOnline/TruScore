# TruScore Analysis Guide

## Overview

This guide explains how to analyze TruScore calculations for multiple barcodes with detailed breakdowns showing exactly how each pillar is calculated.

## Quick Start

### Method 1: Command Line Arguments

```powershell
# Analyze single barcode
npm run analyze-truscore -- 9420020300194

# Analyze multiple barcodes
npm run analyze-truscore -- 9420020300194 1234567890123 7890123456789

# Using comma-separated list
npm run analyze-truscore -- --barcodes 9420020300194,1234567890123,7890123456789
```

### Method 2: From File

1. **Create a text file** with barcodes (one per line):
   ```
   barcodes.txt
   9420020300194
   1234567890123
   7890123456789
   ```

2. **Run analysis:**
   ```powershell
   npm run analyze-truscore -- --file barcodes.txt
   ```

## Output Format

The script provides detailed breakdowns for each barcode:

```
═══════════════════════════════════════════════════════════
  Barcode: 9420020300194
═══════════════════════════════════════════════════════════

📊 Fetching product: 9420020300194...
✅ Product found: Sushi seaweed

🎯 TruScore: 47/100

🟡 [Body Pillar] Final Score: 15/25 (60.0%)

   Base Score: 15/25

   Adjustments:

   ⚪ Baseline/Neutral:
      15.0  No Nutri-Score available (baseline)

   ❌ Negative Points:
      -3.0  3 additive(s)
      -8.0  NOVA Group 4 (ultra-processed)

   Calculation: 15 (base)
                -11.0 (adjustments)
                = 4.0 (capped at 0-25)

🟢 [Planet Pillar] Final Score: 20/25 (80.0%)

   Base Score: 20/25

   Adjustments:

   ✅ Positive Points:
      +20.0  Eco-Score Grade B
      +5.0   Recyclable packaging

   Calculation: 20 (base)
                +25.0 (adjustments)
                = 25.0 (capped at 0-25)

...
```

## Understanding the Output

### Pillar Breakdown

Each pillar shows:
- **Base Score**: Starting point (usually 15, or Nutri-Score/Eco-Score value)
- **Positive Points**: Bonuses (certifications, recyclable packaging, etc.)
- **Negative Points**: Penalties (additives, palm oil, hidden terms, etc.)
- **Final Score**: Base + adjustments (capped at 0-25)

### Body Pillar (25 points)

**Base:**
- Nutri-Score Grade A = 25 points
- Nutri-Score Grade B = 20 points
- Nutri-Score Grade C = 15 points
- Nutri-Score Grade D = 10 points
- Nutri-Score Grade E = 5 points
- No Nutri-Score = 15 points (baseline)

**Positive Adjustments:**
- NOVA Group 1 (unprocessed): +3

**Negative Adjustments:**
- Additives: -0.5 to -3 per additive (based on safety rating)
- Risky tags (carcinogenic, endocrine, irritant): -4 each
- Irritants: -10
- Fragrance: -10
- NOVA Group 3 (processed): -3
- NOVA Group 4 (ultra-processed): -8

### Planet Pillar (25 points)

**Base:**
- Eco-Score Grade A = 25 points
- Eco-Score Grade B = 20 points
- Eco-Score Grade C = 15 points
- Eco-Score Grade D = 10 points
- Eco-Score Grade E = 5 points
- No Eco-Score = 15 points (baseline)

**Positive Adjustments:**
- Recyclable packaging: +5 (all recyclable) or +2 (some recyclable)

**Negative Adjustments:**
- Palm oil: -8 (non-certified) or -5 (certified sustainable)

### Care Pillar (25 points)

**Base:**
- 15 points (assumes ethical until violations)

**Positive Adjustments:**
- Fairtrade: +8
- Organic: +7
- Rainforest Alliance: +6
- UTZ: +6
- MSC/ASC: +6
- RSPCA: +5
- B-Corp: +5
- Cage-Free/Free-Range: +4
- **Cap: +15 total**

**Negative Adjustments:**
- Cruel parent: -15
- Recalls (within 12 months): -10

### Open Pillar (25 points)

**Base:**
- 15 points (assumes transparent until hidden)

**Positive Adjustments:**
- Full ingredients disclosure (>100 chars): +15
- Partial disclosure (>80%): +10
- Partial disclosure (50-80%): +5
- Sophistication bonus (zero hidden + NOVA 1-2): +5

**Negative Adjustments:**
- No ingredients: -5
- 1-2 hidden terms: -10
- 3+ hidden terms: -20
- No origin: -8

## Example Analysis

### Example 1: High Score Product

```
Barcode: 1234567890123
TruScore: 85/100

Body: 20/25
  +20 (Nutri-Score B)
  +3 (NOVA Group 1)
  = 23 (capped at 25)

Planet: 25/25
  +25 (Eco-Score A)
  +5 (Recyclable)
  = 25 (capped at 25)

Care: 22/25
  +15 (base)
  +7 (Organic)
  = 22

Open: 15/25
  +15 (base)
  +15 (Full ingredients)
  -10 (2 hidden terms)
  -8 (No origin)
  = 12 (capped at 0)
```

### Example 2: Low Score Product

```
Barcode: 9876543210987
TruScore: 25/100

Body: 5/25
  +5 (Nutri-Score E)
  -8 (NOVA Group 4)
  -12 (8 additives)
  = 0 (capped at 0)

Planet: 7/25
  +5 (Eco-Score E)
  -8 (Palm oil)
  = 0 (capped at 0)

Care: 5/25
  +15 (base)
  -15 (Cruel parent)
  -10 (Recalls)
  = 0 (capped at 0)

Open: 13/25
  +15 (base)
  -5 (No ingredients)
  -8 (No origin)
  = 2 (capped at 0)
```

## Output Files

Results are automatically saved to:
```
truscore-analysis-{timestamp}.json
```

This JSON file contains all detailed breakdowns for programmatic analysis.

## Tips

1. **Start with a few barcodes** to understand the format
2. **Compare similar products** to see scoring differences
3. **Check the JSON output** for detailed programmatic analysis
4. **Use file input** for batch analysis of many products

## Troubleshooting

### Product Not Found
- Verify barcode is correct
- Check internet connection
- Product may not exist in databases

### Low Scores
- Check which pillars are low
- Review negative adjustments
- Look for missing data (Nutri-Score, Eco-Score, etc.)

### Unexpected Scores
- Review detailed breakdown
- Check base scores vs adjustments
- Verify product data quality

---

**Date:** December 7, 2025

