# Vercel Backend Environment Variables
**Add these in Vercel Dashboard → Settings → Environment Variables**

---

## OPTIONAL — Product preview / shared pillars (Node)

When `/api/product-preview` runs the same TruScore pillar code as the app, there is no Expo device locale. Packaging recyclability and country-specific additive rules use `getUserCountryCode()`; on Vercel that resolves from:

```
TRUESCAN_DEFAULT_COUNTRY_CODE=NZ
```

Use an ISO 3166-1 alpha-2 code (e.g. `AU`, `GB`, `US`). Omit to fall back to neutral/global behaviour where the code supports it.

---

## REQUIRED (Choose Database)

### Option 1: Vercel Postgres (Recommended)
```
POSTGRES_URL=postgres://user:password@host:port/database
```

**How to get:**
1. Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy the connection string

---

### Option 2: MongoDB Atlas (Alternative)
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan
```

**How to get:**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string from Atlas dashboard

---

## REQUIRED (Choose Photo Storage)

### Option 1: Vercel Blob Storage (Recommended)
```
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

**How to get:**
1. Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Blob"
3. Copy the `BLOB_READ_WRITE_TOKEN`

---

### Option 2: Cloudinary (Alternative)
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to get:**
1. Create account at https://cloudinary.com
2. Get credentials from Dashboard

---

## NOTES

- **Database:** Choose ONE (Postgres OR MongoDB)
- **Photo Storage:** Choose ONE (Vercel Blob OR Cloudinary)
- If neither database is configured, uses in-memory storage (data lost on restart)
- If neither photo storage is configured, uses base64 in database (not recommended for production)

---

## AFTER ADDING VARIABLES

Redeploy backend:
```bash
cd backend/vercel
vercel --prod
```
