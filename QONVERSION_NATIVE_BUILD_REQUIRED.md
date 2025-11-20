# Qonversion Requires Native Build - Fix Guide

## ⚠️ Issue

You're seeing this error:
```
ERROR Failed to initialize Qonversion: [TypeError: Cannot read property 'storeSDKInfo' of null]
```

**Why?** Qonversion requires native code and **won't work in Expo Go**. You need a **development build** or **EAS build**.

---

## ✅ Quick Fix - App Still Works!

**Good news:** I've added error handling so your app will continue working in **free mode** until you build with native code.

The app will:
- ✅ Continue functioning normally
- ✅ Show all free features
- ⚠️ Subscription features won't work until native build is available
- ⚠️ You'll see a warning in logs (can be ignored for now)

---

## 🚀 Solution: Build Development Build

You have **2 options**:

### Option 1: Local Development Build (Faster for Testing)

1. **Install expo-dev-client** (if not already installed):
   ```powershell
   yarn add expo-dev-client
   ```

2. **Generate native folders**:
   ```powershell
   npx expo prebuild
   ```

3. **Build and run on Android**:
   ```powershell
   yarn android
   ```
   OR
   ```powershell
   npx expo run:android
   ```

4. **Build and run on iOS** (Mac only):
   ```powershell
   yarn ios
   ```
   OR
   ```powershell
   npx expo run:ios
   ```

**This will:**
- ✅ Create native Android/iOS folders
- ✅ Include Qonversion native modules
- ✅ Build and install on your device/emulator
- ✅ App will work with Qonversion!

---

### Option 2: EAS Build (Recommended for Production)

1. **Install EAS CLI** (if not installed):
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```powershell
   eas login
   ```

3. **Configure EAS** (if not already done):
   ```powershell
   eas build:configure
   ```

4. **Build development build for Android**:
   ```powershell
   eas build --profile development --platform android
   ```

5. **Install on device:**
   - EAS will provide a download link
   - Scan QR code or download APK
   - Install on your Android device

**This will:**
- ✅ Build in the cloud (no local Android Studio needed)
- ✅ Include all native modules including Qonversion
- ✅ Provide APK/IPA download link
- ✅ Ready for testing subscriptions!

---

## 📋 What Happens Now

### Current State (Expo Go):
- ✅ App works normally
- ✅ All free features available
- ⚠️ Subscription features disabled (error is caught gracefully)
- ⚠️ Subscription screen shows error or won't load products

### After Development Build:
- ✅ App works normally
- ✅ All free features available
- ✅ Subscription features work!
- ✅ Can test purchases in sandbox
- ✅ Can test restore purchases

---

## 🔧 Error Handling Added

I've updated the code to gracefully handle this error:

1. **Catches Qonversion initialization errors**
2. **Continues with free mode** (no crash)
3. **Logs warning** (you can ignore it)
4. **App works normally** without subscription features

**Location:** `src/store/useSubscriptionStore.ts`

---

## 🎯 Next Steps

### For Testing Right Now:
1. ✅ **Continue using the app** - it works fine in free mode
2. ✅ **Ignore the error** - it won't break anything
3. ✅ **All other features work** normally

### For Testing Subscriptions:
1. **Build development build** using Option 1 or 2 above
2. **Configure products** in Qonversion Dashboard
3. **Configure products** in App Store/Play Store
4. **Test subscription flow** in sandbox

---

## 📝 Commands Summary

### Local Build (Fast for Development):
```powershell
# Install dev client
yarn add expo-dev-client

# Generate native code
npx expo prebuild

# Build and run Android
yarn android

# Build and run iOS (Mac only)
yarn ios
```

### EAS Build (Cloud Build):
```powershell
# Build development build
eas build --profile development --platform android

# Build for iOS (Mac or cloud)
eas build --profile development --platform ios
```

---

## ✅ Verification

After building with native code, check logs:

**Should see:**
```
✅ Qonversion initialized successfully
✅ Subscription service ready
```

**Should NOT see:**
```
❌ Failed to initialize Qonversion
❌ Cannot read property 'storeSDKInfo' of null
```

---

## 💡 Why This Happens

- **Expo Go:** Uses pre-built binaries (doesn't include Qonversion)
- **Development Build:** Includes all your native dependencies (includes Qonversion)
- **EAS Build:** Builds custom native binaries with all dependencies

**Qonversion requires native code** → Need development build or EAS build

---

## 🚦 Current Status

✅ **App Status:** Working (free mode)  
⚠️ **Subscription Status:** Requires native build  
🎯 **Action Needed:** Build development build when ready to test subscriptions  

**You can continue developing and testing the app normally!** 🎉

