# Complete Build Automation Guide
**Date:** December 2024  
**Purpose:** Automated testing, validation, and building for iOS & Android

---

## 🚀 Quick Start

### Option 1: Copy-Paste Command (Recommended)
Copy this entire command into PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\completeBuildAndTestAutomated.ps1
```

### Option 2: Run from Project Root
```powershell
cd c:\TrueScan-FoodScanner
.\scripts\completeBuildAndTestAutomated.ps1
```

---

## 📋 What This Script Does

The script performs the following steps **automatically**:

### 1. **Code Quality Checks**
- ✅ Runs ESLint to check for code issues
- ✅ Auto-fixes ESLint issues where possible
- ✅ Runs Prettier format check
- ✅ Auto-formats code if needed

### 2. **Environment Validation**
- ✅ Runs `expo-doctor` to validate Expo environment
- ✅ Checks for common configuration issues
- ✅ Verifies dependencies are correct

### 3. **Pre-Build Checks**
- ✅ Verifies `app.config.js` exists
- ✅ Verifies `eas.json` exists
- ✅ Confirms iOS build number is set to **7**
- ✅ Checks EAS CLI is installed
- ✅ Verifies you're logged into EAS
- ✅ Checks Node.js version

### 4. **Android APK Build**
- ✅ Starts Android APK build (preview profile)
- ✅ Build runs in the cloud (15-30 minutes)
- ✅ Continues even if Android build has issues

### 5. **iOS Production Build**
- ✅ Starts iOS Production build with build number **7**
- ✅ Build runs in the cloud (20-40 minutes)
- ✅ Monitors build progress automatically

### 6. **Auto-Submit iOS**
- ✅ Waits for iOS build to complete
- ✅ Automatically submits to App Store Connect
- ✅ Uses `ascAppId: 6755704230` from eas.json

---

## ⏱️ Expected Duration

- **Code Quality Checks:** 1-2 minutes
- **Expo Doctor:** 30 seconds
- **Pre-Build Checks:** 10 seconds
- **Android Build Start:** 10 seconds (build runs in background)
- **iOS Build Start:** 10 seconds
- **iOS Build Wait:** 20-40 minutes (monitored automatically)
- **iOS Submit:** 1-2 minutes

**Total Time:** ~25-45 minutes (mostly waiting for iOS build)

---

## 📝 Prerequisites

Before running the script, ensure:

1. ✅ **EAS CLI installed:**
   ```powershell
   npm install -g eas-cli
   ```

2. ✅ **Logged into EAS:**
   ```powershell
   eas login
   ```

3. ✅ **Node.js installed** (version 20.19.4 recommended)

4. ✅ **Project dependencies installed:**
   ```powershell
   npm install
   # or
   yarn install
   ```

5. ✅ **App Store Connect API Key configured** (for iOS submission)

---

## 🔍 What Gets Built

### Android
- **Profile:** `preview`
- **Type:** APK (for testing)
- **Distribution:** Internal
- **Location:** EAS Build servers

### iOS
- **Profile:** `production`
- **Build Number:** 7
- **Distribution:** App Store
- **Auto-Submit:** Yes (to App Store Connect)
- **App Store Connect ID:** 6755704230

---

## 📊 Monitoring Builds

### Check Build Status
```powershell
# Android
eas build:list --platform android

# iOS
eas build:list --platform ios
```

### View Build Logs
```powershell
eas build:view [BUILD_ID]
```

### Download Builds
```powershell
# Android APK
eas build:download --platform android --latest

# iOS (from App Store Connect)
# Download from: https://appstoreconnect.apple.com
```

---

## ⚠️ Troubleshooting

### Script Fails at ESLint
- **Issue:** Code has linting errors
- **Fix:** Script will attempt auto-fix. Review remaining errors manually.

### Script Fails at Expo Doctor
- **Issue:** Environment configuration problem
- **Fix:** Review expo-doctor output and fix issues manually.

### Build Fails
- **Issue:** Build error in EAS
- **Fix:** Check build logs: `eas build:view [BUILD_ID]`
- **Note:** Android build failure won't stop iOS build

### iOS Submit Fails
- **Issue:** Not authenticated or build not ready
- **Fix:** Run manually: `eas submit --platform ios --latest --non-interactive`

### Build Takes Too Long
- **Issue:** EAS servers may be busy
- **Fix:** Wait longer, or check EAS status page

---

## 🔧 Manual Steps (If Needed)

If automation fails, you can run steps manually:

### 1. Code Quality
```powershell
npm run lint:fix
npm run format
```

### 2. Expo Doctor
```powershell
npx expo-doctor
```

### 3. Build Android
```powershell
eas build -p android --profile preview --non-interactive
```

### 4. Build iOS
```powershell
eas build -p ios --profile production --non-interactive
```

### 5. Submit iOS
```powershell
eas submit --platform ios --latest --non-interactive
```

---

## 📱 After Build Completes

### Android APK
1. Check build status: `eas build:list --platform android`
2. Download APK when ready
3. Transfer to Samsung phone
4. Install and test

### iOS Build
1. Check App Store Connect: https://appstoreconnect.apple.com
2. Build will appear in "TestFlight" or "App Store" section
3. Complete submission process in App Store Connect
4. Add testers to TestFlight if needed

---

## ✅ Success Indicators

You'll know the script succeeded when you see:

```
✅ ALL TASKS COMPLETED SUCCESSFULLY!
```

And the final summary shows:
- ✅ Code quality checks completed
- ✅ Expo Doctor validation passed
- ✅ Pre-build checks passed
- ✅ Android APK build started
- ✅ iOS Production build completed
- ✅ iOS build submitted to App Store Connect

---

## 📞 Support

If you encounter issues:

1. **Check build logs:** `eas build:view [BUILD_ID]`
2. **Check EAS status:** https://status.expo.dev
3. **Review error messages** in the script output
4. **Run steps manually** if automation fails

---

## 🔄 Next Build

For future builds, simply:
1. Update iOS build number in `app.config.js` (currently: 7)
2. Run the script again
3. All steps will repeat automatically

---

**Last Updated:** December 2024  
**Script Version:** 1.0  
**iOS Build Number:** 7
