# Claims Rescue v0.2 — Final pre-Claude closure

**Status:** Final CR-12 residual closed — ready for Claude re-assurance  
**Claims remote:** `origin/feat/claims-rescue-v02`  
**Final product SHA:** ba4dbe8f3a28a7b0c8b77592189c2cf3754161dc  
**Prior reconciliation (not rewritten):** `5981ccea93adc2ab59a15b15d2950b0dc65a9ba2`  
**Prior corrective (not assured):** `9ef5cb7b4b853b3b814f919679ada89ef5bbadca`  
**Failed baseline Claude reviewed:** `16e10c384fdb024282020aaa8e5eaae30da83f2a`  
**Nutrition (untouched):** `674d1fe48d500393a4c19d75859bcaa3b512768c`  
**S25:** untouched / integration-ready at `3861e68…`

No methodology reopen. No Wave 4 contribution activation. Nutrition TS2367 not repaired on Claims.

---

## This closure — CR-12 combination precedence

Deterministic same-observation precedence before generic equal-priority fail-closed:

1. **A-VMC-003** (R-013) supersedes component vitamin/mineral hits  
2. **A-VMC-002** retains when its modifier + combined-target expression matches; suppresses overlapping A-VMC-001 and component A-VIT/A-MIN  
3. **A-VMC-001** retains when no more-specific VMC applies; suppresses overlapping component hits  
4. Generic `collision_priority_tie_fail_closed` only for unresolved equal-priority candidates after the above

Points, Packet Context arithmetic, catalogue membership, and R-013 member-count methodology unchanged.

---

## Founder-disposition map (CR-01…CR-15 + later residuals)

| ID | Disposition |
|----|-------------|
| CR-01 | Corrected (product-name Set O scope; no A/B leak) |
| CR-02 | Founder-accepted / non-blocking (brand Organic edge) |
| CR-03 | Corrected (candidate-scoped exclusions; sugar/salt) |
| CR-05 | Corrected (`off_labels` provenance; never user_confirmation) |
| CR-06 | Corrected (nomenclature + Organic copy; CTA gated on `userContributionRouteLive`) |
| CR-07 | Corrected (orthogonal assessment/coverage states) |
| CR-08 | Corrected (dual nutrient identities; legacy standardId → `upstream_standard_id`) |
| CR-09 | Corrected (`commentary_by_event_id`) |
| CR-10 | Corrected (single-pass display escape) |
| CR-11 | Corrected (phrase-scoped X-007/X-011; NIP vs FOP) |
| CR-12 | **Corrected** (VMC-001/002/003 precedence + residual fail-closed) |
| CR-13 | Corrected (singular/plural lists) |
| CR-14 | Corrected (Certified Organic suppression evidence) |
| CR-15 | Corrected (Claims tests/verification); Nutrition TS2367 **unrelated** |
| X-020 | Corrected (evidence-location / mandatory source) |
| X-021 / X-022 | Corrected (candidate-level) |
| X-024 | Founder-dispositioned / not runtime-enforced for MVP |
| Organic CTA gate | Corrected (staged availability) |
| Nutrient product-bound `source_evidence_id` | Corrected |
| OFF `off:labels` / `off:labels_en` | Corrected |
| Claims `unknown` basis removed | Corrected |

---

## Fresh verification

```text
Jest focused Claims/Ethics/Highlights/cert/S28
→ Test Suites: 17 passed; Tests: 351 passed

eslint --max-warnings 0
→ exit 0

tsc --noEmit -p tsconfig.json
→ exit 2 — only Nutrition Stage 3 TS2367 (unrelated)

expo export ios + android (non-release)
→ exit 0 both
```

Logs: `reports/claims_rescue_v02/corrective_fresh_evidence/`

---

## Provenance chain (for Claude)

| Role | SHA |
|------|-----|
| Failed baseline (last Claude review) | `16e10c384fdb024282020aaa8e5eaae30da83f2a` |
| Corrective (not separately assured) | `9ef5cb7b4b853b3b814f919679ada89ef5bbadca` |
| Pre-assurance reconciliation | `5981ccea93adc2ab59a15b15d2950b0dc65a9ba2` |
| Final product SHA | ba4dbe8f3a28a7b0c8b77592189c2cf3754161dc |

Incremental git bundle: `16e10c3` prerequisite → final Claims product commits (compact; not full-history).

---

*End of final pre-Claude closure report.*
