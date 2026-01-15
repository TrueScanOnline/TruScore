# Environment Variables Template
**Copy this to `.env` file in project root**

```env
# ============================================
# VERCEL BACKEND URL (REQUIRED)
# ============================================
# After deploying backend with `vercel --prod`, update this URL
# Get your deployment URL from Vercel dashboard or deployment output
EXPO_PUBLIC_BACKEND_URL=https://YOUR-VERCEL-URL.vercel.app

# ============================================
# OPEN FOOD FACTS CREDENTIALS (RECOMMENDED)
# ============================================
# Create account at: https://world.openfoodfacts.org
# Use your username (not email) as user_id
# These credentials enable automatic product submission to Open Food Facts
# Without credentials, uses anonymous mode (may have rate limits)
EXPO_PUBLIC_OFF_USER_ID=your_off_username
EXPO_PUBLIC_OFF_PASSWORD=your_off_password

# ============================================
# HIGH PRIORITY API KEYS (Get These First)
# ============================================

# USDA FoodData Central (HIGH PRIORITY - Get this first!)
# Registration: https://fdc.nal.usda.gov/api-key-signup
# Free tier: Unlimited
EXPO_PUBLIC_USDA_API_KEY=your_usda_key_here

# ============================================
# MEDIUM PRIORITY API KEYS (Get These Next)
# ============================================

# EAN-Search.org (1B+ products)
# Registration: https://www.ean-search.org/ean-database-api.html
# Free tier: Unlimited light use
EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_ean_search_key_here

# UPC Database API (4.3M+ products)
# Registration: https://www.upcdatabase.com/api
# Free tier: 100 lookups/day
EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_upc_database_key_here

# Edamam Food Database (10K requests/month)
# Registration: https://developer.edamam.com/signup
# Free tier: 10,000 requests/month (attribution required)
# IMPORTANT: Must display "Powered by Edamam" badge in app
EXPO_PUBLIC_EDAMAM_APP_ID=your_edamam_app_id_here
EXPO_PUBLIC_EDAMAM_APP_KEY=your_edamam_app_key_here

# Nutritionix API (100 requests/day)
# Registration: https://developer.nutritionix.com
# Free tier: 100 requests/day
EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id_here
EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_nutritionix_api_key_here

# Spoonacular API (150 points/day)
# Registration: https://spoonacular.com/food-api
# Free tier: 150 points/day
EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key_here

# ============================================
# LOW PRIORITY API KEYS (Optional)
# ============================================

# GS1 Data Source (Optional - uses free Digital Link without key)
# Registration: https://store.gs1us.org/view-use-api-trial/p
# Free tier: 60-day trial, then $6,500+ subscription
# NOTE: Current implementation uses free Digital Link (no key needed)
# EXPO_PUBLIC_GS1_API_KEY=your_gs1_key_here

# Barcode Lookup API (100/day free test)
# Registration: https://www.barcodelookup.com/api
# Free tier: 100 lookups/day (test account)
EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_barcode_lookup_key_here

# Barcode Lookup Com (100/day free test)
# Registration: https://www.barcodelookup.com/api
# Free tier: 100 lookups/day (test account)
BARCODE_LOOKUP_API_KEY=your_barcode_lookup_com_key_here

# Best Buy API (5,000 requests/day)
# Registration: https://developer.bestbuy.com/
# Free tier: 5,000 requests/day
# NOTE: Only useful for electronics/tech products
EXPO_PUBLIC_BESTBUY_API_KEY=your_bestbuy_key_here

# EANData API (100/day)
# Registration: https://eandata.com/register
# Free tier: 100/day
EXPO_PUBLIC_EANDATA_API_KEY=your_eandata_key_here

# Walmart Open API
# Registration: https://developer.walmart.com/
# Free tier: Varies
EXPO_PUBLIC_WALMART_API_KEY=your_walmart_key_here

# OpenCorporates (Company enrichment only, not product database)
# Registration: https://opencorporates.com/api_accounts/new
# Free tier: 1,000 requests/month
EXPO_PUBLIC_OPENCORPORATES_API_KEY=your_opencorporates_key_here

# ============================================
# QONVERSION (Subscription Management)
# ============================================
# Already configured in app.config.js
# EXPO_PUBLIC_QONVERSION_PROJECT_KEY=your_project_key

# ============================================
# SENTRY (Error Reporting - Production)
# ============================================
# Get your DSN from: https://sentry.io/settings/projects/
# Create a project at: https://sentry.io/organizations/
# Free tier: 5,000 events/month
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

---

## 📝 SETUP INSTRUCTIONS

### 1. Create `.env` file
Copy the template above to `.env` in project root.

### 2. Update Required Variables
- `EXPO_PUBLIC_BACKEND_URL` - After deploying backend
- `EXPO_PUBLIC_OFF_USER_ID` - Your Open Food Facts username (optional but recommended)
- `EXPO_PUBLIC_OFF_PASSWORD` - Your Open Food Facts password (optional but recommended)

### 3. Add Optional API Keys
Add any optional API keys you want to use for enhanced features.

---

**Note:** The `.env` file is gitignored and won't be committed to version control.

---

## ⚠️ IMPORTANT NOTES

1. **Tesco Labs API has been removed** - Service discontinued December 2025
2. **GS1 uses free Digital Link** - No API key needed (current implementation)
3. **Edamam requires attribution** - Must display "Powered by Edamam" badge in app (free tier requirement)
4. **Priority Order:**
   - **First:** Get USDA key (5 minutes, high priority)
   - **Second:** Get medium priority keys (50 minutes total)
   - **Third:** Get low priority keys as needed
