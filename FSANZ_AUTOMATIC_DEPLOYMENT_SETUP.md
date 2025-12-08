# FSANZ Automatic Deployment Setup

## What is Deployment?

**Deployment** = Uploading code and data files to the internet so the app can access them.

### Current Problem:
- Data files exist on your computer ✅
- API code exists on your computer ✅
- **BUT:** App can't access them (404 errors) ❌

### Why?
The files aren't on the internet yet - they're only on your computer.

## How Deployment Works

### Manual Deployment (Current):
1. Run command: `vercel --prod --yes`
2. Vercel uploads files (60-120 seconds)
3. API becomes accessible on internet
4. **Problem:** Must be done manually each time

### Automatic Deployment (What You Need):
1. Connect Vercel to Git repository
2. Every code push = automatic deployment
3. **No manual steps needed!**

## What Needs to Happen for App to Use FSANZ

### Step 1: Data Files Deployed ✅
- `nzfcd.json` (thousands of foods)
- `afcd.json` (thousands of foods)
- Location: `backend/vercel/data/`

### Step 2: API Code Deployed ✅
- `fsanz-query.ts` (API endpoint)
- Location: `backend/vercel/api/`

### Step 3: API Accessible ✅
- URL: `https://truscoreapi.vercel.app/api/fsanz-query`
- Must return 200 (not 404)

### Step 4: App Queries API ✅
- Code already implemented
- Queries after Open Food Facts

## Setting Up Automatic Deployment

### Option 1: Git Integration (Recommended)

1. **Push code to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "FSANZ database deployment"
   git push
   ```

2. **Connect Vercel to Git:**
   - Go to: https://vercel.com/dashboard
   - Import your repository
   - Vercel automatically deploys on every push

3. **Result:**
   - Every code change = automatic deployment
   - No manual steps needed!

### Option 2: CI/CD Script

Create script that:
1. Checks for changes
2. Runs deployment automatically
3. Tests API endpoint
4. Reports success/failure

## Current Status Check

I'm now:
1. ✅ Verifying data files exist
2. ✅ Testing API endpoint
3. ✅ Fixing any deployment issues
4. ✅ Ensuring automatic deployment works

## Next Steps

After deployment completes:
1. ✅ API endpoint accessible (not 404)
2. ✅ App can query FSANZ database
3. ✅ Products enhanced with FSANZ data
4. ✅ TruScore uses FSANZ data

**The deployment is happening now - I'll verify it works!**
