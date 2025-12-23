# COMPREHENSIVE DATABASE INVESTIGATION REPORT

**Generated:** 2025-12-19T23:31:24.177Z

**Test Barcodes:** 9300675001113, 9310645244839, 3017620422003, 7622210969472, 5000159461125, 8001090311027, 8712561735036, 4008400000000, 5010024000000, 5901234123457

**Total Databases Tested:** 39

## Executive Summary

- ✅ **Working:** 3 databases
- ⚠️ **Partial:** 0 databases
- 🔑 **Requires Key:** 13 databases
- ❌ **Not Working:** 23 databases

## 🚨 CRITICAL FINDINGS

### Databases NOT Returning Data (Should Be Removed)

- **Open Food Facts** (Tier 1): All queries failed
- **Open Beauty Facts** (Tier 1): All queries failed
- **Open Pet Food Facts** (Tier 1): Returns empty/null data for all test barcodes
- **Open Products Facts** (Tier 1): Returns empty/null data for all test barcodes
- **Health Canada** (Tier 1): Returns empty/null data for all test barcodes
- **UK FSA** (Tier 1): Returns empty/null data for all test barcodes
- **EFSA** (Tier 1): Returns empty/null data for all test barcodes
- **FSANZ (AU)** (Tier 2): All queries failed
- **FSANZ (NZ)** (Tier 2): All queries failed
- **NZFCD Enhancement** (Tier 2): All queries failed
- **AFCD Enhancement** (Tier 2): All queries failed
- **NZ Stores** (Tier 2): All queries failed
- **AU Retailers** (Tier 2): All queries failed
- **Food Repo** (Tier 2): Returns empty/null data for all test barcodes
- **Datakick** (Tier 3): Returns empty/null data for all test barcodes
- **UPCitemdb** (Tier 3): Returns empty/null data for all test barcodes
- **Barcode Spider** (Tier 3): Returns empty/null data for all test barcodes
- **GoUPC** (Tier 3): Returns empty/null data for all test barcodes
- **Buycott** (Tier 3): Returns empty/null data for all test barcodes
- **Open GTIN DB** (Tier 3): Returns empty/null data for all test barcodes
- **Open EAN** (Tier 3): Returns empty/null data for all test barcodes
- **Barcode Monster** (Tier 3): Returns empty/null data for all test barcodes
- **Product Open Data** (Tier 3): Returns empty/null data for all test barcodes

### Databases Requiring API Keys

- **GS1 Data Source** (Tier 1): API key not configured
- **USDA FoodData Central** (Tier 1): API key not configured
- **Tesco Labs** (Tier 2): API key not configured
- **Walmart Open API** (Tier 2): API key not configured
- **Edamam** (Tier 3): API key not configured
- **Nutritionix** (Tier 3): API key not configured
- **Spoonacular** (Tier 3): API key not configured
- **EAN-Search** (Tier 3): API key not configured
- **UPC Database** (Tier 3): API key not configured
- **Barcode Lookup** (Tier 3): API key not configured
- **EAN Data** (Tier 3): API key not configured
- **Barcode Lookup Com** (Tier 3): API key not configured
- **Best Buy** (Tier 3): API key not configured

## Results by Tier

### Tier 1 Databases

| Database | Status | Success Rate | Data Returns | Avg Response | Data Quality | Issues |
|----------|--------|--------------|--------------|--------------|--------------|--------|
| Open Food Facts | ❌ not_working | 0% | 0/10 | 41ms | E:0 G:0 M:0 N:10 | All queries failed |
| Open Beauty Facts | ❌ not_working | 0% | 0/10 | 54ms | E:0 G:0 M:0 N:10 | All queries failed |
| Open Pet Food Facts | ❌ not_working | 100% | 0/10 | 437ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Open Products Facts | ❌ not_working | 100% | 0/10 | 409ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| GS1 Data Source | 🔑 requires_key | 100% | 0/10 | 1176ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| USDA FoodData Central | 🔑 requires_key | 100% | 0/10 | 5ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Health Canada | ❌ not_working | 100% | 0/10 | 7ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| UK FSA | ❌ not_working | 100% | 0/10 | 1ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| EFSA | ❌ not_working | 100% | 0/10 | 1ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |

