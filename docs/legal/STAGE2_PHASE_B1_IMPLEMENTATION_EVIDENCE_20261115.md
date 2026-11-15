# Stage 2 Phase B1 — Methodology accuracy corrections (implementation evidence)

**Date:** 15 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Authorisation:** Founder-approved AMBER consumer-copy correction (methodology accuracy only)  
**Controlling baseline:** Founder-approved methodology summary in the Phase B1 brief; Phase A audit `docs/legal/STAGE2_METHODOLOGY_LEGAL_RECONCILIATION_20261115.md`  
**Doctrine class:** **AMBER** (founder-authorised). Not GREEN. Does not change scoring engines, Rateability, Confidence calculation, publication semantics, Evidence Authority, Account layout, auth, Premium, or legal URL readiness.

---

## 1. Verified starting checkpoint

| Item | Value |
|---|---|
| Authorised starting SHA | `bc62cca9cac51aee191e526d6690da58fc736167` |
| Remote HEAD at start | `origin/build/w5-founders-native-20261114` = `bc62cca…` |
| Worktree | Clean of product changes (local `artifacts/` only) |

---

## 2. Files changed (consumer-reachable copy + contracts)

| File | Role |
|---|---|
| `src/i18n/locales/en.json` | Live EN methodology / sources / Claims / confidence / limitations copy |
| `src/i18n/locales/fr.json` | Dormant FR `note` reconciled (no language enablement) |
| `src/i18n/locales/es.json` | Dormant ES `note` reconciled (no language enablement) |
| `src/components/TrustScoreInfoModal.tsx` | Result methodology modal: remove S27 prefix; fix hardcoded absolute/source fallbacks; publication + confidence + limitations note |
| `src/screens/account/LegalMethodologyScreen.tsx` | Account Legal methodology panel sections (how / when / confidence / limitations) |
| `src/config/methodologyVersion.ts` | Comment clarified for INV-SC-9 (constant preserved) |
| `src/__tests__/unit/config/methodologyVersion.test.ts` | INV-SC-9: forbid consumer `v1.4`; absolute-claim / Claims-weight contracts |
| `src/__tests__/unit/lib/rateability/wave3UatNarrowCorrection.test.ts` | S27 prefix no longer applied in Result modal source |
| `docs/legal/STAGE2_PHASE_B1_IMPLEMENTATION_EVIDENCE_20261115.md` | This evidence package |

**Not modified:** Body / Planet / Claims / Transparency engines; weights; Rateability; Confidence math; Evidence Authority; Account navigation layout; auth / Premium; privacy/terms readiness flags; public legal documents.

---

## 3. Current → replacement (summary)

| ID | Was (reachable) | Now |
|---|---|---|
| **B1-01** | Consumer `Rveel Score v1.4` in `infoModal.trustScore.note` (+ FR/ES notes) | Version removed from consumer notes. Internal `RVEEL_SCORE_METHODOLOGY_VERSION = '1.4'` retained. No new public methodology version invented. |
| **B1-02** | “100% transparent”, “based entirely on…”, “no proprietary formulas”, “zero reputational risk”, “maximum credibility”, “all… verifiable” | Replaced with distinction between external systems / OFF data and Rveel’s governed scoring + publication rules. No new absolute accuracy promises. |
| **B1-03** | Claims `ethicsDesc` Fairtrade +8 / stacking | Highest eligible scheme only; Fairtrade +6, Rainforest/UTZ +6, ASC +4, MSC +4, Organic +2; BBFAW, KTC, packet-claim where applicable; no stacking. |
| **B1-04** | UPCitemdb / Barcode Spider / FDA listed as Score data sources | Active Score inputs: OFF + governed rules + certification/benchmark datasets. Signals/recalls described as separate from Score. |
| **B1-05** | `[Awaiting founder edit]` prefixed on Result methodology title/description | Prefix removed once founder-approved replacement text installed. Unrelated S26 markers untouched. |
| **B1-06** | Conflicting Result modal + Account Legal methodology text / outdated fallbacks | Aligned to founder summary sections; hardcoded modal fallbacks updated; Account methodology panel expanded. |

