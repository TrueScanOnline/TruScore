# iOS Crash Diagnosis Guide

## 🔍 Problem: iOS App Crashes When Scanning Barcode

The iOS build is crashing when users scan a barcode. This guide helps diagnose and fix the issue.

## 🛠️ What I've Done

### 1. Enhanced Error Handling ✅
- Added comprehensive try-catch blocks in `handleBarCodeScanned`
- Added error handling in `loadProduct` function
- Added crash reporter utility for logging

### 2. Improved Navigation Safety ✅
- Added setTimeout delay for iOS navigation (prevents race conditions)
- Added validation before navigation
- Added error recovery mechanisms

### 3. Added Crash Reporting ✅
- Created `crashReporter.ts` utility
- Logs crashes with full context
- Helps identify crash patterns

## 📋 Common iOS Crash Causes

### 1. **Navigation Race Condition**
- **Symptom**: App crashes immediately after scan
- **Cause**: Navigating before state updates complete
- **Fix**: Added setTimeout delay for iOS navigation

### 2. **Memory Issues**
- **Symptom**: App crashes during product loading
- **Cause**: Large images or data not being released
- **Fix**: Added error boundaries and cleanup

### 3. **Async/Await Errors**
- **Symptom**: App crashes when fetching product data
- **Cause**: Unhandled promise rejections
- **Fix**: Added comprehensive error handling

### 4. **Camera Permission Issues**
- **Symptom**: App crashes when camera initializes
- **Cause**: Camera access denied or revoked
- **Fix**: Added permission checks and error handling

### 5. **State Update After Unmount**
- **Symptom**: App crashes when navigating away
- **Cause**: Setting state after component unmounts
- **Fix**: Added cleanup and guards

## 🔧 Diagnostic Steps for iOS User

### Step 1: Enable Developer Mode
1. Go to Settings > Privacy & Security
2. Enable "Developer Mode"
3. Restart iPhone

### Step 2: Connect to Mac and View Logs

**Option A: Using Console.app**
1. Connect iPhone to Mac
2. Open Console.app on Mac
3. Select iPhone from sidebar
4. Filter for "TrueScan" or "crash"
5. Reproduce crash by scanning barcode
6. Copy crash log

**Option B: Using Xcode**
1. Connect iPhone to Mac
2. Open Xcode
3. Window > Devices and Simulators
4. Select iPhone
5. Click "View Device Logs"
6. Find TrueScan crash logs
7. Export crash report

**Option C: TestFlight Crash Reports**
1. Go to App Store Connect
2. Navigate to your app
3. TestFlight > Crashes
4. View crash reports

### Step 3: Check Console Logs
The app now logs detailed information:
- `[ScanScreen]` - Scanner events
- `[ResultScreen]` - Result screen events
- `[CrashReporter]` - Crash information

Look for:
- Error messages
- Stack traces
- Barcode values
- Navigation events

## 🐛 Code Fixes Applied

### 1. Enhanced `handleBarCodeScanned`
```typescript
// Added:
- Input validation
- Error handling with try-catch
- iOS-specific navigation delay
- Crash logging
- State recovery on error
```

### 2. Enhanced `loadProduct`
```typescript
// Added:
- Barcode validation
- Error logging with context
- iOS-specific crash reporting
- Graceful error handling
```

### 3. Added Crash Reporter
- Logs all crashes with context
- Tracks barcode, screen, action
- Exports logs for analysis

## 📱 Testing Instructions

### For iOS User in Australia:

1. **Install the new build** (build 4 or later)

2. **Enable detailed logging**:
   - Settings > Privacy & Security > Developer Mode (if available)
   - Or use Console.app/Xcode to view logs

3. **Reproduce the crash**:
   - Open TrueScan app
   - Scan a barcode
   - Note exactly when it crashes (immediately? during loading?)

4. **Collect crash information**:
   - Screenshot of error (if visible)
   - Console logs from Xcode/Console.app
   - TestFlight crash report (if available)
   - Note: What barcode was being scanned?

5. **Send diagnostic information**:
   - Crash logs
   - Console output
   - Steps to reproduce
   - Device model and iOS version

## 🔍 What to Look For in Logs

### Key Indicators:

1. **Navigation Error**:
   ```
   [ScanScreen] Navigation error: ...
   ```
   - Indicates navigation failed

2. **Product Loading Error**:
   ```
   [ResultScreen] Fatal error loading product: ...
   ```
   - Indicates API/data fetch failed

3. **Memory Warning**:
   ```
   Received memory warning
   ```
   - Indicates memory issue

4. **Camera Error**:
   ```
   [ScanScreen] Camera mount error: ...
   ```
   - Indicates camera issue

## 🎯 Next Steps

1. **Deploy updated build** with enhanced error handling
2. **Collect crash logs** from iOS user
3. **Analyze logs** to identify root cause
4. **Apply targeted fix** based on crash logs

## 📊 Crash Reporter Usage

The crash reporter automatically logs:
- Screen name
- Action being performed
- Barcode being processed
- Error message and stack trace
- Platform (iOS/Android)
- Timestamp

All crashes are logged to console and can be viewed in Xcode/Console.app.

---

**Status**: Enhanced error handling and crash reporting added. Ready for diagnostic data collection.
