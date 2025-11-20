# Qonversion Subscription Setup Guide

## Quick Start

### 1. Create Qonversion Account

1. Go to https://dashboard.qonversion.io/
2. Sign up for a free account (Free tier: $10,000 MRR/month)
3. Create a new project for TrueScan

### 2. Get API Keys

1. In Qonversion Dashboard, go to **Settings** → **API Keys**
2. Copy your **iOS API Key**
3. Copy your **Android API Key**

### 3. Set Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_QONVERSION_IOS_KEY=your_ios_api_key_here
EXPO_PUBLIC_QONVERSION_ANDROID_KEY=your_android_api_key_here
```

**Note:** For production, set these as environment variables in your CI/CD pipeline or build system.

### 4. Configure Products in App Stores

#### Apple App Store Connect:
1. Go to App Store Connect → Your App → **In-App Purchases**
2. Create subscription products:
   - **Monthly Premium**: `monthly_premium` (Product ID)
   - **Annual Premium**: `annual_premium` (Product ID)
3. Set prices (suggested: $4.99/month, $39.99/year)
4. Configure subscription details (name, description, etc.)
5. Add 7-day free trial (optional, recommended)

#### Google Play Console:
1. Go to Google Play Console → Your App → **Monetization** → **Subscriptions**
2. Create subscription products:
   - **Monthly Premium**: Same Product ID as iOS (`monthly_premium`)
   - **Annual Premium**: Same Product ID as iOS (`annual_premium`)
3. Set prices (suggested: $4.99/month, $39.99/year)
4. Configure subscription details
5. Add 7-day free trial (optional, recommended)

### 5. Configure Products in Qonversion

1. In Qonversion Dashboard, go to **Products**
2. Create **Premium** entitlement (ID: `premium`)
3. Create products:
   - **Monthly Premium**: 
     - Store ID: `monthly_premium` (matches App Store/Play Store)
     - Attach to `premium` entitlement
   - **Annual Premium**:
     - Store ID: `annual_premium` (matches App Store/Play Store)
     - Attach to `premium` entitlement

### 6. Build & Test

1. Run: `yarn android` or `yarn ios`
2. Test in sandbox:
   - iOS: Use TestFlight + Sandbox accounts
   - Android: Use Internal Testing track

### 7. Test Subscription Flow

1. Open app → Profile → Upgrade to Premium
2. Select subscription plan (Monthly or Annual)
3. Complete purchase with sandbox account
4. Verify premium features are unlocked
5. Test restore purchases (Settings → Restore Purchases)

---

## Premium Features

All premium features are gated using the `PremiumGate` component:

```typescript
import PremiumGate from '../src/components/PremiumGate';
import { PremiumFeature } from '../src/utils/premiumFeatures';

<PremiumGate feature={PremiumFeature.ADVANCED_SEARCH}>
  {/* Premium content */}
</PremiumGate>
```

### Available Premium Features:

1. **OFFLINE_MODE**: Access cached product data offline
2. **ADVANCED_SEARCH**: Advanced filtering and search options
3. **AD_FREE**: Remove advertisements
4. **PRICING_TRENDS**: Historical pricing data and trends
5. **ADDITIONAL_PRODUCT_INFO**: Extended product details
6. **PRODUCT_FILTERS**: Advanced filtering options
7. **BETTER_TRUST_SCORE**: Detailed trust score breakdown

---

## Subscription Store Usage

```typescript
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { isPremium as checkPremium } from '../src/utils/premiumFeatures';

const { subscriptionInfo, purchaseSubscription, restorePurchases } = useSubscriptionStore();
const isPremium = checkPremium(subscriptionInfo);

// Check subscription status
if (isPremium) {
  // Show premium features
} else {
  // Show upgrade prompt
}
```

---

## Feature Gating Examples

### Example 1: Conditional Rendering

```typescript
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';
import { PremiumFeature, isPremiumFeatureEnabled } from '../src/utils/premiumFeatures';

const { subscriptionInfo } = useSubscriptionStore();
const canUseAdvancedSearch = isPremiumFeatureEnabled(PremiumFeature.ADVANCED_SEARCH, subscriptionInfo);

{canUseAdvancedSearch ? (
  <AdvancedSearchFilters />
) : (
  <PremiumGate feature={PremiumFeature.ADVANCED_SEARCH} />
)}
```

### Example 2: Premium Gate Component

```typescript
<PremiumGate feature={PremiumFeature.OFFLINE_MODE}>
  <OfflineModeView />
</PremiumGate>
```

---

## Subscription Status

Subscription status is automatically checked:
- On app launch
- On subscription screen
- After purchase
- After restore purchases

You can manually check status:

```typescript
const { checkSubscriptionStatus } = useSubscriptionStore();
await checkSubscriptionStatus();
```

---

## Testing

### Sandbox Testing:

**iOS:**
1. Create sandbox test account in App Store Connect
2. Sign out of App Store on device/simulator
3. Purchase will prompt for sandbox account login
4. Use sandbox test account credentials

**Android:**
1. Add test account email in Google Play Console
2. Purchase will use test account automatically
3. No need to sign out

### Test Scenarios:

- ✅ Purchase monthly subscription
- ✅ Purchase annual subscription
- ✅ Cancel subscription
- ✅ Restore purchases
- ✅ Subscription expiration
- ✅ Grace period handling
- ✅ Billing issue handling

---

## Pricing Recommendations

### Suggested Pricing:

- **Monthly**: $4.99/month
- **Annual**: $39.99/year (33% savings)

### Platform Fees:

- Apple: 30% (15% after year 1)
- Google: 30% (15% for first $1M revenue/year)
- Qonversion: 0% up to $10K MRR, then 0.6% above

### Net Revenue (Monthly at $10K MRR):

- Platform fee (30%): $3,000
- Qonversion fee: $0 (free tier)
- **Your net: $7,000/month**

---

## Troubleshooting

### "Qonversion API key not configured"
- Check `.env` file exists with correct keys
- Restart Expo dev server after adding keys
- For production builds, ensure keys are set in build environment

### "No products available"
- Verify products are created in App Store Connect / Google Play Console
- Verify products are configured in Qonversion Dashboard
- Check product IDs match between stores and Qonversion
- Ensure app is signed and has in-app purchase capability

### "Purchase failed"
- Check network connection
- Verify sandbox account is active (iOS)
- Check product IDs match exactly
- Verify products are approved in stores

### "Subscription not activating"
- Wait a few seconds for Qonversion to sync
- Check Qonversion Dashboard for purchase status
- Verify entitlement is correctly attached to product
- Check subscription status in app: `checkSubscriptionStatus()`

---

## Resources

- **Qonversion Dashboard**: https://dashboard.qonversion.io/
- **Qonversion Docs**: https://documentation.qonversion.io/
- **React Native SDK**: https://github.com/qonversion/react-native-sdk
- **Expo Guide**: https://documentation.qonversion.io/docs/expo
- **Apple IAP Guide**: https://developer.apple.com/in-app-purchase/
- **Google Play Billing**: https://developer.android.com/google/play/billing

---

**Next Steps:**
1. Set up Qonversion account
2. Configure products in App Stores
3. Set API keys in `.env`
4. Test in sandbox
5. Submit to App Store/Play Store

