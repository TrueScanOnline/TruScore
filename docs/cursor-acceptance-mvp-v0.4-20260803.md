# Cursor acceptance of MVP Launch Plan v0.4 — 3 August 2026

**Document type:** Cursor formal response to founders/ChatGPT  
**Responds to:** `Rveel_Response_to_Cursor_and_v0_4_Submission_20260803.docx`  
**Scope plan:** `Rveel_MVP_Launch_Plan_and_Scope_Baseline_20260803_v0_4.docx`  
**Code baseline for as-built work:** `0e91226` / tag `v10.18.0-handoff-phase6-workstreamC-2026-07-30` (unless founders later freeze a newer commit)  
**Authority:** Alignment, as-built demonstration, sizing and sequencing only. **No** inference of detailed product rules; **no** broad new implementation until follow-on specs / founder decisions.

---

## 1. Acceptance

**Accepted**, with the qualifications below.

Cursor accepts **v0.4 as the controlling MVP launch scope baseline** for all Cursor work. Cursor will:

- use the **layered Chaining & Signals** status language in all future reporting;
- not treat code presence as product acceptance;
- not infer Confidence, Community Verification, Product Origins, Admin, or Monitoring detailed rules where §12 lists a follow-on specification;
- not begin broad new implementation merely because an item is MVP Required.

### Qualifications (not rejections)

| # | Qualification |
|---|---------------|
| Q1 | As-built demonstrations and effort sizing are the **next Cursor deliverables**; they are not yet complete in this acceptance note. |
| Q2 | Paywall **feature gating** is already largely off (`ENABLE_PREMIUM_GATING = false`), but unfinished **upgrade/subscription UI surfaces still exist** and must be explicitly hidden/disabled under a founder-approved task — Cursor confirms this is feasible without destabilising core scan/result journeys. |
| Q3 | Parallel iOS/Android is accepted; platform-specific store/privacy/release work remains a real effort line and will be sized in the readiness view, not deferred indefinitely. |
| Q4 | Allergens & Dietary Needs removed from MVP is accepted; Cursor will treat related premium-feature labels/UI as deferred/isolation candidates in the paywall-park pass. |

---

## 2. Chaining & Signals status language — confirmed

Cursor will use this layered wording going forward:

| Layer | Status Cursor will report |
|-------|---------------------------|
| Architecture / Docs 1–6 | Established |
| Core engine + app integration | Substantially implemented and automatically tested |
| Workstream C Skeleton | Completed as controlled proof/UAT implementation (not full AU/NZ corpus) |
| Founder/partner on-device UAT | Not evidenced — repeat controlled testing |
| AU/NZ source coverage & reviewed content | MVP work outstanding |
| Founder ops (approve/withdraw/expire/suppress) | MVP work outstanding |
| Production persistence / governed runtime | Requires confirmation/hardening |
| Full MVP Signals capability | **Not launch-ready** |

**Current-code facts that support (do not contradict) this wording:**

- Phase 6 engine, Workstream A/B scaffolding, Workstream C runtime pack, and `ProductScanResult.signals` integration exist at `0e91226`.
- Skeleton publication is gated by build-time `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1'`.
- Runtime uses real product fetch + identity resolution; no production `injectedChain` / UAT-only barcode map on the scan path.
- Cadbury B0067→B0241 bridge is Skeleton-UAT-only helper, not production architecture.
- Default `phase6SignalSourceMode` remains **`transitional`** — production hardening still required before certification.
- No dedicated founder admin API/UI for Signal approve/withdraw/suppress was found under `backend/vercel` in a quick inventory (admin remains **Not assessed** / demonstrate-first).

**No material contradiction** with v0.4’s layered statement was found.

---

## 3. Material current-code facts vs v0.4 (honesty check)

None of these invalidate acceptance; they bound sizing and avoid false “already done” claims.

