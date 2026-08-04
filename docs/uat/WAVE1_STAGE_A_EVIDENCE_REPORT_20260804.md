# Wave 1 Stage A — Evidence Report (Skeleton UAT gate)

**Date:** 4 August 2026  
**Authority:** Founder authorisation to commence Wave 1 **Stage A only** (response to Cursor execution acceptance)  
**Controlling scope:** FINAL MVP Scope v0.5  
**Disposition:** Founder Disposition Record of Claude W0–W11 review (4 Aug 2026)  
**UAT procedure:** On-Device UAT Execution Pack v0.1 + `docs/uat/ON_DEVICE_UAT_BUILD_HANDOFF_20260731.md` + `docs/uat/FOUNDER_PARTNER_UAT_QUICK_CARD_20260731.md`  
**Workstream C assets:** `workstreamC/c-data/v0.4/` (governed Skeleton pack)  
**Code baseline for UAT binaries:** `0e91226` / tag `v10.18.0-handoff-phase6-workstreamC-2026-07-30`  
**F1 note:** Ethics cert fix `c005f83` is accepted for ordinary integrated regression; **not** required inside Stage A Skeleton binaries (those remain on `0e91226`).

**Stage A scope (what this report covers):** build-flag determination; rebuild necessity; confirmed pre-physical test matrix; Document 6 fixture coverage map; material blockers; recommended **bounded** Stage B tasks.

**Explicitly out of Stage A (not done):** public `governed_5b_only` default change; Signal Alert Commentary implementation; full Doc 6 fixture catalogue expansion; founder/admin lifecycle tooling; inference of D2 / commentary / lifecycle product rules.

---

## 1. Executive determination

| Question | Determination |
|----------|----------------|
| Does TestFlight **build 26** contain `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1`? | **No — cannot positively confirm; treat as absent / not enabled** |
| Is a **new** controlled UAT rebuild required? | **No** — existing **build 28** already baked flag=`1` |
| Recommended binary for renewed Skeleton Signal UAT (D02–D08) | **iOS TestFlight build 28** (`uat-ios-flag-on`) |
| Flag-off control (D01 / D06 baseline) | **iOS TestFlight build 27** (`uat-ios-flag-off`) |
| Physical on-device UAT results | **Pending founder/partner execution** using the confirmed matrix in §3 (Cursor cannot operate physical devices) |
| Repo prevalidation of retail register (flag-on runtime) | **PASS** (`PREVALIDATION_OK`) on 4 Aug 2026 — see §3.3 |

---

## 2. Build-flag determination (EAS history)

### 2.1 TestFlight build 26

| Field | Evidence |
|-------|----------|
| EAS build ID | `e2c932ad-be8d-4865-83de-713ea4ed4887` |
| App version / build number | `10.0.0` / **26** |
| Profile | **`production`** |
| Git commit | `0e91226ca762f4bda23c75074df10ada500c8570` |
| Created | 2 May 2026 |
| Logs | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/e2c932ad-be8d-4865-83de-713ea4ed4887 |

**Flag analysis:**

1. At commit `0e91226`, `eas.json` **production** profile had **no** `env.EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` entry (UAT profiles did not yet exist in that file revision).  
2. Current `eas.json` still has **no** Skeleton env on `production` — only on `uat-ios-flag-on` / `uat-ios-flag-off`.  
3. `app.config.js` at build 26 did not inject the Skeleton flag into `extra` as a hardcoded `1`.  
4. Therefore build 26 **cannot be positively confirmed** as flag-on. For Stage A Signal pass/fail, treat Skeleton runtime publication as **not enabled** on build 26.

### 2.2 Existing controlled flag-on / flag-off builds (already produced)

| Build | EAS ID | Profile | Env (profile) | Commit | Status |
|-------|--------|---------|---------------|--------|--------|
| **28** (flag-on) | `172dbfc7-6405-4260-a54f-56da2fb57428` | `uat-ios-flag-on` | **`EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1`** | `0e91226` | finished (31 Jul 2026) |
| **27** (flag-off) | `2c05fdf1-1cdf-4ea7-a393-ea6f48369d14` | `uat-ios-flag-off` | `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=0` | `0e91226` | finished (31 Jul 2026) |

