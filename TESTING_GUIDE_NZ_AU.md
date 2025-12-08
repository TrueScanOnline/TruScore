# TrueScan App - Testing Guide for NZ & AU Testers
**Date:** December 2024  
**Platforms:** Android (Samsung - NZ) & iOS (iPhone 11 - AU)

---

## 🎯 Testing Overview

This guide provides step-by-step instructions for testing the TrueScan Food Scanner app on both Android and iOS platforms.

**Testers:**
- **User 1 (NZ):** Samsung Android phone
- **User 2 (AU):** iPhone 11

**Current Status:**
- ✅ Android build ready
- ✅ iOS build ready (via EAS Build)
- ✅ Premium features disabled (for testing)
- ✅ Location permissions configured
- ✅ Error tracking ready (Sentry - optional)

---

## 📱 BUILDING THE APP

### For Android (Samsung - NZ)

#### Option 1: EAS Build (Recommended - Cloud Build)
```bash
# Build Android APK for testing
eas build -p android --profile preview

# Or build AAB for Play Store
eas build -p android --profile production
```

**After build completes:**
1. Download APK from EAS dashboard
2. Transfer to Samsung phone
3. Enable "Install from Unknown Sources" in phone settings
4. Install APK

#### Option 2: Local Build (Requires Android Studio)
```bash
# Generate native Android code (already done)
# Build APK
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### For iOS (iPhone 11 - AU)

#### EAS Build (Required - iOS requires macOS/Xcode)
```bash
# Build iOS app for testing
eas build -p ios --profile preview

