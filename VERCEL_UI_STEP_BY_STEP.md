# Vercel Storage Setup - Step by Step
**Matches Actual Vercel UI Screenshots**

---

## 🎯 CURRENT SITUATION

You're on the Vercel Storage page with the "Browse Storage" modal open. You see:
- **Tab:** "Create New" (selected)
- **Top section:** Edge Config, Blob
- **Bottom section:** Marketplace Database Providers (Neon, Supabase, etc.)

---

## 📊 PART 1: CREATE DATABASE (Neon Postgres)

### Step-by-Step:

1. **In the "Marketplace Database Providers" section**, scroll to find **"Neon"**
   - It says "Serverless Postgres"

2. **Click on "Neon"** (the card/button)

3. **Click "Continue"** button at bottom

4. **Follow Neon setup:**
   - If you don't have a Neon account, it will ask you to sign up (free)
   - Create a new project/database
   - Choose a region (closest to your users)
   - Neon will create the database

5. **After setup, Neon will show you a connection string:**
   - Looks like: `postgres://user:password@ep-xxx-xxx.region.neon.tech/dbname?sslmode=require`
   - **COPY THIS STRING** (you'll need it)

6. **Close the Neon setup window/modal**

7. **In Vercel Dashboard:**
   - Go to: **Settings** → **Environment Variables**
   - Click **"Add New"**
   - **Name:** `POSTGRES_URL`
   - **Value:** Paste the Neon connection string you copied
   - **Environment:** Select **Production** (check the box)
   - Click **"Save"**

✅ **Database configured!**

---

## 📸 PART 2: CREATE PHOTO STORAGE (Vercel Blob)

### Step-by-Step:

1. **Go back to Storage page** (if you left it)
   - Vercel Dashboard → Your Project → **Storage** tab

2. **Click "Create Database"** button again

3. **In the "Browse Storage" modal:**
   - Make sure **"Create New"** tab is selected
   - In the **top section**, find **"Blob"**
   - It says "Fast object storage"

4. **Click on "Blob"** (the card/button)

5. **Click "Continue"** button

6. **Follow Blob setup:**
   - Give it a name (e.g., "truescan-photos" or just "photos")
   - Create the Blob store
   - Vercel will create it

7. **After setup, Vercel will show you a token:**
   - Looks like: `vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **COPY THIS TOKEN** (you'll need it)

8. **Close the Blob setup window/modal**

9. **In Vercel Dashboard:**
   - Go to: **Settings** → **Environment Variables**
   - Click **"Add New"**
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Paste the blob token you copied
   - **Environment:** Select **Production** (check the box)
   - Click **"Save"**

✅ **Photo storage configured!**

---

## ✅ PART 3: VERIFY

1. **Go to:** Settings → **Environment Variables**

2. **You should see:**
   ```
   POSTGRES_URL = postgres://... (from Neon)
   BLOB_READ_WRITE_TOKEN = vercel_blob_rw_... (from Blob)
   ```

3. **If both are there, you're done!**

---

## 🚀 PART 4: REDEPLOY

After adding environment variables, redeploy:

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

This will:
- Use the new database (Neon Postgres)
- Use the new photo storage (Vercel Blob)
- Make everything work!

---

## 🎯 VISUAL GUIDE

**What you see in "Browse Storage" modal:**

```
┌─────────────────────────────────────┐
│ Browse Storage                      │
├─────────────────────────────────────┤
│ [Create New] [Select Existing]     │
├─────────────────────────────────────┤
│ Create New:                         │
│  • Edge Config                      │
│  • Blob ← CLICK THIS FOR PHOTOS    │
├─────────────────────────────────────┤
│ Marketplace Database Providers:    │
│  • Neon (Serverless Postgres)       │
│    ← CLICK THIS FOR DATABASE        │
│  • Supabase (Postgres backend)      │
│  • Prisma Postgres                  │
│  • ... (more options)               │
└─────────────────────────────────────┘
```

---

## ⚠️ TROUBLESHOOTING

**Q: I don't see Neon in the list**
- Scroll down in "Marketplace Database Providers"
- Or search for "Neon" in the search box (if available)

**Q: I don't see Blob in "Create New"**
- Make sure you're on the "Create New" tab (not "Select Existing")
- Blob should be in the top section

**Q: After setup, where do I find the connection string/token?**
- **Neon:** Go to Neon dashboard → Your project → Connection string
- **Blob:** Go to Vercel Storage page → Click on your Blob store → Settings → Token

**Q: Can I use Supabase instead of Neon?**
- Yes! Click "Supabase" instead of "Neon"
- Same process, still add `POSTGRES_URL` to environment variables

---

**Status:** Ready to configure  
**Follow the steps above - they match your actual Vercel UI!**
