# Fix: Unable to resolve "react-native-webview"

## Problem
The app shows error: `Unable to resolve "react-native-webview" from "src\components\GoogleSearchPricingModal.tsx"`

## Cause
`react-native-webview` is a **native module** that requires:
1. Package installation
2. **App rebuild** (native modules must be compiled into the app)

## ✅ Solution

### Option 1: Quick Fix (Recommended)

**In PowerShell, run:**
```powershell
# 1. Install dependencies
npm install

# 2. Rebuild app (required for native modules)
npx expo run:android
```

**Or use the script:**
```powershell
.\FIX_WEBVIEW_AND_REBUILD.ps1
```

### Option 2: Manual Steps

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Rebuild the app:**
   ```powershell
   npx expo run:android
   ```

   **Why rebuild?** Native modules like `react-native-webview` must be compiled into the native Android/iOS code. A simple `expo start` won't work - you need a full rebuild.

3. **Wait for build to complete:**
   - Takes 2-3 minutes (faster than first build)
   - App will install automatically
   - Metro bundler will start

---

## 📋 What Happens

1. **`npm install`** - Installs `react-native-webview` package
2. **`npx expo run:android`** - Rebuilds native Android app with WebView module
3. **App installs** - New build with WebView support
4. **Metro starts** - Development server ready

---

## ⚠️ Important Notes

### Why Rebuild is Required
- `react-native-webview` is a **native module**
- Native modules must be compiled into the app binary
- `expo start` alone won't include native modules
- Development build must be rebuilt when adding native modules

### When to Rebuild
Rebuild is needed when you:
- ✅ Add a new native module (like WebView)
- ✅ Remove a native module
- ✅ Update native module versions
- ❌ **NOT needed** for regular code changes (just use `expo start --dev-client`)

---

## 🚀 After Fix

Once rebuilt, the app will:
- ✅ Load without errors
- ✅ Pricing modal will work (uses WebView)
- ✅ All features functional

---

## 📱 Daily Workflow After Fix

**After this rebuild, for daily testing:**
```powershell
# Just start dev server (no rebuild needed)
npx expo start --dev-client -c
```

**Only rebuild when:**
- Adding/removing native modules
- First time setup
- Switching between development/production builds

---

## ✅ Verification

After rebuild completes, you should see:
- ✅ No "Unable to resolve" errors
- ✅ App loads successfully
- ✅ Pricing modal opens (tests WebView)
- ✅ All features work

---

**Status:** Ready to fix - run `npm install` then `npx expo run:android`
