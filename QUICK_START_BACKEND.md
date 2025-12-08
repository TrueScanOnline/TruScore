# Quick Start - Backend Configuration

## 🚀 Fast Setup (5 Minutes)

### 1. Deploy Backend (2 minutes)

```bash
cd backend/vercel
npm install -g vercel  # If not installed
vercel login
vercel --prod
```

**Copy the URL** (e.g., `https://truescan-backend-abc123.vercel.app`)

---

### 2. Set Backend URL (30 seconds)

Create `.env` file in project root:
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app
```

---

### 3. Add Database (1 minute)

**Vercel Dashboard** → Your Project → **Storage** → **Create Database** → **Postgres**

Copy connection string, then:
**Settings** → **Environment Variables** → Add:
```
POSTGRES_URL=postgres://...
```

---

### 4. Add Photo Storage (1 minute)

**Vercel Dashboard** → **Storage** → **Create Database** → **Blob**

Copy token, then:
**Settings** → **Environment Variables** → Add:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

### 5. Redeploy & Verify (30 seconds)

```bash
cd backend/vercel
vercel --prod
cd ../..
npm run verify-backend
```

---

## ✅ Done!

You should now see:
```
✅ Backend URL Configuration
✅ Database Configuration  
✅ Photo Storage Configuration
✅ API Endpoints

Summary: 4 passed, 0 warnings, 0 failed
```

---

**Need Help?** See `BACKEND_SETUP_GUIDE.md` for detailed instructions.

