# FSANZ Automatic Update System - Setup Guide
## Complete Automatic Database Download and Update System

**Status:** ✅ Implemented and Ready  
**Date:** January 2025

---

## 🎯 Overview

The automatic update system allows FSANZ databases to be downloaded and updated automatically without manual intervention. The system:

1. **Checks for updates** every 7 days (configurable)
2. **Downloads** pre-converted JSON files from CDN/server
3. **Imports** automatically into the app
4. **Runs in background** without user interaction

---

## ✅ What's Been Implemented

### 1. Automatic Update Service ✅
- **File:** `src/services/fsanDatabaseAutoUpdate.ts`
- **Features:**
  - Periodic update checks (every 7 days)
  - Automatic download and import
  - Background operation
  - User preference (enable/disable)

### 2. CDN Download Service ✅
- **File:** `src/services/fsanDatabaseCDN.ts`
- **Features:**
  - Download pre-converted JSON from CDN
  - Version checking via manifest
  - Checksum validation
  - Automatic import

### 3. App Integration ✅
- **File:** `app/_layout.tsx`
- **Features:**
  - Auto-initializes on app startup
  - Sets up periodic checks
  - Runs in background

### 4. Settings UI ✅
- **File:** `src/components/FSANZDatabaseImportModal.tsx`
- **Features:**
  - Enable/disable auto-update toggle
  - Manual "Check for Updates" button
  - Status display

---

## 🔧 Setup Instructions

### Step 1: Host Pre-Converted JSON Files

Since FSANZ doesn't provide direct JSON APIs, you need to:

1. **Download FSANZ databases** from official websites
2. **Convert to JSON** using the conversion script:
   ```bash
   npm run import-fsanz -- --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU
   ```
3. **Host JSON files** on a CDN or server:
   - **Recommended:** AWS S3 + CloudFront
   - **Alternative:** GitHub Releases
   - **Alternative:** Your own server
   - **Alternative:** Cloudflare R2

### Step 2: Create Manifest Files

Create JSON manifest files that contain version information:

**`fsanz-au-manifest.json`:**
```json
{
  "version": "2025.01.15",
  "productCount": 45231,
  "fileSize": 12450000,
  "checksum": "sha256:abc123...",
  "lastUpdated": "2025-01-15T10:00:00Z",
  "downloadUrl": "https://your-cdn.com/fsanz-au-latest.json"
}
```

**`fsanz-nz-manifest.json`:**
```json
{
  "version": "2025.01.15",
  "productCount": 12345,
  "fileSize": 3450000,
  "checksum": "sha256:def456...",
  "lastUpdated": "2025-01-15T10:00:00Z",
  "downloadUrl": "https://your-cdn.com/fsanz-nz-latest.json"
}
```

### Step 3: Update CDN URLs

Edit `src/services/fsanDatabaseCDN.ts` and update the URLs:

```typescript
const FSANZ_CDN_CONFIG = {
  AU: {
    latest: 'https://your-cdn.com/fsanz-au-latest.json',
    manifest: 'https://your-cdn.com/fsanz-au-manifest.json',
  },
  NZ: {
    latest: 'https://your-cdn.com/fsanz-nz-latest.json',
    manifest: 'https://your-cdn.com/fsanz-nz-manifest.json',
  },
};
```

### Step 4: Enable Auto-Update

The system is already integrated into the app. Users can:

1. Open Settings → FSANZ Database Import
2. Toggle "Automatic Updates" to ON
3. System will check for updates every 7 days automatically

---

## 🔄 How It Works

### Automatic Update Flow

1. **App Startup:**
   - System checks if auto-update is enabled
   - If enabled, checks if 7 days have passed since last check
   - If yes, fetches manifest from CDN

2. **Version Check:**
   - Compares manifest version with current database
   - If newer version available, downloads JSON file

3. **Download & Import:**
   - Downloads pre-converted JSON from CDN
   - Validates JSON structure
   - Imports into app automatically
   - Updates metadata (version, date, size)

4. **Periodic Checks:**
   - Runs every 7 days in background
   - No user interaction required
   - Silent updates

### Manual Update Flow

