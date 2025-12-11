# PLANET Pillar - Database Inventory & Implementation Status

**Date:** January 2025  
**Purpose:** Inventory of required databases for PLANET Pillar new specification  
**Status:** Pre-Implementation Analysis

---

## Executive Summary

This document provides a comprehensive inventory of all databases required for the PLANET Pillar new specification, their current status, availability, and implementation plan.

**Total Required Databases:** 14  
**Currently Available:** 0 (hardcoded data only)  
**Publicly Available:** TBD (researching)  
**Needs Manual Sourcing:** TBD

---

## 1. Required Databases by Category

### 1.1 Eco-Score Fallback Databases

| Database | Purpose | Status | Priority | Source Type |
|----------|---------|--------|----------|-------------|
| **Agribalyse** | Carbon footprint fallback | ❌ Missing | Medium | CSV/API |
| **RIVM** | Dutch LCA data | ❌ Missing | Medium | CSV |
| **UK Food** | UK carbon factors | ❌ Missing | Medium | CSV |
| **Exiobase** | Spend-based carbon | ❌ Missing | Medium | CSV |
| **Ember** | Energy/carbon data | ❌ Missing | Low | CSV/API |
| **Eaternity** | Food carbon footprint | ❌ Missing | Medium | CSV/API |

**Current Implementation:**
- ✅ Agribalyse data is extracted from `ecoscore_data.agribalyse` but not used for fallback
- ❌ No CSV lookup system exists

**Note:** These are fallback sources - only used when Eco-Score is missing from Open Food Facts.

---

### 1.2 Palm Oil / Deforestation Databases

| Database | Purpose | Status | Priority | Source Type |
|----------|---------|--------|----------|-------------|
| **RSPO CSV** | Certified palm oil lookup | ❌ Missing | **HIGH** | CSV |
| **WWF Scorecard** | Brand sustainability ratings | ⚠️ Partial | **HIGH** | Hardcoded |

**Current Implementation:**
- ⚠️ WWF data is hardcoded in `wwfPalmOilEnhancement.ts` (limited brands)
- ❌ No RSPO CSV lookup exists
- ❌ No brand/parent overlay system

**Note:** RSPO CSV is critical for determining certified sustainable palm oil (0 penalty vs -8).

---

### 1.3 Packaging Databases

| Database | Purpose | Status | Priority | Source Type |
|----------|---------|--------|----------|-------------|
| **Idemat CSV** | Material eco-cost factors | ❌ Missing | Medium | CSV |
| **ECR Guides CSV** | Recycling guidelines | ❌ Missing | Low | CSV |
| **ReCoRe CSV** | Recycling compatibility | ❌ Missing | Low | CSV |
| **Recycling Partnership CSV** | US recycling data | ❌ Missing | Low | CSV |

**Current Implementation:**
- ✅ Local recyclability checking exists (`packagingRecyclability.ts`)
- ❌ No eco-cost material penalty system
- ❌ No CSV lookup for eco-cost factors

**Note:** Eco-cost penalty is secondary to recyclability bonus, but adds important nuance.

---

### 1.4 Non-Animal Farming Databases

| Database | Purpose | Status | Priority | Source Type |
|----------|---------|--------|----------|-------------|
| **FAO FAOSTAT CSV** | Crop water/carbon/land use | ❌ Missing | **HIGH** | CSV/API |
| **EWG Dirty Dozen CSV** | High pesticide residue crops | ❌ Missing | **HIGH** | CSV/Web |
| **USDA PDP CSV** | Pesticide residue data | ❌ Missing | **HIGH** | CSV |

**Current Implementation:**
- ❌ **COMPLETELY MISSING** - This is a new feature
- ❌ No origins_tags analysis
- ❌ No farming impact lookup

**Note:** This is a **NEW REQUIREMENT** and critical for the new spec.

---

## 2. Database Availability Research

### 2.1 Publicly Available Databases

**Status:** Researching public availability...

---

## 3. Implementation Plan

### 3.1 Phase 1: Quick Wins (Hardcoded Data)

**Databases that can be implemented immediately with hardcoded data:**

1. **EWG Dirty Dozen** (High Priority)
   - Small, well-known list (12 crops)
   - Can be hardcoded initially
   - **Effort:** 2-4 hours

2. **RSPO Certified Brands** (High Priority)
   - Can start with known RSPO-certified brands
   - Expand with CSV later
   - **Effort:** 4-6 hours

3. **Idemat Eco-Cost Materials** (Medium Priority)
   - Can hardcode common high eco-cost materials
   - Expand with CSV later
   - **Effort:** 3-4 hours

---

### 3.2 Phase 2: CSV Integration (Public Sources)

**Databases with publicly available CSV files:**

1. **FAO FAOSTAT** (High Priority)
   - Public API and CSV downloads available
   - **Effort:** 8-12 hours

2. **USDA PDP** (High Priority)
   - Public CSV downloads available
   - **Effort:** 6-10 hours

3. **EWG Dirty Dozen** (High Priority)
   - Can be scraped or hardcoded
   - **Effort:** 2-4 hours (hardcoded) or 4-6 hours (scraped)

---

### 3.3 Phase 3: API Integration (Where Available)

**Databases with APIs:**

1. **Agribalyse** (Medium Priority)
   - May have API access
   - **Effort:** 6-10 hours

2. **Eaternity** (Medium Priority)
   - May have API access
   - **Effort:** 6-10 hours

---

### 3.4 Phase 4: Manual Sourcing Required

**Databases that need manual sourcing:**

1. **RIVM CSV** (Medium Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

2. **UK Food CSV** (Medium Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

3. **Exiobase CSV** (Medium Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

4. **ECR Guides CSV** (Low Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

5. **ReCoRe CSV** (Low Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

6. **Recycling Partnership CSV** (Low Priority)
   - Need to locate and obtain CSV
   - **Effort:** TBD

---

## 4. Current Database Status

### 4.1 Existing Data Sources

| Source | Type | Status | Used For |
|--------|------|--------|----------|
| **Open Food Facts** | API | ✅ Integrated | Eco-Score, Palm Oil, Packaging |
| **WWF Scorecard** | Hardcoded | ⚠️ Partial | Palm Oil (limited brands) |
| **Local Recyclability** | Hardcoded | ✅ Integrated | Packaging recyclability |

### 4.2 Missing Infrastructure

- ❌ **CSV Database Service Layer:** No system to load/query CSV files
- ❌ **CSV Lookup Functions:** No lookup functions for carbon factors, eco-costs, etc.
- ❌ **Origins Analysis:** No system to parse origins_tags and match against databases
- ❌ **Brand/Parent Extraction:** No reliable system to extract brand/parent from product data

---

## 5. Next Steps

1. **Research public availability** of all required databases
2. **Implement Phase 1** (hardcoded quick wins)
3. **Create CSV service layer** for Phase 2
4. **Source missing databases** for Phase 4
5. **Implement Phase 2 & 3** (public CSV/API integration)

---

**Document Status:** 🔄 In Progress - Researching database availability

