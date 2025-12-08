# FSANZ Full Database (221,000+ Foods) - Action Plan

## Current Situation

- ✅ **Standard DATA.AP**: Successfully parsed → 2,857 foods
- ⏳ **Unabridged DATA.AP**: Needs investigation → Should contain 221,000+ foods
- ❌ **Current Database**: Only has 2,857 foods (from Standard file)

## The Problem

You're currently using the **Standard** database which has ~2,857 foods. You need the **Unabridged** database which should have 221,000+ foods.

## Solution

I've created `scripts/generateFullFSANZDatabase.js` which will:
1. Read the **Unabridged DATA.AP** file
2. Parse all foods (221,000+)
3. Generate the full `nzfcd.json` database

## How to Run

```powershell
cd C:\TrueScan-FoodScanner
Remove-Item "backend\vercel\data\nzfcd.json" -Force
node scripts/generateFullFSANZDatabase.js
```

This will take several minutes to process 221,000+ foods.

## Verification

After running, verify the database:

```powershell
node -e "const fs=require('fs'); const nzfcd=JSON.parse(fs.readFileSync('backend/vercel/data/nzfcd.json','utf8')); console.log('Total foods:', nzfcd.length.toLocaleString());"
```

You should see **~221,000** foods (or close to it).

## If It Still Shows 2,857 Foods

The Unabridged file might have a **component-based structure** (one row per nutrient, not one row per food). In this case:

1. Check the file structure:
   ```powershell
   node -e "const fs=require('fs'); const path=require('path'); const file=path.join('Database files','Principal files','ASCII Text Files','Unabridged','Unabridged DATA.AP'); const content=fs.readFileSync(file,'utf8'); const lines=content.split(/\r?\n/).filter(l=>l.trim().length>0&&!l.trim().startsWith('©')); const data=lines.slice(2); const first=data[0].split('~'); const second=data[1].split('~'); console.log('First FoodID:', first[0]); console.log('Second FoodID:', second[0]); console.log('Same?', first[0]===second[0]);"
   ```

2. If FoodIDs repeat (component-based), I'll need to create an aggregation script.

## Next Steps After Success

1. ✅ Generate full database (221,000+ foods)
2. ⏳ Test with real barcodes (9313958005890, 9310047207180, 9310645467740)
3. ⏳ Deploy to Vercel
4. ⏳ Test end-to-end in app

## Files Created

- `scripts/generateFullFSANZDatabase.js` - Generates full database from Unabridged file
- `scripts/parseUnabridgedDATAAP.js` - Alternative parser for Unabridged file

## Important Notes

- The Unabridged file is much larger and will take longer to process
- The generated JSON file will be much larger (potentially 100+ MB)
- Vercel has file size limits - may need to optimize or split the database

