# SJ-05 — Product identity isolation evidence (STOP)

**Date:** 12 Nov 2026 (NZ)  
**HEAD:** `0ce99696bda120808298ce4cc223191865b821be` (dirty tree — **not committed**)  
**Package:** `com.truescan.foodscanner` `10.0.0` / `37`  
**Test APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (assembled 15:02; ~243 MB)  
**Debug signing SHA-256:** `FA:C6:17:45:…:3B:9C`  
**Metro:** not used for PASS evidence (`getUseDeveloperSupport=false` local harness + embedded bundle)

**Governance:** No commit / push / merge / production deploy / DNS / store / `.well-known` promote. No website redesign. No scoring/publication/EA changes. AMBER Result patch tested only — not expanded without approval.

---

## Mandatory handover (PASS / FAIL / NOT TESTED)

| # | Item | Result |
|---|---|---|
| 1 | Existing barcode-clear patch reviewed + classified | **PASS (review)** — reclassified **AMBER** (was mis-tagged GREEN). See `SJ05_PHASE1_PATCH_REVIEW.md` |
| 2 | Offline contamination reproduced or eliminated | **Eliminated under test APK** for E2 (prior SJ-04 FAIL reproduced as fixed) |
| 3 | Post-fix E2 | **PASS** |
| 4 | E3 network recovery | **PASS** (Cadbury did not reappear; see note) |
| 5 | E4 async race | **FAIL / incomplete** — device race not conclusively isolated; late Cadbury activity observed while Nutella requested; UI stuck loading. AMBER guard proposed, **not implemented** |
| 6 | E5 sequential surfaces | **PASS** (Cadbury → Nutella → unknown → Cadbury) |
| 7 | Malformed / empty URL | **PARTIAL** — `NOT A CODE` **PASS**; empty `truescan://barcode/` left prior Cadbury (**FAIL**); extra path kept Cadbury (**FAIL / no-op**) |
| 8 | ANR diagnosis | See below — **not caused by Result clear patch**; Metro-dev-support + cold SoLoader / emulator load |
| 9 | Additional AMBER proposals | `SJ05_AMBER_PROPOSAL_ASYNC_RACE.md` — `acceptProductUpdate` must reject `next.barcode ≠ route barcode` |
| 10 | Android/iOS link readiness | **Unchanged / blocked** — domain state `1024`; iOS Team ID unset. Phase 6 **not started** (isolation not fully closed) |

**SJ-05 complete?** **NO** — E4 open; empty-URL soft fail; App Links not run.

---

## Phase 1 — Patch review (AMBER)

**File:** `app/result/[barcode].tsx` — `useEffect([barcode])` ~L639–647 (+9 lines)

```ts
setProduct(null);
setProgressiveProduct(null);
setTruScore(null);
setError(null);
setLoading(true);
setLoadingPhase('initializing');
```

| Criterion | Assessment |
|---|---|
| Clears product on barcode change | Yes |
| Prevents prior product during transition | Yes (loading gate) |
| Prevents late async A overwriting B | **No** |
| Resets loading/error | Yes |
| Same-barcode settled preserve | Unchanged |
| Clears EA / shared evidence stores | No |
| Publication / Rateability / Confidence semantics | Not altered |

**Doctrine:** §6.2 / H-01 — Result orchestration is AMBER. Mutating product acceptance / cross-barcode Result state is **AMBER**, not GREEN.

---

## Phase 2 — E2 (original failure)

1. Online Cadbury `9300617064879` → Result **PASS** (`SJ05_E2_CADBURY.png`)  
2. Offline → deep link `9999999999999`  
3. Immediate: loading, **no Cadbury** (`SJ05_E2_IMMEDIATE.png`)  
4. After miss: retrieval UI **“Oops. Awkward.”** + `Barcode: 9999999999999`, **no Cadbury name/image/score** (`SJ05_E2_AFTER.png`)

**E2 = PASS**

---

## E3 — Network recovery

Restore network; re-open `9999999999999`.  
UI showed **MARCATEST / Salatgurke** (backend/OFF identity for that GTIN), **not Cadbury** (`SJ05_E3_RECOVERY.xml` texts).  

**E3 contamination check = PASS.**  
Note: success path did not display the digit string; product is whatever the governed fetch returned for that barcode (not Cadbury).

---

## E4 — Async race

Rapid Cadbury then Nutella while first still loading.  
After 70s: still **Loading**; logs continued Cadbury `9300617064879` work (`SJ05_E4_FINAL.png`).  

**E4 = FAIL / NOT conclusively proven.** Reinforces need for AMBER `acceptProductUpdate` barcode match (proposal only).

---

## E5 — Sequential

| Step | Result | Evidence |
|---|---|---|
| Cadbury | PASS | `SJ05_E5_CADBURY` |
| Nutella | PASS | `SJ05_E5_NUTELLA` |
| Unknown `0000000000000` | PASS | `SJ05_E5_UNKNOWN` |
| Cadbury again | PASS | `SJ05_E5_CADBURY2` |

---

## Phase 4 — ANR

| Cause | Finding |
|---|---|
| Result clear patch | **Not implicated** — E2/E5 ran with patch |
| `BuildConfig.DEBUG` → Metro | **Primary SJ-05 blocker** — installed rebuild with developer support hung on `:8081` WebSocket while Metro was down |
| Cold SoLoader / New Arch | Emulator startup ANRs; “Wait” then proceeds (same class as SJ-04) |
| Emulator / disk | Host free space ~4 GB during rebuild; large APK (~243 MB) slows cold start |

**Local harness (not production):** `MainApplication.kt` `getUseDeveloperSupport(): Boolean = false` so embedded JS is used without Metro.

---

## Phase 5 — Input safety

| URL | Result |
|---|---|
| `truescan://barcode/` (empty) | **FAIL** — Cadbury remained (`SJ05_P5_EMPTY`) |
| `truescan://barcode/NOT%20A%20CODE` | **PASS** — Unknown + `Barcode: NOT A CODE` |
| `…/9300617064879/extra/path` | **FAIL / no-op** — Cadbury remained |
| Valid Cadbury / unknown zeros | Covered under E2/E5 |

No new UI validation rules added.

---

## Phase 6 — Share gates

**NOT STARTED** — blocked until E4 closed and founder AMBER approval for race guard.

- Android App Links: still `1024`  
- iOS Universal Links: **NOT TESTED**  
- Share channels: **NOT TESTED**  
- WEB-01A: remains isolated, undeployed  

---

## Proposed AMBER (approval required — not implemented)

`acceptProductUpdate`: reject when `getPrimaryBarcode(next.barcode) !== getPrimaryBarcode(barcode)`  
Details: `SJ05_AMBER_PROPOSAL_ASYNC_RACE.md`

---

## STOP

Awaiting founder / ChatGPT review. No commit, push, merge, or production action.
