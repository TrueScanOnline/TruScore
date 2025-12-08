# Android Installation Guide

## ⚠️ Important: AAB vs APK

### AAB (Android App Bundle) - What You Have Now
- **Purpose**: For Google Play Store submission only
- **Cannot be installed directly** on Android devices
- **File extension**: `.aab` or appears as "application" file
- **Use case**: Upload to Google Play Console for distribution

### APK (Android Package) - What You Need
- **Purpose**: Direct installation on Android devices
- **Can be installed directly** by tapping the file
- **File extension**: `.apk`
- **Use case**: Testing, direct distribution, or sideloading

## 🔧 Solution: Build an APK Instead

### Quick Command to Build APK:

```powershell
cd C:\TrueScan-FoodScanner; eas build --platform android --profile preview --non-interactive
```

Or use the script:

```powershell
cd C:\TrueScan-FoodScanner; powershell -NoProfile -ExecutionPolicy Bypass -File scripts\buildAndroidAPK.ps1
```

### Build Profiles Explained:

1. **`production`** → Builds **AAB** (for Play Store)
   - Cannot install directly
   - Must upload to Play Store

2. **`preview`** → Builds **APK** (for direct installation)
   - Can install directly on phone
   - Perfect for testing

## 📱 How to Install APK on Android

### Step 1: Build APK
Run the command above and wait for build to complete (10-20 minutes)

### Step 2: Download APK
1. Go to: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
2. Find the build with profile "preview" (APK build)
3. Click "Download" button
4. The file will be named something like `app-release.apk`

### Step 3: Install on Phone

**Option A: Via EAS App (Recommended)**
1. Open EAS app on your phone
2. Navigate to your project
3. Find the APK build
4. Tap "Install" or "Download and Install"

**Option B: Direct Download**
1. Download APK to your phone
2. Open file manager
3. Navigate to Downloads folder
4. Tap the `.apk` file
5. Allow installation from unknown sources if prompted
6. Tap "Install"

### Step 4: Enable Unknown Sources (if needed)
If you get "Install blocked" error:
1. Go to Settings → Security
2. Enable "Install from unknown sources" or "Allow from this source"
3. Try installing again

## 🎯 Build Configuration

### Current Setup:
- **Production profile**: AAB (for Play Store) ✅
- **Preview profile**: APK (for direct installation) ✅

### To Build Both:
```powershell
# Build APK for direct installation
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

## 📋 Summary

**Problem**: AAB files cannot be installed directly on Android devices.

**Solution**: Build an APK using the `preview` profile instead of `production`.

**Next Steps**:
1. Run: `eas build --platform android --profile preview`
2. Wait for build to complete
3. Download the APK file
4. Install on your phone

---

**The APK build will be installable directly on your Android phone!** 📱✅
