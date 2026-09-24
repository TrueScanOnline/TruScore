# Wave 3 Cross-Pillar Rateability / Confidence / NR — Pre-implementation gate (§2)

**Date:** 2026-09-24  
**Branch:** `feat/claims-rescue-v02`  
**HEAD:** `16e10c384fdb024282020aaa8e5eaae30da83f2a`  
**Ancestry:** Claims Rescue v0.2 commit present (`feat(claims): Claims Rescue v0.2 register, assessment, S28 and evidence`).

## Claims Rescue dependency

| Check | Result |
|-------|--------|
| Approved Claims Rescue on branch | **YES** — `src/lib/truscoreEngine/claims/**`, ethics wiring, S28 diagnostics, UAT tests |
| Stop Claims binding? | **No** — proceed with Claims publication binding |

## Legacy W3-S11 Confidence

| Item | Location |
|------|----------|
| Derivation | `src/utils/confidenceScoring.ts` — `getSourceConfidence` / `applyConfidenceScore` / `getConfidenceLabel` (source→High/Medium/Low) |
| UI badge | `src/components/ConfidenceBadge.tsx` — hard-coded “High confidence” etc. |
| Mount | `app/result/[barcode].tsx`, `ProductHeader`, `TruScoreCard` |
| Disposition | **Rebuild** — disconnect source-reliability algorithm from S11; bind to Overall Confidence (`limited`/`moderate`/`high`) only when Overall `publicationStatus=rated` |

## Legacy W3-S26 Data Limitations

| Item | Location |
|------|----------|
| Card | `src/components/productLegal/ProductDataLimitationsCard.tsx` |
| Gate today | Missing `ingredients_text` or `countries` only |
| Copy | `en.json` `result.legalDataLimitations*` |
| Disposition | **Keep purpose / componentise** — Body, Planet, Claims, Transparency, Overall S26 objects with §11 provisional copy + founder-approval prefix |

## Enrichment settlement boundary

| Boundary | Location |
|----------|----------|
| Loading copy | `result.analysisPartialTitle` = “Seeing what we can find…” while `terminal_state === 'partial'` |
| Completion | `app/result/[barcode].tsx` sets `loadingPhase` to `'complete'` after awaited `fetchProductOptimized` returns; progressive `product_ready` / `product_refined` emit earlier |
| Publish barrier | Use `loadingPhase === 'complete'` (and equivalent settle flag on the publication snapshot) as the consumer publication gate — **no timer invented** |

## Contribution routes

| Domain | Status |
|--------|--------|
| `ingredients_nutrition` | Live policy domain (`contributionPolicy.ts`) — Body / Transparency ingredient gaps |
| `origins` | Live policy domain — Transparency origins gaps |
| `certifications` | Live policy domain — not Claims packet Wave 4 destination |
| Claims packet evidence | **No live route** — emit `routeStatus=future`; no dead CTA |

## Gate verdict

**Proceed** with full Body / Planet / Claims / Transparency / Overall publication implementation on this branch.
