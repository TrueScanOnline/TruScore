# Subscription Products Setup Guide
**Date:** January 2025  
**Purpose:** Step-by-step guide to create subscription products in App Store Connect and Google Play Console

---

## Overview

TrueScan uses Qonversion for subscription management, but you need to create the actual subscription products in both app stores before users can purchase them.

---

## Part 1: App Store Connect (iOS)

### Step 1: Access App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Select your app: **TrueScan** (`com.truescan.foodscanner`)

### Step 2: Create Subscription Group

1. Navigate to **App Information** → **Subscriptions**
2. Click **"+"** to create a new subscription group
3. Name it: **"TrueScan Premium"**
4. Click **Create**

### Step 3: Create Monthly Subscription

1. In the subscription group, click **"+"** to add a subscription
2. **Product ID:** `monthly_premium`
3. **Reference Name:** "TrueScan Premium Monthly"
4. **Subscription Duration:** 1 Month
5. Click **Create**

### Step 4: Configure Monthly Subscription

1. **Display Name:** "TrueScan Premium"
2. **Description:** "Unlock unlimited history, advanced search, export data, enhanced insights, ad-free experience, and detailed allergen information."

3. **Pricing:**
   - Click **"+"** next to Price
   - Select **United States**
   - Set price to **$0.99 USD**
   - Click **Next** → **Add**

4. **Review Information:**
   - Add subscription terms and privacy policy links
   - Review and save

### Step 5: Create Annual Subscription

1. In the same subscription group, click **"+"** to add another subscription
2. **Product ID:** `annual_premium`
3. **Reference Name:** "TrueScan Premium Annual"
4. **Subscription Duration:** 1 Year
5. Click **Create**

### Step 6: Configure Annual Subscription

1. **Display Name:** "TrueScan Premium Annual"
2. **Description:** "Save 17% with annual subscription! Unlock unlimited history, advanced search, export data, enhanced insights, ad-free experience, and detailed allergen information."

3. **Pricing:**
   - Click **"+"** next to Price
   - Select **United States**
   - Set price to **$9.99 USD** (saves 17% vs monthly)
   - Click **Next** → **Add**

4. **Review Information:**
   - Add subscription terms and privacy policy links
   - Review and save

### Step 7: Submit for Review

1. Both subscriptions must be submitted for review
2. Go to **App Store** → **Subscriptions**
3. Select each subscription
4. Click **Submit for Review**

**Note:** Apple typically reviews subscriptions within 24-48 hours.

---

## Part 2: Google Play Console (Android)

### Step 1: Access Google Play Console

1. Go to https://play.google.com/console
2. Sign in with your Google Play Developer account
3. Select your app: **TrueScan** (`com.truescan.foodscanner`)

### Step 2: Create Subscription Products

1. Navigate to **Monetize** → **Products** → **Subscriptions**
2. Click **Create subscription**

### Step 3: Create Monthly Subscription

1. **Product ID:** `monthly_premium`
2. **Name:** "TrueScan Premium"
3. **Description:** "Unlock unlimited history, advanced search, export data, enhanced insights, ad-free experience, and detailed allergen information."

4. **Billing period:** Monthly
5. **Price:**
   - Click **Set price**
   - Select **United States**
   - Set price to **$0.99 USD**
   - Click **Save**

6. **Free trial:** (Optional) Set to 7 days if desired
7. **Grace period:** (Optional) Set to 3 days

8. Click **Save** → **Activate**

### Step 4: Create Annual Subscription

1. Click **Create subscription** again
2. **Product ID:** `annual_premium`
3. **Name:** "TrueScan Premium Annual"
4. **Description:** "Save 17% with annual subscription! Unlock unlimited history, advanced search, export data, enhanced insights, ad-free experience, and detailed allergen information."

5. **Billing period:** Yearly
6. **Price:**
   - Click **Set price**
   - Select **United States**
   - Set price to **$9.99 USD**
   - Click **Save**

7. **Free trial:** (Optional) Set to 7 days if desired
8. **Grace period:** (Optional) Set to 3 days

9. Click **Save** → **Activate**

---

## Part 3: Qonversion Dashboard Configuration

### Step 1: Access Qonversion Dashboard

1. Go to https://dashboard.qonversion.io
2. Sign in with your Qonversion account
3. Select your project

