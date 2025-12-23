# Codebase Cleanup Plan

This document outlines the cleanup strategy for the TrueScan codebase.

## Strategy: Archive, Don't Delete

We're being conservative - moving files to archive rather than deleting them, so nothing is lost.

## 1. Documentation Files (598 markdown files in root)

### Keep in Root (Essential Documentation):
- README.md
- QONVERSION_SETUP.md (if actively used)
- Essential setup/configuration guides

### Archive to `docs/archive/implementation-reports/`:
- All `*_COMPLETE.md` files (implementation summaries)
- All `*_ANALYSIS.md` files (analysis reports)
- All `*_FIX*.md` files (one-time fixes)
- All `*_VERIFICATION*.md` files (verification reports)
- All `*_TESTING*.md` files (testing reports)
- All `*_SUMMARY.md` files (summary documents)
- All `*_FINAL*.md` files (final reports)
- All `*_STATUS*.md` files (status updates)
- All `*_GUIDE.md` files (one-time guides)
- Historical pillar analysis docs (BODY_PILLAR*, ETHICS_PILLAR*, etc.)

### Archive to `docs/archive/database-analysis/`:
- DATABASE_* analysis and testing reports
- DATABASE_TEST_RESULTS*.json files

### Archive to `docs/archive/build-deployment/`:
- BUILD_* guides and status files
- DEPLOYMENT_* guides
- FSANZ_* setup/deployment docs
- ANDROID_* / IOS_* build guides

## 2. Temporary Files to Delete

### Test Data Files:
- `barcode_*.json` - Test barcode data files
- `*TEST*.json` - Test result files
- `API_TEST_RESULTS.json`

### Temporary Text Files:
- `BUILD_*.txt` - Temporary build command files
- `COPY_*.txt` - Copy-paste command files
- `*_NOW.txt` - Temporary instruction files
- `REBUILD_AND_SUBMIT.txt`
- `RUN_FULL_BUILD.txt`
- `SUBMIT_*.txt`

## 3. Scripts Folder Cleanup

### Keep (Referenced in package.json or essential):
- verify-backend-config.ts
- test-user-contributions-e2e.ts
- test-all-data-entry-e2e.ts
- analyze-truscore-standalone.ts
- analyze-pillar.ts
- testBarcodePerformance.ts
- setup-backend.ps1
- configure-vercel-env.ps1
- complete-backend-setup.ps1
- add-vercel-env-vars.ps1
- add-env-and-redeploy.ps1
- redeploy-backend.ps1
- run-full-e2e-test.ps1
- run-truscore-analysis.ps1
- testBarcodePerformance.ps1
- importFSANZDatabase.js
- downloadAndConvertFSANZ.js
- populateFSANZFromOpenFoodFacts.js
- importNZFCDToSQLite.js
- importAFCDToSQLite.js
- convertFSANZToJSON.js
- setupFSANZHosting.js
- completeFSANZSetup.js
- vercelLogin.ps1
- completeFSANZDeployment.ps1
- README.md

### Archive to `scripts/archive/one-time/`:
- All `*FIX*.js` files (one-time fixes)
- All `FINAL_*.js` files
- All `ULTIMATE_*.js` files
- All `GUARANTEED_*.js` files
- Duplicate/test variations of scripts
- Analysis scripts that are one-time use

## 4. Other Cleanup

### Keep:
- Crash_reports/ (may be useful for debugging)
- TruScore logic/ (active specification files)
- Database files/ (if actively used)
- Analysis documents/ (empty, can be removed)

### Excel Files in Root:
- Archive `afcd_*.xlsx` if not actively used
- Keep if part of build process

## 5. Source Code Cleanup

### Check for:
- Unused imports
- Dead code
- Commented-out code blocks
- Duplicate utility functions

## Execution Order

1. Create archive folder structure
2. Move documentation files (archive, don't delete)
3. Delete temporary test/data files
4. Archive one-time scripts
5. Review source code for dead code
6. Update .gitignore if needed
7. Verify no broken imports/references

