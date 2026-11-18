# Founder directive — restore pre-containment contribution functionality (2026-11-18)

**Authority:** Explicit founder instruction (2026-11-18)  
**Baseline (pre-containment functional tip):** `567a8ab1915db96ecec4a7ff3bfff3a249163da8` (parent of containment; code ≡ `82ad946…` Claims consistency + prior guided journeys)  
**Containment implementation:** `956886b7eb60f87de75c82082f0e43ee8a4efbb9`  
**Public release:** remains **BLOCKED**

## Decision

Founder did **not** authorise wholesale removal of previously implemented, founder-approved contribution journeys via November 17 preselected-only containment. Restore those journeys using existing governed architecture. Do **not** reactivate historically retired / experimental / never-approved paths. Do **not** redesign.

## Policy reconciliation

| Restriction from `mvp_preselected_only_v1_20261117` | Classification | Action |
|---|---|---|
| Default-deny client policy (`!== '0'`) | Removed approved functionality | **Restored:** opt-in only (`=== '1'`); version stamp `…_20261118` |
| Default-deny server policy | Same | **Restored:** opt-in (`RVEEL_MVP_PRESELECTED_ONLY=== '1'`) |
| `.env.development` GUIDED=0 | Removed UAT/dev entitlement | **Restored:** GUIDED=1, PRESELECTED=0 |
| `uat-founders-*` EAS GUIDED=0 | Removed founder UAT entitlement | **Restored:** GUIDED=1, PRESELECTED=0 |
| Store/production GUIDED=0 | Pre-existing fail-closed | **Kept** |
| Hero / manual / guided UI gated on policy helpers | OK if policy inactive | **Kept** helpers; inactive policy re-enables UI |
| FM-03 photo entry removed from choice sheet | Removed approved path | **Restored** `result-packet-fm03-photo-absence` |
| `openContribution(…, 'packet_absence')` early return | Blocked FM-03 photo modal | **Removed** early return |
| EA / upload-photo / manual-products / manufacturing-country reject hooks | Safeguard when policy on | **Kept** dormant; inactive by default |
| FM-03R attestation path | Additive founder-approved (pre/during containment) | **Kept** |
| VLM abstain when policy active | Safeguard | **Kept** (inactive unless policy on) |
| Discovery free-text hard-false | Removed approved free-text | **Restored** when policy inactive |
| Jest setup PRESELECTED=1 / GUIDED=0 | Test-only containment | **Restored** GUIDED=1, PRESELECTED=0 |
| OFF public write kill-switch | Pre-existing / not this containment | **Not reactivated** |
| Server Claims-NR for FM-03R | Never implemented | **Still deferred** (not invented) |

## Restoration matrix

| Feature | Pre-containment | Under containment | Restored | Evidence |
|---|---|---|---|---|
| Guided PacketContributionModal (ingredients/nutrition/origins/packet) | Entitled when GUIDED=1 + authority | Blocked by default-deny + GUIDED=0 | Yes when GUIDED=1 and policy inactive | `mvpFeatureGates`, `.env.development`, Jest 176 PASS |
| Hero Take photo / gallery | Available | Hidden + server 403 | Yes (policy inactive) | `allowTakePhoto` / `isConsumerPhoto…` |
| Manual product entry + unknown-product OFF website CTA | Available | Hidden + help copy | Yes | `isConsumerManualProductContributionAllowed` |
| Information missing? menu Add/Change | Assessment-driven when guided on | Empty while guided off | Yes with GUIDED=1 | `productInformationMenu` |
| Packet Claims Add claim/cert (camera/gallery/type) | Choice sheet option | Hidden | Yes when guided on | `result-packet-add-claim-or-cert` |
| FM-03 photo absence | Discoverable + modal | Retired | Yes | `result-packet-fm03-photo-absence` |
| FM-03R attestation | Claims NR gates | Kept | Kept | unchanged eligibility |
| WP09 Agree | When COMMUNITY=1 | Kept | Kept | `.env` COMMUNITY=1 |
| WP09 Correct → guided Change | When guided on | Blocked while guided off | Yes with GUIDED=1 | gate coupling |
| `/api/upload-photo` consumer POST | Accepted (validated) | 403 policy | Accepts again when server policy inactive | server opt-in |
| `/api/manual-products` POST | Accepted | 403 | Accepts again when inactive | server opt-in |
| `/api/manufacturing-country` POST | Accepted | 403 | Accepts again when inactive | server opt-in |
| EA authorize/finalize image & manual-text | Auth + EA rules | 403 policy first | EA rules when inactive | `evidence-authority.ts` gate |
| Discovery free-text overlay | Asset free_text true | Hard false | Asset-driven when inactive | `discoveryFreeTextConsumerSubmissionAvailable` |
| Store release guided | OFF / assertMvpFeatureGatesReleaseSafe | OFF | **Still OFF** | `eas.json` production profiles |
| OFF live public write | Kill-switch OFF | OFF | **Not restored** (not approved / kill-switch) | standing OFF |
| Catalogue-only cert/country without free text | Deferred gap | Deferred | **Not invented** | deferred |
| Server FM-03R Claims-NR | N/A | Deferred | **Not implemented** | deferred |

