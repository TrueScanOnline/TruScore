# TruScore Methodology Analysis & Recommendations

**Date:** January 2026  
**Analysis of:** Proposed TruScore 4-Pillar System vs Current 5-Pillar Trust Score

---

## Executive Summary

The proposed TruScore methodology offers significant advantages in **credibility, simplicity, and defensibility**, but requires careful consideration of trade-offs with the current system that users are already familiar with.

**Recommendation:** **Hybrid Approach** - Adopt the core principles (4 equal pillars, "Open" transparency, public-system scoring) while preserving Processing as an educational display element.

---

## Current System vs Proposed TruScore

### Current System (5 Pillars, Weighted)
- **Body Safety** (25%) - Nutri-Score + additives + allergens
- **Planet** (25%) - Eco-Score + packaging + palm oil
- **Ethics** (25%) - Certifications + negative flags
- **Processing** (15%) - NOVA classification + additives
- **Transparency** (10%) - Data completeness + origin info

**Scoring:** Weighted average (0-100)

### Proposed TruScore (4 Pillars, Equal Weight)
- **Body** (25 pts) - Nutri-Score + NOVA + additives + allergens
- **Planet** (25 pts) - Eco-Score + packaging + palm oil
- **Care** (25 pts) - Certifications + cruelty brands
- **Open** (25 pts) - Ingredient disclosure transparency (hidden terms detection)

**Scoring:** Direct point allocation (0-25 each = 0-100 total)

---

## Key Advantages of Proposed TruScore

### 1. **Maximum Credibility & Defensibility** ⭐⭐⭐⭐⭐
- **100% based on recognized public systems** (Nutri-Score, Eco-Score, NOVA, OFF labels)
- **Zero proprietary formulas** = cannot be accused of manipulation
- **Direct conversion** from official systems (A=25, B=20, etc.)
- **Transparent methodology** that can be easily explained and defended

### 2. **Simplicity & User Understanding** ⭐⭐⭐⭐⭐
- **4 equal pillars** = easier to understand and communicate
- **No complex weighting** = straightforward "what you see is what you get"
- **Cleaner UI** = better visual representation
- **Highly shareable** = users can easily explain the score to others

### 3. **"Open" Pillar - Highly Relevant for 2025** ⭐⭐⭐⭐⭐
- **Addresses #1 greenwashing complaint**: Hidden ingredients in beauty & food
- **Detects generic terms**: "parfum", "fragrance", "natural flavor", "proprietary blend"
- **Transparency focus**: Aligns with 2025 consumer demand for full disclosure
- **Simple detection**: Text-based pattern matching (no complex algorithms)

### 4. **Bullet-Proof Against Criticism** ⭐⭐⭐⭐⭐
- If challenged: "We use official Nutri-Score/Eco-Score/NOVA systems"
- If challenged: "We show exact conversions: A=25, B=20, etc."
- Cannot be accused of bias or manipulation
- **Perfect for press/media coverage** (transparency is a selling point)

---

## Key Disadvantages & Considerations

### 1. **Loss of Processing as Separate Educational Element** ⚠️⚠️⚠️
- **Current benefit**: Processing (NOVA) is visible separately, educating users
- **Proposed change**: NOVA merged into Body pillar, less visible
- **User education**: Separate pillar helps users understand ultra-processing
- **Industry alignment**: Many health apps (Yuka, FoodScanner) show processing separately

**Impact:** Medium - Users may understand less about processing levels

### 2. **Migration Effort** ⚠️⚠️
- Requires refactoring `trustScore.ts` calculation logic
- UI updates needed (4-quadrant display already exists, but labels change)
- Translation updates (new "Open" terminology)
- Testing across all product types
- **User confusion risk**: Changing established system

**Impact:** Medium - Significant development work required

### 3. **"Open" Pillar Data Availability** ⚠️⚠️
- Requires `ingredients_text` field (not always available)
- Some products may not have ingredient lists
- Fallback scoring needed for missing data
- **Coverage**: May have less data than other pillars initially

**Impact:** Low-Medium - Can be mitigated with good fallback logic

### 4. **Loss of Flexibility** ⚠️
- Current system allows fine-tuning weights if needed
- Equal weighting may not reflect all priorities equally
- Less ability to adjust for different product categories

**Impact:** Low - Equal weighting is actually a strength for simplicity

---

## Detailed Comparison

### Scoring Methodology

| Aspect | Current System | Proposed TruScore |
|--------|---------------|-------------------|
| **Base Score** | Weighted average (0-100) | Direct point sum (0-25 each = 0-100) |
| **Complexity** | Moderate (weighted percentages) | Low (direct conversion) |
| **Defensibility** | Good (uses public systems) | Excellent (100% public systems) |
| **Transparency** | Good | Excellent (direct conversions shown) |
| **User Understanding** | Moderate | High (simpler concept) |

### Pillar Comparison

#### Body Safety vs Body

| Current (Body Safety) | Proposed (Body) |
|----------------------|-----------------|
| Nutri-Score (primary) | Nutri-Score (A=25, B=20, etc.) |
| Additives + allergens | Additives + allergens |
| **Separate Processing** | **NOVA merged into Body** |
| High-risk additives flagged | Risky additives deducted (-3 to -10) |
| 0-100 score | 0-25 points |

**Key Difference:** NOVA is now part of Body calculation (-8 for NOVA 4, +3 for NOVA 1)

#### Planet (Same Concept)

Both systems use:
- Eco-Score (A=25, B=20, C=15, D=10, E=5)
- Palm oil detection (-8 for non-sustainable palm)
- Packaging recyclability (+5 for fully recyclable)

**Key Difference:** Proposed uses direct 0-25 point allocation vs 0-100 with weights

#### Ethics vs Care

