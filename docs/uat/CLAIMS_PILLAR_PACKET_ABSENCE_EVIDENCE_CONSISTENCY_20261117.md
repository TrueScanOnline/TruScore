# Claims pillar / Packet Claims absence consistency — evidence pack (2026-11-17)

**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Verified starting remote HEAD:** `bcd95ddc856bbd210d93021377b7006eb9904585`  
**Founder test GTIN:** `9414732208565` (Barker’s THREE BERRY / ANATHOTH FARM)  
**Doctrine:** GREEN presentation + client acknowledgement fix; AMBER founder-authorised S12a presentation exception; no RED EA/scoring/admission changes.

---

## 1. Source SHAs

| Role | SHA | Notes |
|------|-----|--------|
| Starting tip (verified) | `bcd95ddc856bbd210d93021377b7006eb9904585` | FM-03/FM-03R reconciliation docs tip |
| Implementation (this pack) | *(filled after commit)* | Presentation helper + look-through + admitted-without-snapshot client handling |
| Final pushed | *(filled after push)* | Same tip when push succeeds |

Frozen native UAT tag / `preserve/pre-wave5-9910276-20261008` **unchanged**. Account tab remains **CLOSED**.

---

## 2. Authoritative pipeline audit (evidence-first)

```
User selects absence
 → FM-03 (photo-supported `packet_absence`) or FM-03R (photo-free `claims_absence_attestation`)
 → evidence asset finalisation (image / attestation document)
 → submit + credential auth → server validate → governed admission
 → authoritative snapshot → prevailing/superseded selection
 → selectAdmittedPacketAbsence → calculateTrustScore → rveelPacketAbsenceEstablished
 → Claims Rateability / Confidence / publication
 → Packet Claims card + Claims pillar (shared helper)
```

### Governing modules inspected

| Area | Path |
|------|------|
| Contribution UI | `src/components/PacketContributionModal.tsx`, `app/result/[barcode].tsx` |
| Device submit | `src/evidenceAuthority/device.ts` (`submitClaimsAbsenceAttestation`) |
| Authority / attestation | `src/evidenceAuthority/authority.ts`, `packetAbsenceAttestationAsset.ts`, `backend/vercel/api/evidence-authority.ts` |
| Projection / scoring | `src/claims/packetClaimReceiver.ts`, `src/utils/trustScore.ts`, `src/lib/truscoreEngine/claims/assessClaims.ts` |
| Publication / Highlights | `src/lib/rateability/claimsPublication.ts`, `selectScoreHighlights.ts`, `ScoreHighlightsLookThroughModal.tsx` |
| Shared presentation | `src/contribution/packetEvidenceStatus.ts` (new), `PACKET_ABSENCE_PRODUCT_STATE` |

### GTIN `9414732208565` — live UAT status (secure limits)

| Item | Finding |
|------|---------|
| Barcode / variant | Founder fixture GTIN `9414732208565`. Displayed product identity historically Barker’s THREE BERRY / ANATHOTH FARM. Live `variantKey` for any prevailing absence **not independently re-read from UAT store in this session** (no founder-admin dump of private evidence rows). |
| EA environment | Client UAT path (Expo Go + Metro; `.env.development` / app.config defaults). Contributor tokens **not disclosed**. |
| Absence submitted / admitted | **No prevailing admitted absence on device Result for this GTIN in this session.** Packet Claims showed the empty editorial invite (“This product does not currently have any claims that we can find…”) plus Add — **not** `PACKET_ABSENCE_PRODUCT_STATE`. Claims pillar opened to “What we found · 15/25” with **empty body** (no fabricated absence line). Claims **Rated 15/25**. Live private EA row dump was not accessed; do not treat this as proof no historical submission ever existed — only that the **current projected Boolean is not true** on the consumer Result. |
| Source kind (FM-03 vs FM-03R) | Cannot assert photographed vs attestation for any historical row without private record access. |
| Subsequent positive / withdrawal | Not independently re-listed from UAT store. Unit fixtures cover supersession and withdrawal paths. |
| Projected Boolean | Presentation now keys solely off `rveelPacketAbsenceEstablished === true` via shared helper. |
| Claims publication | Arithmetic / Confidence / Rateability **unchanged** by this work. |
| Concurrent OFF | Absence admission does **not** schedule OFF write-back; OFF `labels_tags` / certifications continue to be assessed separately (see §3C). |
| Cache vs remote | Result continues to prefer authoritative snapshot refresh; bounded cache remains possible until refresh — presentation follows projected product fields only. |

**Limitation (explicit):** This pack does **not** claim an independently verified live admission for GTIN `9414732208565`. No production evidence was modified for testing.

---

## 3. Three correctness risks

