# Vercel Deployment Protection - 401 Authentication Error

## Problem

Even the **production URL** is returning 401 Authentication Required:

```
[ManualProductService] Submitting to backend: https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app/api/manual-products
[ManualProductService] ❌ Backend returned 401 - Authentication Required
Response: <!doctype html><html lang=en>...<title>Authentication Required</title>...
```

**Root Cause:** Vercel **Deployment Protection** is enabled on the project, which requires authentication for all deployments (including production).

## Solution

### Option 1: Disable Deployment Protection (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project: `leightons-projects-d328c774`

2. **Navigate to Settings:**
   - Click **Settings** → **Deployment Protection**

3. **Disable Protection:**
   - Find **"Deployment Protection"** section
   - Toggle **OFF** or set to **"None"**
   - Save changes

4. **Redeploy:**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

### Option 2: Configure Public API Routes

If you want to keep protection but allow API routes:

1. **Go to Vercel Dashboard:**
   - Settings → Deployment Protection

2. **Add Exception:**
   - Add path pattern: `/api/*`
   - Set to **"Public"** or **"No Authentication"**

3. **Save and Redeploy**

### Option 3: Use Custom Domain

1. **Add Custom Domain:**
   - Settings → Domains
   - Add domain (e.g., `api.truescan.app`)

2. **Custom domains typically don't have protection enabled**

3. **Update backendConfig.ts:**
   ```typescript
   const defaultUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.truescan.app';
   ```

## Quick Fix via Vercel CLI

```bash
# Check current protection settings
vercel project ls

# Disable protection (if CLI supports it)
# Note: May need to use Dashboard instead
```

## Verification

After disabling protection:

1. **Test API endpoint:**
   ```bash
   curl https://vercel-q30j4fdjt-leightons-projects-d328c774.vercel.app/api/manual-products?barcode=9420020300194
   ```

2. **Should return JSON (not HTML):**
   ```json
   {
     "success": true,
     "product": {...}
   }
   ```

3. **Should NOT return:**
   ```html
   <title>Authentication Required</title>
   ```

## Expected Logs After Fix

### ✅ Correct (No Protection):
```
[ManualProductService] Submitting to backend: https://vercel-q30j4fdjt-.../api/manual-products
[ManualProductService] ✅ Successfully submitted to Vercel backend: 9420020300194
[ManualProductsAPI] UPDATE submission for barcode: 9420020300194
[ManualProductsAPI] ✅ Product updated successfully: 9420020300194
```

### ❌ Incorrect (Protected):
```
[ManualProductService] Submitting to backend: https://vercel-q30j4fdjt-.../api/manual-products
[ManualProductService] ❌ Backend returned 401 - Authentication Required
Response: <title>Authentication Required</title>
```

## Status

⚠️ **Action Required**: Disable Vercel Deployment Protection in Dashboard

---

**Date:** December 7, 2025  
**Priority:** 🔴 CRITICAL - Blocks all user submissions

