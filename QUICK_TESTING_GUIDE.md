# Quick Testing Guide - TrueScan App

## 🍎 Testing on iPhone 11 (Easiest Method)

### Step 1: Install Expo Go on iPhone
1. Open **App Store** on iPhone 11
2. Search **"Expo Go"**
3. Tap **Install** (free app)

### Step 2: Start Development Server
On your development computer (where the project is):
```bash
cd C:\TrueScan-FoodScanner
npm start
```
Or:
```bash
npx expo start
```

### Step 3: Connect iPhone
1. Make sure iPhone 11 and development computer are on **same Wi-Fi network**
2. Open **Expo Go** app on iPhone
3. Tap **"Scan QR Code"**
4. Scan the QR code shown in the terminal/browser
5. App will load automatically! ✅

### If QR Code Doesn't Work:
- Try tunnel mode: `npx expo start --tunnel`
- Or manually enter the URL shown in terminal into Expo Go

---

## 💻 Testing on MacBook Pro

### Option 1: Web Browser (Fastest)
```bash
cd C:\TrueScan-FoodScanner
npx expo start --web
```
- Opens automatically in browser
- Good for UI testing
- ⚠️ Camera won't work (use manual barcode entry)

### Option 2: iOS Simulator (Requires Xcode)
1. **Install Xcode** from Mac App Store (free, ~12GB)
2. **Install Command Line Tools:**
   ```bash
   xcode-select --install
   ```
3. **Open iOS Simulator:**
   ```bash
   open -a Simulator
   ```
4. **Start Expo:**
   ```bash
   cd C:\TrueScan-FoodScanner
   npx expo start
   ```
5. **Press 'i'** in terminal
6. Select **iPhone 11** in Simulator menu
7. App will build and launch! ✅

---

## 🔧 Troubleshooting

### Can't Connect from iPhone?
- ✅ Check both devices on same Wi-Fi
- ✅ Use tunnel: `npx expo start --tunnel`
- ✅ Check firewall settings

### Camera Not Working on iPhone?
- ✅ Settings → Expo Go → Camera → Allow
- ✅ Grant permissions when prompted

### App Crashes?
- ✅ Restart Expo Go app
- ✅ Clear cache (shake device → Dev Menu → Reload)
- ✅ Restart Expo server

---

## 🎯 Quick Reference

| Method | Device | Requirements | Camera? |
|--------|--------|--------------|---------|
| **Expo Go** | iPhone 11 | Expo Go app + same Wi-Fi | ✅ Yes |
| **iOS Simulator** | MacBook Pro | Xcode installed | ⚠️ Limited |
| **Web Browser** | MacBook Pro | Web browser | ❌ No |

---

## 📞 Need Help?

- **Expo Docs:** https://docs.expo.dev/
- **Expo Forums:** https://forums.expo.dev/

**All methods are FREE and easy to set up!** 🚀

