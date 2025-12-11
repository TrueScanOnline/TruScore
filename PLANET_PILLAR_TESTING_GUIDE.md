# PLANET Pillar - Comprehensive Testing Guide

**Purpose:** Verify database reliability, query accuracy, and PLANET Pillar logic correctness

---

## Testing Strategy

### 1. Unit Tests ✅
**Location:** `src/services/csvDatabases/__tests__/csvDatabaseService.test.ts`

**Tests:**
- Database initialization
- Query accuracy for each database
- Case-insensitive matching
- Edge cases (null, unknown values)
- Concurrent queries

**Run:**
```bash
npm run test:csv-database
```

---

### 2. Integration Tests ✅
**Location:** `src/__tests__/unit/lib/pillars/planetPillar.test.ts`

**Tests:**
- Base score (always 15)
- Eco-Score adjustments (A-E)
- Palm oil penalties (RSPO = 0, non-certified = -8)
- Recyclable packaging bonuses
- Packaging eco-cost penalties
- Non-animal farming factor
- Brand/parent overlay
- Score capping (0-25)
- Real-world scenarios

**Run:**
```bash
npm run test:pillar:planet
```

---

### 3. Manual Test Script ✅
**Location:** `scripts/test-planet-pillar.ts`

**Purpose:** Quick verification of database queries and PLANET Pillar calculations

**Run:**
```bash
npx ts-node scripts/test-planet-pillar.ts
```

**Output:**
- Database query results
- PLANET Pillar scores for test products
- Adjustment breakdowns

---

## Test Scenarios

### Scenario 1: RSPO Certified Product (Unilever)
**Product:**
- Brand: Unilever
- Eco-Score: B
- Palm Oil: Certified sustainable (RSPO)
- Packaging: Cardboard (recyclable)
- Origins: Potatoes

**Expected:**
- Base: 15
- Eco-Score B: +5
- Palm Oil: 0 (RSPO certified, not -5)
- Recyclable: +5
- Farming: +3 (low-impact)
- **Final Score: ~23-25**

**Verify:**
- ✅ RSPO certification detected
- ✅ 0 penalty (not -5)
- ✅ All bonuses applied

---

### Scenario 2: High Impact Product
**Product:**
- Eco-Score: E
- Palm Oil: Non-certified
- Packaging: Aluminum
- Origins: Rice

**Expected:**
- Base: 15
- Eco-Score E: -10
- Palm Oil: -8
- Packaging Eco-Cost: -5
- Farming Impact: -5
- **Final Score: 0 (capped)**

**Verify:**
- ✅ All penalties applied
- ✅ Score capped at 0
- ✅ No negative scores

---

### Scenario 3: Low Impact Product
**Product:**
- Eco-Score: A
- Palm Oil: None
- Packaging: All recyclable
- Origins: Potatoes

**Expected:**
- Base: 15
- Eco-Score A: +10
- Palm Oil: 0
- Recyclable: +5
- Farming: +3
- **Final Score: 25 (capped)**

**Verify:**
- ✅ All bonuses applied
- ✅ Score capped at 25
- ✅ No overflow

---

### Scenario 4: Dirty Dozen Product
**Product:**
- Eco-Score: C
- Origins: Strawberries
- Packaging: Plastic

**Expected:**
- Base: 15
- Eco-Score C: 0
- Farming Impact: -5 (dirty dozen detected)
- **Final Score: ~10**

**Verify:**
- ✅ Strawberries detected in EWG Dirty Dozen
- ✅ High farming impact penalty applied

---

## Database Reliability Tests

### Test 1: Query Accuracy
```typescript
// Verify each database returns correct results
service.isDirtyDozenCrop('strawberries') // Should be true
service.isRSPOCertified('unilever') // Should be true
service.isHighEcoCostMaterial('aluminum') // Should be true
service.hasHighFarmingImpact('rice') // Should be true
```

### Test 2: Case Insensitivity
```typescript
// All queries should be case-insensitive
service.isDirtyDozenCrop('STRAWBERRIES') // Should be true
service.isRSPOCertified('UNILEVER') // Should be true
```