### Tier 2 Databases

| Database | Status | Success Rate | Data Returns | Avg Response | Data Quality | Issues |
|----------|--------|--------------|--------------|--------------|--------------|--------|
| FSANZ (AU) | ❌ not_working | 0% | 0/10 | 46ms | E:0 G:0 M:0 N:10 | All queries failed |
| FSANZ (NZ) | ❌ not_working | 0% | 0/10 | 38ms | E:0 G:0 M:0 N:10 | All queries failed |
| NZFCD Enhancement | ❌ not_working | 0% | 0/10 | 31ms | E:0 G:0 M:0 N:10 | All queries failed |
| AFCD Enhancement | ❌ not_working | 0% | 0/10 | 20ms | E:0 G:0 M:0 N:10 | All queries failed |
| FoodAtlas | ✅ working | 100% | 10/10 | 839ms | E:0 G:10 M:0 N:0 | None |
| FooDB Enhancement | ✅ working | 100% | 10/10 | 1118ms | E:0 G:0 M:10 N:0 | None |
| World Food Database | ✅ working | 100% | 10/10 | 749ms | E:0 G:0 M:10 N:0 | None |
| NZ Stores | ❌ not_working | 0% | 0/10 | 33ms | E:0 G:0 M:0 N:10 | All queries failed |
| AU Retailers | ❌ not_working | 0% | 0/10 | 48ms | E:0 G:0 M:0 N:10 | All queries failed |
| Tesco Labs | 🔑 requires_key | 100% | 0/10 | 2ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Walmart Open API | 🔑 requires_key | 100% | 0/10 | 1ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Food Repo | ❌ not_working | 100% | 0/10 | 708ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |

### Tier 3 Databases

| Database | Status | Success Rate | Data Returns | Avg Response | Data Quality | Issues |
|----------|--------|--------------|--------------|--------------|--------------|--------|
| Edamam | 🔑 requires_key | 100% | 0/10 | 4ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Nutritionix | 🔑 requires_key | 100% | 0/10 | 3ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Spoonacular | 🔑 requires_key | 100% | 0/10 | 4ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Datakick | ❌ not_working | 100% | 0/10 | 633ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| UPCitemdb | ❌ not_working | 100% | 0/10 | 1161ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| EAN-Search | 🔑 requires_key | 100% | 0/10 | 3ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Barcode Spider | ❌ not_working | 100% | 0/10 | 650ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| GoUPC | ❌ not_working | 100% | 0/10 | 668ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Buycott | ❌ not_working | 100% | 0/10 | 1385ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Open GTIN DB | ❌ not_working | 100% | 0/10 | 1401ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Open EAN | ❌ not_working | 100% | 0/10 | 266ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Barcode Monster | ❌ not_working | 100% | 0/10 | 629ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| UPC Database | 🔑 requires_key | 100% | 0/10 | 5ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Barcode Lookup | 🔑 requires_key | 100% | 0/10 | 5ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| EAN Data | 🔑 requires_key | 100% | 0/10 | 4ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Barcode Lookup Com | 🔑 requires_key | 100% | 0/10 | 2ms | E:0 G:0 M:0 N:10 | API key required but not configured |
| Product Open Data | ❌ not_working | 100% | 0/10 | 482ms | E:0 G:0 M:0 N:10 | Returns empty/null data for all test barcodes |
| Best Buy | 🔑 requires_key | 100% | 0/10 | 5ms | E:0 G:0 M:0 N:10 | API key required but not configured |

