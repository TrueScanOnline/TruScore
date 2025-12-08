# Step 3: Configure Vercel Environment Variables
**Updated to Match Actual Vercel UI**

---

## 🎯 WHAT YOU SEE

You're on the **Vercel Storage** page with a "Browse Storage" modal open. You have two tabs:
- **"Create New"** (currently selected)
- **"Select Existing"**

---

## 📊 STEP 1: Create Database (Persistent Storage)

### What You See:
In the **"Marketplace Database Providers"** section, you'll see options like:
- **Neon** (Serverless Postgres) ← **RECOMMENDED**
- **Supabase** (Postgres backend)
- **Prisma Postgres** (Instant Serverless Postgres)
- And others...

### What to Do:

1. **Scroll down** in the "Marketplace Database Providers" section
2. **Click on "Neon"** (or "Supabase" if you prefer)
   - Neon is recommended because it's specifically "Serverless Postgres" and works great with Vercel
3. **Click "Continue"** button
4. Follow the setup wizard:
   - It will ask you to connect/create a Neon account
   - Create a new database
   - Copy the connection string (looks like: `postgres://user:password@host/database`)
5. **After Neon setup completes**, you'll get a connection string
6. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
7. **Add new variable:**
   - **Name:** `POSTGRES_URL`
   - **Value:** Paste the Neon connection string
   - **Environment:** Select **Production** (and Preview if you want)
8. **Click "Save"**

---

## 📸 STEP 2: Create Photo Storage (Blob Storage)

### What You See:
In the **"Create New"** section at the top, you'll see:
- **Edge Config** (Ultra-low latency reads)
- **Blob** (Fast object storage) ← **THIS IS WHAT YOU NEED**

### What to Do:

1. **Close the current modal** (click "Cancel" or outside the modal)
2. **Click "Create Database"** button again
3. In the **"Create New"** section, **click on "Blob"**
4. **Click "Continue"**
5. Follow the setup wizard:
   - Give it a name (e.g., "truescan-photos")
   - Create the Blob store
6. **After Blob setup completes**, you'll get a token
7. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
8. **Add new variable:**
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Paste the blob token
   - **Environment:** Select **Production**
9. **Click "Save"**

---

## ✅ STEP 3: Verify Environment Variables

1. **Go to:** Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. **You should see:**
   - ✅ `POSTGRES_URL` = (your Neon connection string)
   - ✅ `BLOB_READ_WRITE_TOKEN` = (your blob token)

---

## 🚀 STEP 4: Redeploy Backend

After adding both environment variables:

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

---

## 📋 QUICK REFERENCE

### Database Setup:
1. Storage page → Create Database
2. Browse Storage modal → Marketplace Database Providers
3. Click **"Neon"** (Serverless Postgres)
4. Continue → Setup → Get connection string
5. Settings → Environment Variables → Add `POSTGRES_URL`

### Photo Storage Setup:
1. Storage page → Create Database
2. Browse Storage modal → Create New section
3. Click **"Blob"** (Fast object storage)
4. Continue → Setup → Get token
5. Settings → Environment Variables → Add `BLOB_READ_WRITE_TOKEN`

---

## 🎯 ALTERNATIVE: If You Prefer Supabase

If you want to use **Supabase** instead of Neon:

1. In "Marketplace Database Providers", click **"Supabase"**
2. Follow the same steps as Neon
3. You'll still add `POSTGRES_URL` to environment variables (Supabase provides Postgres)

---

## ⚠️ IMPORTANT NOTES

- **Neon** and **Supabase** both provide Postgres databases - either works!
- **Blob** is Vercel's own object storage - perfect for photos
- You need **BOTH** (database + blob storage) for full functionality
- After adding environment variables, **always redeploy** with `vercel --prod`

---

**Status:** Ready to configure  
**Next:** Follow steps above to create Neon database and Blob storage