| Area | Current-code fact | v0.4 implication |
|------|-------------------|------------------|
| Admin | No clear admin pages/endpoints for contribution moderation, Signal lifecycle, or emergency suppress in the assessed backend surface | Demonstrate-first is correct; minimum solution still founder-approved after inventory |
| Community verification | Manufacturing-country path has local/backend submission with `verified` / `disputed` / threshold concepts; not a complete cross-field 1+ongoing confirmation model for all contribution types | Partially built — matches v0.4; needs Community Verification Spec before expansion |
| Confidence | Numeric confidence labels exist in scan-result assembly; Body also uses **12/25 as a red-additive score ceiling** (different concept from “default mid-score”) | Existing confidence build **not accepted**; dedicated Confidence Spec required; demo must separate score ceilings from confidence disclosure |
| Monitoring | Sentry wrapper exists (`errorReporting.ts`); DSN optional; no productised privacy-disclosed usage analytics suite | Matches “crash + lean use view” principle; tooling not chosen |
| Paywall | `ENABLE_PREMIUM_GATING = false`, but search paywall teaser / profile upgrade / subscription screens still present | Park/hide UI is required and feasible |
| Allergens | Still present in product/UI/data paths historically | Out of MVP; isolate from launch UX, do not expand |
| Origins | Country of Manufacture card + contribution/override path; not multi-claim structured Origins | Partially built; no structural coding until Product Origins Spec |

---

## 4. Proposed as-built walkthrough plan (14 modules + ops)

**Format:** one short session note per module (or grouped session): plain-language data flow → screen/example → code entry points → tests → known gaps. Evidence: screenshots or TestFlight/APK walkthrough, log excerpts where useful, file paths, and “what is / is not founder-approved.”

### Suggested sequence (founder-readable)

| Step | Modules / topic | Evidence Cursor will show |
|------|-----------------|---------------------------|
| **W0** | End-to-end journey map | Scan → result → explore → share/contribute on iOS + Android (or recorded); empty/error/missing-product paths |
| **W1** | #12 Identity & data merge | OFF + FSANZ/other merge path; `truScoreOptimizedDatabase` / product merger; fail-closed identity notes |
| **W2** | #1–5 Body, Planet, Ethics, Open, Overall | Spec mapping sketch; representative AU/NZ barcodes; pillar unit tests; where defaults/fallbacks appear |
| **W3** | #8 Confidence | Current confidence fields/UI; contrast with Body 12/25 ceiling; what consumer sees on thin data |
| **W4** | #9 Score Highlights | `scoreHighlightDefinitions` / presentation; example cards |
| **W5** | #6 Product Origins (CoM as-built only) | CountryCard + manufacturingCountryService; verify/dispute behaviour today |
| **W6** | #7 + #10 Chaining & Signals + Signal commentary | Layered status; Skeleton flag; example Signal cards when flag on; commentary/source wording |
| **W7** | #13 Contributions & verification | Manual/photo/OFF submission paths; CoM verification threshold; what does **not** yet exist |
| **W8** | #11 Sharing | Share card generation, deep links, what confidence/source text survives |
| **W9** | #14 Scan-result assembly | `buildProductScanResult` → presentation → `app/result/[barcode].tsx` |
| **W10** | Admin / support inventory | Any scripts, DB tables, Vercel routes, or manual ops used today (expect thin) |
| **W11** | Monitoring | Sentry wiring vs DSN; share-event telemetry; what founders can see today |
| **W12** | Parallel release | EAS profiles, TestFlight build 26 baseline, Android APK path, known platform risks |

**Skeleton UAT renewal route (practical, not full Signals certification):**

1. Confirm whether TestFlight build 26 was baked with `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1` (EAS secret/history).  
2. If flag-on: use real retail GTINs only (camera or same GTIN manual entry); identity gate before pass/fail.  
3. If flag-off or unknown: founders expressly request a **controlled rebuild** with flag=1 (and optional flag=0 control) — Cursor will not self-authorise that build.  
4. Do **not** treat Skeleton pass as MVP Signals operating capability.

---

## 5. Specification dependencies (no inference)

