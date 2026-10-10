# Rveel Wave 5 — Architectural Doctrine & Protected Invariants

**Version:** v0.3 — FOUNDER-APPROVED CANDIDATE (v0.2 adjudications D-1 to D-10, plus v0.3 corrective-package process refinement, 8 Oct 2026)
**Prepared by:** Claude (independent code-integrity reviewer) · 8 October 2026
**Repository inspected:** `github.com/TrueScanOnline/TruScore`
**Wave 5 baseline (D-1):** `99102768b61bd6e518bb889e3ab6f01dfc3e1268` — founder-accepted B0 on 8 Oct 2026. Administrative provenance record only; locked rules are unchanged. Working branch `wave5/score-experience-20261008`. Frozen return branch `preserve/pre-wave5-9910276-20261008`.
**[OBSERVED] inspection SHA:** `f0b29211b00dfc33bc414d8d556c28f6e1523ef9` (7 Oct 2026). All [OBSERVED] statements, line numbers and the §8 reachability inventory refer to this SHA until re-inspected at the Wave 5 baseline.
**Method:** Read-only static inspection of source, call paths and a static import-reachability pass from the `app/` entrypoints. No code was changed. Jest and `tsc` were not run. Nothing here is accepted on the strength of a Cursor summary.

> **Provenance (P-01) — resolved in principle, SHA outstanding.** Founders have decided (D-1) that Wave 5 starts from the final corrective release SHA once it is pushed, and that Wave 5 is not held for Certifications or P&R. As at 8 Oct 2026 no new ref has appeared on origin since `f0b2921`, and no baseline SHA accompanied the v0.2 instruction. Record the pushed SHA in the header above, verify it with git, and refresh the [OBSERVED] line references against it before the first Wave 5 commit. Administrative record, 8 Oct 2026: B0 and the H-10 corrective SHA are `99102768b61bd6e518bb889e3ab6f01dfc3e1268`, verified on origin.

### v0.3 change log

| Change | Where |
|---|---|
| Process refinement only: approved correctives C-1 to C-4 may land as one bounded governed-corrective package, separate from presentation work; one package-level review is permitted, with findings attributable per corrective. C-1 to C-4 definitions and required outcomes unchanged | §6.1, §12.3, §12.4, new §12.4a |
| No other substantive change | — |

### v0.2 change log

| Change | Where |
|---|---|
| D-1: baseline rule recorded; SHA slot added | Header, P-01, H-19 |
| D-2 to D-5, D-7 to D-9 adopted as [LOCKED] invariants | §4.1, §4.2, §4.4, §4.5, new §4.14 |
| D-6 adopted in the founders' narrower form (no unpublished number, no implied Rated; findings may remain where methodology permits) | §4.14, H-08 |
| D-10: §6 file zones and §10 protections approved as the Wave 5 operating contract | §6, §10 |
| Approved correctives listed (they are governed correctives, not presentation work) | §6.1, §7 |
| H-10 replaced: `reviewedUnitSupport` runtime defect, corrected on physical device; 7 Oct speculative diagnosis withdrawn | §7 |
| §13 converted from "decisions requested" to the founder adjudication record | §13 |
| No other redesign or expansion. Certifications and P&R remain [PENDING-W4] | — |

---

## 0. How to read this document

Every statement carries one of three tags.

| Tag | Meaning | Who may change it |
|---|---|---|
| **[LOCKED]** | Founder-locked doctrine. Controls regardless of what the code currently does. | Founders only, via §12 |
| **[OBSERVED]** | What the repository does at `f0b2921`. Evidence, not authority. Where it conflicts with [LOCKED], the conflict is flagged; the code is **not** treated as authoritative. | Corrected through normal governed work |
| **[PENDING-W4]** | Placeholder for a Wave 4 parallel workstream (Certifications, Packaging & Recycling) whose accepted baseline will be added later. | Founders, when the baseline is accepted |

Line numbers refer to `f0b2921` and will drift. File paths are the durable reference.

---

## 1. Purpose and scope

**[LOCKED]** Wave 5 may change **how governed truth is presented and interacted with**. It may not independently redefine **how governed truth is established, resolved, scored, published or propagated**.

**[LOCKED]** UI implementation consumes governed outputs. It does not recreate governing logic in presentation components.

This document is **not** a design specification. The NZ founding partner and their Cursor workflow have broad freedom over layout, hierarchy, navigation, interaction and consumer experience. This document draws a boundary around what that freedom does not reach, and gives the implementing agent a practical way to tell which side of the boundary a change falls on.

**In scope:** the consumer app (`app/`, `src/`) and the Vercel authority backend (`backend/vercel/`), as they bear on Wave 5.
**Out of scope:** visual design choices; founder product decisions; the Wave 4A physical-device submission defect and its corrective (§7, H-10), except as a Wave 5 boundary.

---

## 2. Agent operating rule (place verbatim in the Cursor / AI working context)

```text
RVEEL WAVE 5 — CHANGE-CONTROL RULE (Doctrine v0.3)

Before modifying code, classify the proposed change GREEN, AMBER or RED against
the Rveel Wave 5 Architectural Doctrine.

- GREEN may proceed.
- AMBER must be surfaced for architectural assessment before implementation:
  state the proposed change, the invariant(s) it touches (INV-IDs), and why.
- RED must not be implemented without explicit founder approval.

If a visual requirement appears to require changing governed logic, STOP and
flag the dependency rather than solving it inside the UI.

Quick tests before every edit:
1. Does this file sit in a RED or AMBER zone (Doctrine §6.2)? If yes, it is not GREEN.
2. Does the UI read a score, state or label from anything other than the
   consumption contract (Doctrine §5)? If yes, it is not GREEN.
3. Would the governed outcome for the same evidence change (Doctrine §10)?
   If it could, it is not GREEN.
4. Am I deleting or weakening a test because the screen moved? Re-prove the
   control first (Doctrine H-13). Never delete it to make the build pass.
5. Am I importing or mounting something listed as dormant (Doctrine §8)?
   Reactivation is RED.
6. NR / Checking / missing publication: show no number, no score colour, no
   score label, and nothing that implies Rated. Fail closed. Never fall back
   to an internal score.
```

---

## 3. Architectural map

### 3.1 The governed spine **[OBSERVED]**

```text
Retrieval (OFF primary)            src/services/productServiceOptimized.ts, productService.ts
   │  governed transforms + Core Truth stamp
   ▼                               src/services/productEnhancementService.ts → stampCoreTruthAuthority
Core Truth authority gate          src/config/coreTruthProductCacheAuthority.ts  (hasCoreTruthAuthority)
   │
   ▼
Evidence Authority snapshot        src/evidenceAuthority/assessment.ts  (loadAuthoritativeAssessment,
   │  (server prevailing set)        projectSnapshotForAssessment, authoritativeStateSupersedes)
   │                               backend/vercel/api/evidence-authority.ts + src/evidenceAuthority/authority.ts
   ▼
Governed projection                src/contribution/governedDisplayProjection.ts   ← feeds SCORING despite the name
   │                               src/origins/governedFacts.ts, offUserPrecedence.ts
   │                               src/claims/packetClaimReceiver.ts
   │                               src/contributions/certificationLane.ts (Organic), eligibilityBoundary.ts
   ▼
Assessment orchestrator            src/utils/trustScore.ts → calculateTrustScore()  ← governed despite "utils"
   ▼
Scoring engine                     src/lib/truscoreEngine/index.ts → calculateTruScore()
   │                               pillars/{body,planet,ethics,open}Pillar.ts + *Registry.ts
   ▼
Rateability / Confidence / NR      src/lib/rateability/** → settleCrossPillarPublication()
   ▼
Governed outputs on the product    product._publication            (CrossPillarPublicationSnapshot)
                                   product._truscore_analysis      (fired ledger, source attribution)
                                   product.rveelGoverned*          (origins, packet claims, certifications)
                                   product.rveelPacketAbsenceEstablished
   ▼
Result orchestration               app/result/[barcode].tsx         ← mixes governed orchestration with layout (H-01)
   ▼
Presentation                       src/components/**, src/features/sharing/**
```

### 3.2 Parallel governed paths **[OBSERVED]**

| Path | Governing modules | Enters Result via |
|---|---|---|
| **Signals** | `src/dynamicSignals/**` (asset v0.2 matcher, product-scope guards, temporal policy, publication state engine), `src/identity/resolveSharedIdentityContext.ts`, `src/identity/chaining/brandEntityHierarchyMaps.ts`, `src/services/buildProductScanResult.ts`, `src/signals/signalRenderMapping.ts`, `src/utils/scanResultPresentation.ts` | `evaluateDynamicSignalsAssetProgressive` called from Result → `buildBannerAlertsDataFromScanResult` → `BannerAlertsCard` |
| **Benchmarks / entity chain (Claims pillar)** | `src/benchmark/**`, `src/lib/truscoreEngine/pillars/ethicsBenchmarkAdapter.ts`, `src/data/ethics/*.json`, `src/services/{ktc,bbfaw}BrandResolutionService.ts` | Inside `calculateEthicsPillar` |
| **Contribution journey** | `src/components/PacketContributionModal.tsx` (submit orchestration), `src/packetContribution/**`, `src/evidenceImage/**`, `src/evidenceAuthority/device.ts`, `contributionTrace.ts` | `resultContributionActions` → `openContribution` → modal → authority → `subscribeEvidenceAdmission` → Result reassessment |
| **Score Highlights** | `src/lib/scoreHighlights/**` | `firedLedgerFromTruScoreResult` → `selectScoreHighlights` in Result |
| **Nutrition assessment** | `src/nutrition/**` | `NutritionTable`, `NutritionDetailsModal`, Claims nutrient context |
| **Certification resolution** | `src/certifications/**` | Packet information journey, `CertBadge`, Packet Claims card |
| **Launch-time recovery** | `app/_layout.tsx` → `retryUnsentEvidenceSubmissions`, `resumeEvidenceImages`; `src/evidenceImage/resumeGuard.ts` | App start |

