# Complete Configuration Guide
**Date:** December 2024  
**Status:** ✅ All Configuration Files Created

---

## ✅ CONFIGURATION COMPLETE

I've implemented all required configurations. Follow these steps to complete setup:

---

## 1. Open Food Facts Credentials (Recommended)

### Step 1: Create Open Food Facts Account
1. Go to https://world.openfoodfacts.org
2. Click "Sign Up" and create an account
3. **Important:** Note your username (not email) - this is your `user_id`

### Step 2: Add to Environment Variables

**Option A: Add to `.env` file (Recommended)**
Create or update `.env` in project root:
```env
EXPO_PUBLIC_OFF_USER_ID=your_off_username
EXPO_PUBLIC_OFF_PASSWORD=your_off_password
```

**Option B: Add to `app.config.js` (Already configured)**
The `app.config.js` already reads from environment variables:
```javascript
EXPO_PUBLIC_OFF_USER_ID: process.env.EXPO_PUBLIC_OFF_USER_ID || '',
EXPO_PUBLIC_OFF_PASSWORD: process.env.EXPO_PUBLIC_OFF_PASSWORD || '',
```

**Note:** Without credentials, submissions use anonymous mode (may have rate limits).

---

## 2. Vercel Backend URL Configuration

### Step 1: Deploy Backend to Vercel

```bash
cd backend/vercel
vercel --prod
```

**Note:** Vercel will show you the deployment URL (e.g., `https://truescan-backend.vercel.app`)

### Step 2: Update Environment Variable

**Add to `.env` file:**
```env
EXPO_PUBLIC_BACKEND_URL=https://your-actual-vercel-url.vercel.app
```

**Or update `src/config/backendConfig.ts`:**
```typescript
const defaultUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-actual-vercel-url.vercel.app';
```

**All service files now use centralized config:**
- ✅ `src/config/backendConfig.ts` - Single source of truth
- ✅ All services updated to use `getBackendUrl()`

---

## 3. Deploy Vercel APIs

### Step 1: Install Dependencies
```bash
cd backend/vercel
npm install
```

### Step 2: Deploy to Vercel
```bash
vercel --prod
```

### Step 3: Verify Deployment
Check that these endpoints are accessible:
- ✅ `https://your-url.vercel.app/api/manual-products`
- ✅ `https://your-url.vercel.app/api/user-prices`
- ✅ `https://your-url.vercel.app/api/upload-photo`
- ✅ `https://your-url.vercel.app/api/manufacturing-country`

**Test with curl:**
```bash
curl "https://your-url.vercel.app/api/manufacturing-country?barcode=1234567890123"
```

---

## 4. Photo Storage Implementation

### Option 1: Vercel Blob Storage (Recommended)

**Step 1: Enable Vercel Blob**
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Blob"
3. Copy the `BLOB_READ_WRITE_TOKEN`

**Step 2: Add to Vercel Environment Variables**
In Vercel Dashboard → Settings → Environment Variables:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

**Step 3: Deploy**
The code is already implemented in `upload-photo.ts` - just add the token!

### Option 2: Cloudinary (Alternative)

**Step 1: Create Cloudinary Account**
1. Go to https://cloudinary.com
2. Sign up for free account
3. Get your credentials from Dashboard

**Step 2: Add to Vercel Environment Variables**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Step 3: Install Package**
```bash
cd backend/vercel
npm install cloudinary
```

### Option 3: Base64 in Database (Development Only)
- Works automatically if no cloud storage configured
- **Not recommended for production** (database size limits)
- Good for testing/development

---

## 5. Persistent Database Setup

### Option 1: Vercel Postgres (Recommended)

**Step 1: Create Vercel Postgres Database**
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy the `POSTGRES_URL`

**Step 2: Add to Vercel Environment Variables**
```
POSTGRES_URL=postgres://user:password@host:port/database
```

**Step 3: Deploy**
The code is already implemented in `lib/database.ts` - tables will be created automatically!

**Tables Created:**
- ✅ `manufacturing_country_submissions`
- ✅ `manual_products`
- ✅ `user_prices`
- ✅ `photos`

### Option 2: MongoDB Atlas (Alternative)

**Step 1: Create MongoDB Atlas Account**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string

