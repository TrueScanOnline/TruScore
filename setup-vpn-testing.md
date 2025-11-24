# VPN Setup for Remote Testing - Tailscale (Easiest!)

## 🎯 Why VPN Works Better

**Problem:** Cloudflare/LocalTunnel give HTTPS URLs, but Expo Go needs `exp://` protocol.

**Solution:** VPN puts both devices on same network, so Expo Go can use `exp://` protocol directly!

---

## ✅ Step-by-Step: Tailscale VPN Setup

### Part 1: You (New Zealand) Setup

#### Step 1: Install Tailscale (2 minutes)
1. Go to: https://tailscale.com/download
2. Download **Windows** version
3. Install it
4. Open Tailscale app

#### Step 2: Create Account (1 minute)
1. Tailscale will open in browser
2. Create free account (Google/Microsoft login or email)
3. Complete setup

#### Step 3: Verify You're Connected
1. Open Tailscale app
2. Should show your computer name
3. Note your Tailscale IP (looks like: `100.x.x.x`)

---

### Part 2: Your Tester (Australia) Setup

**Send them these instructions:**

```
Hi! Let's set up VPN so you can test the app.

Step 1: Install Tailscale
- Go to App Store on your iPhone
- Search "Tailscale"
- Install (free)

Step 2: Sign In
- Open Tailscale app
- I'll send you the login details
- (Or create your own account and share device)

Step 3: Wait for connection
- Once connected, let me know!
```

**Option A: Share Your Account**
- Send them your Tailscale login (email/password)
- They login with same account
- Both devices appear on same network

**Option B: Join Same Network**
- You invite them via email
- They join your Tailscale network
- Both connected

---

### Part 3: Start Expo

**Terminal 1:**
```powershell
npx expo start --lan
```

**You'll see:**
```
Metro waiting on exp://192.168.1.2:8081
```

**BUT** - We need to use your **Tailscale IP** instead!

**Find your Tailscale IP:**
1. Open Tailscale app
2. Find your computer
3. Note the IP (example: `100.64.1.5`)

---

### Part 4: Share Connection with Tester

**Send them:**

```
Hi! Here's how to connect:

1. Make sure Tailscale is running (should show connected)

2. Open Expo Go app

3. Tap "Enter URL manually"

4. Paste this URL:
   exp://[YOUR_TAILSCALE_IP]:8081
   
   Example: exp://100.64.1.5:8081

5. Tap "Connect"

6. Wait for app to load (10-30 seconds)

7. Done!
```

**Replace `[YOUR_TAILSCALE_IP]` with your actual Tailscale IP address!**

---

## 🔧 Alternative: If VPN Too Complicated

If VPN setup is too complicated, just use **EAS Build** - it's simpler:

```powershell
eas build --platform ios --profile preview
```

Then share the download link. No VPN, no tunnel, no protocol issues. Just works.

---

## 💡 Why This Works

**VPN Method:**
- ✅ Both devices on same virtual network
- ✅ Expo Go can use `exp://` protocol directly
- ✅ No protocol conversion needed
- ✅ Works reliably

**EAS Build:**
- ✅ No Expo Go needed
- ✅ No tunnel needed
- ✅ Works from anywhere
- ✅ Just install and run

---

Want help setting up Tailscale VPN now? It's free and takes about 10 minutes!



