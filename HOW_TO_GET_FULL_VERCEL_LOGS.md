# How to Get Full Vercel Logs for FSANZ Diagnostic

## The Problem
The diagnostic logs aren't showing in the truncated Vercel output. We need to see the full logs to identify the NZ database field names.

## Step-by-Step Instructions

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Login if needed

2. **Select Your Project:**
   - Find and click: `truscoreapi`
   - Or: `leightons-projects-d328c774`

3. **Navigate to Functions:**
   - Click **"Functions"** in the left sidebar
   - Or go to: https://vercel.com/leightons-projects-d328c774/truscoreapi/functions

4. **Select the Function:**
   - Click on: `api/fsanz-query`

5. **View Recent Invocations:**
   - You'll see a list of recent function calls
   - Look for the most recent ones (should be from your test)

6. **Click on a Failed NZ Query:**
   - Look for entries with status 200 but "Not found" response
   - Click on one of the NZ queries (Milk, Bread, or Tomato Sauce)

7. **View Full Logs:**
   - Scroll down to see the full log output
   - Look for lines starting with `[DIAGNOSTIC]`
   - Copy ALL the diagnostic output

### Method 2: Vercel CLI

```powershell
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
npx vercel login

# View logs
npx vercel logs truscoreapi --follow
```

### Method 3: Direct API Test with Full Response

Create a test script that shows the full diagnostic response:

```powershell
# Save as: testFSANZDiagnostic.ps1
$url = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
$response = Invoke-RestMethod -Uri $url -Method GET
$response | ConvertTo-Json -Depth 10
```

## What to Look For

In the Vercel logs, look for these specific entries:

### Critical Diagnostic Lines:
```
[DIAGNOSTIC] ===== DATABASE STRUCTURE ANALYSIS =====
[DIAGNOSTIC] All keys: ...
[DIAGNOSTIC] Name-like keys found: ...
[DIAGNOSTIC]   [field_name]: "[value]"
[DIAGNOSTIC] Any-field search found X matches
```

### Key Information Needed:
1. **All keys:** The complete list of field names in the NZ database
2. **Name-like keys:** Which fields contain food names
3. **Field values:** What the actual food name field contains
4. **Any-field matches:** If searching ALL fields finds matches

## Expected Diagnostic Output

You should see something like:

```
[DIAGNOSTIC] ===== DATABASE STRUCTURE ANALYSIS =====
[DIAGNOSTIC] First entry type: object
[DIAGNOSTIC] First entry has 25 keys
[DIAGNOSTIC] All keys: foodName, Food Name, food_name, name, energyKcal, ...
[DIAGNOSTIC] Name-like keys found: foodName, Food Name, food_name, name
[DIAGNOSTIC]   foodName: "Milk, whole, pasteurised"
[DIAGNOSTIC]   Food Name: "Milk, whole, pasteurised"
[DIAGNOSTIC] Any-field search found 150 matches (searching ALL fields)
[DIAGNOSTIC] ✅ FOUND MATCH in field "foodName": "Milk, whole..."
```

## If Diagnostic Logs Are Missing

If you don't see `[DIAGNOSTIC]` logs:

1. **Check function deployment:**
   - Make sure the latest code is deployed
   - Redeploy: `cd backend/vercel && npx vercel --prod`

2. **Check log level:**
   - Vercel might filter console.log
   - Try using `console.error` for critical diagnostics

3. **Check function execution:**
   - Make sure the function is actually running
   - Check if there are any errors before diagnostics run

## Next Steps After Getting Logs

Once you have the diagnostic output:

1. **Share the logs** - Copy and paste the `[DIAGNOSTIC]` sections
2. **Identify field names** - Look for the actual field name used for food names
3. **Update code** - Fix the field name detection to use the correct NZ field names
4. **Test again** - Verify NZ queries now work

## Quick Test

Run this to test a single NZ query and see the response:

```powershell
$url = "https://truscoreapi.vercel.app/api/fsanz-query?country=nz&productName=Milk"
Invoke-RestMethod -Uri $url -Method GET | ConvertTo-Json -Depth 5
```

Check the `diagnostic` field in the response - it should contain structure information.
