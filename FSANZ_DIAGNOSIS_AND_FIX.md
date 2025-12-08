# FSANZ Diagnosis and Fix Guide

## Current Issue

All API tests are failing with "Error". This could mean:

1. **Deployment still processing** - Vercel deployments take 1-2 minutes
2. **Endpoint not deployed** - Function might not be recognized
3. **Network/connection issue** - Firewall or connectivity problem
4. **Database files not included** - Data files might not be in deployment

## Diagnosis Steps

### Step 1: Check Vercel Dashboard

1. Go to: https://vercel.com/leightons-projects-d328c774/truscoreapi
2. Check **latest deployment**:
   - Status should be "Ready" (green)
   - If "Building" or "Error", wait or fix issues
3. Check **Functions** tab:
   - Should see `api/fsanz-query.ts` listed
   - If missing, function isn't being recognized
4. Check **Logs**:
   - Look for errors during deployment
   - Check function logs for runtime errors

### Step 2: Verify Deployment

```powershell
cd backend\vercel
vercel ls
```

This shows recent deployments and their status.

### Step 3: Test API Manually

**Option A: Browser**
```
https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk
```

**Option B: PowerShell**
```powershell
Invoke-RestMethod -Uri "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
```

**Option C: Node.js**
```powershell
node scripts\testFSANZSimple.js
```

### Step 4: Check Function Logs

In Vercel dashboard:
1. Go to deployment
2. Click on `api/fsanz-query` function
3. Check logs for:
   - `[FSANZ-QUERY] Request received`
   - `[FSANZ-QUERY] Database loaded`
   - `[MATCH] Searching for...`
   - Any error messages

## Common Issues and Fixes

### Issue 1: 404 Error
**Cause:** Function not deployed or wrong path  
**Fix:**
- Verify `api/fsanz-query.ts` exists
- Check `vercel.json` includes the function
- Redeploy: `vercel --prod --yes`

### Issue 2: 503 Error
**Cause:** Database files not found  
**Fix:**
- Verify `data/nzfcd.json` and `data/afcd.json` exist
- Check `.vercelignore` includes `!data/`
- Redeploy

### Issue 3: 500 Error
**Cause:** Runtime error in function  
**Fix:**
- Check Vercel function logs
- Look for TypeScript/JavaScript errors
- Verify database loading logic

### Issue 4: Timeout/Connection Error
**Cause:** Network issue or deployment still processing  
**Fix:**
- Wait 1-2 minutes after deployment
- Check internet connection
- Try again

## Verification Checklist

- [ ] API file exists: `backend/vercel/api/fsanz-query.ts`
- [ ] Data files exist: `backend/vercel/data/nzfcd.json` and `afcd.json`
- [ ] `.vercelignore` includes data files
- [ ] `vercel.json` includes function configuration
- [ ] Deployment completed successfully
- [ ] Function appears in Vercel Functions tab
- [ ] API returns 200 (not 404/500)
- [ ] Products are found in database

## Next Steps

1. **Run diagnosis script:**
   ```powershell
   .\scripts\diagnoseFSANZ.ps1
   ```

2. **Check Vercel dashboard** for deployment status

3. **Wait 1-2 minutes** if deployment just completed

4. **Test again** with the test scripts

5. **Check logs** if still failing









