# W5-AD-01 — v0.12 checkpoint acceptance follow-up

**STATUS: STOP**
No further editorial changes. No AD-02 implementation. No commit / push / merge / EAS / OTA / release.

ChatGPT outcome acknowledged: **ACCEPT** v0.12 bounded E308/E309 corrections.

## 1. Source verification (read-only)

| Item | Result |
|---|---|
| Branch / HEAD | `experiment/w5-ad02-discovery-order-20261109` @ `5e9688f08b6882ae6fea0a2511eea00dc12c3bdb` |
| v0.12 workbook SHA-256 | `a70f860fd9a9c4f17deedf506d9e3d4106760973ee03b5c935a1648e72ece638` |
| Runtime manifest | `v0.12-W5AD01-editorial` / source_sha256 **matches** v0.12 |
| v0.11 workbook (preserved) | `e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5` |
| Independent v0.11→v0.12 compare | **Exactly 10 authorised fields** on `e308` + `e309` only |
| BODY6 / evidence / detection | unchanged vs v0.11 |
| W5-AD-02 `DISCOVERY_DISPLAY_SEQUENCE` | unchanged (`e120`…`e223`) |
| e472e | unchanged |

### Changed-field reconciliation

**e308 (2):** `source_preparation_profile`, `source_preparation_copy`
**e309 (8):** `source_preparation_profile`, `source_preparation_copy`, `tile_summary`, `expanded_summary`, `fact_1_label`, `fact_1_copy`, `fact_3_label`, `fact_3_copy`
**Total: 10.** No unauthorised differences.

## 2. Tests / invariants

- `w5Ad01E308E309Authorised.test.ts`: **5/5 PASS** (re-confirmed this follow-up)
- Prior full S25+Body suite after v0.12 apply: **128/128 PASS**
- Catalogue/automated rendering verification for E308/E309: **PASS** (no live product with those codes used)

## 3. Android UAT investigation

### Invalid Barcode root cause
Previous failure was automation/UI entry, not catalogue corruption: Enter Manually / EditText focus was unreliable and barcode entry via `adb input text` / wrong Search control produced an empty/invalid submission.

### This follow-up
- Metro confirmed serving `C:\TrueScan-FoodScanner` via `expo start -c --port 8081 --offline`
- Expo Go force-stopped and relaunched (`exp://10.0.2.2:8081`) to clear stale bundle
- Favourites barcode `9300617308324` repeated successfully

### Observed result
| Check | Result |
|---|---|
| Result opens | **Yes** |
| Additives modal renders | **Yes** |
| Discovery intro | **Yes** |
| Ordering markers (120, 476 visible) | **Yes** |
| Expansion + scroll (e120) | **Yes** (captures `08`/`09`/`11`) |
| E308/E309 on this product | **No** (expected) |

Evidence: `docs/uat/w5-ad01-v012-checkpoint-20261110/` (`05_result`, `07_modal0`, `08_e120_expanded`, `UAT_RESULT.json`).

**Live product-specific UAT for E308/E309: OUTSTANDING** (no suitable real product available; do not invent one). Catalogue + automated rendering verification covers those two entries.

iOS TestFlight not re-checked.

## 4. Remaining blockers

- Live product UAT for E308/E309 still outstanding (no product available).
- Otherwise no blockers for the accepted v0.12 checkpoint itself.

**STOP.**
