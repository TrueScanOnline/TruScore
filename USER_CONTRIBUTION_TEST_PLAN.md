# User Contribution System - Test Plan

## Test Objectives

Verify that **all user-submitted data is stored globally and available to ALL users worldwide**, not just cached locally.

---

## Pre-Test Checklist

### ✅ Environment Configuration

1. **Backend URL Configured**
   - [ ] `EXPO_PUBLIC_BACKEND_URL` is set in app
   - [ ] Backend is deployed to Vercel
   - [ ] Backend API endpoints are accessible

2. **Database Configured**
   - [ ] `POSTGRES_URL` or `MONGODB_URI` is set in Vercel environment variables
   - [ ] Database connection is working
   - [ ] Tables are created (check `backend/vercel/lib/database.ts`)

3. **Photo Storage Configured**
   - [ ] `BLOB_READ_WRITE_TOKEN` (Vercel Blob) OR
   - [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary)

4. **Open Food Facts Credentials (Optional)**
   - [ ] `OFF_USERNAME` and `OFF_PASSWORD` set (for enhanced global sharing)

---

## Test Cases

### Test Case 1: Manual Product Submission & Global Retrieval

**Objective**: Verify manual product data is stored globally and accessible to all users.

**Prerequisites**:
- Two devices/users (User A and User B)
- Backend API is accessible
- Database is configured

**Steps**:

1. **User A - Submit Manual Product**
   ```
   - Open app on Device A
   - Scan or enter barcode: TEST_MANUAL_001
   - Tap "Add Product Information"
   - Enter:
     * Product Name: "Test Product Global"
     * Ingredients: "Water, Sugar, Salt"
     * Nutrition: Calories: 100, Fat: 5g
     * Photo: Upload product photo
   - Tap "Save"
   ```

2. **Verify Submission**
   ```
   - Check backend logs: POST /api/manual-products
   - Check database: SELECT * FROM manual_products WHERE barcode = 'TEST_MANUAL_001'
   - Verify data is stored (not just in local cache)
   ```

3. **User B - Retrieve Product**
   ```
   - Open app on Device B (different device/user)
   - Scan barcode: TEST_MANUAL_001
   - Verify product data appears:
     * Product Name: "Test Product Global"
     * Ingredients: "Water, Sugar, Salt"
     * Nutrition: Calories: 100, Fat: 5g
     * Photo: Shows uploaded photo
   ```

**Expected Results**:
- ✅ User A's submission is stored in backend database
- ✅ User B can see User A's submitted data
- ✅ Data is NOT just in local cache

**Failure Criteria**:
- ❌ User B does not see User A's data
- ❌ Data is only in local cache (not in database)
- ❌ Backend API returns error

---

### Test Case 2: Manufacturing Country Submission & Global Retrieval

**Objective**: Verify manufacturing country data is stored globally.

**Steps**:

1. **User A - Submit Manufacturing Country**
   ```
   - Open app on Device A
   - Scan barcode: TEST_COUNTRY_001
   - Tap "Report Manufacturing Country"
   - Select: "New Zealand"
   - Optionally upload photo of label
   - Tap "Submit"
   ```

2. **Verify Submission**
   ```
   - Check backend logs: POST /api/manufacturing-country
   - Check database: SELECT * FROM manufacturing_country_submissions WHERE barcode = 'TEST_COUNTRY_001'
   - Verify country is stored
   ```

3. **User B - Retrieve Country**
   ```
   - Open app on Device B
   - Scan barcode: TEST_COUNTRY_001
   - Verify manufacturing country shows: "New Zealand"
   ```

**Expected Results**:
- ✅ User A's country submission is stored in backend
- ✅ User B sees "New Zealand" as manufacturing country
- ✅ Country data is available globally

**Failure Criteria**:
- ❌ User B does not see User A's country
- ❌ Country is only in local cache

---

### Test Case 3: Photo Upload & Global Retrieval

**Objective**: Verify photos are stored in cloud storage and accessible globally.

**Steps**:

1. **User A - Upload Photo**
   ```
   - Open app on Device A
   - Scan barcode: TEST_PHOTO_001
   - Tap "Add Product Photo"
   - Take/select photo
   - Tap "Upload"
   ```

2. **Verify Upload**
   ```
   - Check backend logs: POST /api/upload-photo
   - Verify photo URL is returned
   - Check cloud storage (Vercel Blob/Cloudinary) for photo
   - Check database: SELECT * FROM photos WHERE barcode = 'TEST_PHOTO_001'
   ```

3. **User B - View Photo**
   ```
   - Open app on Device B
   - Scan barcode: TEST_PHOTO_001
   - Verify photo appears in product details
   ```

**Expected Results**:
- ✅ Photo is uploaded to cloud storage
- ✅ Photo URL is stored in database
- ✅ User B can view User A's uploaded photo

**Failure Criteria**:
- ❌ Photo is only stored locally
- ❌ Photo URL is not accessible
- ❌ User B cannot see photo

---

### Test Case 4: Offline Mode & Sync

**Objective**: Verify offline submissions are synced when online.

**Steps**:

1. **User A - Submit Offline**
   ```
   - Disable network on Device A
   - Submit manual product (barcode: TEST_OFFLINE_001)
   - Verify data is saved locally
   ```

2. **User A - Go Online**
   ```
   - Enable network on Device A
   - App should sync data to backend
   - Check backend logs for submission
   ```

3. **User B - Retrieve Data**
   ```
   - Open app on Device B (online)
   - Scan barcode: TEST_OFFLINE_001
   - Verify User A's data appears
   ```

