# Database Files Directory

This directory contains source database files for the TrueScan Food Scanner application.

## Contents

### Australian Food Composition Database (AFCD)
- `AU Release 2 - Food Details.xlsx` - Food details data
- `AU Release 2 - Nutrient file.xlsx` - Nutrient composition data

### New Zealand FOODfiles™ 2024
- `New Zealand FOODfiles™ 2024 Manual.pdf` - Database documentation
- `foodfiles-2024-v1.msi` - Database installer (if needed)

### Principal Files
Contains the main database files in both ASCII and Excel formats:
- **CSM.FT** / **CSM.FT.XLSX** - Component data
- **INGREDIENT.FT** / **INGREDIENT.FT.XLSX** - Ingredient data
- **Standard DATA** - Standard database files
- **Unabridged DATA** - Unabridged database files

### Supporting Files
Contains supporting data files:
- Conversion factors
- Nutrient retention factors
- Weight yield factors
- Code files
- Name files

### Update Files
Contains update documentation for the latest version of FOODfiles.

## Usage

These files are used by import scripts to populate the SQLite databases:
- `scripts/importAFCDToSQLite.js` - Imports AFCD data
- `scripts/importNZFCDToSQLite.js` - Imports NZFCD data

## Notes

- These are source files - do not modify directly
- Imported data is stored in SQLite databases in the app
- Excel files are preferred for manual review
- ASCII files are used by automated import scripts