## Not restored (and why)

1. **OFF public contribution network write** — kill-switch / not founder-approved for MVP reactivation.  
2. **Invented preselected catalogue-only Origins/cert paths** — never existed as approved standalone consumer journeys.  
3. **Server-side Claims-NR enforcement for FM-03R** — never shipped; remains deferred AMBER/RED.  
4. **Store/public GUIDED entitlement** — remains fail-closed until separate founder shipping approval.

## Invariants preserved

- NR / Checking fail-closed (no unpublished score paint).  
- Contribution invitations remain assessment / publication-settled driven.  
- Evidence Authority admission, provenance, withdrawal architecture unchanged.  
- Scoring methodologies and entity resolution untouched.  
- `publicReleaseStatus: BLOCKED` unchanged.

Restore does **not** modify scoring engines, publication projection, confidence calculation, evidence precedence, or withdrawal APIs. Wave 5 `governedOutcomeOracle.section10_2` suite remains the regression lock for NR/Checking/contribution-settlement.

## Environment / policy configuration proof

| Surface | `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION` | `EXPO_PUBLIC_MVP_PRESELECTED_ONLY` | `RVEEL_MVP_PRESELECTED_ONLY` (server) | Effective consumer result |
|---|---|---|---|---|
| **Missing / unset** | `app.config.js` forces **`0`** | Client treats as **inactive** (`=== '1'` only) | Server treats as **inactive** (`=== '1'` only) | Guided OFF; containment OFF |
| `.env.development` (Expo Go / Metro) | **`1`** | **`0`** | n/a (client) | Guided ON; containment OFF |
| Jest `src/__tests__/setup.ts` | defaults **`1`** if unset | defaults **`0`** if unset | n/a | Unit suites entitled like UAT |
| `eas.json` `uat-founders-android` / `uat-founders-ios` | **`1`** | **`0`** | n/a | Founder UAT builds entitled |
| `eas.json` `production`, `production-apk`, `preview`, `preview-apk`, `development`, `uat-dynamic-signals-*`, `uat-ios-flag-*` | **`0`** | **missing** (= inactive) | n/a | Store/UAT-signal builds: guided OFF; containment OFF |
| Vercel UAT host (`truscoreapi-uat`) | n/a | n/a | **unset** on deploy → inactive | Policy 403s cleared; normal 400/401 validators |

Explicit activation of containment requires founder-set `…_PRESELECTED_ONLY=1` on client and/or `RVEEL_MVP_PRESELECTED_ONLY=1` on server.

## Verification

| Check | Result |
|---|---|
| Targeted Jest (policy + wave5 + contribution menus) | **176 passed** (23 suites) |
| `tsc --noEmit` | **PASS** (exit 0) |
| UAT backend redeploy | **`dpl_CnW7TWKFNyyaVUfD43VnAR3y72yK`** aliased to `truscoreapi-uat.vercel.app` |
| Live probes post-restore | upload-photo / manual-products / manufacturing-country → **400** validation (not policy 403); EA authorize → **401** credential (not policy 403) |
| Android UI (partial) | Expo Go Result `9414732208565`: Score 60; **Add product origins** + Packet Claims empty-state visible (`artifacts/mvp-contribution-restore-20261118/`, untracked). Take photo N/A (image present). |
| Android E2E EA admission | See acceptance package below (device session). |
| iOS | See acceptance package below. |

## SHAs (reconcile after commit)

| Role | Value |
|---|---|
| Pre-containment baseline | `567a8ab1915db96ecec4a7ff3bfff3a249163da8` |
| Containment | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` |
| Docs tip before restore | `f99386d43cb502a26628a48cfc376999e3057cf0` |
| Restore implementation commit | `b752fdf567a9ff7e36e6b24f1d5e45d1bb35fd23` |
| Deployed UAT backend (restore) | `dpl_CnW7TWKFNyyaVUfD43VnAR3y72yK` |
| `publicReleaseStatus` | **BLOCKED** |

## STOP — independent acceptance

This package is engineering evidence only. Independent review must verdict against the restore commit SHA + UAT deployment `dpl_CnW7TWKF…` before any release interpretation.