## Detailed Results

### Open Food Facts (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 41ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 85ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 54ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 46ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 41ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 34ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 35ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 27ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 29ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 35ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 27ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### Open Beauty Facts (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 54ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 66ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 108ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 100ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 56ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 53ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 32ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 35ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 32ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 32ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 30ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### Open Pet Food Facts (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 437ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1541ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 324ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 302ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 303ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 291ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 281ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 282ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 295ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 335ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 413ms | Function returned null or invalid data |

### Open Products Facts (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 409ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1467ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 287ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 303ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 293ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 293ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 299ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 293ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 284ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 287ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 284ms | Function returned null or invalid data |

### GS1 Data Source (Tier 1, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1176ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1949ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 806ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 784ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 722ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 740ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 742ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 723ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 3693ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 715ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 882ms | Function returned null or invalid data |

### USDA FoodData Central (Tier 1, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 5ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 43ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### Health Canada (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 7ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 52ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 3ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 3ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 2ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### UK FSA (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 9ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### EFSA (Tier 1, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 10ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### FSANZ (AU) (Tier 2, name)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 46ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 65ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 43ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 37ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 50ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 62ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 38ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 21ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 67ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 34ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 41ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### FSANZ (NZ) (Tier 2, name)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 38ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 41ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 39ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 44ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 40ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 75ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 25ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 31ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 26ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 34ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 28ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### NZFCD Enhancement (Tier 2, enhancement)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 31ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 37ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 14ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 29ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 37ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 27ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 43ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 29ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 34ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 28ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 33ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |

### AFCD Enhancement (Tier 2, enhancement)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 20ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 21ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 30ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 26ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 16ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 13ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 18ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 15ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 30ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 14ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 19ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\SQLiteDatabase' imported from C:\TrueScan-FoodScanner\node_modules\expo-sqlite\build\index.js |

### FoodAtlas (Tier 2, name)

**Status:** working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 10
- No Data Returns: 0
- Average Response Time: 839ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 10, Minimal: 0, None: 0

**Recommendations:**
- ✅ Database is working correctly - keep in query list

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ✅ | 🟡 good | 964ms | None |
| 9310645244839 | ✅ | ✅ | 🟡 good | 349ms | None |
| 3017620422003 | ✅ | ✅ | 🟡 good | 302ms | None |
| 7622210969472 | ✅ | ✅ | 🟡 good | 289ms | None |
| 5000159461125 | ✅ | ✅ | 🟡 good | 315ms | None |
| 8001090311027 | ✅ | ✅ | 🟡 good | 271ms | None |
| 8712561735036 | ✅ | ✅ | 🟡 good | 292ms | None |
| 4008400000000 | ✅ | ✅ | 🟡 good | 273ms | None |
| 5010024000000 | ✅ | ✅ | 🟡 good | 274ms | None |
| 5901234123457 | ✅ | ✅ | 🟡 good | 5065ms | None |

### FooDB Enhancement (Tier 2, enhancement)

**Status:** working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 10
- No Data Returns: 0
- Average Response Time: 1118ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 10, None: 0

**Recommendations:**
- ✅ Database is working correctly - keep in query list

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ✅ | 🟠 minimal | 1276ms | None |
| 9310645244839 | ✅ | ✅ | 🟠 minimal | 493ms | None |
| 3017620422003 | ✅ | ✅ | 🟠 minimal | 647ms | None |
| 7622210969472 | ✅ | ✅ | 🟠 minimal | 4393ms | None |
| 5000159461125 | ✅ | ✅ | 🟠 minimal | 508ms | None |
| 8001090311027 | ✅ | ✅ | 🟠 minimal | 654ms | None |
| 8712561735036 | ✅ | ✅ | 🟠 minimal | 651ms | None |
| 4008400000000 | ✅ | ✅ | 🟠 minimal | 683ms | None |
| 5010024000000 | ✅ | ✅ | 🟠 minimal | 1426ms | None |
| 5901234123457 | ✅ | ✅ | 🟠 minimal | 447ms | None |

