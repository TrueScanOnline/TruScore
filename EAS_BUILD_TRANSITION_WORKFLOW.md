# Complete Workflow: Expo Go → EAS Builds (Android + iOS)

## 🎯 Overview

This guide walks you through transitioning from **Expo Go testing** to **production-ready EAS builds** for both Android and iOS simultaneously.

**Timeline:** ~30-45 minutes total (builds run in parallel)

---

## 📋 Pre-Build Checklist

### Step 1: Final Expo Go Verification ✅

Before starting EAS builds, ensure everything works in Expo Go:

```powershell
# Start Expo Go development server
npx expo start --clear

# Test these features:
# ✅ Barcode scanning
# ✅ Product information display
# ✅ Manual product entry
# ✅ All navigation flows
# ✅ Settings and preferences
```

**Status:** ✅ App tested and running well in Expo Go

---

### Step 2: Run Pre-Build Health Checks

```powershell
# 1. Expo Doctor - Check project health
npx expo-doctor

# 2. Generate native code for both platforms (validates config)
npx expo prebuild --clean

# 3. Verify EAS configuration
Get-Content eas.json | ConvertFrom-Json
```

**Expected Results:**
- ✅ Expo Doctor: All checks passed
- ✅ Prebuild: Native folders generated successfully
- ✅ eas.json: Valid configuration

---

### Step 3: Verify Environment Variables

```powershell
# Check if required environment variables are set
# (Optional - app works without these, but some features won't be available)

# Qonversion (for subscriptions)
$env:EXPO_PUBLIC_QONVERSION_PROJECT_KEY

# USDA API (for US food data)
$env:EXPO_PUBLIC_USDA_API_KEY

# GS1 API (for official barcode verification)
$env:EXPO_PUBLIC_GS1_API_KEY
```

**Note:** App will work without these - they're optional enhancements.

---

## 🚀 EAS Build Workflow (Both Platforms)

### Step 4: Login to EAS (if not already)

```powershell
eas login
```

**What happens:**
- Opens browser for Expo account login
- Returns to PowerShell when authenticated

---

### Step 5: Start Simultaneous Builds

**Option A: Build Both Platforms in Parallel (Recommended)**

```powershell
# Start Android build (runs in background)
Start-Job -ScriptBlock { eas build --platform android --profile preview }

# Start iOS build (runs in background)
Start-Job -ScriptBlock { eas build --platform ios --profile preview }

# Check build status
Get-Job | Receive-Job
```

**Option B: Build Sequentially (Easier to Monitor)**

```powershell
# Build Android first
eas build --platform android --profile preview

# Then build iOS (after Android completes)
eas build --platform ios --profile preview
```

**Option C: Build Both in Same Command (EAS CLI handles it)**

```powershell
# Build both platforms simultaneously
eas build --platform all --profile preview
```

**Recommended:** Use **Option C** - EAS handles parallel builds automatically.

---

### Step 6: Monitor Build Progress

**In PowerShell:**
- Build progress shown in real-time
- Build IDs provided for tracking
- Estimated time: 10-20 minutes per platform

**Online Dashboard:**
```powershell
# Open build dashboard in browser
Start-Process "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds"
```

**What to watch for:**
- ✅ Build queued
- ✅ Build in progress
- ✅ Build complete
- ❌ Build failed (check logs)

---

## 📱 Build Profiles Explained

### Preview Profile (Recommended for Testing)

**Android:**
- Build type: `apk` (easy to install)
- Distribution: `internal` (for testing)
- No Google Play Store required

**iOS:**
- Simulator: `false` (device build)
- Distribution: `internal` (for testing)
- Requires Apple Developer account

**Use when:**
- ✅ Testing with real devices
- ✅ Sharing with testers
- ✅ Not ready for app stores

### Production Profile (For App Stores)

**Android:**
- Build type: `app-bundle` (required for Play Store)
- Distribution: `store` (Play Store submission)

**iOS:**
- Simulator: `false` (device build)
- Distribution: `store` (App Store submission)

**Use when:**
- ✅ Ready for app store submission
- ✅ Final production release

---

## 📥 Downloading Builds

### After Build Completes

**You'll receive:**
1. **Email notification** from Expo with download links
2. **PowerShell output** with download URLs
3. **Online dashboard** with build artifacts

**Download Links Format:**
- Android: `https://expo.dev/artifacts/eas/xxxxx.apk`
- iOS: `https://expo.dev/artifacts/eas/xxxxx.ipa`

---

## 📲 Distribution Instructions

### Android Distribution (Easy)

**For Testers:**
1. Download the `.apk` file on Android device
2. Enable "Install from Unknown Sources" in Settings
3. Tap the downloaded `.apk` file
4. Tap "Install"
5. Done! ✅

**No account required** - Android APKs can be installed directly.

---

### iOS Distribution (Requires Setup)

**Option 1: Ad-Hoc Distribution (Requires Apple Developer Account)**

**For Testers:**
1. Download the `.ipa` file on iPhone
2. Install via TestFlight OR
3. Use service like Diawi/InstallOnAir for direct install
4. Trust developer certificate in Settings → General → VPN & Device Management

**Option 2: TestFlight (Free, Recommended)**

