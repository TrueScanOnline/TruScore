# Start EAS Builds - Manual Steps (Do This Now!)

## 🚀 Quick Start - Follow These Steps

Since EAS needs interactive input, follow these steps manually:

---

## Step 1: Configure EAS Project (2 minutes)

Open PowerShell and run:

```powershell
eas build:configure
```

**When it asks:** "Would you like to automatically create an EAS project for @crwmlw/truescan-food-scanner?"

**Type:** `y` and press Enter

**What happens:**
- Creates EAS project
- Updates `app.config.js` with project ID
- You're ready to build!

---

## Step 2: Start Android Build (10-20 minutes)

Open a new PowerShell window and run:

```powershell
eas build --platform android --profile preview
```

**What happens:**
- Build starts in cloud
- You'll see build ID
- Takes 10-20 minutes
- You'll get download link when done

**You can close the terminal** - build continues in cloud!

---

## Step 3: Start iOS Build (15-30 minutes)

Open another PowerShell window and run:

```powershell
eas build --platform ios --profile preview
```

**What happens:**
- Build starts in cloud
- You'll see build ID
- Takes 15-30 minutes
- You'll get download link when done

**You can close the terminal** - build continues in cloud!

---

## Step 4: Check Build Status

Check your builds anytime:

```powershell
eas build:list
```

Or visit: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds

---

## Step 5: Share Download Links

When builds complete, you'll get download links. Share them:

### Android Tester (Samsung - New Zealand):

```
Hi! Your test app is ready:

1. Click: [PASTE ANDROID DOWNLOAD LINK]
2. Download APK file
3. Open downloaded file
4. Allow "Install from unknown sources" if asked
5. Tap Install
6. Open app and test!

App will detect you're in New Zealand automatically.
```

### iPhone Tester (iPhone 11 - Australia):

```
Hi! Your test app is ready:

1. Click: [PASTE iOS DOWNLOAD LINK]
2. Download and install
3. Open app and test!

App will detect you're in Australia automatically.

If you see security warning:
Settings → General → VPN & Device Management → Trust developer
```

---

## ✅ That's It!

Once you run these 3 commands, your builds will start and you'll get download links when ready!

**Commands to run:**
1. `eas build:configure` (type `y` when asked)
2. `eas build --platform android --profile preview`
3. `eas build --platform ios --profile preview`

**Happy Building!** 🚀

