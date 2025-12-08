# Quick Fix Checklist - TrueScan App Production Readiness

## 🔴 CRITICAL - Fix Before Launch

- [ ] **Enable Premium Gating**
  - File: `src/utils/premiumFeatures.ts:120`
  - Change: `ENABLE_PREMIUM_GATING = false` → `true`
  - Impact: Currently all features are free - no revenue possible

- [ ] **Generate iOS Native Build**
  - Command: `npx expo prebuild --platform ios`
  - Impact: Cannot build or deploy iOS app without this

- [ ] **Create Subscription Products in App Store Connect**
  - Product ID: `monthly_premium`
  - Price: **$0.99 USD/month**
  - Product ID: `annual_premium`
  - Price: **$9.99 USD/year** (suggested)
  - Link to Qonversion entitlement: `premium`

- [ ] **Create Subscription Products in Google Play Console**
  - Product ID: `monthly_premium`
  - Price: **$0.99 USD/month**
  - Product ID: `annual_premium`
  - Price: **$9.99 USD/year** (suggested)
  - Link to Qonversion entitlement: `premium`

- [ ] **Add iOS Location Permission**
  - File: `app.config.js:54-58`
  - Add: `NSLocationWhenInUseUsageDescription`
  - Text: "TrueScan uses your location to show local store prices and provide country-specific product information."

- [ ] **Install Sentry for Error Tracking**
  - Command: `yarn add @sentry/react-native`
  - File: `src/services/errorReporting.ts`
  - Uncomment Sentry initialization code
  - Add: `EXPO_PUBLIC_SENTRY_DSN` to `.env`

- [ ] **Fix Android Release Keystore**
  - File: `android/app/build.gradle:113`
  - Generate production keystore (NOT debug key)
  - Store securely (EAS credentials recommended)

- [ ] **Verify Privacy Policy & Terms URLs**
  - URLs: `https://truescan.app/terms` and `https://truescan.app/privacy`
  - Ensure both are live and accessible
  - Add to App Store Connect listing
  - Add to Google Play Console listing

## 🟠 HIGH PRIORITY - Fix Soon

- [ ] **Add More Languages** (Currently only 3: en, es, fr)
  - Priority: German (de), Portuguese (pt), Italian (it), Chinese (zh-CN), Japanese (ja)
  - Files: `src/i18n/locales/*.json`
  - Update: `src/i18n/index.ts`

- [ ] **Implement Offline Mode** (Currently advertised but not implemented)
  - Feature: `PremiumFeature.OFFLINE_MODE`
  - Add: SQLite caching for product data
  - Add: Offline detection and cached results

- [ ] **Request Location Permission During Onboarding**
  - Better UX than requesting during use
  - Explain why location is needed
  - Allow users to skip

- [ ] **Create App Store Screenshots**
  - All required device sizes
  - Compelling visuals
  - Show key features

- [ ] **Write App Store Description**
  - Compelling copy
  - Keywords for ASO
  - Feature highlights

- [ ] **Test Subscription Flow**
  - iOS: TestFlight + Sandbox accounts
  - Android: Internal Testing track
  - Test: Purchase, restore, expiration, premium unlocking

## 🟡 MEDIUM PRIORITY - Post-Launch

- [ ] Add unit tests (Jest)
- [ ] Integrate analytics (Firebase Analytics)
- [ ] Add performance monitoring
- [ ] Improve error recovery
- [ ] Add accessibility features
- [ ] Test deep linking
- [ ] Optimize bundle size
- [ ] Set up beta testing program

## ✅ ALREADY GOOD

- ✅ Payment gateway (Qonversion) integrated
- ✅ Code quality (TypeScript, ESLint, no errors)
- ✅ Error boundaries implemented
- ✅ State management (Zustand)
- ✅ Navigation structure
- ✅ Geo-location support
- ✅ Share functionality
- ✅ Database architecture
- ✅ UI/UX foundation

---

## Quick Commands

```bash
# Enable premium gating
# Edit: src/utils/premiumFeatures.ts:120
# Change: ENABLE_PREMIUM_GATING = true

# Generate iOS build
npx expo prebuild --platform ios

# Install Sentry
yarn add @sentry/react-native

# Test iOS
npx expo run:ios

# Test Android
npx expo run:android

# Build for production
eas build -p android --profile production
eas build -p ios --profile production
```

---

**Status:** ⚠️ **8 Critical Issues** must be fixed before production launch