**Rebuild decision:** Under “do not rebuild merely for convenience,” a **new** EAS build is **not** required. Stage A uses the **already-finished** minimum controlled flag-on binary (**28**).

**Founder action before physical testing:** In TestFlight, confirm install shows **build 28** (flag-on cases) / **27** (flag-off). If 27/28 are not yet visible in ASC/TestFlight, run submit only (no rebuild):

```powershell
eas submit --platform ios --id 172dbfc7-6405-4260-a54f-56da2fb57428 --profile uat-ios-flag-on
eas submit --platform ios --id 2c05fdf1-1cdf-4ea7-a393-ea6f48369d14 --profile uat-ios-flag-off
```

### 2.3 Configuration note (unchanged for Stage A)

| Setting | Stage A binary behaviour |
|---------|---------------------------|
| Skeleton UAT flag | Build-time only (`=== '1'` on build 28) |
| `phase6SignalSourceMode` | Remains app default **`transitional`** (Stage A does **not** change public default) |
| Marketing version | `10.0.0` |

---

## 3. Confirmed pre-physical UAT matrix

**Sources of truth:** Execution Pack + Build Handoff + Quick Card.  
**Invocation:** Camera-scan retail GTIN preferred; manual entry of the **same** GTIN allowed (esp. NZ D02). Synthetic lab barcodes **not** authorised for Signal pass/fail.

### 3.1 Cases (flag-on build **28**)

| Case | Product | GTIN | Market | Expected identity (gate) | Expected Signals | Fail classification notes |
|------|---------|------|--------|--------------------------|------------------|---------------------------|
| **D02** | Countdown Mixed vegetable 1 kg | `9400597008686` | **NZ** | `B0004` / `P0001` | `SIG_NEWS_NZ_001` once | Wrong identity → product-data, not Skeleton fail |
| **D03** | Cadbury Dairy Milk 180 g | `9300617064879` | **AU** | `B0241` / `P0009` | `SIG_NEWS_GLOBAL_001` **and** `SIG_NEWS_GLOBAL_002` | Must be two distinct cards |
| **D04** | RITZ Original 227 g | `9310034002415` | **AU** | `B0069` / `P0009` (no Cadbury bridge) | **None** of the two globals | Over-fire on Mondelēz parent alone = fail |
| **D08** | MILO Dipped Snack Bars White Choc | `9300605100114` | **AU** | Prefer `B0061` (Milo) for `SIG_REG_AU_001` | `SIG_REG_AU_001` when identity OK | Nestlé-only brand → may miss Signal → **product-identity / OFF variation**, not automatic Skeleton fail |
| **Ordering** | D08 then D03 (or multi-Signal) | — | AU | — | Safety & Regulatory before In the News when both eligible | Record order on evidence sheet |

### 3.2 Control cases (flag-off build **27**)

| Case | Expectation |
|------|-------------|
| **D01** | Same retail GTINs as above → **no** Workstream C Skeleton Signal cards |
| **D06** | Pillar / TruScore values for the same GTIN identical on 27 vs 28 (Skeleton flag must not change scoring) |

### 3.3 Repo prevalidation (4 Aug 2026)

Command: `npx ts-node --project scripts/tsconfig.json scripts/prevalidate-uat-retail-register.ts` with Skeleton path enabled in script environment.

| Case | Pass | Observed Signal IDs | Chain (excerpt) |
|------|------|---------------------|-----------------|
| D02 | yes | `SIG_NEWS_NZ_001` | `B0004` / `P0001` |
| D03 | yes | `SIG_NEWS_GLOBAL_001`, `SIG_NEWS_GLOBAL_002` | `B0241` / `P0009` |
| D04 | yes | _(none)_ | `B0069` / `P0009` |
| D08 | yes | `SIG_REG_AU_001` | `B0061` / `P0008` |
| **Overall** | **PREVALIDATION_OK** | | |

This is **not** a substitute for physical TestFlight evidence. It confirms governed Workstream C v0.4 assets + identity resolution still align with the register **before** device testing.

### 3.4 Physical UAT results (Stage A)

| Item | Status |
|------|--------|
| Device screenshots / Console `WorkstreamC` logs | **Not collected in this Cursor session** (requires physical devices) |
| Identity-chain pass/fail on device | **Pending** founder/partner run against §3.1–3.2 |
| Sign-off | Execution Pack sign-off page — founders |

