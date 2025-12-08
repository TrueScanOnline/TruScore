# Step 3: Configure Vercel Environment Variables
**Status:** Ready to Configure  
**⚠️ UPDATED TO MATCH ACTUAL VERCEL UI**

---

## 🎯 WHAT YOU NEED

You need to configure **2 types** of environment variables in Vercel:

1. **Database** (Choose ONE):
   - **Neon** (Serverless Postgres) - **RECOMMENDED** - Available in Marketplace
   - OR **Supabase** (Postgres backend) - Available in Marketplace
   - OR MongoDB Atlas (external setup)

2. **Photo Storage** (Choose ONE):
   - **Vercel Blob** (Fast object storage) - **RECOMMENDED** - Available in "Create New"
   - OR Cloudinary (external setup)

---

## 🚀 METHOD 1: Vercel Dashboard (Easiest)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your **TrueScan backend project**
3. Go to **Storage** tab (you're already here!)

### Step 2: Create Database (Neon Postgres)

**What You See:**
- You're on the Storage page with "Browse Storage" modal
- In **"Marketplace Database Providers"** section, you'll see **Neon** (Serverless Postgres)

**What to Do:**
1. In the **"Marketplace Database Providers"** section, click on **"Neon"**
2. Click **"Continue"** button
3. Follow Neon setup wizard:
   - Sign up/login to Neon (free account)
   - Create a new database/project
   - Choose region
4. **After setup, copy the connection string** (looks like `postgres://user:password@host/database`)
5. Go to **Settings** → **Environment Variables**
6. Click **"Add New"**
7. Name: `POSTGRES_URL`
8. Value: Paste the Neon connection string
9. Environment: Select **Production**
10. Click **Save**

**Option B: MongoDB Atlas**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string from Atlas dashboard
4. In Vercel → **Settings** → **Environment Variables**
5. Add: `MONGODB_URI` = `mongodb+srv://user:password@cluster.mongodb.net/truescan`

### Step 3: Create Photo Storage (Vercel Blob)

**What You See:**
- Back on Storage page, click **"Create Database"** again
- In **"Create New"** section (top), you'll see **"Blob"** (Fast object storage)

**What to Do:**
1. Click on **"Blob"** in the "Create New" section
2. Click **"Continue"** button
3. Follow Blob setup wizard:
   - Give it a name (e.g., "truescan-photos")
   - Create the Blob store
4. **After setup, copy the `BLOB_READ_WRITE_TOKEN`** (looks like `vercel_blob_rw_xxxxx`)
5. Go to **Settings** → **Environment Variables**
6. Click **"Add New"**
7. Name: `BLOB_READ_WRITE_TOKEN`
8. Value: Paste the blob token
9. Environment: Select **Production**
10. Click **Save**

**Option B: Cloudinary**
1. Create account at https://cloudinary.com
2. Get credentials from Dashboard
3. In Vercel → **Settings** → **Environment Variables**
4. Add:
   - `CLOUDINARY_CLOUD_NAME` = (your cloud name)
   - `CLOUDINARY_API_KEY` = (your API key)
   - `CLOUDINARY_API_SECRET` = (your API secret)

---

## 🖥️ METHOD 2: Vercel CLI

### Step 1: Navigate to Backend
```powershell
cd backend\vercel
```

### Step 2: Add Database Variable

**For Postgres:**
```powershell
vercel env add POSTGRES_URL production
```
When prompted, paste your Postgres connection string.

**For MongoDB:**
```powershell
vercel env add MONGODB_URI production
```
When prompted, paste your MongoDB connection string.

### Step 3: Add Photo Storage Variable

**For Vercel Blob:**
```powershell
vercel env add BLOB_READ_WRITE_TOKEN production
```
When prompted, paste your blob token.

**For Cloudinary:**
```powershell
vercel env add CLOUDINARY_CLOUD_NAME production
vercel env add CLOUDINARY_API_KEY production
vercel env add CLOUDINARY_API_SECRET production
```
When prompted, paste each value.

---

## 🎯 METHOD 3: Automated Script

I've created a script to help you configure these:

```powershell
cd c:\TrueScan-FoodScanner
.\scripts\configureVercelEnv.ps1
```

**Note:** The script will guide you through the process. You'll need to provide:
- Database connection string (Postgres or MongoDB)
- Photo storage credentials (Blob token or Cloudinary)

---

## ✅ VERIFICATION

After adding environment variables:

1. **List variables:**
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

## 📝 QUICK REFERENCE

### Required Variables (Choose ONE from each category):

**Database:**
- `POSTGRES_URL` (recommended)
- OR `MONGODB_URI`

**Photo Storage:**
- `BLOB_READ_WRITE_TOKEN` (recommended)
- OR `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`

### Optional:
- If neither database is set → Uses in-memory (data lost on restart)
- If neither photo storage is set → Uses base64 in database (not recommended for production)

---

## 🎯 RECOMMENDED SETUP

**For Production:**
1. ✅ Vercel Postgres (database)
2. ✅ Vercel Blob Storage (photos)

**Why:**
- Both are native Vercel services
- Easy to set up
- Integrated with Vercel dashboard
- Automatic backups
- Free tier available

---

**Status:** ⚠️ **Needs Configuration**  
**Next:** Add environment variables, then redeploy
