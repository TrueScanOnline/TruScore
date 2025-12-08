# Deploy FSANZ Query API Fix - Instructions

## ✅ Changes Made

The FSANZ matching algorithm has been completely rewritten with:
- **Scoring system** - Ranks all matches by relevance instead of returning first match
- **Position-based scoring** - Matches at start of food names score higher
- **False positive filtering** - Prevents "Milk" from matching "Beverage...with milk"
- **Stricter rules for single-word searches** - Prevents "Apple" from matching "Cider, apple"
- **Minimum score threshold** - Filters out poor matches

## 🚀 Deployment Options

### Option 1: Manual Deployment (Recommended)

1. **Open PowerShell** and navigate to the vercel directory:
   ```powershell
   cd C:\TrueScan-FoodScanner\backend\vercel
   ```

2. **Deploy to production**:
   ```powershell
   npx vercel --prod
   ```

3. **When prompted:**
   - "Set up and deploy?" → `Y` (Yes)
   - "Which scope?" → Select your Vercel account
   - "Link to existing project?" → `Y` (Yes)
   - "Which existing project?" → `truscoreapi` (or your project name)
   - "In which directory is your code located?" → Press Enter (default: `./`)
   - "Pull environment variables?" → `N` (No)

4. **Wait for deployment** - Vercel will show you the deployment URL when complete

5. **Test the deployment**:
   ```powershell
   cd C:\TrueScan-FoodScanner
   .\scripts\testFSANZComplete.ps1
   ```

### Option 2: Use Deployment Script

Run the PowerShell script I created:

```powershell
cd C:\TrueScan-FoodScanner\backend\vercel
.\deployFSANZFix.ps1
```

### Option 3: GitHub Actions (Automatic)

If you have GitHub Actions set up with VERCEL_TOKEN:

1. **Commit the changes**:
   ```powershell
   cd C:\TrueScan-FoodScanner
   git add backend/vercel/api/fsanz-query.ts
   git commit -m "Fix FSANZ matching algorithm - improved scoring and false positive filtering"
   git push origin main
   ```

2. **GitHub Actions will automatically deploy** (if configured)

## 📊 Expected Results After Deployment

After deployment, the test script should show:

- ✅ **NZ - Milk**: Should find "Milk, whole" or similar (not beverages with milk)
- ✅ **NZ - Bread**: Should find bread entries
- ✅ **NZ - Tomato Sauce**: Should find tomato sauce entries  
- ✅ **AU - Milk**: Should find proper milk entries (not Nesquik chocolate beverages)
- ✅ **AU - Apple**: Should find "Apple, raw" or similar (not "Cider, apple")

## 🔍 Verification

After deployment completes (wait ~90 seconds), test with:

```powershell
.\scripts\testFSANZComplete.ps1
```

The script will test all 5 queries and show whether matches are found correctly.

## 📝 Notes

- **Deployment URL**: Should be `https://truscoreapi.vercel.app` (or similar)
- **API Endpoint**: `/api/fsanz-query?country=nz&productName=Milk`
- **Memory**: 3008 MB (configured in vercel.json)
- **Max Duration**: 60 seconds

## 🐛 Troubleshooting

If deployment fails:
1. Make sure you're logged into Vercel: `npx vercel login`
2. Check that you have access to the `truscoreapi` project
3. Verify the project exists in your Vercel dashboard

If API still returns wrong matches:
1. Check Vercel function logs for matching algorithm output
2. Verify the database files (nzfcd.json, afcd.json) are present in `backend/vercel/data/`
3. Check that the updated code was deployed (check deployment logs)
