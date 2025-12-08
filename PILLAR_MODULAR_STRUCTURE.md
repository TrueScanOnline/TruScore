# TruScore Pillar Modular Structure

## Overview

The TruScore calculation engine has been refactored into a **modular pillar system** where each pillar (Body, Planet, Care, Open) is calculated independently. This allows:

- ✅ **Independent analysis** of each pillar
- ✅ **Separate testing** of each pillar
- ✅ **Individual modifications** without affecting other pillars
- ✅ **Consistent base score** (all pillars start at 15)
- ✅ **Clear adjustment tracking** (all changes are explicit)

---

## Directory Structure

```
src/lib/truscoreEngine/
├── index.ts                    # Main orchestrator (uses all pillars)
├── productCategoryDetection.ts # Shared utility for product category
└── pillars/
    ├── bodyPillar.ts          # Body Pillar calculation
    ├── planetPillar.ts        # Planet Pillar calculation
    ├── carePillar.ts          # Care Pillar calculation
    └── openPillar.ts          # Open Pillar calculation
```

---

## Pillar Structure

Each pillar follows the same structure:

### 1. **Base Score: Always 15**
```typescript
let score = 15; // Base score (always 15)
const base = 15;
```

### 2. **Adjustments Array**
Each adjustment is tracked with:
- `description`: Human-readable explanation
- `value`: Numeric adjustment (positive or negative)
- `type`: 'positive' | 'negative' | 'neutral'

### 3. **Result Interface**
```typescript
interface PillarResult {
  score: number;        // Final score (0-25)
  base: number;         // Always 15
  adjustments: Array<{
    description: string;
    value: number;
    type: 'positive' | 'negative' | 'neutral';
  }>;
  details: {
    // Pillar-specific details
  };
}
```

---

## Body Pillar

**File:** `src/lib/truscoreEngine/pillars/bodyPillar.ts`

**Base:** 15/25

**Adjustments:**
- Nutri-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
- Additives: Weighted by safety (safe: -0.5, caution: -1.5, avoid: -3, cap -15)
- Risky tags: -4 each (carcinogenic, endocrine, irritant, EWG high-hazard)
- Irritants: -10
- Fragrance: -10
- NOVA: 1=+3, 2=0, 3=-3, 4=-8

**Test:** `npm run test:pillar:body`

**Analyze:** `npm run analyze-pillar -- body 9420020300194`

---

## Planet Pillar

**File:** `src/lib/truscoreEngine/pillars/planetPillar.ts`

**Base:** 15/25

**Adjustments:**
- Eco-Score: A=+10, B=+5, C=0, D=-5, E=-10 (from base 15)
- Palm oil: -8 (non-certified) or -5 (certified sustainable)
- Recyclable packaging: +5 (all) or +2 (some)

**Test:** `npm run test:pillar:planet`

**Analyze:** `npm run analyze-pillar -- planet 9310055105850`

---

## Care Pillar

**File:** `src/lib/truscoreEngine/pillars/carePillar.ts`

**Base:** 15/25

**Adjustments:**
- Certifications: Fairtrade=+8, Organic=+7, Rainforest Alliance=+6, UTZ=+6, MSC/ASC=+6, RSPCA=+5, B-Corp=+5, Cage-Free/Free-Range=+4
- Certification bonus cap: +15 total
- Cruel parent: -15
- Recalls (within 12 months): -10

**Test:** `npm run test:pillar:care`

**Analyze:** `npm run analyze-pillar -- care 9310055105850`

---

## Open Pillar

**File:** `src/lib/truscoreEngine/pillars/openPillar.ts`

**Base:** 15/25

**Adjustments:**
- Ingredients disclosure: Full (>100 chars)=0 (stays 15), >80%=-5, 50-80%=-10, None=-5
- Hidden terms: 1-2=-10, ≥3=-20
- Sophistication bonus: +5 (zero hidden + NOVA 1-2)
- Origin: No origin=-8

**Test:** `npm run test:pillar:open`

**Analyze:** `npm run analyze-pillar -- open 9310055105850`

---

## Usage Examples

### Analyze Individual Pillar

```powershell
# Analyze Body Pillar
npm run analyze-pillar -- body 9420020300194

# Analyze Planet Pillar
npm run analyze-pillar -- planet 9310055105850

# Analyze Care Pillar
npm run analyze-pillar -- care 9310055105850

# Analyze Open Pillar
npm run analyze-pillar -- open 9310055105850
```

### Test Individual Pillar

```powershell
# Test Body Pillar
npm run test:pillar:body

# Test Planet Pillar
npm run test:pillar:planet

# Test Care Pillar
npm run test:pillar:care

# Test Open Pillar
npm run test:pillar:open

# Test All Pillars
npm run test:pillars
```

### Analyze Full TruScore

```powershell
# Analyze all pillars together
npm run analyze-truscore -- 9420020300194
```

---

## Key Benefits

### 1. **Consistent Base Score**
All pillars now start at 15, making the logic consistent and predictable.

### 2. **Clear Adjustments**
Every change to the score is tracked as an explicit adjustment with description and value.

### 3. **Independent Testing**
Each pillar can be tested in isolation without affecting others.

### 4. **Easy Modification**
Changes to one pillar don't require understanding the entire calculation engine.

### 5. **Better Debugging**
Each pillar's calculation is self-contained, making it easier to trace issues.

---

## Migration Notes

### Old Code (truscoreEngine.ts)
```typescript
import { calculateTruScore } from '../lib/truscoreEngine';
```

### New Code (modular)
```typescript
import { calculateTruScore } from '../lib/truscoreEngine/index';
// Or use individual pillars:
import { calculateBodyPillar } from '../lib/truscoreEngine/pillars/bodyPillar';
```

**Note:** The old import still works for backward compatibility, but internally uses the new modular system.

---

## Next Steps

1. ✅ **Modular structure created**
2. ⏳ **Test each pillar individually**
3. ⏳ **Verify calculations match expected behavior**
4. ⏳ **Update analysis scripts to use new structure**
5. ⏳ **Fix any issues found during testing**

---

**Date:** December 8, 2025  
**Status:** ✅ Modular Structure Complete - Ready for Testing

