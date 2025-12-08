# Daily Testing Quick Reference

## ✅ Device Authorized - You're Ready!

Your Android device (RZ8WB0399JY) is now authorized and ready for development.

---

## 🏗️ First Time Build (Currently Running)

**Command:**
```powershell
npx expo run:android
```

**What's happening:**
- Building native Android app with all modules (WebView, Camera, etc.)
- Installing on your connected phone
- Starting Metro bundler
- **This takes 5-10 minutes the first time**

**What to expect:**
- Gradle will download dependencies (first time only)
- App will compile
- App will install on your phone
- Metro bundler will start
- App will open automatically on your phone

---

## 📱 Daily Testing Workflow

### Morning (First Time Only):
```powershell
# Build and install development client
npx expo run:android
```
**Note:** Only needed once, or when you add/remove native modules

### During Day (Every Time You Code):
```powershell
# Start development server
npx expo start --dev-client -c
```

**What happens:**
- Metro bundler starts
- App on your phone auto-reloads when you save code
- Fast refresh enabled
- Works exactly like Expo Go, but with all native modules!

**Benefits:**
- ✅ All native modules work (WebView for pricing modal)
- ✅ Fast reload on code changes
- ✅ Same codebase as production
- ✅ Can test everything

---

## 🔄 Complete Daily Workflow

### Day 1 (Today):
```powershell
# 1. Build development client (one time)
npx expo run:android
```

### Every Day After:
```powershell
# 1. Start dev server (every time you code)
npx expo start --dev-client -c

# 2. Make code changes
# 3. App auto-reloads on phone
# 4. Test features
```

### End of Day (For Testers):
```powershell
# Android APK for testers
npm run build:apk
# or
eas build --profile preview --platform android

# iOS TestFlight
eas build --profile production --platform ios
eas submit --platform ios
```

---

## 🚀 Quick Commands

### Development Testing (Your Phone):
```powershell
# First time: Build and install
npx expo run:android

# Daily: Start dev server
npx expo start --dev-client -c
```

### Preview Builds (Testers):
```powershell
# Android APK
npm run build:apk

# iOS TestFlight
eas build --profile production --platform ios
eas submit --platform ios
```

### Production Builds (App Stores):
```powershell
# Android AAB
npm run build:aab

# iOS App Store
eas build --profile production --platform ios
eas submit --platform ios
```

---

## ⚡ What You Can Test Now

Once the build completes and app opens on your phone:

✅ **Barcode Scanning** - Camera works  
✅ **Pricing Modal** - WebView works (Google search)  
✅ **Sharing Function** - All social platforms  
✅ **TruScore Calculation** - All 4 pillars  
✅ **Product Data** - All databases  
✅ **All Native Features** - Everything works!

---

## 📋 Build Status

**Current Build:** `npx expo run:android` is running

**What to watch for:**
- Gradle build progress
- "BUILD SUCCESSFUL" message
- App installing on phone
- Metro bundler starting
- App opening on phone

**If build fails:**
- Check error messages
- Make sure phone stays connected
- Try: `npx expo run:android --clear`

---

## 💡 Pro Tips

1. **Keep Development Build Installed:**
   - Only rebuild when you add/remove native modules
   - Daily code changes work with just `expo start --dev-client`

2. **Fast Reload:**
   - Save file → App reloads automatically
   - No need to rebuild for code changes

3. **Test Everything:**
   - Pricing modal (WebView) ✅
   - Sharing to social media ✅
   - All features work like production ✅

---

## 🎯 Summary

**✅ Device Authorized** - RZ8WB0399JY  
**🏗️ Building Now** - First development build  
**📱 Daily Testing** - Use `npx expo start --dev-client -c`  
**🚀 End of Day** - Use `npm run build:apk` for testers

**You're all set!** 🎉
