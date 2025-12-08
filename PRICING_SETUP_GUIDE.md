# Subscription Pricing Setup Guide
**For After Testing Phase**

This guide documents how to configure $0.99/month pricing in App Store Connect and Google Play Console.

---

## 📋 Overview

**Target Pricing:**
- Monthly: **$0.99 USD/month**
- Annual: **$9.99 USD/year** (suggested - 17% savings)

**Product IDs:**
- `monthly_premium` - Monthly subscription
- `annual_premium` - Annual subscription

**Entitlement:**
- `premium` - Qonversion entitlement ID

---

## 🍎 App Store Connect Setup (iOS)

### Step 1: Create Subscription Group
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app: **TrueScan**
3. Navigate to **Subscriptions**
4. Click **+** to create subscription group
5. Name: **"Premium Subscription"**
6. Click **Create**

### Step 2: Create Monthly Subscription
1. In subscription group, click **+** to add subscription
2. **Reference Name:** Monthly Premium
3. **Product ID:** `monthly_premium` (must match code)
4. **Subscription Duration:** 1 Month
5. Click **Create**

### Step 3: Set Monthly Price
1. Select **Monthly Premium** subscription
2. Go to **Pricing and Availability**
3. Click **+** to add price
4. Select **United States**
5. Set price: **$0.99 USD**
6. Add other countries (optional - auto-converts)
7. Click **Save**

### Step 4: Create Annual Subscription
1. In same subscription group, click **+**
2. **Reference Name:** Annual Premium
3. **Product ID:** `annual_premium` (must match code)
4. **Subscription Duration:** 1 Year
5. Click **Create**

### Step 5: Set Annual Price
1. Select **Annual Premium** subscription
2. Go to **Pricing and Availability**
3. Set price: **$9.99 USD** (or equivalent)
4. Click **Save**

### Step 6: Configure Subscription Details
For each subscription:
1. **Display Name:** "TrueScan Premium"
2. **Description:** "Unlock premium features including offline mode, unlimited history, advanced search, and more."
3. **Subscription Benefits:** List premium features
4. **Review Information:** Add screenshots/details

### Step 7: Submit for Review
1. Complete all subscription details
2. Submit app update with subscriptions
3. Wait for Apple review

---

## 🤖 Google Play Console Setup (Android)

### Step 1: Create Subscription Products
1. Go to [Google Play Console](https://play.google.com/console)
2. Select app: **TrueScan**
3. Navigate to **Monetize** → **Products** → **Subscriptions**
4. Click **Create subscription**

### Step 2: Create Monthly Subscription
1. **Product ID:** `monthly_premium` (must match code)
2. **Name:** Monthly Premium
3. **Description:** "Monthly subscription to TrueScan Premium features"
4. **Billing period:** Monthly
5. Click **Continue**

### Step 3: Set Monthly Price
1. **Base price:** $0.99
2. **Currency:** USD
3. Add other countries (optional)
4. Click **Save**

### Step 4: Create Annual Subscription
1. Click **Create subscription** again
2. **Product ID:** `annual_premium` (must match code)
3. **Name:** Annual Premium
4. **Description:** "Annual subscription to TrueScan Premium features"
5. **Billing period:** Yearly
6. Click **Continue**

### Step 5: Set Annual Price
1. **Base price:** $9.99
2. **Currency:** USD
3. Add other countries (optional)
4. Click **Save**

### Step 6: Activate Subscriptions
1. Both subscriptions should show as **Active**
2. Verify product IDs match code exactly
3. Test with sandbox accounts

---

## 🔗 Qonversion Dashboard Setup

### Step 1: Create Entitlement
1. Go to [Qonversion Dashboard](https://dashboard.qonversion.io)
2. Navigate to **Entitlements**
3. Click **Create Entitlement**
4. **ID:** `premium` (must match code)
5. **Name:** Premium
6. Click **Create**

### Step 2: Link Products
1. Go to **Products**
2. For each product:
   - **Store ID:** `monthly_premium` (matches App Store/Play Store)
   - **Type:** Subscription
   - **Attach to:** `premium` entitlement
3. Repeat for `annual_premium`

### Step 3: Verify Configuration
1. Check that both products are linked to `premium` entitlement
2. Verify product IDs match exactly
3. Test in sandbox

---

## ✅ Verification Checklist

### Before Launch:
- [ ] Monthly subscription created in App Store Connect
- [ ] Monthly price set to $0.99 USD
- [ ] Annual subscription created in App Store Connect
- [ ] Annual price set to $9.99 USD
- [ ] Monthly subscription created in Play Console
- [ ] Monthly price set to $0.99 USD
- [ ] Annual subscription created in Play Console
- [ ] Annual price set to $9.99 USD
- [ ] Products linked to Qonversion entitlement `premium`
- [ ] Product IDs match exactly: `monthly_premium`, `annual_premium`
- [ ] Tested with sandbox accounts
- [ ] Premium gating enabled in code (`ENABLE_PREMIUM_GATING = true`)

---

## 🧪 Testing Subscriptions

### iOS Testing:
1. Create sandbox tester in App Store Connect
2. Sign out of App Store on test device
3. Sign in with sandbox account
4. Test purchase flow
5. Verify premium features unlock
6. Test restore purchases

### Android Testing:
1. Add test account in Play Console
2. Add account to test device
3. Test purchase flow
4. Verify premium features unlock
5. Test restore purchases

---

## 💰 Pricing Strategy

### Current Plan:
- **Monthly:** $0.99/month
- **Annual:** $9.99/year (save $2.89/year = 17% discount)

### Alternative Pricing (Consider):
- **Monthly:** $0.99/month
- **Annual:** $7.99/year (save $3.89/year = 33% discount) - More attractive

### Regional Pricing:
- Prices auto-convert to local currency
- Can set custom prices per country
- Recommended: Let Apple/Google handle conversion

---

## 📝 Code Configuration

### Current Status:
- ✅ Qonversion integrated
- ✅ Subscription store implemented
- ✅ Product fetching works
- ⚠️ Premium gating: **DISABLED** (for testing)
- ⚠️ Products: **Not created in stores yet**

### After Testing:
1. Enable premium gating:
   ```typescript
   // src/utils/premiumFeatures.ts:120
   export const ENABLE_PREMIUM_GATING = true;
   ```

2. Create products in stores (follow this guide)

3. Test subscription flow

4. Launch!

---

## 🚀 Launch Checklist

- [ ] Products created in App Store Connect
- [ ] Products created in Play Console
- [ ] Products linked in Qonversion
- [ ] Premium gating enabled
- [ ] Tested subscription flow
- [ ] Tested restore purchases
- [ ] Tested subscription expiration
- [ ] Privacy policy includes subscription terms
- [ ] Terms of service includes subscription terms
- [ ] App Store description mentions subscription
- [ ] Play Store description mentions subscription

---

**Note:** This setup should be done AFTER testing phase is complete and you're ready to enable premium features.

**Last Updated:** December 2024
