# FSANZ Database Diagnostic Questions

## Current Issue
NZ queries return **"Direct Matches: 0"** even though the database has 221,851 entries. This indicates a **field name mismatch** - the code is looking for fields that don't exist in the NZ database.

## Questions to Answer

### 1. Database Structure
- [ ] **Is the NZ database an array or an object?**
  - Check Vercel logs for: `[DIAGNOSTIC] Database type: Array/object`
  
- [ ] **What are the actual field names in the NZ database?**
  - Check Vercel logs for: `[DIAGNOSTIC] All keys: ...`
  - This will show the EXACT field names used in the database

### 2. Field Name Mismatch
- [ ] **What field contains the food name in NZ database?**
  - Check Vercel logs for: `[DIAGNOSTIC] Name-like keys found: ...`
  - Compare with AU database field names (which work)

- [ ] **Are the field names case-sensitive or different format?**
  - NZ might use: `FoodName`, `FOOD_NAME`, `food_name`, `Food Name`, etc.
  - AU works, so compare field names between NZ and AU

### 3. Database Loading
- [ ] **Is the NZ database actually loading?**
  - Check Vercel logs for: `✅ Loaded X NZFCD foods into cache`
  - If it says 0 or empty, the file path is wrong

- [ ] **What is the actual file path in Vercel?**
  - Check Vercel logs for: `[NZFCD] JSON file not found in any expected location`
  - The file might be in a different location than expected

### 4. Matching Algorithm
- [ ] **What does the "Any-field search" find?**
  - Check Vercel logs for: `[DIAGNOSTIC] Any-field search found X matches`
  - If this finds matches but "direct matches" doesn't, it's a field name issue

## How to Get Answers

### Step 1: Deploy Enhanced API
The enhanced API now includes comprehensive diagnostic logging that will show:
- Database structure
- All field names
- Field values
- Matching attempts

### Step 2: Run Test Script
```powershell
.\scripts\testFSANZComplete.ps1
```

### Step 3: Check Vercel Logs
1. Go to: https://vercel.com/dashboard
2. Select your project: `truscoreapi`
3. Click "Functions" → `api/fsanz-query`
4. Click on a recent invocation
5. Look for `[DIAGNOSTIC]` log entries

### Step 4: Compare NZ vs AU
- Look at the diagnostic output for NZ queries
- Compare with AU queries (which work)
- Identify the field name differences

## Expected Diagnostic Output

When you run the test, you should see logs like:

```
[DIAGNOSTIC] ===== DATABASE STRUCTURE ANALYSIS =====
[DIAGNOSTIC] First entry type: object
[DIAGNOSTIC] First entry has X keys
[DIAGNOSTIC] All keys: key1, key2, key3, ...
[DIAGNOSTIC] Name-like keys found: foodName, Food Name, ...
[DIAGNOSTIC]   foodName: "Milk, whole"
[DIAGNOSTIC] ===== END STRUCTURE ANALYSIS =====
```

## Next Steps After Getting Answers

Once we know the actual field names:

1. **Update field detection** in `fsanz-query.ts` to include the correct NZ field names
2. **Update matching algorithm** to use the correct field names
3. **Test again** to verify matches are found

## Most Likely Issues

Based on the symptoms:

1. **Field name mismatch (90% likely)**
   - NZ database uses different field names than AU
   - Code is looking for `foodName` but NZ uses `Food Name` or `food_name`

2. **Database structure difference (5% likely)**
   - NZ database might be nested: `{ data: [...] }` instead of `[...]`
   - Or it might be an object with entries as properties

3. **File path issue (5% likely)**
   - Database file not found in Vercel deployment
   - File exists but in wrong location

## Solution Path

1. ✅ **Enhanced diagnostic logging** (DONE)
2. ⏳ **Deploy and test** (NEXT)
3. ⏳ **Analyze diagnostic output** (NEXT)
4. ⏳ **Fix field name detection** (AFTER DIAGNOSTIC)
5. ⏳ **Verify matches work** (FINAL)