# Or build for App Store
eas build -p ios --profile production
```

**After build completes:**
1. Download IPA from EAS dashboard
2. Install via TestFlight (recommended) or direct install
3. For TestFlight: Upload to App Store Connect, add tester

#### TestFlight Setup (Recommended)
1. Build with EAS: `eas build -p ios --profile production`
2. Upload to App Store Connect
3. Add User 2 (AU) as internal tester
4. User 2 receives TestFlight invite
5. Install TestFlight app on iPhone 11
6. Accept invite and install TrueScan

---

## 🧪 TESTING CHECKLIST

### Core Functionality Tests

#### 1. App Launch & Onboarding
- [ ] App launches without crashes
- [ ] Onboarding screens display correctly
- [ ] Can skip/complete onboarding
- [ ] App remembers onboarding completion

#### 2. Camera Scanning
- [ ] Camera permission requested (first time)
- [ ] Camera opens when tapping scan button
- [ ] Can scan barcode successfully
- [ ] Barcode detection works in various lighting
- [ ] Camera focuses correctly
- [ ] Can cancel/close camera

**Test Barcodes:**
- Use real product barcodes from local stores
- Test with different barcode formats (EAN-13, UPC-A)
- Test in different lighting conditions

#### 3. Product Results Screen
- [ ] Product information displays after scan
- [ ] TruScore displays correctly
- [ ] All cards load (Nutrition, Ingredients, etc.)
- [ ] Images load (if available)
- [ ] No crashes when scrolling
- [ ] Share functionality works

**Key Screens to Test:**
- Product name and image
- TruScore card
- Nutrition Facts card
- Ingredients card
- Country of Manufacture
- Palm Oil status
- Allergens & Additives
- Pricing card (location-based)

#### 4. Location-Based Features (NZ & AU Specific)

**For NZ Tester:**
- [ ] Location permission requested
- [ ] Local store prices display (NZ stores)
- [ ] Currency shows as NZD
- [ ] Country-specific data loads

**For AU Tester:**
- [ ] Location permission requested
- [ ] Local store prices display (AU stores)
- [ ] Currency shows as AUD
- [ ] Country-specific data loads

**Test Scenarios:**
1. Grant location permission → Check pricing shows
2. Deny location permission → Check app handles gracefully
3. Test in different locations (home, store, etc.)

#### 5. Share Functionality
- [ ] Share icons visible on cards
- [ ] Share modal opens
- [ ] Can add custom message
- [ ] Share content looks correct
- [ ] Can share to different apps (WhatsApp, SMS, Email, etc.)
- [ ] Deep links work from shared content

**Test Sharing:**
- Share TruScore
- Share Nutrition Facts
- Share Ingredients
- Share with custom message
- Test sharing to different platforms

#### 6. Search Functionality
- [ ] Search bar works
- [ ] Can search by product name
- [ ] Search results display
- [ ] Can select product from results
- [ ] Search is fast and responsive

#### 7. History & Favorites
- [ ] Scanned products appear in History
- [ ] Can favorite a product
- [ ] Favorites list works
- [ ] Can remove from favorites
- [ ] History persists after app restart

#### 8. Settings & Profile
- [ ] Settings screen accessible
- [ ] Can change preferences
- [ ] Dark mode works (if available)
- [ ] Profile information displays
- [ ] Subscription status shows (should show "Free" during testing)

#### 9. Navigation
- [ ] Bottom tabs work
- [ ] Can navigate between screens
- [ ] Back button works
- [ ] Deep links work (if testing)
- [ ] No navigation crashes

#### 10. Error Handling
- [ ] App handles no internet gracefully
- [ ] Error messages are user-friendly
- [ ] App doesn't crash on invalid barcodes
- [ ] Loading states display correctly
- [ ] Can retry failed operations

---

## 🐛 BUG REPORTING

### When Reporting Issues, Include:

1. **Device Information:**
   - Device model (e.g., "Samsung Galaxy S21" or "iPhone 11")
   - OS version (e.g., "Android 13" or "iOS 17.2")
   - App version (check in Settings)

2. **Steps to Reproduce:**
   - What were you doing?
   - What happened?
   - What did you expect?

3. **Screenshots/Videos:**
   - Screenshot of error
   - Video of issue (if possible)

4. **Additional Info:**
   - Time of day
   - Internet connection (WiFi/Mobile)
   - Location (if relevant)
   - Barcode scanned (if relevant)

### Report Format:
```
**Device:** [Your device]
**OS:** [Android/iOS version]
**Issue:** [Brief description]
**Steps:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshots:** [Attach if available]
```

---

## 🔍 SPECIFIC TEST SCENARIOS

### Scenario 1: First-Time User Flow
1. Install app
2. Complete onboarding
3. Grant camera permission
4. Grant location permission (if prompted)
5. Scan first barcode
6. Review product information
7. Share product to social media
8. Add to favorites

### Scenario 2: Daily Usage
1. Open app
2. Scan multiple products in a row
3. Check history
4. Search for a product
5. View favorites
6. Change settings

### Scenario 3: Offline Testing
1. Turn off WiFi/Mobile data
2. Try to scan barcode
3. Check error handling
4. Turn internet back on
5. Retry scan

### Scenario 4: Location Testing (NZ)
1. Open app in different locations
2. Check pricing updates
3. Verify currency (NZD)
4. Check store names (should be NZ stores)

### Scenario 5: Location Testing (AU)
1. Open app in different locations
2. Check pricing updates
3. Verify currency (AUD)
4. Check store names (should be AU stores)

### Scenario 6: Share Testing
1. Scan product
2. Share from different cards
3. Add custom message
4. Share to different apps
5. Test deep link from shared content

---

## 📊 PERFORMANCE TESTING

### Check These Metrics:
- [ ] App launch time (< 3 seconds)
- [ ] Camera open time (< 2 seconds)
- [ ] Barcode scan time (< 5 seconds)
- [ ] Product load time (< 3 seconds)
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks (use app for 30+ minutes)
- [ ] Battery usage (reasonable)

### Stress Tests:
- [ ] Scan 20+ products in a row
- [ ] Use app for 1+ hour continuously
- [ ] Switch between apps frequently
- [ ] Test with slow internet connection
- [ ] Test with no internet connection

---

## 🌍 COUNTRY-SPECIFIC TESTING

### New Zealand (User 1 - Android)
**Expected Behavior:**
- Currency: NZD ($)
- Store names: Countdown, New World, Pak'nSave, etc.
- Location: New Zealand
- Date format: DD/MM/YYYY

**Test Products:**
- Scan local NZ products
- Check if NZ-specific data appears
- Verify pricing in NZD

### Australia (User 2 - iOS)
**Expected Behavior:**
- Currency: AUD ($)
- Store names: Coles, Woolworths, IGA, etc.
- Location: Australia
- Date format: DD/MM/YYYY

**Test Products:**
- Scan local AU products
- Check if AU-specific data appears
- Verify pricing in AUD

---

## ✅ PRE-LAUNCH CHECKLIST

### Before Final Testing:
- [ ] App builds successfully for both platforms
- [ ] All permissions configured
- [ ] Location services work
- [ ] Camera works
- [ ] No critical crashes
- [ ] Error handling works
- [ ] Share functionality works
- [ ] Deep linking works (if applicable)

### Before Production:
- [ ] All bugs fixed
- [ ] Performance acceptable
- [ ] User experience smooth
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] App Store screenshots ready
- [ ] App descriptions written
- [ ] Premium gating enabled (after testing)

---

## 🚨 KNOWN ISSUES / LIMITATIONS

### During Testing Phase:
1. **Premium Features:** All features are currently free (premium gating disabled for testing)
2. **Sentry:** Error tracking may not be fully configured (optional for testing)
3. **Pricing:** Some countries may have limited pricing data

### Expected Behavior:
- App should work offline (with cached data)
- Location permission is optional (some features may be limited)
- Some products may not have complete data

---

## 📞 SUPPORT & CONTACT

### If You Encounter Issues:
1. Check this guide first
2. Try restarting the app
3. Check internet connection
4. Report issue with details (see Bug Reporting section)

### Testing Schedule:
- **Week 1:** Core functionality testing
- **Week 2:** Edge cases and stress testing
- **Week 3:** Final polish and bug fixes

---

## 🎉 TESTING COMPLETE

Once testing is complete:
1. Report all findings
2. Confirm app is ready for production
3. Enable premium gating (if approved)
4. Submit to App Store / Play Store

---

**Last Updated:** December 2024  
**App Version:** 1.0.0  
**Testing Phase:** Pre-Production
