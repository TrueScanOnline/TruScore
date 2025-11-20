# TrueScan Food Scanner - Manual Testing Guide

## Overview

This guide provides step-by-step instructions for manual testing of the TrueScan Food Scanner app on real devices (iOS & Android) and end-to-end subscription flow testing.

---

## Pre-Testing Setup

### 1. Build App for Testing

**Android:**
```bash
npm run android
# or
npx expo run:android
```

**iOS:**
```bash
npm run ios
# or
npx expo run:ios
```

### 2. Test Accounts Setup

- Create test accounts for subscription testing
- Have test barcodes ready (food products)
- Ensure device has camera permissions

---

## 1. Device Testing Checklist

### 1.1 iOS Device Testing

#### Test Device Requirements:
- [ ] iOS 13.0 or later
- [ ] Physical device (iPhone/iPad) - Simulator has camera limitations
- [ ] Camera access enabled
- [ ] Internet connection

#### Critical Test Scenarios:

**A. First Launch & Onboarding**
- [ ] App launches correctly
- [ ] Onboarding screens display properly
- [ ] Onboarding can be completed
- [ ] Settings are saved after onboarding

**B. Barcode Scanning**
- [ ] Camera permission requested on first use
- [ ] Camera view displays correctly
- [ ] Can scan barcodes successfully (various formats: EAN-13, UPC-A)
- [ ] Invalid barcodes show error message
- [ ] Manual entry works correctly
- [ ] Camera remounts correctly when returning to scan screen

**C. Product Display**
- [ ] Product results load correctly
- [ ] Trust Score displays correctly (4-quadrant view)
- [ ] Nutrition facts table displays
- [ ] Country of Manufacture displays (if available)
- [ ] All modals open and close correctly
- [ ] Error boundaries catch errors gracefully

**D. Navigation**
- [ ] Tab navigation works smoothly
- [ ] Screen transitions are smooth
- [ ] Back navigation works correctly
- [ ] Deep linking works (if applicable)

**E. Performance**
- [ ] App startup time is acceptable (< 3 seconds)
- [ ] Screen transitions are smooth (no lag)
- [ ] Memory usage is reasonable (check in Xcode Instruments)
- [ ] No memory leaks with repeated scanning

**F. Error Handling**
- [ ] Offline mode works correctly
- [ ] Network errors handled gracefully
- [ ] Error boundaries catch crashes
- [ ] Error recovery works ("Try Again" button)

#### Test Cases:

1. **First-Time User Flow:**
   ```
   1. Install app
   2. Launch app
   3. Complete onboarding
   4. Grant camera permission
   5. Scan a barcode
   6. Verify product displays
   7. Add to favorites
   8. Navigate to history
   9. Navigate to favorites
   10. Remove from favorites
   ```

2. **Repeat User Flow:**
   ```
   1. Launch app (already onboarded)
   2. Scan multiple barcodes rapidly
   3. Navigate between tabs quickly
   4. Test search functionality
   5. Test country submission (duplicate prevention)
   ```

3. **Error Scenarios:**
   ```
   1. Deny camera permission → Verify error message
   2. Scan with no internet → Verify offline mode
   3. Scan invalid barcode → Verify error message
   4. Rapidly switch tabs → Verify no crashes
   ```

### 1.2 Android Device Testing

#### Test Device Requirements:
- [ ] Android 8.0 (API 26) or later
- [ ] Physical device (recommended) or emulator with camera
- [ ] Camera access enabled
- [ ] Internet connection

#### Critical Test Scenarios:

**Same as iOS, plus:**

**A. Android-Specific:**
- [ ] Navigation bar configured correctly
- [ ] Back button works correctly
- [ ] App behaves correctly on app switch
- [ ] Notifications work (if applicable)

**B. Performance:**
- [ ] Memory profiling with Android Studio
- [ ] No ANR (Application Not Responding) errors
- [ ] Smooth animations on lower-end devices

#### Test Cases:

1. **Android Navigation:**
   ```
   1. Test hardware back button
   2. Test navigation bar hiding/showing
   3. Test app state management (background/foreground)
   ```

2. **Android Permissions:**
   ```
   1. Deny camera permission → Verify handling
   2. Grant permission later → Verify works
   3. Revoke permission → Verify error message
   ```

---

## 2. Subscription Flow Testing (End-to-End)

### 2.1 Prerequisites

- [ ] Qonversion account set up
- [ ] Test products configured in Qonversion dashboard
- [ ] Test devices registered (iOS/Android)
- [ ] Test payment methods configured

### 2.2 Subscription Test Scenarios

#### A. Premium Features Access

**Test 1: Free User Limitations**
- [ ] Offline mode is locked (shows premium gate)
- [ ] Advanced search is locked (shows premium gate)
- [ ] Cache limit is smaller (100 products vs 500)