### World Food Database (Tier 2, enhancement)

**Status:** working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 10
- No Data Returns: 0
- Average Response Time: 749ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 10, None: 0

**Recommendations:**
- ✅ Database is working correctly - keep in query list

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ✅ | 🟠 minimal | 1392ms | None |
| 9310645244839 | ✅ | ✅ | 🟠 minimal | 503ms | None |
| 3017620422003 | ✅ | ✅ | 🟠 minimal | 860ms | None |
| 7622210969472 | ✅ | ✅ | 🟠 minimal | 602ms | None |
| 5000159461125 | ✅ | ✅ | 🟠 minimal | 644ms | None |
| 8001090311027 | ✅ | ✅ | 🟠 minimal | 703ms | None |
| 8712561735036 | ✅ | ✅ | 🟠 minimal | 693ms | None |
| 4008400000000 | ✅ | ✅ | 🟠 minimal | 681ms | None |
| 5010024000000 | ✅ | ✅ | 🟠 minimal | 735ms | None |
| 5901234123457 | ✅ | ✅ | 🟠 minimal | 678ms | None |

### NZ Stores (Tier 2, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 33ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 37ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 36ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 32ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 39ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 37ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 24ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 25ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 26ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 25ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 45ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### AU Retailers (Tier 2, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 0
- Failures: 10
- Data Returns: 0
- No Data Returns: 0
- Average Response Time: 48ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- All queries failed

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ❌ | ❌ | 🔴 none | 50ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 9310645244839 | ❌ | ❌ | 🔴 none | 43ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 3017620422003 | ❌ | ❌ | 🔴 none | 40ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 7622210969472 | ❌ | ❌ | 🔴 none | 68ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5000159461125 | ❌ | ❌ | 🔴 none | 62ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8001090311027 | ❌ | ❌ | 🔴 none | 48ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 8712561735036 | ❌ | ❌ | 🔴 none | 55ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 4008400000000 | ❌ | ❌ | 🔴 none | 34ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5010024000000 | ❌ | ❌ | 🔴 none | 44ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |
| 5901234123457 | ❌ | ❌ | 🔴 none | 38ms | Cannot find module 'C:\TrueScan-FoodScanner\node_modules\expo-localization\build\ExpoLocalization' imported from C:\TrueScan-FoodScanner\node_modules\expo-localization\build\Localization.js |

### Tesco Labs (Tier 2, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 2ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 11ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Walmart Open API (Tier 2, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 11ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Food Repo (Tier 2, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 708ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1136ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 314ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 698ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 710ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 698ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 682ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 704ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 703ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 688ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 742ms | Function returned null or invalid data |

### Edamam (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 4ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 38ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### Nutritionix (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 3ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 28ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### Spoonacular (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 4ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 35ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### Datakick (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 633ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 165ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 563ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 695ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 698ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 712ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 740ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 654ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 695ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 702ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 704ms | Function returned null or invalid data |

### UPCitemdb (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1161ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1385ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 686ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 685ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 680ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 699ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 698ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1697ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1720ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1671ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1693ms | Function returned null or invalid data |

### EAN-Search (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 3ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 23ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### Barcode Spider (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 650ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 614ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 477ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 514ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 709ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 699ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 699ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 692ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 710ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 688ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 693ms | Function returned null or invalid data |

### GoUPC (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 668ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 867ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 203ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 711ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 701ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 692ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 702ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 691ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 703ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 715ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 690ms | Function returned null or invalid data |

### Buycott (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1385ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1397ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1313ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1597ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1316ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1372ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1355ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1614ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1293ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1286ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1305ms | Function returned null or invalid data |

### Open GTIN DB (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 1401ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1986ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1331ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1334ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1334ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1344ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1310ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1281ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1389ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1342ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1357ms | Function returned null or invalid data |

### Open EAN (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 266ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1462ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 527ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 673ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Barcode Monster (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 629ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 95ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 624ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 692ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 699ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 700ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 752ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 653ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 688ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 689ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 694ms | Function returned null or invalid data |

