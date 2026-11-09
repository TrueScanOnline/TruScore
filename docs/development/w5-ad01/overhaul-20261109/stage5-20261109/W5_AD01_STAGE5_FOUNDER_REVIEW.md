# W5-AD-01 Stage 5 — Consolidated Editorial & Source-Quality Closure

**STATUS: STOP FOR FOUNDER / CHATGPT ACCEPTANCE**

No commit, push, merge, EAS, OTA or release.

## Git identity
- Branch: `experiment/w5-ad02-discovery-order-20261109`
- HEAD: `5e9688f08b6882ae6fea0a2511eea00dc12c3bdb`
- Recovery tags:
  - `w5-ad01-pre-catalogue-overhaul-20261109` → `5e9688f08b6882ae6fea0a2511eea00dc12c3bdb`
  - `w5-ad01-pre-stage4c-batch-a-20261109` → `5e9688f08b6882ae6fea0a2511eea00dc12c3bdb`
  - `w5-ad01-pre-additives-20261108` → `855f45bca3873629811c30542a01ef7f7af617ff`
  - `w5-ad02-pre-discovery-20261109` → `82d2fec9c1dd39d454788b8a2843d2c22945b4f5`
- Working tree: Stage 5 uncommitted on top of uncommitted v0.10 overhaul; Batch A never separately committed.

## Baseline / successor
- Experimental baseline: **v0.10** `5a8e8fb5be0b4a70832fa8e0d6c46bc42e281ddba3ab29bc06b5c1e8e9dc25b6` (unchanged)
- Successor applied: **v0.11** `e155d47e71078a62d0866d1fe5819dac937bcd5877dbc0e4fc67cae10afa9eb5`
- Runtime catalogue SHA-256: `ad92121f91db4b9907393760447b46fe081514ab2de0097083cf90b61d445d6f`
- Ingestion manifest: `v0.11-W5AD01-editorial` / `950fa666e973d85bdebcab1f08a8d040ef23836e2660e3e59970ecbd998f9587`

## Task 1 — 24 duplicated descriptions
- Decisions: **24 IMPROVE / 0 KEEP**
- Tile left unchanged; expanded only, using existing SP/facts (no new unsupported discoveries).
- Remaining STANDARD tile==expanded duplicates after Stage 5: **0**

| ID | Decision |
|---|---|
| `e133` | IMPROVE |
| `e143` | IMPROVE |
| `e172` | IMPROVE |
| `e307b` | IMPROVE |
| `e335` | IMPROVE |
| `e336` | IMPROVE |
| `e337` | IMPROVE |
| `e350` | IMPROVE |
| `e351` | IMPROVE |
| `e352` | IMPROVE |
| `e354` | IMPROVE |
| `e401` | IMPROVE |
| `e402` | IMPROVE |
| `e404` | IMPROVE |
| `e409` | IMPROVE |
| `e444` | IMPROVE |
| `e507` | IMPROVE |
| `e510` | IMPROVE |
| `e518` | IMPROVE |
| `e519` | IMPROVE |
| `e551` | IMPROVE |
| `e941` | IMPROVE |
| `e942` | IMPROVE |
| `e962` | IMPROVE |

Full before/after: `DUP24_DECISIONS.json`.

## Task 2 — 14 SOURCE REVIEW REQUIRED
- Dispositions: **9 RESOLVED**, **5 RETAIN FAIL-CLOSED**, **0 FOUNDER DECISION**
- Editorial fields modified: `e221`, `e225`, `e308`, `e381`, `e946`, `e962`

| ID | Recommendation | Modified |
|---|---|---|
| `e153` | RESOLVED | no |
| `e221` | RESOLVED | yes |
| `e225` | RESOLVED | yes |
| `e308` | RESOLVED | yes |
| `e357` | RETAIN FAIL-CLOSED | no |
| `e381` | RESOLVED | yes |
| `e432` | RESOLVED | no |
| `e472e` | RESOLVED | no |
| `e627` | RETAIN FAIL-CLOSED | no |
| `e631` | RETAIN FAIL-CLOSED | no |
| `e920` | RETAIN FAIL-CLOSED | no |
| `e943b` | RETAIN FAIL-CLOSED | no |
| `e946` | RESOLVED | yes |
| `e962` | RESOLVED | yes |