**Setup (One-time):**
1. Create App Store Connect app listing
2. Upload build via EAS Submit
3. Add testers in TestFlight
4. Testers receive email invitation

**For Testers:**
1. Receive TestFlight email invitation
2. Install TestFlight app
3. Install your app from TestFlight
4. Done! ✅

---

## 🔄 Complete Workflow Commands

### Full Workflow Script

```powershell
# ============================================
# COMPLETE EAS BUILD WORKFLOW
# ============================================

# Step 1: Health Checks
Write-Host "Step 1: Running health checks..." -ForegroundColor Cyan
npx expo-doctor
npx expo prebuild --clean

# Step 2: Verify EAS Login
Write-Host "`nStep 2: Checking EAS login..." -ForegroundColor Cyan
eas whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Please run: eas login" -ForegroundColor Yellow
    eas login
}

# Step 3: Start Builds
Write-Host "`nStep 3: Starting EAS builds for both platforms..." -ForegroundColor Cyan
Write-Host "This will take 20-40 minutes. You can monitor progress at:" -ForegroundColor Yellow
Write-Host "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds" -ForegroundColor Yellow

# Build both platforms
eas build --platform all --profile preview

# Step 4: Check Build Status
Write-Host "`nStep 4: Checking build status..." -ForegroundColor Cyan
eas build:list --platform all --limit 2

Write-Host "`n✅ Build workflow complete!" -ForegroundColor Green
Write-Host "Check your email or dashboard for download links." -ForegroundColor Green
```

---

## 📊 Build Status Commands

### Check Build Status

```powershell
# List recent builds
eas build:list --platform all --limit 5

# Check specific build
eas build:view [BUILD_ID]

# Monitor build in real-time
eas build:list --platform all --status in-progress
```

---

## 🧪 Testing Workflow

### After Receiving Builds

**1. Install on Your Device First**
- Test all features
- Verify everything works as in Expo Go
- Check for any native module issues

**2. Share with Testers**
- Android: Send `.apk` file directly
- iOS: Use TestFlight or ad-hoc distribution

**3. Collect Feedback**
- Document any issues
- Compare behavior vs Expo Go
- Note any performance differences

---

## ⚠️ Common Issues & Solutions

### Issue 1: Build Fails

**Solution:**
```powershell
# Check build logs
eas build:view [BUILD_ID]

# Common fixes:
# - Run expo-doctor again
# - Check for dependency conflicts
# - Verify app.config.js is valid
```

### Issue 2: iOS Build Requires Apple Account

**Solution:**
- Sign up for Apple Developer Program ($99/year)
- OR use TestFlight (free, but requires App Store Connect setup)

### Issue 3: Android Build Succeeds, iOS Fails

**Solution:**
- iOS builds are more strict
- Check iOS-specific configuration in `app.config.js`
- Verify `bundleIdentifier` is unique
- Ensure encryption compliance is set

---

## 🎯 Recommended Build Strategy

### Phase 1: Preview Builds (Current)

```powershell
# Build for testing
eas build --platform all --profile preview
```

**Purpose:**
- ✅ Test with real devices
- ✅ Share with testers
- ✅ Validate all features work

### Phase 2: Production Builds (After Testing)

```powershell
# Build for app stores
eas build --platform all --profile production
```

**Purpose:**
- ✅ Submit to Google Play Store
- ✅ Submit to Apple App Store
- ✅ Public release

---

## 📝 Post-Build Checklist

After builds complete:

- [ ] Download both `.apk` and `.ipa` files
- [ ] Install Android build on test device
- [ ] Install iOS build on test device (or TestFlight)
- [ ] Test all major features
- [ ] Verify performance is acceptable
- [ ] Check for any native module issues
- [ ] Compare behavior with Expo Go version
- [ ] Document any differences
- [ ] Share builds with testers
- [ ] Collect feedback

---

## 🚀 Quick Start Commands

**For immediate builds (after health checks):**

```powershell
# Build both platforms simultaneously
eas build --platform all --profile preview

# Monitor progress
Start-Process "https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds"
```

**That's it!** EAS will:
- ✅ Build both platforms in parallel
- ✅ Handle all native code compilation
- ✅ Generate installable files
- ✅ Provide download links

---

## 📞 Support Resources

**EAS Build Dashboard:**
https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds

**EAS Documentation:**
https://docs.expo.dev/build/introduction/

**Build Status:**
```powershell
eas build:list --platform all
```

---

## ✅ Success Criteria

Your transition is successful when:

1. ✅ Both builds complete without errors
2. ✅ Android APK installs and runs on device
3. ✅ iOS build installs via TestFlight or ad-hoc
4. ✅ All features work as in Expo Go
5. ✅ Performance is acceptable
6. ✅ Testers can install and use the app

---

## 🎉 Next Steps After Successful Builds

1. **Collect Tester Feedback**
   - Document any issues
   - Compare with Expo Go behavior

2. **Fix Any Issues**
   - Update code if needed
   - Rebuild if necessary

3. **Prepare for Production**
   - Update version numbers
   - Prepare app store listings
   - Create production builds

4. **Submit to App Stores**
   - Google Play Store (Android)
   - Apple App Store (iOS)

---

**Ready to start? Run the health checks first, then execute the build command!**

