# Simple Remote Testing Guide - Both Users Simultaneously

## 🎯 Setup (One-Time - 2 Minutes)

**On your development computer (New Zealand):**

1. **Start Expo with tunnel:**
   ```powershell
   .\start-remote-testing-simple.ps1
   ```
   
   Or manually:
   ```powershell
   npx expo start --tunnel
   ```

2. **Wait for tunnel to connect** (30-60 seconds)

3. **Copy the `exp://` URL** from Terminal 1
   - It will look like: `exp://ghago_g-crwmlw-8081.exp.direct`

4. **Share this URL with both testers!**

---

## 📱 For You (New Zealand - Android)

### Step 1: Install Expo Go (if needed)
1. Open **Play Store** on Android
2. Search **"Expo Go"**
3. Install (free app)

### Step 2: Connect
1. Open **Expo Go** app
2. Tap **"Scan QR code"** button
3. Scan the QR code from Terminal 1
4. **Done!** ✅ App loads (10-30 seconds)

**OR manually:**
1. Open Expo Go
2. Tap **"Enter URL manually"** (or look for text input)
3. Paste the `exp://` URL
4. Tap **"Connect"**
5. **Done!** ✅

---

## 📱 For Tester (Australia - iPhone)

### Step 1: Install Expo Go
1. Open **App Store** on iPhone
2. Search **"Expo Go"**
3. Install (free app) - **Use latest version (SDK 54)**

### Step 2: Connect
1. Open **Expo Go** app
2. Look for **"Enter URL manually"** button or text field
   - Might be at bottom of screen
   - Might be in menu (☰ icon)
   - Might appear when you tap screen
3. Paste the `exp://` URL you received
   - Should look like: `exp://ghago_g-crwmlw-8081.exp.direct`
4. Tap **"Connect"** or press Enter
5. Wait **10-30 seconds** for app to load
6. **Done!** ✅ App appears and you can test!

**Alternative - Scan QR Code:**
1. If Expo Go shows camera view, scan the QR code
2. Or screenshot the QR code and share it
3. They can scan it in Expo Go

**Alternative - Safari Deep Link:**
1. Copy the `exp://` URL
2. Open **Safari** on iPhone
3. Paste URL in address bar
4. Safari will prompt: **"Open in Expo Go?"**
5. Tap **"Open"**
6. **Done!** ✅

---

## ✅ What Happens

**Both users connect to the same dev server:**
- ✅ Both see the same app
- ✅ Both can test simultaneously
- ✅ Changes you make appear on both devices (hot reload)
- ✅ Both can scan barcodes, test features, etc.

---

## 🔄 Daily Workflow

### Starting Testing Session:
1. **You (Developer):**
   ```powershell
   .\start-remote-testing-simple.ps1
   ```

2. **Wait for tunnel URL** (30-60 seconds)

3. **Share URL with both testers:**
   ```
   Hi! Connect to test the app:
   
   URL: exp://ghago_g-crwmlw-8081.exp.direct
   
   Instructions:
   - Open Expo Go
   - Enter URL manually (or scan QR)
   - Paste URL above
   - Connect!
   ```

4. **Both testers connect** using the URL

5. **Everyone tests simultaneously!** ✅

---

## 📋 Quick Reference

### For You (Developer):
- ✅ Start tunnel: `.\start-remote-testing-simple.ps1`
- ✅ Get `exp://` URL from Terminal 1
- ✅ Share URL with testers
- ✅ Keep Terminal 1 open (tunnel stays active)

### For Android User (New Zealand):
- ✅ Open Expo Go
- ✅ Scan QR code OR enter URL manually
- ✅ Connect!
- ✅ Test app

### For iPhone User (Australia):
- ✅ Open Expo Go (App Store version)
- ✅ Enter URL manually (paste `exp://` URL)
- ✅ Connect!
- ✅ Test app

---

## 🔧 Troubleshooting

### "Can't connect" or "Connection failed"
- **Check:** Terminal 1 is still running and tunnel is active
- **Check:** URL is correct (starts with `exp://`)
- **Wait:** Sometimes takes 30-60 seconds to connect

### "Tunnel timed out"
- **Fix:** Wait 30 seconds, then restart:
  ```powershell
  .\start-remote-testing-simple.ps1
  ```
- **Retry:** Tunnel sometimes works on 2nd attempt

### iPhone user can't find "Enter URL manually"
- **Try:** Tap the screen (if camera view)
- **Try:** Look for menu icon (☰)
- **Try:** Look at bottom of screen
- **Try:** Use Safari method (paste URL in Safari)

### Both users can't connect at same time
- **Fix:** Both can connect! Tunnel supports multiple connections
- **Check:** Both are using the same URL
- **Check:** Terminal 1 is still running

---

## 💡 Tips

1. **Keep Terminal 1 open** - Tunnel only works while running
2. **Share the exact URL** - Copy/paste it exactly
3. **URL might change** - If you restart tunnel, share new URL
4. **Both can connect simultaneously** - Tunnel supports multiple users
5. **Changes appear on both** - Hot reload works for everyone

---

## ✅ Summary

**Simple 3-Step Process:**

1. **You:** Start tunnel → Get `exp://` URL
2. **Share:** Send URL to both testers
3. **Both:** Open Expo Go → Paste URL → Connect

**Everyone tests simultaneously!** 🎉

---

**Ready to test? Start the tunnel and share the URL with both users!** 🚀
