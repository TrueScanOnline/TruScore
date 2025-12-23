# FSANZ Database Setup - Execution Guide

**Date:** January 2025  
**Purpose:** Step-by-step instructions to complete FSANZ database setup

---

## 🎯 What's Been Created

I've set up **all the infrastructure** needed for automatic FSANZ database availability:

### ✅ Created Files:

1. **`src/services/fsanDatabaseAutoDownload.ts`** - Auto-download service
2. **`src/services/fsanDatabaseInitializer.ts`** - Initialization with status logging
3. **`backend/vercel/api/fsanz-database.ts`** - API endpoint to serve databases
4. **`scripts/downloadAndConvertFSANZ.js`** - Download & conversion script
5. **`scripts/setupFSANZHosting.js`** - Hosting setup instructions
6. **`scripts/completeFSANZSetup.js`** - Interactive setup wizard

### ✅ Updated Files:

1. **`app/_layout.tsx`** - Auto-initialization on startup
2. **`src/services/productService.ts`** - Auto-queries FSANZ for NZ/AU users
3. **`backend/vercel/vercel.json`** - API routing configuration
4. **`package.json`** - New npm scripts

---

## 🚀 Execution Steps

### Option 1: Automated Interactive Setup (Easiest)

```bash
npm run setup-fsanz
```

This will guide you through everything interactively.

### Option 2: Manual Step-by-Step

#### Step 1: Download FSANZ Databases

**Australia:**
1. Visit: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
2. Download the Excel file (latest version)
3. Save to: `C:\TrueScan-FoodScanner\downloads\fsanz-au.xlsx`

**New Zealand:**
1. Visit: https://foodcomposition.co.nz/foodfiles
2. Download the Excel file (FOODfiles™ 2024)
3. Save to: `C:\TrueScan-FoodScanner\downloads\fsanz-nz.xlsx`

#### Step 2: Convert Excel to JSON

```bash
# Convert AU database
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU

# Convert NZ database
npm run import-fsanz -- --output data/fsanz-nz.json --country NZ
```

#### Step 3: Host on Vercel (Already Set Up!)

The Vercel API endpoint is already configured. You just need to:

1. **Deploy the backend:**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

2. **Ensure JSON files are accessible:**
   - Option A: Copy JSON files to `backend/vercel/data/` directory before deploying
   - Option B: Upload files directly to Vercel after deployment
   - Option C: Use Vercel file storage (if configured)

3. **Get your deployment URL:**
   - Example: `https://truescan-backend-abc123.vercel.app`

#### Step 4: Configure URLs

**Edit `.env` file in project root:**

```env
# FSANZ Database URLs
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-app.vercel.app/api/fsanz/au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-app.vercel.app/api/fsanz/nz.json
```

**Or if using Vercel backend:**
```env
EXPO_PUBLIC_FSANZ_AU_URL=https://truescan-backend.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://truescan-backend.vercel.app/api/fsanz-database?country=nz
```

#### Step 5: Restart App

```bash
# Stop current dev server (Ctrl+C)
# Then restart
npm start
```

---

## ✅ Verification

### Check 1: Files Exist
```bash
# Should show JSON files
dir data\fsanz-*.json
```

### Check 2: URLs Work
Open in browser:
- `https://your-vercel-app.vercel.app/api/fsanz/au.json`
- Should return JSON data (or 404 if not uploaded yet)

### Check 3: App Logs
On app startup, look for:
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 50,000
   Status: Ready for queries
```

### Check 4: Product Scan
1. Scan a product as NZ/AU user
2. Check logs for: `🔍 Trying FSANZ NZ Database (Gold Standard)...`
3. Should query FSANZ automatically

---

## 📋 Quick Reference

### NPM Scripts Available:

```bash
# Complete interactive setup
npm run setup-fsanz

# Download and convert databases
npm run download-fsanz -- --country AU
npm run download-fsanz -- --country NZ
npm run download-fsanz -- --country ALL

# Convert existing Excel files
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU

# View hosting setup instructions
npm run setup-fsanz-hosting -- --provider vercel
npm run setup-fsanz-hosting -- --provider aws
npm run setup-fsanz-hosting -- --provider github
```

---

## 🎉 Result After Setup

Once complete:

1. ✅ **Automatic Download:** FSANZ databases download on first app launch for NZ/AU users
2. ✅ **Local Caching:** Databases cached for offline use
3. ✅ **Auto-Query:** FSANZ queried on every product scan
4. ✅ **Best Accuracy:** Gold standard data for NZ/AU markets

---

## 📝 Notes

**File Sizes:**
- Typical: 10-50MB per database (JSON)
- Compressed: 5-20MB (can use gzip)

**Hosting Options:**
- ✅ **Vercel** - Already configured, FREE
- ✅ **AWS S3** - Scalable, paid
- ✅ **GitHub Releases** - FREE, 100MB limit
- ✅ **Cloudflare R2** - FREE tier available

**Important:**
- FSANZ databases are CRITICAL for NZ/AU users
- Must be available for optimal accuracy
- System automatically attempts download if missing

---

**Everything is ready! Just download, convert, host, and configure!** 🚀




















