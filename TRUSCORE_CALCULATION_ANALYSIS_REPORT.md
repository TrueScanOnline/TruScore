# TruScore Calculation Analysis Report
## Critical Issues Identified

**Date:** December 8, 2025  
**Status:** 🔴 CRITICAL - Calculation Logic Mismatch

---

## Executive Summary

The TruScore calculation engine (`src/lib/truscoreEngine.ts`) does **NOT** follow the expected specification where all pillars start at base score 15 and then have adjustments applied. Instead, the code uses a **replacement-based system** where Nutri-Score and Eco-Score **replace** the base score entirely, rather than being adjustments to a base of 15.

Additionally, the analysis script (`scripts/analyze-truscore-standalone.ts`) **incorrectly displays** the calculation breakdown, making it appear that scores are being added when they are actually replacing the base.

---

## Issue #1: Base Score Inconsistency

### Expected Behavior
- **All 4 pillars should start at base score 15**
- Adjustments (positive or negative) should be applied to this base
- Final score = Base (15) + Adjustments

### Actual Behavior in Code

#### Body Pillar (Lines 224-363)
```typescript
// If Nutri-Score exists, use it
if (hasNutriScore) {
  const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
  body = gradeMapping[ns] || 15;  // ⚠️ REPLACES base, doesn't add to 15
} else {
  body = 15; // Only uses 15 if no Nutri-Score
}
```

**Problem:** 
- Nutri-Score **replaces** the base score, not added to it
- Nutri-Score D = 10 becomes the **starting point**, not base 15 + adjustment
- Nutri-Score E = 5 becomes the **starting point**, not base 15 + adjustment

#### Planet Pillar (Lines 365-439)
```typescript
// If Eco-Score exists, use it
if (hasEcoScore) {
  const gradeMapping: Record<string, number> = { a: 25, b: 20, c: 15, d: 10, e: 5 };
  planet = gradeMapping[es] || 15;  // ⚠️ REPLACES base, doesn't add to 15
} else {
  planet = 15; // Only uses 15 if no Eco-Score
}
```

**Problem:**
- Eco-Score **replaces** the base score, not added to it
- Eco-Score E = 5 becomes the **starting point**, not base 15 + adjustment
- This is why Eco-Score E appears as "5" instead of "15 - 10 = 5"

#### Ethics Pillar (Line 442)
```typescript
let care = 15; // Base (spec: 15 uniform, assumes ethical until violations)
```
✅ **CORRECT** - This pillar correctly starts at 15

#### Open Pillar (Lines 516-633)
```typescript
let open = 15; // Base (spec: 15 uniform, assumes transparent till hidden)

// ... ingredients score calculation ...

if (ingredientsScore >= 0) {
  open = ingredientsScore; // ⚠️ REPLACES base with ingredients score
} else {
  open += ingredientsScore; // Applies penalty to base
}
```

**Problem:**
- If ingredients score is positive (Full=15, >80%=10, 50-80%=5), it **replaces** the base
- Only negative ingredients scores are applied as adjustments
- This means "Full ingredients" (15) replaces base 15, but ">80%" (10) replaces base 15, resulting in 10 instead of 15

---

## Issue #2: Analysis Script Display Errors

### Problem in `calculateDetailedBreakdown()` Function

The analysis script incorrectly interprets the calculation logic:

#### Body Pillar Display (Lines 147-166)
```typescript
let bodyBase = 15;  // ⚠️ Always shows 15 as base

if (product.nutriscore_grade) {
  const gradeValue = gradeMapping[product.nutriscore_grade.toLowerCase()] || 15;
  bodyBase = gradeValue;  // ⚠️ Changes base to grade value
  bodyAdjustments.push({
    description: `Nutri-Score Grade ${product.nutriscore_grade.toUpperCase()}`,
    value: gradeValue,  // ⚠️ Shows as "positive" adjustment
    type: 'positive',
  });
}
```

