# EAS Build - Start Testing NOW! 🚀

## ⚡ Quick Start (3 Commands)

### Step 1: Make Sure You're Logged In

```powershell
eas login
```

If you see your username, you're good! ✅

---

### Step 2: Configure EAS Project (First Time Only)

**Important:** This may ask you to create a project. Type `y` and press Enter.

```powershell
eas build:configure
```

**What happens:**
- Creates EAS project (if needed)
- Updates `app.config.js` with project ID
- Configures build settings

**If it asks:** "Would you like to automatically create an EAS project?"
- **Type:** `y` and press Enter

---

### Step 3: Start the Builds!

**Option A: Build Both at Once (Recommended)**

Run this PowerShell script:
```powershell
.\START_BUILDS_NOW.ps1
```

This starts both Android and iOS builds in separate windows.

**Option B: Build One at a Time**

**Android (Samsung - New Zealand):**
```powershell
eas build --platform android --profile preview
```

**iOS (iPhone 11 - Australia):**
```powershell
eas build --platform ios --profile preview
```

---

## ⏱️ What Happens Next

### Build Process:
1. **Build starts** - You'll see build ID and status
2. **Builds in cloud** - Takes 10-30 minutes
3. **You can close terminal** - Build continues in cloud
4. **Get download link** - When build completes

### Timeline:
- **Android:** 10-20 minutes
- **iOS:** 15-30 minutes
- **Both together:** ~20-30 minutes (they run in parallel)

---

## 📊 Check Build Status

Check your builds anytime:

```powershell
eas build:list
```

This shows:
- ✅ Build status (in progress, finished, error)
- ✅ Download links when ready
- ✅ Build details

**Or check online:**
- Go to: https://expo.dev/accounts/[your-username]/projects/truescan-food-scanner/builds

---

## 📱 Share with Testers

Once builds complete, you'll get download links. Share these:

### For Android Tester (Samsung - New Zealand):

**Send this message:**

```
Hi! Your test app is ready:

1. Click this link: [PASTE ANDROID DOWNLOAD LINK]
2. Download the APK file
3. Open the downloaded file on your Samsung phone
4. If asked, allow "Install from unknown sources"
   (Settings → Allow from this source)
5. Tap "Install"
6. Open the app and start testing!

The app will automatically detect you're in New Zealand.
```

### For iPhone Tester (iPhone 11 - Australia):

**Send this message:**

```
Hi! Your test app is ready:

1. Click this link: [PASTE iOS DOWNLOAD LINK]
2. Download and install the app
3. Open the app and start testing!

The app will automatically detect you're in Australia.

Note: If you see a security warning, go to:
Settings → General → VPN & Device Management
→ Trust the developer
```

---

## ✅ Testing Checklist

### Both Testers Should Test:
- [ ] App opens and loads
- [ ] Onboarding appears (first time)
- [ ] Can scan barcodes
- [ ] Product info displays
- [ ] Packaging card shows
- [ ] Packaging modal opens

### Android (New Zealand):
- [ ] Shows NZ recycling rules
- [ ] Packaging border: Green for recyclable (like metal cans)
- [ ] Packaging border: Red for non-recyclable

### iPhone (Australia):
- [ ] Shows AU recycling rules
- [ ] Packaging border: Green for recyclable
- [ ] Packaging border: Red for non-recyclable

---

## 🔄 Making Updates

If you need to update the app:

1. **Make code changes**
2. **Build again:**
   ```powershell
   eas build --platform android --profile preview
   eas build --platform ios --profile preview
   ```
3. **Share new download links**
4. **Testers install new version**

---

## 🐛 Troubleshooting

### "EAS project not configured"

**Solution:**
```powershell
eas build:configure
```
Type `y` when asked to create project.

### "Not logged in"

**Solution:**
```powershell
eas login
```

### Build fails

**Solutions:**
1. Check error message in terminal
2. Check `eas.json` is valid
3. Check `app.config.js` has valid project ID
4. Try building again

### Android tester can't install

**Solutions:**
1. Enable "Install from unknown sources" in phone settings
2. Download APK directly (not through browser)
3. Make sure download completed fully

### iPhone tester can't install

**Solutions:**
1. Check iOS version compatibility
2. May need Apple Developer account for direct install
3. Consider using TestFlight (easier)

---

## 📋 Quick Commands

```powershell
# Check login
eas whoami

# Configure project
eas build:configure

# Build Android
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview

# Build both
eas build --profile preview

# Check status
eas build:list
```

---

## 🎯 Ready to Start?

Run these commands now:

```powershell
# 1. Login (if needed)
eas login

# 2. Configure (first time)
eas build:configure
# Type 'y' when asked

# 3. Start builds
.\START_BUILDS_NOW.ps1
# OR build manually:
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

**That's it! Your builds will start and you'll get download links when ready.** 🎉

---

## 📞 Need Help?

- **EAS Docs:** https://docs.expo.dev/build/introduction/
- **Check builds:** https://expo.dev
- **Build status:** `eas build:list`

**Happy Building!** 🚀