### 3.3 Authority vs adapter vs presentation

| Class | Rule | Examples |
|---|---|---|
| **Governing logic** | RED to change behaviour | `lib/truscoreEngine/**`, `lib/rateability/**`, `evidenceAuthority/authority.ts`, `backend/vercel/api/evidence-authority.ts`, `dynamicSignals/**`, `identity/**`, `benchmark/**`, `certifications/resolveCertification.ts`, governed assets |
| **Governed adapters** (shape governed output for display; contain guardrails) | AMBER | `utils/trustScore.ts`, `contribution/governedDisplayProjection.ts`, `contribution/resultContributionActions.ts`, `contribution/consumerSurface.ts`, `origins/productOriginsCard.ts`, `utils/truScorePresentation.ts`, `utils/shareScoreSemantics.ts`, `utils/scanResultPresentation.ts`, `signals/signalRenderMapping.ts`, `lib/scoreHighlights/l3/hostPresentation.ts` |
| **Presentation** | GREEN, provided it reads only the §5 contract | Component layout, styles, iconography, navigation, copy that does not alter governed meaning |

`app/result/[barcode].tsx` and `src/components/PacketContributionModal.tsx` are **mixed**. Their layout is GREEN; their orchestration blocks are AMBER (§6.2).

---

## 4. Protected invariants by domain

Each domain gives: the locked invariants, the repository boundary, the interface Wave 5 consumes, and observed conflicts or hazards (detail in §7).

### 4.1 Scoring

**[LOCKED]**
- **INV-SC-1** Pillar methodologies, methodology versions, baselines and adjustment arithmetic are founder-governed.
- **INV-SC-2** The fired adjustment ledger is produced by the scoring run and is the only record of what moved a score.
- **INV-SC-3** Assessed-neutral and unassessed are different states and must stay distinguishable.
- **INV-SC-4** Only Rated pillars and a Rated Overall publish a number. NR and Checking publish no number.
- **INV-SC-5** Same governed evidence → same governed outcome (deterministic).
- **INV-SC-6** UI code must not manufacture scores, default scores, scoring events or assessment states. No `?? 0`, `|| 0`, default 15 or synthetic ledger rows in presentation.
- **INV-SC-7** *(D-2, v0.2)* Every score-derived consumer visual treatment (colour, band, label, emphasis, icon, ring, share framing) uses **published** state only. NR and Checking never inherit a colour or label from an internal score.
- **INV-SC-8** *(D-4, v0.2)* Consumer presentation paths fail closed. A missing or incomplete publication object never means "show the internal score instead"; it means show no score.
- **INV-SC-9** *(D-9, v0.2)* `RVEEL_SCORE_METHODOLOGY_VERSION` (`'1.4'`) is not authoritative for consumer display. Wave 5 must not expose it. Consolidated methodology versioning is separate governance work.

**[OBSERVED] Boundary**
- Engine: `src/lib/truscoreEngine/index.ts` (`calculateTruScore`, `buildTruScoreAnalysis`); pillars `pillars/bodyPillar.ts` + `bodyPillarV12Registry.ts`, `planetPillar.ts` + `planetPillarV19Registry.ts` + `planetPackagingFallback.ts`, `ethicsPillar.ts` + `ethicsPillarV37Registry.ts`, `openPillar.ts` + `openPillarV15Registry.ts` + `openPillarOriginsV15.ts` + `openPillarIngredientsLanguage.ts` + `openPillarHiddenTerms.ts`; `bodyAdditiveScoring.ts`; `claims/**`.
- All four pillars use base 15. Overall is the clamped sum (`index.ts` L207). A technical failure yields `scoringUnavailable` and `truscore: null`, never a numeric 0.
- Orchestrator: `src/utils/trustScore.ts` `calculateTrustScore()` (L68). It loads the authority snapshot, projects governed evidence, applies the Organic reactivation (L134), and calls the engine.
- Ledger: `product._truscore_analysis`; consumed via `lib/scoreHighlights/firedLedger.ts`.
- Shadow: `lib/truscoreEngine/bodyShadow/**` (Nutri-Score 2023) is **unreachable from the app** and must stay shadow-only.

**Consume:** `product._publication.<pillar>.publishedScore`, `product._publication.overall.publishedScore`, `firedLedgerFromTruScoreResult(truScore)`.

**Conflicts / hazards:** H-02, H-04, H-05, H-12, H-14. H-02, H-04 and H-05 are now approved correctives (§6.1).

### 4.2 Rateability

**[LOCKED]**
- **INV-RA-1** Rateability is a governed assessment state, not a display preference.
- **INV-RA-2** Substantive-lane resolution decides NR / partially resolved / fully resolved.
- **INV-RA-3** UI must not infer Rateability from whether a score exists, or from missing display fields.
- **INV-RA-4** Any pillar NR → Overall NR. No renormalisation.
- **INV-RA-5** *(D-8, v0.2)* NR is semantically distinct from technical unavailability. NR means there is not enough governed information to publish the score; "unavailable" means a technical failure. Wave 5 preserves the distinction on every surface, including share. Exact consumer copy is a Wave 5 consumer-design matter.

**[OBSERVED] Boundary**
- `src/lib/rateability/**`: `settlePublication.ts` (orchestrator), `bodyPublication.ts`, `planetPublication.ts`, `claimsPublication.ts`, `transparencyPublication.ts`, `overallPublication.ts`, `sourceQuality.ts`, `types.ts`.
- Lanes are `resolved` / `unassessed` (Body: nutrition, processing; Planet: broad_environment, packaging_fallback; Claims: packet, benchmark; Transparency: ingredient_clarity, origins incl. `assessed_unresolved_conflict`).
- Publication status is `checking` / `nr` / `rated`. "Partially resolved" is expressed as **Rated with one lane unassessed** (Limited Confidence plus a live contribution opportunity). There is no separate `partial` status value. Wave 5 must render partial resolution from the lanes, not invent a third status.
- First-paint barrier: `publicationSettled` (`TruScoreScoringContext`) keeps everything `checking` until settlement. Result latches settlement per barcode (`publicationSettledRef`, Result L398; `acceptProductUpdate` L1028).

**Consume:** `product._publication.<pillar>.publicationStatus`, `.assessmentLanes`, `settled`; helpers `publishedScoreDisplay`, `overallConfidenceLabel`, `getTruScoreConsumerPresentation`.

**Conflicts / hazards:** H-01 (latch lives in the screen), H-02, H-08, H-20.

### 4.3 Confidence

**[LOCKED]**
- **INV-CF-1** Confidence is distinct from Rateability.
- **INV-CF-2** Confidence derivation and source/evidence characteristics are governed.
- **INV-CF-3** Confidence must not become a proxy for Rateability, a reason by itself to solicit contribution, a UI-derived state, or a substitute for evidence resolution.

**[OBSERVED] Boundary**
- Pillar Confidence: the `publish*Pillar` functions in `lib/rateability/`. Overall = weakest Rated pillar (`overallPublication.ts`). High needs `authoritativeLaneOverrides`, which nothing in production supplies.
- Primary-contribution dependence downgrades Confidence to Limited (`bodyPublication.ts` L128–132 and the equivalents).
- Consumer badge: `src/components/ConfidenceBadge.tsx` reads `publication.overall` only. **Conforms.**
- Contribution opportunity is computed from lanes, not Confidence (`bodyPublication.ts` `bodyContributionOpportunity`). **Conforms to INV-CF-3.**
- Legacy numeric `product.confidence` (0–1) is still stamped by `src/utils/confidenceScoring.ts` for diagnostics. **It must never drive UI** (H-12).

**Consume:** `product._publication.<pillar|overall>.confidence`, `.confidenceReasonCode`, `.s26`.

### 4.4 Contribution opportunity

**[LOCKED]**
- **INV-CO-1** Chain: governed evidence → assessment / Rateability state → contribution opportunity → contextual journey → admission → reassessment → updated Rateability / Confidence / publication.
- **INV-CO-2** NR or partially resolved consumer-resolvable evidence may solicit. Fully resolved evidence removes the assessment-driven **Add**; **Change** and **Remove** may remain.
- **INV-CO-3** Action semantics: **Add** = contribute something not currently held; **Change** = amend a current proposition; **Remove** = explicitly make a current proposition non-current; **Yes** = confirm a machine-proposed observation is on the pack.
- **INV-CO-4** Confidence does not decide whether Add is required.
- **INV-CO-5** *(D-5, v0.2)* Contribution solicitation is governed by assessment / publication lanes only. Score Highlights, the fired ledger, or any other logic must not independently create a contribution need. Copy may explain a governed need; it may not invent one.

**[OBSERVED] Boundary**
- Predicates: `src/contribution/resultContributionActions.ts` → `resultContributionActions(product)`. Inputs are publication lanes only; it returns all-false until `publication.settled`. **Conforms.**
- Vocabulary and row rules: `src/contribution/consumerSurface.ts` (Add hides held propositions; Change opens current ones; removing the last origin closes without replacement).
- Correction closure: `src/contribution/correctionClosure.ts` → `ceasedSubjectKeys` → server withdrawal.
- Yes / Change / Remove strings: `src/certifications/resolveCertification.ts` L16–19.
- Pillar opportunity objects: `publication.<pillar>.s26.contributionOpportunity`.

