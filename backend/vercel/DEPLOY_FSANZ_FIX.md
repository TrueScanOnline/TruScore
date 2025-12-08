# FSANZ Database Endpoint - Deployment Fix

## Issue
The FSANZ database endpoint was returning 401 (Unauthorized) errors when the app tried to auto-download the database.

## Fixes Applied

1. ✅ Added CORS handling for OPTIONS requests
2. ✅ Created empty database JSON files in `backend/vercel/data/`
3. ✅ Updated file path resolution for Vercel's serverless environment
4. ✅ Added CORS headers to vercel.json
5. ✅ Improved error handling and logging

## Files Created/Modified

- `backend/vercel/api/fsanz-database.ts` - Fixed CORS and file path handling
- `backend/vercel/data/fsanz-nz.json` - Empty database file (ready for data)
- `backend/vercel/data/fsanz-au.json` - Empty database file (ready for data)
- `backend/vercel/vercel.json` - Added CORS headers for the endpoint

## Deployment Required

**You MUST redeploy to Vercel for these fixes to take effect:**

```powershell
cd backend/vercel
vercel --prod
```

## After Deployment

1. Test the endpoint:
   ```
   https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
   ```

2. Should return:
   - Status 200 (not 401!)
   - Empty JSON object: `{}`
   - CORS headers in response

3. Update app `.env` if URL changed:
   ```
   EXPO_PUBLIC_FSANZ_NZ_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=nz
   EXPO_PUBLIC_FSANZ_AU_URL=https://your-vercel-url.vercel.app/api/fsanz-database?country=au
   ```

## Next Steps

Once the endpoint is working:
1. Populate the database files with actual FSANZ data
2. Redeploy to Vercel
3. App will auto-download on first launch for NZ/AU users

## Troubleshooting

If still getting 401:
- Check Vercel project settings - ensure no password protection
- Verify endpoint is deployed: `vercel ls`
- Check Vercel function logs for errors
- Ensure root directory is set correctly in Vercel dashboard

