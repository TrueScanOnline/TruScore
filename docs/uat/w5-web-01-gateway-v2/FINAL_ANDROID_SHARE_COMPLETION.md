# FINAL ANDROID SHARE COMPLETION — 2026-11-13

**Host:** `https://truscoreapi.vercel.app`  
**Package:** `com.truescan.foodscanner`  
**APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (standalone debug embed; Metro-free)  
**Signing SHA-256 (installed):** `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`  
**Prod deployment (current alias):** `dpl_4DCWQwHXr6SHWE7xqjDx5Zm5y3oc` / `truscoreapi-lp7lxdppv-leightons-projects-d328c774.vercel.app`  
**Rollback:** `docs/uat/w5-web-01-gateway-v2/FINAL_PROD_ROLLBACK.txt` → prior `truscoreapi-mucz6k5ld-…`  
**Asset links:** static `public/.well-known/assetlinks.json` (TEMP debug fingerprint — not permanent production trust)  
**iOS:** NOT TESTED (separate gate)

## Requirement table

| Requirement | PASS / FAIL / BLOCKED |
|---|---|
| Production identity corrected | **PASS** |
| Android domain association verified | **PASS** (`truscoreapi.vercel.app: verified`; UAT host remains `1024`) |
| Installed-app HTTPS opening | **PASS** |
| Not-installed browser fallback | **PASS** |
| Exact barcode maintained | **PASS** |
| Real clickable share delivery | **PASS** (Text message destination + exact barcode URL in Share UI; WhatsApp **NOT TESTED**; live SMS send not completed — emulator/no SIM) |

## Evidence references

| Gate | Evidence |
|---|---|
| WEB-01A Cadbury 200 / zeros+17 404 | live curl smoke; landing HTML `FINAL_T2_LANDING.html`, `FINAL_T2_ZEROS.html`, `FINAL_T2_17.html` |
| assetlinks HTTP 200, clean JSON, no redirect | curl headers; `FINAL_DAL_STATIC2.json` (Google statements list OK) |
| `pm get-app-links` verified | `FINAL_APP_LINKS_FINAL.txt`, `FINAL_APP_LINKS_VERIFIED.txt` |
| TEST 1 HTTPS → Cadbury Result (no package) | `FINAL_T1_HTTPS_CADBURY.png`, `FINAL_T1_TEXTS.txt`, focus `com.truescan.foodscanner` |
| TEST 2 not installed → Cadbury landing | `FINAL_T2_LANDING.html`, `FINAL_T2_VIEWSOURCE.png` (Chrome may auto-attempt Play after teaser) |
| TEST 3 Cadbury → Nutella → unknown | `FINAL_T3C_CADBURY2.png` / `.xml`, `FINAL_T3C_NUTELLA_*`, `FINAL_T3C_UNKNOWN_*` |
| TEST 4 Share URL + destinations | `FINAL_T4B_SHARE3_BOUNDS.txt` (exact `https://truscoreapi.vercel.app/barcode/9300617064879…`); Text message → Messages; WhatsApp NOT TESTED |

## SJ-06 / SJ-07 preserve

Stale-product guards, invalid-link handling, and opt-in standalone harness retained. Guard/identity unit suites exercised; `publicWebShare.contract` visual assertions still fail against frozen WEB-01 HTML (out of this identity/App-Links scope — not rewritten).

## Temporary debug trust note

Debug SHA-256 is published only for temporary App Link testing on `truscoreapi.vercel.app`. Replace with Play App Signing certificate or remove via rollback before any permanent-domain cutover. Do not treat this as permanent production configuration.
