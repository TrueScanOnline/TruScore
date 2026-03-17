# iOS Build 15 – PowerShell Instructions (User Testing / App Store Connect)

**Target:** iPhone 11 user testing  
**Build number:** 15 (incremented from 14)  
**Purpose:** Create new iOS build and submit to App Store Connect for TestFlight / download  

---

## Prerequisites

- **Node.js** (v20 recommended; EAS uses 20.19.4)
- **Yarn** installed (`npm install -g yarn` if needed)
- **EAS CLI** installed: `npm install -g eas-cli`
- **Expo account** logged in: `eas login`
- **Apple Developer** credentials configured for EAS (Apple ID, App Store Connect API key or app-specific password when prompted)

---

## Step 1: Sync ETHICS pillar data (recommended before every build)

Ensures the app bundle includes the latest canonical ETHICS data from `Database files/ETHICS Pillar`:

```powershell
cd C:\TrueScan-FoodScanner
yarn sync-ethics-data
```

---

## Step 2: Optional – Verify iOS bundle exports

Confirms Metro can bundle the app for iOS (no runtime surprises):

```powershell
npx expo export --platform ios
```

If this completes without errors, the build should bundle correctly on EAS.

---

## Step 3: Create the iOS build (EAS)

**For TestFlight / App Store Connect distribution** use the **production** profile (store build):

```powershell
eas build --platform ios --profile production
```

- EAS will build in the cloud and use the **build number 15** and **version 10.0.0** from `app.config.js`.
- When the build finishes, the dashboard will show a link to the **.ipa** and build details.

**Alternative – preview profile** (also produces a store-compatible build; use if you prefer):

```powershell
eas build --platform ios --profile preview
```

---

## Step 4: Submit the build to App Store Connect

After the build completes:

1. Note the **build ID** or **artifact URL** from the EAS build page (or use **latest**).

**Option A – Submit the most recent iOS production build:**

```powershell
eas submit --platform ios --profile production --latest
```

**Option B – Submit a specific build by ID:**

```powershell
eas submit --platform ios --profile production --id <BUILD_ID>
```

- EAS will prompt for Apple credentials if not already stored.
- The build will be uploaded to App Store Connect. `eas.json` has `submit.production.ios.ascAppId: "6755704230"` so the correct app is targeted.

---

## Step 5: After upload to App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight** (or **App Store** for release).
2. Wait for Apple to process the build (usually a few minutes to an hour).
3. For **TestFlight**: add internal/external testers and enable the build for testing.
4. Testers (e.g. iPhone 11) install via the **TestFlight** app or the link you provide.

---

## Quick reference – full sequence (PowerShell)

```powershell
cd C:\TrueScan-FoodScanner
yarn sync-ethics-data
eas build --platform ios --profile production
# When build completes:
eas submit --platform ios --profile production --latest
```

---

## Configuration reference

| Item | Value |
|------|--------|
| **iOS build number** | 15 (`app.config.js` → `expo.ios.buildNumber`) |
| **Version** | 10.0.0 (`app.config.js` → `expo.version`) |
| **Bundle ID** | com.truescan.foodscanner |
| **Min iOS** | 15.1 (iPhone 11 supported) |
| **EAS submit App ID** | 6755704230 (production) |

---

## Troubleshooting

- **“No credentials”** – Run `eas credentials` and configure Apple ID / distribution certificate and provisioning profile for the project.
- **“Build failed”** – Check the EAS build log; common causes: missing env vars, Metro/TypeScript errors, or native module issues.
- **“Submit failed”** – Ensure the build completed successfully and the same EAS project is used; confirm `ascAppId` in `eas.json` matches your app in App Store Connect.
