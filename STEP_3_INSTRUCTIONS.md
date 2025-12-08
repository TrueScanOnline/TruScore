# Step 3: Configure Vercel Environment Variables
**Status:** Ready to Configure

---

## ✅ WHAT'S DONE

1. ✅ **Step 1:** Backend deployed (you confirmed)
2. ✅ **Step 2:** Open Food Facts credentials added to `.env`:
   - Username: `crwmlw`
   - Password: `Lm996849!`

---

## 🎯 STEP 3: Configure Vercel Environment Variables

You need to add **2 types** of environment variables:

### 1. Database (Choose ONE)

**Option A: Vercel Postgres (Recommended)**
1. Go to **Vercel Dashboard** → Your Project → **Storage**
2. Click **"Create Database"** → Select **"Postgres"**
3. Copy the connection string (starts with `postgres://`)
4. Go to **Settings** → **Environment Variables**
5. Add new variable:
   - **Name:** `POSTGRES_URL`
   - **Value:** Paste the connection string
   - **Environment:** Production (and Preview if you want)
6. Click **Save**

**Option B: MongoDB Atlas**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string from Atlas dashboard
4. In Vercel → **Settings** → **Environment Variables**
5. Add: `MONGODB_URI` = `mongodb+srv://user:password@cluster.mongodb.net/truescan`

### 2. Photo Storage (Choose ONE)

**Option A: Vercel Blob Storage (Recommended)**
1. Go to **Vercel Dashboard** → Your Project → **Storage**
2. Click **"Create Database"** → Select **"Blob"**
3. Copy the `BLOB_READ_WRITE_TOKEN`
4. Go to **Settings** → **Environment Variables**
5. Add new variable:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Paste the token
   - **Environment:** Production
6. Click **Save**

**Option B: Cloudinary**
1. Create account at https://cloudinary.com
2. Get credentials from Dashboard
3. In Vercel → **Settings** → **Environment Variables**
4. Add 3 variables:
   - `CLOUDINARY_CLOUD_NAME` = (your cloud name)
   - `CLOUDINARY_API_KEY` = (your API key)
   - `CLOUDINARY_API_SECRET` = (your API secret)

---

## 🚀 ALTERNATIVE: Use Automated Script

I've created a script to help you:

```powershell
cd c:\TrueScan-FoodScanner
.\scripts\completeStep3Configuration.ps1
```

This script will:
- Guide you through database setup
- Guide you through photo storage setup
- Add environment variables via Vercel CLI

---

## ✅ VERIFICATION

After adding environment variables:

1. **Check variables are set:**
   ```powershell
   cd backend\vercel
   vercel env ls
   ```

2. **Redeploy backend:**
   ```powershell
   vercel --prod
   ```

3. **Test API:**
   ```powershell
   curl "https://your-vercel-url.vercel.app/api/manufacturing-country?barcode=1234567890123"
   ```

---

## 📋 QUICK REFERENCE

### Required Variables:

**Database (Choose ONE):**
- `POSTGRES_URL` (recommended)
- OR `MONGODB_URI`

**Photo Storage (Choose ONE):**
- `BLOB_READ_WRITE_TOKEN` (recommended)
- OR Cloudinary credentials (3 variables)

### Notes:
- If no database → Uses in-memory (data lost on restart)
- If no photo storage → Uses base64 in database (not recommended for production)

---

## 🎯 RECOMMENDED SETUP

**For Production:**
1. ✅ **Vercel Postgres** (database)
2. ✅ **Vercel Blob Storage** (photos)

**Why:**
- Native Vercel services
- Easy setup in dashboard
- Free tier available
- Automatic backups

---

**Status:** ⚠️ **Needs Configuration**  
**Next:** Add environment variables in Vercel Dashboard, then redeploy
