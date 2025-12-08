# FSANZ Auto-Download Disabled

## Issue Found

The app was downloading an **old 4-product database** from `/api/fsanz-database` endpoint. This is the old barcode-based lookup system that's no longer needed.

## Solution

**Auto-download has been DISABLED** because:

1. ✅ **We now use server-side API** (`/api/fsanz-query`) for name-based queries
2. ✅ **Server API has full databases**: 2,857 (NZFCD) + 17,109 (AFCD) foods
3. ✅ **No local storage needed**: All queries go to the server
4. ✅ **Always up-to-date**: Server databases are the source of truth

## What Changed

### Before (Old System)
- App downloaded barcode-based database to local storage
- Only 4 products in old database (broken/test data)
- Required local storage space
- Database could become outdated

### After (New System)
- App queries server-side API by product name
- Server has full 2,857+17,109 food databases
- No local storage needed
- Always uses latest server data

## Technical Details

**Old Endpoint** (disabled):
- `/api/fsanz-database?country=nz` - Served old 4-product database

**New Endpoint** (active):
- `/api/fsanz-query?country=nz&productName=...` - Queries full databases by name

## Impact

✅ **No negative impact** - The server-side API is more reliable and has more data
✅ **Better performance** - No need to download/update local databases
✅ **Always current** - Server databases are the source of truth

## Next Steps

1. ✅ Auto-download disabled
2. ✅ App will use server API for all FSANZ queries
3. ⏳ Rebuild app to pick up changes
4. ⏳ Test with real barcodes
