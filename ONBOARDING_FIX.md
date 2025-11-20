# Onboarding Fix Applied

## Problem
The app was going directly to the scanner on first launch, skipping onboarding even when `hasCompletedOnboarding` was `false` or not set.

## Root Causes Identified

1. **Deep Linking Interference**: The NavigationContainer's `linking` prop was potentially overriding `initialRouteName` on first launch
2. **Timing Issue**: State wasn't fully initialized before checking onboarding status
3. **Linking Config**: The nested `Scan` screen structure in linking config might have caused routing issues

## Fixes Applied

### 1. Enhanced Initialization Logic (`app/_layout.tsx`)
- Added explicit error handling
- Increased delay to 50ms to ensure Zustand state is fully updated
- Added explicit boolean check: `hasCompleted === true` instead of `!== true`
- Disabled linking when showing onboarding: `linking={showOnboarding ? undefined : linking}`
- Added comprehensive logging for debugging

### 2. Fixed Linking Config (`src/utils/linking.ts`)
- Simplified `Scan` route (removed nested structure)
- Removed problematic `getInitialURL` override

### 3. Enhanced Store Logging (`src/store/useSettingsStore.ts`)
- Added detailed logging at each step of initialization
- Logs raw storage value, parsed value, and merged settings
- Helps identify if stored data is causing issues

### 4. Deep Link Protection
- Deep links are now only processed AFTER onboarding is complete
- Initial deep link check happens only if `!shouldShowOnboarding`

## How to Test

### Test 1: Fresh Install (No Stored Data)
1. Clear app data completely (uninstall/reinstall or clear storage)
2. Launch app
3. **Expected**: Onboarding should show immediately
4. Check console logs for:
   - `[SettingsStore] No stored settings found`
   - `[RootLayout] Onboarding decision: shouldShow: true`
   - `[RootLayout] Rendering navigator with: initialRoute: Onboarding`

### Test 2: After Completing Onboarding
1. Complete onboarding (tap through all slides, tap "Get Started")
2. App should navigate to Scan
3. Close app completely
4. Reopen app
5. **Expected**: Should skip onboarding, go directly to Scan
6. Check console logs for:
   - `[SettingsStore] Final merged settings: hasCompletedOnboarding: true`
   - `[RootLayout] Onboarding decision: shouldShow: false`
   - `[RootLayout] Rendering navigator with: initialRoute: Scan`

### Test 3: Reset via Settings
1. Open app (should be at Scan if onboarding was completed)
2. Go to Settings → About
3. Tap "Show Onboarding Again"
4. **Expected**: Should immediately navigate to Onboarding screen
5. Check console logs for:
   - `[Settings] Resetting onboarding`
   - `[SettingsStore] Setting hasCompletedOnboarding to: false`

## Debugging

If onboarding still doesn't show, check console logs for:

1. **Storage Check**:
   ```
   [SettingsStore] Retrieved from AsyncStorage: {...}
   ```
   - If this shows `hasCompletedOnboarding: true`, the flag is stored
   - Use Settings → About → "Show Onboarding Again" to reset

2. **Decision Check**:
   ```
   [RootLayout] Onboarding decision: {
     hasCompletedOnboarding: ...,
     isTrue: ...,
     shouldShow: ...,
   }
   ```
   - `shouldShow` should be `true` on first launch
   - `isTrue` should be `false` on first launch

3. **Route Check**:
   ```
   [RootLayout] Rendering navigator with: {
     showOnboarding: ...,
     initialRoute: ...,
   }
   ```
   - `initialRoute` should be `"Onboarding"` on first launch
   - `showOnboarding` should be `true` on first launch

## Manual Reset (Development)

If you need to manually clear the onboarding flag:

**Option 1: Use Settings**
- Settings → About → "Show Onboarding Again"

**Option 2: Clear App Data**
- Android: Settings → Apps → TrueScan → Storage → Clear Data
- iOS: Delete and reinstall app

**Option 3: Expo Dev Tools**
- Open Expo Dev Tools
- Run: `AsyncStorage.removeItem('@truescan_settings')`

