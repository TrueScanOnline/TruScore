# Starting EAS Builds - Action Required

## Status
Both Android and iOS builds have been initiated via command line. However, if they're not showing in the dashboard, there may be an authentication or configuration issue.

## Immediate Actions to Take

### 1. Verify Authentication
Open PowerShell and run:
```powershell
cd c:\TrueScan-FoodScanner
npx eas-cli whoami
```

If you see "Not logged in", run:
```powershell
npx eas-cli login
```
This will open a browser for authentication.

### 2. Start Builds Manually

Once authenticated, run these commands:

**Android Build:**
```powershell
npx eas-cli build --platform android --profile preview --non-interactive
```

**iOS Build:**
```powershell
npx eas-cli build --platform ios --profile preview --non-interactive
```

### 3. Verify Builds Started

Run the verification script:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-builds.ps1
```

Or check manually:
```powershell
npx eas-cli build:list --platform all --limit 10
```

## Common Issues

### Issue: "Not logged in"
**Solution:** Run `npx eas-cli login` and complete authentication in browser

### Issue: "Project not found"
**Solution:** Verify projectId in app.config.js matches your Expo account:
- Current projectId: `1ac14572-9608-42fa-aceb-c0e2a2f60687`
- Check at: https://expo.dev/accounts/crwmlw/projects

### Issue: "Credentials not configured"
**Solution:** 
- Android: Usually auto-configured by EAS
- iOS: May need Apple Developer account setup
```powershell
npx eas-cli credentials
```

### Issue: Builds not appearing in dashboard
**Possible causes:**
1. Not authenticated - run `npx eas-cli login`
2. Wrong project - verify projectId
3. Builds queued but not started yet - wait 1-2 minutes
4. Network/firewall blocking EAS API

## Quick Start Script

I've created a script that will:
1. Check authentication
2. Start both builds
3. Verify they started

Run it with:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-builds-now.ps1
```

## Monitor Builds

### Dashboard
https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds

### Command Line
```powershell
# List recent builds
npx eas-cli build:list --platform all --limit 10

# Monitor specific build (replace BUILD_ID)
npx eas-cli build:view BUILD_ID
```

## Expected Build Times
- Android: 15-25 minutes
- iOS: 20-30 minutes

## Next Steps After Builds Complete

### Preview Builds (current profile)
- **Android APK**: Download and install directly on device
- **iOS IPA**: Upload to TestFlight or use ad-hoc distribution

### Production Builds
```powershell
# Submit to stores
npx eas-cli submit --platform android --latest
npx eas-cli submit --platform ios --latest
```

## Files Created
1. `scripts/start-builds-now.ps1` - Comprehensive build script
2. `scripts/verify-builds.ps1` - Build verification script
3. `scripts/monitor-builds.ps1` - Build monitoring script
4. `scripts/start-eas-builds-complete.ps1` - Main build script (with NonInteractive mode)

## Troubleshooting Commands

```powershell
# Check EAS CLI version
npx eas-cli --version

# Check authentication
npx eas-cli whoami

# Check project info
npx eas-cli project:info

# Check credentials
npx eas-cli credentials

# View build logs
npx eas-cli build:view [BUILD_ID]
```














