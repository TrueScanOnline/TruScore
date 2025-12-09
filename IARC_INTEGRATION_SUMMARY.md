# IARC Database Integration - Executive Summary

**Date:** January 2025  
**Status:** Analysis Complete - Ready for Implementation

---

## DATABASE OVERVIEW

**File:** `Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx`  
**Total Entries:** ~1,125 IARC-classified agents  
**Scope:** ALL agents evaluated by IARC (not just food additives)

**Structure:**
- CAS No. (Chemical Abstract Service number)
- Agent (substance/chemical name)
- Group (IARC classification: 1, 2A, 2B, 3, 4)
- Volume, Publication Year, Evaluation Year
- Additional Information

---

## CURRENT SYSTEM vs. NEW DATABASE

### Current System
- ✅ Checks E-numbers (food additives) only
- ✅ 13 additives have IARC data
- ✅ Uses `additives_tags` array
- ❌ Does NOT check regular ingredients

### New IARC Database
- ✅ 1,125 agents with IARC classifications
- ✅ Includes chemicals, substances, processes
- ✅ Not limited to food additives
- ✅ Comprehensive coverage

---

## RECOMMENDED IMPLEMENTATION

### Approach: Comprehensive Integration

**What It Does:**
1. Check ALL ingredients from `ingredients_text` against IARC database
2. Match ingredient names to IARC agent names (fuzzy matching)
3. Apply penalties in BODY Pillar based on IARC Group
4. Combine with existing E-number checking

**Benefits:**
- ✅ Maximum coverage (1,125 agents)
- ✅ Catches non-additive carcinogens
- ✅ More accurate TruScore
- ✅ Complements existing system

---

## IMPLEMENTATION PLAN

### Phase 1: Database Conversion
- Convert Excel to TypeScript/JSON
- Create `src/services/iarcDatabase.ts`
- Index by agent name and CAS number

### Phase 2: Ingredient Matching
- Create `src/utils/ingredientMatcher.ts`
- Extract ingredients from `ingredients_text`
- Fuzzy match against IARC database

### Phase 3: BODY Pillar Integration
- Modify `src/lib/truscoreEngine/pillars/bodyPillar.ts`
- Add IARC ingredient checking
- Apply penalties (Group 1: -10, 2A: -5, 2B: -3)

### Phase 4: Testing & Optimization
- Test with real products
- Optimize performance
- Handle edge cases

---

## PENALTY STRUCTURE

**IARC Group Penalties:**
- **Group 1** (Carcinogenic): -10 points
- **Group 2A** (Probably carcinogenic): -5 points
- **Group 2B** (Possibly carcinogenic): -3 points
- **Group 3** (Not classifiable): -1 point
- **Group 4** (Probably not carcinogenic): 0 points

**Capping:** Similar to NOVA cap, total IARC penalties capped at -10

---

## TECHNICAL CHALLENGES

1. **Name Matching**
   - Ingredient names vs. IARC agent names
   - Synonyms and variations
   - Language differences
   - **Solution:** Fuzzy matching with normalization

2. **Performance**
   - 1,125 agents to search
   - Multiple ingredients per product
   - **Solution:** Indexed search, caching

3. **False Positives**
   - Partial matches (e.g., "formaldehyde" in "formaldehyde releaser")
   - **Solution:** Word boundary matching, confidence scoring

---

## FILES TO CREATE

1. `src/services/iarcDatabase.ts` - IARC database service
2. `src/utils/ingredientMatcher.ts` - Ingredient matching utility
3. `src/data/iarcAgents.ts` - IARC database data (converted from Excel)

## FILES TO MODIFY

1. `src/lib/truscoreEngine/pillars/bodyPillar.ts` - Add IARC ingredient checking

---

## ESTIMATED TIMELINE

- **Phase 1:** 4-6 hours (database conversion)
- **Phase 2:** 6-8 hours (ingredient matching)
- **Phase 3:** 4-6 hours (BODY Pillar integration)
- **Phase 4:** 4-6 hours (testing & optimization)

**Total:** 2-3 days

---

## PRIORITY

**HIGH** - Significantly improves safety assessment accuracy

This integration will:
- ✅ Expand IARC coverage from 13 to 1,125 agents
- ✅ Check ALL ingredients, not just additives
- ✅ Provide more accurate TruScore
- ✅ Catch non-additive carcinogens

---

## NEXT STEPS

1. ✅ **Analyze database structure** - COMPLETE
2. ⏳ **Convert Excel to TypeScript** - READY TO START
3. ⏳ **Create IARC database service** - READY TO START
4. ⏳ **Create ingredient matcher** - READY TO START
5. ⏳ **Integrate into BODY Pillar** - READY TO START

---

**Status:** ✅ **ANALYSIS COMPLETE** - Ready for implementation

