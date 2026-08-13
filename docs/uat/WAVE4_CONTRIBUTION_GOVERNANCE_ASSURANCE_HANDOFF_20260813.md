# Wave 4 Contribution Governance — Assurance-Readiness Handoff

**Date:** 2026-08-13 (completion of 20260812 instruction)  
**Branch:** `wave4/contribution-governance-20260812`  
**Immutable tag:** `wave4-contribution-governance-assurance-20260812`  
**Deploy / merge to main / EAS / OTA:** not done (not authorised)

---

## 1–3. SHA relationship

| Ref | Full SHA | Role |
|---|---|---|
| Package commit | `a98c0b3c2d7eaff2d963224b45ae21b05f7de384` | First bounded governance package (pending cannot score) |
| Handoff note | `ab46cc8bea06a95ca3860b7024c110e897a3147c` | Docs-only: records package SHA in handoff |
| Final implementation package | `6742f123c0999cb34a041de4b69e8c2bf4212bef` | Assurance-ready promotion path + proofs |
| Tip tagged for assurance | resolve via tag `wave4-contribution-governance-assurance-20260812` | Docs-only commit after implementation package |

`git diff --stat a98c0b3..ab46cc8`:

```
 docs/uat/WAVE4_CONTRIBUTION_GOVERNANCE_HANDOFF_20260812.md | 1 +
 1 file changed, 1 insertion(+)
```

**Delta is documentation-only.**

Preserved unaccepted WIP remains: `preserve/post-f283494-contribution-wip-20260809` (`b7bf15d`) — not merged.

---

## 4. Exact files in this completion (beyond a98c0b3)

Policy/lifecycle/boundary:

- `src/config/contributionPolicy.ts`
- `src/contributions/types.ts`
- `src/contributions/lifecycle.ts`
- `src/contributions/eligibilityBoundary.ts`
- `src/contributions/submitGovernedEvidence.ts`
- `src/contributions/certificationLane.ts` *(new)*
- `src/contributions/originStructured.ts` *(new)*
- `src/contributions/index.ts`
- `src/lib/truscoreEngine/index.ts` *(promotedEvidence on scoring context only)*
- `src/services/manualProductService.ts`
- `src/services/manufacturingCountryService.ts`

Proofs / inventory / handoff:

- `src/__tests__/unit/config/contributionPolicy.test.ts`
- `src/__tests__/unit/contributions/*.test.ts`
- `docs/uat/WAVE4_CONTRIBUTION_EXPOSURE_INVENTORY_20260812.md`
- `docs/uat/WAVE4_CONTRIBUTION_GOVERNANCE_ASSURANCE_HANDOFF_20260813.md`

---

## 5. Policy / config location and MVP parameters

**SoT:** `src/config/contributionPolicy.ts`

| Domain | Confirmations | Disputes → review | Auto-withdraw | Personal provisional | Canonical promotion |
|---|---|---|---|---|---|
| Origins | 1 independent | 2 | false | false | **true** |
| Certifications | 1 independent | 2 | false | Lane A false | true (Lane A scores; Lane B does not) |
| Ingredients/Nutrition | N/A (no Rveel N-user path) | N/A | N/A | false | false — OFF read-back only |

Success copy retained: `INGREDIENTS_NUTRITION_SUCCESS_COPY`.

---

## 6. Evidence lifecycle / state model

`pending` → (1 independent confirmation) → `cross_user_eligible` → `markCanonicalPromoted` → existing scorer  

Also: `review_required` (2 independent disputes; **does not** auto-withdraw or clear prior scoring eligibility), `superseded`, `withdrawn` (founder/admin).

Confirm/dispute attach to **evidenceId / evidenceVersion**, not undifferentiated GTIN.

---

## 7. Eligibility / promotion boundary

`toScoringProduct(product, promotedEvidence)` upstream of `calculateTruScore`:

- Strips pending-marked and standalone local/contribution-overlay fields.
- Applies only evidence with `canPromoteToCanonicalProduct` **and** `canonicalPromoted`.
- Cert Lane A → unions `labels_tags` for existing Ethics evaluator.
- Origins → sets faithful `manufacturing_places` / optional `origins` wording for Open; does **not** invent tags to force “complete” +4.
- Lane B → `cross_user_eligible` allowed, `scoringEligible=false`, cannot promote.

---

## 8–15. Proof summary

| ID | Result |
|---|---|
| POL-01/02/03 | PASS — thresholds from policy; auto-withdraw off |
| CERT-01…09 | PASS — pending isolated; Lane A promotes+scores Ethics +6→21; Lane B non-scoring; continue confirm/dispute; review_required no auto-withdraw |
| ORG-01…06 | PASS — pending isolated; Manual path cannot bypass; qualified AU 75% structured evidence preserves image/wording/fields; promotes faithfully; Open applies current partial treatment (0), not coerced complete +4; source-consistent with OFF string-only |
| NUT-01…04 | PASS — no local/cross-user score; OFF authority; success copy; Vercel payload excludes nutrition |
| PROV-01 | PASS — AsyncStorage / LOCAL overlay shapes cannot score solely from storage |
| SCAN-01/02/03 | PASS |
| W1-01 | PASS — trusted OFF unchanged; no Signals/Chaining/EAS/OTA edits in this package |

Command: `npm run test:wave4-contributions` → **35 passed**.

---

## 16. Country producer convergence

CoM (`submitManufacturingCountry`) and Manual Edit country both call `submitGovernedEvidence` with Origins structured `made_in` + country. Neither writes scoring-ready origin fields before eligibility. One promotion path after verification.

---

## 17. Historical-record treatment

Leak keys preserved in storage; GET sanitizes; conservative **pending**. Live DB inventory not run (no credentials). **Hard precondition before later Vercel production deploy:** read-only live inventory (totals, GTINs, leak fields, provenance) — documented in exposure inventory. No deletion authorised.

---

## 18–21. Methodology / alternate path / Wave 1

- Body / Planet / Ethics / Open / TruScore assembly methodologies **not changed**.
- No second Ethics/Open scorer; contribution layer only authorises evidence into existing inputs.
- No Dynamic Signals / Chaining / Asset / UAT flags / EAS / OTA changes.

---

## 22. Genuine contradiction / residual note

**Open pillar today is not purely binary “disclosure present → +4”.**

Current shipped rule:

- absent → −4  
- placeholder → −4  
- **complete** (tags+string / multi-tag / manufacturing tags+string) → **+4**  
- other disclosure-present (string-only) → **0 (partial)**

This package does **not** invent partial/qualified Origins scoring and does **not** coerce qualified Rveel evidence into a manufactured “complete” Product shape solely to obtain +4.

Verified promotion of a qualified claim (e.g. “Made in Australia from at least 75% Australian ingredients”) writes faithful canonical fields (`manufacturing_places` country + `origins` exact wording) **without** synthesizing `manufacturing_places_tags`. Existing Open therefore currently assigns **partial / 0**. Relative to bare absent (−4), that is a **+4 Open-point delta (−4 → 0)** — not an Origins contribution of +8, and not the previous coerced −4 → +4 (+8 delta) path.

Finer treatment of partial/qualified disclosure remains reserved for Wave 2 Open review. Structured qualifications remain on the evidence record.

Residual: pre-remediation merged SQLite rows that already embedded contribution fields onto an `openfoodfacts` source without LOCAL overlay may still need live review — PROV-01 covers contribution-shaped overlays; exposure inventory residual risk stands.
---

## Not in this package

UI builds, personal provisional scoring, egg reveal, allergen feature work, OCR expansion, merge to main, Vercel production deploy, EAS/OTA, wider Wave 4 consumer modules.