### Founder summary presentation (Account Legal methodology panel)

Sections shown (meaning unchanged from authorised baseline):

1. How Rveel Score works  
2. When is a score shown?  
3. What does Confidence mean?  
4. Important limitations  
5. Closing note (governed rules; Rated-only overall number; no independent-reproduction promise)

---

## 4. Automated verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `methodologyVersion.test.ts` (INV-SC-9) | Pass (4 tests) |
| `wave3UatNarrowCorrection.test.ts` (S27 + related) | Pass |
| Account Stage 1 / legal open / clear isolation | Pass |
| `methodologyContainment.test.ts` | Pass |
| `resultPublicationLoadGuard.test.ts` | Pass |
| Wave 5 `consumptionGuards.section10_4` | Pass |
| Wave 5 `governedOutcomeOracle.section10_2` | Pass |
| Wave 5 `nrExplanation.a3` | Pass |

H-13: incompatible methodology/version and S27 contracts were **updated**, not deleted without replacement.

---

## 5. Emulator visual QA (Android / Expo Go)

**Platform checked:** Android emulator + Expo Go (NZ path).  
**Platform not visually checked:** iOS TestFlight.

**Account Legal — verified on device**

| Artifact | Content |
|---|---|
| `docs/legal/evidence/stage2-b1-20261115/160_account_methodology.png` | Methodology modal: How it works / When shown / Confidence (founder wording) |
| `docs/legal/evidence/stage2-b1-20261115/161_account_methodology_scrolled.png` | Limitations + closing note; no `v1.4` / absolute claims |
| `docs/legal/evidence/stage2-b1-20261115/163_sources.png` | Sources panel: OFF + governed rules; Signals/recalls separate; no UPCitemdb / Barcode Spider / FDA Score list |
| `docs/legal/evidence/stage2-b1-20261115/150_legal.png` | Account Legal & Methodology screen (Stage 1 layout preserved) |

Accessibility dump checks on those panels: **absent** `v1.4`, `100% Transparent`, `UPCitemdb`, `Barcode Spider`, `Awaiting founder edit`, `Fairtrade +8`, `zero reputational`.

**Result methodology modal**

- Same EN keys + `TrustScoreInfoModal` source verified (S27 removed; fallbacks corrected; Claims/source wording aligned).  
- Live Result modal screenshot **not** captured in this session: after `pm clear` of Expo Go, product lookup returned no results (emulator OFF/search path) before a Result screen with score info control could be opened.  
- Account Stage 1 presentation/navigation remained intact (Guest / Free / Legal & Methodology rows unchanged).

**Metro note for future NZ UAT:** after Expo Go data clear, use `exp://127.0.0.1:8081` with `adb reverse tcp:8081 tcp:8081` (not `10.0.2.2` alone) for reliable Expo Go reload.

---

## 6. Unresolved / deferred (not Phase B1)

| Item | Status |
|---|---|
| **Phase B2** — final legal licence disclosures / OFF ODbL counsel pack | Unauthorised; not started |
| **Onboarding Skip bypass** | Separate process-control issue; **not** corrected in B1 (observed during QA: Skip intro does not complete Privacy First without Get Started) |
| Disclaimer / data-limitations legal-acceptance wording | Explicitly out of scope; unchanged meaning under this authorisation |
| Declaring OFF licence compliance from revised wording | Not declared |
| Result modal live screenshot | Deferred to next device session with working product fetch; copy path covered by code + Account panel QA |

---

## 7. Confirmation: governed logic unchanged

Confirmed by scope of diff + Wave 5 publication/oracle/consumption regression pass:

- Scoring engines, adjustments, weights: **unchanged**  
- Rateability / Rated / NR / Checking publication: **unchanged**  
- Confidence calculation rules: **unchanged** (consumer description only)  
- Evidence Authority / source precedence / contributor admission: **unchanged**

---

## 8. Commit / remote HEAD

