# W5-AD-02 — CORE-22 local implementation review

**STATUS: LOCAL CHECKPOINT READY (Tasks 1–2 PASS)**  
**NO PUSH. NO MERGE. NO EAS. NO OTA. NO RELEASE.**

## 1. Git branch and HEAD (pre-commit)

| Item | Value |
|---|---|
| Branch | `experiment/w5-ad02-discovery-order-20261109` |
| Parent / baseline HEAD | `453e7ba2d678e8ddbd1e20061a642d814952fe1d` |
| Catalogue | `v0.12-W5AD01-editorial` |
| Spec | `W5_AD02_FINAL_IMPLEMENTATION_ACCEPTANCE.md` |

## 2. Actual changed-file list (intended commit)

| Path | Role |
|---|---|
| `src/s25/discoveryPresentationOrder.ts` | CORE-22 `DISCOVERY_DISPLAY_SEQUENCE` only |
| `src/__tests__/unit/s25/w5Ad02DiscoveryOrdering.test.ts` | Focused AD-02 ordering / intro tests |
| `src/__tests__/unit/s25/w5Ad01Stage5Closure.test.ts` | Pin authorised CORE-22 map |
| `src/__tests__/unit/s25/w5Ad01E308E309Authorised.test.ts` | Same map pin update |
| `docs/development/w5-ad02/W5_AD02_FINAL_DISCOVERY_RANKING_REVIEW_CORRECTED.md` | Corrected AD-02 specification |
| `docs/development/w5-ad02/W5_AD02_FINAL_IMPLEMENTATION_ACCEPTANCE.md` | Reconciliation / acceptance |
| `docs/development/w5-ad02/W5_AD02_CORE22_LOCAL_IMPLEMENTATION_REVIEW.md` | This concise implementation report |

Unrelated dirty / untracked preserved (not staged): `backend/vercel/**`, false-dirty sibling S25 assets (LF/CRLF only), historical UAT trees, AD-02 UAT evidence under `docs/uat/w5-ad02-core22-20261110/`.

## 3. Exact runtime-map diff

`DISCOVERY_DISPLAY_SEQUENCE` replaced pilot-9 with authorised CORE-22:

`e120:1, e905b:2, e904:3, e901:4, e542:5, e1105:6, e1101:7, e957:8, e476:9, e445:10, e1522:11, e355:12, e943a:13, e944:14, e955:15, e123:16, e141:17, e415:18, e150c:19, e330:20, e334:21, e300:22`

Excluded: `s8-nocode-002`, `s8-nocode-004`, all EXTENDED/HOLD/EXCLUDE, demoted pilot `e471/e322/e422/e575/e223`.

Sorter, intro helper, colour-group min-member logic, and non-safety disclaimer text **unchanged**.

## 4. Test results (actual)

| Gate | Result |
|---|---|
| `tsc --noEmit` | **PASS** |
| Jest `w5Ad02DiscoveryOrdering.test.ts` | **21/21 PASS** |
| Jest `w5Ad01Stage5Closure.test.ts` | **PASS** |
| Jest `w5Ad01E308E309Authorised.test.ts` | **PASS** |
| Focused total | **3 suites / 32 tests PASS** |

Favourites fixture CORE intersection asserted as `e120 → e476 → e150c → e330`, then occurrence-ordered remainder including demoted pilot IDs.

## 5. Android final demoted verification (Task 1)

Device: `emulator-5554` · Expo Go (reinstalled SDK53) · Metro `packager-status:running` · `exp://10.0.2.2:8081`.

Cadbury Favourites `9300617308324` — About these Additives modal scroll hierarchy:

| ID | Rendered title matched | Result |
|---|---|---|
| E471 | `Mono- and di-glycerides of fatty acids (471)` | **PASS** |
| E422 | `Glycerin or glycerol (422)` | **PASS** |
| E575 | `Glucono δ-lactone or Glucono delta-lactone (575)` | **PASS** |

All three remain in the rendered additives list (not removed/hidden by CORE-22 ranking). Evidence: `docs/uat/w5-ad02-core22-20261110/DEMOTED_VERIFY_RESULT.json` and `demoted_scroll_*.xml`.

Prior automated UAT script hang (`exit 4294967295`) documented as infrastructure/tooling only; not treated as a product defect.

## 6. iOS status

**Pending / not tested** — AU iOS TestFlight still required under dual-UAT convention.

## 7. Invariant verification

| Invariant | Status |
|---|---|
| Governed workbook / `catalogue_315.json` | Unchanged |
| Sibling S25 assets vs HEAD (LF-normalised) | Equal (false-dirty CRLF only) |
| Detection / merge / scoring / Signals | Unchanged |
| Evidence Authority / URLs / copy | Unchanged |
| BODY6 | Unchanged |
| Publication rules | Unchanged |
| `backend/vercel/**` | Excluded (still dirty locally; not staged) |
| Only intended runtime change | `DISCOVERY_DISPLAY_SEQUENCE` values |

## 8. Recommendation

**GO** for one local W5-AD-02 implementation checkpoint commit (explicit path staging only).

Still **HOLD** for push / merge / EAS / OTA / release.

**STOP after local commit.**
