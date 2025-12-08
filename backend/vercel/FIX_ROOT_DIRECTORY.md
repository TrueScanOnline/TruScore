# Fix Vercel Root Directory Error

## Problem
Error: "The specified Root Directory ".\" does not exist. Please update your Project Settings."

## Solution

### Option 1: Remove Root Directory in Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/leightons-projects-d328c774/truscore/settings
2. Click on **"General"** tab
3. Find **"Root Directory"** setting
4. **Clear/Remove** the root directory (set it to empty or remove the value)
5. Click **"Save"**
6. Try deploying again: `vercel --prod`

### Option 2: Use Vercel CLI to Update Settings

Run this command to remove the root directory:

```powershell
vercel project ls
vercel project rm truscore --yes
# Then redeploy - it will create fresh without root directory
```

### Option 3: Deploy Without Root Directory

The project should work without a root directory since we're deploying from `backend/vercel` which is already the root.

## After Fixing

Once the root directory is removed, deploy again:

```powershell
cd backend\vercel
vercel --prod
```

The deployment should succeed and the endpoint will be available at:
`https://truscore-6de210dop-leightons-projects-d328c774.vercel.app/api/fsanz-database?country=nz`

