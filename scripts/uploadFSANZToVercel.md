# Upload FSANZ Databases to Vercel

## Quick Steps

### Option 1: Deploy with Files (Recommended)

1. **Ensure JSON files are in the repo:**
   ```bash
   # Copy JSON files to backend/vercel/data/
   mkdir -p backend/vercel/data
   cp data/fsanz-au.json backend/vercel/data/
   cp data/fsanz-nz.json backend/vercel/data/
   ```

2. **Deploy to Vercel:**
   ```bash
   cd backend/vercel
   vercel --prod
   ```

3. **Get your deployment URL:**
   - Example: `https://truescan-backend-abc123.vercel.app`

4. **Test URLs:**
   - `https://your-app.vercel.app/api/fsanz-database?country=au`
   - `https://your-app.vercel.app/api/fsanz-database?country=nz`

### Option 2: Use Vercel CLI to Upload Files

If files are too large for git, use Vercel CLI to upload:

```bash
cd backend/vercel
vercel --prod
# Then use Vercel dashboard to upload files to /data directory
```

### Option 3: Use Vercel Blob Storage (Advanced)

For very large files, consider Vercel Blob Storage or external CDN.

















