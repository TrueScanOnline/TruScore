# Database Reality Check - Testing Instructions

## Overview

This test verifies that the database queries described in `DATABASE_QUERY_COMPREHENSIVE_ANALYSIS.md` actually work in practice.

## Test Script

**File:** `scripts/testDatabaseRealityCheck.ts`

## What It Tests

1. **60+ User-Provided Barcodes** - Real barcodes you provided
2. **20 Researched Barcodes** - Common products for additional coverage
3. **30+ Databases** - All databases listed in the analysis document
4. **Theory vs Reality** - Compares actual results to theoretical expectations

## How to Run

```bash
# From project root
npx ts-node scripts/testDatabaseRealityCheck.ts
```

**Note:** This will take 30-60 minutes to complete (1800+ API calls). Consider running a smaller subset first.

## Expected Output

1. **Console Logs** - Real-time progress of each test
2. **Report File** - `DATABASE_REALITY_CHECK_REPORT.md` - Complete analysis

## Report Contents

The report will include:

1. **Executive Summary** - Overall statistics
2. **Theory vs Reality Comparison** - Side-by-side comparison
3. **Detailed Results by Tier** - Per-tier analysis
4. **Critical Findings** - Databases that don't match theory
5. **Per-Database Results** - Detailed statistics for each database
6. **Recommendations** - Action items based on results

## Key Metrics Tracked

- **Actual Reliability** - Percentage of tests that returned data
- **Response Times** - Min, max, average
- **Theory Match** - Does reality match theory?
- **Status** - Working, partial, requires key, not working, slow

## Important Notes

1. **API Keys Required** - Some databases require API keys (will be marked as "requires_key")
2. **Rate Limiting** - Script includes delays to avoid rate limiting
3. **Timeouts** - Each query has 30s timeout (matches app behavior)
4. **Name-Based Queries** - FSANZ, FoodAtlas require product names (fetched from OFF first)

## Quick Test (Subset)

To test a smaller subset quickly, modify the script to test only:
- First 5 barcodes
- Tier 1 databases only
- Most critical databases

This will complete in ~5-10 minutes instead of 30-60 minutes.
