# Fix: WebView Still Not Resolved After Install

## Problem
Even after installing `react-native-webview`, Metro bundler still shows:
```
Unable to resolve "react-native-webview" from "src\components\GoogleSearchPricingModal.tsx"
```

## Cause
Metro bundler has **cached** the old module resolution state before the package was installed.

## ✅ Solution

### Option 1: Quick Fix (Recommended)

**Stop Metro bundler** (press `Ctrl+C` in the terminal where Metro is running), then:

```powershell
# Clear Metro cache and rebuild
npx expo run:android --clear
```

The `--clear` flag:
- Clears Metro bundler cache
- Clears Expo cache
- Rebuilds app with fresh cache

### Option 2: Manual Steps

**Step 1: Stop Metro Bundler**
- Press `Ctrl+C` in the terminal running Metro

**Step 2: Clear Caches**
```powershell
# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

**Step 3: Rebuild**
```powershell
npx expo run:android --clear
```

### Option 3: Use Fix Script

```powershell
.\FIX_WEBVIEW_METRO_CACHE.ps1
```

---

## 🔍 Why This Happens

1. **Package installed** ✅ (react-native-webview is in node_modules)
2. **Metro cache** ❌ (Metro still has old module resolution cached)
3. **Solution:** Clear cache and rebuild

---

## ✅ After Fix

Once rebuild completes:
- ✅ Metro cache cleared
- ✅ WebView module resolved
- ✅ App loads successfully
- ✅ Pricing modal works

---

## 📋 Verification

After rebuild, check:
1. App loads without errors
2. No "Unable to resolve" messages
3. Pricing modal opens (tests WebView)

---

**Next Step:** Stop Metro (Ctrl+C), then run `npx expo run:android --clear`
