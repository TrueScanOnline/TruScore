# W5-AD-01 — Founder-authorised E308/E309 source correction

**STATUS: STOP FOR FOUNDER / CHATGPT REVIEW**
No commit, push, merge, EAS, OTA or release without separate approval.

## 1. Git identity

| Item | Value |
|---|---|
| Branch | `experiment/w5-ad02-discovery-order-20261109` |
| HEAD | `5e9688f08b6882ae6fea0a2511eea00dc12c3bdb` |
| Recovery tags preserved | `w5-ad01-pre-catalogue-overhaul-20261109`, `w5-ad01-pre-stage4c-batch-a-20261109`, `w5-ad01-pre-additives-20261108`, `w5-ad02-pre-discovery-20261109` |
| Unrelated dirty | `backend/vercel/**` preserved / untouched by this change |

## 2. Source / runtime versions

| Asset | Version | SHA-256 |
|---|---|---|
| Baseline workbook (preserved) | v0.11 | `e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5` |
| Successor workbook | **v0.12** | `a70f860fd9a9c4f17deedf506d9e3d4106760973ee03b5c935a1648e72ece638` |
| Runtime ingest | `v0.12-W5AD01-editorial` | source_sha256 matches v0.12 |
| Prior v0.8 / v0.9 / v0.10 | preserved | unchanged |

Workbook path:
`docs/development/w5-ad01/Rveel_S25_Broader_Additive_Catalogue_MVP_Implementation_Asset_W5AD01_editorial_v0_12.xlsx`

## 3. Exact changed IDs and fields

Only **e308** and **e309**. **e472e unchanged.**

### e308
- `source_preparation_profile`: `PLANT_EXTRACT` → `CHEMICAL_SYNTHESIS`
- `source_preparation_copy`: founder/ChatGPT authorised synthetic listing wording
- Stage 5 consumer editorial **retained unchanged**

### e309
- `source_preparation_profile`: `PLANT_EXTRACT` → `CHEMICAL_SYNTHESIS`
- `source_preparation_copy`: founder/ChatGPT authorised synthetic listing wording
- Consumer editorial applied exactly from `PROPOSED_E308_E309_E472E_CORRECTIONS.json`:
  `tile_summary`, `expanded_summary`, `fact_1_label`, `fact_1_copy`, `fact_3_label`, `fact_3_copy`
- `fact_2` preserved

Unauthorised mutations vs v0.11: **none** (`SOURCE_TO_RUNTIME_DIFF_V11_TO_V12.json`).

## 4. Tests and invariants

| Check | Result |
|---|---|
| `tsc --noEmit` | **PASS** |
| Jest S25 + Body scope | **128 passed / 128 total** |
| BODY6 vs v0.11 | identical |
| Evidence fields vs v0.11 | identical |
| Detection / AD-02 runtime map | unchanged |
| Other 307 family additives | unchanged |
| backend/vercel/** | not modified by this task |

## 5. Device UAT

- Emulator `emulator-5554` and Metro `:8081` were live.
- Forced Expo Go reload attempted before automated Favourites entry (`9300617308324`).
- Automated Favourites journey **did not complete cleanly** after reload (UI landed on “Invalid Barcode”); no verified v0.12 Favourites modal capture in this pass.
- Evidence remnant: `docs/uat/w5-ad01-e308-e309-20261110/current.png` / `current.xml`.
- iOS TestFlight **not** checked.
- Treat device UAT for this correction as **not verified** in this package.

## 6. Unresolved blockers

- Device UAT for v0.12 not verified (automated barcode entry failure after reload).
- Catalogue final acceptance remains a founder decision after this review.
- No other technical blockers for the authorised E308/E309 field set.

**STOP.**
