# FSANZ Diagnosis Plan

## Current Status

- ✅ AFCD database: **WORKING** (0.51MB, 3,422 foods)
- ❌ NZFCD database: **NOT WORKING** (97MB, 221,851 foods)

## Possible Issues

### Issue 1: File Not Deployed
**Symptoms:** Health check shows `found: false`
**Cause:** 97MB file might be excluded from deployment
**Fix:** 
- Verify `.vercelignore` includes `!data/*.json`
- Check Vercel deployment logs
- Verify file is in `backend/vercel/data/` directory

### Issue 2: File Too Large to Parse
**Symptoms:** Health check shows `found: true` but `entries: 0`
**Cause:** JSON.parse() timing out on 97MB file
**Fix:**
- Use streaming JSON parser
- Split database into smaller files
- Use external database (MongoDB, PostgreSQL)

### Issue 3: Matching Algorithm Failing
**Symptoms:** Health check shows `entries: 221851` but no matches
**Cause:** Algorithm not finding matches despite data existing
**Fix:**
- Fallback mechanism should catch this
- Check Vercel logs for matching details
- Simplify algorithm further

## Next Steps

1. **Run Health Check:**
   ```powershell
   .\scripts\checkFSANZHealth.ps1
   ```

2. **Based on Results:**
   - If file not found → Fix deployment
   - If file found but empty → Fix parsing (split or stream)
   - If file found with entries → Fix matching algorithm

3. **Alternative Solutions:**
   - Split NZFCD into 10 files (by food group)
   - Use Vercel Blob Storage with lazy loading
   - Move to external database service

## Health Check Endpoint

**URL:** `https://truscoreapi.vercel.app/api/fsanz-health`

**Response:**
```json
{
  "nzfcd": {
    "found": true/false,
    "sizeMB": "97.43",
    "entries": 221851,
    "paths": [...]
  },
  "afcd": {
    "found": true,
    "sizeMB": "0.51",
    "entries": 3422
  }
}
```

This will tell us exactly what's wrong!
