**Test 2: Subscription Purchase**
- [ ] Navigate to Profile → Subscription
- [ ] View available subscription plans
- [ ] Select monthly subscription
- [ ] Complete purchase flow
- [ ] Verify subscription activates immediately
- [ ] Verify premium features unlock
- [ ] Verify subscription status persists after app restart

**Test 3: Subscription Restoration**
- [ ] Logout/login or reinstall app
- [ ] Navigate to Profile → Subscription
- [ ] Tap "Restore Purchases"
- [ ] Verify subscription restores correctly
- [ ] Verify premium features unlock

**Test 4: Subscription Expiration**
- [ ] Let subscription expire (test account)
- [ ] Verify app detects expiration
- [ ] Verify premium features lock again
- [ ] Verify upgrade prompt displays

**Test 5: Trial Period**
- [ ] Start trial subscription
- [ ] Verify trial period detected correctly
- [ ] Use premium features during trial
- [ ] Verify trial expiration handling

#### B. Premium Features Testing

**Offline Mode:**
- [ ] Enable offline mode (premium only)
- [ ] Turn off internet connection
- [ ] Scan barcodes
- [ ] Verify cached products load
- [ ] Verify new scans are queued

**Advanced Search:**
- [ ] Access search screen
- [ ] Open advanced filters (premium only)
- [ ] Apply filters (Trust Score, Eco-Score, etc.)
- [ ] Verify filters work correctly
- [ ] Verify results are filtered properly

**Extended Cache:**
- [ ] Scan >100 products (premium)
- [ ] Verify all products cached
- [ ] Verify cache persists after restart
- [ ] Test cache clearing

### 2.3 Subscription Edge Cases

**Test Cases:**

1. **Purchase Failure:**
   - [ ] Cancel purchase → Verify app handles gracefully
   - [ ] Payment fails → Verify error message
   - [ ] Network error during purchase → Verify retry option

2. **Subscription States:**
   - [ ] Active subscription → Verify features unlocked
   - [ ] Expired subscription → Verify features locked
   - [ ] Trial period → Verify trial status
   - [ ] Grace period → Verify extended access
   - [ ] Billing issue → Verify error message

3. **Cross-Platform:**
   - [ ] Subscribe on iOS → Verify on Android (if applicable)
   - [ ] Subscribe on Android → Verify on iOS (if applicable)

---

## 3. Country of Manufacture Testing

### 3.1 User Submission Flow

**Test Cases:**

1. **New Submission:**
   - [ ] Navigate to product without country
   - [ ] Tap "Help Verify This Country"
   - [ ] Complete Step 1 (instructions)
   - [ ] Tap "Next: Select Country"
   - [ ] Verify modal advances to Step 2
   - [ ] Select country from full list
   - [ ] Verify country is searchable
   - [ ] Submit country
   - [ ] Verify thank you message displays
   - [ ] Verify modal closes
   - [ ] Verify country appears on product page

2. **Duplicate Submission Prevention:**
   - [ ] Submit country for a product
   - [ ] Try to submit again for same product
   - [ ] Verify friendly message: "Thank you for your previous submission, we can only allow one submission from each user."
   - [ ] Verify no error thrown

3. **3-User Verification:**
   - [ ] Submit country from 3 different users (different devices)
   - [ ] Verify country becomes "verified"
   - [ ] Verify confidence badge changes

4. **Modal Functionality:**
   - [ ] Verify full-page modal displays
   - [ ] Verify country list is scrollable
   - [ ] Verify countries are alphabetical
   - [ ] Verify search works in country picker
   - [ ] Verify "Next" button works
   - [ ] Verify "Back" button works
   - [ ] Verify "Cancel" button works

---

## 4. Performance Testing

### 4.1 Memory Testing

**iOS (Xcode Instruments):**
1. Open app in Xcode
2. Run with Instruments → Allocations
3. Perform the following:
   - Scan 20 barcodes
   - Navigate between tabs 50 times
   - Open/close modals 30 times
4. Check for:
   - Memory leaks
   - Excessive memory growth
   - Memory warnings

**Android (Android Studio Profiler):**
1. Open app in Android Studio
2. Run with Profiler → Memory
3. Perform the same actions as iOS
4. Check for:
   - Memory leaks
   - GC pressure
   - Memory warnings

### 4.2 Performance Benchmarks

**Target Metrics:**
- App startup: < 3 seconds
- Screen transition: < 300ms
- Product fetch: < 2 seconds (with cache: < 100ms)
- Search response: < 500ms

**Test:**
- [ ] Measure app startup time
- [ ] Measure screen transition times
- [ ] Measure product fetch times (with/without cache)
- [ ] Measure search response times
- [ ] Verify all metrics meet targets

