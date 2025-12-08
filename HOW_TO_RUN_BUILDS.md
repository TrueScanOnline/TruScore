# How to Run Complete Build and Submit Process

## 🚀 Quick Start - Copy and Paste This:

Open PowerShell and paste this single line:

```powershell
cd C:\TrueScan-FoodScanner; powershell -ExecutionPolicy Bypass -File scripts\completeBuildAndSubmit.ps1
```

That's it! The script will handle everything.

## 📋 What the Script Does

The `completeBuildAndSubmit.ps1` script automatically:

1. ✅ **Pre-flight Checks**
   - Verifies project directory
   - Checks/installs EAS CLI
   - Verifies authentication
   - Validates project configuration

2. ✅ **Starts Android Build**
   - Initiates production Android build (AAB)
   - Captures build ID
   - Provides Expo.dev URL

3. ✅ **Starts iOS Build**
   - Initiates production iOS build
   - Captures build ID
   - Provides Expo.dev URL

4. ✅ **Verifies Builds**
   - Waits for builds to register
   - Lists all builds with platform distinction
   - Verifies builds appear in Expo.dev

5. ✅ **Monitors iOS Build**
   - Checks status every 30 seconds
   - Waits up to 60 minutes for completion
   - Shows progress updates

6. ✅ **Submits iOS to App Store Connect**
   - Automatically submits when build completes
   - Provides submission status
   - Shows next steps

## 🎯 Expected Output

The script will show:
- ✅ Pre-flight check results
- ✅ Android build started with ID
- ✅ iOS build started with ID
- ✅ Build verification in Expo.dev
- ✅ iOS build monitoring progress
- ✅ iOS submission to App Store Connect
- ✅ Final summary with all URLs

## ⏱️ Timeline

- **Pre-flight checks**: ~10 seconds
- **Starting builds**: ~30 seconds each
- **Build completion**: 10-30 minutes (monitored automatically)
- **iOS submission**: ~1-2 minutes
- **Total time**: ~15-35 minutes (mostly waiting for builds)

## 🔍 Verification

After running, check:

1. **Expo.dev Dashboard**: 
   - https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
   - Builds should appear within 1-2 minutes
   - Distinguishable by platform (android/ios)

2. **App Store Connect**:
   - https://appstoreconnect.apple.com
   - iOS build should appear after submission
   - Complete the submission process there

## 🆘 Troubleshooting

### If script fails at authentication:
```powershell
eas login
```
Then run the script again.

### If builds don't appear:
- Wait 2-3 minutes (builds take time to register)
- Check Expo.dev dashboard directly
- Verify you're logged into correct account

### If iOS submission fails:
```powershell
# Submit manually
eas submit --platform ios --latest
```

## 📁 Files

- **Main Script**: `scripts/completeBuildAndSubmit.ps1`
- **Quick Run**: `RUN_BUILDS.ps1`
- **Copy-Paste**: `COPY_THIS_INTO_POWERSHELL.txt`

---

**Just copy and paste the command above into PowerShell and let it run!** 🚀