| Item | Value |
|---|---|
| Implementation commit(s) | `e523463ea43fccd7f83b09c2acbd875d9efac075` (copy + evidence package); docs follow-ups `fd75bf2`, `9123e01` |
| Final pushed remote HEAD | `9123e011179df5f36348e1dfa10228ceed174c71` on `origin/build/w5-founders-native-20261114` (verify with `git rev-parse origin/build/w5-founders-native-20261114` after any further docs-only pushes) |

---

## 9. STOP (initial B1 package)

Initial Phase B1 implementation and testing were complete for independent review at remote tip through `41fea08`.  
**Do not proceed** to B2, onboarding Skip fix, authentication, or Premium under this authorisation.

---

## 10. Final independent-review correction (flags / bands / fallbacks)

**Authorisation:** Founder/reviewer-authorised narrow consumer-copy correction after independent review.  
**Baseline HEAD before this correction:** `41fea08c5b31af57baec24bac21f8994c4b157b6`  
**Doctrine class:** AMBER (copy only). Scoring, Rateability, publication, Evidence Authority, Account Stage 1, legal disclaimers, onboarding: **unchanged**.

### Finding addressed

Reachable Result `TrustScoreInfoModal` Red Flags / Green Flags headings and descriptions still implied that carbon/water/labour/recalls and similar contextual items automatically adjust Rveel Score, and that missing data lowers scores rather than preventing publication / yielding NR. Hardcoded Body fallback still said `0-25` and included allergens as a scoring input.

### Files changed in this correction

| File | Change |
|---|---|
| `src/i18n/locales/en.json` | Reconciled `infoModal.trustScore` flags, score-band, Body/Transparency/Claims-related explanations |
| `src/components/TrustScoreInfoModal.tsx` | Corrected hardcoded fallbacks (Body 2–25; no allergens as Body input; score-band wording) |
| `src/__tests__/unit/config/methodologyFlagsCopy.test.ts` | New targeted regression contracts |
| This evidence document | Appended §10 |

### Copy outcomes

1. Flag section no longer uses categorical “Negative Points” / “Positive Points” headings.  
2. Recalls / Dynamic Signals explicitly **not** score deductions and remain separate from Rveel Score.  
3. Planet copy tied to Eco-Score + packaging fallback (not independent carbon/water scoring).  
4. Claims copy tied to BBFAW, KnowTheChain, highest-scheme certs, packet claims.  
5. Missing evidence described as NR / Checking / incomplete Rating, not automatic numeric reduction.  
6. Score bands describe relative outcomes under Rveel’s methodology without guaranteeing health/safety/sustainability.  
7. Body fallbacks: floor **2–25**; allergens **not** a Body scoring input.

### Automated verification (this correction)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `methodologyFlagsCopy.test.ts` | Pass (6) |
| `methodologyVersion.test.ts` | Pass (4) |
| Wave 5 consumptionGuards + governedOutcomeOracle | Pass |

### Emulator visual QA (Result methodology modal)

**Genuine device capture of the corrected Result methodology modal was not obtained in this correction session.**

- Installed native package `com.truescan.foodscanner` opened onboarding and does not carry this JS copy correction.  
- No controlled Result fixture route was used that would load the Metro-served corrected modal without changing product identity, publication, or scoring.  
- Verification of this correction therefore rests on source review + the new Jest contracts above (not on a Result-modal screenshot).  
- Account Legal methodology panel screenshots from the earlier B1 package remain valid for founder summary sections; they do not cover the Result flags section.

### Commit / remote HEAD (this correction)

| Item | Value |
|---|---|
| Correction commit(s) | `97fe1850acd436cbee9c2e5e90d2720bf2cfcd88` |
| Final pushed remote HEAD | `97fe1850acd436cbee9c2e5e90d2720bf2cfcd88` on `origin/build/w5-founders-native-20261114` (docs-only SHA note may follow) |

### STOP

Phase B1 final review correction complete for independent acceptance. **Do not begin Phase B2.**