**Consume:** `resultContributionActions(product)`, `consumerSurface.ts` helpers, `openContribution(entryContext, mode)` in Result.

**Conflicts / hazards:** H-06 (second, ledger-based solicitation source; realignment approved), H-07 (presence-based `certificationsAction`).

### 4.5 Evidence Authority

**[LOCKED]**
- **INV-EA-1** The Evidence Authority is the admission authority for governed user contributions.
- **INV-EA-2** Preserve provenance, evidence classes, admission, authoritative snapshots, idempotency, current / superseded / withdrawn state, version history, retry and fail-closed behaviour, and reassessment from authoritative state.
- **INV-EA-3** Local form or session state is not authoritative evidence. No scoring from unsent or merely locally saved contributions.
- **INV-EA-4** *(D-7, v0.2)* Legacy manual-product scoring and submission (`ManualProductEntryModal` → `saveManualProduct` → local score, `/api/manual-products`, OFF) is **not an approved Wave 5 architecture**. Wave 5 must not reuse or expand it. Replacing unknown-product contribution through governed contribution / Evidence Authority architecture is separate work and does not block Wave 5.

**[OBSERVED] Boundary**
- Server: `backend/vercel/api/evidence-authority.ts`, `backend/vercel/lib/evidenceAuthorityPg.ts`, `src/evidenceAuthority/authority.ts` (`EvidenceAuthority`, `snapshotFrom` L708).
- Client: `src/evidenceAuthority/device.ts` (outbox, `transmitSessionToAuthority`, `transmitPrevailingClosure`, retries, `subscribeEvidenceAdmission`), `assessment.ts` (snapshot load, environment match, bounded 12 h read cache, supersession), `subjects.ts`, `manualTextAsset.ts`, `contributionTrace.ts`.
- Client authority fields are ignored by the server (`EvidenceSubmissionInput.clientAuthority`).
- `loadAuthoritativeAssessment` explicitly does not read local unsent rows. **Conforms to INV-EA-3** on the governed path.
- Retired legacy paths: `/api/contribution-evidence` (read-only, not read by assessment); `/api/off-product-write` (retired relay).

**Consume:** the modal's existing submit pipeline, `subscribeEvidenceAdmission`, `rememberedAuthoritativeSnapshot`, `authoritativeStateSupersedes`, `calculateTrustScore(product, { authoritativeSnapshot })`.

**Conflicts / hazards:** H-09 (legacy manual-product path scores locally), H-10 (closed submit defect; corrective SHA to be recorded), H-01.

### 4.6 Prevailing evidence and withdrawal

**[LOCKED]**
- **INV-PE-1** Presentation and assessment use prevailing governed evidence.
- **INV-PE-2** Source- and subject-specific precedence rules are preserved.
- **INV-PE-3** A withdrawn current proposition does not automatically resurrect an older superseded version, whether the consumer or a founder/admin withdraws it. Reinstatement requires a deliberate governed action.
- **INV-PE-4** History is preserved for provenance.

**[OBSERVED] Boundary**
- No-resurrection: `authority.ts` `snapshotFrom` L720–724 takes the latest admitted version per subject and **drops the subject** if that version is withdrawn or suppressed. **Conforms.**
- Withdrawal on correction: `authority.ts` L159–197, L417 (`ceasedSubjectKeys`). Founder/admin: L552–565.
- Precedence: `src/origins/offUserPrecedence.ts` (admitted facts prevail over OFF for the same subject; OFF fields stay on the product); `origins/governedFacts.ts` `selectPrevailingOriginFacts`; `claims/packetClaimReceiver.ts` `selectPrevailingPacketClaims`; `governedDisplayProjection.ts` `projectGovernedNutriments`, `selectPrevailingGovernedIngredientsText`.
- Non-detection is not removal: `resolveCertification.ts` `retainCurrentDespiteNonDetection`.

**Consume:** `product.rveelGovernedOrigins`, `rveelGovernedPacketClaims`, `rveelGovernedCertifications`, `rveelPacketAbsenceEstablished`, `projectOriginConsumerLines`, `productOriginsCardPresentation`.

**Conflicts / hazards:** H-18 (packet-line composition duplicated inline).

### 4.7 Entity resolution and chaining

**[LOCKED]**
- **INV-EN-1** The chain from product / brand evidence through aliases, operational entities and canonical parents is governed.
- **INV-EN-2** No alternative brand or parent resolution in UI; no bypass of governed aliases or parent maps.
- **INV-EN-3** Any change that could affect scoring, Signals or attribution through entity resolution needs architectural review.

**[OBSERVED] Boundary**
- `src/identity/resolveSharedIdentityContext.ts` (normalizer `phase6-slice1-v1`), `src/identity/chaining/brandEntityHierarchyMaps.ts`, `src/identity/workstreamA/**` + `workstreamA/a-data/`, `src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts`, `src/benchmark/**`, `src/data/ethics/*.json` (BBFAW/KTC canonical sets, parents, alias maps), `src/services/{ktc,bbfaw}BrandResolutionService.ts`.
- Signals and identity inputs require the Core Truth stamp: `authoritativeProductForScan` (Result L178).
- No UI component performs brand/parent resolution today. **Conforms.** Dormant legacy brand matchers exist and must stay dormant (§8).

**Consume:** nothing directly. Wave 5 displays entity-derived results only through Signals cards and Claims pillar output.

### 4.8 Signals

**[LOCKED]**
- **INV-SG-1** Signal eligibility, targeting, product/entity matching, chain resolution, guardrails and publication behaviour are governed.
- **INV-SG-2** Wave 5 may redesign cards, hierarchy, navigation and explanation. It may not broaden matching, infer applicability, remove guardrails or recreate eligibility in UI code.

**[OBSERVED] Boundary**
- Producer and asset: `src/dynamicSignals/asset/v0.2/**` (embedded runtime asset, `matchDynamicSignalsAsset`, `cocoaChocolateProductScopeGuard`, `assetSignalTemporalPolicy`, `signalsProducerGuard`), `dynamicSignals/productScope/**`, `dynamicSignals/publish/**` (class gate, validity, publication state engine), `src/config/mvpReleaseDynamicSignalsAsset.ts`.
- Result orchestration (L840–950): authority-gated eval context, eval key, stale-commit guard, NA-022 clear on authority loss.
- **Presentation-layer guardrails (treat as governed):** `src/utils/scanResultPresentation.ts` (dedupe by `dedupe_key`, highest severity wins, Class C excluded from banner, non-A cap) and `src/signals/signalRenderMapping.ts` (`isPublicationRecordPubliclyRenderable` validity check, class → bucket).
- Founder decision on record: the current corpus expires naturally; zero cards until the next governed refresh is expected, not a regression.

**Consume:** `bannerAlerts` (`buildBannerAlertsDataFromScanResult(scanResult, t)`) and `BannerAlertsCard` props.

**Conflicts / hazards:** H-01, H-11.

### 4.9 External evidence and source provenance

**[LOCKED]**
- **INV-PV-1** Keep these distinct: Open Food Facts evidence; governed user contributions; governed Rveel datasets; external benchmark / certification / regulatory sources; machine-generated proposals.
- **INV-PV-2** Presentation may combine information for consumers but must not silently change its provenance or let one source masquerade as another.

**[OBSERVED] Boundary**
- Projection keeps OFF originals beside governed values (`rveelSourceNutriments`, `rveelSourceIngredientsText`, `rveelSourceNutritionDataPer`, `rveelProjectionBound`) in `trustScore.ts` L118–129.
- Snapshot rows carry `subjectKey`, `versionId`, `admissionSeq`, `governance`. OFF dispatch carries lineage (`OffFieldLineage`).
- Source quality class: `lib/rateability/sourceQuality.ts`.
- Machine proposals are `origin: 'machine_proposal'` on `PacketEvidenceUnit` (`packetContribution/types.ts`).

**Consume:** governed fields as listed in §5. Where a line mixes OFF and contributed values, keep the governed adapter that builds it (for example `projectOriginConsumerLines`), so attribution stays where it is decided.

**Conflicts / hazards:** H-09, H-12.

### 4.10 Machine extraction / VLM / OCR

**[LOCKED]**
- **INV-MX-1** Machine extraction proposes evidence. It never establishes governed truth.
- **INV-MX-2** Chain: capture → extraction / proposal → consumer review where required → governed admission → authoritative snapshot → assessment.
- **INV-MX-3** UI experiments must not let VLM / OCR output bypass resolution or admission.

**[OBSERVED] Boundary**
- `src/packetContribution/extraction.ts`. The default producer is `abstainingExtractionProducer` (no provider configured; returns `abstained`).
- Review state: `ProposalStatus` `open` / `set_aside` / `reviewed`.
- Certification proposals: `resolvePacketObservation` ignores `proposedCertificationId` unless the wording independently establishes that identity.
- Image capture and retention: `src/evidenceImage/**`.
- `src/services/photoOcrService.ts` is unreachable legacy (§8).

**Consume:** the existing review step in `PacketContributionModal`. Any new capture UX hands units into the same session and review path.

### 4.11 Certifications — parallel protected workstream **[PENDING-W4]**

See §9.1.

### 4.12 Packaging & Recycling — parallel protected workstream **[PENDING-W4]**

