# How to Check Vercel Logs for Test Results

## Quick Guide

Since the Vercel CLI has limitations with log access, here's how to check logs manually:

## Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Select Your Project:**
   - Find your project (e.g., `vercel` or `truscoreapi`)
   - Click on it

3. **Go to Logs Tab:**
   - Click "Logs" in the left sidebar
   - Or go to: `https://vercel.com/[your-org]/[your-project]/logs`

4. **Filter by Test Barcode:**
   - Look for your test barcode (e.g., `E2E_FULL_1765142151175`)
   - Check for API calls to:
     - `/api/manual-products`
     - `/api/manufacturing-country`
     - `/api/upload-photo`
     - `/api/user-prices`

5. **Verify Success:**
   - Look for `200 OK` responses
   - Check for successful database writes
   - Verify data is being stored

## Method 2: Vercel CLI (If Available)

```bash
cd backend/vercel

# Get deployment URL
vercel ls --prod

# View logs (replace with your deployment URL)
vercel logs https://vercel-xxx.vercel.app
```

**Note:** The `vercel logs` command may have limitations and may require the deployment to be in a specific state.

## Method 3: Check Database Directly

If you have database access:

### For Postgres (Neon/Supabase):
```sql
-- Check manual products
SELECT * FROM manual_products WHERE barcode = 'E2E_FULL_1765142151175';

-- Check manufacturing country
SELECT * FROM manufacturing_country_submissions WHERE barcode = 'E2E_FULL_1765142151175';

-- Check user prices
SELECT * FROM user_prices WHERE barcode = 'E2E_FULL_1765142151175';
```

### For MongoDB:
```javascript
// Check manual products
db.manual_products.find({ barcode: "E2E_FULL_1765142151175" })

// Check manufacturing country
db.manufacturing_country_submissions.find({ barcode: "E2E_FULL_1765142151175" })

// Check user prices
db.user_prices.find({ barcode: "E2E_FULL_1765142151175" })
```

## What to Look For

### Successful API Calls

Look for these patterns in logs:

1. **Manual Products:**
   ```
   POST /api/manual-products
   Status: 200
   Response: { "success": true, "barcode": "..." }
   ```

2. **Manufacturing Country:**
   ```
   POST /api/manufacturing-country
   Status: 200
   Response: { "success": true, "verified": false }
   ```

3. **Photo Upload:**
   ```
   POST /api/upload-photo
   Status: 200
   Response: { "success": true, "url": "..." }
   ```

4. **User Prices:**
   ```
   POST /api/user-prices
   Status: 200
   Response: { "success": true }
   ```

### Error Patterns

If you see errors:

- **401 Unauthorized:** Expected for preview deployments, app still works
- **500 Internal Server Error:** Check database connection
- **400 Bad Request:** Check request format
- **Timeout:** Check function duration limits

## Test Barcode Format

Test barcodes follow this format:
```
E2E_FULL_<timestamp>
```

Example: `E2E_FULL_1765142151175`

## Quick Check Script

Run this to get your test barcode:

```bash
# Check the test results file
cat test-results-e2e.json | grep -i barcode
```

Or in PowerShell:
```powershell
Get-Content test-results-e2e.json | Select-String "testBarcode"
```

## Troubleshooting

### No Logs Appearing

1. **Wait a few seconds** - Logs may take 10-30 seconds to appear
2. **Check deployment status** - Make sure deployment is "Ready"
3. **Verify API was called** - Check if test actually made the request

### Can't Access Logs

1. **Check Vercel login:**
   ```bash
   cd backend/vercel
   vercel login
   ```

2. **Verify project access:**
   ```bash
   vercel ls --prod
   ```

3. **Use Vercel Dashboard** instead (most reliable)

## Summary

**Best Method:** Use Vercel Dashboard → Logs tab

**Quick Check:** Look for your test barcode in the logs

**Verify Success:** Check for `200 OK` responses and successful database writes

---

**Last Updated:** December 7, 2025

