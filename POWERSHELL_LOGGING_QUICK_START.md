# PowerShell Logging - Quick Start Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Start Your App
```powershell
npx expo start
```

### Step 2: Capture Logs (New Terminal)
```powershell
npx expo start 2>&1 | .\scripts\capture-expo-logs.ps1
```

### Step 3: Scan a Product
Scan a product in your app and watch the logs appear!

---

## 📊 What You'll See

### Database Queries
```
[INFO] [DATABASE] Open Food Facts: Querying...
[SUCCESS] [DATABASE] Open Food Facts: ✅ Found product
[INFO] [DATABASE] USDA: Querying...
[SUCCESS] [DATABASE] USDA: ✅ Found product
```

### Database Results
```
[SUCCESS] [DATABASE_RESULT] Open Food Facts: Product found
  barcode: 3017620422003
  dataQuality: EXCELLENT
  hasNutrition: true
  hasIngredients: true
  hasImage: true
```

### TruScore Calculation
```
[SUCCESS] [TRUSCORE] TruScore Calculated: 75/100
  breakdown:
    Body: 20/25
    Planet: 18/25
    Care: 19/25
    Open: 18/25
```

### Data Quality
```
[INFO] [DATA_QUALITY] Data Quality Assessment
  completeness: 85
  nutrition: 90
  ingredients: 100
```

---

## 🎯 Alternative Methods

### Method 1: Monitor Metro Output Directly
Just watch the terminal where you ran `npx expo start` - logs appear there!

### Method 2: Save to File
```powershell
npx expo start 2>&1 | Tee-Object -FilePath "logs\expo-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log" | .\scripts\capture-expo-logs.ps1
```

### Method 3: Filter Specific Logs
```powershell
npx expo start 2>&1 | Select-String "TRUSCORE|DATABASE" | .\scripts\capture-expo-logs.ps1
```

---

## 📋 Log Categories

| Category | What It Shows |
|----------|---------------|
| `[DATABASE]` | Which databases are being queried |
| `[DATABASE_RESULT]` | Results from each database with data quality |
| `[TRUSCORE]` | TruScore calculation details |
| `[DATA_QUALITY]` | Data completeness metrics |
| `[MERGE]` | Product merging operations |
| `[QUERY_PHASE]` | Query phases (Phase 1, 2, 3) |

---

## ✅ Setup Complete!

PowerShell logging is now integrated. When you scan a product, you'll see:

1. ✅ Every database being queried
2. ✅ Results from each database
3. ✅ TruScore calculations
4. ✅ Data quality metrics

**Just run your app and scan a product!** 🎯


