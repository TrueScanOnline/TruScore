# Build 12 Fix Summary

## Problem
When building iOS production build, EAS was using build number 11 instead of 12 because:
- `eas.json` had `"appVersionSource": "remote"` which told EAS to get build numbers from App Store Connect
- App Store Connect currently shows build 11
- Even though `app.config.js` had `buildNumber: '12'`, it was being ignored

## Solution
**Removed `"appVersionSource": "remote"`** from `eas.json`
- This allows EAS to use the buildNumber from `app.config.js` instead of fetching from App Store Connect
- `app.config.js` has `buildNumber: '12'` which will now be used

**Note:** `buildNumber` cannot be set directly in `eas.json` build profiles - it must come from `app.config.js`

## Changes Made
- **File:** `eas.json`
  - Removed: `"cli": { "appVersionSource": "remote" }`
  
- **File:** `app.config.js`
  - Already has: `buildNumber: '12'` in `ios` configuration (this will now be used)

## Next Steps
1. Build again with: `npx eas build --platform ios --profile production`
2. The build should now show build number 12 (from app.config.js)
3. Submit to App Store Connect: `eas submit --platform ios --latest`

## Verification
After building, verify the build number is 12:
- Check the build log output
- The build should show: `Build number: 12` (not 11)
- You should NOT see the warning about "ios.buildNumber field in app config is ignored"