### Test 3: Unknown Values
```typescript
// Should return false/null for unknown values
service.isDirtyDozenCrop('unknown-crop') // Should be false
service.queryRSPOCertified('unknown-brand') // Should be null
```

### Test 4: Concurrent Queries
```typescript
// Multiple simultaneous queries should work
Promise.all([
  service.queryEWGDirtyDozen('strawberries'),
  service.queryRSPOCertified('unilever'),
  service.queryIdematEcoCost('aluminum'),
])
```

---

## Real-World Barcode Testing

### Step 1: Scan Product
1. Open app
2. Scan product barcode
3. Navigate to product result page

### Step 2: Verify PLANET Pillar Score
1. Check TruScore breakdown
2. Verify PLANET Pillar score (0-25)
3. Check adjustment details

### Step 3: Verify Adjustments
1. **Eco-Score:** Check if grade matches adjustment
2. **Palm Oil:** Verify penalty (0 for RSPO, -8 for non-certified)
3. **Packaging:** Check recyclable bonus
4. **Farming:** Verify farming impact adjustment

### Step 4: Cross-Reference
1. Check product data in OFF database
2. Verify CSV database queries match
3. Confirm score calculation is correct

---

## Known Test Products

### High Confidence Products
1. **Unilever Products:**
   - Should show RSPO certified (0 penalty)
   - Brand: Unilever

2. **Strawberry Products:**
   - Should show farming impact penalty (-5)
   - Origins: Strawberries

3. **Aluminum Packaging:**
   - Should show eco-cost penalty (-5)
   - Packaging: Aluminum

---

## Debugging Tips

### Issue: Database Not Initialized
**Solution:**
- Check `app/_layout.tsx` for CSV initialization
- Verify initialization runs before PLANET Pillar calculation

### Issue: Queries Return Null
**Solution:**
- Check database data matches query format
- Verify case-insensitive matching works
- Check for typos in database entries

### Issue: Score Calculation Wrong
**Solution:**
- Check adjustment values in `planetPillar.ts`
- Verify score capping (0-25)
- Check for double-counting penalties

### Issue: RSPO Not Detected
**Solution:**
- Verify brand name matches database entry
- Check brand extraction logic
- Test with exact brand name from database

---

## Performance Testing

### Test 1: Database Initialization Time
```typescript
const start = Date.now();
await initializeCSVDatabases();
const duration = Date.now() - start;
console.log(`Initialization: ${duration}ms`);
// Should be < 100ms
```

### Test 2: Query Performance
```typescript
const start = Date.now();
for (let i = 0; i < 1000; i++) {
  service.isRSPOCertified('unilever');
}
const duration = Date.now() - start;
console.log(`1000 queries: ${duration}ms`);
// Should be < 50ms
```

---

## Test Checklist

### Database Tests
- [ ] All databases initialize correctly
- [ ] Queries return expected results
- [ ] Case-insensitive matching works
- [ ] Unknown values return false/null
- [ ] Concurrent queries work

### PLANET Pillar Tests
- [ ] Base score is always 15
- [ ] Eco-Score adjustments correct (A-E)
- [ ] RSPO certified = 0 (not -5)
- [ ] Non-certified palm oil = -8
- [ ] Recyclable packaging bonuses work
- [ ] Packaging eco-cost penalties work
- [ ] Farming impact adjustments work
- [ ] Brand overlay penalties work
- [ ] Score capped at 0-25

### Real-World Tests
- [ ] Unilever product shows RSPO = 0
- [ ] Strawberry product shows farming penalty
- [ ] Aluminum packaging shows eco-cost penalty
- [ ] High-impact product scores low
- [ ] Low-impact product scores high

---

## Running All Tests

```bash
# Run all tests
npm test

# Run specific test files
npm run test:csv-database
npm run test:pillar:planet
npm run test:pillars  # All pillar tests

# Run manual test script
npx ts-node scripts/test-planet-pillar.ts

# Run with coverage
npm test -- --coverage
```

---

**Status:** ✅ Test Suite Complete

**Last Updated:** January 2025