### UPC Database (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 5ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 47ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Barcode Lookup (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 5ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 42ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |

### EAN Data (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 4ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 32ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Barcode Lookup Com (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 2ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 20ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Product Open Data (Tier 3, barcode)

**Status:** not_working

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 482ms
- Requires API Key: No
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- Returns empty/null data for all test barcodes

**Recommendations:**
- ❌ REMOVE from query list - not returning useful data
- Check if API endpoint has changed or requires authentication
- Verify API is still operational

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 1591ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 1807ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 1425ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

### Best Buy (Tier 3, barcode)

**Status:** requires_key

**Statistics:**
- Total Tests: 10
- Successes: 10
- Failures: 0
- Data Returns: 0
- No Data Returns: 10
- Average Response Time: 5ms
- Requires API Key: Yes
- Data Quality: Excellent: 0, Good: 0, Minimal: 0, None: 10

**Issues:**
- API key required but not configured

**Recommendations:**
- 🔑 Add API key to .env file if free tier available
- Consider removing if no free tier available

**Test Results:**

| Barcode | Success | Has Data | Quality | Response Time | Error |
|---------|---------|----------|---------|----------------|------|
| 9300675001113 | ✅ | ❌ | 🔴 none | 49ms | Function returned null or invalid data |
| 9310645244839 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 3017620422003 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 7622210969472 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5000159461125 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 8001090311027 | ✅ | ❌ | 🔴 none | 1ms | Function returned null or invalid data |
| 8712561735036 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 4008400000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5010024000000 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |
| 5901234123457 | ✅ | ❌ | 🔴 none | 0ms | Function returned null or invalid data |

## 🎯 ACTION ITEMS

### Databases to Remove

These databases are queried but NOT returning useful data:

1. **Open Food Facts** (Tier 1)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Open Beauty Facts** (Tier 1)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Open Pet Food Facts** (Tier 1)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Open Products Facts** (Tier 1)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Health Canada** (Tier 1)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **UK FSA** (Tier 1)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **EFSA** (Tier 1)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **FSANZ (AU)** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **FSANZ (NZ)** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **NZFCD Enhancement** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **AFCD Enhancement** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **NZ Stores** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **AU Retailers** (Tier 2)
   - Issue: All queries failed
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Food Repo** (Tier 2)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Datakick** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **UPCitemdb** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Barcode Spider** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **GoUPC** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Buycott** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Open GTIN DB** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Open EAN** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Barcode Monster** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

1. **Product Open Data** (Tier 3)
   - Issue: Returns empty/null data for all test barcodes
   - Action: Remove from `truScoreOptimizedDatabase.ts` query list

### Databases Requiring API Keys

These databases require API keys but keys are not configured:

1. **GS1 Data Source** (Tier 1)
   - Action: Add API key to .env file OR remove from query list

1. **USDA FoodData Central** (Tier 1)
   - Action: Add API key to .env file OR remove from query list

1. **Tesco Labs** (Tier 2)
   - Action: Add API key to .env file OR remove from query list

1. **Walmart Open API** (Tier 2)
   - Action: Add API key to .env file OR remove from query list

1. **Edamam** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **Nutritionix** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **Spoonacular** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **EAN-Search** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **UPC Database** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **Barcode Lookup** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **EAN Data** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **Barcode Lookup Com** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

1. **Best Buy** (Tier 3)
   - Action: Add API key to .env file OR remove from query list

### Optimization Recommendations

1. **Remove non-working databases** from query list to improve performance
2. **Add API keys** for databases that require them (if free tier available)
3. **Prioritize working databases** in query order
4. **Cache results** from working databases to reduce API calls
5. **Monitor API rate limits** for databases with high success rates
6. **Use circuit breakers** for databases that frequently fail
