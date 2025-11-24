# Quick Remote Testing - No Build Required (iOS)

## 🎯 Your Situation
- **You:** New Zealand
- **Tester:** Australia (iOS iPhone)
- **Goal:** Test app while developing, no EAS build
- **Requirement:** Quick and easy setup

---

## ✅ BEST OPTION: Expo Go + Cloudflare Tunnel

**Why This Works:**
- ✅ No build needed - tester uses Expo Go (free from App Store)
- ✅ Setup in 5 minutes
- ✅ Free and reliable tunnel
- ✅ Works from anywhere (NZ to Australia)
- ✅ Hot reload works perfectly
- ✅ Updates instantly as you code

**Limitations:**
- ⚠️ Some custom native modules might not work (like Qonversion)
- ⚠️ But most features will work fine for testing

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Cloudflare Tunnel (2 minutes)

**Windows (PowerShell):**
```powershell
# Option A: Using Chocolatey (if you have it)
choco install cloudflared

# Option B: Download manually
# Go to: https://github.com/cloudflare/cloudflared/releases
# Download: cloudflared-windows-amd64.exe
# Rename to: cloudflared.exe
# Add to PATH or use full path
```

**Mac:**
```bash
brew install cloudflared
```

**Verify it works:**
```powershell
cloudflared --version
```

---

### Step 2: Start Expo Dev Server (1 minute)

**Terminal 1:**
```powershell
npx expo start
```

Wait for it to start - you'll see the QR code and local URL.

---

### Step 3: Start Cloudflare Tunnel (30 seconds)

**Terminal 2 (NEW terminal window):**
```powershell
cloudflared tunnel --url http://localhost:8081
```

**You'll see:**
```
+-----------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                          |
|                                                                             |
|  https://xxxxx-xxxx-xxxx.trycloudflare.com                                |
+-----------------------------------------------------------------------------+
```

**Copy that URL!** That's what you share with your tester.

---

### Step 4: Share with Your Tester (1 minute)

**Send them:**
1. The Cloudflare URL (e.g., `https://xxxxx.trycloudflare.com`)
2. These instructions:

---

## 📱 Instructions for Your Tester (Send This)

### For iOS (iPhone):

