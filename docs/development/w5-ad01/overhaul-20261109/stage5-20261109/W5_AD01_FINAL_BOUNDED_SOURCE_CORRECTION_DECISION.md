# W5-AD-01 — Final bounded source-correction decision

**STATUS: STOP — awaiting explicit founder approval before any governed source change.**
No commit, push, merge, EAS, OTA or release.
No `source_preparation_profile` / `source_preparation_copy` mutations were applied.

Accepted from Stage 5 (unchanged): 24 expanded improvements; 42-field / 29-ID editorial reconciliation; corrected read-only Favourites ordering; protected-field invariants.

---

## 1. E308 and E309 — proposed governed corrections (NOT applied)

### Factual basis

| Authority | 308 | 309 |
|---|---|---|
| **FSANZ Schedule 8** (ingredient-statement name) | γ-Tocopherol | δ-Tocopherol |
| **FSANZ Schedule 15** (permission identity) | **Synthetic gamma-tocopherol** | **Synthetic delta-tocopherol** |
| Codex / INS framing | Tocopherol, gamma-, synthetic | Tocopherol, delta-, synthetic |
| Sibling contrast | **307b** = Tocopherols concentrate, mixed (vegetable-oil stream concentrate of naturally occurring tocopherols) | same |
| Sibling contrast | **307c** = dl-Alpha-tocopherol (already `CHEMICAL_SYNTHESIS` in catalogue) | — |

**Distinction that matters for consumers**

- Naturally occurring tocopherols (α/β/γ/δ) exist in vegetable oils and appear together in **mixed concentrates (307b)**.
- The **commercial additive identities numbered 308 and 309 in the Australia New Zealand Food Standards Code permissions table are the synthetic single-homologue preparations**, not “whatever γ/δ-tocopherol happens to be present in a plant extract.”
- Schedule 8’s short labelling names (γ-/δ-Tocopherol) do **not** override Schedule 15’s synthetic permission identity.

Current catalogue error: both still carry `source_preparation_profile = PLANT_EXTRACT` and plant-fraction SP copy. Stage 5 already corrected **E308 consumer editorial** to synthetic; **E309 consumer editorial still reads as natural occurrence** and is inconsistent with Schedule 15.

### Exact proposed corrections

#### E308 (`γ-Tocopherol`)

| Field | Current | Proposed |
|---|---|---|
| `source_preparation_profile` | `PLANT_EXTRACT` | `CHEMICAL_SYNTHESIS` |
| `source_preparation_copy` | Commercial food-grade material is commonly isolated and purified from vegetable-oil fractions rich in tocopherols. | Manufactured by chemical synthesis as a defined gamma-tocopherol preparation and purified to food-additive specifications. |
| `tile_summary` | *(Stage 5 already)* Synthetic gamma-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family. | **Keep Stage 5 text** (already aligned). |
| `expanded_summary` | *(Stage 5 already synthetic / Schedule 15)* | **Keep Stage 5 text**. |
| `fact_1_label` / `fact_1_copy` | Listing / FSANZ Schedule 15 synthetic… | **Keep Stage 5 text**. |
| `fact_2_*` | Food role / antioxidant | **Keep**. |
| `fact_3_*` | Decode note distinguishing from 307b | **Keep**. |

#### E309 (`δ-Tocopherol`)

