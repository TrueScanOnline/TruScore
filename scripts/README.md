# FSANZ Database Import Scripts

## Overview

Scripts to convert and import FSANZ (Food Standards Australia New Zealand) government food databases into the TrueScan app.

## Prerequisites

```bash
npm install xlsx
```

## Usage

### Convert FSANZ Database Export to JSON

```bash
# Australia
npm run import-fsanz -- --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU

# New Zealand
npm run import-fsanz -- --input downloads/fsanz-nz-export.xlsx --output data/fsanz-nz.json --country NZ
```

### Direct Node.js Usage

```bash
node scripts/importFSANZDatabase.js --input <input-file> --output <output-file> --country <AU|NZ>
```

## Input Formats Supported

- Excel: `.xlsx`, `.xls`
- CSV: `.csv`

## Output Format

JSON file with structure:
```json
{
  "9300657003425": {
    "productName": "Product Name",
    "brand": "Brand Name",
    "energyKcal": 250,
    "fat": 10.5,
    ...
  }
}
```

## Field Mapping

The script automatically maps common FSANZ field names:
- GTIN, Barcode, EAN, UPC → barcode
- Product Name, Product, Name → productName
- Brand, Brand Name, Manufacturer → brand
- Energy (kcal), Energy (kJ) → energyKcal
- Fat, Total Fat → fat
- etc.

See `FSANZ_DOWNLOAD_AND_IMPORT_INSTRUCTIONS.md` for complete field mapping.

