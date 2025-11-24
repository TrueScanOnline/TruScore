# EAS Build & Test - Start Testing NOW! 🚀

## ⚡ Quick Start (5 Minutes)

This guide will help you build and test the app on both Android and iOS **right now**.

---

## 📋 Step 1: Login to EAS (1 minute)

If you're not logged in, run:

```powershell
eas login
```

This opens your browser - login with your Expo account (or create one - it's free).

**Check if logged in:**
```powershell
eas whoami
```

---

## 📋 Step 2: Configure EAS Project (2 minutes - ONE TIME ONLY)

Run this command to set up your EAS project:

```powershell
eas build:configure
```

**What happens:**
- Creates/updates `eas.json` (already exists)
- Sets up your EAS project ID in `app.config.js`
- Asks a few questions - just press Enter for defaults

**Questions you'll see:**
- Build profile? → Press Enter (default is fine)
- Distribution method? → Press Enter (internal testing is fine)

---

## 📋 Step 3: Build Android APK (10-20 minutes)

Build the Android app for your Samsung tester in New Zealand:

```powershell
eas build --platform android --profile preview
```

**What happens:**
- Builds in the cloud (you can close terminal - it continues)
- Takes 10-20 minutes
- You'll get a download link when done

**While waiting:** You can start the iOS build in another terminal (see Step 4)

---

## 📋 Step 4: Build iOS App (15-30 minutes)

Build the iOS app for your iPhone tester in Australia:

```powershell
eas build --platform ios --profile preview
```

**What happens:**
- Builds in the cloud (you can close terminal - it continues)
- Takes 15-30 minutes
- You'll get a download link when done

**Note:** For iOS, you'll need an Apple Developer account. If you don't have one:
- You can still build, but distribution is limited
- Consider using TestFlight for easier distribution

---

## 📋 Step 5: Check Build Status

Check your builds anytime:

```powershell
eas build:list
```

This shows:
- Build status (in progress, finished, error)
- Download links when ready
- Build details

---

## 📋 Step 6: Share with Testers

Once builds are complete, you'll get download links. Share these with your testers:

### For Android Tester (Samsung - New Zealand):

**Send them this:**

```
Hi! Your test app is ready:

1. Click this link: [PASTE DOWNLOAD LINK HERE]
2. Download the APK file
3. Open the downloaded file on your Samsung phone
4. If asked, allow "Install from unknown sources" (tap Settings → Allow)
5. Tap "Install"
6. Open the app and start testing!

The app will automatically detect you're in New Zealand and show NZ recycling rules.
```

**Android Installation Steps:**
1. Click download link
2. Download APK file
3. Open downloaded file
4. If prompted: Settings → Allow from this source
5. Tap Install
6. Open app → **Start testing!** ✅

### For iPhone Tester (iPhone 11 - Australia):

**Option A: Direct Download (If Available)**

```
Hi! Your test app is ready:

1. Click this link: [PASTE DOWNLOAD LINK HERE]
2. Download the app file
3. Install on your iPhone
4. Open the app and start testing!

The app will automatically detect you're in Australia and show AU recycling rules.
```

**Option B: TestFlight (Recommended for iOS)**

If you set up TestFlight:

```
Hi! Your test app is ready:

1. Install TestFlight from App Store (if not already installed)
2. Accept the TestFlight invitation I sent you
3. Install the TrueScan app from TestFlight
4. Open the app and start testing!

The app will automatically detect you're in Australia and show AU recycling rules.
```

**iPhone Installation Steps:**
1. Click download link (or use TestFlight)
2. Install app
3. Open app → **Start testing!** ✅

---

## ✅ What Testers Should Test

### Both Testers:
- [ ] App opens and loads correctly
- [ ] Onboarding screen appears (first time only)
- [ ] Can scan barcodes
- [ ] Product information displays correctly
- [ ] Packaging card shows with correct border color
- [ ] Packaging modal opens and shows recycling info

### Android Tester (New Zealand):
- [ ] Country detection shows New Zealand
- [ ] Packaging recycling info shows NZ rules
- [ ] Packaging border is green for recyclable items (like metal cans)
- [ ] Packaging border is red for non-recyclable items

### iPhone Tester (Australia):
- [ ] Country detection shows Australia
- [ ] Packaging recycling info shows AU rules
- [ ] Packaging border is green for recyclable items
- [ ] Packaging border is red for non-recyclable items

---

## 🔄 Making Updates

If you need to update the app after testing:

1. **Make your code changes**
2. **Build again:**
   ```powershell
   eas build --platform android --profile preview
   eas build --platform ios --profile preview
   ```
3. **Share new download links** with testers
4. **Testers install new version** (old version is replaced)

---

## 🐛 Troubleshooting

### Problem: "Not logged in"

**Solution:**
```powershell
eas login
```

### Problem: "Project not configured"

**Solution:**
```powershell
eas build:configure
```

### Problem: Build fails

**Solutions:**
1. **Check error message** - Usually tells you what's wrong
2. **Check app.config.js** - Make sure project ID is set
3. **Check eas.json** - Make sure it exists and is valid
4. **Try again** - Sometimes builds fail due to temporary issues

### Problem: Android tester can't install

**Solutions:**
1. **Enable "Install from unknown sources"** in phone settings
2. **Download APK directly** - Don't use browser download manager
3. **Check file size** - Make sure download completed

### Problem: iPhone tester can't install

**Solutions:**
1. **Use TestFlight** - Easier for iOS distribution
2. **Check Apple Developer account** - May need to be set up
3. **Check iOS version** - Make sure iPhone 11 is compatible

---

## 📊 Build Commands Reference

### Build Both Platforms:
```powershell
eas build --profile preview
```

### Build Android Only:
```powershell
eas build --platform android --profile preview
```

### Build iOS Only:
```powershell
eas build --platform ios --profile preview
```

### Check Build Status:
```powershell
eas build:list
```

### View Build Details:
```powershell
eas build:view [BUILD_ID]
```

---

## ⏱️ Timeline

**Total Time: ~30-50 minutes**

- Setup (first time): 5 minutes
- Android build: 10-20 minutes
- iOS build: 15-30 minutes
- Sharing links: 2 minutes
- **Total: ~30-50 minutes**

**Note:** You can start both builds at the same time to save time!

---

## 💡 Pro Tips

1. **Start both builds together** - Saves time
2. **Builds run in cloud** - You can close terminal
3. **Check status anytime** - Use `eas build:list`
4. **Download links work for 30 days** - Share quickly
5. **Testers can install multiple times** - No limit

---

## ✅ Success Checklist

- [ ] Logged in to EAS
- [ ] EAS project configured
- [ ] Android build started
- [ ] iOS build started
- [ ] Builds completed successfully
- [ ] Download links received
- [ ] Links shared with testers
- [ ] Testers installed apps
- [ ] Testing started!

---

## 🎯 Next Steps

1. **Follow steps above** to build apps
2. **Share download links** with testers
3. **Testers install and test**
4. **Collect feedback**
5. **Make updates if needed**
6. **Rebuild and retest**

---

## 📞 Need Help?

- **EAS Documentation:** https://docs.expo.dev/build/introduction/
- **Expo Documentation:** https://docs.expo.dev
- **Check build status:** `eas build:list`
- **View build logs:** Click on build in EAS dashboard

---

## 🚀 Ready to Build!

Run these commands now:

```powershell
# 1. Login (if needed)
eas login

# 2. Configure (if needed)
eas build:configure

# 3. Build Android
eas build --platform android --profile preview

# 4. Build iOS (in another terminal or after Android)
eas build --platform ios --profile preview
```

**That's it! Your builds will start and you'll get download links when ready.** 🎉

