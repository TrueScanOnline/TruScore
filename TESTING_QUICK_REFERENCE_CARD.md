# Testing Quick Reference Card

## 🚀 For Developer: Start Testing

### Quick Start (30 seconds):
```powershell
npx expo start --tunnel
```

**Wait for:** `exp://xxxxx.exp.direct:8081`

**Share URL with both testers!**

---

## 📱 For Android Tester (Samsung - New Zealand)

1. Install **Expo Go** from Play Store
2. Open **Expo Go**
3. Tap **"Scan QR code"** OR **"Enter URL manually"**
4. Paste URL: `exp://xxxxx.exp.direct:8081`
5. Tap **"Connect"**
6. **Done!** ✅

---

## 📱 For iPhone Tester (iPhone 11 - Australia)

1. Install **Expo Go** from App Store
2. Copy URL: `exp://xxxxx.exp.direct:8081`
3. Open **Safari** browser
4. Paste URL in address bar
5. Tap **"Open in Expo Go"**
6. **Done!** ✅

---

## ✅ What to Test

- [ ] Scan barcodes
- [ ] Check country detection (NZ for Android, AU for iPhone)
- [ ] Check packaging recycling shows correct country rules
- [ ] Check packaging border color (green if recyclable, red if not)
- [ ] Test all features

---

## 🔄 Updates

- Developer makes changes → App auto-reloads on both devices
- No need to reconnect!

---

## ⚠️ Troubleshooting

**Can't connect?**
- Check internet connection
- Try reconnecting
- Ask developer for new URL

**App won't load?**
- Wait 30-60 seconds
- Close and reopen Expo Go
- Try again

---

**Need full instructions?** See `COMPLETE_TESTING_GUIDE.md`

