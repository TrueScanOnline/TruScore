# iOS Crash Diagnosis Guide for Windows Users

## 🔍 Problem Summary

The iOS app is crashing during barcode scanning. The critique indicates:
1. **Bundle ID mismatch** or missing dSYM symbols
2. **App Store ID configuration** - may be set for final release instead of TestFlight
3. **Symbolication issues** - crash logs can't be properly decoded

## 📥 Downloading Crash Logs from App Store Connect (Windows)

### Method 1: Using App Store Connect Web Interface

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Sign in** with your Apple Developer account
3. **Navigate to**: My Apps > TrueScan > TestFlight > Crashes
4. **Find the crash report** (will show device, iOS version, crash date)
5. **Click on the crash report** to view details
6. **Download options**:
   - Click "Download" button to get the `.crash` file
   - Or copy the crash log text directly
7. **Save the file** to your Windows computer (e.g., `C:\TrueScan-FoodScanner\crash-logs\`)

### Method 2: Using Xcode (if you have access to a Mac)

If you have access to a Mac (even temporarily):
1. **Open Xcode** on Mac
2. **Window > Organizer** (or Cmd+Shift+2)
3. **Select "Crashes"** tab
4. **Select your app** (TrueScan)
5. **Find the crash** and click it
6. **Right-click > Export** to save the crash log
7. **Transfer to Windows** via email, USB, or cloud storage

### Method 3: Using TestFlight App (iOS Device)

The tester in Australia can:
1. **Open TestFlight app** on iPhone
2. **Tap on TrueScan app**
3. **Scroll down** to "Crash Reports" section
4. **Tap on crash report** to view
5. **Share** the crash report (email, AirDrop, etc.)
6. **Send to you** for analysis

## 🔧 Fixing Bundle ID and dSYM Issues

### Issue 1: dSYM Symbols Not Uploaded

EAS Build should automatically handle dSYM symbols, but we need to verify:

1. **Check EAS Build Settings**:
   - EAS Build automatically generates and uploads dSYM files
   - Verify in build logs that dSYM is being generated

2. **Verify in App Store Connect**:
   - Go to App Store Connect > TestFlight > Builds
   - Select your build
   - Check if "dSYM" is available (should show "Available" or download link)

### Issue 2: Bundle ID Configuration

Let's verify the bundle ID is consistent:

**Current Configuration:**
- Bundle ID: `com.truescan.foodscanner`
- App Store Connect App ID: `6755704230`

**Check:**
1. App Store Connect > My Apps > TrueScan
2. Verify Bundle ID matches: `com.truescan.foodscanner`
3. If mismatch, update in App Store Connect or app.config.js

### Issue 3: TestFlight vs App Store Configuration

The critique mentions App Store ID is for "final release, not TestFlight betas". This is actually **normal** - TestFlight uses the same App Store Connect app, but we should verify:

1. **TestFlight builds** use the same bundle ID and App Store Connect app
2. **The difference** is in the provisioning profile:
   - TestFlight: Uses "App Store" distribution profile (correct)
   - Final Release: Also uses "App Store" distribution profile

**This is correct** - both use the same profile type.

## 🛠️ Solutions

### Solution 1: Enable dSYM Symbolication in EAS Build

Update `eas.json` to ensure dSYM symbols are generated:

```json
{
  "build": {
    "production": {
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release",
        "dsym": true
      }
    }
  }
}
```

### Solution 2: Verify Bundle ID Consistency

Run this check:
```powershell
# Check bundle ID in app.config.js
cd C:\TrueScan-FoodScanner
node -e "console.log(require('./app.config.js').expo.ios.bundleIdentifier)"
```

Should output: `com.truescan.foodscanner`

### Solution 3: Download and Analyze Crash Logs

Once you have the crash log file:

1. **Save it** as `crash-log.txt` in project root
2. **Share it** with me (paste the content or file path)
3. **I'll analyze** the stack trace to identify the exact crash location

## 📋 Step-by-Step: Get Crash Logs Now

### For You (Windows):

1. **Go to**: https://appstoreconnect.apple.com
2. **Login** with Apple Developer account
3. **Navigate**: My Apps > TrueScan > TestFlight > Crashes
4. **Click** on the most recent crash
5. **Click "Download"** button
6. **Save file** to: `C:\TrueScan-FoodScanner\crash-logs\crash-YYYY-MM-DD.txt`
7. **Open the file** in Notepad or text editor
8. **Copy the content** and share it with me

### For iOS Tester in Australia:

1. **Open TestFlight app** on iPhone
2. **Tap TrueScan**
3. **Scroll to "Crash Reports"**
4. **Tap the crash report**
5. **Tap "Share"** button
6. **Email it** to you or copy the text

## 🔍 What to Look For in Crash Logs

Once you have the crash log, look for:

1. **Exception Type**: `EXC_CRASH` or `EXC_BAD_ACCESS`
2. **Crashed Thread**: Usually thread 0 (main thread)
3. **Stack Trace**: Shows the exact function where crash occurred
4. **Binary Images**: Lists all loaded libraries
5. **dSYM UUID**: Should match the build's dSYM UUID

## 🎯 Next Steps

1. **Download crash logs** using Method 1 above
2. **Share the crash log content** with me
3. **I'll analyze** and identify the exact crash cause
4. **Fix the issue** in the code
5. **Rebuild and resubmit** with fix

---

**Priority**: Get the crash log first - that will tell us exactly what's wrong!
















