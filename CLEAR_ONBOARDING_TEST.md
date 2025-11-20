# How to Test Onboarding

## To Test Fresh Install (Onboarding Should Show):

1. **Clear App Data** (for fresh install test):
   - Android: Settings → Apps → TrueScan → Clear Data
   - iOS: Delete and reinstall app
   - Or: Use Settings → About → "Show Onboarding Again"

2. **Check Console Logs**:
   - Look for `[SettingsStore]` logs to see what's loaded
   - Look for `[RootLayout] Onboarding check` to see the decision

## Expected Behavior:

1. **First Launch**: 
   - `hasCompletedOnboarding` should be `false` (default)
   - `showOnboarding` should be `true`
   - Onboarding screen should appear

2. **After Completing Onboarding**:
   - `hasCompletedOnboarding` set to `true`
   - Navigates to Scan screen
   - Next launch: Skip onboarding

3. **Reset via Settings**:
   - Settings → About → "Show Onboarding Again"
   - Sets `hasCompletedOnboarding` to `false`
   - Navigates to Onboarding immediately

