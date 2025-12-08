# Fixed Deployment Solution

## The Problem
Vercel root directory setting is blocking deployment. CLI cannot remove it - must be done in dashboard OR use `--cwd` flag.

## Solution: Use --cwd Flag (Bypasses Root Directory)

### Step 1: Deploy with --cwd Flag

From project root, run:

```powershell
cd C:\TrueScan-FoodScanner
vercel --prod --cwd backend/vercel
```

This tells Vercel to deploy from `backend/vercel` directory, bypassing the root directory setting.

### Step 2: If That Doesn't Work

**You MUST remove root directory in Vercel Dashboard:**

1. **Go to:** https://vercel.com/leightons-projects-d328c774/truscore/settings
2. **Click "General" tab**
3. **Scroll to "Root Directory"**
4. **DELETE the value completely** (make it empty/blank)
5. **Click "Save"**
6. **Then deploy:**
   ```powershell
   cd backend\vercel
   vercel --prod
   ```

### Step 3: Alternative - Create New Project

If nothing works, create a fresh project:

```powershell
cd backend\vercel
Remove-Item -Recurse -Force .vercel  # Remove old config
vercel --prod
# When asked "Link to existing project?" → NO
# Project name: truscore-api
# Then update .env with new URL
```

## Recommended: Try --cwd First

The `--cwd` flag should work and bypass the root directory issue entirely.
