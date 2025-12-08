# Complete Step 3: Final Instructions
**Status:** Ready to Add Environment Variables

---

## ✅ WHAT'S DONE

1. ✅ **Neon Database** connected to `truscoreapi`
2. ✅ **Vercel Blob Storage** connected to `truscoreapi`
3. ✅ **Code updated** to work with Neon Postgres (using `pg` library)
4. ✅ **Dependencies installed** (`pg` and `@types/pg`)

---

## 🎯 ADD ENVIRONMENT VARIABLES

### Step 1: Add POSTGRES_URL

1. Go to: **Vercel Dashboard** → Project `truscoreapi` → **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `POSTGRES_URL`
4. **Value:** 
   ```
   postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Environment:** ✅ **Production**
6. Click **"Save"**

### Step 2: Get BLOB Token

1. Go to: **Vercel Dashboard** → Project `truscoreapi` → **Storage** tab
2. Click on your **Blob store**
3. Find **"Settings"** or **"Token"** section
4. **Copy the `BLOB_READ_WRITE_TOKEN`**

### Step 3: Add BLOB_READ_WRITE_TOKEN

1. Go to: **Settings** → **Environment Variables**
2. Click **"Add New"**
3. **Name:** `BLOB_READ_WRITE_TOKEN`
4. **Value:** Paste the token
5. **Environment:** ✅ **Production**
6. Click **"Save"**

---

## ✅ VERIFY

Go to **Settings** → **Environment Variables**

You should see:
- ✅ `POSTGRES_URL` = `postgresql://neondb_owner:...`
- ✅ `BLOB_READ_WRITE_TOKEN` = `vercel_blob_rw_...`

---

## 🚀 REDEPLOY

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

---

## ✅ DONE!

After redeploying:
- ✅ **Database:** Neon Postgres (persistent, all user data saved)
- ✅ **Photos:** Vercel Blob (CDN, fast image access)
- ✅ **All user submissions shared globally!**

---

**Next:** Add the 2 environment variables, then redeploy!
