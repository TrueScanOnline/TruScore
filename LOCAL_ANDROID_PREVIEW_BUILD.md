# 📱 Local Android Preview Build - Before EAS

## 🎯 Why Build Locally First?

Building locally helps you:
- ✅ **Catch errors early** before using EAS build credits
- ✅ **Test faster** (no waiting for cloud builds)
- ✅ **Debug easier** (see errors immediately)
- ✅ **Save build credits** for when you're ready

---

## 🚀 Quick Command (Recommended)

```powershell
npx expo run:android
```

**What it does:**
- Generates native Android code automatically
- Builds the APK
- Installs on connected device/emulator
- Shows errors immediately

---

## 📋 Step-by-Step Commands

### Option 1: One Command (Easiest)

```powershell
npx expo run:android
```

### Option 2: Two Steps (More Control)

**Step 1: Generate Native Code**
```powershell
npx expo prebuild --clean
```

**Step 2: Build and Run**
```powershell
npx expo run:android
```

### Option 3: Release Build (Closest to EAS Preview)

```powershell
npx expo run:android --variant release
```

### Option 4: Using Package Script

```powershell
yarn android
```

or

```powershell
npm run android
```

---

## ✅ Prerequisites

Before running, make sure you have:

1. **Android Studio installed**
   - Download: https://developer.android.com/studio
   - Install Android SDK (comes with Android Studio)

2. **Android SDK configured**
   - Open Android Studio
   - Go to: Tools → SDK Manager
   - Install: Android SDK Platform 33 or 34
   - Install: Android SDK Build-Tools

3. **Device or Emulator ready**
   - **Physical Device:**
     - Enable USB Debugging (Settings → Developer Options)
     - Connect via USB
   - **Emulator:**
     - Open Android Studio
     - Tools → Device Manager → Create Virtual Device
     - Start the emulator

4. **Environment variables set** (optional)
   - `ANDROID_HOME` pointing to your SDK location
   - Usually: `C:\Users\YourName\AppData\Local\Android\Sdk`

---

## 🔍 Verify Setup

Check if everything is ready:

```powershell
# Check if Android SDK is found
npx expo-doctor

# Check connected devices
adb devices
```

---

## 🐛 Troubleshooting

### "Command not found: adb"
- Android SDK not in PATH
- Add to PATH: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

### "No devices found"
- Make sure device is connected and USB debugging is enabled
- Or start an Android emulator

### "SDK not found"
- Open Android Studio
- Tools → SDK Manager
- Install Android SDK Platform

### Build fails with errors
- Check the error message
- Common fixes:
  - `npx expo prebuild --clean` (clean native folders)
  - `yarn install` (reinstall dependencies)
  - Check `npx expo-doctor` for issues

---

## 📊 What to Look For

When building locally, watch for:

1. **Import errors** (like `expo-file-system/legacy`)
2. **Module resolution errors**
3. **TypeScript errors**
4. **Missing dependencies**
5. **Configuration errors**

**If local build succeeds, EAS build should too!** ✅

---

## 🎯 Next Steps

After local build succeeds:

1. ✅ **Test the app** on your device
2. ✅ **Fix any runtime errors**
3. ✅ **Then try EAS build** with confidence

```powershell
# When ready for EAS build
eas build --platform android --profile preview
```

---

## 💡 Pro Tips

- **First time?** Use `npx expo prebuild --clean` to ensure clean native code
- **Having issues?** Run `npx expo-doctor` to check for problems
- **Want release build?** Use `--variant release` flag
- **Need to clean?** Delete `android/` folder and run `npx expo prebuild` again

---

## ✅ Success Indicators

You'll know it worked when:
- ✅ Build completes without errors
- ✅ App installs on device/emulator
- ✅ App launches successfully
- ✅ No module resolution errors
- ✅ All features work as expected

**Then you're ready for EAS builds!** 🚀

