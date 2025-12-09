# IARC Database Integration - Implementation Recommendation

**Date:** January 2025  
**Status:** ✅ Analysis Complete

---

## EXECUTIVE SUMMARY

I've analyzed the IARC Monographs database (1,125 agents) and recommend **comprehensive integration** into the TruScore system. This will significantly expand IARC coverage from 13 food additives to 1,125 agents, checking ALL ingredients (not just E-numbers).

---

## DATABASE ANALYSIS

**File:** `Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx`

**Structure:**
- **Total Entries:** ~1,125 IARC-classified agents
- **Columns:** CAS No., Agent Name, IARC Group, Volume, Publication Year, Evaluation Year, Additional Info
- **Scope:** ALL agents evaluated by IARC (chemicals, substances, processes, not just food additives)

**IARC Groups:**
- Group 1: Carcinogenic to humans
- Group 2A: Probably carcinogenic to humans
- Group 2B: Possibly carcinogenic to humans
- Group 3: Not classifiable as to carcinogenicity
- Group 4: Probably not carcinogenic to humans

---

## CURRENT SYSTEM LIMITATIONS

**Current Implementation:**
- ✅ Only checks E-numbers (food additives)
- ✅ 13 additives have IARC data
- ✅ Uses `additives_tags` array

**What's Missing:**
- ❌ Does NOT check regular ingredients (e.g., "formaldehyde", "asbestos")
- ❌ Does NOT check `ingredients_text` for IARC-classified substances
- ❌ Limited to 13 additives (out of 1,125 IARC agents)

---

## RECOMMENDED IMPLEMENTATION

### Approach: Comprehensive Integration

**What It Does:**
1. **Extract ingredients** from `product.ingredients_text`
2. **Match ingredient names** against IARC database (fuzzy matching)
3. **Apply penalties** in BODY Pillar based on IARC Group
4. **Combine** with existing E-number checking (no duplication)

**Benefits:**
- ✅ Expands coverage from 13 to 1,125 agents
- ✅ Checks ALL ingredients, not just additives
- ✅ Catches non-additive carcinogens
- ✅ More accurate TruScore
- ✅ Complements existing system

---

## IMPLEMENTATION PLAN

### Phase 1: Database Conversion (4-6 hours)

**Create:** `src/services/iarcDatabase.ts`

**Tasks:**
1. Convert Excel to TypeScript/JSON format
2. Create `IARC_AGENT_DATABASE` with structure:
   ```typescript
   interface IARCAgent {
     casNo?: string;
     agent: string;
     group: '1' | '2A' | '2B' | '3' | '4';
     volume?: string;
     publicationYear?: number;
     evaluationYear?: number;
   }
   ```
3. Index by agent name (normalized) and CAS number
4. Create query functions:
   - `getIARCInfo(agentName: string): IARCAgent | null`
   - `searchIARCByCAS(casNo: string): IARCAgent | null`
   - `findIARCInIngredients(ingredientsText: string): IARCAgent[]`

### Phase 2: Ingredient Matching (6-8 hours)

**Create:** `src/utils/ingredientMatcher.ts`

**Tasks:**
1. Extract ingredient names from `ingredients_text`
   - Split by commas, "and", etc.
   - Normalize (lowercase, remove punctuation)
2. Fuzzy match against IARC agent names
   - Word boundary matching
   - Synonym handling
   - Partial match detection
3. Return matched IARC agents with confidence scores

**Challenges:**
- Language variations (English, Spanish, etc.)
- Synonyms (e.g., "Sodium Nitrite" = "E250")
- Partial matches (e.g., "formaldehyde" in "formaldehyde releaser")

### Phase 3: BODY Pillar Integration (4-6 hours)

**Modify:** `src/lib/truscoreEngine/pillars/bodyPillar.ts`

**Tasks:**
1. Add IARC ingredient checking after additive checking
2. Apply penalties based on IARC Group:
   - Group 1: -10 points
   - Group 2A: -5 points
   - Group 2B: -3 points
   - Group 3: -1 point
   - Group 4: 0 points
3. Cap total IARC penalties at -10 (similar to NOVA cap)
4. Add to adjustments array for transparency
5. Deduplicate if same substance found via E-number and ingredient name

### Phase 4: Testing & Optimization (4-6 hours)

**Tasks:**
1. Test with real products
2. Optimize matching algorithm
3. Add caching for performance
4. Handle edge cases

---

## PENALTY STRUCTURE

**IARC Group Penalties (BODY Pillar):**
- **Group 1** (Carcinogenic): -10 points
- **Group 2A** (Probably carcinogenic): -5 points
- **Group 2B** (Possibly carcinogenic): -3 points
- **Group 3** (Not classifiable): -1 point
- **Group 4** (Probably not carcinogenic): 0 points

**Capping:**
- Total IARC penalties capped at -10 (similar to NOVA cap)
- Prevents excessive penalties

**Deduplication:**
- If same substance found via E-number AND ingredient name, apply penalty once

---

## TECHNICAL CONSIDERATIONS

### Name Matching Strategy

1. **Normalization:**
   - Convert to lowercase
   - Remove punctuation
   - Handle common variations

2. **Fuzzy Matching:**
   - Word boundary matching
   - Synonym dictionary
   - Partial match detection

3. **Performance:**
   - Index by normalized agent name
   - Cache matched results
   - Lazy load database

### Example Matching

**Product Ingredients:**
```
"Water, Sodium Nitrite, Formaldehyde, Sugar"
```

**Matches:**
- "Sodium Nitrite" → IARC Group 2A → -5 points
- "Formaldehyde" → IARC Group 1 → -10 points

**Total IARC Penalty:** -10 (capped)

---

## FILES TO CREATE

1. **`src/services/iarcDatabase.ts`**
   - IARC database service
   - Query functions
   - Indexing

2. **`src/utils/ingredientMatcher.ts`**
   - Ingredient extraction
   - Fuzzy matching
   - Synonym handling

3. **`src/data/iarcAgents.ts`**
   - IARC database data (converted from Excel)
   - TypeScript format

## FILES TO MODIFY

1. **`src/lib/truscoreEngine/pillars/bodyPillar.ts`**
   - Add IARC ingredient checking
   - Apply penalties
   - Add to adjustments

---

## ESTIMATED TIMELINE

- **Phase 1:** 4-6 hours
- **Phase 2:** 6-8 hours
- **Phase 3:** 4-6 hours
- **Phase 4:** 4-6 hours

**Total:** 18-26 hours (2-3 days)

---

## PRIORITY

**HIGH** - Significantly improves safety assessment accuracy

**Impact:**
- Expands IARC coverage from 13 to 1,125 agents
- Checks ALL ingredients, not just additives
- More accurate TruScore
- Catches non-additive carcinogens

---

## RECOMMENDATION

**Implement Comprehensive Integration (Option 1)**

This approach:
- ✅ Maximizes IARC coverage
- ✅ Checks all ingredients
- ✅ Provides most accurate TruScore
- ✅ Complements existing E-number system

**Next Step:** Begin Phase 1 (Database Conversion)

---

**Status:** ✅ **ANALYSIS COMPLETE** - Ready for implementation

