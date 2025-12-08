# Build Commands - Step by Step

## Prerequisites

Make sure you're in the project directory:
```powershell
cd C:\TrueScan-FoodScanner
```

---

## Step 1: Start iOS Production Build

**Command:**
```powershell
npx eas build -p ios --profile production --non-interactive
```

**Details:**
- Platform: iOS
- Profile: production
- Build Number: 8
- Distribution: App Store
- Expected Time: 30-60 minutes

**What it does:**
- Creates a production iOS build for App Store submission
- Builds with Release configuration
- Automatically signs with your App Store Connect credentials

---

## Step 2: Start Android APK Build

**Command:**
```powershell
npx eas build -p android --profile preview-apk --non-interactive
```

**Details:**
- Platform: Android
- Profile: preview-apk
- Version Code: 5
- Build Type: APK
- Expected Time: 20-40 minutes

**What it does:**
- Creates an Android APK file for testing
- Builds with Release configuration
- Internal distribution (not for Play Store)

---

## Step 3: Check Build Status

**Command:**
```powershell
npx eas build:list --platform all
```

**To check specific platform:**
```powershell
# iOS only
npx eas build:list --platform ios

# Android only
npx eas build:list --platform android
```

**To see latest build details:**
```powershell
# iOS
npx eas build:view --platform ios --latest

# Android
npx eas build:view --platform android --latest
```

---

## Step 4: Submit iOS Build to App Store Connect

**Wait until iOS build completes (status: "finished"), then run:**

**Command:**
```powershell
npx eas submit -p ios --latest --non-interactive
```

**Alternative (if you know the build ID):**
```powershell
npx eas submit -p ios --id <BUILD_ID> --non-interactive
```

**Details:**
- Submits the latest iOS build to App Store Connect
- App Store Connect ID: 6755704230
- Will automatically upload to App Store Connect
- Build must be in "finished" status

**What it does:**
- Uploads the IPA file to App Store Connect
- Creates a new version in App Store Connect (if needed)
- Prepares build for TestFlight or App Store review

---

## Quick Reference - All Commands

### Build Commands
```powershell
# iOS Production Build
npx eas build -p ios --profile production --non-interactive

# Android APK Build
npx eas build -p android --profile preview-apk --non-interactive
```

### Status Commands
```powershell
# Check all builds
npx eas build:list --platform all

# Check iOS builds
npx eas build:list --platform ios

# Check Android builds
npx eas build:list --platform android
```

### Submit Command
```powershell
# Submit latest iOS build to App Store Connect
npx eas submit -p ios --latest --non-interactive
```

---

## Build Process Flow

1. **Start iOS Build** → Wait 30-60 minutes
2. **Start Android Build** → Wait 20-40 minutes (can run in parallel)
3. **Check Status** → Monitor progress
4. **Submit iOS** → After iOS build completes

---

## Troubleshooting

### If builds don't start:
1. Check EAS authentication: `npx eas whoami`
2. Login if needed: `npx eas login`
3. Verify project ID in `app.config.js`: `1ac14572-9608-42fa-aceb-c0e2a2f60687`

### If submission fails:
1. Verify build is complete: `npx eas build:list --platform ios`
2. Check App Store Connect credentials
3. Verify ascAppId in `eas.json`: `6755704230`

### To cancel a build:
```powershell
npx eas build:cancel --platform ios --latest
npx eas build:cancel --platform android --latest
```

---

## Expected Output

### When Build Starts:
```
✔ Build started
  Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  Platform: ios
  Profile: production
  Build page: https://expo.dev/accounts/[account]/projects/truescan-food-scanner/builds/[id]
```

### When Build Completes:
```
✔ Build finished
  Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  Status: finished
  Artifacts: [download links]
```

### When Submission Succeeds:
```
✔ Successfully submitted build to App Store Connect
  Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  App Store Connect: https://appstoreconnect.apple.com/apps/6755704230/testflight/ios
```

---

## Notes

- Builds run on EAS servers (cloud-based)
- You don't need Xcode or Android Studio installed
- Builds can take 30-60 minutes each
- Both builds can run simultaneously
- iOS submission only works after build completes

---

**Last Updated:** 2025-01-05

