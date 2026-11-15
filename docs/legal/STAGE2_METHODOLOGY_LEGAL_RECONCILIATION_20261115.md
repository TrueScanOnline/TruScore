# RVEEL Stage 2 — Methodology, Legal & Attribution Reconciliation

## Phase A — Evidence audit and founder approval package

**Date:** 15 November 2026  
**Repository:** `TrueScanOnline/TruScore`  
**Branch:** `build/w5-founders-native-20261114`  
**Verified starting SHA:** `e90eff8f53081987ece1b2531ab1926ad22cdbee`  
**Account Stage 1:** Founder accepted and closed (UI/navigation only).  
**Phase A scope:** Documentation only. **No consumer-facing code, scoring, publication, Evidence Authority, legal URL readiness, or public legal-page deployment was changed.**

---

## 1. Doctrine classification (Phase A)

| Item | Class | Notes |
|---|---|---|
| This audit report | **GREEN** (docs) | Evidence mapping and proposed wording only |
| Any future edit that removes consumer `v1.4` display | **AMBER → founder** | Touches INV-SC-9 / H-14 / D-9; meaning of “methodology version” |
| Any rewrite of scoring methodology explanation | **AMBER → founder** | INV-SC-1 (methodology rules are founder-governed) |
| Changing engine weights / Rateability / Confidence / publication / EA | **RED** | Out of Stage 2 Phase A/B copy scope |
| Marking privacy/terms URLs ready or deploying counsel pages | **RED / counsel** | Not authorised here |

**Invariants applied:** INV-SC-1, INV-SC-7, INV-SC-8, INV-SC-9, INV-RA-5, INV-EA-1…4, §6/§8/§12 change control.

**Confirmed fact:** Doctrine INV-SC-9 / D-9: `RVEEL_SCORE_METHODOLOGY_VERSION = '1.4'` is **not** authoritative for consumer display; Wave 5 must not expose it. Live registries are Body v12, Planet v19, Claims/Ethics v37, Open/Transparency v15.

---

## 2. Authoritative technical methodology (implemented behaviour)

*Confirmed from code under `src/lib/truscoreEngine/`, `src/lib/rateability/`, `src/utils/trustScore.ts`. This is the authority Phase B copy must reconcile to. No implementation change is proposed here.*

### Pipeline

1. Product must carry Core Truth stamp (`rveel-core-truth-v1`) via `hasCoreTruthAuthority`.
2. Evidence Authority snapshot is loaded; governed projection applied.
3. Four pillars scored; Rateability settles Rated / NR / Checking + Confidence.
4. Consumer visuals must use **published** state only (INV-SC-7/8).

Internal pillar keys: Body, Planet, Ethics, Open.  
Consumer labels: Body, Planet, Claims, Transparency.

### Body (`pillars/bodyPillar.ts`, related)

| Element | Implemented rule |
|---|---|
| Base / bounds | Base 15; floor **2**; clamp 0–25 (practical ≤25) |
| Nutri-Score | OFF `nutriscore_grade` A+7 B+3 C−1 D−3 E−7 |
| NOVA | OFF `nova_group` 1+3 2+1 3−1 4−6 (+ governed NOVA 1 rescue) |
| Whole produce | +7 replaces Nutri-Score when eligible and no valid Nutri grade |
| Additives | Governed MVP registry (currently orange/red tiers; yellow unused); caps −8; red additive Body ceiling 12 |
| Shadow Nutri-Score 2023 | **Not** production-scoring |

### Planet (`pillars/planetPillar.ts`, packaging fallback)

| Element | Implemented rule |
|---|---|
| Eco-Score | OFF grade A+7…E−7 from base 15 |
| Packaging fallback | Only if Eco-Score missing: +2/+1/0 (Annex v2 AU/NZ) |
| Palm oil | Display policy separate; **0 Planet points** in MVP |

### Claims / Ethics (`pillars/ethicsPillar.ts`, certifications, packet claims)

| Element | Implemented rule |
|---|---|
| Certifications | **Highest eligible scheme only** (weights e.g. Fairtrade/Rainforest +6, ASC/MSC +4, Organic +2; RSPO does not score Claims) |
| Organic claim-only | +1 path distinct from certified Organic +2 |
| Packet claims | Machine register + UK FOP MTL nutrient context (Rveel-reviewed thresholds) |
| BBFAW / KTC | Benchmark adjustments from governed datasets |
| Stacking to +25 via multiple cert bonuses | **Not** how MVP cert scoring works |