**Step 2: Add to Vercel Environment Variables**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan
```

**Step 3: Deploy**
The code is already implemented - collections created automatically!

### Option 3: In-Memory (Development Only)
- Works automatically if no database configured
- **Data lost on function restart**
- Good for testing only

---

## 📝 ENVIRONMENT VARIABLES SUMMARY

### Required for Mobile App (`.env`):
```env
# Vercel Backend URL (REQUIRED)
EXPO_PUBLIC_BACKEND_URL=https://your-vercel-url.vercel.app

# Open Food Facts Credentials (RECOMMENDED)
EXPO_PUBLIC_OFF_USER_ID=your_off_username
EXPO_PUBLIC_OFF_PASSWORD=your_off_password
```

### Required for Vercel Backend (Vercel Dashboard → Environment Variables):
```env
# Database (Choose ONE)
POSTGRES_URL=postgres://...  # OR
MONGODB_URI=mongodb+srv://...  # OR
# (Neither = in-memory fallback)

# Photo Storage (Choose ONE)
BLOB_READ_WRITE_TOKEN=vercel_blob_token  # OR
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
# (Neither = base64 in database)
```

---

## 🚀 QUICK START

### 1. Configure Environment Variables

**Create/Update `.env` in project root:**
```env
# Vercel Backend (update after deployment)
EXPO_PUBLIC_BACKEND_URL=https://YOUR-VERCEL-URL.vercel.app

# Open Food Facts (optional but recommended)
EXPO_PUBLIC_OFF_USER_ID=your_username
EXPO_PUBLIC_OFF_PASSWORD=your_password
```

### 2. Deploy Backend
```bash
cd backend/vercel
npm install
vercel --prod
```

**Copy the deployment URL** (e.g., `https://truescan-backend.vercel.app`)

### 3. Update Backend URL
Update `.env`:
```env
EXPO_PUBLIC_BACKEND_URL=https://truescan-backend.vercel.app
```

### 4. Configure Vercel Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

**For Database (choose one):**
- `POSTGRES_URL` (recommended)
- OR `MONGODB_URI`

**For Photo Storage (choose one):**
- `BLOB_READ_WRITE_TOKEN` (recommended)
- OR Cloudinary credentials

### 5. Redeploy Backend
```bash
cd backend/vercel
vercel --prod
```

---

## ✅ VERIFICATION

### Test Backend APIs:
```bash
# Test Manufacturing Country
curl "https://your-url.vercel.app/api/manufacturing-country?barcode=1234567890123"

# Test Manual Products
curl "https://your-url.vercel.app/api/manual-products?barcode=1234567890123"

# Test User Prices
curl "https://your-url.vercel.app/api/user-prices?barcode=1234567890123"
```

### Test Photo Upload:
```bash
curl -X POST "https://your-url.vercel.app/api/upload-photo" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "1234567890123",
    "imageType": "front",
    "imageBase64": "base64_encoded_image_here",
    "mimeType": "image/jpeg"
  }'
```

---

## 📊 CONFIGURATION STATUS

| Configuration | Status | Location |
|--------------|--------|----------|
| Open Food Facts Credentials | ⚠️ Needs Setup | `.env` or `app.config.js` |
| Vercel Backend URL | ⚠️ Needs Update | `.env` or `backendConfig.ts` |
| Vercel APIs Deployed | ⚠️ Needs Deployment | `backend/vercel` |
| Photo Storage | ⚠️ Needs Setup | Vercel Environment Variables |
| Persistent Database | ⚠️ Needs Setup | Vercel Environment Variables |

**Legend:**
- ✅ = Configured
- ⚠️ = Needs Setup
- ❌ = Not Configured

---

## 🎯 NEXT STEPS

1. ✅ **Configuration files created** - All code ready
2. ⏳ **Deploy backend** - Run `vercel --prod` in `backend/vercel`
3. ⏳ **Update backend URL** - Add to `.env`
4. ⏳ **Configure database** - Add `POSTGRES_URL` or `MONGODB_URI` to Vercel
5. ⏳ **Configure photo storage** - Add `BLOB_READ_WRITE_TOKEN` or Cloudinary to Vercel
6. ⏳ **Add OFF credentials** - Add to `.env` (optional but recommended)
7. ⏳ **Test submissions** - Verify all user data is shared globally

---

**Status:** ✅ All Code Implemented | ⚠️ Configuration Required  
**Ready for:** Deployment and Testing
