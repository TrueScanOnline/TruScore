# FSANZ Deployment - Complete Explanation

## What is "Deployment"?

### Deployment = Publishing Code to the Internet

**Deployment** means uploading your code and data files to a server (Vercel) so they're accessible on the internet.

Think of it like:
- **Local files** = Files on your computer (not accessible to the app)
- **Deployed files** = Files on the internet (accessible to the app)

### Current Situation:

1. **Data files exist locally:**
   - `backend/vercel/data/nzfcd.json` (on your computer)
   - `backend/vercel/data/afcd.json` (on your computer)

2. **API code exists locally:**
   - `backend/vercel/api/fsanz-query.ts` (on your computer)

3. **BUT:** The app can't access them because they're not deployed to the internet yet!

## How Deployment Works

### Manual Deployment (What I Did):

1. **I ran:** `vercel --prod --yes` command
2. **Vercel uploads:**
   - API code (`fsanz-query.ts`)
   - Data files (`nzfcd.json`, `afcd.json`)
3. **Vercel processes:** Takes 60-120 seconds
4. **Result:** API is live at `https://truscoreapi.vercel.app/api/fsanz-query`

### Automatic Deployment (What You Need):

**Option 1: Git Integration (Recommended)**
- Connect Vercel to your GitHub/GitLab
- Every time you push code, Vercel automatically deploys
- **No manual steps needed!**

**Option 2: CI/CD Pipeline**
- Automated script runs deployment
- Triggers on code changes
- **No manual steps needed!**

## What Needs to Happen for App to Use FSANZ

### Step 1: Data Files Must Be Deployed ✅
- Files: `nzfcd.json`, `afcd.json`
- Location: `backend/vercel/data/`
- Status: **MUST exist and be deployed**

### Step 2: API Code Must Be Deployed ✅
- File: `backend/vercel/api/fsanz-query.ts`
- Status: **MUST be deployed**

### Step 3: API Must Be Accessible ✅
- URL: `https://truscoreapi.vercel.app/api/fsanz-query`
- Status: **MUST return 200 (not 404)**

### Step 4: App Must Query API ✅
- Code: `src/services/fsanzQueryService.ts`
- Status: **Already implemented**

## Current Problem

### The 404 Errors Mean:

The API endpoint exists but:
1. **Either:** Data files aren't accessible on Vercel
2. **Or:** API code can't find the data files
3. **Or:** Deployment didn't include data files

### Why This Happens:

Vercel might not include large JSON files in deployment, or the file paths are wrong.

## Solution: Ensure Automatic Deployment

### What I'll Do:

1. **Verify data files exist and are correct**
2. **Ensure files are included in deployment** (`.vercelignore` check)
3. **Test API endpoint** to confirm it works
4. **Set up automatic deployment** (if needed)

### What You Need:

**For Automatic Deployment:**
1. Connect Vercel to your Git repository
2. Every code push = automatic deployment
3. No manual steps needed!

**OR**

**For Manual Deployment (Current):**
1. Run: `cd backend/vercel && vercel --prod --yes`
2. Wait 60-120 seconds
3. Test API endpoint

## Next Steps

I'll:
1. ✅ Check if data files exist
2. ✅ Verify API endpoint is accessible
3. ✅ Fix any deployment issues
4. ✅ Test with real product names
5. ✅ Confirm app can use FSANZ database
