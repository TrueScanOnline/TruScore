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

### Option 1: Postgres (Neon / Vercel Postgres / Supabase)

The server reads **`DATABASE_URL` OR `POSTGRES_URL`** (see `lib/database.ts`). Neon integrations often expose only **`DATABASE_URL`** — add that name in Vercel if that is what your host provides.

```
POSTGRES_URL=postgres://user:password@host:port/database
```
or
```
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
```

**How to get:**
1. Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres" (or use Neon and paste `DATABASE_URL`)
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

- **Database:** Choose ONE (Postgres OR MongoDB). Required so **`manual_products`** and **`photos`** rows survive after each serverless invocation.
- **Photo Storage:** Choose ONE (Vercel Blob OR Cloudinary). Required for **HTTPS** image URLs. The mobile app shares photos with **other users only when the URL is `http(s)`** — not raw `data:` strings.
- If neither database is configured, the API uses in-memory storage (**data lost on restart** — not acceptable for production).
- If neither Blob nor Cloudinary is configured, uploads may fall back to **base64 `data:`** URLs (**other users may not see the hero image**).

### Plain-language: what “BLOB_READ_WRITE_TOKEN” is

It is a **secret key** Vercel gives you when you attach **Blob** storage to your project. Your `/api/upload-photo` route uses it to store the JPEG/PNG in **blob storage** and return a **permanent `https://...`** link. That link is what gets saved in Postgres and what every phone loads when someone else scans the same barcode. **You create the Blob store and token in the Vercel dashboard**; the code already knows how to use it when the variable is present.

---

## AFTER ADDING VARIABLES

From repo root (or use your existing script):

```powershell
cd backend/vercel
npm run sync-truescan-src
npx vercel --prod
```

Then verify (uses production URL `https://truscoreapi.vercel.app` unless `EXPO_PUBLIC_BACKEND_URL` is set):

```bash
cd ../..
yarn verify-backend
```

**PowerShell gate before deploy:** `.\scripts\check-vercel-env.ps1 -RequirePhotoCdn` (fails if DB or Blob/Cloudinary missing).
