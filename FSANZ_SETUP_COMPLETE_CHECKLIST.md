# FSANZ Database Setup - Complete Checklist

**Date:** January 2025  
**Status:** ✅ Infrastructure Ready - Follow Steps Below

---

## ✅ What's Already Done

- ✅ Auto-download service created
- ✅ Initialization system ready
- ✅ Vercel API endpoint configured
- ✅ Conversion scripts ready
- ✅ Configuration system set up
- ✅ Query logic already integrated

---

## 📋 Setup Checklist

### Phase 1: Download Databases

- [ ] **Download AU database**
  - Visit: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
  - Download Excel file
  - Save to: `downloads/fsanz-au.xlsx`

- [ ] **Download NZ database**
  - Visit: https://foodcomposition.co.nz/foodfiles
  - Download Excel file
  - Save to: `downloads/fsanz-nz.xlsx`

### Phase 2: Convert to JSON

- [ ] **Convert AU database**
  ```bash
  npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU
  ```

- [ ] **Convert NZ database**
  ```bash
  npm run import-fsanz -- --input downloads/fsanz-nz.xlsx --output data/fsanz-nz.json --country NZ
  ```

- [ ] **Verify JSON files created**
  - Check `data/fsanz-au.json` exists
  - Check `data/fsanz-nz.json` exists
  - File sizes: ~10-50MB each

### Phase 3: Host on Vercel

- [ ] **Copy files to Vercel backend**
  ```bash
  mkdir -p backend/vercel/data
  copy data\fsanz-au.json backend\vercel\data\
  copy data\fsanz-nz.json backend\vercel\data\
  ```

- [ ] **Deploy to Vercel**
  ```bash
  cd backend/vercel
  vercel --prod
  ```

- [ ] **Get deployment URL**
  - Example: `https://truescan-backend.vercel.app`
  - Save this URL

- [ ] **Test API endpoints**
  - Open: `https://your-url.vercel.app/api/fsanz-database?country=au`
  - Should return JSON (or 404 if files not uploaded)
  - Open: `https://your-url.vercel.app/api/fsanz-database?country=nz`

### Phase 4: Configure App

- [ ] **Update `.env` file**
  ```env
  EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
  EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
  ```

- [ ] **Restart development server**
  ```bash
  # Stop server (Ctrl+C)
  npm start
  ```

### Phase 5: Verify

- [ ] **Launch app as NZ user**
  - Check logs for: `✅ FSANZ NZ Database: AVAILABLE`
  - Should see product count and import date

- [ ] **Launch app as AU user**
  - Check logs for: `✅ FSANZ AU Database: AVAILABLE`
  - Should see product count and import date

- [ ] **Test product scan**
  - Scan a product as NZ/AU user
  - Check logs for: `🔍 Trying FSANZ NZ Database (Gold Standard)...`
  - Should query FSANZ automatically

- [ ] **Verify database query**
  - If product found in FSANZ, should see: `✅ FSANZ NZ: Found product`
  - Database should be queried on every scan

---

## 🎯 Expected Results

### After Complete Setup:

1. ✅ **Automatic Download**
   - FSANZ databases download on first app launch
   - Only for NZ/AU users
   - One-time download, cached locally

2. ✅ **Local Caching**
   - Databases stored in AsyncStorage
   - Available offline after first download
   - Persistent across app restarts

3. ✅ **Auto-Query**
   - FSANZ queried automatically on every product scan
   - For NZ/AU users only
   - Merged with other database results

4. ✅ **Best Accuracy**
   - Gold standard government data
   - Country-specific regulations
   - Optimal TruScore for NZ/AU markets

---

## 📊 Status Indicators

### Log Messages to Look For:

**✅ Success:**
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 50,000
   Status: Ready for queries
✅ NZ User: FSANZ database is AVAILABLE - optimal accuracy
```

**⚠️ Missing:**
```
⚠️  FSANZ NZ Database: NOT AVAILABLE
⚠️  WARNING: NZ user without FSANZ database - accuracy reduced
```

**📥 Downloading:**
```
📥 Starting automatic download of FSANZ NZ database...
✅ Successfully downloaded and imported FSANZ NZ database: 50,000 products
```

---

## 🚀 Quick Commands Reference

```bash
# Interactive setup wizard
npm run setup-fsanz

# Convert Excel to JSON
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU

# View hosting instructions
npm run setup-fsanz-hosting -- --provider vercel

# Deploy to Vercel
cd backend/vercel && vercel --prod
```

---

## ✅ Setup Complete When:

- [x] JSON files exist in `data/` directory
- [x] Files copied to `backend/vercel/data/`
- [x] Vercel deployed and URLs working
- [x] `.env` file configured with URLs
- [x] App shows "AVAILABLE" status on startup
- [x] Product scans query FSANZ successfully

---

**Everything is ready - just follow the checklist!** 🎉










