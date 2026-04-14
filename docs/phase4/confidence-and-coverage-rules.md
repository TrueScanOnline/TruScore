# Confidence and coverage rules

Bridges **runtime**, **scoring**, and **signals**. Implementation touchpoints: `calculateDataCompleteness`, `applyConfidenceScore`, `confidenceScoring.ts`, trust calculation modules.

## Confidence labeling

| Label | Numeric band (indicative) | Source basis |
|-------|---------------------------|--------------|
| **high** | ≥ 0.8 | Primary official / OFF / GS1-class |
| **medium** | 0.55–0.79 | Retailer APIs, mixed agreeing |
| **low** | &lt; 0.55 | Fallback APIs, single weak source, conflict |

Labels shown to users must match **claim-registry** wording.

## Coverage rules

- **Completeness** 0–1 (or 0–100%) from `calculateDataCompleteness`.
- **Coverage flags** are orthogonal: e.g. `missing_nutrition`, `missing_ingredients`, `stale_cache`, `fallback_used`.

## Missing-data handling

1. If **ingredients** missing → withhold ingredient-derived ethics and ingredient alerts; show transparency signal.
2. If **nutrition** missing → withhold nutrition comparisons; pillars using nutrition get `n/a` or reduced weight per engine spec.
3. If **only** fallback identity → cap confidence at **low**; force transparency Class B.

## When to show vs withhold score

| Situation | Behavior |
|-----------|----------|
| Minimal identity + any trusted attribute | Show **provisional** score with Class B |
| No trustworthy identity | Withhold main score; show search / manual flow |
| Active recall exact match | Show score **only if** policy allows side-by-side; P0 never hidden behind score |

## Transparency signals (mandatory)

- Completeness &lt; threshold (align with 70% fallback gate context but UI threshold may differ).
- Fallback source used.
- Stale data beyond policy.
- Methodology version when score shown.

## Suppressing derived insights

- Ethics / preference “hits” suppressed when input pillar missing.
- Certification lines suppressed without `verified` mapping row.

## Lane note

Do not expand **automatic** alert triggers until these rules and [source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md) are implemented consistently in code **or** explicitly marked as doc-ahead-of-code with ticket ids.
