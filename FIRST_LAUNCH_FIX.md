# First Launch Onboarding Fix

## Problem
Onboarding was not showing on first app launch because stored data persisted from previous testing sessions with `hasCompletedOnboarding: true`.

## Solution
Added **first launch detection** to ensure onboarding shows on the very first app launch, regardless of stored settings.

## Changes Made

### 1. First Launch Detection (`src/store/useSettingsStore.ts`)
- Added `FIRST_LAUNCH_KEY = '@truescan_first_launch'` to track if app has ever been launched
- On first launch (when key is `null`):
  - Immediately sets defaults (ensuring `hasCompletedOnboarding: false`)
  - Marks first launch as complete
  - **Exits early** - onboarding will show

### 2. Enhanced Validation
- Only trusts `hasCompletedOnboarding` if it's explicitly stored AND is a boolean
- If missing or invalid, defaults to `false` (show onboarding)

### 3. Settings "Show Onboarding Again"
- Now also clears the first launch flag for testing purposes
- Allows re-testing first launch behavior

## How It Works

### First App Launch (Fresh Install)
1. `FIRST_LAUNCH_KEY` is `null` (not in AsyncStorage)
2. Log: `⭐ FIRST APP LAUNCH DETECTED - Onboarding will show`
3. Sets defaults: `hasCompletedOnboarding: false`
4. Marks first launch as complete
5. **Onboarding shows** ✅

### Subsequent Launches (After Onboarding Complete)
1. `FIRST_LAUNCH_KEY` exists
2. Loads stored settings
3. If `hasCompletedOnboarding: true` → Skip onboarding ✅
4. If `hasCompletedOnboarding: false` → Show onboarding ✅

### Testing First Launch Again
1. Settings → About → "Show Onboarding Again"
2. Clears `hasCompletedOnboarding` flag
3. **Also clears** `FIRST_LAUNCH_KEY` 
4. Next launch will be treated as first launch

## Console Logs to Watch

### First Launch:
```
[SettingsStore] First launch check: null
[SettingsStore] ⭐ FIRST APP LAUNCH DETECTED - Onboarding will show
[SettingsStore] Set defaults for first launch. hasCompletedOnboarding: false
[RootLayout] Onboarding decision: shouldShow: true
[RootLayout] Rendering navigator with: initialRoute: Onboarding
```

### Subsequent Launch (After Onboarding):
```
[SettingsStore] First launch check: false
[SettingsStore] Retrieved from AsyncStorage: {"hasCompletedOnboarding":true,...}
[RootLayout] Onboarding decision: shouldShow: false
[RootLayout] Rendering navigator with: initialRoute: Scan
```

## Testing Fresh Install

To test first launch behavior:

**Option 1: Clear App Data**
- Android: Settings → Apps → TrueScan → Storage → Clear Data
- iOS: Delete and reinstall app
- This clears ALL AsyncStorage including `FIRST_LAUNCH_KEY`

**Option 2: Use Settings**
- Settings → About → "Show Onboarding Again"
- This clears both `hasCompletedOnboarding` and `FIRST_LAUNCH_KEY`
- Next launch will be treated as first launch

**Option 3: Manual AsyncStorage Clear (Development)**
```javascript
// In Expo Dev Tools or React Native Debugger
AsyncStorage.removeItem('@truescan_first_launch');
AsyncStorage.removeItem('@truescan_settings');
```

## Expected Behavior

✅ **First launch**: Onboarding shows  
✅ **After completing onboarding**: Next launch skips onboarding  
✅ **Reset via Settings**: Shows onboarding again  
✅ **Subsequent launches**: Skips onboarding if completed

