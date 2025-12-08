# Testing Workflow Guide - Day-to-Day vs Production Builds

## ⚠️ Important: Expo Go Limitation

**`react-native-webview` does NOT work with Expo Go** because it's a native module.

You have two options:
1. **Development Build** (recommended for day-to-day testing)
2. **EAS Build Preview** (for multi-user testing)

---

## 📱 Day-to-Day Testing Workflow

### Option 1: Development Build (Recommended)

**First Time Setup:**
```powershell
# 1. Connect your Android phone via USB
# 2. Enable USB debugging on your phone
# 3. Verify device is connected
adb devices

# 4. Build and install development build on your phone
npx expo run:android

# This will:
# - Build the native app with all native modules (including WebView)
# - Install it on your connected Android device
# - Start Metro bundler
```

**Daily Testing (After First Build):**
```powershell
# Just start Metro bundler - app will reload automatically
npx expo start --dev-client

# Or with cache cleared
npx expo start --dev-client -c
```

**Benefits:**
- ✅ All native modules work (WebView, Camera, etc.)
- ✅ Fast reload on code changes
- ✅ Works exactly like production build
- ✅ Can test all features including pricing modal

---

### Option 2: EAS Development Build (Alternative)

**First Time Setup:**
```powershell
# Build development client APK
eas build --profile development --platform android

# Download and install APK on your phone
# Then connect and start development server
npx expo start --dev-client
```

**Daily Testing:**
```powershell
# Same as Option 1
npx expo start --dev-client -c
```

---

## 🏗️ End-of-Day Production Builds

### For Multi-User Testing (Preview Builds)

**Android APK:**
```powershell
# Build preview APK for testing
eas build --profile preview --platform android

# Or using npm script
npm run build:apk
```

**iOS TestFlight:**
```powershell
# Build iOS for TestFlight
eas build --profile production --platform ios

# Then submit to TestFlight
eas submit --platform ios
```

### For App Store Submission

**Android AAB:**
```powershell
# Build production AAB for Play Store
eas build --profile production --platform android

# Or using npm script
npm run build:aab
```

**iOS App Store:**
```powershell
# Build and submit to App Store
eas build --profile production --platform ios
eas submit --platform ios
```

---

## 🔄 Recommended Daily Workflow

### Morning (First Time Only):
```powershell
# Build development client on your phone
npx expo run:android
```

### During Day (Code Changes):
```powershell
# Start development server
npx expo start --dev-client -c

# Make code changes
# App auto-reloads on your phone
# Test features including:
# - Pricing modal (WebView)
# - Sharing functionality
# - All native features
```

### End of Day (Multi-User Testing):
```powershell
# Build preview APK for testers
eas build --profile preview --platform android

# Build iOS for TestFlight
eas build --profile production --platform ios
eas submit --platform ios
```

---

## 📋 Quick Reference Commands

### Development Testing (Your Phone)
```powershell
# First time: Build and install
npx expo run:android

# Daily: Start dev server
npx expo start --dev-client -c
```

### Preview Builds (Testers)
```powershell
# Android APK
eas build --profile preview --platform android

# iOS TestFlight
eas build --profile production --platform ios
eas submit --platform ios
```

### Production Builds (App Stores)
```powershell
# Android AAB
eas build --profile production --platform android

# iOS App Store
eas build --profile production --platform ios
eas submit --platform ios
```

---

## ⚡ Fastest Daily Workflow

**Recommended:**
1. **Morning:** `npx expo run:android` (one time, or when native modules change)
2. **During Day:** `npx expo start --dev-client -c` (every time you code)
3. **End of Day:** `eas build --profile preview --platform android` (for testers)

**Why This Works:**
- Development build includes all native modules
- Fast reload on code changes (just like Expo Go)
- Same codebase as production builds
- Can test everything including WebView

---

## 🚫 Why Not Expo Go?

Expo Go doesn't support:
- ❌ `react-native-webview` (required for pricing modal)
- ❌ Some other native modules

**Solution:** Use development build instead - it's just as fast for testing!

---

## 💡 Pro Tips

1. **Keep Development Build Installed:**
   - Only rebuild when you add/remove native modules
   - Daily code changes work with just `expo start --dev-client`

2. **Use Preview Builds for Testers:**
   - Preview builds are smaller than production
   - Perfect for multi-user testing
   - Can be distributed via EAS or direct download

3. **Production Builds Only for Stores:**
   - Use production profile for App Store/Play Store
   - Preview profile for internal testing

---

## 📱 Android Phone Setup

**Enable USB Debugging:**
1. Settings → About Phone → Tap "Build Number" 7 times
2. Settings → Developer Options → Enable "USB Debugging"
3. Connect phone via USB
4. Verify: `adb devices` (should show your device)

**Wireless Debugging (Optional):**
```powershell
# Connect wirelessly (phone and computer on same WiFi)
adb connect <phone-ip-address>:5555
```

---

**Status:** ✅ Ready for Testing  
**Recommended:** Use development build for day-to-day testing
