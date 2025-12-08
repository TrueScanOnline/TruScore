# FSANZ Database - Automated Deployment

## Quick Start

### Deploy FSANZ Database:
```powershell
cd C:\TrueScan-FoodScanner
.\scripts\deployFSANZAutomated.ps1
```

That's it! The script handles everything automatically.

## What It Does

1. ✅ Creates data files (`nzfcd.json`, `afcd.json`)
2. ✅ Deploys to Vercel
3. ✅ Tests API endpoint
4. ✅ Reports success/failure

## How the App Uses It

The app automatically:
1. Queries FSANZ by product name (after Open Food Facts)
2. Merges FSANZ nutrition data into products
3. Uses FSANZ data in TruScore calculations

**No app code changes needed - it's already implemented!**

## Scheduling

### Daily/Weekly Deployment:
```powershell
.\scripts\scheduleFSANZDeployment.ps1 -Schedule daily
```

### Automatic (GitHub):
- Push code to GitHub
- GitHub Actions automatically deploys

## Files Created

- `scripts/deployFSANZAutomated.ps1` - Main deployment script
- `scripts/scheduleFSANZDeployment.ps1` - Scheduler script
- `.github/workflows/deploy-fsanz.yml` - GitHub Actions workflow

## Status

✅ **Fully automated - no manual steps needed!**