| Current (Ethics) | Proposed (Care) |
|-----------------|-----------------|
| Certifications (bonus points) | Certifications (Fairtrade +8, Organic +7, etc.) |
| Negative flags | Cruelty brands (-10) |
| Animal welfare | Multiple labels stack up to +25 |
| 0-100 score | 0-25 points |

**Key Difference:** More explicit bonus structure, cruelty brand list

#### Transparency vs Open

| Current (Transparency) | Proposed (Open) |
|----------------------|-----------------|
| Data completeness | **Ingredient disclosure** |
| Origin information | **Hidden term detection** |
| Ingredient list presence | **% disclosure detection** |
| 10% weight | **25% weight (equal pillar)** |

**Key Difference:** Focus shifts from data availability to ingredient transparency (hidden terms like "parfum", "fragrance")

---

## Recommendations

### Option 1: Full Adoption (Recommended for Launch) ⭐⭐⭐⭐⭐

**Adopt the TruScore methodology exactly as proposed:**

**Pros:**
- Maximum credibility and defensibility
- Cleaner, simpler system
- Addresses 2025 concerns (ingredient transparency)
- Perfect for marketing ("100% based on recognized public systems")

**Cons:**
- Loses Processing as separate educational element
- Migration effort required
- User confusion risk

**Implementation:**
1. Refactor `trustScore.ts` to use 4-pillar equal weighting
2. Implement "Open" pillar with hidden term detection
3. Update UI to show 4 quadrants (Body, Planet, Care, Open)
4. Update translations and documentation
5. Add migration messaging for existing users

**Best For:** New launches, users wanting maximum credibility, media-friendly positioning

---

### Option 2: Hybrid Approach (Recommended for Existing Users) ⭐⭐⭐⭐

**Adopt TruScore principles while keeping Processing visible:**

**Implementation:**
- Use 4-pillar TruScore calculation (Body, Planet, Care, Open)
- **Display Processing separately** as educational element (not in score)
- Show NOVA classification in Processing info section
- Score is 4 pillars × 25 = 100
- Processing shown as separate info card ("NOVA Group 4 - Ultra-processed")

**Pros:**
- Maintains educational value of Processing
- Gets credibility benefits of TruScore
- Less user confusion (Processing still visible)
- Best of both worlds

**Cons:**
- Slightly more complex display
- Processing not in score (may confuse some users)

**Best For:** Existing user base, gradual migration, maximum user education

---

### Option 3: Gradual Migration ⭐⭐⭐

**Phase 1:** Keep current 5-pillar system  
**Phase 2:** Add "Open" pillar concept to Transparency  
**Phase 3:** Move to 4-pillar system (Body, Planet, Care, Open)  
**Phase 4:** Display Processing separately (educational only)

**Pros:**
- Minimal disruption
- User-friendly migration
- Can test "Open" pillar first

**Cons:**
- Longer timeline
- Temporary inconsistency
- More development work overall

---

## Implementation Details

### "Open" Pillar Implementation

```typescript
function calculateOpenScore(product: Product): number {
  let score = 25; // Start with perfect score
  
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  
  // Check for hidden terms
  const hiddenTerms = [
    'parfum', 'fragrance', 'aroma', 'flavor', 
    'natural flavor', 'natural flavour', 'proprietary blend'
  ];
  
  const hiddenCount = hiddenTerms.filter(term => 
    ingredientsText.includes(term)
  ).length;
  
  // Deduct points for hidden terms
  if (hiddenCount >= 3) {
    score -= 20; // Multiple hidden terms = major transparency issue
  } else if (hiddenCount >= 1) {
    score -= 10; // One hidden term = moderate concern
  }
  
  // Check for ingredient list
  if (!ingredientsText || ingredientsText.length < 10) {
    score = 5; // No ingredient list = very poor transparency
  }
  
  return Math.max(0, Math.min(25, score));
}
```

### Key Differences in Calculation

**Current System:**
```typescript
const overallScore = Math.round(
  sustainability * 0.25 +
  ethics * 0.25 +
  bodySafety * 0.25 +
  processing * 0.15 +
  transparency * 0.10
);
```

**Proposed TruScore:**
```typescript
const body = calculateBodyScore(product);      // 0-25
const planet = calculatePlanetScore(product);   // 0-25
const care = calculateCareScore(product);       // 0-25
const open = calculateOpenScore(product);       // 0-25

const truScore = body + planet + care + open;  // 0-100
```

---

## Final Recommendation

### **Adopt TruScore with Hybrid Display** (Option 2)

**Why:**
1. **Maximum Credibility**: 100% based on recognized public systems = bulletproof
2. **2025 Relevance**: "Open" pillar addresses current consumer concerns
3. **User Education**: Keep Processing visible (even if not in score)
4. **Simplicity**: 4 equal pillars = easier to understand
5. **Defensibility**: Can always point to official systems

**Implementation Plan:**
1. ✅ Update calculation to 4 pillars (Body, Planet, Care, Open)
2. ✅ Implement "Open" pillar with hidden term detection
3. ✅ Display Processing separately as educational element
4. ✅ Update UI to 4-quadrant display
5. ✅ Update translations and documentation
6. ✅ Add migration message: "We've improved our scoring to be 100% based on recognized public systems"

**Timeline:** 2-3 weeks for full implementation

**Risk Level:** Low (uses existing data sources, straightforward logic)

---

## Conclusion

The proposed TruScore methodology is **significantly better** than the current system for:
- Credibility
- Defensibility
- User understanding
- Marketing positioning

The main trade-off is **losing Processing as a separate score**, but this can be mitigated by displaying it separately as an educational element.

**Recommendation: Implement Option 2 (Hybrid Approach)** to get all the benefits while maintaining user education about processing levels.

