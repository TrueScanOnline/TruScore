# Testing Quick Reference - Dual Users

## 🎯 Recommended Solution: EAS Build (Preview)

**Best for:** Novice developers, reliable testing, both Android + iOS

---

## ⚡ Quick Commands

### Initial Setup (One Time)

```powershell
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure
eas build:configure
```

### Build for Testing

```powershell
# Android (User 1 - NZ)
eas build --platform android --profile preview

# iOS (User 2 - AU)
eas build --platform ios --profile preview
```

### Check Build Status

```powershell
# View builds online
# Go to: https://expo.dev
# Click "Builds" tab
```

---

## 📱 Tester Instructions

### User 1 (Android - Samsung)

1. Open download link on phone
2. Download APK
3. Tap to install
4. Done!

### User 2 (iOS - iPhone 11)

1. Open download link on iPhone (Safari)
2. Download file
3. Settings → General → VPN & Device Management
4. Trust developer profile
5. Install file
6. Done!

---

## ⏱️ Timeline

- **Setup:** 15 minutes (one-time)
- **Build:** 15-20 minutes per platform
- **Total:** ~35 minutes first time, then 15-20 min per update

---

## 💰 Cost

- **EAS Build:** Free (30 builds/month)
- **Android:** FREE ✅
- **iOS:** $99/year (Apple Developer account)

---

## 🆘 Quick Troubleshooting

**Build failed?**
- Check `eas.json` exists
- Run `eas login` again
- Check build credits at expo.dev

**Tester can't install?**
- Android: Allow "Install from unknown sources"
- iOS: Trust developer in Settings

**Need help?**
- See: `DUAL_USER_TESTING_SOLUTION.md` for full guide

---

## ✅ Checklist

- [ ] EAS CLI installed
- [ ] Logged in to Expo
- [ ] `eas.json` configured
- [ ] Android build created
- [ ] iOS build created (if have Apple Developer account)
- [ ] Links shared with testers
- [ ] Testers installed successfully

---

**Full Guide:** See `DUAL_USER_TESTING_SOLUTION.md`