See §9.2.

### 4.13 Retired / dormant functionality

**[LOCKED]** **INV-DM-1** Wave 5 refactoring must not reactivate legacy functionality merely because code or data remains available. Reactivation is RED.

Inventory in §8.

### 4.14 Score Highlights publication boundary *(D-6, v0.2)*

**[LOCKED]**
- **INV-SH-1** Score Highlights must never reveal an unpublished numeric pillar score, on any surface or navigation path.
- **INV-SH-2** Highlights must not imply that an NR or Checking pillar is Rated, and must not expose its internal arithmetic (no `NN/25`, no score-derived colour or band, no "score" framing).
- **INV-SH-3** Governed findings may still be presented where governed methodology permits, including for a pillar that is not publishing a score. Substantive findings and NR can coexist. This invariant does **not** require hiding all findings for a non-Rated pillar.
- **INV-SH-4** Once a pillar is Rated, Highlights may explain what moved it.

**[OBSERVED] Boundary:** `src/lib/scoreHighlights/**`; Result L626–660 (selection) and L1888–1896 ("What we found"); `ScoreHighlightsLookThroughModal.tsx` header (`pillarScore` L159–168). See H-04 and H-08.

**Consume:** `selectScoreHighlights(...)` output for findings; `publication.<pillar>.{publicationStatus, publishedScore}` for any number or state shown beside them.

---

## 5. Consumption contract — what Wave 5 UI may and may not read

This is the most practical section for the implementing agent.

### 5.1 MAY read (governed outputs)

| Need | Read |
|---|---|
| Overall score / state | `getTruScoreConsumerPresentation(truScore, { publicationSettled })` → `kind`, `score`; `product._publication.overall.{publicationStatus, publishedScore, confidence, s26}` |
| Pillar score / state | `product._publication.{body, planet, claims, transparency}.{publicationStatus, publishedScore, confidence, s26, assessmentLanes}` |
| Display number formatting | `publishedScoreDisplay()`, `overallConfidenceLabel()` (`src/lib/rateability`) |
| Consumer pillar names | `consumerPillarLabel()` (`src/lib/scoreHighlights`) |
| What moved the score | `firedLedgerFromTruScoreResult(truScore)` → `selectScoreHighlights(...)` |
| Contribution entry points | `resultContributionActions(product)`; `consumerSurface.ts` helpers |
| Origins | `productOriginsCardPresentation(product)`, `projectOriginConsumerLines(facts)` |
| Packet information | `product.rveelGovernedPacketClaims`, `rveelGovernedCertifications`, `rveelPacketAbsenceEstablished`, `resultPacketInformationLines()`, `displayCertificationName()`, `consumerCertificationLine()`, `consumerEmblemPermitted*()` |
| Nutrition levels | `assessGovernedNutrients` / `hasGovernedHighNutrient` from `src/nutrition` (call them; do not reimplement thresholds) |
| Signals | `bannerAlerts` from `buildBannerAlertsDataFromScanResult` |
| Share score | `resolveShareOverallScore`, `resolveGenuinePillarBreakdown` (`src/utils/shareScoreSemantics.ts`) |
| Additives | `s25` merge outputs (`mergeRenderedAdditives`, `renderedAdditiveIds`) |

### 5.2 MUST NOT read for consumer display

| Field / value | Why |
|---|---|
| `product.trust_score`, `truScore.truscore` | Internal arithmetic; numeric while NR / Checking |
| `product.trust_score_breakdown.*`, `truScore.breakdown.*` | Internal pillar scores, plus legacy `sustainability`, `bodySafety`, `processing`, `transparency`, `reasons` (H-12) |
| `publication.*.internalScore`, `.diagnostic` | Diagnostic only (S28) |
| `product.confidence`, `sourceReliability` | Legacy numeric confidence (H-12) |
| `_truscore_metadata.hasEcoScore`, `ecoscore_grade` for display | Legacy Eco-Score display is retired (§8) |
| Raw OFF fields where a governed projection exists (`origins`, `manufacturing_places`, `labels_tags`, `nutriments` before projection) | Bypasses precedence and provenance |
| Local session / outbox / form state as product truth | INV-EA-3 |
| `RVEEL_SCORE_METHODOLOGY_VERSION` | Not authoritative for consumer display (INV-SC-9) |

**Existence is not state.** "There is a number" never means Rated. "There is no field" never means NR. Read `publicationStatus`.

---

## 6. Change-control model

**[LOCKED] (D-10, v0.2)** The §6 file zones and the §10 invariant and CI protections are the Wave 5 operating contract.

### 6.1 Green / Amber / Red matrix

| Level | Change type | Rule |
|---|---|---|
| **GREEN — proceed** | Layout; typography; visual hierarchy; spacing; card composition; animation; navigation; interaction ergonomics; iconography; progressive disclosure; consumer-natural explanatory copy where governed meaning is unchanged; relocating existing governed information or actions; combining or separating visual containers where governed semantics stay intact; extracting a **pure presentation** sub-component that receives §5.1 values as props | Must not alter the inputs or outputs of governed logic. Must read only §5.1 |
| **AMBER — stop and assess** | Anything touching or potentially changing: assessment state; Rateability; Confidence; contribution solicitation or state; evidence selection or precedence; correction or removal behaviour; source provenance; certification identity or scope; entity resolution or chaining; Signal targeting; authoritative snapshot consumption; external-source interaction; any governed data contract (`ProductWithTrustScore`, `CrossPillarPublicationSnapshot`, `SharedEvidenceSnapshot`, `PacketEvidenceUnit`, Signal records). **Also AMBER:** moving or splitting the orchestration blocks of `app/result/[barcode].tsx` or `PacketContributionModal.tsx` (§6.2); editing governed copy constants (S26, contribution notices, Yes/Change/Remove, L3 content); re-pointing or rewriting a test that asserts a governed control (H-13); wiring `userContributionRouteLive`; showing any element during `checking` that was hidden before | Flag the change, the INV-IDs and the reason **before** coding |
| **RED — founder approval** | Scoring weights, rules, baselines; methodology changes; NR / Rated gates; Confidence derivation; Overall TruScore publication; evidence admission; prevailing-evidence and withdrawal semantics; canonical entity relationships; certification scoring mappings; Signal eligibility or guardrails; governed datasets / assets; source-of-truth architecture; bypassing the Evidence Authority or governed resolver paths; **reactivating any §8 dormant item**; flipping any `MVP_RUNTIME` gate or `PALM_OIL_PRODUCT_CARD_VISIBLE`; enabling a non-abstaining extraction producer | Not implemented without explicit founder approval |

**Approved governed correctives (v0.2; packaging rule v0.3).** Founders have approved the following corrections in principle. They are **not** presentation work. Until a corrective lands, Wave 5 must not build on the defective behaviour.

**[LOCKED] (v0.3) Wave 5 baseline corrective package.** C-1 to C-4 may be implemented together as **one tightly bounded Wave 5 baseline corrective package**, under the governed-corrective package rule in §12.4a. Within the package:
- each corrective stays **logically and evidentially separable**: its own stated required outcome (table below) and its own behavioural / regression evidence that demonstrates that outcome independently;
- the package stays **separate from Wave 5 presentation / restyling work**. No visual redesign, UX experimentation or unrelated refactoring is bundled into it;
- independent review, where commissioned, may assess the package **as a whole**. Four separate review exercises are not required. Any failure or ambiguity must still be attributed to the individual C-1, C-2, C-3 or C-4 requirement;
- the correctives may equally be delivered separately; packaging is permitted, not mandatory.

| Corrective | Decision | Hazard | Required outcome |
|---|---|---|---|
| C-1 Score-derived visuals use published state | D-2 | H-02, H-03 | Border colour, bands, labels and share framing derive from published state; NR / Checking are neutral (INV-SC-7, INV-RA-5) |
| C-2 Highlights receive published pillar scores | D-3, D-6 | H-04 | All four pillars passed from `publication.<pillar>.publishedScore`; no internal NR / Checking number reachable by any navigation (INV-SH-1, INV-SH-2) |
| C-3 Remove internal-score fallbacks | D-4 | H-05 | `TruScore.tsx`, `truScorePresentation.ts`, `shareScoreSemantics.ts` fail closed when publication is missing (INV-SC-8) |
| C-4 Realign contextual prompts to lanes | D-5 | H-06 | Prompts are driven by governed lanes / contribution opportunity; the ledger cannot create a contribution need (INV-CO-5) |

C-1 to C-4 change publication-adjacent behaviour, so they carry RED-level care, but founder approval for them is recorded here. Any scope beyond the "required outcome" column returns to AMBER / RED change control as specified in §6.1 and §12.

### 6.2 File zones (fast classification for Cursor)

**RED zone — behaviour changes are RED; any edit is at least AMBER**

```text
src/lib/truscoreEngine/**            src/lib/rateability/**
src/evidenceAuthority/authority.ts   src/evidenceAuthority/subjects.ts
src/evidenceAuthority/schemaSql.ts   src/evidenceAuthority/manualTextAsset.ts
backend/vercel/api/evidence-authority.ts   backend/vercel/lib/evidenceAuthorityPg.ts
backend/vercel/api/evidence-image-lifecycle.ts   backend/vercel/api/off-image-dispatch.ts
src/contributions/**                 src/config/contributionPolicy.ts
src/dynamicSignals/**                src/identity/**        src/benchmark/**
src/workstreamA|B|C/**  + workstreamA/a-data, workstreamB/b-data, workstreamC/c-data
src/data/ethics/**                   src/s25/assets/**
src/certifications/governed/*.csv    src/certifications/governedCsv.ts
src/nutrition/**                     src/claims/definitions.ts, governance.ts
src/config/mvpRuntimeGates.ts        src/config/coreTruthProductCacheAuthority.ts
src/config/mvpReleaseDynamicSignalsAsset.ts   src/config/methodologyVersion.ts
src/packetContribution/extraction.ts
```

