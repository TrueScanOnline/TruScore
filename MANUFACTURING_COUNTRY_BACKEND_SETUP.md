# Manufacturing Country Backend API Setup

## Overview
The manufacturing country data is now configured to sync with a backend API for global sharing. This allows users worldwide to see and contribute manufacturing country information, including the "With some imported ingredients" flag.

## Backend API Endpoint

**Location:** `backend/vercel/api/manufacturing-country.ts`

**Endpoints:**
- `POST /api/manufacturing-country` - Submit manufacturing country data
- `GET /api/manufacturing-country?barcode={barcode}` - Get manufacturing country data

## Current Implementation

### Hybrid Approach (Backend + Local Storage)
1. **Primary:** Tries to sync with backend API for global sharing
2. **Fallback:** Uses local AsyncStorage if backend is unavailable (offline support)

### How It Works

1. **Submission Flow:**
   - User submits country + imported ingredients flag
   - App tries to POST to backend API first
   - If successful, data is shared globally
   - Also saves locally as backup/cache
   - If backend unavailable, saves locally only

2. **Retrieval Flow:**
   - App tries to GET from backend API first
   - Returns global data from all users
   - If backend unavailable, falls back to local storage

## Setup Instructions

### Step 1: Deploy Backend to Vercel

1. Navigate to backend directory:
   ```powershell
   cd C:\TrueScan-FoodScanner\backend\vercel
   ```

2. Deploy to Vercel:
   ```powershell
   vercel --prod
   ```

3. Copy the deployment URL (e.g., `https://truescan-backend.vercel.app`)

### Step 2: Configure Backend URL

1. Add environment variable to `.env` file:
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://your-actual-vercel-url.vercel.app
   ```

2. Or update `src/services/manufacturingCountryService.ts`:
   ```typescript
   const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-actual-vercel-url.vercel.app';
   ```

### Step 3: Test the API

After deployment, test the endpoint:
```bash
# Test GET endpoint
curl "https://your-vercel-url.vercel.app/api/manufacturing-country?barcode=1234567890123"

# Test POST endpoint
curl -X POST "https://your-vercel-url.vercel.app/api/manufacturing-country" \
  -H "Content-Type: application/json" \
  -d '{"barcode":"1234567890123","country":"New Zealand","userId":"test-user","hasImportedIngredients":true}'
```

## Important Notes

### Current Limitation: In-Memory Storage
The current backend implementation uses **in-memory storage** which will reset when the serverless function restarts. For production, you should:

1. **Migrate to a persistent database:**
   - Vercel Postgres (recommended)
   - MongoDB Atlas
   - Supabase
   - Firebase Firestore

2. **Update `backend/vercel/api/manufacturing-country.ts`** to use the database instead of `submissionsStore` Map

### Example: Using Vercel Postgres

```typescript
import { sql } from '@vercel/postgres';

// Create table (run once)
await sql`
  CREATE TABLE IF NOT EXISTS manufacturing_country_submissions (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    timestamp BIGINT NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_count INT DEFAULT 1,
    disputed BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    has_imported_ingredients BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

// Query submissions
const { rows } = await sql`
  SELECT * FROM manufacturing_country_submissions 
  WHERE barcode = ${barcode}
`;
```

## Debugging Badge Display

If the imported ingredients badge is not displaying, check the console logs:

1. Look for `[CountryCard] Loaded data:` logs
2. Check `hasImportedIngredients` value
3. Look for `[CountryCard] Badge display check:` logs
4. Verify `shouldShow` is `true`

The badge should display when:
- `userContributedCountry?.hasImportedIngredients === true`
- A country is displayed on the card

## Files Modified

1. **`backend/vercel/api/manufacturing-country.ts`** - New API endpoint
2. **`backend/vercel/vercel.json`** - Added API configuration
3. **`src/services/manufacturingCountryService.ts`** - Added backend sync
4. **`src/features/product/cards/CountryCard/CountryCard.tsx`** - Added debug logs
5. **`app/result/[barcode].tsx`** - Added debug logs

## Next Steps

1. ✅ Backend API endpoint created
2. ✅ Service updated to sync with backend
3. ⏳ Deploy backend to Vercel
4. ⏳ Configure `EXPO_PUBLIC_BACKEND_URL` environment variable
5. ⏳ Test global sharing
6. ⏳ Migrate to persistent database (for production)

---

**Status:** Backend API ready, needs deployment and database migration for production use.
















