# Quick Fix: Tunnel Port Mismatch

## ⚠️ Problem
- Expo is running on **port 8082**
- Cloudflare tunnel is pointing to **port 8081**
- They need to match!

## ✅ Fix Steps (2 Minutes)

### Step 1: Stop Current Tunnel (Terminal 2)
- In Terminal 2 (Cloudflare tunnel window)
- Press **Ctrl+C** to stop it

### Step 2: Restart Tunnel for Port 8082
- In Terminal 2, run:
```powershell
.\cloudflared.exe tunnel --url http://localhost:8082
```

### Step 3: Get New URL
- Terminal 2 will show a new URL
- Copy that URL
- It will look like: `https://xxxxx-xxxx-xxxx.trycloudflare.com`

### Step 4: Share with Tester
- Send them the new URL
- They connect in Expo Go using that URL

---

## 🚀 Quick Command

Or just run this script:
```powershell
.\start-tunnel-port-8082.ps1
```

This will restart the tunnel pointing to port 8082.




