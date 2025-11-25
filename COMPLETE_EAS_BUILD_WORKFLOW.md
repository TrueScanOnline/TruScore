# Complete Workflow: Expo Go → EAS Builds (Android + iOS)

## 🎯 Overview

This guide provides a complete workflow for transitioning from **Expo Go testing** to **production-ready EAS builds** for both Android and iOS simultaneously.

**Timeline:** ~30-45 minutes total (builds run in parallel)

---

## 🚀 Quick Start (Automated)

### Run the Complete Workflow Script

```powershell
.\start-eas-builds-complete.ps1
```

**This script automatically:**
- ✅ Runs health checks (Expo Doctor, prebuild validation)
- ✅ Verifies EAS login
- ✅ Starts builds for both platforms simultaneously
- ✅ Provides status updates
- ✅ Shows next steps after completion

---

## 📋 Manual Workflow (Step-by-Step)

### Step 1: Pre-Build Health Checks

```powershell
# 1. Expo Doctor - Check project health
npx expo-doctor

# 2. Generate native code (validates config)
npx expo prebuild --clean

# 3. Verify EAS login
eas whoami
```

**Expected Results:**
- ✅ Expo Doctor: All checks passed
- ✅ Prebuild: Native folders generated successfully
- ✅ EAS: Logged in

---

### Step 2: Start Simultaneous Builds

**Option A: Build Both Platforms Together (Recommended)**

```powershell
# Build both platforms simultaneously
eas build --platform all --profile preview
```

**This builds:**
- **Android:** APK file (for direct installation)
- **iOS:** IPA file (for TestFlight distribution)

**Build time:** 20-40 minutes (runs in parallel)

---

**Option B: Build Platforms Separately**

```powershell
# Build Android first
eas build --platform android --profile preview

# Then build iOS (after Android completes)
eas build --platform ios --profile preview
```

---

### Step 3: Monitor Build Progress

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

### Preview Profile (Current - For Testing)

**Android:**
- Build type: `apk` (easy to install)
- Distribution: `internal` (for testing)
- No Google Play Store required

**iOS:**
- Simulator: `false` (device build)
- Distribution: `store` (for TestFlight)
- Requires Apple Developer account

**Use when:**
- ✅ Testing with real devices
- ✅ Sharing with testers
- ✅ Not ready for app stores

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

### iOS Distribution (TestFlight)

**Step 1: Submit Build to App Store Connect**

```powershell
eas submit --platform ios
```

**Step 2: Add Tester in App Store Connect**

1. Go to: https://appstoreconnect.apple.com
2. Select your app → **TestFlight** tab
3. Click **"Internal Testing"**
4. Click **"+"** to add tester
5. Enter tester's email address (Apple ID)
6. Click **"Add"**
7. Assign build to testing group

**Step 3: Tester Receives Invitation**

- Tester receives email from Apple/TestFlight
- They install TestFlight app from App Store
- Open invitation in TestFlight
- Install TrueScan app
- Trust developer in Settings (first time only)

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
    eas login
}

# Step 3: Start Builds
Write-Host "`nStep 3: Starting EAS builds for both platforms..." -ForegroundColor Cyan
Write-Host "This will take 20-40 minutes. Monitor at:" -ForegroundColor Yellow
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
- **Android:** Send `.apk` file directly
- **iOS:** Use TestFlight (add testers in App Store Connect)

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
- Check for missing Info.plist keys (e.g., NSCameraUsageDescription)

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

**Ready to start? Run the automation script or follow the manual commands!**

