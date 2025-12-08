# Fix Vercel Authentication Required Error

## Problem
The endpoint is returning 401 with "Authentication Required" HTML page. This means Vercel has password protection or authentication enabled on the project.

## Solution: Disable Password Protection

### Step 1: Go to Vercel Dashboard

1. **Open:** https://vercel.com/leightons-projects-d328c774/truscoreapi/settings
2. **Click "Deployment Protection"** tab (or "Security" tab)
3. **Find "Password Protection"** or "Deployment Protection" setting
4. **DISABLE it** - Set to "No Protection" or "Public"
5. **Click "Save"**

### Step 2: Check General Settings

1. **Click "General" tab**
2. **Check "Visibility"** - Should be "Public"
3. **Check "Deployment Protection"** - Should be disabled

### Step 3: Redeploy

After disabling protection:

```powershell
cd backend\vercel
vercel --prod
```

## Alternative: Check Deployment Settings

The deployment might be in preview mode. Check:

1. **Go to:** https://vercel.com/leightons-projects-d328c774/truscoreapi/deployments
2. **Find the latest deployment**
3. **Check if it says "Production" or "Preview"**
4. **If Preview, promote to Production:**
   - Click on the deployment
   - Click "Promote to Production"

## Why This Happens

Vercel projects can have:
- Password protection (requires password to access)
- Deployment protection (requires Vercel account)
- Preview-only deployments (not publicly accessible)

The endpoint needs to be **publicly accessible** without authentication.

## After Fixing

Once authentication is disabled, the endpoint will work and return:
- Status: 200
- Response: `{}` (empty database)

Then restart your app and the download will succeed!
