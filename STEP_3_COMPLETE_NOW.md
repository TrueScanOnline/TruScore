# Step 3: Complete Configuration Now
**Status:** Ready to Add Environment Variables

---

## ✅ WHAT YOU HAVE

1. ✅ **Neon Database** connected to `truscoreapi`
   - Connection string: `postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require`

2. ✅ **Vercel Blob Storage** connected to `truscoreapi`
   - Need to get the `BLOB_READ_WRITE_TOKEN`

---

## 🎯 STEP 1: Add POSTGRES_URL to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to **Vercel Dashboard** → Your Project (`truscoreapi`) → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `POSTGRES_URL`
4. **Value:** Paste this:
   ```
   postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Environment:** Select **Production** (check the box)
6. Click **"Save"**

### Option B: Vercel CLI

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel env add POSTGRES_URL production
```

When prompted, paste:
```
postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🎯 STEP 2: Get BLOB_READ_WRITE_TOKEN

1. Go to **Vercel Dashboard** → Your Project (`truscoreapi`) → **Storage** tab
2. Click on your **Blob store** (the one you just created)
3. Go to **Settings** tab (or look for "Token" or "Credentials")
4. **Copy the `BLOB_READ_WRITE_TOKEN`**
   - It looks like: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🎯 STEP 3: Add BLOB_READ_WRITE_TOKEN to Vercel

### Option A: Vercel Dashboard

1. Go to **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `BLOB_READ_WRITE_TOKEN`
4. **Value:** Paste the token you copied
5. **Environment:** Select **Production**
6. Click **"Save"**

### Option B: Vercel CLI

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel env add BLOB_READ_WRITE_TOKEN production
```

When prompted, paste your blob token.

---

## ✅ STEP 4: Verify Environment Variables

1. Go to **Settings** → **Environment Variables**
2. You should see:
   - ✅ `POSTGRES_URL` = `postgresql://neondb_owner:...`
   - ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_...`

---

## 🚀 STEP 5: Redeploy Backend

After adding both environment variables:

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

This will:
- Use the Neon Postgres database
- Use Vercel Blob for photo storage
- Make everything work!

---

## 📋 QUICK REFERENCE

**Connection String to Add:**
```
POSTGRES_URL=postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

**Blob Token:**
- Get from: Vercel Dashboard → Storage → Your Blob store → Settings
- Add as: `BLOB_READ_WRITE_TOKEN`

---

## ✅ DONE!

After redeploying, your backend will have:
- ✅ Persistent database (Neon Postgres)
- ✅ Photo storage (Vercel Blob)
- ✅ All user data saved globally!

---

**Status:** ⚠️ **Add environment variables, then redeploy**
