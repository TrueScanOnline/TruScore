# Android Build Download & Installation Guide

**Date:** 2025-01-05  
**Issue:** "Can't open file" when downloading builds via EAS app

---

## Problem

You're trying to download builds via the EAS app on your phone, but getting "Can't open file" errors.

---

## Solution: Download APK Directly from Web Dashboard

The EAS app may not handle APK downloads correctly. **Download the APK file directly from the Expo web dashboard instead:**

### Step 1: Access Build in Web Browser

1. Open your web browser on **your computer** (or phone's browser)
2. Go to: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
3. Find the build you want (the "Android internal distribution build" with `preview-apk` profile)
4. Click on the build to open its details page

### Step 2: Download APK File

1. On the build details page, look for a **"Download"** button or link
2. Click to download the APK file directly
3. The file will download as `something.apk`

### Step 3: Transfer to Your Phone

**Option A: Direct Transfer (Recommended)**
- Email the APK to yourself
- Download it on your phone from the email
- Or use cloud storage (Google Drive, Dropbox, etc.)

**Option B: USB Transfer**
- Connect your phone to your computer via USB
- Enable "File Transfer" mode on your phone
- Copy the APK file to your phone's Download folder

**Option C: Use ADB (Advanced)**
```powershell
adb install path/to/your-app.apk
```

---

## Enable "Install from Unknown Sources"

Before installing the APK, you need to allow your phone to install apps from unknown sources:

### Android 8.0 and Later:
1. Go to **Settings** > **Apps & notifications** > **Special app access** > **Install unknown apps**
2. Find the app you'll use to install (Chrome, Email, File Manager, etc.)
3. Enable "Allow from this source"

### Android 7.0 and Earlier:
1. Go to **Settings** > **Security**
2. Enable **"Unknown sources"** or **"Install unknown apps"**

---

## Which Build to Use?

### ✅ Use: "Android internal distribution build" (preview-apk profile)
- **Profile:** `preview-apk`
- **Type:** APK file (direct installation)
- **Purpose:** Testing on your phone
- **This is the one you want!**

### ❌ Avoid: "Android Play Store build" (preview profile)
- **Profile:** `preview`
- **Type:** May be AAB or configured for Play Store
- **Purpose:** Store distribution (not for direct installation)
- **This won't work for direct phone installation**

---

## Build Command for Testing

For future builds, use the `preview-apk` profile to get a direct-install APK:

```powershell
npx eas build -p android --profile preview-apk --non-interactive
```

This creates an APK file that you can install directly on your phone.

---

## Troubleshooting

### If APK Still Won't Install:

1. **Check File Extension:**
   - Make sure the file ends with `.apk`
   - If it ends with `.aab`, that's an App Bundle (not installable directly)

2. **Verify Download:**
   - Re-download the file
   - Check file size (should be several MB, not a few KB)

3. **Check Android Version:**
   - Verify your phone meets the minimum SDK (24) from `app.config.js`

4. **Try Different Browser/Email:**
   - Sometimes certain apps block APK downloads
   - Try downloading via Chrome, Firefox, or Gmail

5. **Check Phone Storage:**
   - Ensure you have enough storage space

---

## Quick Reference

**Download APK:** Expo web dashboard → Build details → Download button  
**Install APK:** Enable "Install unknown apps" → Open APK file → Install  
**Build Command:** `npx eas build -p android --profile preview-apk --non-interactive`

---

**Status:** Use web dashboard download, not EAS app!




