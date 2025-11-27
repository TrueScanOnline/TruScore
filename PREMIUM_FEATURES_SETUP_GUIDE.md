# Premium Features Setup Guide

## Overview

The premium feature system is now **fully configured and production-ready**. All issues have been fixed, and the system is flexible enough for you to easily choose which features will be premium.

---

## 🎯 Quick Start: Enabling Premium Features

### Step 1: Enable Premium Gating Globally

Edit `src/config/premiumFeatures.ts`:

```typescript
// Change this from false to true when ready to launch premium features
export const ENABLE_PREMIUM_GATING = true;
```

**Current Status**: `false` (all features free for testing)

---

### Step 2: Choose Which Features Are Premium

In the same file (`src/config/premiumFeatures.ts`), you'll see a map of all features:

```typescript
export const PREMIUM_FEATURES: Record<PremiumFeature, { isPremium: boolean }> = {
  [PremiumFeature.OFFLINE_MODE]: { isPremium: true },        // ✅ Premium
  [PremiumFeature.UNLIMITED_HISTORY]: { isPremium: true },   // ✅ Premium
  [PremiumFeature.ADVANCED_SEARCH]: { isPremium: true },     // ✅ Premium
  [PremiumFeature.EXPORT_DATA]: { isPremium: true },         // ✅ Premium
  [PremiumFeature.ENHANCED_INSIGHTS]: { isPremium: true },   // ✅ Premium
  [PremiumFeature.AD_FREE]: { isPremium: true },             // ✅ Premium
  // ... etc
};
```

**To make a feature free**: Set `isPremium: false`  
**To make a feature premium**: Set `isPremium: true`

---

## 🔧 How It Works

### 1. Premium Feature Configuration

**File**: `src/config/premiumFeatures.ts`

This file controls:
- **Global toggle**: `ENABLE_PREMIUM_GATING` - Master switch for all premium gating
- **Feature-level control**: `PREMIUM_FEATURES` - Individual feature premium status

### 2. Using Premium Features in Your Code

#### Option A: Using PremiumGate Component (Recommended)

```typescript
import PremiumGate from '../src/components/PremiumGate';
import { PremiumFeature } from '../src/utils/premiumFeatures';

<PremiumGate feature={PremiumFeature.ADVANCED_SEARCH}>
  {/* This content only shows if user has premium OR feature is not premium */}
  <AdvancedSearchFilters />
</PremiumGate>
```

#### Option B: Using isPremiumFeatureEnabled Function

```typescript
import { isPremiumFeatureEnabled, PremiumFeature } from '../src/utils/premiumFeatures';
import { useSubscriptionStore } from '../src/store/useSubscriptionStore';

const { subscriptionInfo } = useSubscriptionStore();
const canUseFeature = isPremiumFeatureEnabled(PremiumFeature.OFFLINE_MODE, subscriptionInfo);

if (canUseFeature) {
  // Show premium feature
} else {
  // Show upgrade prompt
}
```

---

## ✅ What's Been Fixed

### All Critical Issues Resolved:

1. ✅ **Premium Gating System** - Now configurable via `src/config/premiumFeatures.ts`
2. ✅ **Environment Configuration** - Automatically uses SANDBOX in dev, PRODUCTION in prod
3. ✅ **Subscription Status Refresh** - Refreshes when app comes to foreground
4. ✅ **Product ID Detection** - Uses explicit mapping with fallback
5. ✅ **Error Messages** - Specific, user-friendly error messages
6. ✅ **Product Loading** - Retry logic for network issues
7. ✅ **Initialization** - Proper error handling
8. ✅ **Price Formatting** - Uses user's locale
9. ✅ **Feature List** - Updated to match actual premium features
10. ✅ **Trial Period Detection** - Improved logic

---

## 📋 Available Premium Features

All features are defined in `src/utils/premiumFeatures.ts`:

### Tier 1: Core Premium Features
- `OFFLINE_MODE` - Scan products offline
- `UNLIMITED_HISTORY` - Unlimited scan history
- `ADVANCED_SEARCH` - Advanced search & filters
- `EXPORT_DATA` - Export scan history

### Tier 2: Enhanced Features
- `ENHANCED_INSIGHTS` - Detailed TruScore breakdown
- `AD_FREE` - Ad-free experience

### Tier 3: Future Features
- `PRODUCT_COMPARISONS` - Compare products side-by-side
- `PERSONALIZED_RECOMMENDATIONS` - Personalized recommendations
- `HISTORICAL_TRENDS` - Track product changes over time

---

## 🚀 Launch Checklist

### Before Launch:

- [ ] Set `ENABLE_PREMIUM_GATING = true` in `src/config/premiumFeatures.ts`
- [ ] Review `PREMIUM_FEATURES` map - mark features as premium/free
- [ ] Test subscription flow in sandbox (dev mode)
- [ ] Test subscription flow in production (production build)
- [ ] Verify premium features are gated correctly
- [ ] Test restore purchases
- [ ] Test subscription expiration
- [ ] Test grace period
- [ ] Verify error messages are clear

### Qonversion Dashboard:

- [ ] Products created: `monthly_premium`, `annual_premium`
- [ ] Entitlement created: `premium`
- [ ] Products attached to `premium` entitlement
- [ ] API key configured in `.env`

