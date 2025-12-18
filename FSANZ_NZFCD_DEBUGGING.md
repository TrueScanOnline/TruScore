# NZFCD Matching Issue - Debugging Guide

## Problem

- ✅ API is working (200 status)
- ✅ AFCD database is working (found "Milk" and "Apple")
- ❌ NZFCD database is NOT finding matches (even with 221,851 foods)

## Enhanced Logging Deployed

The latest deployment includes comprehensive logging to diagnose the issue:

1. **Database Loading Logs:**
   - Database size
   - Database type (Array check)
   - Sample entry structure
   - Direct contains search test

2. **Matching Algorithm Logs:**
   - First 5 database entries
   - Keyword extraction
   - Matching attempts
   - Match results

## How to Check Vercel Logs

1. Go to: https://vercel.com/leightons-projects-d328c774/truscoreapi
2. Click on the latest deployment
3. Go to **Functions** tab
4. Click on `api/fsanz-query`
5. Check **Logs** tab
6. Look for:
   - `[FSANZ-QUERY] Database loaded: X foods`
   - `[FSANZ-QUERY] Sample entry keys: ...`
   - `[FSANZ-QUERY] Direct contains search for "milk": X matches`
   - `[MATCH] Database size: X, checking first 10 entries...`
   - `[MATCH] Entry 0: foodName="...", foodNameLower="..."`

## Possible Issues

### Issue 1: Database Not Loading
**Symptoms:** Logs show "Database loaded: 0 foods"
**Fix:** Check file paths in `loadNZFCDDatabase()`

### Issue 2: Database Structure Different
**Symptoms:** Logs show different keys than expected
**Fix:** Update matching algorithm to handle structure

### Issue 3: Performance/Timeout
**Symptoms:** Database loads but matching times out
**Fix:** Optimize matching algorithm or increase function timeout

### Issue 4: File Size Limit
**Symptoms:** Database partially loads (e.g., only first N entries)
**Fix:** Check Vercel function memory/timeout limits

## Next Steps

1. **Wait 90 seconds** for deployment to complete
2. **Test API:**
   ```powershell
   .\scripts\testFSANZAfterDeploy.ps1
   ```
3. **Check Vercel logs** (see above)
4. **Share logs** to identify the exact issue

## Expected Log Output

When testing "Milk" for NZ, you should see:
```
[FSANZ-QUERY] Database loaded: 221851 foods
[FSANZ-QUERY] Database type: Array
[FSANZ-QUERY] Sample entry keys: foodName, foodNameLower, ...
[FSANZ-QUERY] Sample foodName: [some food name]
[FSANZ-QUERY] Direct contains search for "milk": [number] matches
[MATCH] Single keyword search, trying simple contains match for: "milk"
[MATCH] Database size: 221851, checking first 10 entries...
[MATCH] Entry 0: foodName="...", foodNameLower="..."
```

If you see "Direct contains search for 'milk': 0 matches", then the database structure is different than expected.














