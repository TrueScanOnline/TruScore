# Database Index and SQLite Connection Fix

## Issues Fixed

### 1. **Database Index Error: `no such table: main.scan_history`**

**Problem:**
- The code was trying to create indexes on a `scan_history` table that doesn't exist in SQLite
- Scan history is actually stored in AsyncStorage (via `useScanStore.ts`), not in SQLite

**Fix:**
- Removed the `scan_history` index creation from `src/utils/databaseIndexes.ts`
- Added a comment explaining that scan history is stored in AsyncStorage

### 2. **SQLite NullPointerException**

**Problem:**
- Database connection could be null when accessed
- Concurrent initialization could cause race conditions
- No proper error handling for database initialization failures

**Fixes Applied:**

1. **Improved Database Initialization** (`src/services/sqliteProductDatabase.ts`):
   - Added proper cleanup of existing database before re-initialization
   - Added null check after opening database
   - Better error handling with database reset on failure

2. **Concurrent Initialization Protection**:
   - Added `isInitializing` flag and `initPromise` to prevent concurrent initialization
   - Multiple calls to `getDatabase()` will wait for the first initialization to complete

3. **Better Error Handling in Lookup**:
   - Changed error logging from `logger.error` to `logger.debug` for non-critical database lookup failures
   - Added null check for database before use
   - Added try-catch around individual query attempts to continue with next variant on failure

## Files Modified

1. `src/utils/databaseIndexes.ts`
   - Removed `scan_history` index creation

2. `src/services/sqliteProductDatabase.ts`
   - Improved `initSQLiteDatabase()` with better error handling
   - Added concurrent initialization protection in `getDatabase()`
   - Improved error handling in `lookupProductInSQLite()`

## Testing

The app should now:
- ✅ Initialize SQLite database without errors
- ✅ Handle concurrent database access gracefully
- ✅ Gracefully fall back when database is unavailable
- ✅ Not attempt to create indexes on non-existent tables

## Notes

- Database initialization is lazy (happens on first use)
- Database errors are now non-blocking and won't crash the app
- Scan history remains in AsyncStorage (not SQLite) as designed
