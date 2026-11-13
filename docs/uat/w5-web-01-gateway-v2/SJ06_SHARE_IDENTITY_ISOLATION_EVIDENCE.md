# SJ-06 — Asynchronous product identity isolation evidence

**Date:** 12 Nov 2026 (NZ)  
**HEAD:** `0ce99696bda120808298ce4cc223191865b821be` + **uncommitted** SJ-06 working tree  
**Classification:** **AMBER** (Result orchestration / product acceptance / deep-link routing)  
**Package:** `com.truescan.foodscanner` `10.0.0` / `37`  
**Test APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (`assembleDebug` **BUILD SUCCESSFUL** ~3m46s)  
**Metro:** not used (`MainApplication.getUseDeveloperSupport = false` — **local test harness only**)  
**Release control:** No commit / push / merge / production deploy / DNS / store without founder approval.

---

## 1. Exact underlying cause

1. **Cross-barcode / late-fetch overwrite:** `acceptProductUpdate` and `loadProduct` / `onProgress` / `finally` had **no load-generation token**. A late Product A completion could mutate Result after navigation to B (or after a newer same-barcode load A2).
2. **Empty / extra-path deep links:** React Navigation `barcode/:barcode` did not navigate for empty paths and did not trim extra segments, so the prior Result could remain (SJ-05 FAIL).

SJ-04/05 `setProduct(null)` on barcode change fixed offline contamination (E2) but was **insufficient for E4 races**.

---

## 2. Minimal correction diff (summary)

| File | Change |
|---|---|
| `src/utils/resultProductLoadGuard.ts` | **New** — generation bump, barcode match, accept gate, path normalizer, E4 decision helper |
| `app/result/[barcode].tsx` | Bump gen on barcode change / `loadProduct` / `handleRefresh`; guard fetch UI writes; `acceptProductUpdate` requires barcode match + optional `loadGeneration`; EA paths stay generation-agnostic with barcode check |
| `src/utils/linking.ts` | `normalizeBarcodeDeepLinkPath` + `getStateFromPath`; empty → Result with `barcode: ''`; extras → first segment; `parseBarcodeFromUrl` first-segment only |
| `src/__tests__/unit/utils/resultProductLoadGuard.test.ts` | **New** — deterministic E4-A…E4-E + path tests |

**Not changed:** scoring methodology, Evidence Authority stores, publication rules, brand resolution, Share URL origin, production `getUseDeveloperSupport` policy (harness remains local).

---

## 3. How stale responses are rejected

```text
productLoadGenerationRef bumps on barcode change, loadProduct start, handleRefresh start
captured loadGen checked before setLoadingPhase / setProduct / setError / finally setLoading(false)
acceptProductUpdate(next, { loadGeneration }) requires:
  productBarcodesMatch(route, next.barcode)
  AND activeGeneration === capturedGeneration (when loadGeneration provided)
EA admission / onSharedEvidenceAdmitted: NO loadGeneration — barcode + snapshot supersession only
```

---

## 4. Legitimate same-product updates still work

- E4-E unit: accept without `capturedGeneration` when barcodes match (**PASS**)
- Same-barcode current generation fetch accept (**PASS**)
- `shouldPreserveSettledResultOnLoadMiss` suite still **PASS**
- Result surface / wave5 contracts **PASS** (127 tests in targeted wave5+Result run)

---

## 5. Deterministic E4 test results

`npx jest src/__tests__/unit/utils/resultProductLoadGuard.test.ts` → **15/15 PASS**

| Case | Result |
|---|---|
| E4-A A→B, A completes last | **PASS** |
| E4-B A→B, A fails last | **PASS** |
| E4-C A→B→A, A1 late | **PASS** |
| E4-D offline prior product reject | **PASS** |
| E4-E same-barcode EA-style | **PASS** |

---

## 6. Android emulator results (standalone APK)

