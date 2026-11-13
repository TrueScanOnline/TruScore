# Final Unified App Acceptance Results

**Directive SHA named:** `52e2cacdd7ca214030af109036b6505cd263f159`  
**Final integration SHA (tip):** `2416c0fd4308c074e7f1e4fa4ce02e8799ced132`  
**Branch:** `integration/w5-unified-mvp-20261113` (tracks `origin/integration/w5-unified-mvp-20261113`)  
**Date:** 2026-11-13

## Five checks

| # | Check | Result |
|---|---|---|
| 1 | Git integrity | **PASS** |
| 2 | Product Display UI | **PASS** |
| 3 | Contribution functionality | **BLOCKED** |
| 4 | Share functionality | **PASS** |
| 5 | Final regression and build | **PASS** |

### 1. Git integrity — PASS
- `c3f7577` is an ancestor of tip.
- `08ed964` is **not** an ancestor (wrong-branch rewrite) but Share/WEB-01A core sources are **content-equivalent**.
- Wrong-branch `a8e77e7` is **not** an ancestor.
- CD cores (`ProductOriginsDeclarationPanel`, `ResultCardArt`, `CommunityAgreementBar`) match `c3f7577`.
- Intentional only: `__DEV__` celebration preview in `linking.ts`; publicWebShare contract alignment; acceptance hygiene fixes after `52e2cac`.

### 2. Product Display UI — PASS
Android screenshots (this run):
- `F1_HERO_SCORE.png` — Hero Cadbury, Score 23 Poor, four pillars, folded corners, Limited confidence
- `F2_HIGHLIGHTS_NUTRITION.png` — Score Highlights (“What we noticed”), Add/correct CTA, Nutrition card art
- `F13_PRODUCT_ORIGINS.png` — Product Origins + Packet Claims + additives artwork
- `F14_CHECKING_STATE.png` — Checking/settling presentation (no leaked rated number while unsettled)
- `F5_SHARE.png` — Share Card with score + pillars

### 3. Contribution functionality — BLOCKED
- **Code integrated:** contribution delight, Add/correct information, Add Product Information (unknown), Origins add CTA, Community Agreement bar/components + wp09 unit tests.
- **E2E admit journey (Missing → Capture → Review → Confirm → Success):** **not completed** this run against a live admitting authority session.
- **Community Agreements operational:** **BLOCKED** until `db/migrations/20261107_wp09_community_agreements.sql` is applied (API returns schema unavailable without it).  
  → Distinguish: **code integrated ≠ feature operational**.

### 4. Share functionality — PASS
- Share Card + Share Product Link UI: `F5_SHARE.png`, `F6_ORIGINS_CLAIMS.png` (link `https://truscoreapi.vercel.app/barcode/9300617064879?...`)
- Exact-barcode App Link / landing: Cadbury identity on device + `SHARE_CADBURY.html`
- WEB-01A zeros `0000000000017`: unknown/neutral, **no** Cadbury/Nutella (`F9_UNKNOWN_ZEROS.png`, `WEB01A_ZEROS.html`); `score_leak=0`
- SJ-06 / load-guard unit suite PASS

### 5. Final regression and build — PASS
- Combined suites: **185/185 PASS** (`REGRESSION_FINAL.log`)
- Android debug APK rebuilt from tip: `BUILD SUCCESSFUL` (`ANDROID_BUILD.log`)  
  Path: `android/app/build/outputs/apk/debug/app-debug.apk` (x86_64 debug; temp signing retained)
- Tip already pushed to origin; working tree cleaned after accepting these evidence docs.

## Incomplete / backend dependencies
1. Community Agreements DB migration (founder approval required).
2. Full live contribution admit E2E in isolated UAT authority environment.
3. Temp debug App Links signing — not production-ready.

## Push / RC tagging readiness
| Action | Status |
|---|---|
| Branch ready for push | **YES — already on origin** at tip `81ba635` (+ any follow-up evidence commit) |
| Ready for release-candidate tagging | **YES** (acceptance criteria for unified baseline met; tag not created in this run) |
| Vercel prod / main merge / store publish | **NOT done** (forbidden) |

Wave 5 scoring/publication invariants preserved (fail-closed Checking, web teaser veil, WEB-01A OFF-only match, no unpublished score leak on landing).