### Transparency / Open (`pillars/openPillar.ts`)

| Element | Implemented rule |
|---|---|
| Ingredient disclosure | Clarity bands from flagged terms |
| Origins | OFF completeness and/or admitted packet origin evidence bands |

### Overall / publication / Confidence

| Element | Implemented rule |
|---|---|
| Composition | Rounded sum of four pillars, clamped 0–100 |
| Checking | Assessment unsettled or any pillar Checking → no published number |
| NR | Any pillar NR → overall NR; **no renormalisation**; no published number |
| Rated | All pillars rated |
| Confidence | Min of pillar confidences; High requires authoritative overrides rarely (if ever) supplied in production paths |

### Evidence Authority vs OFF

- OFF supplies Nutri-Score, NOVA, Eco-Score, many labels/ingredients.
- Admitted contributions govern selected subjects (e.g. certifications, origins, packet claims, governed ingredients/nutrition overlays) without substituting Nutri/Eco grades.
- Contributor credential is a device Evidence Authority token — **not** a consumer login.

### Product identity / version config

- `RVEEL_SCORE_METHODOLOGY_VERSION = '1.4'` in `src/config/methodologyVersion.ts` — config + i18n sync tests; **must not be consumer-authoritative** (INV-SC-9).
- Consumer still sees literal `v1.4` inside `infoModal.trustScore.note` (Result modal + Account Legal methodology panel).

---

## 3. Consumer-facing copy inventory (reachability)

Reach codes: **R** = consumer-reachable in current MVP path; **R-c** = reachable under conditions; **N** = not consumer-reachable (dormant / contained / orphan / gated off).

### 3.1 Primary reachable surfaces

| Surface | Proof of reach | What consumers see |
|---|---|---|
| Result `TrustScoreInfoModal` (“How this is scored”) | Info icon on Result when product present; **not** publication-gated | Large methodology modal: i18n + **hardcoded** English strings; **`[Awaiting founder edit]`** prefix on title/description |
| Result Disclaimer card | Unconditional on Result scroll | Full `result.legalDisclaimerModalP1–P7` |
| Result Data limitations / Product information | Conditional (S26 / contribution) | Partial data-limitation copy + S26 explanations (approval prefix stripped) |
| Account → Legal & Methodology | Account stack | Methodology: `description` + `note`; Sources: `openSourceMessage` + `dataSourceNote`; Limitations: disclaimer P1–P3 + data-limitations P1 only; Privacy/Terms fail-closed |
| Account → Privacy & Data → How data used | Account stack | Fail-closed privacy URL alert |
| Account → Help → About | Account stack | Light product about blurb |
| Onboarding legal step | After intro slides | Full disclaimer + data-limitations; **bypassable via “Skip intro”** |
| Processing / NOVA education modal | Result Processing card | NOVA health-association language |
| Score presentation (`TruScore`) | Result | Rated / NR (“UnRevealed?”) / Checking (“Seeing what we can find…”) |
| Confidence badge | Rated only | High / Moderate / Limited |
| Share message builder | Share flows | Light “informational / public data” language when scores shared |
| Public share/teaser pages | Web hosts | Teaser copy; footer privacy/terms links; **no ODbL attribution found** |

### 3.2 Not consumer-reachable (still in tree — do not treat as live exposure without reactivation)

| Surface | Why N |
|---|---|
| `app/methodology.tsx` | Containment stub; redirects |
| Developer Settings `settings.*` alerts | Store-release gated; deep link omitted when `EXPO_PUBLIC_STORE_RELEASE=1` |
| Subscription legal links | `subscriptionAndPaywall: false` |
| Orphan `TruScoreCard` feature mounts | Not imported on Result path |
| Many dead `infoModal.trustScore.*` keys (retired confidence / unused factor labels) | No static render |

### 3.3 LegalMethodologyScreen content gap

Account Legal limitations panel shows only **P1–P3** of disclaimer + data-limitations **P1**.  
Warranty, liability, allergy/medical paragraphs (**P4–P7**, data-limitations **P2–P5**) appear on Result/onboarding but **not** on Account Legal. That is a structural coverage inconsistency, not an engine defect.

