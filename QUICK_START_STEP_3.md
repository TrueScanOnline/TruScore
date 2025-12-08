# Quick Start: Step 3 Configuration
**Matches Your Actual Vercel UI**

---

## 🎯 YOU ARE HERE

You're on the Vercel Storage page with "Browse Storage" modal open.

---

## ⚡ QUICK STEPS

### 1️⃣ CREATE DATABASE (2 minutes)

**In the "Browse Storage" modal:**
1. Scroll to **"Marketplace Database Providers"** section
2. Click **"Neon"** (says "Serverless Postgres")
3. Click **"Continue"**
4. Follow setup → Get connection string
5. Go to **Settings** → **Environment Variables**
6. Add: `POSTGRES_URL` = (paste connection string)

### 2️⃣ CREATE PHOTO STORAGE (2 minutes)

**Back on Storage page:**
1. Click **"Create Database"** button again
2. In **"Create New"** section, click **"Blob"**
3. Click **"Continue"**
4. Follow setup → Get token
5. Go to **Settings** → **Environment Variables**
6. Add: `BLOB_READ_WRITE_TOKEN` = (paste token)

### 3️⃣ REDEPLOY (1 minute)

```powershell
cd c:\TrueScan-FoodScanner\backend\vercel
vercel --prod
```

---

## ✅ DONE!

That's it! Your backend now has:
- ✅ Persistent database (Neon Postgres)
- ✅ Photo storage (Vercel Blob)

---

**Need more detail?** See `VERCEL_UI_STEP_BY_STEP.md`
