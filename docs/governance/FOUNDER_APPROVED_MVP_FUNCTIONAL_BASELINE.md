# Founder-Approved MVP Functional Baseline

**Document ID:** `FOUNDER_APPROVED_MVP_FUNCTIONAL_BASELINE`  
**Version:** 2026-11-19.1  
**Authority:** Rveel Founder — Master Recovery Directive  
**Integration candidate tip:** `127ae2000d84736faf4a8318265039480bf1eb73` (`recovery/w5-functional-baseline-20261119`)  
**publicReleaseStatus:** **BLOCKED**  
**Method:** Forensic reconstruction from Git SHAs, UAT docs, doctrine, Account/Legal gates, and Stage 1–5 evidence. Approvals are not inferred from code existence alone.

### How to use this register

1. This is the **canonical** functional contract for MVP recovery and future regression protection.  
2. **Latest explicit founder decision wins** over agent PASS claims and over rejected tips.  
3. Status in companion matrix (`MVP_REGRESSION_DISCREPANCY_MATRIX_20261119.md`) is authoritative for PASS/FAIL/BLOCKED/DEFERRED/NOT VERIFIED.  
4. Wave 5 Architectural Doctrine v0.3 remains binding (consumption contract, EA admission, fail-closed publication).

### Controlling contribution policy

| Date | Decision | SHA | Status |
|------|----------|-----|--------|
| 2026-11-17 | MVP preselected-only (deny photo/free-text/VLM; keep FM-03R + WP09 Agree) | `956886b` | Controlling |
| 2026-11-18 | Free-form restore | `b752fdf` | **REJECTED** |
| 2026-11-18 | Reaffirm preselected-only | `e36ed7a` | Controlling |
| 2026-11-18 | Structured Origins claim+country under MVP | `43b424d` | Authorised P0 |
| 2026-11-19 | CF-01–06 Stage 5 recovery decisions | `31e7e44` | Authorised; Stage 6 acceptance open |
| 2026-11-19 | CF-04 server Claims-NR gate | — | **STOPPED** (dependency) |

---

## A. Rveel Score

| ID | Feature | Latest approved behaviour | Approval source | Impl / last-good | Notes |
|----|---------|---------------------------|-----------------|------------------|-------|
| A-01 | Overall score | Publish only from consumption contract | Doctrine §5/§10; RC1 `0ce9969` | Wave 5 / `3add88c` | Fail closed |
| A-02 | Body / Planet / Claims / Transparency | Published pillar scores from `_publication` | Doctrine; `82ad946` Claims↔Packet | Wave 5 | |
| A-03 | Rated / NR / Checking | No number, colour, or Rated implication when unpublished | Doctrine | e.g. `491c6f8` lineage | |
| A-04 | Confidence | Limited/Moderate/High only with publication | Doctrine; FM-03R Limited when required | Wave 5 / FM-03R tests | |
| A-05 | Score Highlights L1–L2 | Consumer Highlights presentation | Wave 5 UI | `3add88c` | |
| A-06 | Score Highlights L3 | Content treated founder-locked in code | `l3/content.ts` | Wave3 lineage | **Evidence conflict** with Wave3 “not founder-accepted UAT” handoff — do not invent UAT PASS |
| A-07 | Score share | Share overall / product with publication safeguards | Share E2E `67f9edd` | Share framework | |
| A-08 | Score contribution opportunities | FM-02 Add-only for missing evidence from look-through | `FOUNDER_MODIFICATIONS_20261115` / `294b6fda` | Founders tip | |

---

## B. Consumer product information

| ID | Feature | Latest approved behaviour | Approval source | Impl / last-good | Notes |
|----|---------|---------------------------|-----------------|------------------|-------|
| B-01 | Product Origins card | Empty/info/flag/confidence/panels | UAT SHA list | `5c3ca64`… | |
| B-02 | Origins structured Add | Claim-type + country; no free text/photo | P0 `43b424d` | `43b424d` | Device Stage 6 |
| B-03 | Origins Change / Remove | Structured only under MVP | P0 + voluntary offer | `43b424d` | |
| B-04 | Origins Edit/Share/Info | Top-right triad | Wave 5 Result | Result chrome | |
| B-05 | Packet Claims card | Empty sentence, fitted labels, panel, Add rules | UAT list `d9189fa`…`efab64b`; `be2be82` | Wave 5 | |
| B-06 | Packet Claims Share | Share governed claims via existing framework | CF-03 / `31e7e44` | `31e7e44` | Android evidence `127ae20` |
| B-07 | Packet Claims Info | Explainer | `d9189fa` | | |
| B-08 | Packet Claims Edit | Only when voluntary offer entitles Add/Change/Remove | CF-03 + MVP gates | Conditional | |
| B-09 | FM-03R | “There are no claims on the packet” when Claims NR eligible; photo-free EA attestation; methodology 15/25 when conditions require — no hardcode | `7e1f59c`/`c346551`/`82ad946` | Client path | Server NR **STOP CF-04** |
| B-10 | FM-03 photo absence | Retired for MVP | `956886b` | Dormant | Do not reactivate |
| B-11 | Certifications marks | Recognised marks on Packet card | Wave 5 | | |
| B-12 | Ingredients (read) | Card + share | Wave 5 | | Contribute contained |
| B-13 | Nutrition (read) | Card + share + units | Wave 5; Account units | | Contribute contained |
| B-14 | Discovery / S25 | CORE-22 order; About These Additives | `8d7972e`; AD-01 | RC1 ancestry | |
| B-15 | Dynamic Signals Asset | Asset embed on for Expo Go + store UAT profiles | Dual-UAT rules | Asset flag=1 | |
| B-16 | Hero / Packaging UI | Wave 5 presentation | `3add88c` | | Not re-audited Stage 5 |

