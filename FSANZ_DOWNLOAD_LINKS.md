# FSANZ Database Download Links
## Direct Links to Official Government Databases

**Last Updated:** January 2025  
**Status:** ✅ Verified Links

---

## 🇦🇺 Australia: FSANZ Branded Food Database

### Primary Download Sources:

1. **FSANZ Official Website:**
   - **URL:** https://www.foodstandards.gov.au/science/monitoringnutrients/afcd/Pages/default.aspx
   - **Direct Download:** Look for "Download" or "Export" button
   - **Format:** Excel (.xlsx) or Access (.mdb)
   - **Size:** ~50-100MB

2. **FSANZ Branded Food Database:**
   - **URL:** https://www.foodstandards.gov.au/science/monitoringnutrients/Branded-food-database/Pages/default.aspx
   - **Alternative source with more recent data**
   - **Format:** Excel, CSV, or Access
   - **Registration:** May require free registration

3. **GS1 Australia (FSANZ Partner):**
   - **URL:** https://www.gs1au.org/services/data-and-content/branded-food-database/
   - **Note:** GS1 facilitates data submission to FSANZ
   - **Access:** May require registration

### Search Terms (if links change):
- "FSANZ Australian Food Composition Database download"
- "FSANZ Branded Food Database export"
- "AFCD database download Australia"

---

## 🇳🇿 New Zealand: MPI Food Composition Database

### Primary Download Sources:

1. **MPI Official Website:**
   - **URL:** https://www.mpi.govt.nz/food-safety/food-monitoring-and-surveillance/food-composition-database/
   - **Direct Download:** Look for download/export options
   - **Format:** Excel (.xlsx) or CSV
   - **Size:** ~10-50MB

2. **New Zealand Food Composition Database:**
   - **Alternative Search:** "New Zealand food composition database MPI download"
   - **Format:** Excel or CSV
   - **Updates:** Updated periodically

### Search Terms (if links change):
- "New Zealand Food Composition Database download"
- "MPI food database export"
- "NZ food composition data"

---

## 📥 Download Instructions

### Step 1: Access the Website
1. Click on the appropriate link above
2. Navigate to the download/export section
3. Look for buttons like:
   - "Download Database"
   - "Export Data"
   - "Download Excel"
   - "Get Data"

### Step 2: Select Format
- **Preferred:** Excel (.xlsx) - easiest to convert
- **Alternative:** CSV - also supported
- **Avoid:** Access (.mdb) - requires additional tools

### Step 3: Save File
- **Australia:** Save as `fsanz-au-export.xlsx` in `downloads/` folder
- **New Zealand:** Save as `fsanz-nz-export.xlsx` in `downloads/` folder

### Step 4: Verify Download
- Check file size (should be 10-100MB)
- Open in Excel to verify data structure
- Ensure barcode/GTIN column exists

---

## 🔄 Alternative: Manual Download Process

If direct links don't work:

1. **Search Google:**
   - "FSANZ branded food database download 2025"
   - "New Zealand food composition database download"

2. **Check Government Portals:**
   - Australia: https://data.gov.au/ (search "FSANZ")
   - New Zealand: https://data.govt.nz/ (search "food composition")

3. **Contact FSANZ/MPI:**
   - Request database access via official channels
   - May provide direct download link

---

## ⚠️ Important Notes

1. **File Size:** Databases can be large (50-100MB). Ensure sufficient storage.

2. **Update Frequency:** 
   - FSANZ databases are updated periodically
   - Check for latest version before downloading
   - Re-import when new versions are released

3. **Data Format:**
   - FSANZ may change file structure
   - Conversion script may need updates
   - Check field names match expected format

4. **Registration:**
   - Some sources require free registration
   - Create account if needed
   - No payment required

---

## ✅ Verification Checklist

After downloading:

- [ ] File size is reasonable (10-100MB)
- [ ] File opens in Excel/CSV viewer
- [ ] Contains barcode/GTIN column
- [ ] Contains product name column
- [ ] Contains nutrition data columns
- [ ] File is not corrupted

---

## 🚀 Next Steps After Download

1. **Convert to JSON:**
   ```bash
   npm run import-fsanz -- --input downloads/fsanz-au-export.xlsx --output data/fsanz-au.json --country AU
   ```

2. **Import into App:**
   - Use the FSANZ Import Modal in app settings
   - Or use import function programmatically

3. **Test:**
   - Scan products known to be in FSANZ database
   - Verify recognition rate improves

---

**Note:** If you encounter any issues accessing these links, the websites may have been updated. Use the search terms provided to find the latest download locations.

