# Build Profile Explanation: Preview vs Production

## Current Configuration

- **Android**: `preview` profile → Builds APK for direct installation
- **iOS**: `production` profile → Builds for App Store Connect / TestFlight

## Should They Both Be "Preview" for Testing?

**Short Answer: No - the current configuration is correct!**

### iOS Build Profile

**For TestFlight Testing:**
- ✅ **MUST use `production` profile**
- TestFlight requires App Store distribution certificates
- `production` profile uses App Store distribution provisioning profile
- This is required for TestFlight submission

**If you used `preview` for iOS:**
- ❌ Would use "ad-hoc" or "development" distribution
- ❌ Cannot be submitted to TestFlight
- ❌ Cannot be distributed via App Store Connect
- ✅ Only works for direct device installation (requires device UDID registration)

### Android Build Profile

**For Direct APK Installation:**
- ✅ **Use `preview` profile** (current setup)
- Builds APK file that can be installed directly
- No Google Play Store required
- Perfect for testing

**If you used `production` for Android:**
- ❌ Would build AAB (Android App Bundle) instead of APK
- ❌ AAB cannot be installed directly on devices
- ✅ AAB is only for Google Play Store submission

## Summary

| Platform | Profile | Build Type | Use Case |
|----------|---------|------------|----------|
| **iOS** | `production` | IPA (App Store) | ✅ TestFlight / App Store |
| **iOS** | `preview` | IPA (Ad-hoc) | ❌ Direct install only (needs UDID) |
| **Android** | `preview` | APK | ✅ Direct installation |
| **Android** | `production` | AAB | ❌ Play Store only |

## Your Current Setup is Correct! ✅

- **iOS `production`**: Correct for TestFlight testing
- **Android `preview`**: Correct for APK direct installation

## If You Want iOS for Direct Testing (Not TestFlight)

If you want to test iOS without TestFlight (direct device installation):

1. **You would need to:**
   - Use `preview` profile for iOS
   - Register the tester's iPhone UDID in Apple Developer Portal
   - Build with `preview` profile
   - Install directly via EAS Build download link

2. **But this is NOT recommended because:**
   - Requires UDID registration (complicated)
   - Cannot use TestFlight (easier distribution)
   - Each device needs to be registered manually

## Recommendation

**Keep the current configuration:**
- iOS: `production` → TestFlight (easy distribution, no UDID needed)
- Android: `preview` → APK direct installation

This is the standard setup for cross-platform testing!








