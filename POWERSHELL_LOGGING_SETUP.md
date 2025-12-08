# PowerShell Logging Setup

## Overview

PowerShell logging has been set up to provide clear, structured output when users scan products. The logs show:

1. **Databases Being Scanned** - Which databases are queried
2. **Database Query Results** - Success/failure and data found
3. **TruScore Calculations** - Detailed breakdown of score calculation
4. **Data Quality Metrics** - Completeness and quality assessment

## Files Created

### 1. PowerShell Logger (`src/utils/powershellLogger.ts`)
- Structured logging utility
- Color-coded output
- Category-based logging (DATABASE, TRUSCORE, DATA_QUALITY, etc.)

### 2. Monitor Script (`scripts/monitor-product-scans.ps1`)
- PowerShell script to monitor and display logs
- Color-coded output
- Real-time log parsing

### 3. Setup Script (`scripts/setup-powershell-logging.ps1`)
- Sets up logging environment
- Creates log directories
- Configures monitoring

## Usage

### Option 1: Monitor Console Output (Recommended)

1. Start your app:
   ```powershell
   npx expo start
   ```

2. In a separate PowerShell window, run:
   ```powershell
   .\scripts\monitor-product-scan.ps1
   ```

3. Scan a product in the app - logs will appear in real-time

### Option 2: Pipe Logs to Monitor

```powershell
npx expo start 2>&1 | .\scripts\monitor-product-scans.ps1
```

### Option 3: Save Logs to File

```powershell
npx expo start 2>&1 | Tee-Object -FilePath "logs\product-scans.log" | .\scripts\monitor-product-scans.ps1
```

## Log Categories

### [DATABASE]
- Shows which databases are being queried
- Status: Querying... / ✅ Found / ❌ Error

### [DATABASE_RESULT]
- Shows results from each database
- Includes: source, hasNutrition, hasIngredients, hasImage, dataQuality

### [TRUSCORE]
- Shows TruScore calculation
- Includes: Score, Breakdown (Body/Planet/Care/Open), hasNutriScore, hasEcoScore

### [DATA_QUALITY]
- Shows data completeness assessment
- Includes: Overall completeness, nutrition, ingredients, certifications, packaging

### [MERGE]
- Shows product merging process
- Includes: Sources merged, strategy, final data quality

### [QUERY_PHASE]
- Shows query phases (Phase 1, 2, 3)
- Includes: Databases queried, results found

## Example Output

```
═══════════════════════════════════════════════════════════
  TRUSCORE DATABASE QUERY: 3017620422003
═══════════════════════════════════════════════════════════

[INFO] [DATABASE] Open Food Facts: Querying...
[SUCCESS] [DATABASE_RESULT] Open Food Facts: Product found
  barcode: 3017620422003
  hasData: true
  dataQuality: EXCELLENT
  hasNutrition: true
  hasIngredients: true
  hasImage: true

[SUCCESS] [TRUSCORE] TruScore Calculated: 75/100
  breakdown:
    Body: 20/25
    Planet: 18/25
    Care: 19/25
    Open: 18/25
  hasNutriScore: true
  hasEcoScore: true
  hasOrigin: true

[INFO] [DATA_QUALITY] Data Quality Assessment
  completeness: 85
  nutrition: 90
  ingredients: 100
  certifications: 80
  packaging: 70
```

## Integration Points

### Enhanced Files

1. **`src/data/databases/truScoreOptimizedDatabase.ts`**
   - Logs each database query
   - Logs query phases
   - Logs results from each database

2. **`src/services/productService.ts`**
   - Logs product merging
   - Logs data quality
   - Logs TruScore calculation

3. **`src/lib/truscoreEngine.ts`**
   - Logs TruScore calculation details
   - Logs pillar breakdowns

## Color Coding

- **Blue**: Information/INFO
- **Green**: Success/SUCCESS
- **Yellow**: Warning/WARN
- **Red**: Error/ERROR
- **Cyan**: TruScore calculations
- **Magenta**: Merging operations

## Troubleshooting

### No logs appearing?
1. Check that the app is running
2. Verify logs are being output to console
3. Check log level settings

### Logs not formatted?
1. Ensure PowerShell script is running
2. Check that logs match expected patterns
3. Verify PowerShell version (5.1+)

## Next Steps

1. Run setup script: `.\scripts\setup-powershell-logging.ps1`
2. Start monitoring: `.\scripts\monitor-product-scans.ps1`
3. Scan a product in the app
4. Observe logs in PowerShell window

---

**PowerShell logging is now ready to show you exactly what's happening during product scans!** 🎯


