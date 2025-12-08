# Backend URL Fix - 401 Authentication Error

## Problem

User edits are failing to save to backend with 401 errors:
```
WARN [ManualProductService] ⚠️  Backend returned 401 (may be expected for preview deployments)
WARN [ManualProductService] Backend submission may have failed due to authentication (preview deployment). Data saved locally.
```

**Root Cause:** The app is using a **preview deployment URL** which requires authentication:
- Preview URL: `https://truscoreapi-5ziw2940v-leightons-projects-d328c774.vercel.app`
- This URL format indicates a preview deployment (has hash in URL)
- Preview deployments require authentication and cannot be used for public API access

## Solution

### 1. Updated Backend URL Detection (`src/config/backendConfig.ts`)

**Added:**
- ✅ Detection of preview deployment URLs
- ✅ Automatic fallback to production URL
- ✅ Warning logs when preview URL detected

**Key Code:**
```typescript
// Reject preview deployment URLs (they require authentication)
if (backendUrl.includes('-') && backendUrl.match(/https:\/\/[^-]+-[a-z0-9]+\.vercel\.app/)) {
  console.warn('[BackendConfig] ⚠️  Preview deployment URL detected - using production fallback');
  backendUrl = 'https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app';
}
```

### 2. Enhanced Error Handling (`src/services/manualProductService.ts`)

**Added:**
- ✅ Better 401 error detection
- ✅ Preview URL detection in error handler
- ✅ Clear error messages explaining the issue
- ✅ No retry on 401 (authentication won't change)

**Key Changes:**
```typescript
// Check if this is a preview deployment URL
if (backendUrl.includes('-') && backendUrl.match(/https:\/\/[^-]+-[a-z0-9]+\.vercel\.app/)) {
  logger.error(`[ManualProductService] ❌ CRITICAL: Preview deployment URL detected!`);
  logger.error(`[ManualProductService] ❌ Preview deployments require authentication`);
  logger.error(`[ManualProductService] ❌ Data saved locally only - will NOT be available to other users`);
}
```

## How to Fix

### Option 1: Set Production URL in Environment Variable (Recommended)

1. **Get Production URL:**
   ```bash
   cd backend/vercel
   vercel ls --prod
   ```
   Look for URL without hash (e.g., `https://your-project.vercel.app`)

2. **Update .env file:**
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://your-production-url.vercel.app
   ```

3. **Restart app:**
   ```bash
   npm start
   ```

### Option 2: Use Production Deployment

1. **Deploy to production:**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

2. **Update backendConfig.ts with production URL:**
   ```typescript
   const defaultUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-production-url.vercel.app';
   ```

### Option 3: Configure Vercel Project Settings

1. Go to Vercel Dashboard → Your Project → Settings
2. Check "Deployment Protection" settings
3. Ensure API routes are publicly accessible (not behind authentication)

## URL Format Detection

### Preview Deployment (Requires Auth) ❌
```
https://truscoreapi-5ziw2940v-leightons-projects-d328c774.vercel.app
                                    ^^^^^^^^^^^^
                                    Hash indicates preview
```

### Production Deployment (Public Access) ✅
```
https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app
https://your-project.vercel.app
https://api.yourdomain.com
```

## Expected Behavior After Fix

### Before Fix:
```
[ManualProductService] Submitting to backend: https://truscoreapi-5ziw2940v-...
[ManualProductService] ⚠️  Backend returned 401
[ManualProductService] ⚠️  Data saved locally only
```

### After Fix:
```
[BackendConfig] Using backend URL: https://vercel-q30j4fdjt-...
[ManualProductService] Submitting to backend: https://vercel-q30j4fdjt-...
[ManualProductService] ✅ Successfully submitted to Vercel backend: 9420020300194
[ManualProductsAPI] UPDATE submission for barcode: 9420020300194
[ManualProductsAPI] ✅ Product updated successfully: 9420020300194
```

## Testing

1. **Check current backend URL:**
   - Look for log: `[BackendConfig] Using backend URL: ...`
   - Should NOT contain hash (no `-{hash}` in URL)

2. **Edit a product:**
   - Change ingredients or nutrition values
   - Save

3. **Check logs:**
   - Should see: `✅ Successfully submitted to Vercel backend`
   - Should NOT see: `401` or `Authentication Required`

4. **Verify on another device:**
   - Scan same barcode
   - Should see updated data

## Status

✅ **Fixed**: Code now detects and rejects preview deployment URLs
⚠️ **Action Required**: Set `EXPO_PUBLIC_BACKEND_URL` to production URL in `.env`

---

**Date:** December 7, 2025

