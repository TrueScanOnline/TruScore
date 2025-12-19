# FSANZ Database Auto-Download Setup Guide

**Date:** January 2025  
**Purpose:** Ensure FSANZ databases are automatically available for all NZ and Australia users

---

## ✅ Implementation Complete

The app now automatically:
1. ✅ **Checks for FSANZ database** on every app startup
2. ✅ **Attempts automatic download** for NZ/AU users if not available
3. ✅ **Shows clear status** indicating if database is available
4. ✅ **Queries FSANZ on every scan** for NZ/AU users (when available)

---

## 🔧 How It Works

### Automatic Download System

**On App Startup:**
1. Detects user's country (NZ or AU)
2. Checks if FSANZ database is already imported
3. If not available, attempts automatic download from configured URL
4. Downloads and imports database automatically
5. Shows clear status in logs

**During Product Scans:**
1. FSANZ database is checked and queried automatically
2. No user action required
3. Works seamlessly in background

---

## 📥 Setting Up Database Hosting

To enable automatic downloads, you need to:

### Step 1: Host FSANZ Database JSON Files

Convert FSANZ databases to JSON and host them on a CDN/cloud storage:

**Options:**
- **AWS S3** + CloudFront CDN
- **Google Cloud Storage** + CDN
- **Azure Blob Storage** + CDN
- **Vercel** (free tier available)
- **GitHub Releases** (free, public)
- **Cloudflare R2** (free tier)

### Step 2: Convert Databases to JSON

```bash
# Convert AU database
node scripts/importFSANZDatabase.js --input data/fsanz_au.xlsx --output data/fsanz_au.json --country AU

# Convert NZ database
node scripts/importFSANZDatabase.js --input data/fsanz_nz.xlsx --output data/fsanz_nz.json --country NZ
```

### Step 3: Upload to CDN

Upload the JSON files to your CDN and get public URLs:
- `https://your-cdn.com/fsanz-au.json`
- `https://your-cdn.com/fsanz-nz.json`

### Step 4: Configure URLs in App

**Option A: Environment Variables (Recommended)**

Add to `.env` file:
```env
EXPO_PUBLIC_FSANZ_AU_URL=https://your-cdn.com/fsanz-au.json
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-cdn.com/fsanz-nz.json
```

**Option B: Direct in Code**

Edit `src/services/fsanDatabaseAutoDownload.ts`:
```typescript
const FSANZ_DATABASE_URLS = {
  AU: 'https://your-cdn.com/fsanz-au.json',
  NZ: 'https://your-cdn.com/fsanz-nz.json',
};
```

---

## 📊 Status Logging

The app now shows clear status messages:

### When Database is Available:
```
✅ FSANZ NZ Database: AVAILABLE
   Products: 50,000
   Imported: 1/15/2025
   Status: Ready for queries
✅ NZ User: FSANZ database is AVAILABLE - optimal accuracy
```

### When Database is Missing:
```
⚠️  FSANZ NZ Database: NOT AVAILABLE
⚠️  WARNING: NZ user without FSANZ database - accuracy reduced
```

---

## 🔄 Automatic Download Flow

1. **First App Launch (NZ/AU User):**
   - Detects user is in NZ or AU
   - Checks if FSANZ database exists
   - If not, attempts automatic download
   - Downloads and imports automatically
   - Shows success/failure status

2. **Subsequent Launches:**
   - Database already available
   - Skips download
   - Shows "AVAILABLE" status

3. **Product Scans:**
   - FSANZ is queried automatically (if available)
   - No user action required
   - Works seamlessly

---

## 🎯 Current Implementation

**Files Modified:**
1. ✅ `src/services/fsanDatabaseAutoDownload.ts` - NEW: Auto-download service
2. ✅ `src/services/fsanDatabaseInitializer.ts` - Enhanced: Better status logging
3. ✅ `app/_layout.tsx` - Enhanced: Calls auto-download on startup
4. ✅ `src/services/productService.ts` - Already queries FSANZ automatically

**Features:**
- ✅ Automatic download attempt on first launch
- ✅ Clear status messages showing database availability
- ✅ Warning messages for NZ/AU users without database
- ✅ Automatic querying during product scans
- ✅ Graceful fallback if download fails

---

## 📝 Next Steps

1. **Host Database Files:**
   - Convert FSANZ Excel files to JSON
   - Upload to CDN/cloud storage
   - Get public URLs

2. **Configure URLs:**
   - Add URLs to `.env` file OR
   - Update `fsanDatabaseAutoDownload.ts`

3. **Test:**
   - Launch app as NZ/AU user
   - Verify automatic download
   - Check logs for status messages
   - Test product scans

---

## ⚠️ Important Notes

**Database Availability:**
- ✅ App queries FSANZ on every scan (when available)
- ✅ Clear status shown in logs
- ✅ Automatic download attempts for NZ/AU users
- ✅ Graceful fallback if download fails

**Fallback Behavior:**
- If download fails, app continues with other databases
- Users can still manually import via Settings
- No app-breaking errors if database unavailable

**File Size Considerations:**
- FSANZ databases can be 10-50MB
- Consider compression before hosting
- Users download once, then cached locally
- App bundle size unaffected (downloads at runtime)

---

## ✅ Summary

**Status:** Implementation Complete

The app now:
1. ✅ Automatically attempts to download FSANZ databases for NZ/AU users
2. ✅ Shows clear status indicating database availability
3. ✅ Queries FSANZ on every product scan (when available)
4. ✅ Provides clear warnings if database is missing
5. ✅ Works seamlessly in background

**To Enable:**
1. Host FSANZ JSON files on CDN
2. Configure URLs in `.env` or code
3. Done! Auto-download will work on next app launch

---

**Result:** FSANZ databases will be automatically available for all NZ and Australia users! 🎉

















