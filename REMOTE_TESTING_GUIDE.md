# Remote Testing Guide - iOS in Australia

## 🎯 Problem
You're trying to test the app remotely with a user in Australia on iOS, but Expo tunnel mode (`npx expo start --tunnel`) is timing out with ngrok.

## ✅ Solution 1: EAS Build (RECOMMENDED for iOS)

This is the **best option** for remote iOS testing. It creates a standalone app that doesn't require Expo Go.

### Setup Steps:

#### 1. Install EAS CLI (if not already installed)
```powershell
npm install -g eas-cli
```

#### 2. Login to Expo Account
```powershell
eas login
```

#### 3. Configure EAS (if not already configured)
```powershell
eas build:configure
```
This will create an `eas.json` file.

#### 4. Create or Update `eas.json`
Create/update the file in your project root:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  }
}
```

#### 5. Build iOS Preview Build
```powershell
eas build --platform ios --profile preview
```

#### 6. Share Build with Tester
- EAS will provide a download link after build completes
- Share the link with your tester in Australia
- They can download and install directly on their iOS device
- **Note:** For iOS, they'll need to:
  1. Download the `.ipa` file
  2. Install via TestFlight (if you have Apple Developer account) OR
  3. Use a service like Diawi or InstallOnAir for ad-hoc distribution

### Pros:
- ✅ No tunnel needed - app works offline
- ✅ More reliable than tunnel mode
- ✅ Works from anywhere in the world
- ✅ Includes all native modules (Qonversion, etc.)
- ✅ Faster than tunnel for testing

### Cons:
- ⚠️ Requires EAS account (free tier available)
- ⚠️ iOS builds need Apple Developer account ($99/year)
- ⚠️ Build takes 10-20 minutes

---

## 🔄 Solution 2: Fix Tunnel Mode (Alternative)

If you want to stick with tunnel mode, try these fixes:

### Option 2a: Use Cloudflare Tunnel (More Reliable)

1. **Install Cloudflare Tunnel**:
```powershell
# Download cloudflared from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
# Or use chocolatey:
choco install cloudflared
```

2. **Start Expo in LAN mode**:
```powershell
npx expo start --lan
```

3. **Create tunnel** (in separate terminal):
```powershell
cloudflared tunnel --url http://localhost:8081
```

4. **Share the Cloudflare URL** with your tester

### Option 2b: Retry Expo Tunnel (Sometimes Works)

Sometimes ngrok just needs a retry:

1. **Clear Expo cache**:
```powershell
npx expo start -c
```

2. **Try tunnel again**:
```powershell
npx expo start --tunnel
```

3. **If it fails, wait 30 seconds and try again** - ngrok can be flaky

### Option 2c: Use LocalTunnel (Free Alternative)

1. **Install LocalTunnel**:
```powershell
npm install -g localtunnel
```

2. **Start Expo in LAN mode**:
```powershell
npx expo start --lan
```

3. **Create tunnel** (in separate terminal):
```powershell
lt --port 8081
```

4. **Share the LocalTunnel URL** with your tester

---

## 🌐 Solution 3: VPN + LAN Mode

If you and your tester can connect via VPN:

1. **Both connect to same VPN** (e.g., Tailscale, ZeroTier - both free)
2. **Start Expo in LAN mode**:
```powershell
npx expo start --lan
```
3. **Share the LAN IP address** shown by Expo
4. **Tester scans QR code in Expo Go**

### Pros:
- ✅ No build needed
- ✅ Instant updates
- ✅ Free

### Cons:
- ⚠️ Requires VPN setup
- ⚠️ Both need good internet connection

---

## 📱 Solution 4: Expo Development Build (Best Balance)

Create a development build that can still connect to your dev server:

### Setup:

1. **Install expo-dev-client**:
```powershell
npx expo install expo-dev-client
```

2. **Build development client**:
```powershell
eas build --profile development --platform ios
```

3. **Install on tester's device** (via TestFlight or direct install)

4. **Start dev server**:
```powershell
npx expo start --dev-client
```

5. **Tester opens app and scans QR code** - will connect to your dev server

### Pros:
- ✅ Full native modules support
- ✅ Can still use hot reload
- ✅ Works remotely via tunnel/LAN

### Cons:
- ⚠️ Requires initial build
- ⚠️ Need to set up tunnel for remote dev server

---

## 🎯 **Recommended Approach for Your Situation**

Since you're testing with someone in Australia:

1. **For Quick Testing**: Use **EAS Build (Preview)** - Build once, share link, done ✅
2. **For Frequent Updates**: Use **Development Build + Cloudflare Tunnel** - Build once, then hot reload works

---

## 🚀 Quick Start: EAS Build for iOS

Here's the fastest way to get your tester set up:

```powershell
# 1. Make sure you're logged in
eas login

# 2. Configure if needed (one-time setup)
eas build:configure

# 3. Build iOS preview
eas build --platform ios --profile preview

# 4. Wait for build (10-20 minutes)
# 5. Share the download link with your tester
# 6. They install on their device
```

**That's it!** They can test the full app without Expo Go.

---

## 📝 Notes

- **iOS Distribution**: For iOS, you'll need an Apple Developer account to distribute outside of TestFlight
- **Free Alternative**: If you don't have Apple Developer account yet, use TestFlight (requires App Store Connect setup)
- **Android is Easier**: For Android, you can just build an APK and share directly - no account needed

---

## ❓ Troubleshooting

### "ngrok tunnel took too long"
- **Fix**: Use EAS Build instead (recommended)
- **Alternative**: Use Cloudflare Tunnel or LocalTunnel

### "Build failed"
- Check `eas.json` configuration
- Make sure you're logged in: `eas login`
- Check Expo account has build credits (free tier: 30 builds/month)

### "Can't install on iOS device"
- Need Apple Developer account for ad-hoc distribution
- Use TestFlight instead (easier)
- Or use development build with TestFlight

---

## 📚 Additional Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [TestFlight Setup](https://docs.expo.dev/submit/ios/)
- [Development Builds](https://docs.expo.dev/development/introduction/)