---

## 4. Claim classification (selected audit set)

Classification vocabulary: **ACCURATE / INACCURATE / OVERSTATED / OUTDATED / UNVERIFIED / NOT CONSUMER-REACHABLE**.

| # | Claim / location | Class | Evidence | Proposed disposition |
|---|---|---|---|---|
| 1 | Consumer `Rveel Score v1.4` in `infoModal.trustScore.note` (Result modal + Account Legal) | **INACCURATE / OUTDATED** vs INV-SC-9 | Constant is non-authoritative; registries are v12/v19/v37/v15 | **Remove consumer version number**; do not invent a new public version string in Phase B |
| 2 | `RVEEL_SCORE_METHODOLOGY_VERSION` itself | **ACCURATE** as internal lock | Config + tests | Keep internal; stop syncing into consumer `note` |
| 3 | “100% transparent methodology” / `transparencyTitle` | **OVERSTATED** | Absolute wording; scoring includes Rveel-authored weights/rules | Replace with transparent-but-bounded language |
| 4 | “based entirely on recognized public systems” (`description`, `howItWorksText`, hardcoded modal line) | **INACCURATE / OVERSTATED** | Public systems are **inputs**; Rveel defines base 15, grade weights, additive registry, packaging fallback, cert weights, publication | Distinguish public inputs vs Rveel interpretation rules |
| 5 | “no proprietary formulas” / “no proprietary black-box formulas” | **INACCURATE / OVERSTATED** | Rules are governed and inspectable in-repo, but they are Rveel methodology, not a verbatim public standard | Say Rveel applies published rules to public data; avoid “no proprietary” |
| 6 | “All calculations are transparent and verifiable” (`dataSourceNote`) | **OVERSTATED** | Consumers cannot independently recompute from OFF alone without Rveel rules/assets | Soften to: methodology explained in-app; data from named sources |
| 7 | “zero reputational risk” / “maximum credibility” (`transparencyNote`) | **INACCURATE** | Internal/marketing assurance, not a consumer-safe legal claim | **Delete** from consumer surfaces |
| 8 | Nutri-Score “A=25, B=20…” example in `transparencyNote` | **INACCURATE** | Body uses base 15 ± grade deltas; also NOVA/additives | Align example with A+7…E−7 from base 15 **or** remove numeric example |
| 9 | Pillar rows showing “25” vs Body “2–25” in formula | **INACCURATE** (internal inconsistency) | Body floor 2 | Align UI with 2–25 Body / 0–25 others |
| 10 | Claims `ethicsDesc`: Fairtrade +8, EU Organic +7, stacking to +25 | **OUTDATED / INACCURATE** | Hardcoded modal tags + `ethicsCertificationsService`: highest scheme; +6/+6/+4/+4/+2 | Make i18n match highest-scheme weights |
| 11 | Hardcoded Claims tags (Fairtrade +6… highest only) | **ACCURATE** (vs current cert table) | `TrustScoreInfoModal.tsx` ~L364 | Prefer this over `ethicsDesc`; keep as source for Phase B |
| 12 | Planet v19 Eco-Score + packaging fallback + palm 0 | **ACCURATE** (high level) | `planetPillar` / registry | Keep; minor polish only |
| 13 | Body Nutri + NOVA + additives registry | **ACCURATE** (high level) | `bodyPillar` | Keep; avoid health-guarantee language |
| 14 | “score only displayed when sufficient verified data” (`note`) | **OVERSTATED / PARTIAL** | Publication uses Rateability lanes; “verified” overclaims crowd-sourced OFF | Tie to Rated/NR/Checking language |
| 15 | Data sources list: UPCitemdb, Barcode Spider, FDA Food Recall API as scoring sources | **OUTDATED / INACCURATE** on Result scoring path | Core Truth = World OFF (+ EA snapshot); FDA API / UPCitemdb / Barcode Spider dormant on Result | Limit to **active** sources; put recalls under Signals if mentioned |
| 16 | `settings.openSourceMessage` (OFF, UPCitemdb, FDA) on Account Legal | **OUTDATED** | Same | Replace with active-source attribution draft |
| 17 | “1,000+ recognized certifications” stacking narrative | **OVERSTATED** | OFF may list many labels; scoring uses bounded eligible set + highest scheme | Soften |
| 18 | Flag copy implying recalls decrease Rveel Score | **INACCURATE** if presented as score inputs | Dynamic Signals are separate; FDA API dormant | Keep Signals distinct from Score |
| 19 | NOVA `nova4Concern3` / `novaNote` health associations | **OVERSTATED / LEGAL-SENSITIVE** | Educational; can read as medical claims | Soften; counsel review |
| 20 | `bodySafetyDesc` “safer, healthier products” | **NOT CONSUMER-REACHABLE** (dead key) / would be **OVERSTATED** if reactivated | Dead i18n | Do not reactivate |
| 21 | Retired High/Medium/Low source-confidence block | **NOT CONSUMER-REACHABLE** | Replaced by Rateability Confidence | Keep dormant (§8) |
| 22 | Disclaimer P1–P3 (general info; automated opinions; pack is authoritative for ingredients/allergens) | **ACCURATE** (directionally) | Matches fail-closed / pack-first posture | Keep; counsel polish |
| 23 | Disclaimer P3: pack authoritative for **recalls** | **OVERSTATED / UNVERIFIED** | Official recall notices (regulators / Signals pack) can supersede pack silence | Split: pack for composition; official notices for recalls |
| 24 | Data-limitations P2 “may reduce scores” | **OUTDATED / OVERSTATED** | Missing data → NR/Checking/fail-closed more than silent score reduction | Align with publication semantics (INV-SC-8, INV-RA-5) |
| 25 | `[Awaiting founder edit]` prefix on S27 title/description | **INACCURATE as shipped UX** | Hardcoded in `TrustScoreInfoModal.tsx` | Remove prefix once founder-approved replacement lands |
| 26 | Account privacy blurb “Local scan history… stay on this device” | **ACCURATE for those stores** / incomplete as privacy story | History/favs/cache local; Result still hits OFF + EA snapshot GET | Privacy Policy must disclose network calls |
| 27 | Share/teaser “scores stay in the app” | **ACCURATE** for public preview nulling | `publicPreviewContract` | Keep |
| 28 | Four equal pillars 0–25 (except Body floor) | **ACCURATE** | Engine | Keep with Body floor caveat |
| 29 | Onboarding Skip bypasses legal acceptance | **ACCURATE** process risk | `onboarding.tsx` handleSkip | Founder/policy decision (not copy-only) |
| 30 | Placeholder Vercel `/privacy` `/terms` | **UNVERIFIED / PLACEHOLDER** | `rveelLegalPages.ts`; app points at `truescan.app` which was not ready | Counsel-approved pages on configured host |