**AMBER zone — governed adapters and orchestration**

```text
src/utils/trustScore.ts                     src/contribution/**
src/evidenceAuthority/{device,assessment,contributionTrace,store,memoryStore}.ts
src/packetContribution/** (except extraction.ts, which is RED)
src/evidenceImage/**                        src/origins/**
src/claims/packetClaimReceiver.ts           src/ingredientsNutrition/**
src/certifications/resolveCertification.ts  src/certifications/unresolvedMarkCandidates.ts
src/utils/truScorePresentation.ts           src/utils/shareScoreSemantics.ts
src/utils/scanResultPresentation.ts         src/signals/signalRenderMapping.ts
src/services/buildProductScanResult.ts      src/services/product*Service*.ts, productEnhancementService.ts
src/lib/scoreHighlights/**                  src/features/sharing/services/**
app/_layout.tsx (evidence retry / resume wiring only)
app/result/[barcode].tsx — orchestration blocks:
    authoritativeProductForScan (L178), publication latch (L394–L499),
    subscribeEvidenceAdmission + reassessment (L500–L520, onSharedEvidenceAdmitted L2553+),
    truScore construction (L568–L615), Score Highlights selection (L626–L660),
    Signals eval context / effect (L840–L950), acceptProductUpdate (L1028–L1080),
    product load / manual-product branch (L1085–L1260), handleManualProductSave (L1420+)
src/components/PacketContributionModal.tsx — submit / handoff / transmit / retry / trace
```

**GREEN zone — presentation, provided §5 is respected**

```text
src/components/** (other than PacketContributionModal orchestration)
src/features/** presentation, src/theme/**, src/navigation/**, src/i18n/** (non-governed strings)
app/** layout and styles
```

A GREEN-zone file becomes AMBER the moment it imports from a RED-zone module that is not listed in §5.1.

---

## 7. Known implementation hazards

Severity is a reviewer suggestion for founder triage. "Conflict" means [OBSERVED] contradicts [LOCKED]. Findings are [OBSERVED] at `f0b2921`; founder dispositions are [LOCKED] from v0.2.

| ID | Sev | Type | Finding (at `f0b2921`) | Wave 5 rule |
|---|---|---|---|---|
| **H-01** | P1 risk | Refactor hazard | `app/result/[barcode].tsx` (3,603 lines) is both the layout **and** the governed orchestrator. It holds the Core Truth gate for Signals and identity, the publication latch, admission subscription and reassessment, snapshot supersession, Signals evaluation and stale-commit guard, the NA-022 stale-card clear, and the manual-product branch. A layout refactor that splits or reorders hooks can silently break any of these. | Extracting orchestration into hooks or modules is AMBER and must be **behaviour-preserving**, proved by §10 suites R-3, R-7, R-9 and R-10 before and after. Presentation can be extracted freely as pure components fed §5.1 props. Do not duplicate orchestration in a new screen; move it. **Founder position (v0.2):** this finding does not trigger a pre-emptive architecture refactor. Extract pure presentation freely; move orchestration only where Wave 5 genuinely needs it, as AMBER. |
| **H-02** | P2 | Conflict (INV-SC-4, INV-RA-3) | The Rveel Score card border colour comes from the internal overall score: `borderColor: getTruScoreColor(truScore.truscore)` (L1802). For an NR or Checking product with an internal score, the border shows the internal band. **Disposition (D-2): correction approved — C-1.** Colour, label or emphasis derived from score must use published state (Rated only) and be neutral otherwise (INV-SC-7). Fix as a governed corrective, not inside a restyle. |
| **H-03** | P3 | Conflict (semantics) | Share type is chosen from internal `product.trust_score < 40` (L1838). The builder fails closed, but for NR it emits "Rveel Score unavailable", which conflates NR with technical unavailability. **Disposition (D-8):** NR must not be presented as technical failure (INV-RA-5). Share framing branches on `publicationStatus` (part of C-1). Exact NR share copy is a Wave 5 consumer-design matter. |
| **H-04** | P2 latent | Latent leak | The Score Highlights look-through receives `pillarScores = { ...truScore.breakdown, Ethics: <published> }` (L2420–2428), so Body, Planet and Open are **internal** scores. The modal header prints `NN/25` (`ScoreHighlightsLookThroughModal.tsx` L159–168). Today this is unreachable for NR pillars because NR rows are not tappable and story detail does not navigate back to a pillar. **Any Wave 5 navigation that opens a pillar view directly (tabs, deep links, swipe) would reveal internal NR scores.** **Disposition (D-3): correction approved — C-2.** Highlights receive published pillar scores for all four pillars (INV-SH-1). C-2 must land before any Wave 5 navigation change to Score Highlights. |
| **H-05** | P2 latent | Latent leak | Legacy fallbacks to internal scores when no publication object is present: `TruScore.tsx` `pillarPublished` falls back to `breakdown[pillar]` (L79–81); `getTruScoreConsumerPresentation` falls back to `truScore.truscore` (`truScorePresentation.ts` L112–114); `resolveShareOverallScore` likewise (`shareScoreSemantics.ts` L37). A new Wave 5 component that builds a `TruScoreResult` without `publication` reveals internal arithmetic. **Disposition (D-4): remove from consumer presentation paths — C-3.** Missing publication fails closed (INV-SC-8). Until C-3 lands, always pass the full `TruScoreResult` from Result, including `publication`, and never construct one in a component. |
| **H-06** | P2 | Conflict if activated (INV-CO-1, INV-CO-4) | There are two contribution-solicitation sources. (a) **Governed**: publication lanes → `resultContributionActions` and `s26.contributionOpportunity`. (b) **Ledger-based**: `lib/scoreHighlights/contextualContributionPrompts.ts` decides "we need more information" prompts from fired-ledger movement, not from lanes. Its action anchor is dormant because `userContributionRouteLive` is never passed as `true`, but the L2 copy renders. Its Planet base prompt solicits ingredients to support Green-Score. **Disposition (D-5): realign to governed lanes — C-4** (INV-CO-5). Until C-4 lands, do not wire `userContributionRouteLive` or add Add actions to look-through prompts. |
| **H-07** | P3 | Conflict if used (INV-RA-3) | `resultContributionActions().certificationsAction` is derived from the **presence** of certifications, not assessment (L46). Nothing reads it today. | Do not use it. Use `packetInformationAction`. |
| **H-08** | P3 | Resolved by doctrine | Score Highlights "What we found" renders whenever a ledger exists (Result L1888–1896). It is not gated by pillar publication status or by `publicationSettled`. A product can therefore show findings for an NR pillar, or while the score card says "Seeing what we can find…". | **Disposition (D-6, narrowed):** findings may remain where governed methodology permits, including for a non-Rated pillar (INV-SH-3). They must never show an unpublished number or imply NR / Checking is Rated (INV-SH-1, INV-SH-2). Any new Highlights surface (share card, list row, tab) is AMBER and must be checked against INV-SH-1..4. Whether findings should show **during Checking** on a given surface is a consumer-design question within INV-SH-2. |
| **H-09** | P2 | Conflict (INV-EA-3, INV-PV-1) | The legacy manual-product path is live from the Unknown Product state ("Add Product Information", L1551 → `handleManualProductSave` → `saveManualProduct`, L1687). `manualProductService.ts` computes a **local TruScore** with `|| 0` coercion (L117–120), writes it to cache, SQLite and AsyncStorage, and posts to `/api/manual-products` and OFF, all outside the Evidence Authority. It is contained today because the Result score card needs the Core Truth stamp (manual objects are unstamped) and because the cross-user merge (`productCacheService.mergeUserContributedData`) applies only photo and allergens. **Disposition (D-7): retire / reroute, do not extend** (INV-EA-4). Wave 5 must not surface `trust_score` from manual products, extend the manual journey, or reuse `ManualProductEntryModal` or `manualProductService` elsewhere. Wave 5 may restyle the existing Unknown Product entry point without changing what it calls. Replacement through the Evidence Authority is separate work (RED) and does not block Wave 5. |
| **H-10** | Closed (SHA to record) | Defect — corrected | **Updated v0.2.** Wave 4A physical-device submission failure. Root cause, as established by the founders on the physical NZ device after the 7 Oct forensic QA: a missing `reviewedUnitSupport` runtime defect in the local contribution handoff. The corrected local contribution path has been demonstrated working on the device. The speculative 7 Oct diagnoses (session-history replay; Android store size) are **withdrawn** and are not carried as an open root cause. **Final corrective SHA:** `99102768b61bd6e518bb889e3ab6f01dfc3e1268` *(founder-accepted B0, 8 Oct 2026; `fix(contribution): import reviewedUnitSupport into Submit`)*. Claude has not independently re-verified the corrective; that is the normal assurance step once the SHA is pushed. | Once the corrective SHA is in the Wave 5 baseline, the modal's submit / handoff / transmit / retry / trace code returns to its ordinary AMBER-zone classification (§6.2). Until then, Wave 5 does not touch that code. The §7 physical-device acceptance test from the 7 Oct QA remains the right acceptance evidence for the corrective. |
| **H-11** | P2 risk | Naming hazard | Governed code lives under presentation-sounding names: `utils/trustScore.ts` (assessment orchestrator); `contribution/governedDisplayProjection.ts` (feeds Body / Open scoring); `utils/scanResultPresentation.ts` and `signals/signalRenderMapping.ts` (Signals guardrails); `src/contribution/` vs `src/contributions/` (adapters vs domain). | Classify by §6.2, not by file name or folder. Do not "tidy" these into a UI folder. |
| **H-12** | P2 risk | Legacy fields | The product object still carries legacy values that look displayable: `trust_score_breakdown.{sustainability, bodySafety, processing, transparency, reasons}` (`trustScore.ts` L183–208; `reasons` includes Eco-Score and Palm Oil prose; `processing` comes from a non-governed heuristic, L247), `product.confidence` (0–1), `_truscore_metadata.hasEcoScore`. | Never render these (§5.2). |
| **H-13** | P1 risk | Test hazard | About 20 test files assert on the **source text** of `app/result/[barcode].tsx`, `PacketContributionModal.tsx` or `TruScore.tsx` (for example `wave4a5ResultSurface.contract.test.ts`, `pass2Corrective.candidate2.na003Release.test.ts`, `na022.staleSignalsClear.test.ts`, `pass2Corrective.candidate3.manualScoreRender.test.ts`, `nullScoreResultPath.test.ts`, `contribution/*Closure*.test.ts`). Wave 5 restructuring will break them. Several encode governed controls (NA-003 authority gate, NA-022 clear, manual-score render, contribution closure). | A failing source-text test is a signal, not an obstacle. Before re-pointing or deleting one, name the control it protects and prove it with a behavioural test on the moved code (AMBER). Deleting a control test without replacement is RED. |
| **H-14** | P3 | Conflict (INV-SC-1) | The methodology version anchor is stale. `RVEEL_SCORE_METHODOLOGY_VERSION = '1.4'` (`config/methodologyVersion.ts`), while the live registries are Body v12, Planet v19, Ethics/Claims v37 and Open v15. No single methodology-version stamp travels with governed outputs. **Disposition (D-9): not resolved in Wave 5.** Do not display the stale constant (INV-SC-9). Consolidated methodology versioning goes to backlog / governance work. |
| **H-15** | P3 | Certifications | The catalogue CSV carries `mvp_score_eligible`, `mvp_points` and `mvp_receiver`, and `resolveCertification.ts` hard-codes `SCORING_LABELS` (L106). Points are not read from the catalogue (Ethics registry owns them), but there are two places that look like scoring authority. | [PENDING-W4] for the Certifications baseline. Wave 5 never reads `mvpPoints`. |
| **H-16** | P3 | Certifications | `consumerEmblemPermittedForTag` returns `true` for tags not in the catalogue (L215–219). This is fail-open on display permission. It is harmless while badges are generic icons. | Wave 5 must not render certification **artwork** through this function until Certifications closes it. |
| **H-17** | Note | Governed copy | All S26 explanations carry `copyStatus: 'provisional_awaiting_founder_approval'` (`lib/rateability/s26Copy.ts`). Contribution notices and the Yes / Change / Remove strings are governed constants. | Rewording these is AMBER (copy owner: founders), even when meaning seems unchanged. Placement and styling are GREEN. |
| **H-18** | P3 | Duplication | The Packet Claims card composes its visible lines inline (Result L2193–2210) instead of calling `resultPacketInformationLines()` (`consumerSurface.ts`). | A redesign must call one governed helper, not re-derive the dedupe. |
| **H-19** | P2 | Provenance | See P-01: `f0b2921` is not on an advertised branch head. | **Disposition (D-1):** Wave 5 starts from the final corrective release SHA once pushed. Record it in the header and verify with git before the first Wave 5 commit. |
| **H-20** | P3 | Semantics | The "Insufficient Data" card (L1899) renders when there is no Core Truth authority **or** scoring is technically unavailable. It is not the NR state. | Do not repurpose it as NR. NR comes from `publicationStatus === 'nr'` only. |

