# FSANZ Database Quick Start Guide

**🎯 Goal:** Get FSANZ databases automatically available for all NZ/AU users

---

## ⚡ Fastest Path to Success

### Step 1: Download Databases (Manual - Required First Time)

**Australia:**
1. Go to: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
2. Download Excel file
3. Save as: `downloads/fsanz-au.xlsx`

**New Zealand:**
1. Go to: https://foodcomposition.co.nz/foodfiles
2. Download Excel file
3. Save as: `downloads/fsanz-nz.xlsx`

### Step 2: Convert to JSON

```bash
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU
npm run import-fsanz -- --input downloads/fsanz-nz.xlsx --output data/fsanz-nz.json --country NZ
```

### Step 3: Copy to Vercel Backend

```bash
# Create data directory in Vercel backend
mkdir -p backend/vercel/data

# Copy JSON files
copy data\fsanz-au.json backend\vercel\data\
copy data\fsanz-nz.json backend\vercel\data\
```

### Step 4: Deploy to Vercel

```bash
cd backend/vercel
vercel --prod
```

Copy the deployment URL (e.g., `https://truescan-backend.vercel.app`)

### Step 5: Configure URLs

**Edit `.env` file:**

```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
```

### Step 6: Restart App

```bash
# Stop current server (Ctrl+C)
npm start
```

---

## ✅ Verification

1. Launch app as NZ/AU user
2. Check logs for: `✅ FSANZ NZ Database: AVAILABLE`
3. Scan a product - FSANZ will be queried automatically

---

## 🎉 Done!

FSANZ databases will now:
- ✅ Auto-download on first launch for NZ/AU users
- ✅ Cache locally for offline use
- ✅ Query automatically on every scan

**Total Time:** ~15 minutes (mostly waiting for downloads/conversion)




















