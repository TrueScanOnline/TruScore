# Onboarding Reset Fix

## Problem
Onboarding keeps getting bypassed because stored data from previous sessions has `hasCompletedOnboarding: true`. Even after development reinstall, AsyncStorage data persists.

## Root Cause
- `FIRST_LAUNCH_KEY` exists (`'false'`) from previous session
- `@truescan_settings` has `hasCompletedOnboarding: true` from previous session
- App correctly reads stored data and skips onboarding (as designed)
- User wants to test fresh install behavior

## Solution Applied

### 1. Enhanced First Launch Detection (`src/store/useSettingsStore.ts`)

**Scenario 1: TRUE First Launch**
- No `FIRST_LAUNCH_KEY` exists (`null`)
- No stored settings exist
- ✅ Shows onboarding

**Scenario 2: First Launch Flag Exists But No Settings**
- `FIRST_LAUNCH_KEY` exists but settings are missing
- This can happen in development when data is partially cleared
- ✅ Clears first launch flag and shows onboarding

**Scenario 3: Both Exist**
- Both `FIRST_LAUNCH_KEY` and settings exist
- ✅ Respects stored `hasCompletedOnboarding` value (as designed)

### 2. Enhanced Reset Functionality (`app/settings.tsx`)

**Settings → About → "Show Onboarding Again"** now:
1. Clears `hasCompletedOnboarding` flag
2. Clears `FIRST_LAUNCH_KEY`
3. **Clears entire `@truescan_settings`**
4. Reinitializes store with defaults
5. Navigates to onboarding

This ensures a completely clean state for testing.

## How to Test Fresh Install

### Option 1: Use Settings (Recommended for Testing)
1. Open app (should be at Scan screen)
2. Go to **Settings → About**
3. Tap **"Show Onboarding Again"**
4. ✅ Onboarding should show immediately
5. Next app launch will also show onboarding (clean state)

### Option 2: Clear All AsyncStorage (Development)
```javascript
// In Expo Dev Tools or React Native Debugger
await AsyncStorage.clear();
// Or clear specific keys:
await AsyncStorage.multiRemove([
  '@truescan_first_launch',
  '@truescan_settings',
  '@truescan_history',
  '@truescan_product_cache'
]);
```

### Option 3: Clear App Data (Production Test)
- **Android**: Settings → Apps → TrueScan → Storage → Clear Data
- **iOS**: Delete and reinstall app

## Expected Console Logs

### True First Launch:
```
[SettingsStore] First launch check: null
[SettingsStore] Stored settings check: null
[SettingsStore] ⭐⭐ TRUE FIRST APP LAUNCH DETECTED (no flag, no settings) - Onboarding will show
[SettingsStore] Set defaults for first launch. hasCompletedOnboarding: false
[RootLayout] Onboarding decision: shouldShow: true
[RootLayout] Rendering navigator with: initialRoute: Onboarding
```

### After Reset via Settings:
```
[Settings] Resetting onboarding - clearing all onboarding data
[Settings] Cleared first launch flag
[Settings] Cleared settings to force fresh start
[Settings] Reinitialized store with defaults
```

### Subsequent Launch (After Onboarding Complete):
```
[SettingsStore] First launch check: false
[SettingsStore] Stored settings check: exists
[SettingsStore] Final merged settings: hasCompletedOnboarding: true
[RootLayout] Onboarding decision: shouldShow: false
[RootLayout] Rendering navigator with: initialRoute: Scan
```

## Testing Checklist

- [ ] Fresh install shows onboarding ✅
- [ ] After completing onboarding, next launch skips onboarding ✅
- [ ] Settings → "Show Onboarding Again" shows onboarding ✅
- [ ] After reset, next launch shows onboarding ✅
- [ ] Onboarding navigation to Scan works correctly ✅