---

## C. Community contributions

| ID | Feature | Latest approved behaviour | Approval source | Notes |
|----|---------|---------------------------|-----------------|-------|
| C-01 | Preselected-only MVP | Default-deny photo/gallery/OCR/VLM/free-text | `956886b`/`e36ed7a` | Controlling |
| C-02 | Structured Origins transport | EA finalize-manual-text allowlist + submit | `43b424d` | |
| C-03 | Review → Admit → Refresh → Success/Confetti | Only after authoritative success | CD-01 `3a3d91f`; E2E `67f9edd` | Re-prove Stage 6 |
| C-04 | Transmit reconcile | Recover admit after client ack failure; no false success | CF-06 / `31e7e44` | |
| C-05 | Withdraw / no resurrection | Governed withdraw; history preserved | EA / Antarctica withdraw | |
| C-06 | Packet catalogue contribute | Deferred — do not invent | Register 18 Nov | Never implemented |
| C-07 | Free-form restore | Rejected | `b752fdf` | Do not reactivate |

---

## D. Community Agreement (WP09)

| ID | Feature | Latest approved behaviour | Approval source | Notes |
|----|---------|---------------------------|-----------------|-------|
| D-01 | Agree (thumbs-up) | Visible when settlement latch open; does not require Change entitlement | WP09 design; 17 Nov keep Agree; CF-01 | Store gate OFF; UAT env ON |
| D-02 | Correct (thumbs-down) | Always shown with Agree when surface open; opens structured Change when eligible; else honest non-submit explanation — never mutates EA alone | CF-01/02 Option C | Packet Alert ≠ completed correction journey |
| D-03 | Persistence / switch / reset | Per revisionId; new admitted version resets; no double-count | WP09 contract `f497ce4` | |
| D-04 | Separation from score | Agreements never alter scoring | WP09 | |
| D-05 | Store entitlement | Fail-closed OFF for store profiles | `eas.json` | |

---

## E. Legal and Account

| ID | Feature | Latest approved / required behaviour | Status honesty |
|----|---------|--------------------------------------|----------------|
| E-01 | Terms of Use (published) | Counsel-approved live destination | **NOT published** — `legalDestinations.ready=false` |
| E-02 | Privacy Policy (published) | Counsel-approved live destination | **NOT published** |
| E-03 | In-app Disclaimer / methodology | Account Trust education surfaces | Technically present (Android Account UAT); not legal publication |
| E-04 | Legal release preflight | Must DENY until all controls cleared | **BLOCKED** — launch gate PENDING items |
| E-05 | Consent / acknowledgement | Affirmative acceptance of published docs | Incomplete without published ToS/PP |
| E-06 | Registration / login | Explicitly deferred for MVP Guest-only | Deferred — do not invent auth |
| E-07 | Account Home / Units / Privacy / Help | Guest Account MVP | Android accepted 16 Nov; iOS outstanding |
| E-08 | Contribution identity | EA contributor credential (not user account) | UAT mechanism |

---

## F. Sharing

| ID | Feature | Latest approved behaviour | Notes |
|----|---------|---------------------------|-------|
| F-01 | Product / score share | Publication-gated share card + link | E2E `67f9edd` |
| F-02 | Origins / Nutrition / Ingredients / Highlights / Additives shares | Card-specific share | Wave 5 framework |
| F-03 | Packet Claims share | Governed claims/certs/absence projection | `31e7e44` + Android evidence |
| F-04 | NR / unpublished safeguards | No invented published scores on share | Share semantics helpers |

---

## Governance invariants (must not weaken)

1. Evidence Authority admission is the only path to prevailing community evidence.  
2. Published scores only from consumption contract.  
3. Withdrawal history preserved; no silent resurrection.  
4. Preselected-only MVP input policy unless founder supersedes.  
5. CF-04 server Claims-NR coupling requires explicit architecture approval.  
6. Dormant contribution / photo / VLM paths stay dormant (Doctrine §8).  
7. `publicReleaseStatus: BLOCKED` until separate release requirements + founder baseline approval.
