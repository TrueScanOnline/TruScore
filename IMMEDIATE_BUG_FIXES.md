# Immediate Bug Fixes Required

This document lists actual bugs found in the codebase that should be fixed immediately.

---

## 🔴 Critical Bugs

### 1. Empty Catch Blocks - Silent Error Suppression

**Location:** 
- `src/services/webSearchFallback.ts` (line 554)
- `src/services/webScrapingService.ts` (line 120)

**Issue:** Empty catch blocks silently suppress errors, making debugging impossible and hiding real issues.

**Current Code:**
```typescript
} catch {}
```

**Fix:**
```typescript
} catch (error) {
  logger.debug('Non-critical error in web search/scraping (continuing):', error);
  // Continue execution - this is acceptable for non-critical operations
}
```

**Impact:** Better error visibility, easier debugging

---

### 2. Potential Memory Leak in Active Queries Map

**Location:** `src/services/productService.ts` (line 135-156)

**Issue:** The `activeProductQueries` Map could grow unbounded if queries fail to clean up.

**Current Code:**
```typescript
const activeProductQueries = new Map<string, Promise<ProductWithTrustScore | null>>();

// Clean up after query completes
queryPromise.finally(() => {
  activeProductQueries.delete(queryKey);
});
```

**Potential Issue:** If `queryPromise` never resolves/rejects (e.g., network hang), the entry stays in the map forever.

**Fix:**
```typescript
const activeProductQueries = new Map<string, Promise<ProductWithTrustScore | null>>();
const QUERY_TIMEOUT = 30000; // 30 seconds

export async function fetchProduct(...): Promise<ProductWithTrustScore | null> {
  const queryKey = `${barcode}_${useCache}_${isPremium}_${isOffline}`;
  
  if (activeProductQueries.has(queryKey)) {
    logger.debug(`Product query already in progress for ${barcode}, waiting for existing query...`);
    return activeProductQueries.get(queryKey)!;
  }
  
  // Create query promise with timeout
  const queryPromise = Promise.race([
    executeFetchProduct(barcode, useCache, isPremium, isOffline),
    new Promise<null>((resolve) => 
      setTimeout(() => {
        logger.warn(`Query timeout for ${barcode}`);
        resolve(null);
      }, QUERY_TIMEOUT)
    )
  ]);
  
  // Store in active queries
  activeProductQueries.set(queryKey, queryPromise);
  
  // Clean up after query completes (with timeout safety)
  queryPromise.finally(() => {
    setTimeout(() => {
      activeProductQueries.delete(queryKey);
    }, 1000); // Small delay to prevent race conditions
  });
  
  return queryPromise;
}
```

**Impact:** Prevents memory leaks, better error handling

---

### 3. Missing Error Handling in Promise Chains

**Location:** Multiple files using `.then().catch()` patterns

**Issue:** Some promise chains don't handle all error cases, especially in background operations.

**Example from `productServiceOptimized.ts`:**
```typescript
enhanceProductInBackground(primaryBarcode, processedProduct, userCountry, isPremium).catch(err => {
  logger.debug('Background enhancement failed:', err);
});
```

**Issue:** If `enhanceProductInBackground` throws synchronously (before returning a promise), the error won't be caught.

**Fix:** Wrap in try-catch or ensure all async operations return promises:
```typescript
try {
  enhanceProductInBackground(primaryBarcode, processedProduct, userCountry, isPremium)
    .catch(err => {
      logger.debug('Background enhancement failed:', err);
      // Optionally report to error tracking service
    });
} catch (error) {
  logger.error('Error starting background enhancement:', error);
}
```

**Impact:** Better error handling, fewer unhandled promise rejections

---

## 🟡 High Priority Issues

### 4. Race Condition in Cache Operations

**Location:** `src/services/cacheService.ts`

**Issue:** Multiple simultaneous cache operations on the same barcode could cause race conditions.

**Current Code:**
```typescript
export async function cacheProduct(product: Product, isPremium: boolean = false): Promise<void> {
  const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
  const cache: Record<string, CachedProduct> = cacheData ? JSON.parse(cacheData) : {};
  // ... modify cache ...
  await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
}
```

**Fix:** Implement cache locking or use atomic operations:
```typescript
const cacheLocks = new Map<string, Promise<void>>();

export async function cacheProduct(product: Product, isPremium: boolean = false): Promise<void> {
  const lockKey = product.barcode;
  
  // Wait for any existing operation on this barcode
  if (cacheLocks.has(lockKey)) {
    await cacheLocks.get(lockKey);
  }
  
  const cachePromise = (async () => {
    try {
      const cacheData = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
      const cache: Record<string, CachedProduct> = cacheData ? JSON.parse(cacheData) : {};
      // ... modify cache ...
      await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
    } finally {
      cacheLocks.delete(lockKey);
    }
  })();
  
  cacheLocks.set(lockKey, cachePromise);
  await cachePromise;
}
```

**Impact:** Prevents data corruption, ensures cache consistency

---

### 5. Unvalidated API Responses

**Location:** Multiple API service files

**Issue:** API responses are not validated before use, which could cause runtime errors.

**Example:**
```typescript
const data = await response.json();
// Use data without validation
product.name = data.product_name;
```

**Fix:** Use Zod or similar for runtime validation:
```typescript
import { z } from 'zod';

const ProductResponseSchema = z.object({
  product_name: z.string().optional(),
  // ... other fields
});

const data = await response.json();
const validated = ProductResponseSchema.parse(data);
product.name = validated.product_name;
```

**Impact:** Fewer runtime errors, better type safety

---

## 🟢 Medium Priority Issues

### 6. Missing Null Checks

**Location:** Various component files

**Issue:** Some components don't check for null/undefined before accessing properties.

**Example:**
```typescript
product.trust_score_breakdown.body // Could be undefined
```

**Fix:** Add null checks or use optional chaining:
```typescript
product.trust_score_breakdown?.body ?? 0
```

**Impact:** Prevents crashes, better user experience

---

### 7. Inefficient Re-renders

**Location:** Component files using useEffect without proper dependencies

**Issue:** Some components re-render unnecessarily, causing performance issues.

**Fix:** Review all useEffect hooks and ensure dependency arrays are correct. Use React.memo for expensive components.

**Impact:** Better performance, smoother UI

---

## Testing Recommendations

After fixing these bugs, test:

1. **Error Scenarios:**
   - Network failures
   - API timeouts
   - Invalid responses
   - Cache failures

2. **Concurrency:**
   - Multiple simultaneous scans
   - Rapid cache operations
   - Parallel API calls

3. **Edge Cases:**
   - Empty responses
   - Malformed data
   - Missing fields
   - Very large responses

---

## Priority Order

1. ✅ Fix empty catch blocks (5 minutes each)
2. ✅ Add timeout to active queries map (15 minutes)
3. ✅ Improve promise error handling (30 minutes)
4. ✅ Fix cache race conditions (1 hour)
5. ✅ Add API response validation (2-3 hours)
6. ✅ Add null checks (ongoing)
7. ✅ Optimize re-renders (ongoing)

---

**Last Updated:** December 2024
