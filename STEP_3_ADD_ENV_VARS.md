# Step 3: Add Environment Variables
**Status:** Ready - Both Neon and Blob Connected!

---

## ✅ WHAT YOU HAVE

1. ✅ **Neon Database** connected to `truscoreapi`
2. ✅ **Vercel Blob Storage** connected to `truscoreapi`

---

## 🎯 ADD POSTGRES_URL

### In Vercel Dashboard:

1. Go to: **Vercel Dashboard** → Project `truscoreapi` → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `POSTGRES_URL`
4. **Value:** 
   ```
   postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Environment:** ✅ **Production** (check the box)
6. Click **"Save"**

---

## 🎯 GET BLOB TOKEN

1. Go to: **Vercel Dashboard** → Project `truscoreapi` → **Storage** tab
2. Click on your **Blob store** (the one you created)
3. Look for **"Settings"** or **"Token"** or **"Credentials"** tab
4. **Copy the `BLOB_READ_WRITE_TOKEN`**
   - Format: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🎯 ADD BLOB_READ_WRITE_TOKEN

1. Go to: **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `BLOB_READ_WRITE_TOKEN`
4. **Value:** Paste the token you copied
5. **Environment:** ✅ **Production** (check the box)
6. Click **"Save"**

---

## ✅ VERIFY

Go to **Settings** → **Environment Variables**

You should see:
- ✅ `POSTGRES_URL` = `postgresql://neondb_owner:...`
- ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_...`

---

## 🚀 REDEPLOY

After adding both variables:

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

**Note:** I've updated the code to work with Neon Postgres. The `pg` library is already installed.

---

## ✅ DONE!

After redeploying:
- ✅ Database: Neon Postgres (persistent, all user data saved)
- ✅ Photos: Vercel Blob (CDN, fast image access)
- ✅ All user submissions shared globally!

---

**Status:** ⚠️ **Add the 2 environment variables, then redeploy**
