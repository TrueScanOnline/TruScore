# Backend Setup Guide - TrueScan Food Scanner

## Current Status

The verification script shows that the backend is **not yet configured**. This is expected if you haven't deployed the backend yet.

## What Needs to Be Done

### Step 1: Deploy Backend to Vercel

1. **Navigate to backend directory:**
   ```bash
   cd backend/vercel
   ```

2. **Install Vercel CLI (if not already installed):**
   ```bash
   npm install -g vercel
   ```

3. **Login to Vercel:**
   ```bash
   vercel login
   ```

4. **Deploy backend:**
   ```bash
   vercel --prod
   ```

5. **Copy the deployment URL** (e.g., `https://truescan-backend-xyz.vercel.app`)

---

### Step 2: Configure Backend URL in App

**Option A: Environment Variable (Recommended)**

Create a `.env` file in the project root:
```env
EXPO_PUBLIC_BACKEND_URL=https://your-actual-backend-url.vercel.app
```

**Option B: Update Default URL**

Edit `src/config/backendConfig.ts`:
```typescript
const defaultUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-actual-backend-url.vercel.app';
```

---

### Step 3: Configure Database in Vercel

1. **Go to Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add Database (Choose ONE):**

   **Option 1: Vercel Postgres (Recommended)**
   ```
   POSTGRES_URL=postgres://user:password@host:port/database?sslmode=require
   ```
   
   **How to get:**
   - Vercel Dashboard → Your Project → **Storage**
   - Click **"Create Database"** → Select **"Postgres"**
   - Copy the connection string

   **Option 2: MongoDB Atlas**
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan
   ```
   
   **How to get:**
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string from Atlas dashboard

---

### Step 4: Configure Photo Storage in Vercel

**Add Photo Storage (Choose ONE):**

**Option 1: Vercel Blob Storage (Recommended)**
```
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

**How to get:**
- Vercel Dashboard → Your Project → **Storage**
- Click **"Create Database"** → Select **"Blob"**
- Copy the `BLOB_READ_WRITE_TOKEN`

**Option 2: Cloudinary**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get:**
- Create account at https://cloudinary.com
- Get credentials from Dashboard

---

### Step 5: Redeploy Backend

After adding environment variables, redeploy:

```bash
cd backend/vercel
vercel --prod
```

---

### Step 6: Verify Configuration

Run the verification script again:

```bash
npm run verify-backend
```

**Expected Output (After Configuration):**
```
✅ Backend URL Configuration
   Backend is accessible at https://your-backend.vercel.app

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

## Quick Setup Checklist

- [ ] Deploy backend to Vercel
- [ ] Copy backend URL
- [ ] Set `EXPO_PUBLIC_BACKEND_URL` in `.env` or `backendConfig.ts`
- [ ] Add `POSTGRES_URL` or `MONGODB_URI` in Vercel environment variables
- [ ] Add `BLOB_READ_WRITE_TOKEN` or Cloudinary credentials in Vercel
- [ ] Redeploy backend
- [ ] Run `npm run verify-backend` to confirm

---

## Troubleshooting

### Issue: "Backend URL is not configured"

**Solution**: Set `EXPO_PUBLIC_BACKEND_URL` in `.env` file or update `src/config/backendConfig.ts`

### Issue: "Database may not be configured"

**Solution**: Add `POSTGRES_URL` or `MONGODB_URI` in Vercel Dashboard → Settings → Environment Variables

### Issue: "Photo storage may not be configured"

**Solution**: Add `BLOB_READ_WRITE_TOKEN` or Cloudinary credentials in Vercel Dashboard

### Issue: "API Endpoints return 404"

**Solution**: 
1. Ensure backend is deployed: `cd backend/vercel && vercel --prod`
2. Check backend URL is correct
3. Verify environment variables are set in Vercel

---

## Environment Variables Summary

### Required for Production

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API URL | `.env` file or `backendConfig.ts` |
| `POSTGRES_URL` OR `MONGODB_URI` | Database connection | Vercel Dashboard |
| `BLOB_READ_WRITE_TOKEN` OR Cloudinary credentials | Photo storage | Vercel Dashboard |

### Optional (Recommended)

| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `OFF_USERNAME` | Open Food Facts username | Vercel Dashboard |
| `OFF_PASSWORD` | Open Food Facts password | Vercel Dashboard |

---

## Next Steps

1. **Deploy Backend**: Follow Step 1 above
2. **Configure Environment**: Follow Steps 2-4 above
3. **Verify**: Run `npm run verify-backend`
4. **Test**: Run `npm run test:user-contributions`

Once configured, the verification script will show all green checkmarks ✅

---

**Status**: ⚠️ **Backend not yet configured** (expected for new setup)  
**Action Required**: Follow the steps above to configure backend