| Test | Result | Evidence |
|---|---|---|
| E2 offline after Cadbury → `9999999999999` | **PASS** (no Cadbury) | `SJ06_E2_*.png` — requested GTIN product / unrevealed, not Cadbury |
| E3 network recovery | **NOT RETESTED** this SJ (prior SJ-05 PASS; E2 showed non-Cadbury for 999…) | — |
| E4 A→B race (device) | **PASS** | `SJ06_E4_CLEAR.png` — **FERRERO, NUTELLA** behind modal after Cadbury→Nutella |
| E5 unknown `0000000000000` | **PASS** | `SJ06_E5_UNK` |
| E5 Cadbury again | **PASS** (Cadbury confidence modal) | `SJ06_E5_CAD*` |
| Empty `truescan://barcode/` | **PASS** | `SJ06_EMPTY.png` — Unknown Product, **no prior Cadbury** |
| Extra `…/3017620422003/extra/path` | **PASS** (navigates first segment) | Nutella limitations modal pattern |
| Malformed `NOT_A_BARCODE` | **PASS** | `SJ06_MALFORMED` — Unknown + barcode label |

**ANR note:** Cold/heavy emulator still shows SoLoader-class ANRs; Wait recovers. Not attributed to the generation guard. Disk free ~2.8 GB during build.

---

## 7. Invalid deep-link results

| URL | Behaviour |
|---|---|
| Empty | Navigate to Result `barcode: ''` → existing invalid/unknown UI; clears prior product |
| Extra segments | First segment only (existing digit contract on that token) |
| Malformed token | Existing Result invalid/unknown path |

No new GTIN checksum / canonicalisation rules.

---

## 8. Regression-test results

| Suite | Result |
|---|---|
| `resultProductLoadGuard.test.ts` | **PASS** |
| `resultPublicationLoadGuard.test.ts` | **PASS** |
| `shareDelivery.test.ts` | **PASS** |
| `wave4a5ResultSurface.contract` + `unit/wave5/**` (targeted) | **15 suites / 127 tests PASS** |

---

## 9. Remaining blockers / next gate

1. **Founder approval to commit** this AMBER package (not committed).  
2. **Revert or gate** `getUseDeveloperSupport=false` so it cannot ship as production default.  
3. **Android HTTPS App Links** on `truscoreapi.vercel.app` — smallest next action after SJ-06 acceptance:
   - Confirm debug SHA-256 `FA:C6:17:45:…:3B:9C` in a candidate `assetlinks.json`
   - Deploy association only with **separate founder approval**
   - Re-verify until state ≠ `1024`
4. **WEB-01A / UPCITEMDB** public identity hotfix — still **isolated P0**, not part of SJ-06.  
5. Physical share-channel delivery + iOS Universal Links — still open.

### Doctrine / invariants

- **AMBER:** `app/result/[barcode].tsx` orchestration (H-01, §6.2)
- Touches: product acceptance, cross-barcode state, async load orchestration, linking navigation prep
- Preserves: INV product identity string handling; publication latch; EA snapshot ordering; NR/Checking fail-closed paths unchanged in methodology

---

## Handover checklist

| # | Item | Mark |
|---|---|---|
| 1 | Cause identified | **PASS** |
| 2 | Minimal AMBER correction | **PASS** (local) |
| 3 | Stale rejection mechanism | **PASS** |
| 4 | Same-product EA path preserved | **PASS** (unit) |
| 5 | Deterministic E4 | **PASS** |
| 6 | Emulator isolation retest | **PASS** (E2/E4/E5/empty/malformed; E3 not retested) |
| 7 | Invalid deep links | **PASS** |
| 8 | Regression | **PASS** (targeted) |
| 9 | Remaining blockers | App Links / harness gate / WEB-01A / commit approval |

**SJ-06 ready for founder review. Do not start further Share architecture until approved.**

**STOP** — no commit, push, merge, or production action.
