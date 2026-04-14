# Golden expected-output contract

Stable JSON-like shape for each `golden_case_id`. **Version** field bumps when schema changes.

## Top-level object

```json
{
  "schema_version": "1.0.0",
  "golden_case_id": "au_core_9300601249114",
  "barcode": "9300601249114",
  "market": "AU",
  "captured_at": "2026-04-14T00:00:00Z",
  "methodology_version": "TESTUME-…",
  "scores": {
    "trust_total": { "value": 72, "variance_allowed": 2 },
    "pillar_breakdown": {}
  },
  "alert_classes": {
    "safety_regulatory": [],
    "transparency": ["limited_data"],
    "user_preference": [],
    "premium_insight": []
  },
  "confidence": { "numeric": 0.85, "label": "high" },
  "coverage": { "completeness": 0.81, "flags": ["missing_nutrition"] },
  "sources": ["openfoodfacts", "woolworths_au"],
  "premium": { "active": false },
  "notes": "Optional free text for reviewers."
}
```

## Field rules

| Field | Required | Notes |
|-------|----------|-------|
| `schema_version` | Yes | Bump on breaking change. |
| `golden_case_id` | Yes | Stable slug; not tied to date. |
| `scores.trust_total.value` | Usually | Omit only if contract says score withheld. |
| `scores.*.variance_allowed` | Optional | Integer ± points tolerated for flaky pillars. |
| `alert_classes.*` | Yes | Arrays of **taxonomy ids** from Alerts v2 docs; empty array = none. |
| `confidence` | Yes | Align with [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md). |
| `coverage.flags` | Yes | Canonical flag names only. |
| `sources` | Yes | Ordered list of **primary** sources contributing to merge. |
| `premium` | Yes | `active` bool; optional `visible_layers[]`. |

## Acceptable variance

Document in each baseline row:

- **Score:** small integer drift if non-deterministic LLM removed; pillars may drift ±N if agreed.
- **Dynamic dates:** do not snapshot “recall active” boolean without freezing **mock time** or mocking feed.

## Comparison algorithm (summary)

1. Deep-merge diff ignoring `captured_at`.
2. Fail build on: P0 alert class mismatch, score outside variance, new unexpected `coverage.flags`.
3. Warn on: source order change, methodology_version change (triggers human review per [update-review-triggers.md](update-review-triggers.md)).
