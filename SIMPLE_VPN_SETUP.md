# Simple VPN Setup - Tailscale (10 Minutes)

## 🎯 Why VPN Works

**Problem:** Cloudflare gives HTTPS, but Expo Go needs `exp://` protocol
**Solution:** VPN puts both devices on same network → Expo Go works directly!

---

## ✅ Quick Setup (10 Minutes)

### You (New Zealand) - 5 Minutes

#### Step 1: Install Tailscale
1. Go to: https://tailscale.com/download
2. Download **Windows** version
3. Install it
4. Open Tailscale

#### Step 2: Create Account
1. Click "Sign up" (or use Google/Microsoft login)
2. Create free account
3. Complete setup

#### Step 3: Get Your Tailscale IP
1. Open Tailscale app
2. See your computer name
3. Note the IP address (looks like: `100.x.x.x`)

---

### Your Tester (Australia) - 5 Minutes

**Send them:**

```
Hi! Let's set up VPN so you can test the app.

1. Go to App Store on your iPhone
2. Search "Tailscale"
3. Install (free)
4. Open Tailscale app
5. Sign in with your Google/Microsoft account (or I'll send you login details)
6. Let me know when you're connected!

Once you're connected, I'll send you the connection URL.
```

---

### Then: Start Expo and Connect

**Terminal 1:**
```powershell
npx expo start --lan
```

**Find your Tailscale IP** (from Tailscale app)

**Send tester:**
```
1. Open Expo Go
2. Tap "Enter URL manually"
3. Paste: exp://[YOUR_TAILSCALE_IP]:8081
   (I'll send you the exact IP)
4. Tap "Connect"
5. Done!
```

---

## 🚀 OR: Just Use EAS Build (Easier!)

**If VPN seems complicated, just build the app:**

```powershell
eas build --platform ios --profile preview
```

**Then:**
- Wait 10-20 minutes
- Get download link
- Share with tester
- They install and test
- **NO tunnel, NO VPN, NO protocol issues!**

---

## 💡 Recommendation

**Since Cloudflare isn't working:**
1. **Try VPN (Tailscale)** - 10 minutes setup, then works perfectly
2. **OR use EAS Build** - 20 minutes, then instant testing forever

**Both will actually work!** VPN is better for daily development, EAS Build is better for occasional testing.

---

Want me to walk you through setting up Tailscale VPN now?