**Evidence folder recommendation:** Follow Execution Pack §8; name folder e.g. `UAT_Wave1_StageA_YYYYMMDD` with per-case screenshots + build number visible.

---

## 4. Document 6 fixture coverage map

**Normative Doc 6 filename (external):**  
`Rveel_Chaining_and_Signals_Golden_Fixtures_UAT_and_Release_Comparison_Gates_Document_6_20260424_v0.3.docx`  
*(Not present on this workstation Desktop at Stage A time; mapping uses Doc 6 IDs as cited in `docs/phase6/phase6-chaining-signals-execution-pack.md` + Claude review catalogue.)*

**In-repo automated pack:** `src/__tests__/fixtures/phase6/fixtures.ts`  
**Harness:** `npm run test:phase6:gate:public` → **PASS** on 4 Aug 2026 (6/6 fixtures; gates A–E true in `reports/phase6/fixture_run_summary.json`).

### 4.1 Named Doc 6 catalogue vs current automation

Coverage classes: **Covered** · **Partial** · **Missing** · **N/A under current authority**

| Doc 6 ID (named) | Intent (from execution pack / Slice notes) | Coverage | In-repo evidence / notes |
|------------------|--------------------------------------------|----------|---------------------------|
| **ID-01** | Identity happy-path / stability | **Partial** | Unit: `resolveSharedIdentityContext` tests; no Doc-6-ID-named fixture. Pack has `p0-identity-au-nz-public-no-leak` (market contract, not full ID-01 narrative). |
| **ID-02** | Identity market / AU-NZ contract | **Covered** (equivalent) | `p0-identity-au-nz-public-no-leak` — internal `AU+NZ` must not leak as public market |
| **ID-03** | Ambiguous collision | **Partial** | Workstream C unit: ambiguous Cadbury biscuit (no bridge); identity unit soft-ambiguity — **not** a Doc-6-named golden fixture |
| **ID-04** | Own-label | **Partial** | Runtime/UAT D02 Countdown own-label path; **no** dedicated Doc-6 golden ID-04 fixture |
| **ID-05** | Post-freeze alias | **Missing** | No dedicated Doc-6-ID fixture in phase6 pack |
| **FB-01…FB-04** | Frozen benchmark materialisation / eligibility family | **Partial** | `p0-frozen-eligibility-gate-b` + `ethicsBenchmarkAdapter` / materialize unit tests — **not** 1:1 FB-01…04 IDs |
| **FB-05** | Freeze / supersede immutability | **Partial** | `freezeGuards` unit tests (`in_place_blocked`); not named FB-05 in golden pack |
| **FB-06** | Frozen ineligibility → no Ethics movement | **Partial** | Same eligibility gate fixture + adapter tests |
| **DS-01…DS-03** | Dynamic publication / class gates (P0-ish) | **Partial** | `p0-dynamic-blocked-never-public`; slice6 builder tests for held/suppressed/expired |
| **DS-04…DS-08** | Broader DS catalogue (staleness, editorial, mislink, etc.) | **Missing / Partial** | FSM unit tests exist (`publicationStateEngine`); **not** expanded into Doc-6-named golden set |
| **XL-01** | Cross-layer freeze vs dynamic non-corruption | **Partial** | Freeze guards + property-style intent in Slice 4 notes; no XL-01 golden id |
| **XL-02** | Blocked / needs_review never publishable | **Partial** | Covered in publication engine unit tests + blocked fixture |
| **XL-03** | No parallel public Signals bypass / sunset legacy | **Partial** | `p0-release-mode-disables-legacy-feeders` (**governed mode**); live app default remains **transitional** (Stage A must not change) |
| *(pack-only)* `p0-publication-order-deterministic` | Ordering / Gate D | **Covered** (pack) | Deterministic signal order |
| *(pack-only)* `p1-transitional-mode-allows-legacy-feeders` | Transitional seam | **Covered** (pack) | Documents bounded transitional behaviour |

### 4.2 Summary counts (Doc 6 named IDs ~23)

