# Build Troubleshooting Guide

## Issue: Builds Not Appearing in Expo.dev

### Possible Causes

1. **Authentication Issues**
   - Not logged in to EAS
   - Expired session
   - Wrong account

2. **Project Configuration Issues**
   - Project not linked to EAS
   - Missing or incorrect `eas.json`
   - Missing project ID in `app.config.js`

3. **Build Command Issues**
   - Builds failing silently
   - Network issues
   - EAS service issues

4. **Timing Issues**
   - Builds take time to appear (can be 1-2 minutes)
   - Need to refresh Expo.dev dashboard

## Solutions

### 1. Verify Authentication
```powershell
eas whoami
```
If not logged in:
```powershell
eas login
```

### 2. Verify Project
```powershell
eas project:info
```
If project not linked:
```powershell
eas project:init
```

### 3. Check Configuration Files
- Verify `eas.json` exists and is valid JSON
- Verify `app.config.js` has `projectId` in `extra.eas`
- Verify project ID matches: `1ac14572-9608-42fa-aceb-c0e2a2f60687`

### 4. Run Builds with Verbose Output
```powershell
# Android
eas build --platform android --profile production --non-interactive

# iOS  
eas build --platform ios --profile production --non-interactive
```

### 5. Check Build Status
```powershell
# List all builds
eas build:list --platform all --limit 10

# Check specific build (if you have build ID)
eas build:view BUILD_ID
```

### 6. Check Expo.dev Dashboard Directly
Visit: https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds

### 7. Check EAS Status
Visit: https://status.expo.dev/

## Manual Build Process

If automated scripts aren't working, try manual steps:

1. **Login to EAS**:
   ```powershell
   eas login
   ```

2. **Verify Project**:
   ```powershell
   eas project:info
   ```

3. **Start Android Build**:
   ```powershell
   eas build --platform android --profile production
   ```
   - This will show interactive prompts
   - Note the build ID from the output
   - Check Expo.dev dashboard

4. **Start iOS Build**:
   ```powershell
   eas build --platform ios --profile production
   ```
   - This will show interactive prompts
   - Note the build ID from the output
   - Check Expo.dev dashboard

5. **Monitor Builds**:
   ```powershell
   eas build:list --platform all
   ```

6. **Submit iOS** (when build completes):
   ```powershell
   eas submit --platform ios --latest
   ```

## Expected Behavior

1. **Build Command Output**:
   - Should show "Starting build..."
   - Should provide build ID
   - Should provide URL to view build

2. **Expo.dev Dashboard**:
   - Builds should appear within 1-2 minutes
   - Status will be "in_queue" or "in-progress"
   - Builds are distinguishable by platform (android/ios)

3. **Build List Command**:
   - Should show recent builds
   - Should show platform, status, and creation time

## If Builds Still Don't Appear

1. **Check EAS CLI Version**:
   ```powershell
   eas --version
   ```
   Update if needed:
   ```powershell
   npm install -g eas-cli@latest
   ```

2. **Clear EAS Cache**:
   ```powershell
   # Clear npm cache
   npm cache clean --force
   
   # Reinstall EAS CLI
   npm uninstall -g eas-cli
   npm install -g eas-cli@latest
   ```

3. **Check Network/Firewall**:
   - Ensure access to expo.dev
   - Check if corporate firewall is blocking

4. **Contact Expo Support**:
   - If builds are being created but not appearing
   - Check Expo status page
   - Contact support via Expo dashboard

## Verification Checklist

- [ ] EAS CLI installed and up to date
- [ ] Logged in to EAS (`eas whoami` works)
- [ ] Project linked (`eas project:info` shows project)
- [ ] `eas.json` exists and is valid
- [ ] `app.config.js` has correct project ID
- [ ] Build commands execute without errors
- [ ] Build IDs are returned from build commands
- [ ] Expo.dev dashboard accessible
- [ ] Builds appear in dashboard within 2 minutes
