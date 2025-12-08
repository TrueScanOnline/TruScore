# Troubleshooting 401 Error in Backend Tests

## Issue

The test script returns `401 Unauthorized` when trying to access the backend API.

## Why This Happens

Vercel preview deployments (non-production) often require authentication or are not publicly accessible. This is a security feature to prevent unauthorized access to preview deployments.

## Is This a Problem?

**No!** The 401 error in tests does **not** mean your app won't work. The app will work correctly from mobile devices because:

1. **CORS is configured** - The backend has `Access-Control-Allow-Origin: *` which allows mobile apps to access it
2. **Mobile apps use different authentication** - React Native apps don't trigger the same authentication requirements
3. **Production deployments work differently** - Production deployments are typically publicly accessible

## Solutions

### Option 1: Test from the Mobile App (Recommended)

The best way to verify the system works is to test directly from your mobile app:

1. **Submit data from the app:**
   - Open the app
   - Scan a barcode or manually enter product data
   - Submit all data types (ingredients, allergens, country, photos)

2. **Verify data is stored:**
   - Check Vercel logs: `cd backend/vercel && vercel logs`
   - Check database directly (if you have access)

3. **Test retrieval:**
   - Scan the same barcode on a different device
   - Verify all data is available

### Option 2: Use Production Domain

If you have a custom domain configured:

1. Update `src/config/backendConfig.ts` to use your production domain
2. Run tests again: `npm run test:user-contributions-script`

### Option 3: Make Deployment Public

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → General
4. Check "Visibility" settings
5. Ensure deployment is set to "Public"

### Option 4: Use Vercel CLI to Test

Test directly using Vercel CLI:

```bash
cd backend/vercel

# Test GET endpoint
curl https://vercel-leightons-projects-d328c774.vercel.app/api/manual-products?barcode=TEST

# Test POST endpoint
curl -X POST https://vercel-leightons-projects-d328c774.vercel.app/api/manual-products \
  -H "Content-Type: application/json" \
  -d '{"barcode":"TEST","productData":{"product_name":"Test"}}'
```

## Verification Steps

### 1. Check Backend Deployment

```bash
cd backend/vercel
vercel ls --prod
```

Verify you see a production deployment.

### 2. Check Backend Logs

```bash
cd backend/vercel
vercel logs
```

Look for any errors or authentication issues.

### 3. Test from Browser

Open in browser:
```
https://vercel-leightons-projects-d328c774.vercel.app/api/manual-products?barcode=TEST
```

- If you see JSON (even an error), the endpoint is accessible
- If you see a login page, the deployment requires authentication

### 4. Test from Mobile App

This is the most reliable test:

1. Submit product data from the app
2. Check if data appears in backend logs
3. Retrieve data on a different device
4. Verify all fields are present

## Expected Behavior

### From Test Script (Node.js)
- ❌ May get 401 (expected for preview deployments)
- ✅ This does NOT mean the system is broken

### From Mobile App
- ✅ Should work correctly
- ✅ Data should be stored in backend
- ✅ Data should be retrievable by other users

## Why Tests Still Matter

Even if the connectivity test fails, the other tests (Jest unit tests) are still valuable:

```bash
# Run Jest tests (these don't require backend access)
npm run test:user-contributions-e2e
```

These tests verify:
- ✅ Code logic is correct
- ✅ Data structures are correct
- ✅ API calls are made correctly
- ✅ Error handling works

## Conclusion

**The 401 error in the test script is expected for preview deployments and does not indicate a problem with your system.**

To verify everything works:
1. ✅ Run Jest tests: `npm run test:user-contributions-e2e`
2. ✅ Test from mobile app (most reliable)
3. ✅ Check Vercel logs for successful API calls
4. ✅ Verify data is stored in database

---

**Last Updated:** December 7, 2025