**Counts (this table):** 30 classified items.  
Additional dead/dormant keys inventoried in research notes; not all expanded here to avoid inflating live legal exposure.

---

## 5. Risk assessment and priority

| Priority | Issue | Why |
|---|---|---|
| **P0** | Consumer `v1.4` + INV-SC-9 conflict | Direct doctrine breach on live Result + Account |
| **P0** | “No proprietary / entirely public / 100% / zero reputational risk” | False or absolute claims on live methodology modal |
| **P0** | Claims stacking / Fairtrade +8 copy vs highest-scheme implementation | Contradicts live hardcoded correct tags in same modal |
| **P1** | Stale UPCitemdb / Barcode Spider / FDA as scoring sources | Misstates MVP architecture |
| **P1** | `[Awaiting founder edit]` visible to consumers | Ships unfinished governance marker |
| **P1** | Recall authority wording in disclaimer P3 | Legal precision |
| **P1** | OFF attribution / ODbL–CC BY-SA gaps on Account + web | Counsel pack open items |
| **P2** | Account Legal omits disclaimer P4–P7 | Incomplete Account legal surface |
| **P2** | NOVA health-association wording | Soften + counsel |
| **P2** | Onboarding skip bypass | Process / acceptance integrity |
| **P3** | Dead overstated keys remaining in `en.json` | Reactivation hazard (§8) |

---

## 6. Proposed consumer methodology explanation (draft for founder approval)

*Natural language. No new public methodology version. Distinguishes inputs vs Rveel rules. Not yet implemented.*

### Proposed short explanation (Account Legal / modal summary)

