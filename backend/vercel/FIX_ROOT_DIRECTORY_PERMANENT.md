# PERMANENT FIX for Root Directory Error

## The Problem
Vercel project has a root directory setting that conflicts. Setting it to `./` doesn't work.

## The REAL Solution

### Option 1: Remove Root Directory in Vercel Dashboard (MUST DO THIS)

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/leightons-projects-d328c774/truscore/settings
   ```

2. **Click "General" tab**

3. **Find "Root Directory" section**

4. **IMPORTANT: DO NOT SET IT TO `./`**
   - Instead, **DELETE/CLEAR the entire value**
   - Leave it **completely empty/blank**
   - Click **"Save"**

5. **Then deploy:**
   ```powershell
   cd backend\vercel
   vercel --prod
   ```

### Option 2: Use Vercel CLI to Remove Root Directory

Try this command to update project settings:

```powershell
# This might work to remove root directory
vercel project rm truscore
# Then create fresh project
vercel --prod
```

### Option 3: Deploy from Project Root Instead

If the above doesn't work, we can restructure:

```powershell
# From project root
cd C:\TrueScan-FoodScanner
vercel --prod --cwd backend/vercel
```

### Option 4: Create New Project (Last Resort)

If nothing works, create a fresh project:

```powershell
cd backend\vercel
vercel --prod
# When asked "Link to existing project?" → NO
# Create new project name: truscore-backend
# Then update .env URLs
```

## What to Check

After removing root directory in dashboard:
- Root Directory should be **empty/blank** (not `./`, not anything)
- Then deploy should work

