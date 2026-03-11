# Ethics Pillar Alerts (ID 17) – Specific Source URL & Legal Disclosure

## Policy (applies to all sources that negatively affect the Ethics pillar)

- **Legal requirement:** Any negative scoring in the Ethics pillar must be displayed as an **alert banner** with (1) an **explanation** of the specific information used, and (2) a **hyperlink to the actual source** when available.
- **Banner alerts** (recalls, labor, animal welfare, brand recall history) MUST use a **specific hyperlink** to the actual report/issue when available.
- When no single report URL exists (e.g. brand database only), the message must state that explicitly and link to the best available **official reference** (e.g. DOL List of Goods, BBFAW, FDA Recalls search).
- **Labor:** `violationReportUrls` from DOL list of goods, Walk Free GSI, Buycott, or (when only brand_database) DOL List of Goods; message discloses “our brand database” when applicable.
- **Animal welfare:** `violationReportUrls` from BBFAW, ASPCA, Ethical Consumer, etc., or (when only brand_database) BBFAW as reference; message discloses “our brand database” when applicable.
- **Recalls:** Use specific `recall.url` when available; otherwise FDA/USDA/CFIA/RASFF index; message states “This affects your Ethics score.”
- **Brand recall history (overlay):** When product has no active recall but brand has recall history in brand DB, show banner with disclosure and link to FDA Recalls search.
- **Time-bound:** Alerts are filtered to violations within the last **12 months** where applicable. Timestamps come from violation year (DOL, Walk Free) or current year when not available.

## Example Barcodes (Inferred from Logic)

Definitive behaviour can be confirmed by running the app or a script that calls `checkLaborViolations(product)` with the merged product for each barcode and logs `laborViolationData` and the resulting Ethics score.

| Barcode       | Product              | Brand / context        | Expected labor behaviour |
|---------------|----------------------|------------------------|---------------------------|
| **40000422068** | Milky Way            | Mars                   | Mars is in `MAJOR_LABOR_VIOLATION_BRANDS`; if brand matches, **major** labor penalty (-15). Sources: brand_database or known_violations. Banner: specific URL = DOL child/forced labor reports (when only brand_database). |
| **3017620422003** | Nutella            | Ferrero                | Ferrero is in `MAJOR_LABOR_VIOLATION_BRANDS` (cocoa); category/spread may also trigger DOL curated list (Cocoa). **Major** penalty likely. Banner: DOL list of goods URL when DOL source, else DOL reports. |
| **9310272002253** | Norco              | Norco Dairy Co-Op      | Norco may not be in brand DB; no known violation lists. **No labor violation** unless added. No labor banner expected. |
| **9310354983324** | Jalna              | Jalna                  | Jalna may not be in brand DB. **No labor violation** unless added. No labor banner expected. |

## How to Verify

1. **In app:** Scan each barcode, open the result screen, and check:
   - Whether a "Labor Concerns" banner appears.
   - That the banner’s link goes to the **specific report** (e.g. DOL list of goods, Walk Free GSI) when applicable, not only to the org homepage.
2. **Script:** Build a minimal product object (barcode, brands, categories, origins) for each barcode, call `checkLaborViolations(product)`, and log `laborViolationData` (including `violationReportUrls`, `timestamp`, `violationTimestamps`) and the Ethics pillar score.

## Severity and Time-Bound

- **Severity:** 3-tier (limited = -4, moderate = -8, major = -15) applied from brand DB, known lists, DOL, Walk Free, Buycott.
- **Time-bound:** Banner shows only when `laborViolationData.timestamp` is within the last 12 months (or unset). DOL/Walk Free timestamps are derived from violation `year`; other sources use start of current year.
