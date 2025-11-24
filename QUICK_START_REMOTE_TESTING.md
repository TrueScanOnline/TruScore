# Quick Start: Remote Testing for Both Users

## 🚀 Start Testing (1 Minute Setup)

### Step 1: Start Expo Tunnel
```powershell
.\start-remote-testing-simple.ps1
```

**Wait 30-60 seconds** for tunnel to connect.

### Step 2: Get the URL
Look in Terminal 1 for:
```
Metro waiting on exp://xxxxx.exp.direct
```

**Copy that URL!** (e.g., `exp://ghago_g-crwmlw-8081.exp.direct`)

### Step 3: Share with Both Testers

Send this message to both users:

---

## 📧 Message for Testers

```
Hi! Here's how to test the app:

1. Install Expo Go from App Store (iPhone) or Play Store (Android)
   - Free app - just search "Expo Go"

2. Open Expo Go app

3. Enter URL manually (or scan QR code):
   exp://ghago_g-crwmlw-8081.exp.direct
   
   (Replace with the actual URL from Terminal 1)

4. Tap "Connect" and wait 10-30 seconds

5. Done! App loads and you can test!

Note: Both users can connect at the same time!
```

---

## 📱 For Android User (New Zealand)

**Easiest method:**
1. Open Expo Go
2. Tap "Scan QR code"
3. Scan QR code from Terminal 1
4. **Done!** ✅

**Alternative:**
1. Open Expo Go
2. Tap "Enter URL manually"
3. Paste the `exp://` URL
4. Tap "Connect"
5. **Done!** ✅

---

## 📱 For iPhone User (Australia)

**Easiest method:**
1. Open Expo Go
2. Look for "Enter URL manually" button or text field
   - May be at bottom of screen
   - May be in menu (☰ icon)
   - Try tapping the screen
3. Paste the `exp://` URL
4. Tap "Connect"
5. **Done!** ✅

**Alternative - Safari:**
1. Copy the `exp://` URL
2. Open Safari
3. Paste in address bar
4. Safari asks "Open in Expo Go?"
5. Tap "Open"
6. **Done!** ✅

---

## ✅ Both Connect Simultaneously!

- ✅ **Multiple connections supported** - Both can connect at once
- ✅ **Same app** - Both see the same version
- ✅ **Live updates** - Changes appear on both devices
- ✅ **Independent testing** - Both can test different features

---

## 🔄 When URL Changes

**If you restart the tunnel:**
1. Get new URL from Terminal 1
2. Share new URL with both testers
3. They reconnect with new URL

**URL stays same** if you don't restart Terminal 1.

---

## 💡 Pro Tips

1. **Keep Terminal 1 open** - Tunnel only works while running
2. **Share URL via messaging** - Easy copy/paste
3. **Both can reconnect** - If they disconnect, just reconnect
4. **Hot reload works** - Changes appear on both devices instantly

---

**That's it! Simple 3-step process for both users to test simultaneously!** 🎉



