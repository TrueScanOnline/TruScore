# Upload iOS Build to App Store Connect - Complete Guide

## ✅ Your Build Status

You have a **successful iOS build** ready for submission:
- **Build ID:** `62ef4247-2645-440d-b3c3-6ee35e25869c`
- **Status:** Finished ✅
- **Distribution:** Store (ready for App Store)
- **Version:** 1.0.0
- **Build Number:** 1
- **IPA Download:** https://expo.dev/artifacts/eas/ddzxjrMXhr3jjyKfmT3BmG.ipa

---

## 🚀 Method 1: EAS Submit (RECOMMENDED - Easiest)

This is the **automated way** - EAS handles everything for you.

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Must be enrolled in Apple Developer Program
   - App must be registered in App Store Connect

2. **App Store Connect API Key** (Recommended)
   - Go to: https://appstoreconnect.apple.com/access/api
   - Click "Keys" tab
   - Generate a new key
   - Download the `.p8` file (you can only download once!)
   - Note the Key ID and Issuer ID

### Step 1: Configure EAS Submit

Run this command to configure App Store Connect credentials:

```powershell
eas submit:configure
```

**What it asks:**
- **Platform:** iOS
- **Apple ID:** Your Apple Developer account email
- **App Store Connect API Key:** Choose "Use App Store Connect API Key" (recommended)
  - **Key ID:** From App Store Connect
  - **Issuer ID:** From App Store Connect
  - **Key file path:** Path to your `.p8` file

**Alternative:** You can use App-Specific Password (less secure):
- Generate at: https://appleid.apple.com/account/manage
- Security → App-Specific Passwords

### Step 2: Submit to App Store Connect

```powershell
eas submit --platform ios --latest
```

**What happens:**
- EAS downloads your latest build
- Uploads to App Store Connect
- Processes automatically
- Shows progress in terminal

**Or submit a specific build:**
```powershell
eas submit --platform ios --id 62ef4247-2645-440d-b3c3-6ee35e25869c
```

### Step 3: Complete Submission in App Store Connect

After upload completes:

1. **Go to App Store Connect:** https://appstoreconnect.apple.com
2. **Select your app**
3. **Go to "TestFlight" tab** (for beta testing) or **"App Store" tab** (for release)
4. **Select the build** (it should appear within 5-10 minutes)
5. **Complete app information:**
   - Screenshots
   - Description
   - Keywords
   - Privacy policy URL
   - Support URL
   - Category
   - Age rating
6. **Submit for Review**

---

## 📦 Method 2: Transporter App (Manual Upload)

If you prefer manual control or EAS Submit doesn't work.

### Step 1: Download the IPA File

**Option A: Direct Download**
- Open: https://expo.dev/artifacts/eas/ddzxjrMXhr3jjyKfmT3BmG.ipa
- Download the `.ipa` file to your computer

**Option B: Via EAS CLI**
```powershell
eas build:download --platform ios --id 62ef4247-2645-440d-b3c3-6ee35e25869c
```

This downloads the `.ipa` file to your current directory.

### Step 2: Install Transporter App

1. **Download Transporter:**
   - Mac App Store: https://apps.apple.com/app/transporter/id1450874784
   - Or search "Transporter" in Mac App Store

2. **Sign in:**
   - Open Transporter
   - Sign in with your Apple ID (same as App Store Connect)

### Step 3: Upload IPA

1. **Open Transporter**
2. **Click "+" or "Deliver Your App"**
3. **Select your `.ipa` file**
4. **Click "Deliver"**
5. **Wait for upload** (5-15 minutes depending on file size)
6. **Wait for processing** (10-30 minutes - Apple processes the build)

### Step 4: Complete Submission

Same as Method 1, Step 3 above.

---

## 🔧 Troubleshooting

### "No builds found" or "Build not ready"

**Fix:** Make sure the build has status "finished" and distribution is "store"

```powershell
eas build:list --platform ios --limit 5
```

### "App Store Connect API Key invalid"

**Fix:**
1. Verify Key ID, Issuer ID, and `.p8` file path
2. Make sure `.p8` file hasn't been revoked
3. Regenerate key if needed

### "App not found in App Store Connect"

**Fix:**
1. Go to App Store Connect
2. Create new app if it doesn't exist
3. Make sure Bundle ID matches: `com.truescan.foodscanner`
4. Wait a few minutes for app to be fully created

### "Build processing failed"

**Fix:**
1. Check build logs: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/62ef4247-2645-440d-b3c3-6ee35e25869c
2. Common issues:
   - Missing entitlements
   - Invalid provisioning profile
   - Code signing issues
3. Rebuild if needed: `eas build --platform ios --profile production`

### "Upload timeout" or "Network error"

**Fix:**
1. Check internet connection
2. Try again (uploads can be retried)
3. Use Transporter app instead (more reliable for large files)

---

## 📋 Pre-Submission Checklist

Before submitting, make sure you have:

- [ ] **App Store Connect App Created**
  - Bundle ID: `com.truescan.foodscanner`
  - App name, description, keywords ready

- [ ] **Screenshots Ready**
  - iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
  - iPhone 6.5" (iPhone 11 Pro Max, XS Max)
  - iPhone 5.5" (iPhone 8 Plus)
  - iPad Pro 12.9" (if supporting iPad)
  - At least 3 screenshots per size

- [ ] **App Information**
  - [ ] App name (30 characters max)
  - [ ] Subtitle (30 characters max)
  - [ ] Description (4000 characters max)
  - [ ] Keywords (100 characters max, comma-separated)
  - [ ] Support URL
  - [ ] Privacy Policy URL (required)
  - [ ] Marketing URL (optional)
  - [ ] Category (Primary + Secondary)
  - [ ] Age rating completed

- [ ] **Version Information**
  - [ ] Version number: 1.0.0
  - [ ] Build number: 1
  - [ ] "What's New" release notes

- [ ] **App Review Information**
  - [ ] Contact information
  - [ ] Demo account (if login required)
  - [ ] Notes for reviewer

- [ ] **Pricing and Availability**
  - [ ] Price tier selected
  - [ ] Availability countries selected

---

## 🎯 Quick Start (Fastest Path)

If you just want to upload quickly:

```powershell
# 1. Configure credentials (first time only)
eas submit:configure

# 2. Submit latest build
eas submit --platform ios --latest

# 3. Wait for upload (5-15 minutes)

# 4. Go to App Store Connect and complete submission
```

---

## 📚 Additional Resources

- **EAS Submit Docs:** https://docs.expo.dev/submit/introduction/
- **App Store Connect:** https://appstoreconnect.apple.com
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Transporter App:** https://apps.apple.com/app/transporter/id1450874784

---

## ⚡ Pro Tips

1. **Use EAS Submit** - It's faster and handles everything automatically
2. **Keep API Key safe** - Store `.p8` file securely (can't re-download)
3. **TestFlight first** - Upload to TestFlight for beta testing before App Store release
4. **Check build status** - Builds can take 10-30 minutes to process after upload
5. **Prepare screenshots early** - This is often the longest part of submission

---

## 🆘 Need Help?

If you encounter issues:

1. **Check EAS logs:** https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
2. **Check App Store Connect:** Look for error messages in the build details
3. **Common solutions:**
   - Rebuild if code signing issues
   - Verify Bundle ID matches
   - Check Apple Developer account status

---

**Your build is ready! Choose Method 1 (EAS Submit) for the easiest experience.** 🚀

