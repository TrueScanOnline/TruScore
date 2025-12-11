# Open Pillar Fixes - Ingredients & Origin Detection

## Issues Fixed

### Issue 1: Ingredients Disclosure Penalty for Simple Products
**Problem**: Products with simple but complete ingredient lists (e.g., "99.5% peanuts, 0.05% salt") were being penalized for having "minimal ingredients disclosure" even though they were actually complete.

**Root Cause**: The logic used character count as the only indicator of completeness, penalizing any list under 50 characters.

**Solution**: Now checks for **completeness indicators**:
- **Percentages**: If ingredients include percentages (e.g., "99.5% peanuts"), it's considered complete
- **Multiple ingredients**: If there are 2+ ingredients and the list is ≥20 characters, it's considered complete
- **Short with percentages**: If percentages are present and list is ≥15 characters, it's complete

**Example**:
- Before: "99.5% peanuts, 0.05% salt" → -5 points (minimal disclosure)
- After: "99.5% peanuts, 0.05% salt" → 0 points (complete disclosure)

### Issue 2: Origin Detection Missing Text Fields
**Problem**: Products with "Product made in New Zealand" on the label were still getting -8 points for "No origin information" because the origin detection only checked structured fields (`origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`) and didn't check text fields where this information might appear.

**Root Cause**: The Open Pillar had its own origin detection logic that didn't match the comprehensive logic in `extractManufacturingCountry()`.

**Solution**: Now checks **all possible fields** where origin information might appear:
- Structured fields: `origins_tags`, `manufacturing_places_tags`, `origins`, `manufacturing_places`
- Text fields: `product_name`, `product_name_en`, `generic_name`, `labels`, `labels_en`
- Pattern matching: Detects "Product made in X", "Made in X", "Manufactured in X", etc. in text fields

**Example**:
- Before: Product with "Product made in New Zealand" in `product_name` → -8 points (no origin)
- After: Product with "Product made in New Zealand" in `product_name` → 0 points (origin found)

---

## Code Changes

### 1. Ingredients Disclosure Logic (`openPillar.ts`)

**Before**:
```typescript
// Only checked character count
if (ingredientsLength >= 100) {
  // Full disclosure
} else if (ingredientsLength >= 50) {
  // Partial disclosure
} else {
  // Minimal disclosure (penalty)
}
```

**After**:
```typescript
// Check for completeness indicators
const hasPercentages = /\d+\.?\d*\s*%/.test(ingredientsText);
const hasMultipleIngredients = ingredientsText.split(',').length >= 2;
const hasCompleteFormat = hasPercentages || (hasMultipleIngredients && ingredientsLength >= 20);

if (hasCompleteFormat || (hasPercentages && ingredientsLength >= 15)) {
  // Complete disclosure - no penalty
} else if (ingredientsLength >= 100) {
  // Long list = likely complete
} else if (ingredientsLength >= 50) {
  // Partial disclosure
} else {
  // Minimal disclosure (penalty)
}
```

### 2. Origin Detection Logic (`openPillar.ts`)

**Before**:
```typescript
// Only checked structured fields
const hasOrigin = hasOriginTags || hasManufacturingTags || hasOriginString || hasManufacturingString;
```

**After**:
```typescript
// Check text fields for origin patterns
const textFields = [
  product.product_name,
  product.product_name_en,
  product.generic_name,
  product.labels,
  product.labels_en,
].filter(Boolean).join(' ').toLowerCase();

const originPattern = /(?:product\s+(?:of|made\s+in)|made\s+in|origin:|origin\s+of|manufactured\s+in)\s+([a-z\s]+?)(?:[,;]|\s*$)/i;
const hasOriginInText = originPattern.test(textFields);

// Check all fields
const hasOrigin = hasOriginTags || hasManufacturingTags || hasOriginString || hasManufacturingString || hasOriginInText;
```

---

## Testing

To test these fixes:

```powershell
# Test with a simple product (e.g., peanut butter)
npm run analyze-pillar -- open 9420020300194

# Test with a product that has origin in text fields
npm run analyze-pillar -- open <barcode>
```

**Expected Results**:
1. Simple products with percentages should show "Complete ingredients disclosure" (0 points)
2. Products with "Product made in X" in text fields should show "Origin information available" (0 points)

---

## Impact

### Before Fixes
- **Peanut Butter** (99.5% peanuts, 0.05% salt):
  - Ingredients: -5 points (minimal disclosure)
  - Origin: -8 points (no origin)
  - **Total: 2/25** (15 - 5 - 8 = 2)

### After Fixes
- **Peanut Butter** (99.5% peanuts, 0.05% salt):
  - Ingredients: 0 points (complete disclosure)
  - Origin: 0 points (origin found in text)
  - **Total: 15/25** (15 + 0 + 0 = 15)

**Improvement**: +13 points for simple but complete products!

---

## Files Modified

- `src/lib/truscoreEngine/pillars/openPillar.ts`
  - Updated ingredients disclosure logic (lines 77-146)
  - Updated origin detection logic (lines 185-235)

---

## Notes

1. **Ingredients completeness** is now determined by:
   - Presence of percentages (indicates precise disclosure)
   - Multiple ingredients (indicates full list)
   - Character count (fallback for long lists)

2. **Origin detection** now matches the comprehensive logic in `extractManufacturingCountry()`, ensuring consistency across the app.

3. Both fixes maintain backward compatibility - existing products will continue to work, but simple products and products with origin in text fields will now be scored more accurately.



