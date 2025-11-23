# Simple Tunnel Setup - ngrok with Auth Token

## 🎯 The Solution

**Get a FREE ngrok auth token** - this makes Expo tunnel mode reliable!

**Without auth token:** Tunnel times out ❌
**With auth token:** Tunnel works reliably ✅

---

## ✅ Setup (5 Minutes - One Time)

### Step 1: Sign Up for ngrok (Free) - 2 Minutes

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up with email (free, no credit card needed)
3. Complete registration

### Step 2: Get Your Auth Token - 1 Minute

1. After signing up, you'll be at the dashboard
2. Click "Your Authtoken" in the left menu
3. Copy your auth token (looks like: `2abc123def456ghi789...`)

### Step 3: Download ngrok - 1 Minute

1. Go to: https://ngrok.com/download
2. Download **Windows** version
3. Extract `ngrok.exe` to your project folder (`C:\TrueScan-FoodScanner`)

### Step 4: Set Auth Token - 1 Minute

**PowerShell:**
```powershell
cd C:\TrueScan-FoodScanner
.\ngrok.exe authtoken YOUR_AUTH_TOKEN_HERE
```

Replace `YOUR_AUTH_TOKEN_HERE` with the token you copied.

**You'll see:**
```
Authtoken saved to configuration file: C:\Users\...\ngrok.yml
```

✅ Done! Now Expo tunnel will work reliably!

---

## 🚀 Daily Use (30 Seconds)

### Step 1: Start Expo with Tunnel
```powershell
npx expo start --tunnel
```

**Now it should work!** You'll see:
```
Metro waiting on exp://xxxxx.exp.direct:443
```

### Step 2: Share URL with Tester

**Send them:**
```
Hi! Here's how to connect:

1. Open Expo Go app on your iPhone

2. Tap "Enter URL manually" (or look for text input)

3. Paste this URL:
   exp://xxxxx.exp.direct:443
   
   (Use the exact URL from my terminal)

4. Tap "Connect"

5. Wait for app to load (10-30 seconds)

Done! You'll see TrueScan app!
```

---

## 🔧 If Expo Tunnel Still Times Out

Even with auth token, sometimes ngrok needs a retry. Try:

**Method 1: Try 2-3 Times**
```powershell
# First attempt
npx expo start --tunnel

# If it fails, wait 30 seconds, then:
npx expo start --tunnel

# Usually works on 2nd or 3rd try
```

**Method 2: Use Specific Port**
```powershell
npx expo start --tunnel --port 8081
```

**Method 3: Clear Cache First**
```powershell
npx expo start --tunnel -c
```

---

## 📋 Complete Setup Checklist

- [ ] Sign up for ngrok: https://dashboard.ngrok.com/signup
- [ ] Get auth token from dashboard
- [ ] Download ngrok.exe
- [ ] Place ngrok.exe in project folder
- [ ] Run: `.\ngrok.exe authtoken YOUR_TOKEN`
- [ ] Test: `npx expo start --tunnel`
- [ ] Get exp:// URL
- [ ] Share with tester

---

## 💡 Why This Works

**Without auth token:**
- ngrok free tier is very limited
- Tunnel times out frequently
- Unreliable for remote testing

**With auth token:**
- Higher rate limits
- More reliable connection
- Tunnel stays connected
- Actually works for remote testing! ✅

---

## 🎯 Next Steps

1. **Sign up for ngrok** (free, 2 minutes)
2. **Get auth token** (1 minute)
3. **Download and configure ngrok** (2 minutes)
4. **Start Expo tunnel** - should work now!
5. **Share exp:// URL** with tester

**Total time: 5 minutes setup, then works every time!**

---

Want me to help you set this up now? It's the best solution without VPN or EAS Build!
