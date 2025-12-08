# Rebuild App with WebView Module

## ✅ Dependencies Installed

- `react-native-webview` is now installed
- `.npmrc` created to handle peer dependency conflicts automatically

## 🏗️ Next Step: Rebuild App

**Run this command in PowerShell:**
```powershell
npx expo run:android
```

## Why Rebuild?

`react-native-webview` is a **native module** that must be compiled into the app binary. A simple restart won't work - you need a full rebuild.

## What to Expect

- **Build time:** 2-3 minutes (faster than first build)
- **Process:**
  1. Gradle compiles native code
  2. WebView module linked
  3. APK built
  4. App installed on phone
  5. Metro bundler starts
  6. App opens automatically

## After Rebuild

✅ App will load without errors  
✅ Pricing modal will work (uses WebView)  
✅ All features functional

## Daily Testing After This

Once rebuilt, for daily code changes:
```powershell
npx expo start --dev-client -c
```

**No rebuild needed** for regular code changes - only when adding/removing native modules.

---

**Ready to rebuild?** Run `npx expo run:android` now!
