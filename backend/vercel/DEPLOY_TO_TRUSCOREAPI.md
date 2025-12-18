# Deploy to truscoreapi Project - Quick Guide

## Why This Fixes the Issue

- ✅ `truscoreapi` project has Neon database already connected
- ✅ Environment variables (`POSTGRES_URL`) are configured
- ✅ Production domain ready: `truscoreapi.vercel.app`
- ✅ This is the project shown in your Vercel dashboard

## Steps to Deploy

```powershell
# 1. Navigate to backend directory
cd C:\TrueScan-FoodScanner\backend\vercel

# 2. Remove old project link (if exists)
Remove-Item .vercel -Recurse -Force -ErrorAction SilentlyContinue

# 3. Link to truscoreapi project
vercel link
# When prompted:
#   - Select: "truscoreapi"
#   - Select: "Leighton's projects" scope

# 4. Pull environment variables (includes database connection)
vercel env pull .env.local

# 5. Deploy to production
vercel --prod

# 6. Verify deployment URL
# Should show: https://truscoreapi.vercel.app
```

## Update Backend Config

After deployment, update `src/config/backendConfig.ts`:

Change line 16 from:
```typescript
let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://vercel-murex-alpha.vercel.app';
```

To:
```typescript
let backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://truscoreapi.vercel.app';
```

## Test

```powershell
cd C:\TrueScan-FoodScanner
npx ts-node --project scripts/tsconfig.json scripts/proveUserContributionGlobal.ts
```

Expected: ✅ All tests pass, data retrieved correctly!