| Follow-on (v0.4 §12) | Cursor will wait for this before implementing detailed behaviour |
|----------------------|-------------------------------------------------------------------|
| Confidence and Evidence Specification | Yes |
| Community Verification Specification | Yes |
| Product Origins Specification | Yes |
| Minimum Founder/Admin Requirements | After Cursor as-built admin inventory |
| Monitoring and Analytics Minimum | After as-built + Claude privacy pass |
| Critical Output Integrity Review Plans | As modules are demonstrated |
| UI and Content Acceptance Plan | Before large UI polish programmes |

Routine work already governed by **approved** scoring / Docs 1–6 may continue only under existing founder/Cursor process; anything that invents new outcomes returns through the one-loop rule.

---

## 6. Sizing / sequencing decisions still needing founder input

These are **not** scope rejections — they unlock a founder-readable effort view after W0–W12:

1. **Order of Critical Output demos** — accept Cursor sequence above, or reprioritise (e.g. Confidence/Origins before pillars).  
2. **Admin shape preference** after inventory — lightweight secure web ops vs DB/script ops vs in-app founder mode (founders choose after demo).  
3. **Monitoring minimum** — crash-only for first public beta vs crash + lean funnel events (provider still TBD).  
4. **When to authorise paywall UI park task** — Cursor recommends early (small, safe, reduces confusion during UAT).  
5. **Skeleton UAT rebuild** — only if build 26 flag state cannot support renewed Signal-card tests.  
6. **UI polish intensity** — after UI Acceptance Plan: MVP-bar vs closer-to-prototype (affects sequencing heavily).

---

## 7. Proposed Claude-targeted questions (not whole-app re-review)

| Topic | Specific technical question for Claude |
|-------|----------------------------------------|
| Body/Planet data→score | Given OFF + FSANZ merge, where can missing or conflicting fields silently produce over-confident Body/Planet scores? |
| Confidence vs score ceilings | Does current presentation adequately separate confidence from numeric score, and can Body’s 12/25 additive ceiling be misread as “neutral default”? |
| Ethics frozen benchmarks | Are Workstream B freeze guards sufficient to prevent current-state contamination of BBFAW/KTC outputs? |
| Signals publication | In `transitional` mode, what legacy feeders can still reach public UI, and what is the smallest safe path to governed-only publication? |
| Contribution writes | Are Vercel manual-product / photo / manufacturing-country write paths safe against spam, PII leakage, and unverified data overwriting governed fields? |
| Paywall isolation | With `ENABLE_PREMIUM_GATING = false`, which remaining UI entry points still imply paid features and how should they be disabled without breaking navigation? |
| Privacy/monitoring | Is optional Sentry + share-event telemetry an acceptable MVP crash/lean-use baseline, and what must be disclosed or removed? |

Handoff inputs (file paths, tests, examples) will be prepared **after** as-built alignment demos, as requested in the founder letter §4 item 8.

---

## 8. Parallel platforms — practical approach and near-term risks

| Platform | Approach | Near-term risks |
|----------|----------|-----------------|
| **iOS** | EAS → TestFlight / App Store Connect (`ascAppId` 6755704230); physical UAT baseline build **26** unless replaced | Submit CLI flake historically; iOS image pin `sdk-53`; console logs need Mac |
| **Android** | EAS APK (`preview`) / AAB (`production`); NZ partner sideload or Play track | Qonversion native guard needed; Play Console metadata/privacy still release-ops |
| **Common** | One Expo/RN codebase; avoid platform forks | Build-time env flags (e.g. Skeleton UAT) must be set per EAS profile/secrets; Expo Go ≠ store UAT |

---

## 9. What Cursor will do next (authorised by this acceptance)

1. Begin **as-built walkthrough notes** in `docs/` (lightweight, durable) starting W0–W2 unless founders reorder.  
2. Produce **admin / monitoring inventory** as early evidence packs.  
3. Await founder go-ahead before **paywall UI park** implementation (recommended early).  
4. Await follow-on specifications before Confidence / Origins / Community Verification / Admin detailed builds.  
5. Prepare Claude question packs after demos.  

**Not authorised now:** inventing product rules; broad Origins/Confidence/Admin implementation; activating deferred modules; treating Skeleton UAT as MVP Signals certification.

---

*End of Cursor v0.4 acceptance response.*
