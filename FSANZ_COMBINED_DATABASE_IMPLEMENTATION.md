# FSANZ Combined Database Implementation

## Overview

The FSANZ integration now uses **both NZFCD and AFCD databases** for all users, regardless of their location. This provides maximum coverage and ensures the best possible TruScore results.

## Database Coverage

- **NZFCD**: 2,857 foods (New Zealand FOODfiles™ 2024)
- **AFCD**: 17,109 foods (Australian Food Composition Database)
- **Combined Total**: ~20,000 foods available for TruScore

## Implementation Details

### 1. API Endpoint (`/api/fsanz-query`)

**Updated Behavior:**
- Searches **both databases** for all users (NZ and AU)
- Returns the **best match** from either database
- Prioritizes matches based on score, not location

**Code Changes:**
- Modified `backend/vercel/api/fsanz-query.ts`
- Removed location-based restrictions
- Added dual-database search logic
- Returns best match regardless of source

### 2. TruScore Integration

**Updated Behavior:**
- Queries both databases when searching for FSANZ data
- Uses primary country database first, then falls back to other database
- Combines results for maximum nutrition data coverage

**Code Changes:**
- Modified `src/data/databases/truScoreOptimizedDatabase.ts`
- Added fallback logic to query both databases
- Logs which database provided the match

### 3. Query Service

**Current Behavior:**
- `fsanzQueryService.ts` already supports querying by country
- Now queries both countries for maximum coverage
- Returns best match from either database

## Benefits

1. **Maximum Coverage**: Users have access to ~20,000 foods instead of just their country's database
2. **Better Matches**: If a product isn't found in one database, it searches the other
3. **Improved TruScore**: More nutrition data available for calculations
4. **Location Independence**: Users get best results regardless of their location

## Testing

Run the test script to verify both databases are accessible:

```powershell
node scripts/testCombinedFSANZDatabases.js
```

This will:
- Load both NZFCD and AFCD databases
- Test product name matching in both
- Show which database provides the best match
- Verify combined coverage

## Deployment

1. ✅ Both databases generated (`nzfcd.json` and `afcd.json`)
2. ✅ API endpoint updated to search both databases
3. ✅ TruScore integration updated
4. ⏳ Deploy to Vercel
5. ⏳ Test with real barcodes in app

## Next Steps

1. Deploy updated API to Vercel
2. Test with real barcodes (9313958005890, 9310047207180, 9310645467740)
3. Verify TruScore uses data from both databases
4. Monitor logs to see which database provides matches

## Files Modified

- `backend/vercel/api/fsanz-query.ts` - Updated to search both databases
- `src/data/databases/truScoreOptimizedDatabase.ts` - Added fallback to query both databases
- `scripts/testCombinedFSANZDatabases.js` - Test script for combined databases

