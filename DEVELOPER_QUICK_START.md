# Developer Quick Start - Testing Setup

## 🚀 Quick Start for Remote Testing

This guide helps you set up the app so both testers (Android in NZ, iPhone in AU) can test simultaneously.

---

## 📋 Prerequisites

Make sure you have:
- ✅ Node.js installed
- ✅ Expo CLI installed (`npm install -g expo-cli`)
- ✅ Internet connection
- ✅ Project code ready

---

## 🎯 Method 1: Expo Go with Tunnel (Recommended for Quick Testing)

This is the **easiest method** - both testers can connect immediately using Expo Go app.

### Step 1: Start the Development Server with Tunnel

Open PowerShell in your project folder and run:

```powershell
npx expo start --tunnel
```

**What happens:**
- Creates a tunnel connection (takes 30-60 seconds)
- Shows a QR code in the terminal
- Shows a connection URL like: `exp://abc123.exp.direct:8081`

### Step 2: Wait for Connection

Wait until you see:
```
Metro waiting on exp://xxxxx.exp.direct:8081
```

### Step 3: Share Connection Info

Copy and send to both testers:
1. **The URL** (e.g., `exp://abc123.exp.direct:8081`)
2. **The QR code** (screenshot or share terminal output)

**Send them this message:**
```
Hi! Here's how to test the app:

1. Install Expo Go from App Store (iPhone) or Play Store (Android)
2. Open Expo Go app
3. Enter this URL: exp://abc123.exp.direct:8081
   (Replace with your actual URL)
4. Tap "Connect"
5. Wait 10-30 seconds for app to load
6. Done! You can now test the app

For Android: You can also scan the QR code
For iPhone: You can paste the URL in Safari browser
```

### Step 4: Keep Terminal Open

**Important:** Keep the terminal window open while testing. If you close it, the connection will break.

### Step 5: Making Updates

When you make code changes:
1. Save the file
2. Both testers' apps will **automatically reload**
3. No need to reconnect!

---

## 🎯 Method 2: EAS Build (More Reliable, Takes Longer)

If tunnel method doesn't work well, create standalone apps for each tester.

### For Android (Samsung - New Zealand):

#### Step 1: Build Android APK

```powershell
eas build --platform android --profile preview
```

**What happens:**
- Builds in the cloud (takes 10-20 minutes)
- Creates an APK file
- Provides a download link

#### Step 2: Share with Android Tester

1. Copy the download link from EAS
2. Send it to the Android tester
3. They download and install the APK
4. **Done!** ✅ They can test without Expo Go

**Instructions for Android tester:**
```
1. Click the download link I sent you
2. Download the APK file
3. Open the downloaded file
4. If asked, allow "Install from unknown sources"
5. Tap "Install"
6. Open the app and test!
```

### For iOS (iPhone 11 - Australia):

#### Step 1: Build iOS App

```powershell
eas build --platform ios --profile preview
```

**What happens:**
- Builds in the cloud (takes 15-30 minutes)
- Creates an IPA file
- Provides a download link

#### Step 2: Share with iOS Tester

**Option A: Direct Download (Requires Apple Developer Account)**
1. Copy the download link from EAS
2. Send it to the iOS tester
3. They download and install via TestFlight or direct install

**Option B: TestFlight (Recommended)**
1. Upload to TestFlight
2. Add tester to TestFlight
3. They install TestFlight app
4. They install your app from TestFlight
5. **Done!** ✅

**Instructions for iOS tester:**
```
1. Install TestFlight from App Store (if not already installed)
2. Accept the TestFlight invitation I sent you
3. Install the TrueScan app from TestFlight
4. Open the app and test!
```

---

## 🔧 First-Time EAS Setup (If Needed)

**Note:** EAS setup is only needed if you want to use Method 2 (standalone apps). For Method 1 (Expo Go), you don't need EAS setup.

If you haven't used EAS before:

### Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

### Step 2: Login to Expo

```powershell
eas login
```

This opens your browser - login with your Expo account (or create one - it's free).

### Step 3: Configure EAS Project

```powershell
eas build:configure
```

This will:
- Create/update the `eas.json` file (already exists in this project)
- Set up your EAS project ID in `app.config.js`

**Important:** After running `eas build:configure`, it will update the `projectId` in `app.config.js`. The current placeholder `'your-project-id-here'` will be replaced with your actual project ID.

---

## 📱 Testing Checklist

### Before Sharing:
- [ ] App runs locally without errors
- [ ] Tunnel is connected (if using Method 1)
- [ ] Connection URL is ready to share
- [ ] Both testers have instructions

### During Testing:
- [ ] Monitor terminal for errors
- [ ] Check that both testers can connect
- [ ] Verify country detection works:
  - Android user sees NZ recycling rules
  - iPhone user sees AU recycling rules
- [ ] Test packaging border colors show correctly

### After Testing:
- [ ] Collect feedback from both testers
- [ ] Note any issues or bugs
- [ ] Update app if needed

---

## 🐛 Troubleshooting

### Problem: Tunnel won't connect

**Solutions:**
1. **Check internet connection** - Tunnel needs stable internet
2. **Try again** - Sometimes it takes a few attempts
3. **Use EAS Build instead** - More reliable for remote testing
4. **Check firewall** - Make sure port 8081 isn't blocked

### Problem: Testers can't connect

**Solutions:**
1. **Verify URL is correct** - Check for typos
2. **Check tunnel is still running** - Keep terminal open
3. **Try new tunnel** - Restart with `npx expo start --tunnel`
4. **Use EAS Build** - More reliable for remote users

### Problem: App won't load for testers

**Solutions:**
1. **Check Metro bundler is running** - Should see "Metro waiting on..."
2. **Check for errors in terminal** - Fix any build errors
3. **Ask testers to try again** - Sometimes takes a few tries
4. **Verify Expo Go is installed** - Both testers need Expo Go

### Problem: Updates don't appear

**Solutions:**
1. **Make sure you saved the file** - Changes only appear after saving
2. **Check hot reload is enabled** - Should be automatic
3. **Ask testers to reload** - They can shake device and tap "Reload"
4. **Restart Metro** - Press `r` in terminal to reload

---

## 📋 Quick Commands Reference

### Start Development Server:
```powershell
# With tunnel (for remote testing)
npx expo start --tunnel

# Local only (for testing on same network)
npx expo start
```

### Build Standalone Apps:
```powershell
# Android APK
eas build --platform android --profile preview

# iOS IPA
eas build --platform ios --profile preview

# Both platforms
eas build --profile preview
```

### Check Build Status:
```powershell
eas build:list
```

---

## 💡 Pro Tips

1. **Use tunnel for quick testing** - Fastest way to get testers connected
2. **Use EAS Build for reliability** - Better for extended testing
3. **Keep terminal open** - Tunnel only works while running
4. **Test locally first** - Make sure app works before sharing
5. **Share clear instructions** - Use the COMPLETE_TESTING_GUIDE.md for testers

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Both testers can connect
- ✅ App loads on both devices
- ✅ Country detection works correctly
- ✅ Packaging recycling shows correct country rules
- ✅ Updates appear automatically when you make changes

---

## 📞 Need Help?

- Check Expo documentation: https://docs.expo.dev
- Check EAS documentation: https://docs.expo.dev/build/introduction/
- Review COMPLETE_TESTING_GUIDE.md for tester instructions

**Happy Testing!** 🎉

