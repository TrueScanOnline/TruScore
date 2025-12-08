# User Contribution System - Testing Guide

## Overview

This guide explains how to test the complete user contribution system to ensure that all user-submitted data (photos, ingredients, country of manufacture, allergens, additives, packaging, etc.) is stored globally and retrievable by all users.

## Testing Philosophy

The system follows this priority:
1. **App Users First** - Data is stored in our backend database for immediate availability to all app users
2. **Open Food Facts Second** - Data is also submitted to Open Food Facts for broader community benefit

## Test Coverage

### Data Types Tested

- ✅ **Product Information**
  - Product name
  - Brand
  - Ingredients
  - Nutrition facts
  - Serving size
  - Quantity

- ✅ **Allergens & Additives**
  - Allergen tags (e.g., `en:milk`, `en:soy`, `en:gluten`)
  - Additive tags (e.g., `en:e412`, `en:e202`)

- ✅ **Manufacturing Country**
  - Country of manufacture
  - Imported ingredients flag
  - Community verification system

- ✅ **Photos**
  - Front photo
  - Ingredients photo
  - Nutrition label photo
  - Packaging photo
  - Country label photo

- ✅ **Packaging Information**
  - Material (e.g., plastic, glass)
  - Shape (e.g., bottle, can)
  - Recycling status

## Running Tests

### Automated Unit/Integration Tests

Run the comprehensive Jest test suite:

```bash
# Run all user contribution tests
npm run test:user-contributions

# Run end-to-end tests only
npm run test:user-contributions-e2e
```

### Manual End-to-End Test Script

Run the interactive test script that tests against the actual backend:

```bash
npm run test:user-contributions-script
```

This script will:
1. Test backend connectivity
2. Submit a complete product with all data types
3. Retrieve the product to verify all data is stored
4. Submit manufacturing country
5. Retrieve manufacturing country
6. Test photo upload

**Expected Output:**
```
========================================
User Contribution System - E2E Tests
========================================
Test Barcode: E2E_TEST_1234567890
Backend URL: https://vercel-leightons-projects-d328c774.vercel.app

🔍 Testing backend connectivity...
✅ Backend Connectivity: Backend is accessible (Status: 200)

📦 Testing manual product submission...
✅ Manual Product Submission: Product submitted successfully

🔍 Testing manual product retrieval...
✅ Manual Product Retrieval: All product data retrieved correctly

🌍 Testing manufacturing country submission...
✅ Manufacturing Country Submission: Country submitted successfully

🔍 Testing manufacturing country retrieval...
✅ Manufacturing Country Retrieval: Country retrieved correctly

📸 Testing photo upload...
✅ Photo Upload: Photo uploaded successfully

========================================
Test Summary
========================================
Total Tests: 6
✅ Passed: 6
❌ Failed: 0

🎉 All tests passed! User contribution system is working correctly.
```

## Test Scenarios

### Scenario 1: Complete Product Submission

**Test:** User submits a product with all possible data fields.

**Steps:**
1. User enters:
   - Product name: "Test Product"
   - Brand: "Test Brand"
   - Ingredients: "Water, Sugar, Salt, E412, E202"
   - Allergens: Milk, Soy
   - Additives: E412, E202
   - Manufacturing country: "New Zealand"
   - Packaging: Plastic bottle, recyclable
   - Nutrition facts: Energy, Fat, Carbs, etc.

2. System should:
   - Save to local storage (immediate availability)
   - Submit to backend API (global storage)
   - Submit to Open Food Facts (community database)

3. Verification:
   - Different user scans same barcode
   - All data should be available immediately
   - Data source should be `user_contributed`

### Scenario 2: Multi-User Data Sharing

**Test:** User A submits data, User B retrieves it.

**Steps:**
1. User A submits product data
2. User B (different device, no local cache) scans same barcode
3. User B should see all of User A's data

**Expected Result:**
- User B sees product name, ingredients, allergens, etc.
- Data is retrieved from backend (not local storage)
- All fields are preserved

### Scenario 3: Data Priority

**Test:** Verify app users get data before Open Food Facts.

**Steps:**
1. Submit product data
2. Check API call order:
   - Backend API should be called first
   - Open Food Facts should be called second

**Expected Result:**
- Backend receives data immediately
- Open Food Facts receives data as secondary priority
- App users can retrieve data from backend without waiting for Open Food Facts sync

### Scenario 4: All Data Types

**Test:** Verify all data types are stored and retrieved.

**Data Types to Test:**
- ✅ Product name
- ✅ Brand
- ✅ Ingredients text
- ✅ Nutrition facts (all fields)
- ✅ Allergens (array)
- ✅ Additives (array)
- ✅ Manufacturing country
- ✅ Packaging information
- ✅ Photos (all types)

**Verification:**
- Submit product with all data types
- Retrieve product
- Verify every field is present and correct

## Troubleshooting

### Backend Not Accessible

**Error:** `Backend is not accessible`

**Solutions:**
1. Check backend URL in `src/config/backendConfig.ts`
2. Verify backend is deployed: `cd backend/vercel && vercel ls --prod`
3. Check environment variables in Vercel Dashboard
4. Verify database is configured

### Data Not Retrievable

**Error:** `Product not found` or `Country not found`

**Solutions:**
1. Wait a few seconds after submission (database write may take time)
2. Check backend logs: `cd backend/vercel && vercel logs`
3. Verify database connection in Vercel Dashboard
4. Check that data was actually submitted (verify POST request succeeded)

### Photo Upload Fails

**Error:** `Photo upload failed`

**Solutions:**
1. Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
2. Check blob storage is configured in Vercel Dashboard
3. Verify photo is valid base64 format
4. Check file size limits (Vercel Blob has size limits)

## Test Files

- **Unit/Integration Tests:** `src/__tests__/integration/userContribution.test.ts`
- **E2E Tests:** `src/__tests__/integration/userContributionE2E.test.ts`
- **Test Script:** `scripts/test-user-contributions-e2e.ts`

## Continuous Testing

### Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All automated tests pass: `npm run test:user-contributions-e2e`
- [ ] Manual test script passes: `npm run test:user-contributions-script`
- [ ] Backend is deployed and accessible
- [ ] Database is configured and connected
- [ ] Photo storage is configured
- [ ] Environment variables are set in Vercel

### Post-Deployment Verification

After deployment:

1. Run test script: `npm run test:user-contributions-script`
2. Verify all tests pass
3. Test in actual app:
   - Submit a product with all data types
   - Scan barcode on different device
   - Verify all data is available

## Success Criteria

The system is working correctly when:

✅ **Data Submission:**
- All data types can be submitted
- Data is stored in backend database
- Data is submitted to Open Food Facts (secondary)

✅ **Data Retrieval:**
- Data is immediately available to submitting user
- Data is available to all other users
- All data fields are preserved

✅ **Data Priority:**
- App users get data from backend first
- Open Food Facts is updated as secondary priority
- No data loss or delay for app users

✅ **Multi-User:**
- User A submits data
- User B retrieves same data
- All fields match exactly

## Support

If tests fail or you encounter issues:

1. Check backend logs: `cd backend/vercel && vercel logs`
2. Verify environment variables in Vercel Dashboard
3. Test backend endpoints directly with curl/Postman
4. Review test output for specific error messages

---

**Last Updated:** December 7, 2025