---

## 8. Retired, dormant and gated inventory

**[OBSERVED]** Reachability was computed by a static import graph from `app/*.tsx`, `app/result/*`, and `index.js` (including literal dynamic imports). Template-string imports are not followed. 230 of 574 `src` files are unreachable. Selected items are below.

**[LOCKED]** Reactivating any row (mounting, importing into a reachable file, flipping a gate, or re-routing data into it) is **RED**.

| Area | Item | State at `f0b2921` | Note |
|---|---|---|---|
| **Eco-Score (legacy display)** | `components/EcoScore.tsx`, `EcoScoreInfoModal.tsx`, `features/product/cards/EcoScoreCard/**` | Unreachable | **Distinct from Planet scoring.** OFF Green-Score grade remains a **live governed Planet input** (`planet-v19-environmental-*`) and L3 target `green_score`. Wave 5 may present the governed Planet Highlight. It may not resurrect the Eco-Score card. |
| | `calculateEcoScore` in `generateTrustReasons` and `ShareContentBuilder.buildEcoScoreContent`; `'ecoscore'` share type | Reachable code, no live caller of the share type | Do not add an `ecoscore` share entry. |
| **Packaging (legacy display)** | `PackagingCard/**`, `PackagingOffCardContent.tsx`, `PackagingInfoModal.tsx`, `PackagingSourcesModal.tsx` | Unreachable | Planet packaging fallback scoring (`planetPackagingFallback.ts`, kerbside +2 / +1) is **live governed**. See §9.2. |
| **Carbon** | `CarbonFootprintCard/**`, `CarbonFootprintInfoModal.tsx` | Unreachable | — |
| **Palm Oil** | `PalmOilCard` | Mounted, but `PALM_OIL_PRODUCT_CARD_VISIBLE = false` returns `null` | Palm prose still in `trust_score_breakdown.reasons` (H-12); `'palmOil'` share type exists; `services/enhancements/wwfPalmOilEnhancement.ts` unreachable. |
| **Pricing** | `UniversalPricingCard` | Mounted behind `isMvpPricingUiEnabled()` = false | `PricingCard`, `GlobalPricingCard`, `GoogleSearchPricingModal` (reachable only via the gated card), `pricingService`, `priceStorageService`, `userPriceSubmission`, `useNZPricesStore`, `services/pricingApis/**` unreachable; backend `nz-prices`, `user-prices` exist. |
| **Legacy recalls** | `RecallsCard/**`, `RecallAlertModal.tsx`, `FoodRecallMarkingsEntry.tsx`, `fdaRecallService`, `cfiaRecallService`, `cpscRecallService`, `ukFsaRecallService`, `recallsGovService`, `rasffService` | Unreachable | Recalls reach the consumer only through the Dynamic Signals asset (`buildAssetGovernedFoodRecallPublicationRecords`, `workstreamC/recall`). |
| **Legacy Alerts / Insights** | `InsightsCarousel` | Mounted; content gated by `MVP_RUNTIME.legacyAlertsInsights = false` | `alertsTab = false`; `services/bannerAlertsService.ts` and `ethicsPillarBannerAlerts.ts` unreachable. **`BannerAlertsCard` is LIVE**: it is the governed Signals surface. Do not confuse the two. |
| **Allergens UI** | `AllergensAdditivesModal`, Allergens card entry | Gated by `allergensUi = false` | `features/product/cards/AllergensCard/**` unreachable. |
| **Subscription / paywall** | `PremiumGate`, `SearchPaywallModal`, `BlurredMatchCountTeaser` | Mounted; `subscriptionAndPaywall = false` | — |
| **Legacy Planet CSV DBs** | `CSVDatabaseService` (EWG / RSPO / Idemat / FAO / USDA / Agribalyse) | Gated by `legacyPlanetCsvDatabases = false` | Initialised via dynamic import in `_layout.tsx` only when gated on. |
| **Legacy ethics / brand services** | `laborViolationsService`, `animalCrueltyService`, `aspcaService`, `ethicalConsumerService`, `walkFreeService`, `dolEnforcementService`, `dolLaborDataService`, `iloStatisticsService`, `brandMatchingService`, `utils/brandExtraction.ts`, `leapingBunnyEnhancement`, `ewgSkinDeepEnhancement`, `bCorpApi`, `openCorporatesApi` | Unreachable | Alternative brand / entity resolution paths. Must stay dormant (INV-EN-2). |
| **Legacy retrieval providers** | ~40 barcode / nutrition APIs (`spoonacularApi`, `nutritionixApi`, `upcDatabaseApi`, …) | Unreachable | Source rationalisation (Wave 2). Reconnecting a provider is a source-of-truth change (RED). |
| **Legacy confidence** | `utils/confidenceScoring.ts` → `product.confidence` | Reachable, diagnostics only | H-12. |
| **Body shadow** | `lib/truscoreEngine/bodyShadow/**` (Nutri-Score 2023) | Unreachable shadow | Must not be wired into live scoring or display. |
| **Legacy product feature tree** | entire `src/features/product/**` (cards, `TruScoreCard`, sections, `useProductData`) | Unreachable | Contains an alternative `TruScoreCard` that reads `truScore.truscore` (`features/product/components/TruScoreCard.tsx` L52–56). **Do not revive it as a Wave 5 starting point.** |
| **Manual product entry** | `ManualProductEntryModal`, `CertificationMultiPicker`, `manualProductService`, `/api/manual-products` | **LIVE legacy** (Unknown Product state) | H-09. |
| **Retired backend routes** | `/api/contribution-evidence` (read-only historical), `/api/off-product-write` (retired relay) | Present | Must not be re-pointed as admission paths. |
| **Locales** | `es`, `fr` JSON | Dormant; `resolveMvpUiLocale` → `en` | — |
| **Methodology route** | `app/methodology.tsx` | Possibly orphaned (prior finding) | Uses internal pillar names; do not link without review. |
| **Photo OCR** | `services/photoOcrService.ts` | Unreachable | Any OCR must enter via `packetContribution/extraction.ts` (INV-MX-2). |

