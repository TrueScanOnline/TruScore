# PowerShell Logging Guide

## Overview

PowerShell logging has been fully integrated to provide clear, structured output when users scan products. You can now see:

1. ✅ **Databases Being Scanned** - Every database query with status
2. ✅ **Database Query Results** - Success/failure and data quality
3. ✅ **TruScore Calculations** - Detailed breakdown of score calculation
4. ✅ **Data Quality Metrics** - Completeness and quality assessment

---

## Quick Start

### Step 1: Setup (One-time)

```powershell
.\scripts\setup-powershell-logging.ps1
```

This creates:
- `logs/` directory
- Quick monitor script
- Logging configuration

### Step 2: Start Monitoring

**Option A: Quick Monitor (Recommended)**
```powershell
.\scripts\quick-monitor.ps1
```

**Option B: Full Monitor**
```powershell
.\scripts\monitor-product-scans.ps1
```

### Step 3: Scan a Product

1. Start your app: `npx expo start`
2. Scan a product in the app
3. Watch logs appear in PowerShell window

---

## What You'll See

### Database Queries

```
[INFO] [DATABASE] FSANZ-AU: Querying...
[SUCCESS] [DATABASE] FSANZ-AU: ✅ Found product
[INFO] [DATABASE] Open Food Facts: Querying...
[SUCCESS] [DATABASE] Open Food Facts: ✅ Found product
```

### Database Results

```
[SUCCESS] [DATABASE_RESULT] Open Food Facts: Product found
  barcode: 3017620422003
  hasData: true
  dataQuality: EXCELLENT
  hasNutrition: true
  hasIngredients: true
  hasImage: true
  source: openfoodfacts
```

### TruScore Calculation

```
[SUCCESS] [TRUSCORE] TruScore Calculated: 75/100
  barcode: 3017620422003
  breakdown:
    Body: 20/25
    Planet: 18/25
    Care: 19/25
    Open: 18/25
  hasNutriScore: true
  hasEcoScore: true
  hasOrigin: true
```

### Data Quality

```
[INFO] [DATA_QUALITY] Data Quality Assessment
  barcode: 3017620422003
  completeness: 85
  nutrition: 90
  ingredients: 100
  certifications: 80
  packaging: 70
  quality: EXCELLENT
```

### Product Merging

```
[SUCCESS] [MERGE] Merged 3 products
  strategy: TruScore-first
  sources: [openfoodfacts, usda_fooddata, nzfcd]
  mergedSource: openfoodfacts+usda_fooddata+nzfcd
  dataQuality: EXCELLENT
```

---

## Log Categories

| Category | Color | Description |
|----------|-------|-------------|
| `[DATABASE]` | Blue/Green/Red | Database query status |
| `[DATABASE_RESULT]` | Green | Query results with data quality |
| `[TRUSCORE]` | Cyan | TruScore calculation details |
| `[DATA_QUALITY]` | Yellow | Data completeness metrics |
| `[MERGE]` | Magenta | Product merging operations |
| `[QUERY_PHASE]` | Blue | Query phase information |
| `[ERROR]` | Red | Errors and failures |

---

## Integration Points

### Enhanced Files

1. **`src/data/databases/truScoreOptimizedDatabase.ts`**
   - ✅ Logs each database query start/success/error
   - ✅ Logs query phases (Phase 1, 2, 3)
   - ✅ Logs results from each database
   - ✅ Logs total query time

2. **`src/services/productService.ts`**
   - ✅ Logs product merging process
   - ✅ Logs data quality before/after merge
   - ✅ Logs TruScore calculation trigger

3. **`src/lib/truscoreEngine.ts`**
   - ✅ Logs TruScore calculation details
   - ✅ Logs pillar breakdowns
   - ✅ Logs calculation metadata

### New Files

1. **`src/utils/powershellLogger.ts`**
   - PowerShell-friendly logging utility
   - Structured log formatting
   - Color-coded output

2. **`scripts/monitor-product-scans.ps1`**
   - Real-time log monitoring
   - Color-coded display
   - Pattern matching for different log types

3. **`scripts/quick-monitor.ps1`**
   - Simplified monitoring script
   - Easy to use

4. **`scripts/setup-powershell-logging.ps1`**
   - Setup script for logging environment

---

## Example Full Log Output