Users can also manually trigger updates:

1. Open Settings → FSANZ Database Import
2. Tap "Check for Updates Now"
3. System immediately checks and downloads if available

---

## 📊 CDN Hosting Options

### Option 1: AWS S3 + CloudFront (Recommended)

**Pros:**
- Fast global CDN
- Reliable and scalable
- Low cost (~$0.023/GB storage, $0.085/GB transfer)
- Easy to set up

**Setup:**
1. Create S3 bucket
2. Upload JSON files
3. Enable CloudFront distribution
4. Update CDN URLs in code

### Option 2: GitHub Releases

**Pros:**
- Free
- Easy to set up
- Version control built-in

**Setup:**
1. Create GitHub repository
2. Upload JSON files as releases
3. Use release URLs in code

**Example URL:**
```
https://github.com/your-org/fsanz-databases/releases/download/v1.0/fsanz-au-latest.json
```

### Option 3: Cloudflare R2

**Pros:**
- Free egress (no bandwidth costs)
- S3-compatible API
- Fast CDN

**Setup:**
1. Create R2 bucket
2. Upload JSON files
3. Create public access
4. Update CDN URLs

### Option 4: Your Own Server

**Pros:**
- Full control
- Custom logic possible

**Setup:**
1. Set up web server
2. Host JSON files
3. Update CDN URLs

---

## 🔐 Security Considerations

### Checksum Validation

The manifest includes a SHA-256 checksum. You can add validation:

```typescript
import * as Crypto from 'expo-crypto';

async function validateChecksum(data: string, expectedChecksum: string): Promise<boolean> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash === expectedChecksum.replace('sha256:', '');
}
```

### HTTPS Only

Always use HTTPS for CDN URLs to prevent man-in-the-middle attacks.

### Version Pinning

Consider pinning to specific versions for production:
```typescript
versioned: 'https://your-cdn.com/fsanz-au-v{version}.json'
```

---

## ⚙️ Configuration

### Update Interval

Change the update interval in `app/_layout.tsx`:

```typescript
setupPeriodicUpdates(60 * 24 * 7); // 7 days in minutes
```

### Auto-Enable on First Install

To auto-enable for new users:

```typescript
// In app/_layout.tsx initialization
const isFirstLaunch = !(await AsyncStorage.getItem('@truescan_first_launch'));
if (isFirstLaunch) {
  await setAutoUpdateEnabled(true);
  await AsyncStorage.setItem('@truescan_first_launch', 'true');
}
```

---

## 📝 Maintenance

### Regular Updates

1. **Download** latest FSANZ exports (monthly/quarterly)
2. **Convert** to JSON using script
3. **Upload** to CDN
4. **Update** manifest with new version
5. **Users** will automatically receive updates

### Monitoring

Monitor CDN usage:
- Download counts
- Error rates
- Update success rates

---

## 🐛 Troubleshooting

### Issue: "CDN not configured"
**Solution:** Update CDN URLs in `fsanDatabaseCDN.ts`

### Issue: "Download failed"
**Solution:**
- Check CDN URLs are accessible
- Verify JSON files are valid
- Check network connectivity

### Issue: "Updates not happening"
**Solution:**
- Verify auto-update is enabled in settings
- Check last update check timestamp
- Manually trigger update to test

### Issue: "Version check fails"
**Solution:**
- Verify manifest files are valid JSON
- Check manifest URLs are accessible
- Ensure version format matches

---

## ✅ Testing

### Test Auto-Update

1. Enable auto-update in settings
2. Manually trigger update: "Check for Updates Now"
3. Verify database is downloaded and imported
4. Check metadata shows new version

### Test Periodic Updates

1. Enable auto-update
2. Set update interval to 1 minute (for testing)
3. Wait 1 minute
4. Verify update check runs automatically

---

## 🎯 Next Steps

1. **Set up CDN** (choose hosting option above)
2. **Upload JSON files** to CDN
3. **Create manifest files**
4. **Update CDN URLs** in code
5. **Test** automatic updates
6. **Monitor** update success rates

---

**Status:** ✅ System ready. Configure CDN URLs to enable automatic updates.

