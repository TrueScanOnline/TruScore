# Optimal Product Query Algorithm Design

## Goals
1. **Maximum Success Rate** - Query all databases, never give up
2. **Minimum Time to Display** - Show product as soon as first result arrives
3. **Maximum Information** - Continue querying in background, merge progressively
4. **Progressive Loading** - Display data as it arrives, update UI incrementally

## Current Issues

### ❌ **Problem #1: Sequential Phases**
- Current: Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
- Impact: Each phase waits for previous phase to complete
- Example: Phase 0 takes 2s, Phase 1 takes 3s, Phase 2 takes 2s = **7 seconds total**
- **Fix:** Query ALL phases in parallel

### ❌ **Problem #2: Artificial Timeout**
- Current: 10-second timeout blocks all results
- Impact: If any query takes >10s, we lose that data
- **Fix:** No timeout - let all queries complete, display as they arrive

### ❌ **Problem #3: No Progressive Display**
- Current: Wait for all queries, then merge, then display
- Impact: User waits 5-10 seconds before seeing anything
- **Fix:** Display first result immediately, merge incrementally

### ❌ **Problem #4: Early Exit Logic**
- Current: Skip fallbacks if we have "good data" (>60% complete)
- Impact: Missing data from fallbacks that could improve completeness
- **Fix:** Always query all databases, merge incrementally

## Optimal Algorithm Design

### **Strategy: "Fire and Merge" Pattern**

```
1. Fire ALL queries simultaneously (no phases)
2. Display first result immediately (0.5-2s)
3. Merge results as they arrive (progressive enhancement)
4. Continue querying in background (no timeout)
5. Update UI incrementally as new data arrives
```

### **Implementation Pattern**

```typescript
async function queryAllDatabasesProgressive(
  barcode: string,
  onProductUpdate: (product: Product) => void
): Promise<Product> {
  // 1. Fire ALL queries simultaneously
  const allQueries = [
    // Fast sources (0.5-2s) - for immediate display
    fetchProductFromOFF(barcode),      // ~1-2s
    fetchProductFromOBF(barcode),      // ~1-2s
    fetchProductFromOPFF(barcode),      // ~1-2s
    fetchProductFromOPF(barcode),       // ~1-2s
    
    // Medium sources (2-5s) - for enhancement
    fetchProductFromUSDA(barcode),      // ~2-4s
    fetchProductFromHealthCanada(barcode), // ~2-4s
    fetchProductFromUKFSA(barcode),     // ~2-4s
    fetchProductFromEFSA(barcode),      // ~2-4s
    
    // Slow sources (5-15s) - for maximum data
    fetchProductFromGS1(barcode),       // ~5-10s
    fetchProductFromTesco(barcode),    // ~3-8s
    fetchProductFromWalmart(barcode),  // ~3-8s
    fetchProductFromUPCitemdb(barcode), // ~2-5s
    fetchProductFromEANSearch(barcode), // ~2-5s
    // ... all other databases
  ];
  
  let mergedProduct: Product | null = null;
  
  // 2. Process results as they arrive (progressive)
  for (const query of allQueries) {
    query.then(product => {
      if (product) {
        if (!mergedProduct) {
          // First result - display immediately
          mergedProduct = product;
          onProductUpdate(mergedProduct); // Display now!
        } else {
          // Merge with existing product
          mergedProduct = mergeProducts([mergedProduct, product]);
          onProductUpdate(mergedProduct); // Update UI
        }
      }
    }).catch(() => {
      // Ignore errors - continue with other queries
    });
  }
  
  // 3. Wait for all queries (no timeout)
  await Promise.allSettled(allQueries);
  
  return mergedProduct || createMinimalProduct(barcode);
}
```

## Database Priority Tiers

### **Tier 1: Fast & Reliable (0.5-2s) - Display First**
- Open Food Facts (global)
- Open Beauty Facts
- Open Pet Food Facts
- Open Products Facts
- **Strategy:** Display immediately when first Tier 1 result arrives

### **Tier 2: Medium & Authoritative (2-5s) - Enhance**
- USDA (US)
- Health Canada (CA)
- UK FSA (GB)
- EFSA (EU)
- FSANZ (AU/NZ)
- **Strategy:** Merge as they arrive, update UI

### **Tier 3: Slow but Valuable (5-15s) - Complete**
- GS1
- Store APIs (Tesco, Walmart, etc.)
- Nutrition APIs (Edamam, Nutritionix, Spoonacular)
- **Strategy:** Continue in background, merge when ready

### **Tier 4: Fallbacks (2-10s) - Maximum Coverage**
- UPCitemdb
- EAN-Search
- Barcode Spider
- Web Search (last resort)
- **Strategy:** Always query, merge when ready

## Progressive Display Strategy

### **Display Thresholds**

1. **Immediate Display (0.5-2s)**
   - First product from Tier 1 arrives
   - Display: Product name, image, basic info
   - Show: "Loading more data..." indicator

2. **Enhanced Display (2-5s)**
   - Tier 2 results arrive
   - Update: Nutrition, ingredients, certifications
   - Show: "Enhancing data..." indicator

3. **Complete Display (5-15s)**
   - Tier 3 results arrive
   - Update: Full nutrition, recalls, pricing
   - Show: "Finalizing..." indicator

4. **Maximum Data (15-30s)**
   - Tier 4 results arrive
   - Update: Any missing fields
   - Hide: Loading indicators

## Implementation Plan

### **Step 1: Remove Phase-Based Querying**
- Change `executeQueryPhases()` to query all databases simultaneously
- Remove sequential `await` statements
- Fire all queries at once

### **Step 2: Implement Progressive Merging**
- Create `mergeProductsProgressive()` function
- Merge results as they arrive
- Emit updates via callback/event

### **Step 3: Remove Artificial Timeouts**
- Remove 10-second timeout
- Let all queries complete naturally
- Use per-query timeouts (30s) instead of global timeout

### **Step 4: Add Progressive Display**
- Update UI component to accept progressive updates
- Display product as soon as first result arrives
- Update UI incrementally as more data arrives

### **Step 5: Smart Query Prioritization**
- Query Tier 1 first (fastest)
- Display immediately when Tier 1 arrives
- Continue querying Tiers 2-4 in background

## Expected Performance

### **Current (Sequential Phases)**
- Time to First Display: 2-5 seconds
- Time to Complete: 10-15 seconds
- Success Rate: 85-90%

### **Optimal (Parallel + Progressive)**
- Time to First Display: **0.5-2 seconds** ⚡
- Time to Complete: 5-10 seconds (same, but user sees data earlier)
- Success Rate: **95-98%** (no early exits, all databases queried)

## Benefits

1. ✅ **Faster Initial Display** - User sees product in 0.5-2s instead of 2-5s
2. ✅ **Higher Success Rate** - All databases queried, no early exits
3. ✅ **Better UX** - Progressive loading feels faster even if total time is same
4. ✅ **Maximum Data** - No artificial limits, all sources contribute
5. ✅ **Resilient** - Slow databases don't block fast ones
