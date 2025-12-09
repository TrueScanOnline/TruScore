# IARC Database Integration Analysis & Implementation Plan

**Date:** January 2025  
**File Analyzed:** `Agents Classified by the IARC Monographs, Volumes 1–140 (1).xlsx`

---

## DATABASE STRUCTURE ANALYSIS

### Excel File Structure

**Total Entries:** 1,125 IARC-classified agents  
**Columns:**
1. **CAS No.** - Chemical Abstract Service number (unique identifier)
2. **Agent** - Substance/chemical name
3. **Group** - IARC classification (1, 2A, 2B, 3, etc.)
4. **Volume** - IARC Monograph volume number
5. **Volume publication year** - Year published
6. **Evaluation year** - Year evaluated
7. **Additional information** - Additional notes

### IARC Group Distribution

- **Group 1:** Carcinogenic to humans
- **Group 2A:** Probably carcinogenic to humans
- **Group 2B:** Possibly carcinogenic to humans
- **Group 3:** Not classifiable as to carcinogenicity
- **Group 4:** Probably not carcinogenic to humans

**Note:** This database includes ALL agents evaluated by IARC, not just food additives:
- Chemicals
- Substances
- Processes (e.g., "Tobacco smoking", "Alcoholic beverages")
- Mixtures
- Occupational exposures
- Environmental agents

---

## CURRENT SYSTEM ANALYSIS

### Current IARC Implementation

**Location:** `src/services/additiveDatabase.ts` + `src/lib/truscoreEngine/pillars/bodyPillar.ts`

**Current Coverage:**
- ✅ Only E-numbers (food additives) are checked
- ✅ 13 food additives have IARC classifications
- ✅ Uses `additives_tags` array from product data
- ✅ Matches E-numbers (e.g., "e250") to database

**Limitations:**
- ❌ Only checks food additives (E-numbers)
- ❌ Does NOT check regular ingredients (e.g., "formaldehyde", "asbestos", "tobacco")
- ❌ Does NOT check ingredient names from `ingredients_text`
- ❌ Limited to 13 additives (out of 1,125 IARC-classified agents)

---

## INTEGRATION REQUIREMENTS

### What Needs to Be Done

1. **Load IARC Database**
   - Convert Excel to JSON/TypeScript
   - Create query service
   - Index by agent name and CAS number

2. **Ingredient Matching**
   - Extract ingredient names from `ingredients_text`
   - Match against IARC agent names (fuzzy matching)
   - Handle synonyms and variations

3. **BODY Pillar Integration**
   - Check ingredients against IARC database
   - Apply penalties based on IARC Group
   - Combine with existing additive penalties

4. **Performance Optimization**
   - Efficient lookup (indexed search)
   - Caching
   - Fast fuzzy matching

---

## IMPLEMENTATION PLAN

### Phase 1: Database Conversion & Service Creation

**File:** `src/services/iarcDatabase.ts`

**Tasks:**
1. Convert Excel to TypeScript/JSON
2. Create `IARC_AGENT_DATABASE` with structure:
   ```typescript
   interface IARCAgent {
     casNo?: string;
     agent: string;
     group: '1' | '2A' | '2B' | '3' | '4';
     volume?: string;
     publicationYear?: number;
     evaluationYear?: number;
     additionalInfo?: string;
   }
   ```
3. Create query functions:
   - `getIARCInfo(agentName: string): IARCAgent | null`
   - `searchIARCByCAS(casNo: string): IARCAgent | null`
   - `findIARCInIngredients(ingredientsText: string): IARCAgent[]`

### Phase 2: Ingredient Extraction & Matching

**File:** `src/utils/ingredientMatcher.ts`

**Tasks:**
1. Extract ingredient names from `ingredients_text`
2. Normalize ingredient names (lowercase, remove punctuation)
3. Fuzzy matching against IARC agent names
4. Handle synonyms and variations
5. Return matched IARC agents with confidence scores

**Challenges:**
- Ingredient names may be in different languages
- Multiple names for same substance (e.g., "Sodium Nitrite" vs "E250")
- Partial matches (e.g., "formaldehyde" in "formaldehyde releaser")
- CAS number matching (if available in ingredients)

### Phase 3: BODY Pillar Integration

**File:** `src/lib/truscoreEngine/pillars/bodyPillar.ts`

**Tasks:**
1. Add IARC ingredient checking after additive checking
2. Apply penalties based on IARC Group:
   - Group 1: -10 points
   - Group 2A: -5 points
   - Group 2B: -3 points
   - Group 3: -1 point (not classifiable)
   - Group 4: 0 points (probably not carcinogenic)