---

## 9. Parallel workstream placeholders **[PENDING-W4]**

### 9.1 Certifications

**[LOCKED] Controlling principles (as stated by founders)**

| ID | Principle | [OBSERVED] repository anchor at `f0b2921` |
|---|---|---|
| CT-1 | One consumer-natural Packet information journey. Consumers are not asked to classify claim vs certification. | `resolvePacketObservation` returns `certification` / `shortlist` / `closer_photo` / `wording`; `PACKET_INFORMATION_ADD`; `evidenceFactFromResolution` assigns the domain |
| CT-2 | Governed catalogue and resolver | `src/certifications/governed/*.csv` mirrored in `governedCsv.ts`; `resolveCertification.ts` |
| CT-3 | Machine output is proposal-only | `proposedCertificationId` ignored unless the wording independently matches |
| CT-4 | Generic wording is not upgraded to a certification by suggestion | `identityMatches` uses only `mayEstablishIdentity` terms; discovery terms need deliberate selection |
| CT-5 | Unresolved marks stay unresolved | `closer_photo`; `unresolvedMarkCandidates.ts` |
| CT-6 | Identity and scope are separately representable | `certificationId` + `certificationScope` / `certificationScopeSubject`; `scopeDependentAssessment` |
| CT-7 | Catalogue identity is separate from scoring mappings | **Partial:** see H-15 |
| CT-8 | Catalogue lifecycle does not erase historical packet truth | `lifecycle` field; shortlist filters `active` / `legacy`. Historical admitted evidence is retained by the authority |
| CT-9 | Artwork / display permission is separate from recognition | `consumerEmblemPermitted` (artwork register). **Fail-open for unknown tags:** H-16 |
| CT-10 | Recognised / contributed certifications enter through the Evidence Authority | `evidenceFactFromResolution` → authority domain `certifications` |
| CT-11 | Approved scoring mappings remain governed methodology | Ethics v37 registry; `scoringLabelForCertification` gate |
| CT-12 | Organic certification and generic-Organic suppression / reactivation stay governed | `contributions/certificationLane.ts` (`qualifyingOrganicCertificationGoverns`, `organicCertificationTags`), applied in `utils/trustScore.ts` L134–138; Ethics organic claim-only path |
| CT-13 | Withdrawal does not resurrect superseded evidence | Authority `snapshotFrom` (INV-PE-3) |

**Wave 5 boundary:** free to redesign how certifications and Packet information appear. Must consume `resolvePacketObservation`, `searchPacketInformation`, `displayCertificationName`, `consumerCertificationLine`, `consumerEmblemPermitted`, and the governed product fields. Must not recreate recognition, scope or scoring logic. All `src/certifications/**` edits are AMBER, and asset edits are RED.

**Pending protected-baseline addition**

```text
Certifications accepted implementation SHA: ________ (to be supplied)
Accepted assets (catalogue / terms / artwork register versions): ________
Assurance verdict reference: ________
On acceptance: replace this §9.1 placeholder with the locked baseline,
re-state CT-7 / CT-9 against the accepted code, and add suite R-12 (§10).
```

### 9.2 Packaging & Recycling

**[LOCKED] Placeholder boundary**
Wave 5 may design presentation containers and consumer interaction patterns around P&R. Wave 5 must not independently create packaging evidence interpretation, scoring or rateability logic, material classification, or contribution-admission rules while the governed P&R workstream is being completed. Unfinished P&R code is **not** frozen as doctrine by this document.

**[OBSERVED] What exists today (protected as current governed behaviour, not as the P&R design)**
- Planet packaging fallback scoring: `pillars/planetPackagingFallback.ts`; `planet-v19-packaging-{all,some}-kerbside`; AU / NZ market from `getPlanetScoringContext` / `true_scan_market`.
- Planet publication lane `packaging_fallback` (`lib/rateability/planetPublication.ts`).
- L3 `packaging` target via `governed_l3` (`lib/scoreHighlights/l3/**`).
- No packaging contribution domain: `CONTRIBUTION_DOMAINS` = ingredients_nutrition, origins, certifications, packet_claims. Planet base prompt states "We are not yet accepting packaging or recycling contributions."
- Legacy packaging display surfaces are retired (§8).

**Wave 5 rules until the P&R baseline lands**
- A P&R container may show only governed outputs that exist today (Planet publication, Planet Highlights, L3 packaging content).
- No packaging contribution entry, no material picker, no recyclability interpretation in UI.
- Placeholder copy that implies a capability exists ("Tell us the packaging") is AMBER.

**Pending protected-baseline addition**

```text
P&R accepted architecture / SHA: ________
Accepted assets (material classes, jurisdiction rules): ________
On acceptance: replace §9.2, add INV-PR-* invariants and suite R-13.
```

---

## 10. Invariant regression doctrine

### 10.1 Principle

**[LOCKED]** For an unchanged governed evidence state, a pure Wave 5 presentation change must not change the governed outcome.

**[LOCKED]** Screenshot parity is **not** architectural regression evidence. Wave 5 is expected to change screenshots substantially.

### 10.2 The governed-outcome oracle

For each fixture `(product input, authority snapshot, market, settlement flag)` record:

```text
G = {
  pillars:      { Body, Planet, Ethics, Open } internal scores + scoringUnavailable,
  ledger:       sorted list of (pillar, adjustment id, value, eligibility),
  publication:  per pillar + overall: publicationStatus, publishedScore, confidence,
                confidenceReasonCode, s26.code, assessmentLanes, contributionOpportunity,
  actions:      resultContributionActions(product),
  prevailing:   rveelGovernedOrigins / PacketClaims / Certifications / PacketAbsence,
                projected nutriment keys, governed ingredients text,
  identity:     resolveSharedIdentityContext(...) public_market + entity ids,
  signals:      Signal record ids, classes, and the banner card set after presentation guardrails,
  certs:        resolvePacketObservation outcomes for the certification corpus,
  share:        resolveShareOverallScore / resolveGenuinePillarBreakdown
}
```

**Gate:** G at the Wave 5 base SHA must equal G at the Wave 5 candidate SHA, byte for byte after canonical sorting. Any difference blocks a GREEN change and requires reclassification.

### 10.3 Compact suite

| Suite | Covers | Fixture source | Existing anchor tests to keep green |
|---|---|---|---|
| **R-1 Pillar scores** | INV-SC-1, INV-SC-5 | The 47-fixture pillar matrix (Score Highlights assurance, Sep 2026) + 35-GTIN and AU/NZ cohorts | `golden/scanOutputContract.golden.test.ts`, `golden/phase6.releaseHardening.test.ts` |
| **R-2 Ledger** | INV-SC-2 | Same; reconcile `base + Σ = score` **and** diff ids / values | `expectPillarLedgerReconciles` helper (necessary, not sufficient) |
| **R-3 NR / Rated / Checking** | INV-SC-4, INV-RA-1..4 | Rateability fixtures; includes one NR pillar, all Rated, `publicationSettled: false` | `lib/rateability/wave3Rateability.fixtures.test.ts`, `wave3UatNarrowCorrection.test.ts`, `utils/resultPublicationLoadGuard.test.ts` |
| **R-4 Confidence** | INV-CF-1..3 | Same, incl. primary-contribution dependence | `lib/rateability/sourceQuality.test.ts` |
| **R-5 Overall publication** | INV-RA-4 | Any-NR, weakest-pillar, no renormalisation | as R-3 |
| **R-6 Prevailing evidence & withdrawal** | INV-PE-1..4, INV-EA-2 | Snapshot fixtures: supersede, consumer withdraw, admin withdraw, no-resurrection, OFF vs admitted precedence | `evidenceAuthority/wave4aSharedAuthority.test.ts` |
| **R-7 Contribution opportunity** | INV-CO-1..4 | Lane matrix (each lane resolved / unassessed / conflict) → actions + s26 opportunity | `contribution/consumerSurfaceJourneys.test.ts` (re-point to outputs, see H-13) |
| **R-8 Admission / current / withdrawn** | INV-EA-1..3 | Authority in-memory store: idempotent replay, rejected, pending source, ceased subjects; **plus "local unsent never scores"** | `evidenceAuthority/*.test.ts` |
| **R-9 Entity / parent resolution** | INV-EN-1..3 | Chaining cohort | `identity/chainingArchitectureBoundary.test.ts`, `resolveSharedIdentityContext.test.ts`, `workstreamA.*` |
| **R-10 Signals eligibility / targeting** | INV-SG-1..2 | Asset pack + scope guard fixtures + temporal edges; banner set after `scanResultPresentation` | `dynamicSignals/**`, `signals/signalRenderMapping.test.ts`, `utils/scanResultPresentation.test.ts`, `integration/wave3ChainingSignalsIntegratedPath.test.ts`, `na022.staleSignalsClear.test.ts` |
| **R-11 Share semantics** | INV-SC-4 on share | NR, Checking, Rated, unavailable, genuine 0 | `review1/pass3Corrective.na018.shareAuthority.test.ts` |
| **R-12 Certification recognition / scoring** | CT-1..13 | **[PENDING-W4]** on Certifications acceptance | `certifications/packetInformationJourneys.test.ts` (interim) |
| **R-13 P&R** | INV-PR-* | **[PENDING-W4]** | — |

