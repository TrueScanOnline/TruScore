# How to Install Android Build on Your Phone

**Date:** 2025-01-05  
**Issue:** "Can't open file" when downloading via EAS app

---

## Problem

The EAS app on your phone can't open the build files. This is because:
1. The EAS app may not handle APK downloads correctly
2. You need to download the APK file directly from the web dashboard
3. You need to enable "Install from Unknown Sources" on your phone

---

## Solution: Download APK from Web Dashboard

### Step 1: Open Expo Web Dashboard

1. On your **computer**, open a web browser
2. Go to: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
3. You'll see your builds listed

### Step 2: Download the Correct Build

**Use this build:**
- ✅ **"Android internal distribution build"** (profile: `preview-apk`)
- ❌ **NOT** the "Android Play Store build" (that one may be configured differently)

**Steps:**
1. Click on the **"Android internal distribution build"** row
2. This opens the build details page
3. Look for a **"Download"** button or link
4. Click to download the APK file (it will be a `.apk` file)

### Step 3: Transfer APK to Your Phone

**Option A: Email (Easiest)**
1. Email the APK file to yourself
2. Open the email on your phone
3. Download the attachment

**Option B: Cloud Storage**
1. Upload APK to Google Drive / Dropbox / etc.
2. Open on your phone and download

**Option C: USB Cable**
1. Connect phone to computer via USB
2. Enable "File Transfer" mode on phone
3. Copy APK file to phone's Downloads folder

---

## Step 4: Enable "Install from Unknown Sources"

Before installing, you must allow your phone to install apps from outside the Play Store:

### For Android 8.0 and Later:
1. Go to **Settings**
2. Tap **Apps & notifications** (or **Apps**)
3. Tap **Special app access** (or **Advanced**)
4. Tap **Install unknown apps**
5. Find and tap the app you'll use to install (e.g., **Chrome**, **Gmail**, **Files**)
6. Enable **"Allow from this source"**

### For Android 7.0 and Earlier:
1. Go to **Settings**
2. Tap **Security** (or **Lock screen and security**)
3. Enable **"Unknown sources"** or **"Install unknown apps"**

---

## Step 5: Install the APK

1. On your phone, open the **Files** app (or file manager)
2. Navigate to **Downloads** folder
3. Find the APK file (ends with `.apk`)
4. Tap the APK file
5. Tap **"Install"** when prompted
6. Wait for installation to complete
7. Tap **"Open"** to launch the app

---

## Which Build Profile to Use?

### ✅ For Testing on Your Phone:
```powershell
npx eas build -p android --profile preview-apk --non-interactive
```

**Profile:** `preview-apk`
- Distribution: `internal`
- Build Type: `APK`
- **Perfect for direct installation on your phone!**

### ❌ Avoid for Testing:
- `preview` profile - May have store distribution settings
- `production` profile - Creates AAB (App Bundle), not APK

---

## Quick Reference

**Web Dashboard:** https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds  
**Build Command:** `npx eas build -p android --profile preview-apk --non-interactive`  
**Download:** Web dashboard → Build details → Download button  
**Install:** Enable "Install unknown apps" → Open APK → Install

---

## Troubleshooting

### "Can't open file" error:
- ✅ Download from web dashboard (not EAS app)
- ✅ Make sure file ends with `.apk` (not `.aab`)
- ✅ Enable "Install from unknown sources"

### Installation blocked:
- Check that "Install unknown apps" is enabled for the app you're using
- Try a different app (Chrome, Gmail, Files app)
- Verify the APK file isn't corrupted (re-download if needed)

### App won't install:
- Check phone storage space
- Verify your Android version meets minimum requirements (Android 7.0+)
- Try restarting your phone

---

**Status:** Download from web dashboard and enable "Install unknown apps"!







