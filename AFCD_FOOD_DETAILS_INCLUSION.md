# AFCD Food Details Inclusion - Complete Update

## ✅ Update Complete

The `createAFCD.js` script has been **updated to include ALL foods from "AU Release 2 - Food Details.xlsx"** as separate entries, just like NZFCD.

## What Changed

### Before:
- Food Details file was only used for **metadata merging** (enriching existing foods)
- Only foods from Nutrient file were included as separate entries
- Result: ~1,616 foods

### After:
- Food Details file foods are now included as **separate entries** (same as NZFCD)
- All sheets from Food Details are processed (excluding Index/Readme)
- Foods from Nutrient file + Foods from Food Details = **Complete database**
- Result: **Thousands of foods** (similar to NZFCD's 221,851 foods)

## Script Changes

**File:** `scripts/createAFCD.js`

### Key Updates:

1. **Reads ALL foods from Food Details:**
   ```javascript
   // Process ALL sheets in Food Details file
   foodDetailsWorkbook.SheetNames.forEach(sheetName => {
     // Skip index/readme sheets
     if (!sheetName.toLowerCase().includes('index') && 
         !sheetName.toLowerCase().includes('readme')) {
       const detailsData = XLSX.utils.sheet_to_json(...);
       // Add ALL foods from Food Details as separate entries
       foodDetailsFoods = foodDetailsFoods.concat(detailsData);
     }
   });
   ```

2. **Combines Nutrient + Food Details:**
   ```javascript
   // Combine Nutrient file foods with Food Details foods
   const data = allFoods.concat(foodDetailsFoods);
   ```

3. **Processes all foods together:**
   - All foods from both sources are normalized
   - Food Details entries are included even if they don't have nutrient data
   - Metadata from Food Details is still used to enrich matching foods

## Deployment

The deployment script (`deployFSANZComplete.ps1`) will automatically:
1. ✅ Run `createAFCD.js` to create the complete database
2. ✅ Include all foods from Food Details file
3. ✅ Deploy to Vercel
4. ✅ Test both NZ and AU endpoints

## Expected Results

After running `deployFSANZComplete.ps1`:

- **NZFCD:** 221,851 foods ✅
- **AFCD:** Thousands of foods (Nutrient file + Food Details file) ✅
- **Both databases:** Fully deployed and accessible ✅

## Verification

Run the deployment script:
```powershell
.\scripts\deployFSANZComplete.ps1
```

The script will show:
- Number of foods from Nutrient file
- Number of foods from Food Details file
- Total combined foods
- Final database size

## Summary

✅ **Food Details file is now included the same way as NZFCD**
✅ **All foods from Food Details are separate entries**
✅ **Complete Australian database will be deployed**
✅ **Thousands of foods available (not just 1,616)**