3. Cap total IARC penalties (similar to NOVA cap)
4. Add to adjustments array for transparency

### Phase 4: Testing & Optimization

**Tasks:**
1. Test with real products
2. Optimize matching algorithm
3. Add caching for performance
4. Handle edge cases

---

## RECOMMENDED IMPLEMENTATION APPROACH

### Option 1: Comprehensive Integration (RECOMMENDED)

**Scope:** Check ALL ingredients against IARC database

**Pros:**
- ✅ Maximum coverage (1,125 agents)
- ✅ Catches non-additive carcinogens
- ✅ More accurate TruScore

**Cons:**
- ⚠️ More complex (fuzzy matching needed)
- ⚠️ Performance considerations
- ⚠️ False positives possible

**Implementation:**
1. Extract ingredients from `ingredients_text`
2. Match each ingredient against IARC database
3. Apply penalties for matches

### Option 2: Hybrid Approach

**Scope:** Check ingredients + existing additive system

**Pros:**
- ✅ Uses existing additive system
- ✅ Adds ingredient checking
- ✅ Balanced approach

**Cons:**
- ⚠️ Some overlap (E-numbers already checked)
- ⚠️ Still need fuzzy matching

**Implementation:**
1. Keep existing E-number checking
2. Add ingredient name checking
3. Deduplicate penalties (if same substance found both ways)

### Option 3: CAS Number Matching (FUTURE)

**Scope:** Match by CAS numbers if available

**Pros:**
- ✅ Most accurate matching
- ✅ No false positives

**Cons:**
- ❌ CAS numbers rarely in product data
- ❌ Requires product data enhancement

**Implementation:**
- Future enhancement if CAS numbers become available

---

## RECOMMENDED: Option 1 (Comprehensive Integration)

### Implementation Steps

1. **Create IARC Database Service**
   - Convert Excel to TypeScript
   - Create query functions
   - Index by agent name

2. **Create Ingredient Matcher**
   - Extract ingredients from text
   - Normalize names
   - Fuzzy match against IARC database

3. **Integrate into BODY Pillar**
   - Check ingredients after additives
   - Apply IARC penalties
   - Add to adjustments

4. **Test & Optimize**
   - Test with real products
   - Optimize performance
   - Handle edge cases

---

## TECHNICAL CONSIDERATIONS

### Name Matching Challenges

1. **Language Variations**
   - English: "Formaldehyde"
   - Spanish: "Formaldehído"
   - Solution: Normalize to English, use translation if available

2. **Synonym Handling**
   - "Sodium Nitrite" = "E250" = "NaNO2"
   - Solution: Synonym dictionary

3. **Partial Matches**
   - "Formaldehyde releaser" contains "formaldehyde"
   - Solution: Word boundary matching

4. **Case Sensitivity**
   - "FORMALDEHYDE" vs "formaldehyde"
   - Solution: Case-insensitive matching

### Performance Optimization

1. **Indexing**
   - Index by agent name (normalized)
   - Index by CAS number
   - Fast lookup

2. **Caching**
   - Cache matched results
   - Avoid re-matching same ingredients

3. **Lazy Loading**
   - Load IARC database on first use
   - Keep in memory for subsequent queries

---

## FILES TO CREATE/MODIFY

### New Files

1. `src/services/iarcDatabase.ts` - IARC database service
2. `src/utils/ingredientMatcher.ts` - Ingredient extraction & matching
3. `src/data/iarcAgents.ts` - IARC database data (converted from Excel)

### Modified Files

1. `src/lib/truscoreEngine/pillars/bodyPillar.ts` - Add IARC ingredient checking
2. `src/types/product.ts` - Add IARC data to Product interface (optional)

---

## NEXT STEPS

1. ✅ **Analyze database structure** - DONE
2. ⏳ **Convert Excel to TypeScript** - NEXT
3. ⏳ **Create IARC database service** - NEXT
4. ⏳ **Create ingredient matcher** - NEXT
5. ⏳ **Integrate into BODY Pillar** - NEXT
6. ⏳ **Test & optimize** - NEXT

---

## CONCLUSION

**Recommendation:** Implement **Option 1 (Comprehensive Integration)**

This will:
- ✅ Check ALL ingredients against IARC database (1,125 agents)
- ✅ Catch non-additive carcinogens
- ✅ Provide more accurate TruScore
- ✅ Complement existing E-number checking

**Estimated Implementation Time:** 2-3 days

**Priority:** HIGH - Significantly improves safety assessment accuracy

