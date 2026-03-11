# App Store Connect Submission Fix - JWT Headers Error
**Date:** January 2025  
**Error:** Cannot verify client's JWT headers (3004)  
**Status:** ⚠️ **FAILED - API KEY AUTHENTICATION ISSUE**

---

## ❌ **ISSUE DIAGNOSIS**

**Error Message:**
```
[altool] Error: Cannot verify client's JWT headers. App Store operation failed. (3004)
```

**Root Cause:** 
The App Store Connect API key stored in EAS is **invalid, expired, or revoked**.

**Current API Key Info:**
- **Key ID:** `36C755A9B5`
- **Key Name:** `[Expo] EAS Submit _QNvfLcxvx`
- **Key Source:** EAS servers
- **Status:** ❌ **AUTHENTICATION FAILING**

---

## ✅ **SOLUTION: Regenerate and Reconfigure API Key**

### Step 1: Check Current API Key Status in App Store Connect

1. **Go to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   - Log in with your Apple Developer account

2. **Navigate to API Keys:**
   - Click: **Users and Access** (top navigation)
   - Click: **Keys** tab
   - Look for key: `[Expo] EAS Submit _QNvfLcxvx` or Key ID: `36C755A9B5`

3. **Check Key Status:**
   - ✅ **Active** = Key exists but might have permission issues
   - ❌ **Revoked** = Key was deleted/revoked (needs regeneration)
   - ⚠️ **Missing** = Key no longer exists (needs creation)

---

### Step 2: Generate a New App Store Connect API Key

**Option A: If Key Still Exists (Just Needs Permissions Check)**

1. **Verify Permissions:**
   - Key must have **"Developer"** role at minimum
   - Key must have **"App Manager"** access for app submissions
   - Check if key has access to App ID: `6755704230`

2. **If permissions are correct, proceed to Option B to regenerate**

**Option B: Create New API Key (Recommended)**

1. **Create New Key:**
   - In App Store Connect → Users and Access → Keys
   - Click: **"+" (Generate API Key)** or **"Generate API Key"** button
   - **Name:** `[Expo] EAS Submit` (or any descriptive name)
   - **Access:** Select **"Developer"** or **"App Manager"** role
   - Click: **"Generate"**

2. **Download the Key:**
   - ⚠️ **IMPORTANT:** Download the `.p8` file immediately (you can only download once!)
   - Save it securely (e.g., `~/Downloads/AuthKey_XXXXXXXXXX.p8`)
   - **Note the Key ID** (10 characters, e.g., `ABC123DEFG`)
   - **Note the Issuer ID** (UUID format, shown at top of Keys page)

3. **Important Information to Save:**
   ```
   Key ID: XXXXXXXXXX (10 characters)
   Issuer ID: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (UUID)
   Key File: AuthKey_XXXXXXXXXX.p8 (save this file!)
   ```

---

### Step 3: Update EAS Credentials with New API Key

**Method 1: Interactive Configuration (Recommended)**

1. **Run EAS credentials configuration:**
   ```powershell
   cd C:\TrueScan-FoodScanner
   eas credentials
   ```

2. **Follow the prompts:**
   - **Platform:** Select `iOS`
   - **What do you want to do?** Select `Set up App Store Connect API Key`
   - **Key ID:** Enter your new Key ID (10 characters)
   - **Issuer ID:** Enter your Issuer ID (UUID)
   - **Key file path:** Enter path to your `.p8` file (e.g., `C:\Users\YourName\Downloads\AuthKey_XXXXXXXXXX.p8`)

3. **Verification:**
   - EAS will test the key
   - If successful, credentials are saved

**Method 2: Using EAS Submit Configuration**

1. **Run submit configuration:**
   ```powershell
   cd C:\TrueScan-FoodScanner
   eas submit:configure
   ```