**How RVEEL Score works**

RVEEL Score is RVEEL’s assessment of a food product when enough information is available to publish a result. It combines four equal pillars — Body, Planet, Claims and Transparency — each contributing up to 25 points (Body never falls below 2). The overall score is shown only when publication rules allow a Rated result. If a pillar cannot be rated, that pillar — and often the overall score — stays UnRevealed (NR) or shows as still checking. That is different from a technical failure.

RVEEL uses publicly available product data (especially Open Food Facts) and recognised external standards such as Nutri-Score, NOVA and Eco-Score **as inputs**. RVEEL then applies its own governed scoring and publication rules — including how those grades are weighted, how limited additive and certification evidence is handled, and when a score may be shown. Those rules are explained here; they are not a secret black box, but they are RVEEL’s methodology, not a copy of a single public formula.

**What the score is not.** It is general information, not medical, dietary or legal advice. It does not prove a product is safe, healthy, sustainable or ethical for you. The physical pack remains the authority for ingredients, allergens and nutrition on the product you hold. Official recall and safety notices from regulators (and in-app Signals where shown) must be checked separately.

**Confidence** describes how complete the rated evidence lanes are. It is not a second score.

**Contributions.** Where enabled, Evidence Authority admissions can improve specific governed fields. They do not replace Nutri-Score or Eco-Score grades from Open Food Facts.

### Proposed Data Sources & Licences (Account) — draft attribution (counsel must approve)

RVEEL’s product identity and many assessment inputs come from **Open Food Facts** (world.openfoodfacts.org), a collaborative database. Open Food Facts data is generally available under the **Open Database License (ODbL)**; individual contents may be under **Database Contents License (DbCL)**; product photographs are typically **CC BY-SA**, with possible third-party rights remaining. RVEEL displays and caches product information to provide in-app assessments and previews. Attribution: © Open Food Facts contributors.

Other governed inputs used in scoring or presentation may include certification and benchmark datasets (for example welfare and supply-chain benchmarks where configured) and, for Signals, a local food-recall pack. Legacy catalogue APIs named in older copy (UPCitemdb, Barcode Spider, FDA enforcement API) are **not** part of the current MVP Result scoring path.

*Unresolved for counsel:* exact share-alike / attribution placement for Share Cards, cached derivatives, and public teaser pages (see counsel pack §3).

---

## 7. Side-by-side: current → proposed (Phase B candidates)

| Location | Current (excerpt) | Proposed (excerpt) | Class of change |
|---|---|---|---|
| `infoModal.trustScore.note` | “Rveel Score **v1.4** is calculated… No proprietary black-box formulas…” | Remove version. “RVEEL Score uses Open Food Facts and other product data together with RVEEL’s governed scoring and publication rules. A score appears only when Rated publication allows it.” | AMBER (INV-SC-9, INV-SC-1) |
| `infoModal.trustScore.description` | “based entirely on recognized public systems… 100% transparent… no proprietary formulas” | “combines four pillars… Public standards (e.g. Nutri-Score, NOVA, Eco-Score) inform the assessment; RVEEL applies its own governed rules to produce and publish the score.” | AMBER |
| `transparencyTitle` | “100% Transparent Methodology” | “Transparent methodology” or “How scoring works” | AMBER |
| `transparencyNote` | Nutri A=25… “zero reputational risk” | Delete absolute claims; optional short note pointing to Body/Planet/Claims/Transparency sections | AMBER |
| `ethicsDesc` | Fairtrade +8 / stacking +25 | Match highest-scheme weights (+6/+6/+4/+4/+2; no stacking) | AMBER (corrective to match engine) |
| `dataSourceNote` | OFF + UPCitemdb + Barcode Spider + FDA; “all… verifiable” | Active sources + OFF licence sentence; remove dormant APIs from scoring list | AMBER |
| `settings.openSourceMessage` (Account Legal) | Same stale list | Align with proposed attribution draft | AMBER |
| Hardcoded `[Awaiting founder edit]` | Visible prefix | Remove after approved copy replaces title/description | GREEN once text approved |
| Disclaimer P3 recalls clause | Pack authoritative for recalls | Pack for ingredients/allergens/nutrition; official notices for recalls | AMBER + counsel |
| Data-limitations P2 “may reduce scores” | Implies silent reduction | Prefer NR/Checking / incomplete-data language | AMBER (INV-RA-5/SC-8) |

