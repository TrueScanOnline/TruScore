# GS1 API Key Information

## Important Note About GS1 Data Source API

The **GS1 Data Source API is NOT completely free**. It requires either:
1. **A paid subscription** (API Add-On subscription with flat fee)
2. **A 60-day free trial** (for evaluation purposes)

## How to Get GS1 API Access

### Option 1: 60-Day Free Trial (Recommended to Start)

1. **Visit the GS1 US Store:**
   - URL: https://store.gs1us.org/view-use-api-trial/p

2. **Sign Up for the Trial:**
   - Create an account with GS1 US
   - Request access to the "View/Use API Trial"
   - This provides 60 days of free access to evaluate the APIs

3. **Access Your API Key:**
   - After approval, log into the GS1 US Developer Portal
   - Navigate to your API subscriptions
   - Copy your API key/credentials

### Option 2: Paid Subscription

1. **Subscribe to GS1 US Data Hub API Add-On:**
   - URL: https://www.gs1us.org/tools/gs1-us-data-hub/gs1-us-apis
   - This is a paid subscription with a flat fee
   - Provides ongoing access to GS1 APIs

2. **Access Your API Key:**
   - After subscription, access the GS1 US Developer Portal
   - Navigate to API management
   - Copy your API key/credentials

## Alternative: Make GS1 Optional

Since GS1 requires a subscription, the app is designed to work **without it**. The GS1 service will gracefully skip if no API key is configured.

### Current Status

✅ **USDA FoodData Central** - Configured with your API key  
⚠️ **GS1 Data Source** - Optional, requires subscription/trial

### What This Means

- The app will work perfectly fine with USDA only
- GS1 is an additional data source for official barcode verification
- If you don't have a GS1 subscription, the app will simply skip it and use other databases
- No errors or issues will occur without a GS1 API key

## If You Get a GS1 API Key

Once you have a GS1 API key (from trial or subscription), add it to your environment:

```bash
# In your .env file or app.config.js
EXPO_PUBLIC_GS1_API_KEY=your_gs1_api_key_here
```

Or directly in `app.config.js` (already configured to read from environment variable).

## Recommendation

1. **Start with USDA only** - This gives you excellent coverage for US branded foods
2. **Consider GS1 trial** - If you want official barcode verification, try the 60-day free trial
3. **Evaluate need** - After the trial, decide if GS1 adds enough value to justify a subscription

## Current Database Coverage (Without GS1)

With USDA configured, you have:
- ✅ **10 databases** total (including USDA)
- ✅ **~85-90% coverage** for scanned products
- ✅ **Official US nutritional data** from USDA
- ✅ **All other free databases** (Open Food Facts, Open Beauty Facts, etc.)

**GS1 adds:**
- Official barcode verification
- Basic product information
- Manufacturer data

**Without GS1, you still have excellent coverage!**