**Display Error:**
- Shows "Base Score: 10/25" for Nutri-Score D
- Then shows "+10.0 Nutri-Score Grade D" as a positive adjustment
- This is **misleading** - the Nutri-Score value IS the base, not an adjustment
- The calculation shows: "10 (base) -2.5 (adjustments) = 0.0" which is correct, but the display makes it look like +10 was added

#### Planet Pillar Display (Lines 223-242)
```typescript
let planetBase = 15;  // ⚠️ Always shows 15 as base

if (product.ecoscore_grade) {
  const gradeValue = gradeMapping[product.ecoscore_grade.toLowerCase()] || 15;
  planetBase = gradeValue;  // ⚠️ Changes base to grade value
  planetAdjustments.push({
    description: `Eco-Score Grade ${product.ecoscore_grade.toUpperCase()}`,
    value: gradeValue,  // ⚠️ Shows as "positive" adjustment
    type: 'positive',
  });
}
```

**Display Error:**
- Shows "Base Score: 5/25" for Eco-Score E
- Then shows "+5.0 Eco-Score Grade E" as a positive adjustment
- This is **misleading** - Eco-Score E (5 points) should be shown as a **negative** relative to base 15, not as a positive adjustment
- User correctly identified: "Eco-Score Grade E should be negative points, not positive"

---

## Issue #3: Calculation Logic Mismatch

### Example: Barcode 9310055105850 (NUTRI GRAIN)

#### Body Pillar
**Actual Code Behavior:**
1. Nutri-Score D = 10 (replaces base, becomes starting point)
2. 3 additives × -1.5 = -4.5
3. NOVA Group 4 = -8
4. Calculation: 10 - 4.5 - 8 = -2.5 → capped at 0
5. **Final: 0/25**

**Expected Behavior (if base 15):**
1. Base = 15
2. Nutri-Score D adjustment = -5 (to get from 15 to 10)
3. 3 additives = -4.5
4. NOVA Group 4 = -8
5. Calculation: 15 - 5 - 4.5 - 8 = -2.5 → capped at 0
6. **Final: 0/25** (same result, but different logic)

**Analysis Script Display:**
- Shows "Base Score: 10/25" ✅ (correct - this is what code does)
- Shows "+10.0 Nutri-Score Grade D" ❌ (misleading - this is the base, not an adjustment)
- Shows "-4.5 3 additive(s)" ✅ (correct)
- Shows "-8.0 NOVA Group 4" ✅ (correct)
- Shows "10 (base) -2.5 (adjustments) = 0.0" ✅ (correct calculation, but misleading display)

