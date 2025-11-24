# Complete Testing Guide - Android & iOS

## 📱 For Both Testers: Simple Instructions

This guide will help you test the TrueScan app on:
- **Android phone (Samsung)** - User in New Zealand
- **iPhone 11** - User in Australia

---

## 🎯 Method 1: Expo Go (Easiest - No Installation Needed)

This is the **simplest method** - both users can test immediately without installing anything special.

### Step 1: Developer Starts the App

The developer will run this command on their computer:

```powershell
npx expo start --tunnel
```

**Wait 30-60 seconds** for it to connect. The developer will see a QR code and a URL like:
```
exp://abc123.exp.direct:8081
```

### Step 2: Developer Shares the Connection Info

The developer will send you:
1. **The URL** (e.g., `exp://abc123.exp.direct:8081`)
2. **A QR code** (if possible)

---

## 📱 Instructions for Android User (Samsung - New Zealand)

### What You Need:
- ✅ Samsung phone with internet connection
- ✅ Camera app (already on your phone)

### Step-by-Step:

#### Step 1: Install Expo Go App
1. Open **Google Play Store** on your Samsung phone
2. Search for **"Expo Go"**
3. Tap **"Install"** (it's free)
4. Wait for it to download and install

#### Step 2: Connect to the App

**Option A: Scan QR Code (Easiest)**
1. Open the **Expo Go** app
2. Tap **"Scan QR code"** button
3. Point your camera at the QR code the developer sent you
4. Tap **"Open"** when it appears
5. Wait 10-30 seconds for the app to load
6. **Done!** ✅ You can now test the app

**Option B: Enter URL Manually**
1. Open the **Expo Go** app
2. Look for **"Enter URL manually"** or tap the text field at the bottom
3. Type or paste the URL the developer sent (e.g., `exp://abc123.exp.direct:8081`)
4. Tap **"Connect"**
5. Wait 10-30 seconds for the app to load
6. **Done!** ✅ You can now test the app

### Testing Tips:
- ✅ You can scan barcodes to test the app
- ✅ The app will detect you're in New Zealand automatically
- ✅ Packaging recycling info will show New Zealand rules
- ✅ If the app disconnects, just reconnect using the same URL

---

## 📱 Instructions for iPhone User (iPhone 11 - Australia)

### What You Need:
- ✅ iPhone 11 with internet connection
- ✅ Camera app (already on your phone)

### Step-by-Step:

#### Step 1: Install Expo Go App
1. Open **App Store** on your iPhone
2. Search for **"Expo Go"**
3. Tap **"Get"** or the cloud icon (it's free)
4. Wait for it to download and install

#### Step 2: Connect to the App

**Option A: Use Safari (Easiest for iPhone)**
1. Copy the URL the developer sent you (e.g., `exp://abc123.exp.direct:8081`)
2. Open **Safari** browser on your iPhone
3. Paste the URL in the address bar at the top
4. Tap **"Go"**
5. Safari will ask: **"Open in Expo Go?"**
6. Tap **"Open"**
7. Wait 10-30 seconds for the app to load
8. **Done!** ✅ You can now test the app

**Option B: Use Expo Go App Directly**
1. Open the **Expo Go** app
2. Look for **"Enter URL manually"** - it might be:
   - At the bottom of the screen
   - In a menu (tap ☰ icon)
   - Tap anywhere on the screen to reveal it
3. Type or paste the URL the developer sent
4. Tap **"Connect"**
5. Wait 10-30 seconds for the app to load
6. **Done!** ✅ You can now test the app

**Option C: Scan QR Code (If Available)**
1. Open the **Expo Go** app
2. Tap **"Scan QR code"** button
3. Point your camera at the QR code the developer sent
4. Tap **"Open"** when it appears
5. Wait 10-30 seconds for the app to load
6. **Done!** ✅ You can now test the app

### Testing Tips:
- ✅ You can scan barcodes to test the app
- ✅ The app will detect you're in Australia automatically
- ✅ Packaging recycling info will show Australia rules
- ✅ If the app disconnects, just reconnect using the same URL

---

## 🔄 What Happens When Developer Updates the App?

**Good news!** Both of you will see updates automatically:

1. Developer makes a change to the app
2. Developer saves the file
3. **Your app will automatically reload** (you'll see a brief loading screen)
4. New version appears - no need to reconnect!

**Note:** If the developer restarts their computer or the connection, they'll send you a new URL.

---

## ⚠️ Troubleshooting

### Problem: "Unable to connect" or "Connection timeout"

**Solutions:**
1. **Check your internet** - Make sure you have Wi-Fi or mobile data
2. **Try again** - Sometimes it takes a few tries
3. **Ask developer for new URL** - The URL might have changed
4. **Make sure Expo Go is open** - Don't close the Expo Go app

### Problem: App won't load or shows error

**Solutions:**
1. **Close Expo Go completely** - Swipe it away from recent apps
2. **Reopen Expo Go**
3. **Reconnect** using the URL
4. **Wait a bit longer** - Sometimes it takes 30-60 seconds

### Problem: QR code won't scan

**Solutions:**
1. **Make sure camera permission is allowed** for Expo Go
2. **Try entering URL manually** instead
3. **Ask developer to send URL as text**

### Problem: App keeps disconnecting

**Solutions:**
1. **Check your internet connection** - Make sure it's stable
2. **Stay on the same Wi-Fi** if possible
3. **Reconnect** - Just use the same URL again

---

## 🎯 Method 2: Standalone App (More Reliable)

If Method 1 doesn't work well, the developer can create a **standalone app** that you install directly on your phone. This is more reliable but takes longer to set up.

### For Android User (Samsung):

1. Developer builds an APK file
2. Developer sends you a download link
3. You download the APK file
4. You install it on your Samsung phone
5. **Done!** ✅ App works like a normal app

**Note:** You might need to allow "Install from unknown sources" in your phone settings.

### For iPhone User (iPhone 11):

1. Developer builds an app file
2. Developer sends you a download link (or uses TestFlight)
3. You download and install it
4. **Done!** ✅ App works like a normal app

**Note:** For iPhone, this requires the developer to have an Apple Developer account.

---

## 📋 Quick Checklist for Both Users

### Before Testing:
- [ ] Install Expo Go app
- [ ] Have internet connection ready
- [ ] Get the connection URL from developer

### During Testing:
- [ ] Connect using the URL
- [ ] Wait for app to load
- [ ] Test scanning barcodes
- [ ] Check that country detection works (NZ for Android, AU for iPhone)
- [ ] Test packaging recycling info shows correct country rules

### If Something Goes Wrong:
- [ ] Check internet connection
- [ ] Try reconnecting
- [ ] Ask developer for help

---

## 💡 Pro Tips

1. **Keep Expo Go installed** - You'll need it for future testing
2. **Save the URL** - Write it down or save it in a message
3. **Both can test at the same time** - No problem!
4. **Test different features** - You don't need to test the same things
5. **Report any issues** - Tell the developer what you find

---

## 📞 Need Help?

If you get stuck:
1. **Check this guide again** - Most problems are covered here
2. **Ask the developer** - They can help troubleshoot
3. **Try a different method** - If Expo Go doesn't work, try the standalone app

---

## ✅ Success!

Once you're connected and the app loads, you're ready to test! 

**Remember:**
- ✅ Android user will see New Zealand recycling rules
- ✅ iPhone user will see Australia recycling rules
- ✅ Both can test simultaneously
- ✅ Updates appear automatically

**Happy Testing!** 🎉

