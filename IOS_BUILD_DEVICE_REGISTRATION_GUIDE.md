# iOS Build - Device Registration Guide

## Current Issue

EAS is requiring device registration for "internal" distribution. You have two options:

## Option 1: Register a Device (Quick Fix - 5 minutes)

### Step 1: Get Device UDID

**For the tester's iPhone in Australia:**

1. **Method A - From iPhone Settings:**
   - Open Settings → General → About
   - Scroll down to find "Identifier" or "UDID"
   - Long press to copy the UDID

2. **Method B - Using a Website:**
   - Have tester visit: https://udid.tech on their iPhone
   - Follow instructions to get UDID
   - Copy the UDID

3. **Method C - Using iTunes/Finder (if they have Mac):**
   - Connect iPhone to Mac
   - Open Finder (or iTunes on older Macs)
   - Click on iPhone
   - Click "Serial Number" to reveal UDID
   - Copy the UDID

### Step 2: Register Device in Apple Developer Portal

1. Go to: https://developer.apple.com/account/resources/devices/list
2. Click the "+" button (top left)
3. Enter:
   - **Name**: Tester's iPhone (or any name you want)
   - **UDID**: Paste the UDID you got from Step 1
   - **Platform**: iOS
4. Click "Continue"
5. Click "Register"

### Step 3: Run Build Again

```powershell
eas build --platform ios --profile preview
```

When asked about devices, select "yes" and it will import the device you just registered.

---

## Option 2: Use TestFlight Distribution (Recommended - No Devices Needed)

TestFlight doesn't require device registration upfront. Devices are added when you invite testers in App Store Connect.

### Update eas.json

Change the preview profile to use TestFlight:

```json
{
  "build": {
    "preview": {
      "distribution": "store",
      "node": "20.19.4",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    }
  }
}
```

**Note:** "store" distribution creates a build for App Store/TestFlight, which doesn't require device registration.

### Then Run Build

```powershell
eas build --platform ios --profile preview
```

### After Build Completes

1. Upload to App Store Connect:
   ```powershell
   eas submit --platform ios
   ```

2. Add testers in App Store Connect:
   - Go to https://appstoreconnect.apple.com
   - Select your app
   - Go to TestFlight tab
   - Add internal/external testers
   - They'll receive email invitations

---

## Option 3: Register Device via EAS CLI (Interactive)

Run this command and follow the prompts:

```powershell
eas device:create
```

You'll be asked:
1. Expo account (select yours)
2. Apple account (already logged in)
3. Device name (e.g., "Tester iPhone Australia")
4. Device UDID (get from tester)

---

## Quick Decision Guide

**Choose Option 1 if:**
- ✅ You have the tester's device UDID
- ✅ You want to test immediately
- ✅ You want ad-hoc distribution (direct install)

**Choose Option 2 if:**
- ✅ You want to use TestFlight (easier for testers)
- ✅ You don't have device UDID yet
- ✅ You want to add multiple testers easily
- ✅ You want a more professional testing setup

**Choose Option 3 if:**
- ✅ You want to use EAS CLI to register
- ✅ You have the device UDID ready

---

## Recommended: Option 2 (TestFlight)

TestFlight is the easiest option because:
- ✅ No device registration needed upfront
- ✅ Easy to add/remove testers
- ✅ Testers get email invitations
- ✅ Professional testing experience
- ✅ Works for multiple testers

---

## Next Steps After Choosing

**If Option 1 (Register Device):**
1. Get tester's UDID
2. Register in Apple Developer Portal
3. Run: `eas build --platform ios --profile preview`
4. Select "yes" when asked about devices

**If Option 2 (TestFlight):**
1. Update `eas.json` (change "internal" to "store")
2. Run: `eas build --platform ios --profile preview`
3. After build: `eas submit --platform ios`
4. Add testers in App Store Connect

**If Option 3 (EAS CLI):**
1. Get tester's UDID
2. Run: `eas device:create`
3. Follow prompts
4. Run: `eas build --platform ios --profile preview`

