# FSANZ Database Complete Automated Setup

**Date:** January 2025  
**Status:** ✅ **READY TO USE**

---

## 🎯 One-Command Setup

The easiest way to set everything up:

```bash
npm run setup-fsanz
```

This interactive script will guide you through:
1. ✅ Checking existing files
2. ✅ Downloading databases (with instructions)
3. ✅ Converting Excel → JSON
4. ✅ Setting up hosting (Vercel/AWS/GitHub)
5. ✅ Configuring environment variables

---

## 📋 Manual Step-by-Step

### Step 1: Download FSANZ Databases

**For Australia:**
1. Visit: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
2. Download the Excel file
3. Save to: `downloads/fsanz-au.xlsx`

**For New Zealand:**
1. Visit: https://foodcomposition.co.nz/foodfiles
2. Download the Excel file
3. Save to: `downloads/fsanz-nz.xlsx`

### Step 2: Convert to JSON

```bash
# Convert AU database
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU

# Convert NZ database
npm run import-fsanz -- --input downloads/fsanz-nz.xlsx --output data/fsanz-nz.json --country NZ
```

**Output:**
- `data/fsanz-au.json` (~10-50MB)
- `data/fsanz-nz.json` (~10-50MB)

### Step 3: Host on Vercel (Recommended - Already Set Up!)

**Option A: Use Existing Vercel Backend**

1. **Deploy backend with files:**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

2. **Ensure JSON files are accessible:**
   - Files in `data/` directory will be served via API
   - Or upload directly to Vercel

3. **Get your deployment URL:**
   - Example: `https://truescan-backend.vercel.app`

**Option B: Upload Files to Vercel**

The API endpoint is already configured at:
- `/api/fsanz-database?country=au`
- `/api/fsanz-database?country=nz`

Or via rewrite rules:
- `/api/fsanz/au.json`
- `/api/fsanz/nz.json`

### Step 4: Configure URLs

**Edit `.env` file:**

```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-app.vercel.app/api/fsanz/au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-app.vercel.app/api/fsanz/nz.json
```

**Or use the automated setup:**

```bash
npm run setup-fsanz
```

---

## 🚀 Quick Start Commands

```bash
# Complete interactive setup (recommended)
npm run setup-fsanz

# Download and convert databases
npm run download-fsanz -- --country ALL

# View hosting setup instructions
npm run setup-fsanz-hosting -- --list
npm run setup-fsanz-hosting -- --provider vercel
```

---

## 📁 File Structure After Setup

```
TrueScan-FoodScanner/
├── downloads/
│   ├── fsanz-au.xlsx       # Original Excel file (optional)
│   └── fsanz-nz.xlsx       # Original Excel file (optional)
├── data/
│   ├── fsanz-au.json       # ✅ Converted JSON (ready to host)
│   └── fsanz-nz.json       # ✅ Converted JSON (ready to host)
├── backend/vercel/
│   ├── api/
│   │   └── fsanz-database.ts  # ✅ API endpoint ready
│   └── vercel.json            # ✅ Configuration ready
└── .env
    └── EXPO_PUBLIC_FSANZ_*_URL  # ✅ URLs configured
```

---

## ✅ Verification Checklist

- [ ] JSON files created in `data/` directory
- [ ] Files are valid JSON (test: `cat data/fsanz-au.json | jq .`)
- [ ] Vercel API endpoint deployed (or other hosting)
- [ ] URLs configured in `.env` file
- [ ] URLs accessible (test in browser)
- [ ] App restarted (to load new env vars)
- [ ] Logs show "FSANZ database AVAILABLE" on startup
- [ ] Product scan queries FSANZ successfully

---

## 🎉 Result

After completing setup:

1. ✅ FSANZ databases automatically download on first app launch for NZ/AU users
2. ✅ Databases cached locally for offline use
3. ✅ Queries run automatically on every product scan
4. ✅ Best-in-class accuracy for NZ and Australia markets

---

**Ready to go!** 🚀

