Numeric scoring rules, baselines and Rateability logic: **unchanged**.

---

## 8. Open Food Facts and other source-licence inventory

### Open Food Facts (from counsel pack + public OFF terms; counsel to confirm)

| Topic | Status |
|---|---|
| Database | ODbL — attribution, share-alike, database combination obligations may apply |
| Individual contents | DbCL commonly referenced |
| Images | Typically CC BY-SA; third-party / trademark rights may remain |
| API / user-agent | Operational requirement; verify production client identification |
| In-app / Share / teaser attribution | **Unresolved** (counsel pack §3) — no complete consumer ODbL notice found on Account/web |

### Other sources

| Source | MVP Result role | Licence note |
|---|---|---|
| World OFF | **Active** Core Truth catalogue | See above |
| Evidence Authority backend | **Active** snapshot GET; submit gated | RVEEL-operated; privacy disclosure required |
| Manual-products merge | Supplemental allergens/photo | Backend-hosted |
| Dynamic Signals / local recall pack | Signals, not Score | Attribution/provenance of pack contents — confirm |
| BBFAW / KTC datasets | Claims benchmarks | Dataset licence/redistribution — confirm |
| UK FOP MTL thresholds | Claims nutrient context (Rveel-reviewed copy) | Government reference; Rveel adaptation |
| UPCitemdb / Barcode Spider / FDA API | **Dormant** on Result scoring | Remove from consumer scoring attribution |
| ~40 legacy barcode APIs | Unreachable (§8) | Do not reactivate without RED review |

**Do not declare compliance** from this draft attribution alone.

---

## 9. Privacy Policy & Terms — factual requirements (for drafting, not deployment)

### Data-handling inventory (facts)

**Typically local-only:** `@truescan_history`, `@truescan_favorites`, `@truescan_product_cache`, `@truescan_settings` (incl. unused `analyticsEnabled`), onboarding/legal acceptance timestamps, share inbound attribution, local share counters, contribution outbox until send, EA contributor credential after issue.

**Ordinary Free/Guest Result network:** barcode → World OFF; barcode → Evidence Authority snapshot GET; optional manual-products GET; product image CDN; optional share-event POST (no `analyticsEnabled` gate).

**Only if contribution entitled + user acts:** credential issue, evidence submit/outbox flush.

**Gated off in MVP runtime:** Qonversion/paywall; Alerts tab; subscription init.

**Do not claim** “all product or contribution data stays on device.”

### Privacy Policy should cover (minimum)

- What is stored locally vs transmitted  
- OFF and backend hosts  
- Camera permission purpose  
- Contribution / credential (not a login) when enabled  
- Absence of active third-party analytics SDK collection despite unused toggle  
- Retention/clear controls (Account Privacy & Data)  
- Contact route (once `EXPO_PUBLIC_SUPPORT_EMAIL` configured)  
- Children / age if required by stores  

### Terms of Use should cover (minimum)

- Licence to use app; no professional advice  
- Independent automated assessments; pack + official notices  
- Limitation of liability (jurisdiction-appropriate)  
- User contributions / prohibited content  
- IP / OFF attribution obligations  
- Future subscription separation (not active now)  
- Termination; governing law (NZ/AU counsel)  

### Blocked URLs (preserve)

- `https://truescan.app/privacy` — not ready  
- `https://truescan.app/terms` — not ready  
Do **not** set `legalDestinations.*.ready = true` or invent support email.

---

## 10. Issues requiring founder approval

1. Approve removal of consumer-facing `v1.4` (INV-SC-9) without replacing with another public version number.  
2. Approve replacement of “entirely public / no proprietary / 100% / zero reputational risk” language with the draft distinction (public inputs vs Rveel rules).  
3. Approve Claims copy correction to highest-scheme weights (align i18n with modal hardcoded tags / engine).  
4. Approve active-source attribution list and OFF licence sentence **subject to counsel**.  
5. Approve removing `[Awaiting founder edit]` once replacement S27 title/description accepted.  
6. Approve whether Account Legal should show full disclaimer P4–P7 / data-limitations P2–P5.  
7. Approve onboarding Skip behaviour vs mandatory legal acceptance.  
8. Decide Phase B sequencing vs Privacy/Terms publication workstream.