### Special attention
#### `e153` — RESOLVED
- Question: Does Schedule 8 title "Carbon blacks or Vegetable carbon" allow non-vegetable industrial carbon black, conflicting with plant-origin tile copy?
- Source `FSANZ_S8`: Official Schedule 8 name is "Carbon blacks or Vegetable carbon" (153). (https://www.legislation.gov.au/F2015L00478)
- Source `JECFA_153`: JECFA additive is "Vegetable Carbon"; synonyms include "Vegetable black" and "Carbon black (vegetable sources)"; produced by carbonising vegetable material. (https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/2323)
- Source `FSANZ_consumer_colour`: FSANZ consumer materials refer to vegetable carbon (carbon black), INS 153, as the colour assessed/discussed. (https://www.foodstandards.gov.au/consumer/additives/colours-food-additives)
- Notes: Existing tile/expanded correctly describe vegetable carbon. No copy change. Evidence fields untouched.

#### `e308` — RESOLVED
- Question: Is 308 natural/plant-extracted gamma-tocopherol or synthetic gamma-tocopherol under FSANZ/JECFA?
- Source `FSANZ_S15`: Schedule 15 lists 308 as Synthetic gamma-tocopherol (distinct from 307b Tocopherols concentrate, mixed). (https://www.legislation.gov.au/Details/F2021C00607)
- Source `JECFA_307b`: JECFA mixed tocopherol concentrate is INS 307b (not 308). (https://apps.who.int/food-additives-contaminants-jecfa-database/Home/Chemical/4871)
- Notes: Editorial fields corrected to synthetic listing. FOUNDER APPROVAL REQUIRED before changing source_preparation_profile from PLANT_EXTRACT to CHEMICAL_SYNTHESIS (governed source field).

#### `e432` — RESOLVED
- Question: Can fatty-acid feedstock be pinned to plant vs animal for Polysorbate 20?
- Source `JECFA_432`: Definition uses edible commercial lauric acid; does not pin botanical vs animal origin. (https://www.fao.org/fileadmin/user_upload/jecfa_additives/docs/Monograph1/Additive-320.pdf)
- Source `USP_polysorbate20`: USP notes fatty acids may be of vegetable, animal, or synthetic origin. (https://doi.usp.org/USPNF/USPNF_M66800_04_01.html)
- Notes: Keep fail-closed hedge. No wording change required.

#### `e472e` — RESOLVED
- Question: Can plant vs animal fatty-acid sources for DATEM-type 472e be asserted product-specifically?
- Source `ENTRY_SP`: Existing source_preparation_copy already states fatty-acid sources can be plant or animal. (internal:catalogue_315.json#e472e)
- Notes: Retain existing fail-closed disclosure. No change.

#### `e946` — RESOLVED
- Question: Is propellant/packaging-gas use supported for octafluorocyclobutane?
- Source `US_21CFR_173.360`: FDA permits octafluorocyclobutane as propellant and aerating agent in foamed or sprayed food products. (https://www.law.cornell.edu/cfr/text/21/173.360)
- Source `FSANZ_S8`: Schedule 8 lists Octafluorocyclobutane (946). (https://www.legislation.gov.au/F2015L00478)
- Notes: Corrected fact_1/expanded to propellant or aerating agent; removed unsupported packaging-gas framing.

### Founder approval required (not implemented)
- `e308.source_preparation_profile`: `PLANT_EXTRACT` → `CHEMICAL_SYNTHESIS` — FSANZ Schedule 15 lists 308 as Synthetic gamma-tocopherol; editorial copy corrected but governed profile not changed.

## Task 3 — AD-02 read-only recommendation correction
- Runtime `DISCOVERY_DISPLAY_SEQUENCE` **unchanged**.
- Removed illustrative / unverified Favourites IDs: `e1401`, `e160c`, `e163`, `e331`, `e428`, `e440`, `e500`
- Verified Favourites barcode `9300617308324` rendered IDs: `e120`, `e471`, `e476`, `e150c`, `e330`, `e322`, `e422`, `e575`, `e223`
- Proposed Favourites modal order (runtime map ∩ verified detections): `e120`, `e471`, `e476`, `e150c`, `e330`, `e322`, `e422`, `e575`, `e223`
- Discovery candidates dependent on unresolved source questions: `e308`, `e357`, `e627`, `e631`, `e920`, `e943b`

## Task 4 — Protected invariants
- BODY6 identical vs v0.10
- Evidence authority fields identical vs v0.10
- source_preparation_profile / source_preparation_copy identical vs v0.10
- Detection fields untouched
- W5-AD-02 runtime map untouched
- Ingestion behaviour unchanged except allowlisting `v0.11-W5AD01-editorial`

## Validation
- See `TEST_RESULTS.json` (filled by packaging step)
- Source-to-runtime diff: `29` IDs / `42` field mutations

## Release-readiness recommendation
**NOT release-ready.** Accept Stage 5 editorial closure only after founder/ChatGPT review. Still required before any release path: commit authorisation, e308 profile approval decision, and separate AD-02 ranking implementation approval. Dual-UAT visual check on v0.11 not yet claimed in this package.

_Generated 2026-11-09T08:23:06.038937+00:00_
