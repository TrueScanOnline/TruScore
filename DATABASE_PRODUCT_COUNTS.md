# Database Product Counts

## Current Database Status

### 🇳🇿 New Zealand (NZFCD)

**Current Count:** 221,851 products  
**File Size:** ~97.43 MB  
**Source:** `Database files/Principal files/Excel files/Standard/Standard DATA.FT.xlsx`  
**Status:** ✅ Complete and deployed

---

### 🇦🇺 Australia (AFCD)

**Current Count (Before Food Details Update):** 1,616 products  
**File Size:** ~16.4 MB  
**Source Files:**
- `Database files/AU Release 2 - Nutrient file.xlsx`
  - "All solids & liquids per 100g" sheet
  - "Liquids only per 100mL" sheet
- `Database files/AU Release 2 - Food Details.xlsx` (NOW INCLUDED)

**Status:** ⚠️ Needs regeneration with Food Details included

---

## After Running Updated Script

When you run `.\scripts\deployFSANZComplete.ps1`, the AFCD database will be regenerated with:

1. **All foods from Nutrient file** (~1,616 products)
2. **All foods from Food Details file** (thousands of additional products)
3. **Combined total:** Expected to be **thousands of products** (similar scale to NZFCD)

---

## Expected Final Counts

After deployment with updated script:

- **🇳🇿 NZFCD:** 221,851 products ✅
- **🇦🇺 AFCD:** Thousands of products (Nutrient + Food Details) ✅

---

## To Get Exact Counts

Run:
```powershell
.\scripts\getProductCounts.ps1
```

Or check after deployment:
```powershell
.\scripts\deployFSANZComplete.ps1
```

The deployment script will show:
- Number of foods from Nutrient file
- Number of foods from Food Details file  
- Total combined foods
- Final database size

---

## Summary

| Database | Current Count | After Update |
|----------|--------------|--------------|
| **NZFCD** | 221,851 | 221,851 ✅ |
| **AFCD** | 1,616 | **Thousands** (Nutrient + Food Details) ✅ |
