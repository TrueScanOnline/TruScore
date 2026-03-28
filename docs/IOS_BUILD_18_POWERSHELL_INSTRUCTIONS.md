# iOS Build – PowerShell Instructions (User Testing / App Store Connect)

**Target:** iPhone 11 user testing (device supports iOS through current releases; app **minimum iOS 15.1** via `expo-build-properties`)  
**Build number:** See **`expo.ios.buildNumber`** in `app.config.js` (this doc last aligned with **build 21**)  
**Purpose:** Create a new iOS build and submit to App Store Connect for TestFlight / download  

---

## Prerequisites

- **Node.js** (v20 recommended; EAS uses **20.19.4** per `eas.json`)
- **npm** or **yarn** (project uses `npm run`; `yarn sync-ethics-data` works if yarn is installed)
- **EAS CLI** installed: `npm install -g eas-cli`
- **Expo account** logged in: `eas login`
- **Apple Developer** credentials configured for EAS (Apple ID, App Store Connect API key or app-specific password when prompted)

---

## Step 1: Sync ETHICS pillar data (recommended before every build)

Ensures the app bundle includes the latest BBFAW / KTC / ethics JSON from `Database files/ETHICS Pillar`:

```powershell
cd C:\TrueScan-FoodScanner
npm run sync-ethics-data
```

---

## Step 2: Optional – Verify iOS bundle exports

Confirms Metro can bundle the app for iOS:

```powershell
npx expo export --platform ios
```

If this completes without errors, the project should bundle correctly on EAS.

---

## Step 3: Create the iOS build (EAS)

For **TestFlight / App Store Connect**, the repo’s **`package.json`** script uses the **`preview`** profile (store distribution, Release):

```powershell
npm run build:ios
```

Equivalent:

```powershell
eas build --platform ios --profile preview
```

**Alternative – `production` profile** (also store distribution in `eas.json`):

```powershell
eas build --platform ios --profile production
```

- EAS uses **`expo.ios.buildNumber`** and **`expo.version`** from `app.config.js`.
- When the build finishes, the [EAS dashboard](https://expo.dev) shows the **.ipa** and build details.

---

## Step 4: Submit the build to App Store Connect

After the build completes:

**Option A – Submit the most recent iOS build** (use the **same profile** you built with, e.g. `preview`):

```powershell
eas submit --platform ios --profile preview --latest
```

If you used **`production`** for the build:

```powershell
eas submit --platform ios --profile production --latest
```

**Option B – Submit a specific build by ID:**

```powershell
eas submit --platform ios --profile preview --id <BUILD_ID>
```

- EAS may prompt for Apple credentials if not already stored.
- Upload goes to App Store Connect (`ascAppId: 6755704230` in `eas.json` for both `submit.preview` and `submit.production`).

---

## Step 5: After upload to App Store Connect

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app → **TestFlight**.
2. Wait for Apple to process the build (often minutes to ~1 hour).
3. Add internal/external testers and enable the build for testing.
4. Testers (**e.g. iPhone 11**) install via the **TestFlight** app or your invitation link.

---

## Quick reference – full sequence (PowerShell)

Use **semicolons** between commands on one line if needed (PowerShell 5.x):

```powershell
cd C:\TrueScan-FoodScanner
npm run sync-ethics-data
npm run build:ios
# When the EAS build finishes successfully:
eas submit --platform ios --profile preview --latest
```

---

## Configuration reference

| Item | Value |
|------|--------|
| **iOS build number** | **`app.config.js` → `expo.ios.buildNumber`** (e.g. **21**) |
| **Marketing version** | 10.0.0 (`app.config.js` → `expo.version`) |
| **Bundle ID** | `com.truescan.foodscanner` |
| **Min iOS deployment** | 15.1 (`expo-build-properties` in `app.config.js`) — **iPhone 11 OK** |
| **EAS submit App ID** | `6755704230` (`eas.json` → `submit.preview` / `submit.production` → `ios.ascAppId`) |
| **Encryption (export compliance)** | `ITSAppUsesNonExemptEncryption: false` in `infoPlist` |

---

## Troubleshooting

- **“No credentials”** – Run `eas credentials` and set up Apple distribution certificate and App Store provisioning profile.
- **Build failed** – Open the log on expo.dev; missing env vars, TypeScript errors, or native plugins are common causes.
- **Submit failed** – Confirm the iOS build succeeded; verify `ascAppId` matches the app in App Store Connect.
- **SDK / Xcode warnings from Apple** – If Apple emails about required Xcode/iOS SDK versions for submission, update local/Xcode constraints on EAS per Expo’s current docs before your deadline.