| Field | Current | Proposed |
|---|---|---|
| `source_preparation_profile` | `PLANT_EXTRACT` | `CHEMICAL_SYNTHESIS` |
| `source_preparation_copy` | Commercial food-grade material is commonly isolated and purified from vegetable-oil fractions rich in tocopherols. | Manufactured by chemical synthesis as a defined delta-tocopherol preparation and purified to food-additive specifications. |
| `tile_summary` | Delta-tocopherol is one of the naturally occurring tocopherols in the vitamin E family. | Synthetic delta-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family. |
| `expanded_summary` | …naturally occurring… It is fat-soluble and can help slow oxidation. | Synthetic delta-tocopherol is a manufactured form of one of the tocopherols in the vitamin E family. In the Australia New Zealand Food Standards Code it is listed as synthetic delta-tocopherol (309), distinct from mixed tocopherols concentrate (307b). It is fat-soluble and is used as an antioxidant in fat-containing foods. |
| `fact_1_label` | Natural occurrence | Listing |
| `fact_1_copy` | Found naturally in vegetable oils and other plant foods. | FSANZ Schedule 15 lists 309 as synthetic delta-tocopherol, separate from mixed tocopherols concentrate (307b). |
| `fact_2_label` / `fact_2_copy` | Food role / Used as an antioxidant… | **Keep** (or identical wording). |
| `fact_3_label` | *(empty)* | Decode note |
| `fact_3_copy` | *(empty)* | The additive number alone does not mean the ingredient was extracted as a mixed natural tocopherol concentrate. |

**Note:** EFSA has discussed CAS/natural-isomer nuances for EU E 309 specifications; for Rveel AU/NZ catalogue identity, **Schedule 15 “Synthetic delta-tocopherol” remains the governing commercial-additive identity**.

**Decision requested:** Approve / reject the E308+E309 governed profile+SP changes and the E309 editorial alignment above.

---

## 2. E472e — plant/animal fatty-acid statement

### Primary-source finding

JECFA specification for Diacetyltartaric and fatty acid esters of glycerol (DATEM / INS 472e):

> “mixed glycerol esters of mono- and diacetyltartaric acid and **fatty acids of food fats**.”

Source: FAO JECFA monograph (Additive-149 / FNP 52 Add 9).
URL: https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-149.pdf

“Food fats” in that specification are not restricted to botanical oils; the monograph does **not** pin plant-only or animal-only feedstock. That is adequate independent primary support for a **generic indeterminate plant-or-animal hedge**, and inadequate support for any product-specific origin claim.

### Disposition

- **RESOLVED for the generic hedge** — current `source_preparation_copy` clause (“fatty-acid sources can be plant or animal”) is supported by JECFA’s “fatty acids of food fats” definition.
- **Retain fail-closed consumer stance** — do not assert plant-only, animal-only, or product-specific origin from code 472e alone.
- **No governed field change proposed** for E472e.
- Optional later editorial (not required for closure): add an explicit `fact_3` “Source can vary” line mirroring 472a/b/c/f; still fail-closed.

---

## 3. Verification (this hold package)

| Check | Result |
|---|---|
| `tsc --noEmit` | **PASS** |
| Jest `unit/s25` + Body pillar / Body6 / w5Ad scope | **123 passed / 123 total** |
| Runtime ↔ v0.11 workbook SHA | **match** `e155d47e…9eb5` |
| v0.10 workbook preserved | **yes** `5a8e8fb5…25b6` |
| E308/E309/E472e governed SP fields mutated | **no** |
| W5-AD-02 `DISCOVERY_DISPLAY_SEQUENCE` | **unchanged** |
| Representative Android visual UAT (v0.11) | **PASS (NZ Expo Go / emulator)** |

### Visual UAT

- Platform checked: Android emulator `emulator-5554` via Expo Go + existing Metro `:8081`
- Barcode: `9300617308324` (Cadbury Favourites)
- Evidence: `docs/uat/w5-ad01-stage5-hold-20261109/` (`01_result`, `03_modal0`, `04_e120_expanded`)
- Confirmed on-device: Cochineal (120) present; PGPR (476) present; discovery intro visible; e120 expanded opens
- Caramel III (150c) not asserted on the first modal viewport (may require scroll; not treated as a regression for this hold)
- iOS TestFlight **not** visually re-checked

---

## 4. Release / acceptance recommendation

**Catalogue final acceptance still HOLDS** until founder explicitly approves the E308/E309 governed source corrections (and the E309 editorial alignment bundled with them).

After approval, apply only those approved fields in a bounded successor ingest; re-run S25+Body tests; then re-open acceptance.

**STOP.**
