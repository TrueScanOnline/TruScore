# FINAL — Contribution + Share E2E functional acceptance

**Date:** 2026-11-14 (UTC+13)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Branch:** `integration/w5-unified-mvp-20261113`  
**Source HEAD:** `67f9eddab8d3d098a13b5cac2fa7f122468ba9c4`  
**Runtime:** Expo Go (`host.exp.exponent`) + Metro `http://localhost:8081` (left running)  
**Device:** Android emulator `emulator-5554`  
**UAT Evidence Authority:** `https://truscoreapi-uat.vercel.app` (`authorityEnv=uat`)  
**Share host:** `https://truscoreapi.vercel.app`  
**Product under test:** Cadbury Dairy Milk `9300617064879` (UAT Antarctica origin fixtures — not commercial pack claims)

**Gates (Metro `env: load .env.development`):**  
`EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1`, `EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS=1`,  
`EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV=uat`, `EXPO_PUBLIC_BACKEND_URL=https://truscoreapi-uat.vercel.app`,  
`EXPO_PUBLIC_SHARE_WEB_ORIGIN=https://truscoreapi.vercel.app`

No APK / iOS / EAS / production deploy / schema migration / release tag.

---

## Acceptance table

| Acceptance requirement | PASS / FAIL / BLOCKED |
|---|---|
| Contribution entry points | PASS |
| Guided Capture and validation | PASS |
| Review and Confirm | PASS |
| Genuine UAT Evidence Authority admission | PASS |
| Product Result refresh after admission | PASS |
| Contribution error/duplicate handling | PASS |
| Community Agreements thumbs-up persistence | PASS |
| Community Agreements thumbs-down editing | PASS |
| Agreement revision reset and eligibility | PASS |
| Share Card correctness | PASS |
| Share Product Link creation | PASS |
| Actual share destination/link handling | PASS |
| Vercel known and unknown product safety | PASS |
| Supported in-app navigation and barcode integrity | PASS |
| Scoring/publication governance preserved | PASS |

---

## Source / environment identity

| Check | Evidence |
|---|---|
| Git HEAD | `67f9edd` on `integration/w5-unified-mvp-20261113` |
| Working tree | Local restore deltas present (gates, `.env.development` share origin, artwork) — uncommitted; not a new branch |
| Metro | Port 8081 listening; `env: export` includes UAT + contribution + share flags |
| Backend at runtime | Metro `BackendConfig` → `https://truscoreapi-uat.vercel.app` |
| EA health | `GET /api/evidence-authority` → `success=true`, `authorityEnv=uat` (`probe_ea_get.json`) |
| Credential | `POST issue-credential` → 201-class success with token (`probe_cred.json`) |

---

## Part A — User Contribution

### Entry points (PASS)

On settled Cadbury Result (`emu_14_settled*`, scroll set `emu_15_*`):

- **Information missing? / Add or correct information** → menu: Nutrition, Ingredients, Product origins, Claims & certifications (`emu_38_addmenu*`)
- **Product origins** → Add / Change product origins (`emu_39_origins*`)
- **Packet Claims / Add packet information** visible (`emu_15_hits.txt`)
- **Does this look right?** Community Agreement bar on Origins (`emu_57*`)
- Cadbury already carries admitted UAT Antarctica origins; empty “Add product origins” CTA is correctly absent when change/correct paths apply
- Nutrition / ingredients / packet_information CA GET: `eligible=false` — controls not offered for those groups on this card (`probe_ca_*.json`)

### Guided Capture + Review (PASS)

- Change product origins opened review list: Made in Antarctica / Product of Antarctica (`emu_40_guided*`)
- Edit Made in → Guided Capture with country Antarctica, qualifier More than, percentage field (`emu_41_edit*`)
- Cleared percentage showed empty placeholder `e.g. 96` (required-field UX) then set **80** (`emu_43_pct*`)
- Review statement preview: *“This product is made in Antarctica with more than 80% local and imported ingredients”* (`emu_53_submit.png`)
- Submit control: **Submit product origins**

### Genuine UAT admission (PASS)

- Success celebration (not a mere navigation):  
  **Thank you for keeping Rveel accurate!** / **Your contribution has been added.** (`emu_54_outcome*`)
- Runtime bound to UAT host throughout submit/reassess logs
- Not treated as proof from HTTP alone — Result and CA revision also changed (below)

### Result refresh (PASS)

After dismiss Keep exploring:

- Origins card shows **Made in Antarctica — With more than 80% local and imported ingredients** (`emu_55` / `emu_56*`)
- Prior Product of line retained (79%) — admitted Made-in correction visible

### Error / duplicate handling (PASS)

| Case | Result |
|---|---|
| Invalid barcode entry | Alert *Invalid Barcode* (`emu_03_wait*`) |
| Empty percentage | Field cleared to placeholder; no fabricated success |
| Cancel / Close | Modal closed without admit (`emu_48` → Result) |
| Self-agreement after own admit | UI: *You contributed this information, so you cannot agree with it.* (`emu_58_agree*`) |
| Duplicate agree (API) | Second POST same credential keeps `count=1` (`wp09_post2_dup.json`) |
| Stale revision (API) | POST → **409** (`wp09_post3_stale.json`) |
| Network airplane | NOT TESTED on device this pass (server reject/duplicate paths covered) |
| Double celebration | Single celebration shown for the admit |

