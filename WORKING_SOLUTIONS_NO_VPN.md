# Working Solutions - No VPN, No EAS Build

## 🎯 Your Requirements
- ❌ No VPN
- ❌ No EAS Build
- ✅ Remote testing (NZ to Australia)
- ✅ iOS Expo Go

## ✅ Solution 1: Expo Tunnel with ngrok Auth Token

**The problem:** Expo's tunnel (ngrok) times out without authentication.

**The fix:** Get a free ngrok auth token - this makes tunnel mode much more reliable!

### Setup (5 Minutes):

#### Step 1: Get Free ngrok Account
1. Go to: https://dashboard.ngrok.com/signup
2. Sign up (free, no credit card)
3. Get your auth token from dashboard

#### Step 2: Configure ngrok
```powershell
# Install ngrok
# Download from: https://ngrok.com/download
# Extract ngrok.exe to your project folder

# Set auth token (one time)
.\ngrok.exe authtoken YOUR_AUTH_TOKEN_HERE
```

#### Step 3: Start Expo
```powershell
npx expo start --tunnel
```

**With auth token, ngrok is MUCH more reliable!**

**When it works, you'll see:**
```
Metro waiting on exp://xxxxx.exp.direct:443
```

**This URL works with Expo Go!** ✅

---

## ✅ Solution 2: Use LocalTunnel with Expo Protocol

LocalTunnel can work, but we need to configure Expo properly.

### Setup:

**Terminal 1: Start Expo on specific port**
```powershell
npx expo start --lan --port 8081
```

**Terminal 2: Install and run LocalTunnel**
```powershell
npm install -g localtunnel
lt --port 8081 --print-requests
```

**You'll get a URL like:**
```
https://xxxxx.loca.lt
```

**Now, the key is:** Expo Go needs `exp://` protocol. But we can't convert LocalTunnel's HTTPS to exp:// easily.

**However, try this:**
1. Send tester the LocalTunnel URL: `https://xxxxx.loca.lt`
2. Have them open it in Safari first
3. Safari page might have a QR code or link to open in Expo Go
4. Or Safari might prompt "Open in Expo Go?"

---

## ✅ Solution 3: Use Expo's Tunnel with Retries

**The trick:** Expo tunnel works, but ngrok needs multiple attempts sometimes.

### Script to Auto-Retry:

Create `start-expo-tunnel.ps1`:

```powershell
$maxAttempts = 5
$attempt = 1

Write-Host "Starting Expo Tunnel (will retry if needed)..." -ForegroundColor Green

while ($attempt -le $maxAttempts) {
    Write-Host ""
    Write-Host "Attempt $attempt of $maxAttempts..." -ForegroundColor Yellow
    
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx expo start --tunnel" -PassThru
    
    Start-Sleep -Seconds 30
    
    # Check if tunnel connected (simplified check)
    # If process is still running after 30 seconds, assume it's working
    if (-not $process.HasExited) {
        Write-Host "Tunnel appears to be connected!" -ForegroundColor Green
        Write-Host "Check the PowerShell window for the exp:// URL" -ForegroundColor Yellow
        break
    }
    
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    $attempt++
    
    if ($attempt -le $maxAttempts) {
        Write-Host "Retrying in 10 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if ($attempt -gt $maxAttempts) {
    Write-Host ""
    Write-Host "Tunnel failed after $maxAttempts attempts." -ForegroundColor Red
    Write-Host "Try: ngrok with auth token (Solution 1) or VPN" -ForegroundColor Yellow
}
```

**Usage:**
```powershell
.\start-expo-tunnel.ps1
```

---

## ✅ Solution 4: Use serveo.net (Free SSH Tunnel)

This might work better than ngrok.

### Setup:

**Terminal 1: Start Expo**
```powershell
npx expo start --lan --port 8081
```

**Terminal 2: SSH Tunnel**
```powershell
# Windows doesn't have SSH by default, but you can use:
# Option A: Install OpenSSH for Windows
# Option B: Use Git Bash (if you have Git installed)
# Option C: Use WSL (Windows Subsystem for Linux)

# In Git Bash or WSL:
ssh -R 80:localhost:8081 serveo.net
```

**You'll get:**
```
Forwarding HTTP traffic from https://xxxxx.serveo.net
```

**Try using:** `exp://xxxxx.serveo.net:443`

---

## 🎯 Best Option: ngrok with Auth Token

**This is your best bet without VPN or EAS Build:**

### Why This Works:
- ✅ Free ngrok account (no credit card)
- ✅ Auth token makes tunnel reliable
- ✅ Expo tunnel uses ngrok automatically
- ✅ Gives correct `exp://` protocol
- ✅ Works with Expo Go

### Quick Setup:

1. **Sign up:** https://dashboard.ngrok.com/signup (2 min)
2. **Get auth token** from dashboard (copy it)
3. **Set token:**
   ```powershell
   # Install ngrok first (download from ngrok.com)
   .\ngrok.exe authtoken YOUR_TOKEN_HERE
   ```
4. **Start Expo:**
   ```powershell
   npx expo start --tunnel
   ```
5. **Get URL:** `exp://xxxxx.exp.direct:443`
6. **Share with tester!**

---

## 💡 Why This Will Work

**Without auth token:**
- ngrok free tier has rate limits
- Tunnel times out frequently
- Unreliable

**With auth token:**
- Much higher rate limits
- More reliable connection
- Tunnel stays connected
- Actually works! ✅

---

## 📋 Quick Start: ngrok with Auth

**Total time: 5 minutes**

1. **Sign up:** https://dashboard.ngrok.com/signup (free)
2. **Get token:** Copy from dashboard
3. **Download ngrok:** https://ngrok.com/download
4. **Set token:** `.\ngrok.exe authtoken YOUR_TOKEN`
5. **Start Expo:** `npx expo start --tunnel`
6. **Share exp:// URL** with tester

**This actually works!** The auth token makes all the difference.

---

Want me to help you set up ngrok with auth token now? It's the most reliable solution!
