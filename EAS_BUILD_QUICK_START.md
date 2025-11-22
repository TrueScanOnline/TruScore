# EAS Build - Quick Start Guide (iOS Testing)

## 🎯 What You're Doing

You're creating a **test app** that your tester in Australia can **download and install** on their iPhone. No complicated setup needed on their end.

---

## ⏱️ Timeline

**Total Time: ~15-35 minutes**

- Setup (first time only): 5-10 minutes
- Build process: 10-20 minutes (happens automatically)
- Sharing link: 2 minutes

---

## 📋 Step-by-Step (Simple Version)

### Step 1: Install EAS CLI (5 minutes)

Open PowerShell and run:

```powershell
npm install -g eas-cli
```

This installs the tool that talks to Expo's servers.

**What happens:** Tool gets installed on your computer.

---

### Step 2: Login to Expo (1 minute)

```powershell
eas login
```

**What happens:** 
- Opens your browser
- Login with your Expo account (or create one - it's free)
- Returns to PowerShell when done

---

### Step 3: Configure EAS (2 minutes - ONE TIME ONLY)

```powershell
eas build:configure
```

**What happens:**
- Creates an `eas.json` file in your project
- This tells EAS how to build your app
- You'll be asked a few questions - just press Enter for defaults

**Questions you'll see:**
- Build profile? → Press Enter (default is fine)
- Distribution method? → Press Enter (internal testing is fine)

---

### Step 4: Check/Create eas.json File (1 minute)

Make sure you have an `eas.json` file in your project root. If Step 3 created it, you're good! If not, create it:

**File: `eas.json`** (create in project root if it doesn't exist)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {}
  }
}
```

---

### Step 5: Start the Build (10-20 minutes wait time)

```powershell
eas build --platform ios --profile preview
```

**What happens:**
- Expo uploads your code to their servers
- They build your app in the cloud (you don't need a Mac!)
- Build takes 10-20 minutes
- You'll see progress updates
- **You can close PowerShell** - they'll email you when done (or check status online)

**What you'll see:**
```
✔ Project configured
✔ Starting build
  Platform: ios
  Profile: preview
  Distribution: internal
  
Building...
⏳ This may take a few minutes...

Build #1234 is queued...
Build #1234 is in progress...
Build #1234 is complete! ✅

📱 Download: https://expo.dev/artifacts/xxxxx
```

---

### Step 6: Get the Download Link (2 minutes)

After build completes, you'll get:

1. **A link in PowerShell** - copy it
2. **An email from Expo** - with the download link
3. **Or check online**: Go to https://expo.dev and check "Builds" tab

**The link looks like:**
```
https://expo.dev/artifacts/eas/xxxxx.ipa
```

---

### Step 7: Share with Your Tester (1 minute)

Send them:
1. The download link
2. These instructions:

---

## 📱 Instructions for Your Tester (Send This)

**For iOS Testing:**

1. **Open the link on your iPhone** (not computer)
   - Tap the link you received
   - Or copy/paste into Safari on your iPhone

2. **Download the app**
   - Safari will download the file
   - Tap the download button

3. **Install the app**
   - Go to Settings → General → VPN & Device Management
   - Tap on the developer profile
   - Tap "Trust [Your Name]"
   - Go back and tap the downloaded file
   - Tap "Install"

4. **Done!** The app icon appears on your home screen

**Note:** If they get "Untrusted Developer" error, they need to trust your developer certificate in Settings (step 3 above).

---

## ⚠️ Important: iOS Requirements

For iOS testing, you need one of these:

### Option A: Apple Developer Account ($99/year) - EASIEST
- Allows ad-hoc distribution
- Tester can install directly
- **Best for frequent testing**

### Option B: TestFlight (Free, but requires setup)
- Requires App Store Connect setup
- Tester installs via TestFlight app
- **Good for ongoing beta testing**

### Option C: Development Build (Free, but limited)
- Can only install on devices you register
- Need to add tester's device UDID
- **Good if you know the tester personally**

---

## 🚀 Super Quick Version (If You Have Everything Set Up)

If you've done this before, it's literally just:

```powershell
eas build --platform ios --profile preview
```

Then wait 10-20 minutes and share the link. Done!

---

## 💰 Cost

**EAS Build:**
- **Free tier**: 30 builds per month
- **After that**: $29/month for unlimited builds

**Apple Developer:**
- **$99/year** (needed for iOS distribution)

**Total cost for occasional testing: FREE** (if you stay under 30 builds/month)

---

## ✅ Checklist Before You Start

- [ ] Have Expo account (create at expo.dev if not)
- [ ] Have Apple Developer account OR willing to use TestFlight
- [ ] Project is ready to build (all code is working)
- [ ] Have 15-30 minutes to wait

---

## 🆘 Common Issues

### "No Apple Developer account"
→ Use TestFlight instead (free, but requires App Store Connect setup)

### "Build failed"
→ Check your `eas.json` file is correct
→ Make sure you're logged in: `eas login`
→ Check you have build credits (free: 30/month)

### "Tester can't install"
→ Make sure they trust your developer certificate
→ Check iOS version compatibility
→ Try TestFlight instead (easier)

---

## 📊 Summary

**What it is:** Pre-built app your tester downloads

**How long:** 
- Setup: 5-10 min (one time)
- Build: 10-20 min (each time)
- Share: 2 min

**Cost:** Free (under 30 builds/month)

**Best for:** Testing with remote users who can't connect via tunnel

---

## 🎯 Next Steps

1. Run: `npm install -g eas-cli`
2. Run: `eas login`
3. Run: `eas build:configure`
4. Run: `eas build --platform ios --profile preview`
5. Wait 10-20 minutes
6. Share the download link
7. Done! ✅

**That's it!** Simple and reliable.
