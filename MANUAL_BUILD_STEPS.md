# Manual Build Steps - Fix Builds Not Appearing

## 🔍 Diagnosis Steps

### Step 1: Verify EAS Authentication
Open PowerShell and run:
```powershell
cd C:\TrueScan-FoodScanner
eas whoami
```

**Expected**: Should show your Expo username (e.g., `crwmlw`)

**If not logged in**:
```powershell
eas login
```
Follow the prompts to log in.

### Step 2: Verify Project Configuration
```powershell
eas project:info
```

**Expected**: Should show project information including:
- Project ID: `1ac14572-9608-42fa-aceb-c0e2a2f60687`
- Project name: `truescan-food-scanner`
- Owner: `crwmlw`

**If project not linked**:
```powershell
eas project:init
```

### Step 3: Check Existing Builds
```powershell
eas build:list --platform all --limit 10
```

This will show all recent builds. Note if any appear.

### Step 4: Start Android Build (Interactive)
```powershell
eas build --platform android --profile production
```

**Important**: Remove `--non-interactive` flag to see what's happening.

**What to look for**:
- Build ID in the output
- URL to view the build
- Any error messages

**Expected output should include**:
```
✔ Build started
Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
View build: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 5: Start iOS Build (Interactive)
```powershell
eas build --platform ios --profile production
```

**What to look for**:
- Build ID in the output
- URL to view the build
- Any error messages

### Step 6: Verify Builds in Expo.dev
1. Open browser
2. Go to: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
3. Check if builds appear
4. Builds may take 1-2 minutes to appear after starting

### Step 7: Check Build Status
```powershell
eas build:list --platform all --limit 5
```

This should show:
- Build IDs
- Platform (android/ios)
- Status (in_queue, in-progress, finished, errored)
- Creation time

## 🚨 Common Issues and Fixes

### Issue 1: "Not authenticated"
**Fix**:
```powershell
eas login
```

### Issue 2: "Project not found"
**Fix**:
```powershell
eas project:init
```
Select the existing project when prompted.

### Issue 3: Builds start but don't appear
**Possible causes**:
- Network delay (wait 2-3 minutes)
- Wrong account/project
- EAS service issue

**Fix**:
1. Check Expo status: https://status.expo.dev/
2. Verify you're logged into correct account
3. Check project URL manually in browser

### Issue 4: Build command hangs
**Fix**:
1. Press `Ctrl+C` to cancel
2. Check internet connection
3. Try again
4. If persists, check EAS CLI version: `eas --version`
5. Update if needed: `npm install -g eas-cli@latest`

## ✅ Verification Checklist

After running builds, verify:

- [ ] `eas whoami` shows correct username
- [ ] `eas project:info` shows correct project
- [ ] Build commands return build IDs
- [ ] Build URLs are provided in output
- [ ] Builds appear in Expo.dev dashboard within 2 minutes
- [ ] `eas build:list` shows the new builds
- [ ] Builds are distinguishable by platform (android/ios)

## 📤 Submit iOS to App Store Connect

Once iOS build is finished:

```powershell
eas submit --platform ios --latest
```

Or submit specific build:
```powershell
eas submit --platform ios --id BUILD_ID
```

## 🔗 Important Links

- **Expo Dashboard**: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds
- **EAS Status**: https://status.expo.dev/
- **App Store Connect**: https://appstoreconnect.apple.com

## 📝 Notes

1. **Build Time**: Builds typically take 10-30 minutes
2. **Visibility**: Builds may take 1-2 minutes to appear in dashboard
3. **Distinction**: Builds are distinguishable by:
   - Platform field (android vs ios)
   - Build numbers (Android version 3, iOS build 4)
   - Creation timestamps

## 🆘 If Still Not Working

1. **Check EAS CLI Version**:
   ```powershell
   eas --version
   npm install -g eas-cli@latest
   ```

2. **Clear and Re-authenticate**:
   ```powershell
   eas logout
   eas login
   ```

3. **Verify Project ID**:
   Check `app.config.js` has:
   ```javascript
   extra: {
     eas: {
       projectId: '1ac14572-9608-42fa-aceb-c0e2a2f60687',
     },
   }
   ```

4. **Contact Support**:
   - Expo Support: https://expo.dev/support
   - Check Expo Discord: https://chat.expo.dev/
