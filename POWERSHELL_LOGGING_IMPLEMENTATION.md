# PowerShell Logging Implementation for TrueScan App Testing

## Overview

This document describes the comprehensive PowerShell logging system implemented to provide detailed visibility into the app's barcode scanning, database querying, data merging, and TruScore calculation processes.

## Logging Features

### 1. Barcode Scan Initiation
- **Location**: `app/index.tsx`
- **Logged Information**:
  - Barcode scanned
  - Scan type (barcode, QR, datamatrix)
  - Timestamp

### 2. Database Query Order and Timing
- **Location**: `src/data/databases/truScoreOptimizedDatabase.ts`
- **Logged Information**:
  - Query order and strategy
  - Which databases are queried
  - Which databases are skipped and why
  - Response time for each database query
  - Data source type (OFF, SQLite, Cache, API, Converted)
  - Whether database requires product name, brand name, or parent company
  - Product data returned (nutrition, ingredients, image, etc.)

### 3. Data Source Tracking
- **Location**: `src/services/productCacheService.ts`
- **Logged Information**:
  - SQLite lookups (with country-specific info)
  - Cache lookups (AsyncStorage, with cache age)
  - Data source identification (SQLite, Cache, OFF, API, Converted, UserContributed)
  - Cache metadata (age, premium status)

### 4. Data Merging
- **Location**: `src/services/productService.ts`
- **Logged Information**:
  - Products before merge (all sources)
  - Merged product after merge
  - Merge strategy (TruScore-first)
  - Merge timing
  - Before/after data comparison

### 5. Four Pillars Calculation
- **Locations**:
  - `src/lib/truscoreEngine/pillars/bodyPillar.ts`
  - `src/lib/truscoreEngine/pillars/planetPillar.ts`
  - `src/lib/truscoreEngine/pillars/ethicsPillar.ts`
  - `src/lib/truscoreEngine/pillars/openPillar.ts`
- **Logged Information for Each Pillar**:
  - Base score (always 15)
  - All adjustments (positive, negative, neutral)
  - Adjustment descriptions and values
  - Data sources for each adjustment
  - Final pillar score (0-25)
  - Detailed breakdown information

### 6. TruScore Calculation
- **Location**: `src/lib/truscoreEngine/index.ts`
- **Logged Information**:
  - Total TruScore (0-100)
  - Breakdown by pillar (Body, Planet, Ethics, Open)
  - Calculation timing
  - Metadata (hasNutriScore, hasEcoScore, hasOrigin)
  - Detailed pillar results

### 7. Overall Process Timing
- **Location**: `src/services/productService.ts`
- **Logged Information**:
  - Total process time (from scan to TruScore completion)
  - Final TruScore
  - Final data source
  - Complete breakdown

## Log Categories

All logs are categorized for easy filtering:

1. **SCAN_START** - Barcode scan initiated
2. **DATABASE_QUERY** - Database queries (start, success, error, skipped)
3. **DATA_SOURCE** - Data source identification
4. **MERGE_START/MERGE_COMPLETE** - Data merging operations
5. **PILLAR_START/PILLAR_ADJUSTMENT/PILLAR_COMPLETE** - Pillar calculations
6. **TRUSCORE_COMPLETE** - Final TruScore calculation
7. **PROCESS_COMPLETE** - Overall process completion

## Database Query Logging Details

### Query Order (as logged):
1. SQLite database (offline-first, country-specific)
2. AsyncStorage cache
3. User-contributed products
4. Tier 1: Open Facts databases (Open Food Facts, Open Beauty Facts, Open Pet Food Facts, Open Products Facts)
5. Tier 2: Local-first databases (FSANZ, USDA, Health Canada, UK FSA, EFSA - country-specific)
6. Tier 2: Gold Standard (GS1)
7. Tier 3: Enhancement databases (nutrition APIs, store APIs)
8. Tier 4: Fallback databases (UPCitemdb, EAN-Search, etc.)
9. Tier 5: Web Search (last resort)

### Database Requirements Logged:
- **Requires Product Name**: FSANZ, FoodAtlas
- **Requires Brand Name**: Brand enrichment services
- **Requires Parent Company**: Ethics pillar brand overlays

