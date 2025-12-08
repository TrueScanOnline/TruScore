# Vercel Environment Variables Setup Guide

## ✅ Current Status

Based on your screenshots, you already have:
- ✅ **Neon Postgres Database** - Created and connected
- ✅ **Vercel Blob Storage** - Created (TruScore)

Now you need to add these as **Environment Variables** in Vercel.

---

## Step 1: Get Neon Postgres Connection String

### From the Neon Integration Page:

1. **On the Neon integration page** (the one you showed):
   - Look for the **"Quickstart"** section
   - Click on the **".env.local"** tab
   - You'll see:
     ```
     DATABASE_URL=***********
     DATABASE_URL_UNPOOLED=***********
     ```

2. **Click "Show secret"** button (next to the code snippet)
   - This will reveal the actual connection string
   - Copy the **`DATABASE_URL`** value

3. **The connection string looks like:**
   ```
   postgres://user:password@ep-xxxx-xxxx.region.neon.tech/dbname?sslmode=require
   ```

---

## Step 2: Get Vercel Blob Storage Token

### From the Blob Store Page:

**Option A: Check Environment Variables (Easiest)**
1. Go to: **Settings → Environment Variables**
2. Look for `BLOB_READ_WRITE_TOKEN`
3. If it exists, it's already configured! ✅
4. If not, continue to Option B

**Option B: Get from Blob Store Settings**
1. On the Blob Store page, look for:
   - **"Settings"** section
   - **"Connection Details"** or **"API"** section
   - **"Quickstart"** section (may show the token)

2. **The token looks like:**
   ```
   vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Option C: Create via Vercel CLI**
If you can't find it, you can also get it programmatically, but the easiest is through the dashboard.

---

## Step 3: Add Environment Variables to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select your project:**
   - Click on **"truscoreapi"** project

3. **Navigate to Settings:**
   - Click **"Settings"** tab
   - Click **"Environment Variables"** in the left sidebar

4. **Add POSTGRES_URL:**
   - Click **"Add New"**
   - **Key:** `POSTGRES_URL`
   - **Value:** Paste the `DATABASE_URL` from Neon (Step 1)
   - **Environment:** Select **"Production"** (and optionally "Preview", "Development")
   - Click **"Save"**

5. **Add BLOB_READ_WRITE_TOKEN:**
   - Click **"Add New"** again
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Paste the token from Blob Store (Step 2)
   - **Environment:** Select **"Production"** (and optionally "Preview", "Development")
   - Click **"Save"**

### Method 2: Interactive Script

Run the interactive script:
```bash
npm run setup-backend:complete
```

This will guide you through adding the values.

---

## Step 4: Redeploy Backend

After adding environment variables, **redeploy the backend** so it picks up the new variables:

```bash
cd backend/vercel
vercel --prod
cd ../..
```

---

## Step 5: Verify Configuration

Run the verification script:

```bash
npm run verify-backend
```

**Expected Output (After Configuration):**
```
✅ Backend URL Configuration
   Backend is accessible at https://truscoreapi-5ziw2940v-leightons-projects-d328c774.vercel.app

✅ Database Configuration
   Database appears to be configured and working

✅ Photo Storage Configuration
   Photo storage is configured and working

✅ API Endpoints
   4 endpoints checked
   Details: ✅ Manual Products, ✅ Manufacturing Country, ✅ Photo Upload, ✅ User Prices

Summary: 4 passed, 0 warnings, 0 failed
✅ All checks passed! Backend is properly configured.
```

---

## Quick Reference

### Where to Find Values:

| Variable | Where to Find |
|----------|---------------|
| `POSTGRES_URL` | Neon Integration Page → Quickstart → .env.local → DATABASE_URL (click "Show secret") |
| `BLOB_READ_WRITE_TOKEN` | Blob Store Page → Settings → Environment Variables, OR Settings → Connection Details |

### Where to Add:

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. Paste Key and Value
4. Select **Production** environment
5. Click **Save**

---

## Troubleshooting

### Issue: Can't find BLOB_READ_WRITE_TOKEN

**Solution:**
- Check if it's already in Environment Variables
- If not, you may need to create a new Blob store or check the Blob store settings
- The token is usually auto-generated when you create the Blob store

### Issue: DATABASE_URL is masked with asterisks

**Solution:**
- Click the **"Show secret"** button on the Neon integration page
- This will reveal the actual connection string

### Issue: Environment variables not working after redeploy

**Solution:**
1. Verify variables are set for **Production** environment
2. Make sure you redeployed: `cd backend/vercel && vercel --prod`
3. Check Vercel logs to see if variables are being read

---

## Next Steps After Configuration

1. ✅ Add environment variables (this step)
2. ✅ Redeploy backend
3. ✅ Run `npm run verify-backend`
4. ✅ Test user contributions in the app
5. ✅ Verify data is stored globally

---

**Status**: ⚠️ **Databases created, now need to add as environment variables**



