# Testing Onboarding

## If onboarding is NOT showing:

The app might have stored `hasCompletedOnboarding: true` from previous testing. To test onboarding:

### Option 1: Use Settings Menu
1. Open app
2. Go to Settings → About
3. Tap "Show Onboarding Again"
4. This sets `hasCompletedOnboarding` to `false` and navigates to onboarding

### Option 2: Clear App Data (Fresh Install)
**Android:**
- Settings → Apps → TrueScan → Storage → Clear Data
- Or: Uninstall and reinstall app

**iOS:**
- Delete app and reinstall

**Expo/Development:**
```bash
# Clear AsyncStorage in development
# The app uses '@truescan_settings' key
```

### Option 3: Check Console Logs
Look for these logs in console:
- `[RootLayout] Starting initialization...`
- `[SettingsStore] Loaded from storage:` - shows what's loaded
- `[RootLayout] Onboarding decision:` - shows the decision
- `[RootLayout] Rendering navigator with:` - shows final route

## Expected Behavior:

1. **First Launch (No stored data)**:
   - `hasCompletedOnboarding` = `false` (default)
   - `showOnboarding` = `true`
   - Shows Onboarding screen

2. **After Completing Onboarding**:
   - `hasCompletedOnboarding` = `true` (saved)
   - Next launch: Skips onboarding, goes to Scan

3. **Reset via Settings**:
   - Sets `hasCompletedOnboarding` = `false`
   - Immediately navigates to Onboarding

