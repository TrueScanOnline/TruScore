# Pass 3 corrective candidate — NA-018 Share assessment authority (P1)

**Base:** `0568b807e9ff716880c290e72defc597e090b383`  
**Status:** candidate for narrow independent Claude assurance — **do not merge yet**  
**Scope:** Share assessment output only. No scoring / Core Truth / cache / S12 / S25 / S27 / Origins / methodology / Wave 4 Sharing UX.

## Finding (promoted from P3-I09)

**NA-018 (P1):** Live Share path could use `product.trust_score` / `product.trust_score_breakdown` when Result `truScore` is null, allowing an unstamped/manual assessment Result refuses to display to reappear in public share output.

## Correction

| Surface | Change |
|---|---|
| `shareScoreSemantics.ts` | Overall/pillars derive **only** from authorised `TruScoreResult`; product fallback removed |
| `ShareContentBuilder` | Uses updated resolvers; productInfo without truScore omits score/pillars |
| `ShareModal` story image | `resolveShareOverallScore(truScore)` only |
| `shareCardGenerator` | Same authority rule |
| `ShareService` analytics | No longer tracks raw `product.trust_score` as assessment |

## Focused regressions

`src/__tests__/unit/review1/pass3Corrective.na018.shareAuthority.test.ts` + updated null-score integrity/result-path suites.

```
PASS pass3Corrective.na018.shareAuthority.test.ts (6)
PASS nullScoreResultPath.test.ts
PASS nullScoreIntegrity.test.ts
Tests: 29 passed
```

## TrustScoreInfoModal (literal confirmation only — no finding)

**Data Sources Transparency subsection (en):**

- **Heading:** `Transparency Pillar (0-25 points)` (`infoModal.trustScore.openSource`)
- **Bullets (hardcoded in component):**
  - Ingredient-list disclosure evidence from the product label text
  - Origin completeness where structured origin evidence is available
  - Source: Open Food Facts API ingredients_text and origins fields where present

Pass 3 phrase “Open bullets” was **internal shorthand** only. Consumer label uses `consumerPillarLabel('Open')` → **Transparency**. No literal consumer-facing “Open” nomenclature in this subsection; no retired v14 point mechanics in current copy. **Classify: no finding.**

## Backlog reconciliation amendment

| ID | Register (2026-09-08) | Pass 3 disposition |
|---|---|---|
| TECH-013 | P3 Score Highlights regression-assurance hardening | Preserve/defer — no remediation in this correction |
| TECH-016 | P3 orphaned/dead Result-surface cleanup | Preserve/defer — no remediation in this correction |

## Other dispositions unchanged

NA-012 P2 UAT parity · TECH-011 Wave 4 · TECH-019 diagnostic hygiene · TECH-018 → Pass 5 · NA-005 P3 · NA-002 deferred · NA-006/S25 · P3-I06 closed unreachable.