### A. Admitted response without snapshot — **FIXED (client)**

`submitClaimsAbsenceAttestation()` previously could return `status: 'admitted'` when `outcome.status === 'admitted'` even if `snapshot` was null, allowing the Result journey to treat confirmation as success without applying an authoritative snapshot.

**Correction (GREEN client acknowledgement):**

- Device returns `{ status: 'pending', reason: 'admitted_without_snapshot' }` when admitted without snapshot.
- Result treats success only as `admitted && snapshot`.
- No local invent of admission; backend idempotency / retries unchanged.

### B. FM-03R eligibility — Claims NR UI vs server

| Layer | Claims NR required? |
|-------|---------------------|
| UI / pillar / card Add choice | **Yes** — `claimsPacketAbsencePillarEligible` requires settled Claims NR (and related gates). |
| Server `finalizePacketAbsenceAttestation` / submit | **No Claims NR check** — validates contributor ownership, barcode binding, attestation content-type/hash, fact integrity. |

**Architectural reading:** Claims NR currently governs **when the consumer UI offers photo-free attestation**, not a mandatory server-admission condition. This separation appears deliberate for MVP (UI solicitation policy vs cryptographic/admission integrity). Abuse controls remain: authenticated contributor, barcode-bound attestation asset, idempotency, no OFF write-back, no scoring bonus from absence alone.

**Effect on Rated products:** A Rated product does not see FM-03R in UI; photo FM-03 may still apply under its own gates. **No new server eligibility rule was introduced** (would be AMBER/RED).

### C. Variant scope and OFF conflict — **documented, not silently changed**

- Packet subject key = `barcode|canonicalizeVariantKey(variantKey)`.
- Later positive on the **same** subject supersedes absence; earlier rows remain stored.
- `selectAdmittedPacketAbsence` returns true if **any** subject currently has prevailing absence. Product projection exposes a **product-level** Boolean (`rveelPacketAbsenceEstablished`) and a barcode-level claims list. Across differing variants, facts and absence can theoretically coexist at product level.
- OFF label/cert evidence is separately assessed; absence does **not** erase or downgrade OFF evidence.

**Governed-contract issue (AMBER proposal only):** If multi-variant products are in scope for public release, product-level Boolean alone may be insufficient for a legally defensible consumer statement. Narrow remedy candidates (require separate founder approval before implementation):

1. Scope presentation to the current display `variantKey` subject only; or  
2. Fail closed (suppress absence line) when subjects disagree.

**Not implemented in this pack.** Prevailing-evidence rules unchanged.

---

## 4. Presentation contract (founder S12a exception)

**Principal text (both surfaces):**  
`No relevant claim or certification was found on the pack.`  
(= `PACKET_ABSENCE_PRODUCT_STATE`)

**Attribution (Claims pillar only):**  
`Admitted contributor packet observation. Not independently verified by Rveel.`

**Rules:**

- Claims pillar (`Ethics`) only; read-only; separate from Highlights, contextual prompts, and contribution CTAs.
- Visible only when shared helper returns absence (`rveelPacketAbsenceEstablished === true`).
- Suppressed when `shouldWithholdConsumerPublication(publicationHold)`.
- Never inferred from empty claim lists, score 15, empty fired ledger, OFF silence, unsent UI, pending submit, withdrawn/superseded rows, or other barcodes.
- No scoring adjustment / ledger entry / Rateability / Confidence / S26 change.
- Other pillars: no synthetic empty Highlights.

Shared helper: `src/contribution/packetEvidenceStatus.ts` → `packetEvidenceStatusConsumerLine`.

---

## 5. Code changes (this pack)

| File | Change |
|------|--------|
| `src/contribution/packetEvidenceStatus.ts` | **New** pure helper + attribution |
| `src/components/ScoreHighlightsLookThroughModal.tsx` | Claims-only packet evidence status section |
| `app/result/[barcode].tsx` | Shared line for card + look-through; hold suppress; admitted+snapshot success |
| `src/evidenceAuthority/device.ts` | `admitted_without_snapshot` → pending |
| Tests | `packetEvidenceStatus.test.ts`, `claimsPillarPacketAbsenceConsistency.test.ts`, `lookThroughEmptyState` exception note |
| Docs / legal note | This file + nonbinding legal-risk register note |

**Unchanged:** Claims base/packet/cert/BBFAW/KTC arithmetic; NR/Rated/Checking; overall publication; Confidence; FM-03/FM-03R entry predicates; EA admission/withdrawal semantics; OFF gates; Community Agreements; Account CLOSED; `publicReleaseStatus: BLOCKED`.

---

## 6. Regression matrix

