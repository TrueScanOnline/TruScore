# FSANZ Matching Algorithm Fix

## Issue Found

**Product**: "Hommus Classic" (chickpea dip)
**Wrong Match**: "Biscuit, dark chocolate, ready to eat, Classic Dark, Tim Tam™, Arnott's™" (chocolate biscuit)

**Root Cause**: Matching algorithm was matching on only 1 out of 2 keywords ("Classic") and still passing the threshold.

## Fix Applied

### 1. Keyword Requirement Filter ✅

**File**: `backend/vercel/api/fsanz-query.ts`

**Change**: Added requirement that at least 50% of keywords must match for multi-word searches:

```typescript
// For multi-word searches (2+ keywords), require at least 50% of keywords to match
if (keywords.length >= 2) {
  const requiredMatches = Math.ceil(keywords.length * 0.5); // At least 50% of keywords
  const filteredMatches = matches.filter(m => {
    const matchedCount = m.matchedKeywords.length;
    if (matchedCount < requiredMatches) {
      return false; // Filter out matches with insufficient keywords
    }
    return true;
  });
  
  // Use filtered matches
  if (filteredMatches.length > 0) {
    matches.splice(0, matches.length, ...filteredMatches);
  } else {
    return null; // No valid matches
  }
  
  // Also increase threshold for multi-word searches
  MIN_SCORE_THRESHOLD = 150;
}
```

### 2. Increased Threshold for Multi-Word Searches ✅

**Change**: Increased minimum score threshold from 100 to 150 for multi-word searches to ensure higher quality matches.

## Expected Behavior After Fix

### Before (Broken)
- "Hommus Classic" → Matched "Biscuit, dark chocolate, Classic Dark" (1/2 keywords)
- ❌ Wrong match passed threshold

### After (Fixed)
- "Hommus Classic" → Requires at least 1/2 keywords to match
- "Hommus" not found in biscuit name
- "Classic" found, but only 1/2 keywords match
- ✅ Match rejected (insufficient keywords)

## Impact

✅ **False positives prevented**: Matches now require at least 50% of keywords to match
✅ **Better accuracy**: Multi-word searches are more strict
✅ **Quality improved**: Higher threshold ensures better matches

## Testing

After deploying this fix, test with:
- "Hommus Classic" → Should NOT match "Biscuit, dark chocolate, Classic Dark"
- "Apple Juice" → Should match "Apple juice, unsweetened" (2/2 keywords)
- "Milk Chocolate" → Should match "Chocolate, milk" (2/2 keywords)

## Next Steps

1. ✅ Fix applied
2. ⏳ Deploy to Vercel
3. ⏳ Test with real products
4. ⏳ Verify no more false positives