---

## 11. Issues requiring qualified NZ/Australian legal review

1. ODbL / DbCL / CC BY-SA obligations for in-app display, Share Cards, cache, teaser pages.  
2. Final Privacy Policy and Terms (hosts, support email, analytics truth, contribution).  
3. NOVA / Body wording that could be read as health claims.  
4. Disclaimer precision on recalls vs pack authority.  
5. Fair Trading / ACL substantiation of methodology marketing claims.  
6. Share-alike triggers from derived databases or exported datasets.

Reference: `docs/legal/MVP_COUNSEL_READY_PACK.md` (LEGAL HOLD on §§3–5).

---

## 12. Phase B implementation proposal (narrow; **not authorised until founder approves**)

### Likely file scope (copy/presentation only)

| File | Proposed change |
|---|---|
| `src/i18n/locales/en.json` | Replace reachable overstated/outdated keys listed in §7; FR/ES parity if those locales remain dormant-but-synced |
| `src/components/TrustScoreInfoModal.tsx` | Remove `s27Prefix`; fix hardcoded absolute lines; ensure Claims tags and i18n agree |
| `src/screens/account/LegalMethodologyScreen.tsx` | Optionally expand disclaimer paragraphs; consume updated keys only |
| `settings.openSourceMessage` / Account sources panel | Active-source + OFF attribution draft |
| Tests | Update source-text contracts that assert `v1.4`, “100%”, proprietary phrasing, Claims +8, etc. |

### Must not change in Phase B without separate RED/AMBER authorisation

Scoring engines, Rateability, Confidence derivation, publication, Evidence Authority, source precedence, contribution admission, Account UI/navigation structure, Premium/auth, `legalDestinations.ready`, public legal deployment, `RVEEL_SCORE_METHODOLOGY_VERSION` value (may stop **displaying** it).

### Tests required after Phase B copy lands

- `methodologyVersion` consumer-display absence (new contract: no `v1.4` in reachable Account/Result methodology strings)  
- Update `methodologyVersion.test.ts` if it currently forces `note` to contain `v${VERSION}` — **re-point control** to “config lock without consumer exposure” (H-13: re-prove, do not delete)  
- Account Stage 1 / Legal screen contracts  
- TrustScoreInfoModal source contracts / Wave 3 UAT narrow corrections referencing S27 prefix  
- Claims weight copy vs `ethicsCertificationsService` snapshot test  
- `tsc --noEmit` + relevant Jest; Android visual check of Result info modal + Account Legal  

---

## 13. Confirmed facts vs deductions vs uncertainties

| Kind | Examples |
|---|---|
| **Confirmed** | INV-SC-9 text; live pillar registries; highest-scheme Claims weights; OFF-only Core Truth Result path; `analyticsEnabled` unused; privacy/terms not ready; S27 prefix visible; Account Legal uses `note` with v1.4 |
| **Deduction** | Absolute “100%/entirely public” claims create Fair Trading exposure; dormant APIs in copy inflate licensing surface |
| **Uncertainty** | Exact ODbL share-alike trigger for Share Cards; whether High confidence can ever appear in current production configs; full FR/ES parity of overstated strings; live HTTP status of `truescan.app` pages as of later dates |

---

## 14. Blockers requiring founder instructions before Phase B

1. Explicit approval of §6–§7 proposed wording (or markups).  
2. Counsel engagement on OFF attribution + Privacy/Terms.  
3. Support email configuration plan (separate workstream).  
4. Whether S27 founder-edit prefix removal is approved with the new text in one change set.  
5. Confirmation that Phase B remains **copy-only** (this package assumes yes).

---

## 15. Phase A execution record

| Item | Value |
|---|---|
| Starting SHA | `e90eff8f53081987ece1b2531ab1926ad22cdbee` |
| Application behaviour changed? | **No** |
| Frozen native-build tag | Unchanged (`c113ce6…`) |
| Account Stage 1 | Closed; not reopened |
| This document | `docs/legal/STAGE2_METHODOLOGY_LEGAL_RECONCILIATION_20261115.md` |

**STOP — Phase A complete. Do not implement consumer-copy changes until the founder explicitly approves Phase B.**