#### Planet Pillar
**Actual Code Behavior:**
1. Eco-Score E = 5 (replaces base, becomes starting point)
2. Palm oil = -8
3. Calculation: 5 - 8 = -3 → capped at 0, but actually shows 5
4. **Final: 5/25** (Wait, this doesn't match... let me check the code again)

**Expected Behavior (if base 15):**
1. Base = 15
2. Eco-Score E adjustment = -10 (to get from 15 to 5)
3. Palm oil = -8
4. Calculation: 15 - 10 - 8 = -3 → capped at 0
5. **Final: 0/25** (different result!)

**Analysis Script Display:**
- Shows "Base Score: 5/25" ✅ (correct - this is what code does)
- Shows "+5.0 Eco-Score Grade E" ❌ (misleading - should show as negative relative to base 15)
- Shows "-8.0 Contains palm oil" ✅ (correct)
- Shows "5 (base) -3.0 (adjustments) = 5.0" ❌ (WRONG - should be 5 - 8 = -3, capped at 0, but shows 5)

**Wait - there's a bug!** The code shows planet = 5, but the calculation should be 5 - 8 = -3, which should cap at 0. But the output shows 5. Let me check the actual calculation...

Looking at line 439: `planet = Math.max(0, Math.min(25, Math.round(planet)));`

So if planet = 5 - 8 = -3, then Math.max(0, -3) = 0. But the output shows 5. This suggests the palm oil penalty might not be applied, or there's another issue.

---

## Issue #4: Open Pillar Special Case

### Actual Code Behavior (Lines 516-561)
```typescript
let open = 15; // Base

// Ingredients score calculation
if (ingredientsLength >= 100) {
  ingredientsScore = 15; // Full = 15 (replaces base)
} else if (ingredientsLength >= 80) {
  ingredientsScore = 10; // >80% = 10 (replaces base)
} else if (ingredientsLength >= 50) {
  ingredientsScore = 5; // 50-80% = 5 (replaces base)
} else {
  ingredientsScore = -5; // Penalty
}

// Apply ingredients score
if (ingredientsScore >= 0) {
  open = ingredientsScore; // ⚠️ REPLACES base
} else {
  open += ingredientsScore; // Applies penalty
}
```

**Problem:**
- For barcode 9310055105850: ingredientsLength = 817, so ingredientsScore = 15
- This **replaces** base 15, so open = 15
- Then hidden terms and origin penalties are applied: -8 (no origin)
- Final: 15 - 8 = 7 ✅ (matches output)

**But the display shows:**
- "Base Score: 15/25" ✅
- "+15.0 Full ingredients disclosure" ❌ (misleading - this replaces base, doesn't add to it)
- "-8.0 No origin information" ✅
- "15 (base) +7.0 (adjustments) = 7.0" ❌ (WRONG - should be 15 - 8 = 7, not 15 + 7 = 22)

---

## Root Cause Analysis

### Why the Code Works This Way

The code appears to be implementing a **"grade-based starting point"** system rather than a **"base + adjustments"** system:

1. **Body Pillar**: Uses Nutri-Score grade as the starting point (A=25, B=20, C=15, D=10, E=5)
2. **Planet Pillar**: Uses Eco-Score grade as the starting point (A=25, B=20, C=15, D=10, E=5)
3. **Ethics Pillar**: Always starts at 15 (correct)
4. **Open Pillar**: Starts at 15, but ingredients score can replace it

### Why This is Problematic

1. **Inconsistent Logic**: Body and Planet don't follow the same pattern as Care
2. **Misleading Display**: Analysis script shows replacements as "positive adjustments"
3. **User Expectation Mismatch**: Users expect base 15 + adjustments, not grade replacement
4. **Negative Grades Confusion**: Eco-Score E (5 points) appears as "+5" when it should be shown as "-10 from base 15"

---

## Specific Test Case Analysis

### Test Case 1: Barcode 9420020300194 (Sushi seaweed)

**Body Pillar:**
- Nutri-Score: "unknown" (invalid) → uses baseline 15 ✅
- No additives ✅
- No NOVA group ✅
- **Final: 15/25** ✅ (correct)

**Planet Pillar:**
- Eco-Score: "f" (invalid) → uses baseline 15 ✅
- No palm oil ✅
- **Final: 15/25** ✅ (correct)

**Open Pillar:**
- No ingredients → ingredientsScore = -5
- No origin → -8
- Calculation: 15 - 5 - 8 = 2 ✅
- **Final: 2/25** ✅ (correct)

**Analysis:** This case works correctly because invalid grades fall back to base 15.

---

### Test Case 2: Barcode 9310055105850 (NUTRI GRAIN)

**Body Pillar:**
- Nutri-Score D = 10 (replaces base) ⚠️
- 3 additives = -4.5
- NOVA Group 4 = -8
- Calculation: 10 - 4.5 - 8 = -2.5 → 0 ✅
- **Final: 0/25** ✅ (correct result, but wrong logic)

**Planet Pillar:**
- Eco-Score E = 5 (replaces base) ⚠️
- Palm oil = -8
- Calculation: 5 - 8 = -3 → should be 0, but shows 5 ❌
- **Final: 5/25** ❌ (BUG - should be 0)

**Open Pillar:**
- Full ingredients (817 chars) → ingredientsScore = 15 (replaces base) ⚠️
- No origin → -8
- Calculation: 15 - 8 = 7 ✅
- **Final: 7/25** ✅ (correct result, but wrong logic)

**Analysis:** 
- Body and Open work correctly (wrong logic, correct result)
- Planet shows 5, but calculation should be 5 - 8 = -3 → 0
  - **Possible causes:**
    1. Palm oil not detected in actual calculation (different detection logic)
    2. `palm_oil_analysis` not populated in product data
    3. Fallback detection (`ingredients_analysis_tags`) not matching
    4. Bug in calculation engine where palm oil penalty isn't applied

---

### Test Case 3: Barcode 9310055105904 (Malty flakes)

**Body Pillar:**
- Nutri-Score C = 15 (replaces base) ⚠️
- No additives ✅
- No NOVA group ✅
- **Final: 15/25** ✅ (correct)

**Planet Pillar:**
- Eco-Score E = 5 (replaces base) ⚠️
- No palm oil ✅
- **Final: 5/25** ⚠️ (correct for code logic, but should be 15 - 10 = 5 if using base 15)

**Open Pillar:**
- No ingredients → ingredientsScore = -5
- No origin → -8
- Calculation: 15 - 5 - 8 = 2 ✅
- **Final: 2/25** ✅ (correct)

---

## Display Issues in Analysis Script

### Issue 1: Nutri-Score/Eco-Score Shown as Adjustments

**Current Display:**
```
Base Score: 10/25
✅ Positive Points:
   +10.0  Nutri-Score Grade D
```

**Should Display:**
```
Base Score: 15/25
❌ Negative Points:
   -5.0  Nutri-Score Grade D (adjustment from base 15)
```

### Issue 2: Calculation String is Misleading

**Current Display:**
```
Calculation: 10 (base)
             -2.5 (adjustments)
             = 0.0 (capped at 0-25)
```

**Should Display:**
```
Calculation: 15 (base)
             -5.0 (Nutri-Score D adjustment)
             -4.5 (3 additives)
             -8.0 (NOVA Group 4)
             = -2.5 → 0.0 (capped at 0-25)
```

### Issue 3: Eco-Score E Shown as Positive

**Current Display:**
```
Base Score: 5/25
✅ Positive Points:
   +5.0  Eco-Score Grade E
```

**Should Display:**
```
Base Score: 15/25
❌ Negative Points:
   -10.0  Eco-Score Grade E (poor environmental score)
```

---

## Summary of Issues

### Critical Issues

1. ❌ **Base Score Inconsistency**: Body and Planet pillars don't start at 15 when Nutri-Score/Eco-Score exists
2. ❌ **Replacement Logic**: Nutri-Score and Eco-Score replace the base instead of being adjustments
3. ❌ **Display Misrepresentation**: Analysis script shows replacements as "positive adjustments"
4. ❌ **Planet Pillar Bug**: Barcode 9310055105850 shows planet = 5 when calculation should be 0

### Logic Issues

1. ⚠️ **Inconsistent Pillar Logic**: Ethics Pillar uses base 15 + adjustments, but Body/Planet use grade replacement
2. ⚠️ **Open Pillar Special Case**: Ingredients score replaces base instead of being an adjustment
3. ⚠️ **Negative Grades Confusion**: Low grades (D, E) should be shown as negative adjustments from base 15

### Display Issues

1. ⚠️ **Misleading Calculations**: Shows "10 (base) -2.5 = 0" when it should show "15 -5 -4.5 -8 = -2.5 → 0"
2. ⚠️ **Wrong Adjustment Types**: Shows Eco-Score E as "positive" when it should be "negative"
3. ⚠️ **Incorrect Totals**: Shows "15 (base) +7.0 (adjustments) = 7.0" when it should be "15 -8 = 7"

---

## Expected vs Actual Behavior Matrix

| Pillar | Expected Base | Actual Base (with grade) | Actual Base (no grade) | Issue |
|--------|---------------|-------------------------|------------------------|-------|
| Body   | 15            | Nutri-Score value (A=25, B=20, C=15, D=10, E=5) | 15 ✅ | ❌ Replacement instead of adjustment |
| Planet | 15            | Eco-Score value (A=25, B=20, C=15, D=10, E=5) | 15 ✅ | ❌ Replacement instead of adjustment |
| Care   | 15            | 15 ✅                    | 15 ✅ | ✅ Correct |
| Open   | 15            | Ingredients score (15/10/5) or 15 | 15 ✅ | ⚠️ Partial replacement logic |

---

## Recommendations

### Immediate Fixes Required

1. **Fix Base Score Logic**: All pillars must start at 15, then apply adjustments
2. **Fix Planet Pillar Bug**: Investigate why barcode 9310055105850 shows 5 instead of 0
3. **Fix Analysis Script Display**: Show correct base (15) and adjustments (including negative for low grades)
4. **Fix Calculation Display**: Show actual calculation steps, not misleading summaries

### Code Changes Needed

1. **Body Pillar**: Change from `body = gradeMapping[ns]` to `body = 15; body += (gradeMapping[ns] - 15)`
2. **Planet Pillar**: Change from `planet = gradeMapping[es]` to `planet = 15; planet += (gradeMapping[es] - 15)`
3. **Open Pillar**: Change ingredients score from replacement to adjustment
4. **Analysis Script**: Fix `calculateDetailedBreakdown()` to show correct base and adjustments

---

## Additional Findings: Analysis Script Calculation Display Bug

### Issue in `printPillarBreakdown()` Function (Lines 472-484)

The analysis script calculates `totalAdjustment` incorrectly:

```typescript
const totalAdjustment = pillar.adjustments.reduce((sum, adj) => {
  if (adj.type === 'positive') return sum + adj.value;
  if (adj.type === 'negative') return sum + adj.value;
  return sum;
}, 0);
```

**Problem:**
- For Planet pillar with Eco-Score E (5) and palm oil (-8):
  - Adjustments: `[+5.0 Eco-Score E, -8.0 Palm oil]`
  - `totalAdjustment = 5 + (-8) = -3`
  - Display: "5 (base) -3.0 (adjustments) = 5.0"
  - **This is WRONG** - it should show "5 - 8 = -3 → 0", not "5 - 3 = 5"

**Root Cause:**
- The script includes the Eco-Score value as an "adjustment" when it's actually the base
- This causes the total adjustment calculation to be incorrect
- The final score comes from the actual calculation engine (correct), but the display calculation is wrong

---

## Conclusion

The TruScore calculation engine uses a **grade replacement system** instead of the expected **base + adjustments system**. This causes:

1. **Inconsistent base scores** across pillars
2. **Misleading display** in the analysis script
3. **User confusion** about how scores are calculated
4. **Potential bugs** in the Planet pillar calculation (palm oil penalty may not be applied)
5. **Incorrect calculation display** in analysis script (shows wrong math)

### Key Issues Summary

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| Base score replacement (Body/Planet) | 🔴 Critical | `truscoreEngine.ts` | Inconsistent logic, user confusion |
| Display shows replacements as adjustments | 🔴 Critical | `analyze-truscore-standalone.ts` | Misleading output |
| Eco-Score E shown as positive | 🔴 Critical | `analyze-truscore-standalone.ts` | User confusion |
| Planet pillar palm oil bug | 🟡 High | `truscoreEngine.ts` | Incorrect scores |
| Calculation display math error | 🟡 High | `analyze-truscore-standalone.ts` | Misleading calculations |

The code needs to be refactored to use a consistent **base 15 + adjustments** model for all pillars, and the analysis script needs to be updated to correctly display the calculation breakdown.

---

## Next Steps

1. ✅ **Review this analysis report** (Current step)
2. ⏳ **Confirm expected behavior** (base 15 + adjustments for all pillars)
3. ⏳ **Implement fixes to calculation engine**:
   - Change Body pillar: `body = 15; body += (gradeMapping[ns] - 15)`
   - Change Planet pillar: `planet = 15; planet += (gradeMapping[es] - 15)`
   - Fix Open pillar ingredients score logic
   - Investigate Planet pillar palm oil bug
4. ⏳ **Fix analysis script display**:
   - Show base as always 15
   - Show Nutri-Score/Eco-Score as adjustments (gradeValue - 15)
   - Fix calculation display to show correct math
5. ⏳ **Re-test with provided barcodes**:
   - 9420020300194 (Sushi seaweed)
   - 9310055105850 (NUTRI GRAIN)
   - 9310055105904 (Malty flakes)

