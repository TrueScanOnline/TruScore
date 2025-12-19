# NZFCD Database Loading Fix

## Issue Identified

The NZFCD database (97MB, 221,851 foods) is not loading correctly on Vercel, while the smaller AFCD database (0.51MB, 3,422 foods) works fine.

## Root Cause

The 97MB JSON file is likely:
1. **Too large for default Vercel limits** - May timeout or run out of memory during parsing
2. **Taking too long to parse** - JSON.parse() on 97MB can take several seconds
3. **Memory constraints** - Serverless functions have limited memory

## Solution Applied

### 1. Increased Function Resources
- **Memory:** 1024MB → 3008MB (maximum for Vercel Pro)
- **Timeout:** 30s → 60s (maximum for Vercel)

### 2. Enhanced Error Handling
- Added detailed logging for JSON parsing
- Logs parse time and data size
- Validates array structure after parsing
- Better error messages for debugging

### 3. Performance Monitoring
- Logs JSON file size before parsing
- Logs parse time
- Logs entry count after parsing
- Validates data structure

## Changes Made

**File:** `backend/vercel/vercel.json`
```json
"api/fsanz-query.ts": {
  "maxDuration": 60,
  "memory": 3008
}
```

**File:** `backend/vercel/api/fsanz-query.ts`
- Added parse time logging
- Added data validation
- Enhanced error messages
- Better debugging output

## Testing

After deployment (90 seconds), test:

```powershell
.\scripts\testFSANZAfterDeploy.ps1
```

## Expected Results

1. **NZFCD should now load:**
   - Logs will show: `[NZFCD] JSON parsed in Xms, 221851 entries`
   - Database should be accessible
   - "Milk" should be found

2. **If still failing:**
   - Check Vercel logs for parse errors
   - May need to split database or use streaming JSON parser
   - Consider using a database service instead of JSON file

## Alternative Solutions (if needed)

If 3008MB memory still isn't enough:

1. **Split NZFCD into multiple files** (by food group)
2. **Use streaming JSON parser** (for large files)
3. **Move to external database** (MongoDB, PostgreSQL)
4. **Use Vercel Blob Storage** with lazy loading

## Next Steps

1. Wait 90 seconds for deployment
2. Test API: `.\scripts\testFSANZAfterDeploy.ps1`
3. Check Vercel logs for parse time and errors
4. If still failing, consider alternative solutions above
















