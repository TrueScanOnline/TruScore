# Project Isolation Checklist

## ✅ Before Starting ANY Work Session

Use this checklist EVERY TIME you start working:

- [ ] **Check Cursor title bar** - Should show `C:\TrueScan-FoodScanner`
- [ ] **Check Explorer panel** - Should show `TrueScan-FoodScanner` as root
- [ ] **Check package.json** - Should say `"name": "truescan-food-scanner"`
- [ ] **Check README.md** - Should say "TrueScan – Food Transparency Scanner"
- [ ] **Run verification script** (optional): `.\verify-project.ps1`

## ✅ If ANY Check Fails

**STOP IMMEDIATELY:**
1. Close current Cursor window
2. Navigate to: `C:\TrueScan-FoodScanner`
3. Open project: `code .` or open workspace file
4. Re-run checklist

## ✅ Quick Verification Command

```powershell
cd C:\TrueScan-FoodScanner
Get-Content package.json | Select-String "truescan-food-scanner"
```

**Should output:** `"name": "truescan-food-scanner",`

---

## 🚨 Red Flags - STOP if You See These

- ❌ Folder path shows: `C:\crypto-pal-safety-sep16`
- ❌ Package name is NOT "truescan-food-scanner"
- ❌ README mentions "crypto" or other project names
- ❌ Missing `app/` or `src/` folders
- ❌ Files don't match TrueScan project structure

---

## ✅ Green Flags - Safe to Proceed

- ✅ Folder path: `C:\TrueScan-FoodScanner`
- ✅ Package name: "truescan-food-scanner"
- ✅ README: "TrueScan – Food Transparency Scanner"
- ✅ Has `app/` folder with TrueScan screens
- ✅ Has `src/` folder with TrueScan services
- ✅ Has TrueScan-specific documentation files

---

**Remember:** When in doubt, verify! It takes 10 seconds and prevents hours of fixing mistakes.



