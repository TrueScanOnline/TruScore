# User Contribution Function - Complete Testing Guide

## Overview
This guide tests all user contribution functions to ensure they work correctly after the bundling fixes.

## Pre-Testing Setup

1. **Start Metro in Tunnel Mode:**
   ```bash
   npx expo start --tunnel --clear
   ```

2. **Load App in Expo Go:**
   - Scan QR code
   - Wait for app to load completely

3. **Test with a Test Barcode:**
   - Use a barcode that doesn't exist in Open Food Facts
   - Example: `1234567890123` (13 digits) or scan a random product

## Test Cases

### Test 1: Photo Capture (Main Product Image)
**Location:** Product result screen - camera button on image placeholder

**Steps:**
1. Scan a barcode (or enter manually)
2. Wait for product screen to load
3. Tap the camera icon on the product image placeholder
4. Take a photo or select from gallery
5. Tap "Use Photo"

**Expected Results:**
- ✅ Photo appears in product image
- ✅ Success toast: "Photo Submitted - Your photo will be available to all users"
- ✅ Check Metro logs for:
  - `[ResultScreen] 🎯 handleCaptureImage CALLED`
  - `[ResultScreen] ✅ Photo uploaded`
  - `[ManualProductService] 🚀 saveManualProduct CALLED`
  - `[ManualProductService] ✅✅✅ BACKEND SUBMISSION SUCCESS`

**Verification:**
- Close and reopen app
- Scan same barcode again
- Photo should still appear (from local cache)
- Another device/user scanning same barcode should see photo (from backend)

---

### Test 2: Manual Product Entry Modal
**Location:** Product result screen - "Add Product Information" button

**Steps:**
1. Scan a barcode that has no product data
2. Tap "Add Product Information" button
3. Fill in:
   - Product Name: "Test Product"
   - Brand: "Test Brand"
   - Ingredients: "Water, Sugar, Salt"
   - Optional: Add nutrition info, categories, etc.
4. Optionally: Take/select photo inside modal
5. Tap "Save"

**Expected Results:**
- ✅ Success alert: "Product information saved successfully!"
- ✅ Modal closes
- ✅ Product data appears on screen
- ✅ Check Metro logs for:
  - `[ManualProductEntryModal] 🎯 SAVE BUTTON CLICKED`
  - `[ManualProductEntryModal] 📦 Calling saveManualProduct`
  - `[ManualProductService] 🚀 saveManualProduct CALLED`
  - `[ManualProductService] ✅✅✅ BACKEND SUBMISSION SUCCESS`

**Verification:**
- Close and reopen app
- Scan same barcode
- All entered data should appear
- Another device/user should see the data

---

### Test 3: Edit Product (Update Existing Data)
**Location:** Product result screen - "Edit" button on product card

**Steps:**
1. Scan a barcode with existing product data (from Test 2 or previous)
2. Tap "Edit" button
3. Modify any fields (name, ingredients, nutrition, etc.)
4. Optionally: Change/update photo
5. Tap "Save"

**Expected Results:**
- ✅ Success alert: "Product information saved successfully!"
- ✅ Updated data appears on screen
- ✅ Check Metro logs for backend submission success

**Verification:**
- Close and reopen app
- Scan same barcode
- Updated data should appear (not old data)
- Another device/user should see updated data

---

### Test 4: Manufacturing Country Contribution
**Location:** Product result screen - "Contribute Country" button

**Steps:**
1. Scan a barcode
2. Scroll to Manufacturing Country card
3. Tap "Contribute Country" button
4. Enter country name (e.g., "Australia")
5. Optionally: Check "Has imported ingredients" if applicable
6. Optionally: Add photo
7. Tap "Submit"

**Expected Results:**
- ✅ Success message
- ✅ Country appears in Manufacturing Country card
- ✅ Check Metro logs for:
  - `[ManufacturingCountryService] POST to backend`
  - `[ManufacturingCountryService] Submitted to backend API`

**Verification:**
- Close and reopen app
- Scan same barcode
- Country should still appear
- Another device/user should see the country

---

## Backend Verification

### Check Backend Logs
If you have access to Vercel backend logs, verify:

1. **Photo Upload:**
   - POST to `/api/manual-products` with `image_url` in payload
   - Photo uploaded to storage

2. **Product Data:**
   - POST to `/api/manual-products` with complete product data
   - Data saved to database

3. **Manufacturing Country:**
   - POST to `/api/manufacturing-country`
   - Country data saved

### Test Cross-User Retrieval
1. **User A:** Submit product data (photo, name, ingredients)
2. **User B (or same user on different device):**
   - Scan same barcode
   - Should see User A's submitted data
   - Verify photo appears
   - Verify all product info appears

---

## Troubleshooting

### If Submission Fails:

1. **Check Network:**
   - Ensure device has internet connection
   - Tunnel mode should handle this, but verify

2. **Check Backend URL:**
   - Verify `EXPO_PUBLIC_BACKEND_URL` in `.env` is correct
   - Backend should be deployed and accessible

3. **Check Metro Logs:**
   - Look for error messages
   - Check for network errors
   - Verify backend URL is being used

4. **Check Backend:**
   - Verify backend is running
   - Check backend logs for incoming requests
   - Verify database is accessible

### Common Issues:

**Issue:** "Photo saved locally" but not submitted
- **Cause:** Backend submission failed
- **Fix:** Check backend URL and network connection

**Issue:** Data appears locally but not on other devices
- **Cause:** Backend submission failed silently
- **Fix:** Check Metro logs for backend errors

**Issue:** Success message but data doesn't persist
- **Cause:** Backend save failed
- **Fix:** Check backend logs and database

---

## Success Criteria

✅ All 4 contribution points work:
- Photo capture submits to backend
- Manual product entry submits to backend
- Edit product updates backend
- Manufacturing country submits to backend

✅ Data persists:
- Data appears after app restart
- Data appears on other devices/users

✅ Backend receives submissions:
- Backend logs show POST requests
- Database contains submitted data

---

## Test Checklist

- [ ] Test 1: Photo Capture - Works and submits
- [ ] Test 2: Manual Product Entry - Works and submits
- [ ] Test 3: Edit Product - Works and updates
- [ ] Test 4: Manufacturing Country - Works and submits
- [ ] Cross-user retrieval - Data appears on other device
- [ ] Data persistence - Data persists after app restart
- [ ] Backend verification - Backend receives all submissions

---

## Next Steps After Testing

1. **If all tests pass:** User contribution function is fully working ✅
2. **If any test fails:** Check Metro logs and backend logs for errors
3. **Document any issues:** Note which contribution points need fixes
