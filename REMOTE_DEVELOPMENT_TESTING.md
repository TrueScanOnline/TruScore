# Remote Development Testing Guide - Step-by-Step Development

## 🎯 Goal
Enable your tester in Australia to test the app **as you develop it** - seeing updates in real-time without rebuilding each time.

---

## ✅ Best Solution: Development Build + Cloudflare Tunnel

**How it works:**
1. Build a **Development Build** once (takes 10-20 minutes, one time)
2. Tester installs it on their iPhone (once)
3. You start your dev server with **Cloudflare Tunnel** (free, reliable)
4. Tester connects to your dev server
5. **Every time you save code, the app updates automatically!** ✨

**Timeline:**
- Initial setup: ~20-30 minutes (one time)
- Daily development: Just start dev server (~30 seconds)
- Updates to tester: Instant (hot reload works)

---

## 📋 Step-by-Step Setup

### Part 1: Create Development Build (One Time - 20 minutes)

#### Step 1: Install EAS CLI
```powershell
npm install -g eas-cli
```

#### Step 2: Login to Expo
```powershell
eas login
```

#### Step 3: Install expo-dev-client
```powershell
npx expo install expo-dev-client
```

#### Step 4: Configure EAS (if not done)
```powershell
eas build:configure
```

#### Step 5: Build Development Build
```powershell
eas build --platform ios --profile development
```

**This takes 10-20 minutes** - grab a coffee ☕

When done, you'll get a download link - send this to your tester to install.

---

### Part 2: Set Up Cloudflare Tunnel (5 minutes)

#### Step 1: Install Cloudflare Tunnel
```powershell
# Using Chocolatey (Windows)
choco install cloudflared

# OR download manually from:
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

#### Step 2: Test it works
```powershell
cloudflared tunnel --url http://localhost:8081
```

You should see a URL like: `https://xxxxx.trycloudflare.com`