### 10.4 Consumption guards (cheap, mechanical, run in CI)

These catch the most likely Wave 5 regressions without screenshots.

1. **Forbidden reads in presentation files.** A grep gate over `src/components/**`, `src/features/**` and `app/**` (excluding the AMBER orchestration blocks and S28 diagnostics) fails on `trust_score_breakdown`, `.internalScore`, `truScore.truscore` / `.breakdown.` used for display, `product.confidence`, `ecoscore_grade`, `?? 0` or `|| 0` adjacent to score fields. H-02, H-04 and H-05 are the known current hits. They are allowlisted only until correctives C-1 to C-3 land (§6.1), then removed from the allowlist. No new entry may be added to the allowlist without founder approval.
2. **Forbidden imports.** Presentation files may import from RED-zone modules only the interfaces in §5.1.
3. **Dormant reactivation.** Fail if any §8 unreachable file becomes reachable from `app/`, or if any `MVP_RUNTIME` value or `PALM_OIL_PRODUCT_CARD_VISIBLE` changes.
4. **Source-text tests.** When a source-text assertion (H-13) is retired, the PR must name the behavioural test that now carries the control.

---

## 11. Interfaces Wave 5 should consume (summary)

| Domain | Consume | Do not bypass to |
|---|---|---|
| Score | `getTruScoreConsumerPresentation`, `product._publication.*` | `trust_score`, `breakdown`, `calculateTruScore` |
| Reassessment | Result `acceptProductUpdate` / admission subscription → `calculateTrustScore(product, { authoritativeSnapshot })` | Calling the engine from a component |
| Rateability / Confidence | `_publication.*.publicationStatus / confidence / s26 / assessmentLanes` | Inferring from presence |
| Contribution | `resultContributionActions`, `consumerSurface.ts`, `openContribution`, `PacketContributionModal` | New submit paths, local scoring, `saveManualProduct` |
| Evidence | `rveelGoverned*` fields, origin / packet helpers | Raw OFF fields, local session units |
| Signals | `bannerAlerts` from `buildBannerAlertsDataFromScanResult` | `evaluateDynamicSignalsAssetProgressive` in a new place; filtering records in UI |
| Highlights | `firedLedgerFromTruScoreResult` → `selectScoreHighlights`; L3 via `planInAppL3HostPresentation` | Matching adjustment descriptions or raw fields |
| Certifications | `resolvePacketObservation`, `searchPacketInformation`, display helpers | Hard-coding names, logos or tag maps |
| Nutrition | `assessGovernedNutrients`, `UK_GOV_FOP_MTL_REFERENCE` | Re-implementing thresholds |
| Share | `shareScoreSemantics.ts` resolvers | Reading scores from the product |

---

## 12. Amendment and change-control procedure

1. **Classification is mandatory.** Every Wave 5 change set states GREEN / AMBER / RED and the INV-IDs touched in its PR or commit description.
2. **GREEN** proceeds. The §10.4 guards and the §10.3 suites must pass at the candidate SHA.
3. **AMBER** is raised before coding. The flag states: (a) the proposed change; (b) the invariant(s); (c) why the visual requirement needs it; (d) the smallest governed alternative. Founders, or their delegated architectural assessor, return one of: *re-scope to GREEN*, *approve as governed corrective* (delivered separately, or within a bounded governed-corrective package under §12.4a; never inside presentation work), or *escalate to RED*.
4. **RED** needs explicit written founder approval naming the change. RED work is never bundled into Wave 5 presentation work. It lands either on its own or within a bounded governed-corrective package under §12.4a, and carries independent review where founders commission it. Unapproved RED work is never implemented, whether alone or in a package.
4a. **Governed-corrective package rule (v0.3).** Multiple related governed corrections may be delivered as **one** bounded package (one or more commits, reviewed as a unit if review is commissioned) only when **all** of the following hold:
    1. each correction in the package was **already founder-approved** (for AMBER outcomes, approved as a governed corrective; for RED, explicit written founder approval naming it);
    2. the package scope is **explicitly bounded**: the corrections and their required outcomes are listed in advance;
    3. each correction's required outcome is **independently demonstrable** with its own behavioural / regression evidence;
    4. the governed regression suites (§10.3) and consumption guards (§10.4) applicable to **each** correction pass;
    5. the package contains **no presentation redesign, UX experimentation or unrelated work**;
    6. any scope beyond the approved outcomes returns to AMBER / RED change control under §6.1 and items 3–4 above.

    Review of a package may be a single exercise, but every finding must be attributable to an individual correction. A failure in one correction does not count as acceptance of the others, and it does not by itself invalidate the others' independent evidence. The package rule changes delivery mechanics only; it does not change any GREEN / AMBER / RED classification.
5. **Doctrine amendments.** Only founders amend [LOCKED] text. An amendment records: version (v0.2, …), date, changed clause, reason, and the SHA from which it applies. [OBSERVED] sections are refreshed by re-inspection at a named SHA, never by editing from a summary.
6. **Pending additions.** When Certifications or P&R is accepted, founders supply the SHA and assets. The placeholder in §9 is replaced, new INV-IDs are issued, and suites R-12 / R-13 are activated. That update is v0.(n+1).
7. **Provenance.** Every SHA used as a Wave 5 base, a review target or a build must be fast-forward pushed to origin and verified with git before use (standing requirement). P-01 must be resolved before the first Wave 5 commit.
8. **Conflicts found later.** If Wave 5 work exposes a new conflict between code and [LOCKED] doctrine, the agent records it as a new H-ID and stops on that item. It does not resolve it inside the UI.

---

## 13. Founder adjudication record (v0.2)

**[LOCKED]** Adjudicated by the founders on 8 Oct 2026.

| # | Decision | Founder position | Recorded in |
|---|---|---|---|
| D-1 | Wave 5 baseline | Resolved operationally. Wave 5 starts from the final corrective release SHA once pushed; the doctrine records that SHA. Wave 5 is not held for Certifications or P&R. **SHA outstanding.** | Header, P-01, H-19 |
| D-2 | Score colour | Correction approved. NR / Checking must not leak an internal score through colour; all score-derived visual treatment uses published state. | INV-SC-7, C-1, H-02 |
| D-3 | Highlights pillar scores | Correction approved. Highlights receive published pillar scores; internal NR scores never become visible through new navigation. | INV-SH-1, C-2, H-04 |
| D-4 | Internal-score fallbacks | Remove from consumer presentation paths. Fail closed. | INV-SC-8, C-3, H-05 |
| D-5 | Contextual prompts | Realign to governed assessment lanes. No second system decides that the consumer needs to contribute. | INV-CO-5, C-4, H-06 |
| D-6 | Highlights and publication | Narrowed: never reveal an unpublished numeric pillar score or imply NR / Checking is Rated. Governed findings may remain where methodology permits, even when the pillar is not publishing a score. | §4.14, H-08 |
| D-7 | Legacy manual-product path | Retire / reroute, not extend. Prohibit reuse or expansion in Wave 5. Replacement is separate work. | INV-EA-4, H-09 |
| D-8 | NR sharing | NR is distinct from technical failure. Exact consumer copy is a Wave 5 design matter. | INV-RA-5, H-03 |
| D-9 | Methodology version | Not resolved in Wave 5. Do not display the stale `1.4` value. Consolidated versioning goes to backlog / governance. | INV-SC-9, H-14 |
| D-10 | Operating contract | Approved. §6 file zones and §10 invariant / CI protections control Wave 5. | §6, §10 |

**Still open (not blocking Wave 5 start beyond D-1):**
- Wave 5 baseline SHA (D-1) and final H-10 corrective SHA were recorded on 8 Oct 2026 as `99102768b61bd6e518bb889e3ab6f01dfc3e1268`. This line updates provenance only.
- Certifications and P&R accepted baselines, to be incorporated by controlled amendment (§9, §12.6).

---

*End of v0.3 (founder-approved candidate). No code changes were made in preparing this document.*

---

## 14. Observed package-review note (not acceptance, not BC)

**[OBSERVED]** Administrative record only, 8 Oct 2026. Locked rules above are unchanged. This note does not record BC and does not accept the package.

- Comparison: B0 `99102768b61bd6e518bb889e3ab6f01dfc3e1268` to review candidate `6d6c72592fad6e65a9f28a778c54435660d86840` on `wave5/score-experience-20261008`. Prior package commits `491c6f834e0820ab90c95096ed9d32740d324699` and `f46be59ce652b0ad2d106552e9ffa1d6bf2f62b3` are inside that range. Preserve branch remains at B0.
- Acceptance of C-1 to C-4 remains pending until the consolidated review closes.
- Deferred founder-owned copy (C-4): a processing-only Body Highlights sentence, where nutrition is resolved and processing is unassessed. Existing base and nutrition sentences name the wrong lane, so Highlights stays silent. No governed copy was written. `resultContributionActions` is unchanged.
- Review correction inside the candidate: pillar share breakdown now requires `publication.settled === true`, and the Result checking latch gates Highlights scores, the image card, text share, and share analytics. A genuine published 0 still records as 0 when the latch is open and the snapshot is settled.
- Founder-reported Android device evidence, 8 Oct 2026: founder testing of `6d6c72592fad6e65a9f28a778c54435660d86840` passed. This is device evidence only. It is not independent package acceptance and it does not record BC.