### Community Agreements WP09 (PASS)

| Check | Evidence |
|---|---|
| Pre-admit origins GET | `eligible=true`, `count=0`, rev `680115d4…` (`probe_ca_origins.json`) |
| Post-admit revision reset | rev → `f95e6ec0…`, `count=0` (`probe_ca_origins_after.json`) |
| Thumbs-up persistence | Separate credential POST → `count=1`, `hasAgreed=true` (`wp09_post1.json`); GET after still `count=1` |
| No duplicate count | Second POST → still `count=1` |
| Stale rejected | 409 |
| Self-agree prohibited | Device UI message (above) |
| Thumbs-down | **Correct information** → Product Origins change workflow with Change/Remove (`emu_59_thumbsdown*`) |
| Ineligible groups | nutrition/ingredients/packet_information `eligible=false` |

### Governance preserved (PASS)

Post-admit reassessment log: **TruScore: 23/100** for `9300617064879` (same overall score; pillars Body 2 / Planet 8 / Claims 0 / Transparency 13). Contribution did not invent a new Rated pathway or alter publication methodology.

---

## Part B — User Share

### Share Card (PASS)

`emu_20_share*`: Dairy Milk Milk Chocolate; Rveel Score **23/100**; pillars; barcode **9300617064879**; host label `truscoreapi.vercel.app/barcode/9300617064879`.

### Share Product Link (PASS)

`emu_21_share2*`:  
`https://truscoreapi.vercel.app/barcode/9300617064879?ctx=…&src=copy&…`  
Exact barcode preserved. Actions: Share Product Link, Copy link, Share as image.

### Destinations (PASS with NOT TESTED channels)

| Channel | Result |
|---|---|
| Copy link | Exercised (`emu_22_copy*`) |
| Android Share Product Link sheet | Opened with full text + HTTPS URL (`emu_23_sharesheet*`) |
| Text message | Draft to 5556 contains Cadbury URL with `9300617064879` (`emu_26_sms_body*`) — draft only, not sent |
| Email | NOT TESTED (no Email target on sheet) |
| WhatsApp | NOT TESTED (not installed) |
| Image Share Card | Control present; full image handoff NOT TESTED |

### Vercel landing safety (PASS)

| Barcode | Title / behaviour | Score leak |
|---|---|---|
| `9300617064879` | `Dairy Milk Milk Chocolate · Rveel` | None (`landing_9300617064879.txt`) |
| `0000000000000` | `Shared product · Rveel` (unknown) | None |
| `0000000000017` | `Shared product · Rveel` (unknown) | None |

### In-app navigation / barcode integrity (PASS for Expo Go)

- History → Cadbury opens exact `9300617064879`
- Manual entry mistype `93006177064879` showed Unknown with that barcode (no silent Cadbury fallback)
- Invalid empty/partial entry blocked by Invalid Barcode alert
- **Apple Universal Links / Android verified App Links:** NOT claimed PASS under Expo Go (deferred to signed native builds)

---

## Corrections applied (smallest compliant)

1. **`EXPO_PUBLIC_SHARE_WEB_ORIGIN`** corrected to `https://truscoreapi.vercel.app` (was incorrectly on UAT host). Metro restarted so share links emit the temporary public destination. Contribution/EA remain on UAT.
2. Prior local restore kept contribution + Community Agreements gates entitled for UAT Expo Go (`mvpFeatureGates.ts` + `.env.development`). No governed scoring/admission architecture change.

No RED-zone scoring, publication, or Evidence Authority path redesign.

---

## Regression

```text
npx jest --testPathPattern="mvpFeatureGates|wp09CommunityAgreement|shareDelivery|publicShareIdentity|consumerSurfaceJourneys"
Test Suites: 5 passed, 5 total
Tests:       37 passed, 37 total
```

---

## Evidence index (primary)

| Artifact | Role |
|---|---|
| `emu_14_settled*` / `emu_38_addmenu*` | Result + entry menu |
| `emu_40_guided*` / `emu_41_edit*` / `emu_53_submit*` | Guided + review + submit |
| `emu_54_outcome*` | Admission celebration |
| `emu_55` / `emu_56*` | Post-admit 80% refresh |
| `emu_58_agree*` / `emu_59_thumbsdown*` | WP09 self-block + thumbs-down |
| `wp09_post1.json` / `wp09_post2_dup.json` / `wp09_post3_stale.json` | Server agree / dup / stale |
| `emu_20_share*` / `emu_21_share2*` / `emu_26_sms_body*` | Share card + link + SMS draft |
| `landing_*.txt` | Vercel known/unknown |
| `probe_ea_get.json` / `probe_cred.json` | UAT authority |

---

## Verdict

**FUNCTIONAL GO:** Both journeys passed the required end-to-end UAT tests. Ready for founder-approved Android/iOS native-build testing.

This is functional UAT closure on Expo Go + Metro against the UAT Evidence Authority and temporary Vercel share host. It is **not** production launch clearance. Platform-verified App / Universal Links remain for signed-build acceptance. Metro and Expo Go left available for founder inspection.
