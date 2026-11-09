# W5-AD-01 catalogue overhaul — editorial rubric

## Permitted fields only
`tile_summary`, `expanded_summary`, `fact_1_label`, `fact_1_copy`, `fact_2_label`, `fact_2_copy`, `fact_3_label`, `fact_3_copy`

Never edit: evidence_*, detection, identity, source_preparation_profile, source_preparation_copy (unless copy is clearly editorial prose already present — prefer leave source_preparation_copy unchanged), BODY6, scoring.

## Three passes (required per ID)
1. **Pass 1 — Discovery candidate:** Identify best verified WOW from profile + preparation + facts + evidence. Draft Candidate 1. Keep original if already excellent.
2. **Pass 2 — Critical challenge:** Challenge lead fact, jargon, overclaim, product-specific inference, health-risk implication, lost facts. Draft Candidate 2 only if genuine improvement.
3. **Pass 3 — Consumer comparison:** Compare Original / C1 / C2 on accuracy gate + clarity + WOW + tile strength + expanded usefulness + tone. Select best. Prefer original if no material gain.

## Source-aware rules
- CHEMICAL_SYNTHESIS ≠ PETROLEUM_REFINED
- VARIABLE: never invent product-specific origin
- Petroleum/animal/insect claims need substance-specific support, not profile alone
- No health-risk uplift from synthesis/modification
- Manufacturing origin ≠ crude material in final food

## Discovery priority categories (editorial only; not safety)
- `T1_UNUSUAL_ORIGIN` — animal/insect, petroleum, surprising biological origin
- `T2_ROUTE_REVEAL` — fermentation-vs-name, variable routes, modified-natural transform
- `T3_CHOICE_RELEVANCE` — sulphite sensitivity cue, dietary/religious choice relevance from verified source
- `T4_EDUCATIONAL` — solid interest, lower wow
- `T5_FUNCTIONAL_BASELINE` — accurate but low discovery; occurrence order fine

## Statuses
`ACCEPT EXISTING` | `EDITORIALLY IMPROVED` | `SOURCE REVIEW REQUIRED`

## Output JSON schema per entry
```json
{
  "additive_id": "e100",
  "source_preparation_profile": "PLANT_EXTRACT",
  "notable_source_detail": "...",
  "source_support": ["fact_1", "source_preparation_copy"],
  "pass1_notes": "...",
  "candidate1": {"tile_summary":"...", "expanded_summary":"...", "fact_changes": {}},
  "pass2_notes": "...",
  "candidate2": null,
  "pass3_rubric": {"accuracy":"pass","clarity":4,"wow":3,"tile":4,"expanded":3,"tone":4,"concision":4},
  "selected": "original|candidate1|candidate2",
  "final": {"tile_summary":"...", "expanded_summary":"...", "fact_1_label":null, "fact_1_copy":null, "fact_2_label":null, "fact_2_copy":null, "fact_3_label":null, "fact_3_copy":null},
  "status": "ACCEPT EXISTING|EDITORIALLY IMPROVED|SOURCE REVIEW REQUIRED",
  "discovery_priority": "T1_UNUSUAL_ORIGIN|T2_ROUTE_REVEAL|T3_CHOICE_RELEVANCE|T4_EDUCATIONAL|T5_FUNCTIONAL_BASELINE",
  "discovery_rationale": "...",
  "unresolved_factual_issue": null,
  "selection_reason": "..."
}
```
When a final field is unchanged from original, still include the final text. Use `null` in fact_* only when not changing that field (applicator keeps original).
