# Cursor execution response — Founder Disposition of Claude W0–W11 Review

**Date:** 4 August 2026  
**Controlling instruction:** `Founder_Disposition_Record_of_Claude_Rveel_W0–W11_Independent_Review_20260804.docx`  
**Supporting evidence:** `claude-w0-w11-baseline-review-2026-08-04.md`  
**Controlling scope:** FINAL MVP Scope v0.5  
**Code baseline reviewed by Claude:** `0e91226` / `v10.18.0-handoff-phase6-workstreamC-2026-07-30`

**Authority:** This note confirms understanding, flags only material execution issues, sizes work against the approved wave sequence, and records the single authorised immediate correction (F1). It does **not** reopen settled product policy, MVP scope, or finding dispositions.

---

## 1. Confirmation — understanding of each disposition

| ID | Founder disposition (Cursor understanding) | Timing |
|----|---------------------------------------------|--------|
| **F1** | RSPO must not score Ethics; Rainforest Alliance/UTZ = **+6**. Contained code↔policy fix; no further product decision. | **Immediate — authorised** |
| **F2** | Modified remedy: submitting user may get provisional on-device score from label-transcribed ingredients/nutrition; disclose provisional; OFF publish with provenance/evidence; **must not** permanently outrank sourced data for other users; cross-user scoring only after OFF read-back. Certs/Origins/packaging/identity/Signals **out of** this interim exception. | Interim **rule already decided (D2)**; remediation in **Wave 4** |
| **F3** | Public MVP Signals default = **`governed_5b_only`**. Transitional/synthetic only for controlled internal testing; not blended into public governed Signals. | **Wave 1** |
| **F4** | Material Confidence/source/qualification must survive share + landing; wording later. | **Wave 5** |
| **F5** | Preference Insights ≠ #10. Need concise neutral source-qualified commentary on governed Signal cards. | **Wave 1** (rules then build) |
| **F6** | P2 evidence: tests that Highlights match firing score elements; do not revive superseded commentary Specs. | **Wave 3** |
| **F7** | Real P1 launch-readiness gap; proportionate ops for contribution review, Signal lifecycle, correction/withdrawal/suppress — not enterprise admin. | Shape after Wave 1; **deliver before public launch** |
| **F8** | Real P1 launch-readiness gap; crash/error visibility + incident path minimum; crash-only vs lean-funnel still open. | **Wave 5 / before public launch** |
| **F9** | Dormant integrations — **no action**. | None |
| **F10** | Expand fixture/UAT evidence toward Doc 6 before production Signals claim. | **Wave 1** |
| **F11** | Bounded Spec/UAT issue; test AU/NZ materiality before designing remediation. | **Wave 2** (+ Signal identity in Wave 1) |
| **F12–F16** | Positive findings — **no action**. | None |

