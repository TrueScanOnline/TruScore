# Build Instructions for Testing - TrueScan App

## Quick Build Commands

### Android (Samsung - NZ Tester)

#### Option 1: EAS Build (Cloud - Recommended)
```bash
# Build debug APK for testing
eas build -p android --profile preview

# After build completes:
# 1. Download APK from https://expo.dev/accounts/[your-account]/builds
# 2. Transfer to Samsung phone
# 3. Enable "Install from Unknown Sources"
# 4. Install APK
```

#### Option 2: Local Build (Requires Android Studio)
```bash
# Already have android/ folder
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
# Transfer to phone and install
```

### iOS (iPhone 11 - AU Tester)

#### EAS Build (Required - iOS needs macOS/Xcode)
```bash
# Build for testing
eas build -p ios --profile preview

# Or build for TestFlight
eas build -p ios --profile production

# After build:
# 1. Download IPA from EAS dashboard
# 2. Upload to App Store Connect (for TestFlight)
# 3. Add tester in TestFlight
# 4. Tester receives invite and installs via TestFlight app
```

---

## Prerequisites

### For EAS Builds:
1. **EAS CLI installed:**
   ```bash
   npm install -g eas-cli
   ```

2. **EAS account logged in:**
   ```bash
   eas login
   ```

3. **EAS project configured:**
   - Already configured in `eas.json`
   - Project ID: `1ac14572-9608-42fa-aceb-c0e2a2f60687`

### For Local Android Build:
1. Android Studio installed
2. Android SDK configured
3. Java JDK installed

### For Local iOS Build:
1. macOS required
2. Xcode installed
3. Apple Developer account

---

## Build Profiles (eas.json)

### Preview Profile (Testing)
- **Android:** APK format
- **iOS:** Development build
- **Distribution:** Internal testing

### Production Profile (App Store)
- **Android:** AAB format (Play Store)
- **iOS:** App Store build
- **Distribution:** Store submission

---

## Current Configuration Status

### ✅ Completed:
- iOS location permissions added
- Android permissions configured
- Error reporting service ready (Sentry)
- Premium gating disabled (for testing)
- Build configurations ready

### ⚠️ Notes:
- **iOS folder:** Not generated locally (requires macOS)
- **iOS builds:** Must use EAS Build (cloud)
- **Android builds:** Can use EAS or local build
- **Sentry:** Optional - works without DSN configured

---

## Testing Build Process

### Step 1: Android Build for NZ Tester
```bash
# Build APK
eas build -p android --profile preview

# Wait for build (5-10 minutes)
# Download APK when ready
# Send to NZ tester
```

### Step 2: iOS Build for AU Tester
```bash
# Build for TestFlight
eas build -p ios --profile production

# Wait for build (10-15 minutes)
# Download IPA
# Upload to App Store Connect
# Add AU tester to TestFlight
```

---

## Installation Instructions for Testers

### Android (Samsung - NZ)
1. Download APK file
2. Open Settings → Security
3. Enable "Install from Unknown Sources"
4. Open APK file
5. Tap "Install"
6. Open TrueScan app

### iOS (iPhone 11 - AU)
1. Install TestFlight app from App Store
2. Accept TestFlight invite (email)
3. Open TestFlight
4. Tap "Install" on TrueScan
5. Open TrueScan app

---

## Troubleshooting

### Android Build Issues:
- **Error:** "Gradle build failed"
  - Solution: Check Android SDK version
  - Verify `android/app/build.gradle` configuration

- **Error:** "Signing config error"
  - Solution: Debug keystore is used (OK for testing)

### iOS Build Issues:
- **Error:** "No iOS folder"
  - Solution: Normal on Windows - use EAS Build

- **Error:** "Code signing required"
  - Solution: Configure in App Store Connect
  - Add certificates in EAS

### General Issues:
- **Build takes too long:**
  - Normal: First build takes 10-15 minutes
  - Subsequent builds are faster (cached)

- **Build fails:**
  - Check EAS dashboard for error logs
  - Verify environment variables
  - Check `eas.json` configuration

---

## Environment Variables

### Required for Builds:
- `EXPO_PUBLIC_QONVERSION_PROJECT_KEY` - Qonversion key (optional for testing)
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN (optional for testing)

### Optional API Keys:
- `EXPO_PUBLIC_USDA_API_KEY` - USDA data
- `EXPO_PUBLIC_GS1_API_KEY` - GS1 data
- Other API keys (see `app.config.js`)

---

## Next Steps After Testing

1. **Collect feedback** from both testers
2. **Fix critical bugs**
3. **Enable premium gating** (after testing)
4. **Configure pricing** in App Store/Play Store
5. **Final production builds**
6. **Submit to stores**

---

**Last Updated:** December 2024
