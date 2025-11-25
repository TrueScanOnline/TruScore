# 📱 iOS Build for Australia Tester - Complete Guide

## 🎯 What We're Doing

Building an iOS app so your tester in Australia can install and test it on their iPhone 11.

**Important:** iOS builds **must** be done via EAS (cloud build) because:
- ❌ You can't build iOS apps on Windows
- ✅ EAS can build iOS apps in the cloud (from any computer)
- ✅ No Mac needed!

---

## ✅ Step 1: Verify iOS Configuration

### Check `app.config.js` has iOS settings:

Your app should have:
```javascript
ios: {
  supportsTablet: true,
  bundleIdentifier: 'com.truescan.foodscanner',
  associatedDomains: ['applinks:truescan.app'],
}
```

**Status:** ✅ Already configured!

### Check `eas.json` has iOS preview profile:

Your `eas.json` should have:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    }
  }
}
```

**Status:** ✅ Already configured!

---

## 🚀 Step 2: Start iOS Build

Open PowerShell and run:

```powershell
eas build --platform ios --profile preview
```

**What happens:**
1. EAS uploads your code to their servers
2. EAS builds the iOS app in the cloud (takes 15-30 minutes)
3. EAS provides a download link when done

**You'll be asked:**
- "Do you want to create a new Apple Developer account?" → **No** (if you don't have one yet, you'll need to create one)
- "Do you want to use existing credentials?" → **Yes** (if you have Apple Developer account)

---

## 📋 Step 3: Apple Developer Account (If Needed)

### Option A: You Have Apple Developer Account
- ✅ You're all set! Just use your credentials when prompted

### Option B: You Don't Have Apple Developer Account
**You have 2 choices:**

#### Choice 1: Create Apple Developer Account (Recommended)
- Cost: $99/year
- Sign up: https://developer.apple.com/programs/
- Takes: 1-2 days for approval
- **Benefit:** Can distribute to testers easily via TestFlight

#### Choice 2: Use Ad-Hoc Distribution (Free, but limited)
- No Apple Developer account needed
- Can install on up to 100 devices
- Requires device UDID registration
- **Benefit:** Free, works immediately

---

## 📱 Step 4: Get Device UDID (If Using Ad-Hoc)

If you're using ad-hoc distribution (no Apple Developer account), you need the tester's iPhone UDID:

**Ask your tester to:**
1. Connect iPhone to their computer
2. Open iTunes/Finder
3. Click on the iPhone
4. Find "Identifier" or "UDID"
5. Copy and send it to you

**OR** use a service like:
- https://udid.tech (free, easy)

---

## 🔗 Step 5: Get Download Link

After the build completes (15-30 minutes), EAS will provide:

1. **Build URL** - Link to view build status
2. **Download Link** - Direct link to download the `.ipa` file
3. **QR Code** - For easy installation

**You'll see something like:**
```
✅ Build finished!
📱 Download: https://expo.dev/artifacts/...
📲 Install: Scan QR code or use link above
```

---

## 📤 Step 6: Share with Tester

### Method 1: Direct Download Link (Easiest)

**Send your tester:**
1. The download link from EAS
2. Instructions to install

**Tester installs:**
1. Opens link on iPhone
2. Downloads `.ipa` file
3. Installs via Settings → General → VPN & Device Management

### Method 2: TestFlight (If You Have Apple Developer Account)

**You:**
1. Upload build to App Store Connect
2. Add tester to TestFlight
3. Send TestFlight invite

**Tester:**
1. Installs TestFlight app
2. Accepts invite
3. Installs your app

### Method 3: QR Code (Easiest for Tester)

**EAS provides a QR code:**
1. Share the QR code image with tester
2. Tester scans with iPhone camera
3. Installs directly

---

## 📝 Step 7: Tester Instructions (Send This to Them)

Copy and send this to your tester:

---

### 📱 How to Install TrueScan on Your iPhone

**Step 1: Download the App**
- Click this link: [INSERT DOWNLOAD LINK FROM EAS]
- Or scan this QR code: [INSERT QR CODE]

**Step 2: Install the App**
1. After download, go to: **Settings → General → VPN & Device Management**
2. Find "Expo" or "TrueScan" in the list
3. Tap it
4. Tap **"Trust"**
5. Tap **"Trust"** again to confirm

**Step 3: Open the App**
- Find "TrueScan" on your home screen
- Tap to open
- App should work normally!

**Note:** If you see "Untrusted Developer" error:
- Go to Settings → General → VPN & Device Management
- Trust the developer certificate

---

## ✅ Step 8: Verify Everything Works

**Check with your tester:**
- ✅ App installs successfully
- ✅ App opens without errors
- ✅ Can scan barcodes
- ✅ All features work
- ✅ Country detection works (should detect Australia)

---

## 🐛 Troubleshooting

### "Untrusted Developer" Error
**Fix:** Settings → General → VPN & Device Management → Trust the developer

### "App Cannot Be Installed" Error
**Possible causes:**
- Device UDID not registered (for ad-hoc builds)
- iOS version too old (needs iOS 13+)
- Storage space full

**Fix:** Check device compatibility and storage

### Build Fails
**Common causes:**
- Missing Apple Developer credentials
- Invalid bundle identifier
- Code signing issues

**Fix:** Check EAS build logs for specific error

---

## 📊 Build Status

**Check build status:**
```powershell
eas build:list
```

**Or view online:**
https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds

---

## 🎯 Quick Summary

1. ✅ **Run:** `eas build --platform ios --profile preview`
2. ⏳ **Wait:** 15-30 minutes for build
3. 📱 **Get:** Download link from EAS
4. 📤 **Share:** Link with tester in Australia
5. ✅ **Done:** Tester installs and tests!

---

## 🚀 Ready to Start?

**Run this command now:**
```powershell
eas build --platform ios --profile preview
```

**Then wait for the build to complete!**

---

## 💡 Pro Tips

- **First iOS build?** It might take longer (30+ minutes)
- **Subsequent builds?** Usually faster (15-20 minutes)
- **Want to test yourself?** You'll need an iPhone or iOS simulator (Mac only)
- **Need help?** Check EAS build logs for detailed error messages

---

## ✅ Success Checklist

- ✅ `eas.json` configured for iOS
- ✅ `app.config.js` has iOS bundle identifier
- ✅ Apple Developer account (or ad-hoc setup)
- ✅ Tester's device UDID (if ad-hoc)
- ✅ Build command ready to run

**You're ready to build!** 🚀

