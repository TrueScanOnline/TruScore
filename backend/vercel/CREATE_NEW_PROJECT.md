# Create New Vercel Project - Bypass Root Directory Issue

Since the existing project has a persistent root directory issue, we'll create a NEW project.

## Step 1: Remove Old Configuration

```powershell
cd backend\vercel
Remove-Item -Recurse -Force .vercel -ErrorAction SilentlyContinue
```

## Step 2: Create New Project

```powershell
cd backend\vercel
vercel --prod
```

**When prompted:**
- "Set up and deploy?" → `yes`
- "Which scope?" → `Leighton's projects`
- **"Link to existing project?" → `NO`** ← IMPORTANT!
- "What's your project's name?" → `truscore-api` (or any new name)
- "In which directory is your code located?" → Press Enter (use `./`)
- "Pull environment variables?" → `no`

## Step 3: Update Environment Variables

After deployment, you'll get a new URL. Update `.env` file:

```env
EXPO_PUBLIC_FSANZ_NZ_URL=https://truscore-api-XXXXX.vercel.app/api/fsanz-database?country=nz
EXPO_PUBLIC_FSANZ_AU_URL=https://truscore-api-XXXXX.vercel.app/api/fsanz-database?country=au
```

## Step 4: Test Endpoint

Test the new endpoint:
```
https://truscore-api-XXXXX.vercel.app/api/fsanz-database?country=nz
```

Should return: `{}` with status 200

## Why This Works

Creating a new project avoids the root directory setting issue entirely. The new project won't have any root directory configured, so it will work correctly.