### Step 2: Create Entitlement

1. Navigate to **Entitlements**
2. Click **Create Entitlement**
3. **Entitlement ID:** `premium`
4. **Name:** "TrueScan Premium"
5. Click **Save**

### Step 3: Link Products to Entitlement

1. Click on the `premium` entitlement
2. Go to **Products** tab
3. Click **Link Product**
4. Link both products:
   - `monthly_premium` (iOS)
   - `monthly_premium` (Android)
   - `annual_premium` (iOS)
   - `annual_premium` (Android)

### Step 4: Verify Configuration

1. Go to **Products** → Verify all 4 products are listed:
   - `monthly_premium` (iOS)
   - `monthly_premium` (Android)
   - `annual_premium` (iOS)
   - `annual_premium` (Android)

2. Verify each product has:
   - Correct product ID
   - Correct store (iOS/Android)
   - Active status

---

## Part 4: Testing

### iOS Testing (Sandbox)

1. **Create Sandbox Tester:**
   - App Store Connect → **Users and Access** → **Sandbox Testers**
   - Create a new sandbox tester account

2. **Test Purchase:**
   - Sign out of App Store on test device
   - Open TrueScan app
   - Navigate to subscription screen
   - Attempt to purchase
   - Sign in with sandbox tester account when prompted
   - Complete purchase (no real charge)

3. **Verify:**
   - Check Qonversion dashboard for subscription status
   - Verify premium features are unlocked in app

### Android Testing

1. **Add License Testers:**
   - Google Play Console → **Settings** → **License Testing**
   - Add your Gmail account as a license tester

2. **Test Purchase:**
   - Open TrueScan app on test device
   - Navigate to subscription screen
   - Attempt to purchase
   - Complete purchase (no real charge for license testers)

3. **Verify:**
   - Check Qonversion dashboard for subscription status
   - Verify premium features are unlocked in app

---

## Part 5: Verification Checklist

- [ ] Monthly subscription created in App Store Connect (`monthly_premium`)
- [ ] Monthly subscription priced at $0.99 USD
- [ ] Annual subscription created in App Store Connect (`annual_premium`)
- [ ] Annual subscription priced at $9.99 USD
- [ ] Both iOS subscriptions submitted for review
- [ ] Monthly subscription created in Google Play Console (`monthly_premium`)
- [ ] Monthly subscription priced at $0.99 USD
- [ ] Annual subscription created in Google Play Console (`annual_premium`)
- [ ] Annual subscription priced at $9.99 USD
- [ ] Both Android subscriptions activated
- [ ] Qonversion entitlement `premium` created
- [ ] All 4 products linked to entitlement in Qonversion
- [ ] Test purchases work on iOS (sandbox)
- [ ] Test purchases work on Android (license tester)
- [ ] Premium features unlock correctly after purchase

---

## Troubleshooting

### Issue: Products not showing in app

**Solution:**
- Verify product IDs match exactly: `monthly_premium` and `annual_premium`
- Check Qonversion dashboard for product status
- Ensure products are linked to `premium` entitlement
- Wait 24-48 hours for Apple/Google to sync products

### Issue: Purchase fails

**Solution:**
- Verify sandbox tester account is set up correctly (iOS)
- Verify license tester account is added (Android)
- Check Qonversion project key is correct in app
- Verify products are active in stores

### Issue: Premium features not unlocking

**Solution:**
- Check Qonversion dashboard for subscription status
- Verify entitlement ID is `premium` (matches code)
- Check app logs for Qonversion errors
- Restore purchases to sync subscription status

---

## Next Steps

After completing this setup:

1. **Enable Premium Gating:**
   - Update `src/utils/premiumFeatures.ts`
   - Set `ENABLE_PREMIUM_GATING = true`

2. **Test Thoroughly:**
   - Test purchases on both platforms
   - Test subscription renewal
   - Test subscription cancellation
   - Test restore purchases

3. **Monitor:**
   - Set up Qonversion webhooks for subscription events
   - Monitor subscription metrics in Qonversion dashboard
   - Track revenue in App Store Connect and Google Play Console

---

**Status:** Ready for implementation  
**Estimated Time:** 1-2 hours  
**Priority:** 🔴 CRITICAL - Required before launch