---

## 5. Error Handling Testing

### 5.1 Error Boundary Testing

**Test Cases:**

1. **Simulate React Error:**
   - [ ] Add `throw new Error('Test')` to a component
   - [ ] Verify Error Boundary catches it
   - [ ] Verify error UI displays
   - [ ] Verify "Try Again" button works

2. **Network Errors:**
   - [ ] Turn off internet
   - [ ] Scan barcode
   - [ ] Verify offline mode message
   - [ ] Verify cached products still load

3. **API Failures:**
   - [ ] Block API calls (network throttling)
   - [ ] Verify fallback sources work
   - [ ] Verify web search fallback works

---

## 6. Critical User Flows

### 6.1 Complete User Journey

**Happy Path:**
```
1. First launch → Onboarding
2. Grant camera permission
3. Scan product barcode
4. View product details
5. Add to favorites
6. Search for another product
7. View search results
8. Select product from search
9. Submit country of manufacture
10. View history
11. View favorites
12. Remove favorite
13. Subscribe to premium
14. Test premium features
15. Restore purchases
```

**Error Path:**
```
1. Launch app
2. Deny camera permission
3. See permission error message
4. Grant permission
5. Scan invalid barcode
6. See error message
7. Scan valid barcode
8. Turn off internet
9. See offline mode message
10. Try to scan → Queue for later
```

---

## 7. Device-Specific Testing

### 7.1 iOS Devices to Test

- [ ] iPhone SE (small screen)
- [ ] iPhone 12/13/14 (standard screen)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (tablet)
- [ ] Older iOS versions (13.0, 14.0, 15.0)

### 7.2 Android Devices to Test

- [ ] Pixel 4/5/6 (standard Android)
- [ ] Samsung Galaxy (One UI)
- [ ] Low-end device (4GB RAM, Android 10+)
- [ ] Tablet (Android)

---

## 8. Regression Testing

### 8.1 Recently Fixed Features

- [ ] Country of Manufacture modal works correctly
- [ ] Translation keys display correctly
- [ ] Modal state management stable
- [ ] Country picker displays full list
- [ ] Duplicate submission prevention works
- [ ] Error messages are user-friendly

### 8.2 Previously Working Features

- [ ] Barcode scanning
- [ ] Product search
- [ ] History management
- [ ] Favorites management
- [ ] Trust Score calculation
- [ ] Offline mode
- [ ] Premium features

---

## 9. Testing Results Template

### Device: [Device Name]
### OS Version: [iOS/Android Version]
### Test Date: [Date]

#### Test Results:

| Test Case | Status | Notes |
|-----------|--------|-------|
| App Launch | ✅/❌ | |
| Onboarding | ✅/❌ | |
| Camera Permission | ✅/❌ | |
| Barcode Scanning | ✅/❌ | |
| Product Display | ✅/❌ | |
| Country Submission | ✅/❌ | |
| Duplicate Prevention | ✅/❌ | |
| Subscription Purchase | ✅/❌ | |
| Premium Features | ✅/❌ | |
| Error Handling | ✅/❌ | |
| Performance | ✅/❌ | |

#### Issues Found:

1. **[Issue Description]**
   - **Severity:** Critical/High/Medium/Low
   - **Steps to Reproduce:** 
   - **Expected:** 
   - **Actual:** 
   - **Screenshots:** 

---

## 10. Automated Testing Recommendations

While manual testing is critical, consider adding:

1. **E2E Tests (Detox/Appium):**
   - Complete user flows
   - Critical paths

2. **Integration Tests:**
   - Product fetching
   - Search functionality
   - State management

3. **Unit Tests:**
   - Trust Score calculation
   - Utility functions
   - Service functions

---

## 11. Test Checklist Summary

### Pre-Release Checklist:

- [ ] Tested on iOS device (real device)
- [ ] Tested on Android device (real device)
- [ ] Tested subscription flow end-to-end
- [ ] Tested Country of Manufacture feature
- [ ] Tested duplicate submission prevention
- [ ] Tested error boundaries
- [ ] Tested offline mode
- [ ] Tested premium features
- [ ] Performance tested (memory, speed)
- [ ] No critical bugs found
- [ ] Error handling works correctly
- [ ] App doesn't crash on edge cases

---

## 12. Known Limitations

1. **Qonversion requires native build:**
   - Subscription features won't work in Expo Go
   - Requires development build or EAS build
   - App gracefully degrades to free mode

2. **Sentry requires native build:**
   - Error reporting won't work in Expo Go
   - Errors still caught by Error Boundaries
   - Console logging works in all builds

---

**Last Updated:** January 2025  
**Next Review:** After Error Boundaries implementation