**Decisions D1–D6:** Understood as stated in the disposition (Ethics green-light; interim contribution rule; governed Signals default; Sharing context; #10 in Wave 1; Admin+Monitoring mandatory pre-launch but not immediate).

**Execution principle understood:** P1 severity ≠ jump the FINAL v0.5 wave order unless immediate integrity/safety/testing risk.

**Inventory phase closed:** No further general W0–W11 / whole-repo review from Cursor unless founders request a narrow clarification.

---

## 2. Narrow issues that materially affect execution

Only items that affect safe/accurate execution (not scope reopeners):

| # | Issue | Why it matters | Proposed handling |
|---|--------|----------------|-------------------|
| E1 | **TestFlight build 26 Skeleton UAT flag unknown** (Claude factual Q) | Wave 1 renewed Skeleton/on-device UAT may need rebuild if `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT≠1`. | Founder/Cursor: confirm EAS history; rebuild only if needed (disposition §4). |
| E2 | **D2 interim rule is decided but not yet encoded** in merge/Result UX | Coding Wave 4 without a short durable interim-rule note risks re-inference; F2×F7 means no admin backstop yet. | **Prepare now:** 1-page interim rule capture (founders already decided). **Code in Wave 4.** |
| E3 | **F3 `governed_5b_only` default** must be wired per **build profile** (public vs internal UAT) | Wrong default in public builds recreates F3 consumer risk. | Wave 1 task: EAS/`app.config` profile mapping + tests already partly present (`p0-release-mode-disables-legacy-feeders`). |
| E4 | **F5 needs editorial rules before coding** | Building #10 without founder-approved commentary rules would infer product content. | Wave 1: founders/ChatGPT issue commentary rules/decision note → then Cursor implements. |
| E5 | **F1 methodology copy** lived in `TrustScoreInfoModal` (and comments) | Leaving +5/+3 copy after weight fix would mis-explain Ethics to users. | **Done with F1** in this response. |
| E6 | **RSPO still valid for Planet/palm display/picker** | Removing RSPO tags entirely would over-correct Ethics into Planet. | Ethics scoring excludes RSPO; picker/Planet paths unchanged — intentional. |

**No P0** identified against the disposition. No request to reopen settled dispositions.

---

## 3. Immediate authorised correction — F1 / D1 (done in this cycle)

| Change | Detail |
|--------|--------|
| Code | `ETHICS_CERTIFICATION_WEIGHTS`: `rainforest_alliance: 6`, `rspo: 0`; RSPO **not** pushed into Ethics `eligibleSchemes` |
| UI copy | `TrustScoreInfoModal` methodology lines updated |
| Comments | `ethicsCertificationsService.ts`, `ethicsPillar.ts` |
| Tests | RSPO-only → 0 / not eligible; Rainforest → +6; UTZ → +6; Fairtrade+RSPO → Fairtrade 6 without RSPO eligibility |

**Acceptance evidence:** `npx jest src/__tests__/unit/services/ethicsCertificationsService.test.ts` — **22 passed**.

---

## 4. Wave-mapped task breakdown (sizing)

Effort bands: **S** ≤0.5d · **M** 0.5–2d · **L** 2–5d · **XL** >5d (Cursor engineering; founder/UAT time separate).

### Immediate (authorised)

| Task | Effort | Deps | Acceptance evidence |
|------|--------|------|---------------------|
| F1 Ethics cert weights + tests + methodology copy | **S** | None | Unit tests green; RSPO-only Ethics adj=0; RA/UTZ=+6 |

### Wave 1 — Chaining & Signals

| Task | Class | Effort | Deps | Acceptance evidence |
|------|-------|--------|------|---------------------|
| Confirm build-26 Skeleton flag / rebuild if needed | Pre-launch UAT | **S** | EAS access | Flag proven on device or new UAT binary |
| Renewed controlled Skeleton / on-device UAT | Pre-launch UAT | **M** | Flag-on build; retail GTINs | Founder UAT notes; identity gate pass/fail |
| Public default `phase6SignalSourceMode=governed_5b_only` (profile-gated; transitional for controlled UAT only) | Prepare→implement | **M** | D3 (decided) | Release-mode fixtures; Result banners show no blended legacy/synthetic as governed |
| Signal Alert Commentary (#10) **rules** | Needs founder/ChatGPT content | **M** (content) | D5 | Approved decision note / catalogue |
| Implement #10 card commentary UI from approved rules | After rules | **M–L** | Rules | Governed cards show neutral qualified copy; Insights remain separate |
| Expand material Doc 6 fixtures / release evidence (F10) | Prepare→implement | **L** | Doc 6 list | Named P0 fixtures mapped + passing gate |
| Minimum practical Signal lifecycle **process** (even if tooling thin) | Needs founder shape | **M** | F7 timing | Written ops checklist; can withdraw/suppress without full enterprise admin |

### Wave 2 — Core truth pipeline

| Task | Class | Effort | Deps | Acceptance evidence |
|------|-------|--------|------|---------------------|
| Representative AU/NZ identity/merge UAT matrix (F11) | Pre-launch UAT | **M–L** | Product list | Case log: frequency/consequence |
| Fix only **demonstrated** merge/source-priority defects | Implement if material | **M–L** | UAT results | Failing cases fixed or accepted |
| Avoid comprehensive merger Spec unless needed | Spec gate | — | Founders | Decision: Spec vs accept as-built |

### Wave 3 — Consumer interpretation

| Task | Class | Effort | Deps | Acceptance evidence |
|------|-------|--------|------|---------------------|
| Confidence accept / refine / Spec (proportional) | Needs founder decision | **L–XL** | W3 as-built | Founder disposition + tests |
| Highlights tests matching fired score elements (F6) | Prepare→implement | **M** | None | New unit/integration tests |
| Scan-result explanation integrity pass | After Confidence/Highlights | **M** | Above | Result honesty checklist |

### Wave 4 — Contributions & Origins

| Task | Class | Effort | Deps | Acceptance evidence |
|------|-------|--------|------|---------------------|
| Capture D2 interim rule as durable 1-pager | Prepare now | **S** | D2 decided | Doc under `docs/` when authorised to file |
| Implement D2: provisional disclose; OFF path; no cross-user outrank of sourced data | Implement | **L** | Interim rule doc; merge changes | Tests: submitter provisional; other users need OFF read-back; certs/Origins not in exception |
| Broader contribution verification rules | Needs founder Spec/decision | **XL** | Community Verification | Spec then code |
| Product Origins beyond CoM | Needs founder decision/Spec | **L–XL** | Origins decision | As approved |

### Wave 5 — Integrated launch readiness

| Task | Class | Effort | Deps | Acceptance evidence |
|------|-------|--------|------|---------------------|
| Sharing Confidence/source retention (F4) | Needs min copy approval then implement | **M** | D4 wording | Share text + landing retain context |
| Minimum Founder/Admin (F7) | Needs shape then implement | **L–XL** | Post–Wave 1 Signal ops learnings | Can review contrib / lifecycle / suppress without app release |
| Monitoring crash visibility (F8) | Needs crash-only vs lean decision | **S–M** | D6 | Sentry (or chosen) live; ErrorBoundary wired; founder can see crashes |
| Accessibility / resilience / legal-rights / stores | Pre-launch operating | **XL** (multi-owner) | Advisers | FINAL v0.5 gates |
| Paywall/premium/Allergens isolation if not done | Authorised cleanup when ordered | **M** | Founder auth | Surfaces hidden on both platforms |

---

## 5. Classification summary

| Bucket | Items |
|--------|--------|
| **Immediate authorised corrections** | **F1 Ethics (done this cycle)** |
| **Can prepare now (no broad coding)** | D2 interim-rule 1-pager; Wave 1 EAS flag check; fixture inventory vs Doc 6; #10 rules request pack; share-copy options for D4; monitoring options for D6 |
| **Needs founder-approved rule/Spec before coding** | #10 commentary catalogue; Confidence (accept/refine/Spec); Origins beyond CoM; full Community Verification; Admin minimum shape; Monitoring crash-only vs lean; Sharing exact wording |
| **Pre-launch operating / UAT** | Skeleton UAT renewal; AU/NZ merge matrix; Doc 6 evidence; Admin+Monitoring live; legal/resilience/accessibility; release gates |

---

## 6. What Cursor will / will not do next

**Will:** Land F1 on `main` with tests; await Wave 0 clarification requests; prepare packs listed above when asked; start Wave 1 engineering only when founders authorise the wave (or a named task within it).

**Will not:** Reprioritise all P1s ahead of waves; infer Confidence/Origins/Verification/Admin Specs; implement F2–F8/F10–F11 material code in this response beyond F1; reopen dispositions or FINAL v0.5 scope.

---

*End of Cursor execution response.*