**Expected Results**:
- ✅ Offline submissions are saved locally
- ✅ Data syncs to backend when online
- ✅ User B can see synced data

**Failure Criteria**:
- ❌ Offline data is not synced
- ❌ User B cannot see offline-submitted data

---

### Test Case 5: Data Priority & Merging

**Objective**: Verify user-contributed data has highest priority in product merging.

**Steps**:

1. **User A - Submit Complete Product Data**
   ```
   - Submit manual product with:
     * Product Name: "User Submitted Name"
     * Ingredients: "User Submitted Ingredients"
     * Nutrition: Complete nutrition data
   ```

2. **User B - Scan Same Barcode**
   ```
   - Scan barcode that exists in Open Food Facts
   - Verify user-contributed data takes priority:
     * Product Name: "User Submitted Name" (not OFF name)
     * Ingredients: "User Submitted Ingredients" (not OFF ingredients)
   ```

**Expected Results**:
- ✅ User-contributed data overrides database data
- ✅ User data has highest priority in merging

**Failure Criteria**:
- ❌ Database data overrides user data
- ❌ User data is not prioritized

---

## Automated Test Script

### Test Script Location
Create: `src/__tests__/integration/userContribution.test.ts`

```typescript
describe('User Contribution System', () => {
  const TEST_BARCODE = `TEST_${Date.now()}`;
  
  test('Manual product submission and retrieval', async () => {
    // 1. Submit product
    const submissionResult = await saveManualProduct({
      barcode: TEST_BARCODE,
      product_name: 'Test Product',
      ingredients_text: 'Test ingredients',
      timestamp: Date.now(),
    });
    
    expect(submissionResult).toBe(true);
    
    // 2. Wait for backend sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Retrieve product (simulating different user)
    const retrievedProduct = await getUserContributedProduct(TEST_BARCODE);
    
    expect(retrievedProduct).not.toBeNull();
    expect(retrievedProduct?.product_name).toBe('Test Product');
    expect(retrievedProduct?.ingredients_text).toBe('Test ingredients');
  });
  
  test('Manufacturing country submission and retrieval', async () => {
    // 1. Submit country
    const submissionResult = await submitManufacturingCountry(
      TEST_BARCODE,
      'New Zealand'
    );
    
    expect(submissionResult.success).toBe(true);
    
    // 2. Wait for backend sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Retrieve country (simulating different user)
    const countryData = await getManufacturingCountry(TEST_BARCODE);
    
    expect(countryData.country).toBe('New Zealand');
    expect(countryData.confidence).toBe('unverified'); // First submission
  });
});
```

---

## Manual Testing Checklist

### ✅ Submission Tests

- [ ] Manual product submission works
- [ ] Manufacturing country submission works
- [ ] Photo upload works
- [ ] Price submission works
- [ ] All submissions reach backend API
- [ ] Data is stored in database (not just local cache)

### ✅ Retrieval Tests

- [ ] User B can see User A's manual product
- [ ] User B can see User A's manufacturing country
- [ ] User B can see User A's uploaded photos
- [ ] User B can see User A's prices
- [ ] Data is retrieved from backend (not just local cache)

### ✅ Offline Tests

- [ ] Offline submissions are saved locally
- [ ] Data syncs to backend when online
- [ ] Offline retrieval works (from local cache)

### ✅ Priority Tests

- [ ] User-contributed data overrides database data
- [ ] User data has highest priority in merging

---

## Troubleshooting

### Issue: User B cannot see User A's data

**Possible Causes**:
1. Backend API is not accessible
2. Database is not configured (using in-memory)
3. Data is only in local cache
4. Backend URL is incorrect

**Debug Steps**:
1. Check backend logs in Vercel dashboard
2. Verify database connection: `SELECT NOW()` in Postgres
3. Check backend URL in `src/config/backendConfig.ts`
4. Verify environment variables in Vercel

---

### Issue: Photos are not accessible

**Possible Causes**:
1. Cloud storage not configured
2. Photo URL is incorrect
3. Photo upload failed

**Debug Steps**:
1. Check `BLOB_READ_WRITE_TOKEN` or Cloudinary credentials
2. Verify photo URL in database
3. Test photo URL in browser

---

### Issue: Data is lost on server restart

**Possible Causes**:
1. Database not configured (using in-memory fallback)

**Debug Steps**:
1. Check `POSTGRES_URL` or `MONGODB_URI` in Vercel
2. Verify database connection in `backend/vercel/lib/database.ts`
3. Check backend logs for "in-memory storage" warning

---

## Success Criteria

✅ **All tests pass**:
- Manual product submission and retrieval
- Manufacturing country submission and retrieval
- Photo upload and retrieval
- Offline mode and sync
- Data priority and merging

✅ **Data is stored globally**:
- Data is in backend database (not just local cache)
- Data is accessible to all users worldwide
- Data persists across server restarts

✅ **System is reliable**:
- Offline mode works
- Data syncs when online
- User data has highest priority

---

## Test Results Template

```
Test Date: _______________
Tester: _______________
Backend URL: _______________
Database: [ ] Postgres [ ] MongoDB [ ] In-Memory

Test Results:
[ ] Test Case 1: Manual Product - PASS / FAIL
[ ] Test Case 2: Manufacturing Country - PASS / FAIL
[ ] Test Case 3: Photo Upload - PASS / FAIL
[ ] Test Case 4: Offline Mode - PASS / FAIL
[ ] Test Case 5: Data Priority - PASS / FAIL

Issues Found:
1. _______________
2. _______________
3. _______________

Overall Status: [ ] PASS [ ] FAIL
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-27

