# FSANZ Database Complete Setup Guide

**Date:** January 2025  
**Purpose:** Complete step-by-step guide to download, convert, host, and configure FSANZ databases

---

## 🎯 Overview

This guide walks you through the complete process of:
1. ✅ **Downloading** FSANZ databases from government websites
2. ✅ **Converting** Excel files to JSON format
3. ✅ **Hosting** JSON files on a CDN
4. ✅ **Configuring** URLs in the app

---

## Step 1: Download FSANZ Databases

### For Australia (FSANZ AU)

**Option A: Automated Download (If Direct URL Available)**

```bash
npm run download-fsanz -- --country AU
```

**Option B: Manual Download**

1. Visit: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd
2. Look for "Download Database" or "Excel Export"
3. Download the latest Excel file
4. Save to: `downloads/fsanz-au.xlsx`

**Option C: Alternative Sources**

- **AUSNUT 2023:** https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut/data-files
- **Nutrition Panel Calculator:** https://www.foodstandards.gov.au/business/labelling/nutrition-panel-calculator/downloadable-files

### For New Zealand (FSANZ NZ)

**Option A: Automated Download (If Direct URL Available)**

```bash
npm run download-fsanz -- --country NZ
```

**Option B: Manual Download**

1. Visit: https://foodcomposition.co.nz/foodfiles
2. Download "FOODfiles™ 2024 MSI Installer" or Excel files
3. Extract Excel files
4. Save to: `downloads/fsanz-nz.xlsx`

---

## Step 2: Convert Excel to JSON

### Automatic Conversion (Recommended)

```bash
# Convert AU database
npm run import-fsanz -- --input downloads/fsanz-au.xlsx --output data/fsanz-au.json --country AU

# Convert NZ database
npm run import-fsanz -- --input downloads/fsanz-nz.xlsx --output data/fsanz-nz.json --country NZ
```

### Combined Download + Convert

```bash
# Download and convert in one step
npm run download-fsanz -- --country ALL
```

**Output:**
- `data/fsanz-au.json` - Converted AU database
- `data/fsanz-nz.json` - Converted NZ database

**File Sizes:**
- Typically 10-50MB per database (compressed can be 5-20MB)

---

## Step 3: Host JSON Files on CDN

Choose one of these hosting options:

### Option A: Vercel (FREE - Recommended)

**Quick Setup:**

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **View Setup Instructions:**
   ```bash
   npm run setup-fsanz-hosting -- --provider vercel
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Get URLs:**
   - `https://your-project.vercel.app/api/fsanz/au.json`
   - `https://your-project.vercel.app/api/fsanz/nz.json`

### Option B: AWS S3 + CloudFront

**Quick Setup:**

```bash
npm run setup-fsanz-hosting -- --provider aws
```

Follow the detailed instructions provided.

### Option C: GitHub Releases (FREE)

**Quick Setup:**

```bash
npm run setup-fsanz-hosting -- --provider github
```

1. Create a GitHub release
2. Upload JSON files as assets
3. Use direct download URLs

### Option D: Other CDN Providers

- **Cloudflare R2** (Free tier)
- **Google Cloud Storage** (Free tier)
- **Azure Blob Storage** (Free tier)
- **DigitalOcean Spaces**

---

## Step 4: Configure URLs in App

### Method 1: Environment Variables (Recommended)

**Edit `.env` file:**

```env
# FSANZ Database URLs (configure after hosting)
EXPO_PUBLIC_FSANZ_AU_URL=https://your-cdn.com/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-cdn.com/fsanz-nz.json
```

**Restart app** to load new environment variables.

### Method 2: Direct in Code

**Edit `src/services/fsanDatabaseAutoDownload.ts`:**

```typescript
const FSANZ_DATABASE_URLS = {
  AU: 'https://your-cdn.com/fsanz-au.json',
  NZ: 'https://your-cdn.com/fsanz-nz.json',
};
```

---

## Step 5: Verify Setup

### Check Database Status

1. **Launch app** as NZ or AU user
2. **Check logs** on startup:
   ```
   ✅ FSANZ NZ Database: AVAILABLE
      Products: 50,000
      Status: Ready for queries
   ```

3. **Scan a product** - FSANZ should be queried automatically

### Manual Verification

Test download URLs directly:

```bash
# Test AU database URL
curl -I https://your-cdn.com/fsanz-au.json

# Test NZ database URL
curl -I https://your-cdn.com/fsanz-nz.json
```

Should return `200 OK` status.

---

## 📋 Complete Workflow Script

For convenience, here's the complete workflow:

```bash
# 1. Download and convert both databases
npm run download-fsanz -- --country ALL

# 2. View hosting setup instructions
npm run setup-fsanz-hosting -- --provider vercel

# 3. Host files (follow provider instructions)

# 4. Update .env file with CDN URLs

# 5. Restart app and verify
```

---

## 🎯 Quick Start Commands

```bash
# List all available commands
npm run

# Download and convert AU database
npm run download-fsanz -- --country AU

# Download and convert NZ database
npm run download-fsanz -- --country NZ

# Download and convert both
npm run download-fsanz -- --country ALL

# View hosting provider options
npm run setup-fsanz-hosting -- --list

# View Vercel setup instructions
npm run setup-fsanz-hosting -- --provider vercel

# View AWS setup instructions
npm run setup-fsanz-hosting -- --provider aws

# View GitHub setup instructions
npm run setup-fsanz-hosting -- --provider github
```

---

## 📊 Expected Results

### After Conversion:

- ✅ JSON files created in `data/` directory
- ✅ File sizes: 10-50MB each
- ✅ Format: Valid JSON with barcode → product mapping

### After Hosting:

- ✅ Public URLs accessible
- ✅ CORS headers configured (for web access)
- ✅ Cache headers set (for performance)

### After Configuration:

- ✅ App downloads databases automatically on first launch
- ✅ Databases cached locally for offline use
- ✅ Queries work automatically on every scan

---

## 🔧 Troubleshooting

### Issue: "Download failed"

**Solution:**
- FSANZ doesn't provide direct download URLs
- Download manually from government websites
- Save to `downloads/fsanz-{country}.xlsx`
- Run conversion script

### Issue: "File too large for GitHub"

**Solution:**
- Use Vercel or AWS S3 instead
- Or compress files: `gzip data/fsanz-au.json`
- Use compressed URLs: `fsanz-au.json.gz`

### Issue: "CORS error when downloading"

**Solution:**
- Configure CORS headers on CDN:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET
  ```

### Issue: "Database not downloading in app"

**Solution:**
1. Check URLs are configured correctly in `.env`
2. Test URLs directly in browser
3. Check app logs for download errors
4. Verify file size (should be < 100MB)

---

## ✅ Summary

**Complete Setup Steps:**

1. ✅ **Download** databases (manual or automated)
2. ✅ **Convert** Excel → JSON using import script
3. ✅ **Host** JSON files on CDN (Vercel/AWS/GitHub)
4. ✅ **Configure** URLs in `.env` file
5. ✅ **Verify** automatic download on app launch

**Result:**
- ✅ FSANZ databases automatically available for all NZ/AU users
- ✅ Downloads on first app launch
- ✅ Cached locally for offline use
- ✅ Queries automatically on every scan

---

**Status:** 🎉 **Complete Setup Guide Ready!**




















