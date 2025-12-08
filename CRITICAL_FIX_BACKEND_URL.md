# CRITICAL FIX: Backend URL Authentication Issue

## Problem

User edits are **NOT being stored globally** because the app is using a **preview deployment URL** that requires authentication:

```
[ManualProductService] Submitting to backend: https://truscoreapi-5ziw2940v-leightons-projects-d328c774.vercel.app
[ManualProductService] ⚠️  Backend returned 401 - Authentication Required
[ManualProductService] ⚠️  Data saved locally only - will NOT be available to other users
```

## Root Cause

The app is using a **preview deployment URL** (`truscoreapi-5ziw2940v-...`) which:
- ❌ Requires authentication
- ❌ Cannot be accessed by mobile apps
- ❌ Blocks all user submissions

**Production URLs** (from `vercel ls --prod`):
- ✅ `https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app`
- ✅ `https://vercel-48au9bmeu-leightons-projects-d328c774.vercel.app`

## Solution Implemented

### 1. Automatic Preview URL Detection

The code now automatically detects and rejects preview URLs:

```typescript
// Known production URLs
const PRODUCTION_URLS = [
  'https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app',
  'https://vercel-48au9bmeu-leightons-projects-d328c774.vercel.app',
];

// Reject preview URLs
if (backendUrl.includes('truscoreapi-') || isPreviewUrl) {
  console.error('[BackendConfig] ❌ Preview URL detected - using production instead');
  backendUrl = PRODUCTION_URLS[0];
}
```

### 2. Enhanced Error Messages

401 errors now show clear messages:

```
[ManualProductService] ❌ CRITICAL: Preview deployment URL detected!
[ManualProductService] ❌ Preview deployments require authentication
[ManualProductService] ❌ Data saved locally only - will NOT be available to other users
```

## Immediate Action Required

### Option 1: Set Environment Variable (Recommended)

1. **Create/Update `.env` file:**
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app
   ```

2. **Restart app:**
   ```bash
   npm start
   ```

### Option 2: Verify Current URL

1. **Check logs for:**
   ```
   [BackendConfig] ✅ Using backend URL: https://vercel-q30j4fdjt-...
   ```

2. **Should NOT see:**
   ```
   [BackendConfig] ❌ Preview URL detected
   ```

## Testing

### Test 1: Verify URL
1. Edit a product (change ingredients)
2. Check logs for: `[BackendConfig] ✅ Using backend URL: ...`
3. Should show production URL (not `truscoreapi-`)

### Test 2: Verify Submission
1. Edit a product
2. Check logs for: `[ManualProductService] ✅ Successfully submitted to Vercel backend`
3. Should NOT see: `401` or `Authentication Required`

### Test 3: Verify Retrieval
1. Edit product on Device A
2. Scan same barcode on Device B
3. Should see updated data

## Expected Logs After Fix

### ✅ Correct (Production URL):
```
[BackendConfig] ✅ Using backend URL: https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app
[ManualProductService] Submitting to backend (attempt 1/3): https://vercel-q30j4fdjt-.../api/manual-products
[ManualProductService] ✅ Successfully submitted to Vercel backend: 9420020300194
[ManualProductsAPI] UPDATE submission for barcode: 9420020300194
[ManualProductsAPI] ✅ Product updated successfully: 9420020300194
```

### ❌ Incorrect (Preview URL):
```
[BackendConfig] ❌ Preview deployment URL detected - this requires authentication!
[BackendConfig] ❌ Invalid URL: https://truscoreapi-5ziw2940v-...
[BackendConfig] ✅ Using production URL instead
[BackendConfig] ✅ Using backend URL: https://vercel-q30j4fdjt-...
```

## Status

✅ **Code Fixed**: Automatically detects and rejects preview URLs
⚠️ **Action Required**: Verify `.env` file has correct production URL
✅ **Production URLs**: Verified from `vercel ls --prod`

---

**Date:** December 7, 2025  
**Priority:** 🔴 CRITICAL - User edits not saving globally

