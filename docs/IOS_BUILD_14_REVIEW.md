# iOS Build 14 – Pre-Build Review

**Date:** 2026-03-08  
**Target:** iPhone 11 testing  
**Build Number:** 14 (incremented from 13)  
**Tag/Release:** v10.1.0-ethics-bbfaw-mapping  

---

## Review Summary

| Check | Status | Notes |
|-------|--------|-------|
| **iOS bundle export** | Pass | 1602 modules bundled successfully |
| **JSON imports** | Pass | brandAliasMap.json, i18n locales – Metro handles correctly |
| **No Node-only deps in app** | Pass | better-sqlite3 only in devDependencies (scripts) |
| **Optional deps (graceful)** | Pass | expo-image-manipulator, react-native-view-shot use try/catch |
| **Build config** | Ready | EAS production profile, deploymentTarget 15.1 |
| **iPhone 11 support** | OK | iOS 15.1+ (iPhone 11 supports iOS 13+) |
| **Expo Doctor** | 2 notes | See below – non-blocking |

---

## Applied Changes

### 1. iOS Build Number Increment
- **Before:** `buildNumber: '13'`
- **After:** `buildNumber: '14'`
- **Reason:** Sequential reference for this build (ETHICS BBFAW mapping)

---

## Expo Doctor Findings (Non-Blocking)

### 1. Native project folders vs app.config
If `android/` or `ios/` folders exist, EAS Build may not sync some app.config fields. This project uses a managed workflow (no pre-generated native folders), so this does not affect current builds.

### 2. Expo version
- **Current:** expo@53.0.25  
- **Recommended:** expo@~53.0.27  
- **Action:** Optional patch update: `npx expo install expo@~53.0.27`  
- **Risk:** Low – patch version only

---

## Verified Working

### Bundle & Imports
- `expo export --platform ios` completed successfully
- `brandAliasMap.json` import in `bbfawBrandResolutionService.ts` works (Metro)
- i18n JSON imports (en, es, fr) work

### Optional Dependencies (No Crash if Missing)
- `expo-image-manipulator` – wrapped in try/catch, fallback used
- `react-native-view-shot` – wrapped in try/catch, share card uses fallback

### iOS Configuration
- **Bundle ID:** com.truescan.foodscanner  
- **Deployment target:** 15.1  
- **Build config:** Release  
- **Scheme:** truescan  
- **Associated domains:** applinks:truescan.app  

---

## EAS Build Command

For preview/TestFlight:
```bash
eas build -p ios --profile preview
```

For production/App Store:
```bash
eas build -p ios --profile production
```

---

## Post-Build: iPhone 11 Installation

1. Build completes on EAS
2. Download IPA from EAS dashboard or TestFlight
3. Install via TestFlight (recommended) or direct IPA install
4. Ensure iPhone 11 is on iOS 15.1 or later