### Skipped Databases:
- Logged with reason (e.g., "User country US is not CA" for Health Canada)

## Pillar Calculation Logging

Each pillar logs:
1. **Base Score**: Always 15
2. **Adjustments**: Each adjustment with:
   - Description
   - Value (positive/negative)
   - Type (positive/negative/neutral)
   - Data source (when applicable)
3. **Final Score**: Capped between 0-25 (Body: 2-25)

### Body Pillar Adjustments Logged:
- Nutri-Score grade (A=+7, B=+3, C=0, D=-3, E=-7)
- Additive penalties (IARC hybrid system)
- Risky tags penalties
- Universal irritants
- NOVA processing adjustments
- EWG ratings (household products)

### Planet Pillar Adjustments Logged:
- Eco-Score grade (A=+10, B=+5, C=0, D=-5, E=-10)
- Palm oil penalties
- Recyclable packaging bonuses
- Packaging eco-cost penalties
- Farming impact adjustments

### Ethics Pillar Adjustments Logged:
- Certification bonuses (Fairtrade, Organic, etc.)
- BBFAW tier adjustments
- Labor violation penalties
- Recall penalties
- Brand overlay penalties

### Open Pillar Adjustments Logged:
- Ingredients disclosure adjustments
- Hidden terms penalties
- NOVA amplification
- Zero hidden rewards
- Origin penalties
- Brand ownership penalties

## Usage

The logs are automatically generated when:
1. A user scans a barcode
2. The app queries databases
3. Data is merged
4. TruScore is calculated

All logs include:
- Timestamps (ISO format)
- Log levels (DEBUG, INFO, WARN, ERROR, SUCCESS)
- Structured data (JSON format)
- Color-coded output (for PowerShell console)

## Example Log Output Structure

```
[2024-01-01T12:00:00.000Z] [INFO] [SCAN_START] User scanned barcode: 1234567890123
{
  "barcode": "1234567890123",
  "scanType": "barcode",
  "timestamp": "2024-01-01T12:00:00.000Z"
}

[2024-01-01T12:00:00.100Z] [INFO] [DATABASE_QUERY] Querying SQLite...
{
  "barcode": "1234567890123",
  "database": "SQLite",
  "status": "start",
  "dataSource": "SQLite"
}

[2024-01-01T12:00:00.150Z] [SUCCESS] [DATABASE_QUERY] ✅ SQLite: Product found
{
  "barcode": "1234567890123",
  "database": "SQLite",
  "status": "success",
  "responseTime": "50ms",
  "hasNutrition": true,
  "hasIngredients": true,
  ...
}

[2024-01-01T12:00:01.000Z] [SUCCESS] [PILLAR_COMPLETE] Body Pillar: 18/25 (base: 15)
{
  "barcode": "1234567890123",
  "pillar": "Body",
  "baseScore": 15,
  "finalScore": 18,
  "adjustments": [...]
}

[2024-01-01T12:00:01.500Z] [SUCCESS] [TRUSCORE_COMPLETE] TruScore: 72/100
{
  "barcode": "1234567890123",
  "totalScore": 72,
  "breakdown": {
    "Body": 18,
    "Planet": 20,
    "Ethics": 17,
    "Open": 17
  },
  "calculationTime": "1500ms"
}

[2024-01-01T12:00:02.000Z] [SUCCESS] [PROCESS_COMPLETE] Full process completed in 2000ms
{
  "barcode": "1234567890123",
  "totalProcessTime": 2000,
  "finalTruScore": 72,
  ...
}
```

## Benefits

1. **Diagnostics**: Easily identify which databases are being used/not used and why
2. **Performance Analysis**: Track response times for each database and overall process
3. **Data Flow Understanding**: See exactly how data flows from scan to TruScore
4. **Pillar Debugging**: Understand how each pillar score is calculated with all adjustments
5. **Algorithm Development**: Use logs to refine database query order and merge strategies
6. **Reliability Testing**: Verify data sources and ensure correct, fast, efficient processing

