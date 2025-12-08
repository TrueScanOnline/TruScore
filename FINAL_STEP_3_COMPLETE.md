# Final Step 3: Complete Configuration
**Status:** Ready to Add Environment Variables

---

## ✅ WHAT YOU HAVE

1. ✅ **Neon Database** connected to `truscoreapi`
   - Connection string ready

2. ✅ **Vercel Blob Storage** connected to `truscoreapi`
   - Need to get the token

---

## 🎯 STEP 1: Add POSTGRES_URL

### In Vercel Dashboard:

1. Go to: **Vercel Dashboard** → Your Project (`truscoreapi`) → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `POSTGRES_URL`
4. **Value:** Paste this:
   ```
   postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Environment:** Select **Production** ✅
6. Click **"Save"**

---

## 🎯 STEP 2: Get BLOB_READ_WRITE_TOKEN

1. Go to: **Vercel Dashboard** → Your Project (`truscoreapi`) → **Storage** tab
2. Click on your **Blob store** (the one you created)
3. Look for **"Settings"** or **"Token"** or **"Credentials"**
4. **Copy the `BLOB_READ_WRITE_TOKEN`**
   - It looks like: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🎯 STEP 3: Add BLOB_READ_WRITE_TOKEN

1. Go to: **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `BLOB_READ_WRITE_TOKEN`
4. **Value:** Paste the token you copied
5. **Environment:** Select **Production** ✅
6. Click **"Save"**

---

## ✅ STEP 4: Verify

Go to **Settings** → **Environment Variables**

You should see:
- ✅ `POSTGRES_URL` = `postgresql://neondb_owner:...`
- ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_...`

---

## 🚀 STEP 5: Redeploy

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
npm install
vercel --prod
```

**Note:** I've updated the code to work with Neon Postgres using the `pg` library.

---

## ✅ DONE!

After redeploying:
- ✅ Database: Neon Postgres (persistent)
- ✅ Photos: Vercel Blob (CDN)
- ✅ All user data saved globally!

---

**Status:** ⚠️ **Add environment variables, then redeploy**
