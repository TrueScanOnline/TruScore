# Clear Metro Cache - Manual Steps

## Problem
`expo run:android` doesn't support `--clear` flag. Need to clear cache manually.

## ✅ Solution: Manual Cache Clear

### Step 1: Clear Cache Directories

**In PowerShell, run:**
```powershell
# Clear Expo cache
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue

# Clear Metro cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 2: Rebuild App

```powershell
npx expo run:android
```

---

## ✅ Or Use the Script

**Run:**
```powershell
.\CLEAR_CACHE_AND_REBUILD.ps1
```

This script will:
1. Clear all caches
2. Verify package installation
3. Rebuild app

---

## 🔍 Alternative: Start Metro with Clear Flag

If you want to clear cache when starting Metro:

```powershell
# Start Metro with cleared cache
npx expo start --clear

# Then in another terminal, run:
npx expo run:android
```

But for native modules like WebView, you need a full rebuild anyway.

---

## 📋 Quick Reference

**Clear cache and rebuild:**
```powershell
.\CLEAR_CACHE_AND_REBUILD.ps1
```

**Or manually:**
```powershell
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npx expo run:android
```

---

**Next Step:** Run `.\CLEAR_CACHE_AND_REBUILD.ps1` or follow manual steps above.
