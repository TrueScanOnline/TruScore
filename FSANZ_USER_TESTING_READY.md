# FSANZ User Testing - Complete Setup Guide

## ✅ Deployment Complete

### Status: READY FOR USER TESTING

All components are deployed and functional:

1. ✅ **Data Files:** `nzfcd.json` and `afcd.json` created with thousands of foods
2. ✅ **API Endpoint:** Deployed to Vercel at `https://truscoreapi.vercel.app/api/fsanz-query`
3. ✅ **App Integration:** `fsanzQueryService.ts` integrated into product flow
4. ✅ **Environment:** `.env` configured with API URL

## How to Test (For Users)

### Step 1: Restart App
```bash
npx expo start -c
```

### Step 2: Scan Any Product
- Open app
- Scan any barcode (milk, bread, apples, etc.)
- App will automatically query FSANZ by product name

### Step 3: Check Logs
Look for these log messages:
```
🔍 Querying FSANZ (NZ) by product name: "Product Name"...
✅ FSANZ: Enhanced product with official nutrition data
```

### Step 4: Verify TruScore
- Check that TruScore shows enhanced data
- Source should show: `openfoodfacts+nzfcd` or `openfoodfacts+afcd`

## Expected Behavior

### For NZ Users:
- ✅ Automatically queries NZFCD database
- ✅ Matches product names to official NZ food database
- ✅ Enhances product with official nutrition data
- ✅ Uses FSANZ data in TruScore calculation

### For AU Users:
- ✅ Automatically queries AFCD database
- ✅ Matches product names to official AU food database
- ✅ Enhances product with official nutrition data
- ✅ Uses FSANZ data in TruScore calculation

## Test Cases

### Common Products (Should Match):
1. **Milk** → Should match "Milk" in database
2. **Apple** → Should match "Apple" in database
3. **Bread** → Should match "Bread" in database
4. **Baked Beans** → Should match "Baked beans" in database
5. **Chicken** → Should match "Chicken" in database

### Product Name Variations (Fuzzy Matching):
1. **"Pams Fresh Milk 2L"** → Should fuzzy match to "Milk"
2. **"Anchor Butter 500g"** → Should fuzzy match to "Butter"
3. **"Woolworths Full Cream Milk 2L"** → Should fuzzy match to "Milk"

## Troubleshooting

### If FSANZ Query Doesn't Work:

1. **Check API URL:**
   - Verify `.env` has: `EXPO_PUBLIC_FSANZ_QUERY_URL=https://truscoreapi.vercel.app/api/fsanz-query`
   - Restart app after changing `.env`

2. **Check Logs:**
   - Look for error messages in app logs
   - Check if API endpoint is accessible

3. **Verify Country Detection:**
   - Ensure app detects user as NZ or AU
   - Check `getUserCountryCode()` returns correct country

4. **Test API Directly:**
   ```bash
   node scripts/verifyFSANZDeployment.js
   ```

## Success Indicators

✅ **API Responds:** Test script shows successful matches  
✅ **App Logs:** Show FSANZ query and enhancement  
✅ **TruScore:** Shows enhanced nutrition data  
✅ **Source:** Shows `openfoodfacts+nzfcd` or `openfoodfacts+afcd`  

## Summary

**The FSANZ database system is fully deployed and ready for user testing!**

- ✅ Thousands of foods available (not just 4-5)
- ✅ Automatic query by product name
- ✅ Official government nutrition data
- ✅ Integrated with TruScore calculation
- ✅ Ready for real-world testing

**Start testing by scanning any product barcode!** 🎉
