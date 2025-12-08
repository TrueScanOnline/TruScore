# How to Analyze TruScore Calculations

## Overview

This guide explains the **most reliable way** to analyze TruScore calculations for multiple barcodes with detailed breakdowns showing exactly how each pillar is calculated.

## Quick Start

### Method 1: PowerShell Script (Recommended)

```powershell
# Analyze multiple barcodes
.\scripts\run-truscore-analysis.ps1 -Barcodes "9420020300194","1234567890123","7890123456789"

# Or use npm
npm run analyze-truscore:ps1 -- -Barcodes "9420020300194","1234567890123"
```

### Method 2: Direct npm Command

```powershell
# Single barcode
npm run analyze-truscore -- 9420020300194

# Multiple barcodes
npm run analyze-truscore -- 9420020300194 1234567890123 7890123456789

# Comma-separated
npm run analyze-truscore -- --barcodes 9420020300194,1234567890123,7890123456789
```

### Method 3: From File

1. **Create `barcodes.txt`:**
   ```
   9420020300194
   1234567890123
   7890123456789
   ```

2. **Run analysis:**
   ```powershell
   npm run analyze-truscore -- --file barcodes.txt
   ```

## Output Format

The script provides **detailed step-by-step breakdowns** for each barcode:

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
      -3.0  3 additive(s) (estimated penalty: -1.5 each, capped at -15)
      -8.0  NOVA Group 4 (ultra-processed)

   Calculation: 15 (base)
                -11.0 (adjustments)
                = 4.0 (capped at 0-25)

🟢 [Planet Pillar] Final Score: 20/25 (80.0%)

   Base Score: 20/25

   Adjustments:

   ✅ Positive Points:
      +20.0  Eco-Score Grade B
      +5.0   Recyclable packaging (1 item(s))

   Calculation: 20 (base)
                +25.0 (adjustments)
                = 25.0 (capped at 0-25)

...
```

## Understanding the Breakdown

### Body Pillar (25 points)

**Base Score:**
- Nutri-Score A = 25 points
- Nutri-Score B = 20 points
- Nutri-Score C = 15 points
- Nutri-Score D = 10 points
- Nutri-Score E = 5 points
- **No Nutri-Score = 15 points (baseline)**

**Positive Adjustments:**
- ✅ NOVA Group 1 (unprocessed): **+3**

**Negative Adjustments:**
- ❌ Additives: **-0.5 to -3 per additive** (based on safety: safe=-0.5, caution=-1.5, avoid=-3)
- ❌ Risky tags (carcinogenic, endocrine, irritant): **-4 each**
- ❌ Irritants (paraben, phthalate, etc.): **-10**
- ❌ Fragrance/parfum: **-10**
- ❌ NOVA Group 3 (processed): **-3**
- ❌ NOVA Group 4 (ultra-processed): **-8**

**Capping:** Final score is capped at 0-25

### Planet Pillar (25 points)

**Base Score:**
- Eco-Score A = 25 points
- Eco-Score B = 20 points
- Eco-Score C = 15 points
- Eco-Score D = 10 points
- Eco-Score E = 5 points
- **No Eco-Score = 15 points (baseline)**

**Positive Adjustments:**
- ✅ Recyclable packaging (all): **+5**
- ✅ Recyclable packaging (some): **+2**

**Negative Adjustments:**
- ❌ Palm oil (non-certified): **-8**
- ❌ Palm oil (certified sustainable): **-5**

**Capping:** Final score is capped at 0-25

### Care Pillar (25 points)

**Base Score:**
- **15 points** (assumes ethical until violations)

**Positive Adjustments (stacked, cap +15):**
- ✅ Fairtrade: **+8**
- ✅ Organic: **+7**
- ✅ Rainforest Alliance: **+6**
- ✅ UTZ: **+6**
- ✅ MSC/ASC: **+6**
- ✅ RSPCA: **+5**
- ✅ B-Corp: **+5**
- ✅ Cage-Free/Free-Range: **+4**

**Negative Adjustments:**
- ❌ Cruel parent: **-15**
- ❌ Recalls (within 12 months): **-10**

**Capping:** Final score is capped at 0-25

### Open Pillar (25 points)

**Base Score:**
- **15 points** (assumes transparent until hidden)

**Positive Adjustments:**
- ✅ Full ingredients disclosure (>100 chars): **+15** (replaces base)
- ✅ Partial disclosure (>80%): **+10** (replaces base)
- ✅ Partial disclosure (50-80%): **+5** (replaces base)
- ✅ Sophistication bonus (zero hidden + NOVA 1-2): **+5**

**Negative Adjustments:**
- ❌ No ingredients: **-5**
- ❌ 1-2 hidden terms: **-10**
- ❌ 3+ hidden terms: **-20**
- ❌ No origin: **-8**

**Capping:** Final score is capped at 0-25

## Example Analysis Output

### High Score Product (85/100)

```
Barcode: 1234567890123
TruScore: 85/100

Body: 23/25
  Base: 20 (Nutri-Score B)
  +3 (NOVA Group 1)
  = 23

Planet: 25/25
  Base: 25 (Eco-Score A)
  +5 (Recyclable)
  = 25 (capped)

Care: 22/25
  Base: 15
  +7 (Organic)
  = 22

Open: 15/25
  Base: 15
  +15 (Full ingredients)
  -10 (2 hidden terms)
  -8 (No origin)
  = 12 (capped at 0)
```

### Low Score Product (25/100)

```
Barcode: 9876543210987
TruScore: 25/100

Body: 0/25
  Base: 5 (Nutri-Score E)
  -8 (NOVA Group 4)
  -12 (8 additives)
  = 0 (capped at 0)

Planet: 0/25
  Base: 5 (Eco-Score E)
  -8 (Palm oil)
  = 0 (capped at 0)

Care: 0/25
  Base: 15
  -15 (Cruel parent)
  -10 (Recalls)
  = 0 (capped at 0)

Open: 13/25
  Base: 15
  -5 (No ingredients)
  -8 (No origin)
  = 2 (capped at 0)
```

## Output Files

Results are automatically saved to:
```
truscore-analysis-{timestamp}.json
```

This JSON file contains:
- Complete product data
- Detailed breakdown for each pillar
- All adjustments (positive and negative)
- Final scores

## Best Practices

1. **Start Small:** Test with 2-3 barcodes first
2. **Compare Products:** Analyze similar products to see differences
3. **Review JSON:** Use JSON output for programmatic analysis
4. **Check Logs:** Review detailed logs for calculation steps

## Troubleshooting

### Product Not Found
- Verify barcode format (8-14 digits)
- Check internet connection
- Product may not exist in databases

### Unexpected Scores
- Review detailed breakdown
- Check base scores vs adjustments
- Verify product data quality
- Look for missing data (Nutri-Score, Eco-Score, etc.)

### Low Scores
- Check which pillars are low
- Review negative adjustments
- Look for missing certifications
- Check for palm oil, additives, hidden terms

## Advanced Usage

### Batch Analysis

Create `barcodes.txt`:
```
9420020300194
1234567890123
7890123456789
```

Run:
```powershell
npm run analyze-truscore -- --file barcodes.txt
```

### Programmatic Analysis

Results are saved as JSON:
```json
{
  "barcode": "9420020300194",
  "truScore": 47,
  "breakdown": {
    "Body": {
      "pillar": "Body",
      "base": 15,
      "adjustments": [...],
      "final": 15
    },
    ...
  }
}
```

---

**Date:** December 7, 2025  
**Status:** ✅ Ready to Use

