# Redeploy FSANZ Endpoint - CRITICAL FIX

## Problem Found
The `@vercel/node` package was missing from `package.json`, which is why the endpoint returns 401 errors.

## Fix Applied ✅
- ✅ Added `@vercel/node` to `package.json`
- ✅ Installed dependencies

## Redeploy Now

**Run this command:**

```powershell
cd backend\vercel
vercel --prod
```

**When prompted:**
- "Link to existing project?" → `yes`
- "Which existing project?" → `truscoreapi`
- Other prompts: Use defaults (press Enter)

## After Deployment

1. **Test the endpoint:**
   ```
   https://truscoreapi-XXXXX.vercel.app/api/fsanz-database?country=nz
   ```
   Should return: `{}` with status 200

2. **Restart your app** - The endpoint will now work!

## Why This Fixes It

The endpoint code uses `@vercel/node` types but the package wasn't installed. Vercel couldn't properly handle the request without it, causing 401 errors.

**After redeploying, the 401 error will be resolved!** ✅
