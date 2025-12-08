# Quick Environment Variables Setup

## ✅ What You Have

From your screenshots:
- ✅ **Neon Postgres** - Already created (TruScore)
- ✅ **Vercel Blob Storage** - Already created (TruScore)

## 🎯 What You Need to Do

### Step 1: Get the Values

**Neon Postgres (DATABASE_URL):**
1. On the Neon integration page
2. Click **"Show secret"** button (next to the code snippet)
3. Copy the **`DATABASE_URL`** value

**Vercel Blob (BLOB_READ_WRITE_TOKEN):**
1. Go to: **Settings → Environment Variables**
2. Check if `BLOB_READ_WRITE_TOKEN` already exists
3. If not, check Blob Store → Settings → Connection Details

### Step 2: Add to Vercel

**Option A: Interactive Script (Easiest)**
```bash
npm run setup-backend:env-vars
```

**Option B: Vercel Dashboard**
1. https://vercel.com/dashboard → truscoreapi → Settings → Environment Variables
2. Add `POSTGRES_URL` = (paste DATABASE_URL from Neon)
3. Add `BLOB_READ_WRITE_TOKEN` = (paste token from Blob Store)
4. Select **Production** environment
5. Save

### Step 3: Redeploy

```bash
cd backend/vercel
vercel --prod
cd ../..
```

### Step 4: Verify

```bash
npm run verify-backend
```

---

**Run Now:**
```bash
npm run setup-backend:env-vars
```

This will guide you through adding the environment variables!



