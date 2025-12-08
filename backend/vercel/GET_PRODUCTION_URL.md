# Get Vercel Production URL

## Problem
The deployment-specific URL (`truscoreapi-h33lflq2u-...`) might require authentication, but the production domain should be public.

## Solution: Use Production Domain

### Step 1: Get Production Domain

1. **Go to:** https://vercel.com/leightons-projects-d328c774/truscoreapi/settings
2. **Click "Domains" tab**
3. **Find the production domain** (usually `truscoreapi.vercel.app` or similar)
4. **Or check "General" tab** for the production URL

### Step 2: Update .env

Use the production domain instead of deployment-specific URL:

```env
EXPO_PUBLIC_FSANZ_AU_URL=https://truscoreapi.vercel.app/api/fsanz-database?country=au
EXPO_PUBLIC_FSANZ_NZ_URL=https://truscoreapi.vercel.app/api/fsanz-database?country=nz
```

### Step 3: Test Production Domain

Test in browser (should work without login):
```
https://truscoreapi.vercel.app/api/fsanz-database?country=nz
```

### Step 4: Restart App

After updating .env, restart your app.

## Why This Works

- **Deployment URLs** (`truscoreapi-XXXXX.vercel.app`) might require authentication
- **Production domain** (`truscoreapi.vercel.app`) is publicly accessible
- Production domain always points to latest production deployment
