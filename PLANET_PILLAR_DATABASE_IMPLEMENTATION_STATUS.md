# PLANET Pillar - Database Implementation Status

**Date:** January 2025  
**Status:** Implementation In Progress

---

## Executive Summary

This document tracks the implementation status of all databases required for the PLANET Pillar new specification. It identifies what has been implemented, what is available, and what needs to be sourced.

**Total Required Databases:** 14  
**Implemented (Hardcoded):** 5  
**Implemented (CSV Ready):** 0  
**Needs Sourcing:** 9

---

## 1. Implementation Status by Database

### 1.1 ✅ IMPLEMENTED (Hardcoded - Phase 1)

| Database | Status | Implementation | Data Count | Notes |
|----------|--------|----------------|------------|-------|
| **EWG Dirty Dozen** | ✅ Implemented | Hardcoded in `csvDatabaseService.ts` | 14 crops | 2024 list, can expand |
| **RSPO Certified** | ✅ Implemented | Hardcoded in `csvDatabaseService.ts` | 15 brands | Known certified companies |
| **Idemat Eco-Cost** | ✅ Implemented | Hardcoded in `csvDatabaseService.ts` | 14 materials | Common packaging materials |
| **FAO Crop Data** | ✅ Implemented | Hardcoded in `csvDatabaseService.ts` | 12 crops | Simplified, common crops |
| **USDA PDP** | ✅ Implemented | Hardcoded in `csvDatabaseService.ts` | 11 crops | High residue crops |

**Implementation Details:**
- **File:** `src/services/csvDatabases/csvDatabaseService.ts`
- **Service:** `CSVDatabaseService` class with query methods
- **Initialization:** `initializeCSVDatabases()` function
- **Status:** Ready for use in PLANET Pillar

---

### 1.2 ⚠️ PARTIALLY IMPLEMENTED

| Database | Status | Current | Needed | Notes |
|----------|--------|---------|--------|-------|
| **WWF Scorecard** | ⚠️ Partial | Hardcoded (10 brands) | Full CSV | Already in `wwfPalmOilEnhancement.ts` |
| **Agribalyse** | ⚠️ Partial | Extracted from OFF | CSV fallback | Data extracted but not used for fallback |

---

### 1.3 ❌ NEEDS SOURCING (Phase 2-4)

| Database | Priority | Source Type | Status | Notes |
|----------|----------|-------------|--------|-------|
| **RIVM CSV** | Medium | CSV | ❌ Not Found | Dutch LCA data |
| **UK Food CSV** | Medium | CSV | ❌ Not Found | UK carbon factors |
| **Exiobase CSV** | Medium | CSV | ❌ Not Found | Spend-based carbon |
| **Ember CSV** | Low | CSV/API | ❌ Not Found | Energy/carbon data |
| **Eaternity CSV** | Medium | CSV/API | ❌ Not Found | Food carbon footprint |
| **ECR Guides CSV** | Low | CSV | ❌ Not Found | Recycling guidelines |
| **ReCoRe CSV** | Low | CSV | ❌ Not Found | Recycling compatibility |
| **Recycling Partnership CSV** | Low | CSV | ❌ Not Found | US recycling data |
| **Full FAO FAOSTAT CSV** | High | CSV/API | ❌ Not Found | Complete crop database |
| **Full USDA PDP CSV** | High | CSV | ❌ Not Found | Complete pesticide data |
| **Full RSPO CSV** | High | CSV | ❌ Not Found | Complete certified list |
| **Full Idemat CSV** | Medium | CSV | ❌ Not Found | Complete eco-cost database |

---

## 2. Database Details

### 2.1 EWG Dirty Dozen ✅

**Status:** ✅ Implemented  
**Location:** `src/services/csvDatabases/csvDatabaseService.ts`  
**Data:** 14 crops (2024 list)  
**Query Method:** `queryEWGDirtyDozen(cropName)`  
**Helper:** `isDirtyDozenCrop(cropName)`

**Crops Included:**
- strawberries, spinach, kale, collard greens, mustard greens
- peaches, pears, nectarines, apples
- bell peppers, hot peppers, cherries, blueberries, green beans