Press Ctrl+C to stop it (we'll automate this next).

---

### Part 3: Daily Development Workflow

#### Step 1: Start Expo Dev Server
```powershell
npx expo start --dev-client
```

#### Step 2: Start Cloudflare Tunnel (in a NEW terminal window)
```powershell
cloudflared tunnel --url http://localhost:8081
```

**You'll see:**
```
+-----------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time   |
|  to be reachable):                                                          |
|                                                                             |
|  https://xxxxx-xxxx-xxxx.trycloudflare.com                                 |
+-----------------------------------------------------------------------------+
```

#### Step 3: Share the Cloudflare URL
- Copy the `https://xxxxx.trycloudflare.com` URL
- Send it to your tester

#### Step 4: Tester Connects (One Time)
1. Tester opens the **Development Build** app on their iPhone
2. App shows a screen asking for URL
3. Tester enters/pastes the Cloudflare URL
4. Tap "Connect"
5. App loads and shows your app!

**Every code change you make:** App automatically reloads on tester's device! ✨

---

## 🔄 Daily Workflow Summary

**Every morning (or when you start coding):**

1. **Terminal 1:** Start Expo
   ```powershell
   npx expo start --dev-client
   ```

2. **Terminal 2:** Start Tunnel
   ```powershell
   cloudflared tunnel --url http://localhost:8081
   ```

3. **Share the Cloudflare URL** with your tester (text/email/Slack)

**That's it!** They see all your changes instantly.

---

## 🎯 Alternative: Even Simpler (Expo Go + Tunnel)

If you don't want to build anything:

### Option B: Expo Go + Cloudflare Tunnel

**How it works:**
- Tester uses **Expo Go** app (free, from App Store)
- You expose dev server via Cloudflare Tunnel
- They scan QR code or enter URL
- Updates in real-time

#### Setup:

**Step 1: Start Expo with Tunnel**
```powershell
npx expo start --tunnel
```

**If that fails (ngrok timeout), use Cloudflare instead:**

**Step 1: Start Expo normally**
```powershell
npx expo start --dev-client
```

**Step 2: In another terminal, start Cloudflare Tunnel**
```powershell
cloudflared tunnel --url http://localhost:8081
```

**Step 3: Share the Cloudflare URL**
- Copy the URL shown
- Send to tester

**Step 4: Tester Opens in Expo Go**
1. Open Expo Go app on iPhone
2. Tap "Enter URL manually"
3. Paste the Cloudflare URL
4. Tap "Connect"
5. App loads!

**Limitations:**
- ⚠️ Can't use custom native modules (Qonversion, etc.)
- ⚠️ Some features might not work in Expo Go
- ✅ Works if your app doesn't use custom native code

---

## 🚀 Recommended Approach

### For Your App (Uses Qonversion & Custom Modules):

**Use: Development Build + Cloudflare Tunnel**

**Why:**
- ✅ All native modules work (Qonversion, camera, etc.)
- ✅ Hot reload works perfectly
- ✅ One build, then just develop
- ✅ Free tunnel service
- ✅ Reliable connection

### Setup Time:
- **One time:** 20-30 minutes
- **Daily:** 30 seconds (just start tunnel)

### Daily Workflow:
```
1. npx expo start --dev-client    (Terminal 1)
2. cloudflared tunnel --url http://localhost:8081    (Terminal 2)
3. Share URL with tester
4. Code! Changes appear instantly on tester's device ✨
```

---

## 🔧 Make It Even Easier: Automation Script

Create a script to start everything at once:

### File: `start-dev-tunnel.ps1` (Windows PowerShell)

```powershell
# Start Expo Dev Server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx expo start --dev-client"

# Wait 5 seconds for Expo to start
Start-Sleep -Seconds 5

# Start Cloudflare Tunnel
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:8081"

Write-Host "Development server starting..."
Write-Host "Check Terminal 2 for the Cloudflare URL to share with your tester!"
```

**Usage:**
```powershell
.\start-dev-tunnel.ps1
```

Now two terminal windows open automatically - one for Expo, one for tunnel!

---

## 📱 What Your Tester Needs to Do

### First Time Only:
1. **Install Development Build** (you send them the download link)
2. **Trust your developer certificate** (Settings → General → VPN & Device Management)

### Every Testing Session:
1. **Open the Development Build app**
2. **Enter/paste the Cloudflare URL** you send them
3. **Tap "Connect"**
4. **Test the app!**

**When you update code:**
- App **automatically reloads** on their device
- They see your changes instantly
- No need to reconnect!

---

## ⏱️ Time Breakdown

### One-Time Setup:
- Install EAS CLI: 2 minutes
- Login: 1 minute
- Install expo-dev-client: 2 minutes
- Configure EAS: 2 minutes
- Build dev build: 10-20 minutes (happens in background)
- Install Cloudflare Tunnel: 3 minutes

**Total one-time: ~20-30 minutes**

### Daily Development:
- Start Expo: 10 seconds
- Start Tunnel: 10 seconds
- Share URL: 10 seconds (copy/paste)

**Total daily: ~30 seconds** ✨

### Code Updates:
- **Instant!** Hot reload works automatically
- Tester sees changes as you save files
- No action needed from either of you

---

## 💡 Pro Tips

### Tip 1: Keep URL Same Session
The Cloudflare URL changes each time you restart the tunnel. **Keep the tunnel running** during your development session.

### Tip 2: Share URL Once
Once tester connects, they can close and reopen the app - it remembers the URL for that session.

### Tip 3: If Tunnel Disconnects
If connection drops:
1. Restart tunnel (gets new URL)
2. Send new URL to tester
3. They reconnect (takes 10 seconds)

### Tip 4: Use Scripts
Create helper scripts to start everything quickly (see script above).

---

## 🆚 Comparison: All Options

| Option | Setup Time | Daily Setup | Hot Reload | Native Modules |
|--------|------------|-------------|------------|----------------|
| **Dev Build + Tunnel** | 20-30 min | 30 sec | ✅ Yes | ✅ Yes |
| **Expo Go + Tunnel** | 5 min | 30 sec | ✅ Yes | ❌ No |
| **EAS Build Each Time** | 5 min | 10-20 min | ❌ No | ✅ Yes |
| **VPN + LAN** | 10 min | 30 sec | ✅ Yes | ✅ Yes |

**Winner: Development Build + Cloudflare Tunnel** ✅

---

## 📝 Quick Reference

### Daily Commands:
```powershell
# Terminal 1: Start Expo
npx expo start --dev-client

# Terminal 2: Start Tunnel
cloudflared tunnel --url http://localhost:8081
```

### Share This with Your Tester:
1. Open Development Build app
2. Enter URL: `[paste Cloudflare URL here]`
3. Tap Connect
4. Test!

---

## ✅ Checklist

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Install expo-dev-client: `npx expo install expo-dev-client`
- [ ] Build dev build: `eas build --platform ios --profile development`
- [ ] Install Cloudflare Tunnel
- [ ] Send dev build download link to tester
- [ ] Tester installs dev build (once)
- [ ] Start daily workflow (30 seconds)

**After this, just develop - they see everything instantly!** 🚀