| Class | Approx. count | Comment |
|-------|---------------|---------|
| Covered (strong equivalent in golden pack) | ~2–3 | e.g. AU+NZ leak, blocked never public, release-mode feeder exclusion |
| Partial (unit/runtime proof, wrong ID or incomplete) | Majority of ID/FB/DS/XL | Real engineering proof exists; **audit traceability to Doc 6 names is weak** (Claude F10) |
| Missing as named golden fixtures | Several DS-04…08, ID-05, full FB matrix | Do **not** expand catalogue in Stage A |
| N/A under current authority | My Choices–only DS cases if Doc 6 requires live My Choices | **Post-MVP** / out of bounded Skeleton UAT — do not treat absence as Stage A defect |

### 4.3 Stage A interpretation

- Automated **P0 pack that exists today passes** public_release gate.  
- That pack is **narrower** than Doc 6’s named catalogue and uses **different fixture IDs** — accurate characterisation for founders, matching Claude F10.  
- **Stage A does not expand** the catalogue; Stage B may include a **mapping/expansion plan**, not silent claim of full Doc 6 compliance.

---

## 5. Material blockers / defects (Stage A)

| ID | Severity for Stage A | Detail | Action |
|----|----------------------|--------|--------|
| B1 | **Process / binary** | Build 26 unsuitable for Skeleton Signal UAT | Use **build 28**; do not fail Signals on build 26 |
| B2 | **ASC visibility** | Builds 27/28 finished on EAS; TestFlight presence must be confirmed by founders | Submit only if missing; **no rebuild** |
| B3 | **Physical evidence gap** | On-device results not yet filed | Founders run §3 matrix; attach evidence |
| B4 | **Doc 6 name gap** | Known evidence/UAT gap (F10) — not a Stage A coding defect | Bounded Stage B planning only |
| B5 | **D08 identity sensitivity** | OFF brand string may still drift Nestlé vs Milo on device | Identity gate + classify variation per handoff |
| — | None observed as P0 | Prevalidation + phase6 public gate green | Continue Stage A physical UAT |

**No Stage A code defect** requiring hotfix was found in the flag/build/prevalidation path.

---

## 6. Recommended bounded Stage B implementation tasks

*(Recommendations only — **not authorised** by this Stage A report. Await founder go-ahead and any ChatGPT-supplied commentary / lifecycle materials.)*

| # | Task | Why bounded | Depends on |
|---|------|-------------|------------|
| B-1 | After Stage A physical UAT sign-off: wire **public** builds to `phase6SignalSourceMode=governed_5b_only` (profile-gated; keep transitional for controlled UAT only) | Disposition F3/D3 | Stage A UAT evidence; founder auth |
| B-2 | Implement Signal Alert Commentary **only after** founder/ChatGPT rules/catalogue arrive | Disposition F5/D5 — do not infer | Commentary materials |
| B-3 | Produce Doc 6 **traceability matrix** + prioritised missing **P0** fixture additions (named IDs) — implement subset only when authorised | F10 evidence gap | Stage A map (§4); no full-catalogue big-bang |
| B-4 | Capture minimum Signal lifecycle **operating process** when founders provide it; tooling later | F7 — process before platform | Founder process note |
| B-5 | Include F1 (`c005f83`) in next ordinary integrated regression/build evidence when the next non-Skeleton release binary is cut | Already accepted | Ordinary release process |

**Still forbidden until separately authorised:** changing public default now; building #10 from inferred copy; expanding full fixture set in this gate; admin lifecycle product build.

---

## 7. Stage A exit checklist

| Check | Status |
|-------|--------|
| Build 26 flag determined | **Done — absent / not flag-on** |
| Rebuild required? | **No** (use existing build 28) |
| Exact build / config / GTIN / expected results confirmed before physical testing | **Done (§2–§3)** |
| Physical UAT executed + evidence filed | **Pending founders** |
| Identity-chain device pass/fail | **Pending founders** |
| Fixture coverage gaps mapped | **Done (§4)** |
| Material blockers listed | **Done (§5)** |
| Bounded Stage B recommendations | **Done (§6)** |

---

## 8. Ask of founders (to close Stage A)

1. Confirm TestFlight shows **build 28** (and **27** for controls); submit existing IPAs if not.  
2. Execute D01–D08 per §3; store screenshots + build numbers.  
3. Return pass/fail + identity notes (especially D08) so Stage A can be marked **complete** and Stage B authorised selectively.

---

*End of Wave 1 Stage A evidence report. No public runtime default change, Signal Alert Commentary, full fixture expansion, or admin lifecycle tooling was implemented in this gate.*
