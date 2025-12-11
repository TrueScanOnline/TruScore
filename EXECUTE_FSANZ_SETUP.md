# FSANZ Database Setup - Execute Now

**Date:** January 2025  
**Status:** ✅ All Infrastructure Ready - Follow Steps Below

---

## 🎯 Complete Setup Process

I've created **all the infrastructure**. Now follow these steps to complete the setup:

---

## Step 1: Download FSANZ Databases

### For Australia:

1. **Open your browser** and go to:
   ```
   https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
   ```

2. **Find the download link** for the Australian Food Composition Database
   - Look for "Download" button or Excel file link
   - May require clicking through pages to find the actual file

3. **Download the Excel file**
   - File typically named: `AFCD_Data.xlsx` or similar
   - Save to: `C:\TrueScan-FoodScanner\downloads\fsanz-au.xlsx`

### For New Zealand:

1. **Open your browser** and go to:
   ```
   https://foodcomposition.co.nz/foodfiles
   ```

2. **Download FOODfiles™ 2024**
   - Look for download link for Excel format
   - Or download MSI installer and extract Excel files

3. **Save Excel file** to: `C:\TrueScan-FoodScanner\downloads\fsanz-nz.xlsx`

---

## Step 2: Convert Excel to JSON

**Run these commands:**

```powershell
# Convert AU database
npm run import-fsanz -- --input downloads\fsanz-au.xlsx --output data\fsanz-au.json --country AU

# Convert NZ database
npm run import-fsanz -- --input downloads\fsanz-nz.xlsx --output data\fsanz-nz.json --country NZ
```

**Expected Output:**
- ✅ Files created in `data/` directory
- ✅ File sizes: ~10-50MB each
- ✅ Valid JSON format

---

## Step 3: Prepare Vercel Backend

**Copy JSON files to Vercel backend:**

```powershell
# Create data directory
New-Item -ItemType Directory -Path backend\vercel\data -Force

# Copy JSON files
Copy-Item data\fsanz-au.json backend\vercel\data\
Copy-Item data\fsanz-nz.json backend\vercel\data\
```

---

## Step 4: Deploy to Vercel

**Deploy the backend:**

```powershell
cd backend\vercel
vercel --prod
```

**After deployment:**
1. Copy the deployment URL (e.g., `https://truescan-backend-abc123.vercel.app`)
2. Save it - you'll need it for the next step

---

## Step 5: Configure App URLs

**Edit `.env` file in project root:**

Add these lines:
```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
```

**Replace `your-vercel-url` with your actual Vercel deployment URL.**

---

## Step 6: Restart App

```powershell
# Stop current server (Ctrl+C if running)
# Then restart
npm start
```

---

## Step 7: Verify

1. **Launch app** as a NZ or AU user
2. **Check startup logs** - should show:
   ```
   ✅ FSANZ NZ Database: AVAILABLE
      Products: 50,000
      Status: Ready for queries
   ```
3. **Scan a product** - FSANZ should be queried automatically

---

## ✅ All Done!

After completing these steps:

- ✅ FSANZ databases automatically download on first launch
- ✅ Available for all NZ/AU users
- ✅ Queried on every product scan
- ✅ Best-in-class accuracy for these markets

---

## 📝 Quick Command Reference

```powershell
# Convert databases
npm run import-fsanz -- --input downloads\fsanz-au.xlsx --output data\fsanz-au.json --country AU
npm run import-fsanz -- --input downloads\fsanz-nz.xlsx --output data\fsanz-nz.json --country NZ

# Copy to Vercel backend
Copy-Item data\fsanz-*.json backend\vercel\data\

# Deploy to Vercel
cd backend\vercel
vercel --prod

# Update .env with URLs, then restart app
```

---

**Status:** Infrastructure ready - just follow the steps above! 🚀