2. **Follow the prompts:**
   - **Platform:** Select `iOS`
   - **Apple ID:** Enter your Apple Developer email (or skip if using API key only)
   - **App Store Connect API Key:** Select **"Use App Store Connect API Key"**
   - **Key ID:** Enter your new Key ID
   - **Issuer ID:** Enter your Issuer ID
   - **Key file path:** Enter path to your `.p8` file

---

### Step 4: Verify Credentials are Configured

**Check credentials status:**
```powershell
eas credentials
```

**Select:** `iOS` → `Show credentials` (or `List credentials`)

**Verify you see:**
- ✅ App Store Connect API Key configured
- ✅ Key ID matches your new key
- ✅ Status shows as valid/active

---

### Step 5: Resubmit to App Store Connect

**After credentials are updated:**

```powershell
cd C:\TrueScan-FoodScanner
eas submit --platform ios --latest
```

**Or submit specific build:**
```powershell
eas submit --platform ios --id 9a0cdef9-254a-47b8-b5af-930f324456f9
```

**Expected result:**
- ✅ Submission should start successfully
- ✅ No more JWT headers error
- ✅ Upload progress shown
- ✅ Success message after completion

---

## 🔍 **TROUBLESHOOTING**

### If Still Getting JWT Error After Regenerating Key

1. **Verify Key Permissions:**
   - Key must have **"Developer"** or **"App Manager"** access
   - Key must have access to App ID: `6755704230`
   - Check in App Store Connect → Users and Access → Keys → Your Key

2. **Verify Issuer ID:**
   - Must match the Issuer ID shown in App Store Connect
   - Found at: Users and Access → Keys → (top of page)

3. **Verify Key File Path:**
   - Ensure `.p8` file path is correct
   - Use absolute path if relative path doesn't work
   - Ensure file hasn't been moved or deleted

4. **Clear EAS Credentials Cache:**
   ```powershell
   eas credentials
   # Select: iOS → Clear credentials
   # Then reconfigure with new key
   ```

5. **Try Using Apple ID + App-Specific Password (Alternative):**
   - Generate app-specific password: https://appleid.apple.com/account/manage
   - Use this instead of API key (less secure, but works as fallback)

---

## 📋 **QUICK CHECKLIST**

- [ ] Check API key status in App Store Connect
- [ ] Generate new API key if needed
- [ ] Download `.p8` file and save securely
- [ ] Note Key ID and Issuer ID
- [ ] Run `eas credentials` or `eas submit:configure`
- [ ] Configure new API key in EAS
- [ ] Verify credentials are saved
- [ ] Run `eas submit --platform ios --latest`
- [ ] Monitor submission progress

---

## 🎯 **EXPECTED OUTCOME**

After fixing the API key:

**Successful Submission:**
```
√ Scheduled iOS submission
Submission details: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/submissions/...
Waiting for submission to complete...
√ Successfully submitted to App Store Connect
```

**Then in App Store Connect:**
- Build appears in TestFlight within 10-30 minutes
- Build available for beta testing
- Build available for App Store submission

---

## 📚 **ADDITIONAL RESOURCES**

- **App Store Connect:** https://appstoreconnect.apple.com
- **API Keys Page:** https://appstoreconnect.apple.com/access/api
- **EAS Submit Docs:** https://docs.expo.dev/submit/ios/
- **Expo Credentials Docs:** https://docs.expo.dev/app-signing/managed-credentials/

---

## ⚠️ **IMPORTANT NOTES**

1. **API Key Security:**
   - Never commit `.p8` files to git
   - Store keys securely (they're in EAS servers after configuration)
   - Keys can be revoked if compromised

2. **Key Expiration:**
   - API keys don't automatically expire
   - But they can be revoked manually
   - If revoked, you must create a new one

3. **Key Download:**
   - You can only download the `.p8` file once
   - Save it securely if you need it again
   - EAS stores it after configuration

---

**Status:** ⚠️ **ACTION REQUIRED - REGENERATE API KEY**  
**Next Step:** Follow Step 2 above to create new API key and reconfigure EAS