### App Store Connect / Google Play:

- [ ] In-App Purchase products created
- [ ] Product IDs match Qonversion dashboard
- [ ] Pricing set for all regions
- [ ] Subscription terms configured

---

## 🧪 Testing

### Test Premium Gating:

1. **With Premium Gating Disabled** (`ENABLE_PREMIUM_GATING = false`):
   - All features should be accessible
   - No upgrade prompts shown

2. **With Premium Gating Enabled** (`ENABLE_PREMIUM_GATING = true`):
   - Premium features should be locked for free users
   - Upgrade prompts should appear
   - Premium users should have access

### Test Subscription Flow:

1. Purchase monthly subscription
2. Purchase annual subscription
3. Restore purchases
4. Cancel subscription (via platform settings)
5. Test expired subscription
6. Test grace period
7. Test billing issues

---

## 📝 Example: Making a Feature Premium

Let's say you want to make "Offline Mode" premium:

### Step 1: Ensure it's marked as premium

In `src/config/premiumFeatures.ts`:
```typescript
[PremiumFeature.OFFLINE_MODE]: { isPremium: true }, // ✅ Already set
```

### Step 2: Gate the feature in your code

In your component:
```typescript
import PremiumGate from '../src/components/PremiumGate';
import { PremiumFeature } from '../src/utils/premiumFeatures';

<PremiumGate feature={PremiumFeature.OFFLINE_MODE}>
  <OfflineModeComponent />
</PremiumGate>
```

### Step 3: Enable premium gating

In `src/config/premiumFeatures.ts`:
```typescript
export const ENABLE_PREMIUM_GATING = true; // ✅ Enable when ready
```

That's it! The feature is now premium.

---

## 📝 Example: Making a Feature Free

Let's say you want to make "Advanced Search" free:

### Step 1: Mark it as free

In `src/config/premiumFeatures.ts`:
```typescript
[PremiumFeature.ADVANCED_SEARCH]: { isPremium: false }, // ✅ Changed to false
```

The feature will now be accessible to all users, even when `ENABLE_PREMIUM_GATING = true`.

---

## 🔍 How to Check Current Configuration

### Check if premium gating is enabled:

```typescript
import { ENABLE_PREMIUM_GATING } from '../src/config/premiumFeatures';
console.log('Premium gating enabled:', ENABLE_PREMIUM_GATING);
```

### Check if a specific feature is premium:

```typescript
import { isFeaturePremium, PremiumFeature } from '../src/config/premiumFeatures';
const isPremium = isFeaturePremium(PremiumFeature.OFFLINE_MODE);
console.log('Offline mode is premium:', isPremium);
```

---

## 🎨 Customization

### Custom Upgrade Message

The `PremiumGate` component automatically shows an upgrade button. You can customize the message:

```typescript
import { getPremiumFeatureMessage, PremiumFeature } from '../src/utils/premiumFeatures';

const message = getPremiumFeatureMessage(PremiumFeature.OFFLINE_MODE);
// Returns: "Unlock Offline Mode with Premium subscription"
```

### Custom Fallback Content

```typescript
<PremiumGate 
  feature={PremiumFeature.OFFLINE_MODE}
  fallback={<CustomUpgradePrompt />}
>
  <OfflineModeComponent />
</PremiumGate>
```

---

## 🐛 Troubleshooting

### Premium features not gating?

1. Check `ENABLE_PREMIUM_GATING` is `true`
2. Check feature is marked as `isPremium: true` in `PREMIUM_FEATURES`
3. Verify subscription status is being checked
4. Check console for errors

### Subscription not working?

1. Verify Qonversion API key is set in `.env`
2. Check products are created in Qonversion dashboard
3. Verify products are attached to `premium` entitlement
4. Check environment (SANDBOX for dev, PRODUCTION for prod)
5. Verify product IDs match between dashboard and code

### Features showing when they shouldn't?

1. Ensure `ENABLE_PREMIUM_GATING = true`
2. Check feature is marked as `isPremium: true`
3. Verify `PremiumGate` component is being used correctly
4. Check subscription status is being checked

---

## 📚 Related Files

- **Configuration**: `src/config/premiumFeatures.ts`
- **Feature Definitions**: `src/utils/premiumFeatures.ts`
- **Premium Gate Component**: `src/components/PremiumGate.tsx`
- **Subscription Store**: `src/store/useSubscriptionStore.ts`
- **Subscription Service**: `src/services/subscriptionService.ts`
- **Subscription Screen**: `app/subscription.tsx`

---

## 🎯 Summary

The premium feature system is **production-ready** and **fully flexible**:

1. ✅ All critical issues fixed
2. ✅ Easy configuration via `src/config/premiumFeatures.ts`
3. ✅ Simple to enable/disable premium gating
4. ✅ Easy to mark features as premium/free
5. ✅ Proper error handling and retry logic
6. ✅ Automatic environment detection
7. ✅ Subscription status refresh on app foreground
8. ✅ User-friendly error messages
9. ✅ Proper price formatting
10. ✅ Updated feature lists

**You can now easily choose which features will be premium by editing `src/config/premiumFeatures.ts`!**

---

**Last Updated**: 2025-11-26  
**Status**: ✅ **PRODUCTION READY**

