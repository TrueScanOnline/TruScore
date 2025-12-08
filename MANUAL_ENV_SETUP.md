# Manual Environment Variables Setup

## ✅ Quick Setup (Recommended)

Since the CLI method requires project linking, the **easiest way** is to add them directly in the Vercel Dashboard:

### Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Click on your project: **truscoreapi**
3. Go to: **Settings** → **Environment Variables**

### Step 2: Add POSTGRES_URL

1. Click **"Add New"** button
2. Fill in:
   - **Key:** `POSTGRES_URL`
   - **Value:** `postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require`
   - **Environment:** Select **"Production"** (and optionally "Preview", "Development")
3. Click **"Save"**

### Step 3: Add BLOB_READ_WRITE_TOKEN

1. Click **"Add New"** button again
2. Fill in:
   - **Key:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** `vercel_blob_rw_cNcNogtFCGginHBs_9VYgB9gjW4HnFSzTpZ3sIyK9U0MOVD`
   - **Environment:** Select **"Production"** (and optionally "Preview", "Development")
3. Click **"Save"**

### Step 4: Redeploy Backend

After adding the environment variables, redeploy:

```bash
cd backend/vercel
vercel --prod
```

Or use the automated script:

```bash
npm run setup-backend:final
```

### Step 5: Verify

```bash
npm run verify-backend
```

---

## 📋 Environment Variables Summary

| Variable | Value |
|----------|-------|
| `POSTGRES_URL` | `postgresql://neondb_owner:npg_3knzStHJMac1@ep-spring-union-a7fcjuim-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require` |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_cNcNogtFCGginHBs_9VYgB9gjW4HnFSzTpZ3sIyK9U0MOVD` |

**Both should be set for Production environment.**

---

## ✅ Expected Result

After adding environment variables and redeploying:

1. ✅ Environment variables configured
2. ✅ Backend redeployed with new variables
3. ✅ Database connection working
4. ✅ Photo storage working
5. ✅ All API endpoints accessible

**Verification should show:**
```
✅ Backend URL Configuration
✅ Database Configuration
✅ Photo Storage Configuration
✅ API Endpoints (all 4 passing)
```

---

## 🚀 Quick Commands

**Add environment variables manually, then:**
```bash
npm run setup-backend:final
```

This will redeploy and verify everything.



