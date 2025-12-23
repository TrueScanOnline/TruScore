# Build Commands for TrueScan App Testing Phase

## Prerequisites
- EAS CLI installed: `npm install -g eas-cli`
- Logged into EAS: `eas login`
- All environment variables configured in EAS Secrets
- iOS: Valid Apple Developer account and certificates
- Android: Signing key configured in EAS

## iOS Production Build (App Store / TestFlight)

**Build Profile:** `production`  
**Build Number:** 12  
**Distribution:** store

```powershell
# Start iOS production build
eas build --platform ios --profile production
```

**Notes:**
- This will create a production build suitable for App Store Connect
- Build will be configured as Release mode
- Build number 12 will be used
- You can submit directly to App Store Connect after build completes

## Android APK Build (Direct Download)

**Build Profile:** `production-apk`  
**Version Code:** 8  
**Distribution:** internal  
**Build Type:** APK (downloadable file)

```powershell
# Start Android APK build
eas build --platform android --profile production-apk
```

**Notes:**
- This creates an APK file that can be downloaded and installed directly on Android devices
- APK will be available for download from EAS Build dashboard after completion
- Version code 8 will be used
- Users can install by enabling "Install from unknown sources" and downloading the APK

## Build Both Platforms Sequentially

```powershell
# Build iOS first
eas build --platform ios --profile production

# After iOS build completes, build Android
eas build --platform android --profile production-apk
```

## Build Status and Download

After starting a build, you can:

1. **Monitor build progress:**
   ```powershell
   eas build:list
   ```

2. **View build details:**
   - Visit: https://expo.dev/accounts/[your-account]/projects/truescan-food-scanner/builds

3. **Download builds:**
   - iOS: Download from EAS Build dashboard or TestFlight
   - Android APK: Download link provided in build completion email and dashboard

## Build Configuration Summary

### iOS Build
- **Platform:** iOS
- **Profile:** production
- **Build Number:** 12
- **Bundle ID:** com.truescan.foodscanner
- **Deployment Target:** iOS 15.1+
- **Configuration:** Release

### Android Build
- **Platform:** Android
- **Profile:** production-apk
- **Version Code:** 8
- **Package:** com.truescan.foodscanner
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 35 (Android 15)
- **Build Type:** APK

## Troubleshooting

If builds fail:

1. **Check build logs:**
   ```powershell
   eas build:view [build-id]
   ```

2. **Verify credentials:**
   ```powershell
   eas credentials
   ```

3. **Check environment variables:**
   ```powershell
   eas secret:list
   ```

4. **Verify project configuration:**
   ```powershell
   npx expo-doctor
   npx tsc --noEmit
   ```

## Next Steps After Build

### iOS
1. Build completes → Download IPA
2. Submit to App Store Connect (if needed)
3. Distribute via TestFlight for testing
4. Submit for App Store review when ready

### Android
1. Build completes → Download APK
2. Distribute APK to testers
3. Testers install APK directly on their devices
4. For Play Store release, use `production` profile (creates AAB)
