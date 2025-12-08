# Deploy FSANZ Endpoint - Quick Guide

## Fix Root Directory Error

The error is because Vercel has an incorrect root directory setting. Here's how to fix:

### Step 1: Remove Old Configuration

```powershell
cd backend\vercel
Remove-Item -Recurse -Force .vercel
```

### Step 2: Deploy Fresh

```powershell
vercel --prod
```

### Step 3: Answer Prompts

When asked:
- **"Set up and deploy?"** → `yes`
- **"Which scope?"** → `Leighton's projects`
- **"Link to existing project?"** → `yes`
- **"Which existing project?"** → `truscore`
- **"In which directory is your code located?"** → `./` (just press Enter - it's already in the right directory)
- **"Pull environment variables?"** → `no`

### Step 4: Verify Deployment

After deployment, test the endpoint:

```
https://truscore-XXXXX.vercel.app/api/fsanz-database?country=nz
```

Should return: `{}` with status 200

## Alternative: Fix in Vercel Dashboard

If the above doesn't work:

1. Go to: https://vercel.com/leightons-projects-d328c774/truscore/settings
2. Click **"General"** tab
3. Find **"Root Directory"** setting
4. **Clear/Remove** it (set to empty)
5. Click **"Save"**
6. Deploy: `vercel --prod`

## After Successful Deployment

Update `.env` file with the new URL if it changed:

```env
EXPO_PUBLIC_FSANZ_NZ_URL=https://your-new-url.vercel.app/api/fsanz-database?country=nz
EXPO_PUBLIC_FSANZ_AU_URL=https://your-new-url.vercel.app/api/fsanz-database?country=au
```

Then restart the app - FSANZ database will auto-download for NZ/AU users!