**Usage:**
```typescript
const service = getCSVDatabaseService();
await service.initialize();
const isDirty = service.isDirtyDozenCrop('strawberries'); // true
```

---

### 2.2 RSPO Certified ✅

**Status:** ✅ Implemented  
**Location:** `src/services/csvDatabases/csvDatabaseService.ts`  
**Data:** 15 brands  
**Query Method:** `queryRSPOCertified(brandName)`  
**Helper:** `isRSPOCertified(brandName)`

**Brands Included:**
- unilever, nestle, pepsico, coca-cola, mars, mondelēz
- kellogg, general mills, procter & gamble, johnson & johnson
- l'oréal, henkel, colgate-palmolive, reckitt, danone

**Usage:**
```typescript
const isCertified = service.isRSPOCertified('unilever'); // true
```

---

### 2.3 Idemat Eco-Cost ✅

**Status:** ✅ Implemented  
**Location:** `src/services/csvDatabases/csvDatabaseService.ts`  
**Data:** 14 materials  
**Query Method:** `queryIdematEcoCost(materialName)`  
**Helper:** `isHighEcoCostMaterial(materialName)`

**High Eco-Cost Materials (>100):**
- aluminum (150), steel (120), copper (200), pvc (110)
- polystyrene (105), expanded polystyrene (130), polycarbonate (140)

**Usage:**
```typescript
const isHighCost = service.isHighEcoCostMaterial('aluminum'); // true
```

---

### 2.4 FAO Crop Data ✅

**Status:** ✅ Implemented  
**Location:** `src/services/csvDatabases/csvDatabaseService.ts`  
**Data:** 12 crops  
**Query Method:** `queryFAOCropData(cropName)`

**High Water Usage Crops (>5000 L/kg):**
- rice, cotton, sugar cane, coffee, cocoa, almonds

**Usage:**
```typescript
const cropData = service.queryFAOCropData('rice');
// Returns: { waterUsage: 2500, carbonFootprint: 4.0, landUse: 2.8, category: 'high' }
```

---

### 2.5 USDA PDP ✅

**Status:** ✅ Implemented  
**Location:** `src/services/csvDatabases/csvDatabaseService.ts`  
**Data:** 11 crops  
**Query Method:** `queryUSDAPDP(cropName)`

**High Residue Crops:**
- strawberries, spinach, kale, peaches, pears, nectarines
- apples, bell peppers, cherries, blueberries, green beans

**Usage:**
```typescript
const pdpData = service.queryUSDAPDP('strawberries');
// Returns: { residueLevel: 'high', pesticideCount: 9 }
```

---

## 3. Integration with PLANET Pillar

### 3.1 Current Integration Status

**File:** `src/lib/truscoreEngine/pillars/planetPillar.ts`

**Integration Points:**
- ❌ Not yet integrated (needs implementation)
- ✅ CSV service ready for use

**Required Changes:**
1. Import `getCSVDatabaseService` in `planetPillar.ts`
2. Initialize service before use
3. Add queries for:
   - RSPO certification check (palm oil)
   - High eco-cost material check (packaging)
   - High farming impact check (non-animal farming)

---

## 4. Database Sourcing Requirements

### 4.1 High Priority (Needed for Core Features)

1. **Full RSPO CSV**
   - **Source:** RSPO website or API
   - **URL:** https://rspo.org/
   - **Format:** CSV with brand/company names and certification status
   - **Priority:** HIGH (needed for palm oil scoring)

2. **Full FAO FAOSTAT CSV**
   - **Source:** FAO FAOSTAT database
   - **URL:** https://www.fao.org/faostat/
   - **Format:** CSV with crop, water usage, carbon footprint, land use
   - **Priority:** HIGH (needed for non-animal farming)

3. **Full USDA PDP CSV**
   - **Source:** USDA Pesticide Data Program
   - **URL:** https://www.ams.usda.gov/datasets/pdp
   - **Format:** CSV with crop, residue levels, pesticide counts
   - **Priority:** HIGH (needed for non-animal farming)

---

### 4.2 Medium Priority (Enhancement Features)

4. **Agribalyse CSV**
   - **Source:** Agribalyse database
   - **URL:** https://agribalyse.ademe.fr/
   - **Format:** CSV with carbon factors by food category
   - **Priority:** MEDIUM (Eco-Score fallback)

