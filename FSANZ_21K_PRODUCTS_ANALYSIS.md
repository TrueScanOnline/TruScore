# FSANZ 21,000+ Products Deep Analysis

## Executive Summary

This document provides a comprehensive analysis of the FSANZ database files to locate and process all 21,000+ products mentioned by the user. The analysis covers all Excel files and their tabs within the `Database files` directory.

## Current Status

### Existing Database Files
- **AFCD (Australia)**: Currently contains ~17,000+ entries (from `backend/vercel/data/afcd.json`)
- **NZFCD (New Zealand)**: Currently contains entries but may have parsing issues (from `backend/vercel/data/nzfcd.json`)
- **Total Current**: Unknown exact count due to parsing issues in NZFCD

### Issue Identified
The user reports that FSANZ should contain **over 21,000 products**, but the current implementation may not be processing all available data sources.

## Files Analyzed

### Australian (AFCD) Files
1. **AU Release 2 - Nutrient file.xlsx**
   - Currently processed by `createAFCD.js`
   - Contains nutrient data per 100g and per 100mL
   - **Action**: Verify ALL tabs are being processed

2. **AU Release 2 - Food Details.xlsx**
   - Currently processed by `createAFCD.js`
   - Contains food metadata and details
   - **Action**: Verify ALL tabs are being processed

3. **Food Records archived from latest version of FOODfiles.xlsx** ⚠️
   - **NOT currently processed**
   - May contain archived food records
   - **Action**: Add to processing pipeline

4. **New Food Records replacing old Food Records in latest version of FOODfiles.xlsx** ⚠️
   - **NOT currently processed**
   - May contain new food records
   - **Action**: Add to processing pipeline

5. **Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx** ⚠️
   - **NOT currently processed**
   - May contain updated food records
   - **Action**: Add to processing pipeline

### New Zealand (NZFCD) Files
1. **Standard DATA.AP.xlsx**
   - Currently processed by `createNZFCD.js` (but may have issues)
   - Contains standard food composition data
   - **Action**: Verify ALL tabs are processed correctly

2. **Standard DATA.FT.xlsx**
   - May not be fully processed
   - Contains food composition data in different format
   - **Action**: Ensure this file is processed

3. **Unabridged DATA.AP.xlsx** ⚠️
   - **NOT currently processed**
   - May contain additional food records
   - **Action**: Add to processing pipeline

4. **Unabridged DATA.FT.xlsx** ⚠️
   - **NOT currently processed**
   - May contain additional food records
   - **Action**: Add to processing pipeline

5. **Food Records archived/New/Updated files** (same as AU) ⚠️
   - **NOT currently processed for NZ**
   - **Action**: Add to processing pipeline

## Root Cause Analysis

### Why Only 4 Products Were Initially Found
1. **Incorrect Architecture**: The app was trying to query FSANZ by barcode, but FSANZ databases are food composition databases that don't have barcodes.
2. **Limited Data Source**: Only the "Standard DATA.AP" text file was being processed (~2,860 foods).
3. **Missing Files**: Several Excel files containing additional food records were not being processed.

### Why We Need 21,000+ Products
The user has indicated that FSANZ should contain over 21,000 products. This suggests:
- Multiple data sources need to be combined
- All tabs within Excel files need to be processed
- Archived, new, and updated food records need to be included
- Both Standard and Unabridged datasets need to be processed

## Solution Implementation

### Step 1: Enhanced Processing Script
Created `scripts/createComprehensiveFSANZ.js` which:
- Processes ALL Excel files (not just the main ones)
- Processes ALL tabs in each Excel file
- Handles archived, new, and updated food records
- Combines data from multiple sources
- Deduplicates based on food name/key

### Step 2: Process All Excel Files
The comprehensive script processes:

**For AFCD (Australia):**
- AU Release 2 - Nutrient file.xlsx (all tabs)
- AU Release 2 - Food Details.xlsx (all tabs)
- Food Records archived from latest version of FOODfiles.xlsx (all tabs)
- New Food Records replacing old Food Records in latest version of FOODfiles.xlsx (all tabs)
- Data added to or updated in the Food Records in the latest version of FOODfiles.xlsx (all tabs)

**For NZFCD (New Zealand):**
- Standard DATA.AP.xlsx (all tabs)
- Standard DATA.FT.xlsx (all tabs)
- Unabridged DATA.AP.xlsx (all tabs)
- Unabridged DATA.FT.xlsx (all tabs)
- Food Records archived/New/Updated files (all tabs)

### Step 3: Data Normalization
The script normalizes data from various sources by:
- Handling multiple column name variations
- Extracting food names from various fields
- Parsing nutrient values with flexible column matching
- Preserving source information for debugging

### Step 4: Deduplication
- Removes duplicates based on food name (case-insensitive)
- Preserves the most complete record when duplicates are found
- Tracks source file/sheet for each food record

## Expected Results

After running the comprehensive processing script:
- **AFCD**: Should contain all Australian food records from all sources
- **NZFCD**: Should contain all New Zealand food records from all sources
- **Total**: Should reach or exceed 21,000 products

## Verification Steps

1. **Run Comprehensive Script**:
   ```bash
   node scripts/createComprehensiveFSANZ.js
   ```

2. **Check Product Counts**:
   ```bash
   node scripts/countFSANZProducts.js
   ```

3. **Verify API Endpoint**:
   - Ensure `backend/vercel/api/fsanz-query.ts` can query the new databases
   - Test with sample product names

4. **Test in App**:
   - Scan a barcode in AU/NZ
   - Verify FSANZ data is returned via name-based query
   - Check TruScore calculation uses FSANZ data

## Files Modified/Created

### New Files
1. `scripts/createComprehensiveFSANZ.js` - Comprehensive processing script
2. `scripts/countFSANZProducts.js` - Product counting script
3. `FSANZ_COMPREHENSIVE_PROCESSING.log` - Processing log (generated)
4. `FSANZ_PRODUCT_COUNT_REPORT.txt` - Count report (generated)

### Files to Update
1. `scripts/createAFCD.js` - May need updates if comprehensive script works better
2. `scripts/createNZFCD.js` - May need updates if comprehensive script works better
3. `backend/vercel/api/fsanz-query.ts` - Verify it works with expanded databases

## Next Steps

1. ✅ **Created comprehensive processing script** (`createComprehensiveFSANZ.js`)
2. ⏳ **Run the script** to process all Excel files and tabs
3. ⏳ **Verify product counts** reach 21,000+
4. ⏳ **Update deployment** to include new database files
5. ⏳ **Test API endpoint** with expanded databases
6. ⏳ **Verify app integration** works correctly

## Important Notes

1. **FSANZ databases are food composition databases** - they don't have barcodes. They must be queried by product name after a barcode scan provides the product name.

2. **Data Quality**: The comprehensive script includes source tracking (`_sourceFile`, `_sourceSheet`, `_sourceType`) to help debug data quality issues.

3. **Deduplication**: The script removes duplicates based on food name (case-insensitive) to ensure each unique food appears only once.

4. **Flexible Parsing**: The script handles various column name formats to accommodate different Excel file structures.

## Conclusion

The comprehensive processing script (`createComprehensiveFSANZ.js`) has been created to process ALL Excel files and ALL tabs within the `Database files` directory. This should capture all 21,000+ FSANZ products from all available sources.

The next step is to run the script and verify that it successfully processes all files and reaches the 21,000+ product target.

