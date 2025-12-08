# Sharing Deep Links Setup Guide

## Overview

The sharing functionality now uses **universal links** (`https://truescan.app/barcode/{barcode}`) that:
- **Open the app directly** if installed (iOS Universal Links / Android App Links)
- **Redirect to App Store/Play Store** if app is not installed

## How It Works

### Current Implementation

1. **All share cards** now use universal links: `https://truescan.app/barcode/{barcode}`
2. **No website URLs** - links go directly to the app or app stores
3. **Works on all platforms**: Facebook, Instagram, Twitter, WhatsApp, SMS, etc.

### Universal Links Configuration

The app is already configured in `app.config.js`:

**iOS:**
- `associatedDomains: ['applinks:truescan.app']`
- Requires Apple App Site Association (AASA) file at `https://truescan.app/.well-known/apple-app-site-association`

**Android:**
- `intentFilters` with `autoVerify: true` for `https://truescan.app`
- Requires Digital Asset Links file at `https://truescan.app/.well-known/assetlinks.json`

## Required Setup

### Step 1: Host Redirect Page

You need to host a redirect page at `https://truescan.app/barcode/{barcode}` that:
1. Detects if the app is installed
2. Opens the app if installed
3. Redirects to App Store (iOS) or Play Store (Android) if not installed

**Template provided:** `public/barcode/index.html`

**Deployment Options:**
- Vercel (recommended - already using for backend)
- Netlify
- GitHub Pages
- Any static hosting service

### Step 2: Configure Domain Files

#### iOS: Apple App Site Association (AASA)

Create file: `https://truescan.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.truescan.foodscanner",
        "paths": ["/barcode/*"]
      }
    ]
  }
}
```

**Replace:**
- `TEAM_ID` with your Apple Developer Team ID
- Ensure file is served with `Content-Type: application/json` (no `.json` extension)

#### Android: Digital Asset Links

Create file: `https://truescan.app/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.truescan.foodscanner",
      "sha256_cert_fingerprints": ["YOUR_APP_SHA256_CERT_FINGERPRINT"]
    }
  }
]
```

**Get SHA256 fingerprint:**
```bash
# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore (when published)
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
```

### Step 3: Update App Store IDs

In `public/barcode/index.html`, replace:
- `[APP_STORE_ID]` with your actual iOS App Store ID (when published)
- The file already has the correct Play Store link

## Testing

### Test Universal Links

**iOS:**
1. Long-press a link in Messages/Notes
2. Should show "Open in TrueScan" option
3. If app not installed, should redirect to App Store

**Android:**
1. Click link in browser
2. Should open app directly
3. If app not installed, should show Play Store option

### Test Sharing

1. Share any card from the app
2. Check that the link is `https://truescan.app/barcode/{barcode}`
3. Click the link on a device without the app
4. Should redirect to appropriate app store

## Current Status

✅ **Code Updated:**
- All share content uses universal links
- Website URLs removed from share messages
- Links point directly to app/product

⚠️ **Required Setup:**
- Host redirect page at `truescan.app/barcode/{barcode}`
- Configure AASA file for iOS
- Configure assetlinks.json for Android
- Update App Store ID in redirect page

## Next Steps

1. **Deploy redirect page** to `truescan.app` domain
2. **Configure AASA file** for iOS universal links
3. **Configure assetlinks.json** for Android app links
4. **Update App Store ID** when app is published
5. **Test** on both iOS and Android devices

## Files Modified

- `src/features/sharing/services/ShareContentBuilder.ts` - Uses universal links
- `src/utils/linking.ts` - Added `generateUniversalLink()` function
- `public/barcode/index.html` - Redirect page template (NEW)

## Notes

- Universal links work best when the domain is properly configured
- The redirect page provides fallback for app store redirection
- All sharing platforms (Facebook, Instagram, Twitter, WhatsApp, SMS) now use the same universal link format
