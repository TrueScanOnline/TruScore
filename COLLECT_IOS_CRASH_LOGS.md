# How to Collect iOS Crash Logs

## For the iOS User in Australia

### Quick Instructions:

1. **Connect iPhone to Mac**
2. **Open Xcode** (if available) or **Console.app**
3. **Reproduce the crash** by scanning a barcode
4. **Copy the crash log** and send it

### Detailed Steps:

#### Option 1: Using Xcode (Best)

1. **Connect iPhone to Mac via USB**
2. **Open Xcode** on Mac
3. **Window > Devices and Simulators**
4. **Select your iPhone** from the list
5. **Click "View Device Logs"** button
6. **Filter for "TrueScan"** or look for recent crashes
7. **Select the crash log** (will show timestamp)
8. **Right-click > Export Log** or copy the content
9. **Send the crash log**

#### Option 2: Using Console.app (Alternative)

1. **Connect iPhone to Mac via USB**
2. **Open Console.app** (Applications > Utilities > Console)
3. **Select your iPhone** from sidebar
4. **In search box**, type: `TrueScan` or `crash`
5. **Reproduce the crash** by scanning a barcode
6. **Watch for error messages** in real-time
7. **Select and copy** the error messages
8. **Send the logs**

#### Option 3: TestFlight Crash Reports

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Navigate to your app**
3. **TestFlight > Crashes** (left sidebar)
4. **View crash reports** (if available)
5. **Download crash report** and send

#### Option 4: iPhone Settings (Basic)

1. **Settings > Privacy & Security > Analytics & Improvements**
2. **Analytics Data**
3. **Look for entries starting with "TrueScan"**
4. **Tap to view** (may be limited info)
5. **Screenshot or copy** the content

## What Information to Collect

### Essential:
- ✅ **Crash log** (from Xcode/Console)
- ✅ **When it crashes** (immediately after scan? during loading?)
- ✅ **What barcode** was being scanned (if known)
- ✅ **Device model** (e.g., iPhone 14 Pro)
- ✅ **iOS version** (e.g., iOS 17.2)

### Helpful:
- Screenshot of error (if visible)
- Steps to reproduce
- Does it happen with all barcodes or specific ones?
- Network status (WiFi/cellular) when crash occurs

## What the Logs Will Show

The enhanced error handling now logs:
- `[ScanScreen]` - Scanner events and barcode data
- `[ResultScreen]` - Result screen loading and errors
- `[CrashReporter]` - Detailed crash context
- Navigation events
- API call errors
- State update issues

## Sending the Information

Once you have the crash log:
1. **Copy the full crash log** (from Xcode/Console)
2. **Include device info** (model, iOS version)
3. **Note the barcode** that caused the crash (if known)
4. **Send to developer** for analysis

---

**The crash logs will help identify the exact cause of the iOS crash!** 🔍
