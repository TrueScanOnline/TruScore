# Backend Configuration Verification Scripts

This directory contains scripts to verify that the backend is properly configured for production use.

## Scripts

### 1. `verify-backend-config.ts`

TypeScript script that verifies backend configuration by:
- Checking if backend URL is configured and accessible
- Testing database connectivity
- Testing photo storage configuration
- Verifying API endpoints are accessible

**Usage:**
```bash
npm run verify-backend
```

**Requirements:**
- `ts-node` installed: `npm install -g ts-node` or `npm install --save-dev ts-node`
- Backend must be deployed to Vercel
- Backend URL must be configured in `src/config/backendConfig.ts`

---

### 2. `check-vercel-env.sh` (Linux/Mac)

Bash script that checks Vercel environment variables.

**Usage:**
```bash
chmod +x scripts/check-vercel-env.sh
./scripts/check-vercel-env.sh
```

**Requirements:**
- Vercel CLI installed: `npm i -g vercel`
- Logged in to Vercel: `vercel login`
- In project directory with Vercel project linked

---

### 3. `check-vercel-env.ps1` (Windows)

PowerShell script that checks Vercel environment variables.

**Usage:**
```powershell
.\scripts\check-vercel-env.ps1
```

**Requirements:**
- Vercel CLI installed: `npm i -g vercel`
- Logged in to Vercel: `vercel login`
- In project directory with Vercel project linked

---

## What Gets Checked

### Required (Critical for Production)

1. **Database Configuration**
   - `POSTGRES_URL` OR `MONGODB_URI` must be set
   - Without this, backend uses in-memory storage (data lost on restart)

### Recommended (For Full Functionality)

2. **Photo Storage Configuration**
   - `BLOB_READ_WRITE_TOKEN` (Vercel Blob) OR
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary)
   - Without this, large photos may fail to upload

3. **Open Food Facts Credentials** (Optional)
   - `OFF_USERNAME` and `OFF_PASSWORD`
   - Enhances global data sharing

---

## Setting Up Environment Variables

### In Vercel Dashboard

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Database (Choose ONE)

**Option 1: Vercel Postgres (Recommended)**
```
POSTGRES_URL=postgres://user:password@host:port/database?sslmode=require
```

**Option 2: MongoDB Atlas**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/truescan
```

#### Photo Storage (Choose ONE)

**Option 1: Vercel Blob Storage (Recommended)**
```
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here
```

**Option 2: Cloudinary**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Open Food Facts (Optional)
```
OFF_USERNAME=your_username
OFF_PASSWORD=your_password
```

### After Adding Variables

Redeploy the backend:
```bash
cd backend/vercel
vercel --prod
```

---

## Running Tests

### Automated Tests

Run integration tests for user contribution system:
```bash
npm run test:user-contributions
```

### Manual Verification

1. **Check Environment Variables:**
   ```bash
   # Linux/Mac
   ./scripts/check-vercel-env.sh
   
   # Windows
   .\scripts\check-vercel-env.ps1
   ```

2. **Verify Backend Configuration:**
   ```bash
   npm run verify-backend
   ```

3. **Test End-to-End:**
   - Use two devices (User A and User B)
   - User A submits data (manual product, country, photo)
   - User B scans same barcode
   - Verify User B sees User A's data

---

## Troubleshooting

### Issue: "Backend URL is not configured"

**Solution:**
1. Set `EXPO_PUBLIC_BACKEND_URL` in your `.env` file
2. Or update `getBackendUrl()` default in `src/config/backendConfig.ts`

### Issue: "Database may not be configured"

**Solution:**
1. Add `POSTGRES_URL` or `MONGODB_URI` in Vercel dashboard
2. Redeploy backend: `cd backend/vercel && vercel --prod`

### Issue: "Photo storage may not be configured"

**Solution:**
1. Add `BLOB_READ_WRITE_TOKEN` or Cloudinary credentials in Vercel dashboard
2. Redeploy backend

### Issue: "Backend is not accessible"

**Solution:**
1. Verify backend is deployed: `vercel ls`
2. Check backend URL is correct
3. Verify CORS is enabled in backend API

---

## Expected Output

### Successful Verification

```
============================================================
Backend Configuration Verification Report
============================================================

✅ Backend URL Configuration
   Backend is accessible at https://your-backend.vercel.app
   Details: Status: 200

✅ Database Configuration
   Database appears to be configured and working
   Details: Test submission succeeded

✅ Photo Storage Configuration
   Photo storage is configured and working
   Details: Photo URL: https://storage.example.com/photos/...

✅ API Endpoints
   4 endpoints checked
   Details: ✅ Manual Products, ✅ Manufacturing Country, ✅ Photo Upload, ✅ User Prices

============================================================
Summary: 4 passed, 0 warnings, 0 failed
============================================================

✅ All checks passed! Backend is properly configured.
```

### Failed Verification

```
============================================================
Backend Configuration Verification Report
============================================================

❌ Backend URL Configuration
   Backend URL is not configured
   Details: Set EXPO_PUBLIC_BACKEND_URL environment variable

❌ Database Configuration
   Database may not be configured
   Details: Backend error: Database connection failed

============================================================
Summary: 0 passed, 0 warnings, 2 failed
============================================================

❌ CRITICAL: Some checks failed. Please fix these before deploying to production.
```

---

## Additional Resources

- **Backend Environment Template**: `backend/vercel/ENV_TEMPLATE.md`
- **User Contribution Review**: `USER_CONTRIBUTION_SYSTEM_REVIEW.md`
- **Test Plan**: `USER_CONTRIBUTION_TEST_PLAN.md`

---

**Last Updated**: 2025-01-27