| # | Case | Result |
|---|------|--------|
| 1 | FM-03R admitted, no photo | Unit EA `packetAbsenceUserAttestation` PASS; presentation helper Boolean-true |
| 2 | FM-03 photographed absence | Existing FM-03 entry + EA photo paths retained; presentation uses same Boolean |
| 3 | Opened then cancelled | No Boolean → no line (helper) |
| 4 | Pending | Device pending → Result failure copy; no invent |
| 5 | Rejected | Device rejected → Result failure copy |
| 6 | Admitted without snapshot | Device → pending `admitted_without_snapshot`; Result requires snapshot |
| 7 | Duplicate / idempotent | EA unit PASS |
| 8 | Withdrawal | Existing EA/unit coverage; presentation drops when Boolean false after refresh |
| 9 | Superseded by positive | EA unit PASS (`later positive…`) |
| 10 | Barcode change in flight | Result stale-product guard retained |
| 11 | Variant mismatch / multi-subject | **Documented risk** — no silent rule change |
| 12 | Conflicting OFF | Absence does not erase OFF; coexistence retained |
| 13 | Claims Rated + neutral absence | Score 15 / Limited dependence unit; presentation line if Boolean true |
| 14 | Claims NR, no absence | No line; FM-03R may solicit |
| 15 | Claims Checking | Hold/settlement gates + withhold suppress |
| 16 | Genuine Claims Highlight + absence | Highlights list unchanged; status in distinct section |
| 17 | Admin hold pending/held/unavailable/released | Withhold suppresses both surfaces |
| 18 | Restart / snapshot refresh | Presentation follows refreshed Boolean only |
| 19 | Community Agreements | Untouched |
| 20 | Other pillars empty | No synthetic empty Highlights |

Card ↔ pillar consistency: both use `packetAbsenceConsumerLine` from one helper.

**Public legal-release preflight:** still **DENIED / BLOCKED** (`npm run legal:release-preflight`).

---

## 7. Device acceptance

| Platform | Status |
|----------|--------|
| Android Expo Go (emulator-5554) | **Partial PASS** — GTIN Result + Packet Claims + Claims pillar captured under `artifacts/claims-pillar-packet-absence-20261117/`. Current product shows **no** admitted absence Boolean; dual-surface absence statement therefore correctly **absent** on both surfaces. Live admit + dual-surface positive proof **deferred** (do not modify production evidence). |
| iOS TestFlight / simulator | **OUTSTANDING** |

### Android captures (this session)

| File | Observation |
|------|-------------|
| `08_barker_result.png` / `12_result.png` | GTIN Result: Overall 60 Good; Claims **15/25**; Limited confidence |
| `09_packet_claims.png` | Packet Claims empty invite + Add — **not** absence principal statement |
| `13_claims_pillar.png` | Claims look-through header only; **no** fabricated empty commentary; **no** absence status (Boolean false) |

Required visual checks when a current authoritative absence Boolean is present (fixture or future UAT admit):

- Packet Claims card shows principal statement  
- Claims pillar popup shows identical principal statement + attribution  
- Claims score / Confidence unchanged  
- Other genuine Claims Highlights remain separate  
- Close/reopen popup; app restart  

Correction/withdrawal removing the statement: use isolated fixture / unit path if UAT records must not be changed — **production evidence not modified**.

---

## 8. Governance / legal release

- Founder-authorised **AMBER presentation exception** to S12a empty look-through commentary prohibition (Claims packet evidence status only).
- EA authority, server admission, score derivation, source precedence, governed evidence identity: **out of scope** without separate RED/AMBER decision.
- Account CLOSED; frozen UAT tag unchanged; `publicReleaseStatus: BLOCKED`; all 15 requirements **PENDING**; Privacy/Terms unpublished; no public deployment / store submission.
- Nonbinding legal-risk register note added for unresolved multi-variant / product-Boolean presentation integrity (see `docs/legal/MVP_PUBLIC_LAUNCH_GATE.json` subsequentEngineeringMilestones). **No requirement marked APPROVED.**

---

## 9. Remaining governed decisions

1. Whether Claims NR should become a **server** FM-03R admission condition (AMBER/RED).  
2. Whether product-level absence Boolean must be replaced by variant-scoped presentation / fail-closed disagreement (AMBER).  
3. Independent live UAT admission dump for GTIN `9414732208565` (secure founder/admin channel).  
4. iOS device acceptance of the presentation surfaces.

---

## 10. Handoff for independent review

Presentation now shares one governed decision between Packet Claims card and Claims pillar. Client no longer reports confirmed admission without an authoritative snapshot. Scoring and Evidence Authority admission semantics were not broadened. Live GTIN admission was not independently re-proven in this session; multi-variant product-Boolean risk remains open under change control.