5. **Full Idemat CSV**
   - **Source:** Idemat database
   - **URL:** Need to locate
   - **Format:** CSV with material eco-cost factors
   - **Priority:** MEDIUM (packaging eco-cost)

6. **Eaternity CSV/API**
   - **Source:** Eaternity
   - **URL:** https://eaternity.org/
   - **Format:** CSV or API with carbon footprint data
   - **Priority:** MEDIUM (Eco-Score fallback)

---

### 4.3 Low Priority (Nice-to-Have)

7. **RIVM CSV**
   - **Source:** RIVM (Dutch National Institute)
   - **URL:** Need to locate
   - **Format:** CSV with LCA data
   - **Priority:** LOW

8. **UK Food CSV**
   - **Source:** UK government food database
   - **URL:** Need to locate
   - **Format:** CSV with carbon factors
   - **Priority:** LOW

9. **Exiobase CSV**
   - **Source:** Exiobase project
   - **URL:** Need to locate
   - **Format:** CSV with spend-based carbon
   - **Priority:** LOW

10. **ECR Guides CSV**
    - **Source:** ECR (Efficient Consumer Response)
    - **URL:** Need to locate
    - **Format:** CSV with recycling guidelines
    - **Priority:** LOW

11. **ReCoRe CSV**
    - **Source:** ReCoRe project
    - **URL:** Need to locate
    - **Format:** CSV with recycling compatibility
    - **Priority:** LOW

12. **Recycling Partnership CSV**
    - **Source:** Recycling Partnership
    - **URL:** Need to locate
    - **Format:** CSV with US recycling data
    - **Priority:** LOW

13. **Ember CSV/API**
    - **Source:** Ember (energy data)
    - **URL:** Need to locate
    - **Format:** CSV or API
    - **Priority:** LOW

---

## 5. Implementation Roadmap

### Phase 1: ✅ COMPLETE - Hardcoded Quick Wins
- ✅ EWG Dirty Dozen (14 crops)
- ✅ RSPO Certified (15 brands)
- ✅ Idemat Eco-Cost (14 materials)
- ✅ FAO Crop Data (12 crops)
- ✅ USDA PDP (11 crops)
- ✅ CSV Database Service Layer

### Phase 2: 🔄 IN PROGRESS - Integration
- ⏳ Integrate CSV service into PLANET Pillar
- ⏳ Add RSPO certification check
- ⏳ Add eco-cost material penalty
- ⏳ Add farming impact check

### Phase 3: 📋 PLANNED - Full CSV Integration
- 📋 Source and load full RSPO CSV
- 📋 Source and load full FAO FAOSTAT CSV
- 📋 Source and load full USDA PDP CSV
- 📋 Source and load full Idemat CSV

### Phase 4: 📋 FUTURE - Additional Sources
- 📋 Source remaining CSV databases
- 📋 Implement API integrations where available
- 📋 Expand hardcoded data with CSV data

---

## 6. Next Steps

1. ✅ **Complete Phase 1** (DONE)
2. ⏳ **Integrate CSV service into PLANET Pillar** (IN PROGRESS)
3. 📋 **Source high-priority CSV files** (RSPO, FAO, USDA)
4. 📋 **Load full CSV databases** (replace hardcoded data)
5. 📋 **Test and validate** (ensure accuracy)

---

## 7. Usage Examples

### Example 1: Check RSPO Certification
```typescript
import { getCSVDatabaseService, initializeCSVDatabases } from '../services/csvDatabases/csvDatabaseService';

await initializeCSVDatabases();
const service = getCSVDatabaseService();
const isCertified = service.isRSPOCertified('unilever'); // true
```

### Example 2: Check Dirty Dozen Crop
```typescript
const isDirty = service.isDirtyDozenCrop('strawberries'); // true
```

### Example 3: Check High Eco-Cost Material
```typescript
const isHighCost = service.isHighEcoCostMaterial('aluminum'); // true
```

### Example 4: Check High Farming Impact
```typescript
const hasHighImpact = service.hasHighFarmingImpact('rice'); // true
```

---

**Document Status:** ✅ Phase 1 Complete - Ready for Integration

**Last Updated:** January 2025

