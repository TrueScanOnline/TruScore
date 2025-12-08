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
# OPTIONAL API KEYS (For Enhanced Features)
# ============================================
# USDA FoodData Central (US branded foods)
# EXPO_PUBLIC_USDA_API_KEY=your_usda_key

# GS1 Data Source (Official barcode verification)
# EXPO_PUBLIC_GS1_API_KEY=your_gs1_key

# EAN-Search.org (1B+ products)
# EXPO_PUBLIC_EAN_SEARCH_API_KEY=your_ean_search_key

# UPC Database API (4.3M+ products)
# EXPO_PUBLIC_UPC_DATABASE_API_KEY=your_upc_database_key

# Edamam Food Database (10K requests/month)
# EXPO_PUBLIC_EDAMAM_APP_ID=your_edamam_app_id
# EXPO_PUBLIC_EDAMAM_APP_KEY=your_edamam_app_key

# Barcode Lookup API (100/day)
# EXPO_PUBLIC_BARCODE_LOOKUP_API_KEY=your_barcode_lookup_key

# Nutritionix API (100/day)
# EXPO_PUBLIC_NUTRITIONIX_APP_ID=your_nutritionix_app_id
# EXPO_PUBLIC_NUTRITIONIX_API_KEY=your_nutritionix_api_key

# Spoonacular API (150 points/day)
# EXPO_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key

# Best Buy API (5K/day)
# EXPO_PUBLIC_BESTBUY_API_KEY=your_bestbuy_key

# EANData API (100/day)
# EXPO_PUBLIC_EANDATA_API_KEY=your_eandata_key

# ============================================
# QONVERSION (Subscription Management)
# ============================================
# Already configured in app.config.js
# EXPO_PUBLIC_QONVERSION_PROJECT_KEY=your_project_key
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
