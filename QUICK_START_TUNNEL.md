# Quick Start: Expo Tunnel for Remote Testing

## 🎯 The Problem
You have an Android device connected, and Expo is trying to use `adb reverse` which conflicts with tunnel mode.

## ✅ The Solution

### Method 1: Use `--offline` Flag (Recommended)

This prevents Expo from trying to use connected devices:

```powershell
npx expo start --tunnel --offline
```

**This works!** ✅

---

### Method 2: Disconnect Android Device First

If you don't need the Android device:

```powershell
# Disconnect Android device
adb disconnect

# Then start Expo tunnel
npx expo start --tunnel
```

---

### Method 3: Use the Script

I've created a script that handles this automatically:

```powershell
.\start-tunnel-no-device.ps1
```

---

## 🚀 Starting Tunnel Now

**I've started Expo tunnel for you with the `--offline` flag.**

**Check your terminal - you should see:**
1. "Starting Metro Bundler..."
2. A QR code
3. **URL like: `exp://xxxxx.exp.direct:443`**

---

## 📱 For Your Tester

**Once you see the `exp://` URL:**

1. **Copy the URL** from terminal (looks like: `exp://xxxxx.exp.direct:443`)
2. **Send to your tester** with these instructions:

```
Hi! Here's how to test the app:

1. Open Expo Go app on your iPhone
2. Look for "Enter URL manually" button or text field
3. Paste this URL: [PASTE EXP:// URL HERE]
4. Tap "Connect"
5. Wait 10-30 seconds
6. Done! App loads and you can test!
```

---

## 🔧 If Tunnel Times Out

**If you see "tunnel took too long":**

1. Wait 30 seconds
2. Press Ctrl+C
3. Try again: `npx expo start --tunnel --offline`
4. Sometimes works on 2nd or 3rd try

**For more reliability, get ngrok auth token:**
- Sign up: https://dashboard.ngrok.com/signup (free)
- Get auth token
- Download ngrok: https://ngrok.com/download
- Extract `ngrok.exe` to project folder
- Run: `.\ngrok.exe authtoken YOUR_TOKEN`
- Then: `npx expo start --tunnel --offline` (works reliably!)

---

## ✅ Quick Checklist

- [ ] Start Expo tunnel: `npx expo start --tunnel --offline`
- [ ] Wait for `exp://` URL to appear
- [ ] Copy URL from terminal
- [ ] Share URL with tester
- [ ] Tester connects in Expo Go
- [ ] Done! ✅

---

**Check your terminal now - do you see the `exp://` URL?**