1. **Install Expo Go** (if not already):
   - Go to App Store
   - Search "Expo Go"
   - Install (it's free)

2. **Open Expo Go app**

3. **Connect to your dev server:**
   - Tap "Enter URL manually" (at bottom)
   - Paste the URL: `https://xxxxx.trycloudflare.com`
   - Tap "Connect"

4. **Wait for app to load** (takes 10-30 seconds)

5. **Done!** Your app appears and they can test it.

**When you update code:**
- App automatically reloads on their device
- They see changes instantly
- No need to reconnect!

---

## 🔄 Daily Workflow

**Every morning (or when you start coding):**

1. **Terminal 1:** Start Expo
   ```powershell
   npx expo start
   ```

2. **Terminal 2:** Start Tunnel
   ```powershell
   cloudflared tunnel --url http://localhost:8081
   ```

3. **Copy the Cloudflare URL** and send to tester (text/email/Slack)

**That's it!** Takes 30 seconds.

**While coding:**
- Save your code
- Tester's app reloads automatically
- They test and give feedback

**Evening:**
- Close terminals
- Tunnel stops automatically

---

## ⚡ Make It Even Easier: Automation Script

Create a script to start everything at once:

### File: `start-remote-testing.ps1` (Windows)

```powershell
# Start Expo Dev Server
Write-Host "Starting Expo dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx expo start"

# Wait 5 seconds for Expo to start
Write-Host "Waiting for Expo to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Cloudflare Tunnel
Write-Host "Starting Cloudflare tunnel..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cloudflared tunnel --url http://localhost:8081"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Check Terminal 2 for the Cloudflare URL" -ForegroundColor Yellow
Write-Host "2. Share that URL with your tester" -ForegroundColor Yellow
Write-Host "3. They open Expo Go and enter the URL" -ForegroundColor Yellow
Write-Host ""
```

**Usage:**
```powershell
.\start-remote-testing.ps1
```

Now two terminal windows open automatically! 🎉

---

## 🆚 Alternative Options (If Cloudflare Doesn't Work)

### Option 2: Expo Go + LocalTunnel (Free)

**Setup:**
```powershell
# Install LocalTunnel
npm install -g localtunnel

# Terminal 1: Start Expo
npx expo start

# Terminal 2: Start Tunnel
lt --port 8081
```

**Pros:**
- ✅ Free
- ✅ No installation needed (just npm)

**Cons:**
- ⚠️ Can be slower than Cloudflare
- ⚠️ URLs change each time

---

### Option 3: Expo Go + VPN (If You Have VPN)

**Setup:**
1. Both connect to same VPN (e.g., Tailscale - free)
2. Start Expo: `npx expo start --lan`
3. Share your local IP address
4. Tester enters IP in Expo Go

**Pros:**
- ✅ Very fast (direct connection)
- ✅ No tunnel needed

**Cons:**
- ⚠️ Requires VPN setup
- ⚠️ Both need good internet

**VPN Options:**
- **Tailscale** (free, easy): https://tailscale.com
- **ZeroTier** (free, easy): https://www.zerotier.com

---

### Option 4: Expo Go + ngrok (If You Want to Retry)

**Sometimes ngrok works on retry:**

```powershell
# Clear cache and try again
npx expo start -c --tunnel
```

**If it times out:**
- Wait 30 seconds
- Try again
- ngrok can be flaky but sometimes works

---

## 📊 Comparison: All Options

| Option | Setup Time | Daily Setup | Speed | Reliability | Cost |
|--------|------------|-------------|-------|-------------|------|
| **Cloudflare Tunnel** | 5 min | 30 sec | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free |
| **LocalTunnel** | 3 min | 30 sec | ⭐⭐⭐ | ⭐⭐⭐ | Free |
| **VPN + LAN** | 10 min | 30 sec | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Free |
| **ngrok** | 2 min | 30 sec | ⭐⭐⭐ | ⭐⭐ | Free |

**Winner: Cloudflare Tunnel** ✅

---

## 🎯 Recommended: Cloudflare Tunnel

**Why:**
- ✅ Fastest setup (5 minutes)
- ✅ Most reliable
- ✅ Free
- ✅ Works NZ to Australia
- ✅ No build needed
- ✅ Hot reload works

**Total Time:**
- **First time:** 5 minutes
- **Daily:** 30 seconds
- **Updates:** Instant

---

## 🆘 Troubleshooting

### "Cloudflare tunnel not connecting"
- Make sure Expo is running first
- Check port 8081 is not blocked
- Try restarting both

### "Tester can't connect"
- Make sure they're using the exact URL
- Check URL hasn't expired (restart tunnel if needed)
- Make sure Expo Go is latest version

### "App not loading"
- Check Expo dev server is running
- Verify tunnel URL is correct
- Try restarting tunnel

### "Connection drops"
- Cloudflare tunnels can timeout after inactivity
- Just restart tunnel and share new URL
- Takes 10 seconds

---

## ✅ Quick Start Checklist

- [ ] Install Cloudflare Tunnel: `choco install cloudflared` or download
- [ ] Test tunnel works: `cloudflared --version`
- [ ] Tester installs Expo Go from App Store
- [ ] Create start script (optional but helpful)
- [ ] Start daily workflow: Expo + Tunnel
- [ ] Share URL with tester
- [ ] They connect in Expo Go
- [ ] Done! ✅

---

## 💡 Pro Tips

### Tip 1: Keep Tunnel Running
The URL changes each time you restart. **Keep the tunnel running** during your development session.

### Tip 2: Share URL Once
Once tester connects, they can close and reopen Expo Go - it remembers the connection for that session.

### Tip 3: Use Scripts
Create the PowerShell script above to start everything with one command.

### Tip 4: Test Connection First
Before sharing with tester, test the URL yourself:
- Open URL in browser
- Should see Expo dev tools
- If it works, share with tester

---

## 📝 Summary

**Best Option: Expo Go + Cloudflare Tunnel**

**Setup:**
1. Install Cloudflare Tunnel (2 min)
2. Start Expo: `npx expo start` (Terminal 1)
3. Start Tunnel: `cloudflared tunnel --url http://localhost:8081` (Terminal 2)
4. Share URL with tester (30 sec)

**Daily:**
- Just start both terminals
- Share URL
- Code and test!

**Total Time:**
- First time: 5 minutes
- Daily: 30 seconds
- Updates: Instant

**That's it!** Simple, free, and works perfectly for remote testing. 🚀