```
═══════════════════════════════════════════════════════════
  TRUSCORE DATABASE QUERY: 3017620422003
═══════════════════════════════════════════════════════════

[INFO] [QUERY_PHASE] Phase: PHASE 1: Gold Standard + Open Facts
  databases: [Gold Standard, Open Facts]
  resultsFound: 2

[INFO] [DATABASE] Open Food Facts: Querying...
[SUCCESS] [DATABASE] Open Food Facts: ✅ Found product

[SUCCESS] [DATABASE_RESULT] Open Food Facts: Product found
  barcode: 3017620422003
  hasData: true
  dataQuality: EXCELLENT
  hasNutrition: true
  hasIngredients: true
  hasImage: true
  source: openfoodfacts

[INFO] [MERGE_START] Merging 2 products
  sources: [openfoodfacts, usda_fooddata]
  preMergeCompleteness: { overall: 75, nutrition: 80, ... }

[SUCCESS] [MERGE] Merged 2 products
  strategy: TruScore-first
  sources: [openfoodfacts, usda_fooddata]
  mergedSource: openfoodfacts+usda_fooddata
  dataQuality: EXCELLENT

[INFO] [DATA_QUALITY] Data Quality Assessment
  barcode: 3017620422003
  completeness: 85
  nutrition: 90
  ingredients: 100
  certifications: 80
  packaging: 70
  quality: EXCELLENT

[SUCCESS] [TRUSCORE_CALCULATION] TruScore Calculated: 75/100
  barcode: 3017620422003
  breakdown:
    Body: 20/25
    Planet: 18/25
    Care: 19/25
    Open: 18/25
  hasNutriScore: true
  hasEcoScore: true
  hasOrigin: true
  insightsCount: 2

[SUCCESS] [QUERY_COMPLETE] Query completed: 2 products in 1250ms
  barcode: 3017620422003
  userCountry: US
  totalProducts: 2
  queryTime: 1250
  sources: [openfoodfacts, usda_fooddata]
```

---

## Usage Tips

### 1. Real-Time Monitoring

Run the monitor script in a separate PowerShell window while your app is running:

```powershell
# Terminal 1: Start app
npx expo start

# Terminal 2: Monitor logs
.\scripts\quick-monitor.ps1
```

### 2. Save Logs to File

```powershell
npx expo start 2>&1 | Tee-Object -FilePath "logs\scan-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').log"
```

### 3. Filter Specific Logs

```powershell
.\scripts\quick-monitor.ps1 | Select-String "TRUSCORE|DATABASE"
```

### 4. Search Logs

```powershell
Get-Content logs\product-scans-*.log | Select-String "3017620422003"
```

---

## Troubleshooting

### No logs appearing?

1. **Check app is running**: Ensure `npx expo start` is active
2. **Check log level**: Ensure development mode is enabled
3. **Check console output**: Logs go to console, not file by default
4. **Verify integration**: Check that `powershellLogger` is imported

### Logs not formatted?

1. **Check PowerShell version**: Requires PowerShell 5.1+
2. **Check script execution**: Run `Set-ExecutionPolicy RemoteSigned`
3. **Check color support**: Some terminals don't support colors

### Missing database logs?

1. **Check database queries**: Verify `TruScoreOptimizedDatabase` is being used
2. **Check import**: Ensure `powershellLogger` is imported
3. **Check log level**: Ensure INFO level logs are enabled

---

## Advanced Usage

### Custom Log Filtering

Create a custom filter script:

```powershell
# filter-truscore.ps1
Get-Content logs\*.log | Where-Object {
    $_ -match "TRUSCORE" -or $_ -match "DATABASE_RESULT"
} | ForEach-Object {
    Format-LogEntry $_
}
```

### Export Logs to CSV

```powershell
$logs = Get-Content logs\*.log | Where-Object { $_ -match "\[TRUSCORE\]" }
$logs | Export-Csv -Path "truScore-logs.csv" -NoTypeInformation
```

### Monitor Specific Barcode

```powershell
.\scripts\quick-monitor.ps1 | Select-String "3017620422003"
```

---

## Summary

✅ **PowerShell logging is fully integrated!**

- **Database queries**: Every query logged with status
- **Query results**: Data quality and completeness shown
- **TruScore calculations**: Detailed breakdown displayed
- **Data quality**: Comprehensive metrics provided

**Start monitoring**: `.\scripts\quick-monitor.ps1`

---

**You can now see exactly what's happening during product scans!** 🎯


