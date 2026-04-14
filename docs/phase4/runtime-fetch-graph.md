# Runtime / fetch graph (Rveel)

This document maps the **real** scan and product-load paths as implemented in the client. It is the reference for alert truthfulness, confidence, and coverage.

## Primary code paths

| Path | Entry | Role |
|------|--------|------|
| **Optimized scan path** | `src/services/productServiceOptimized.ts` → `fetchProductOptimized` | Main path for barcode scans; phased merge, completeness, confidence, optional fallbacks |
| **Legacy / alternate path** | `src/services/productService.ts` → `executeFetchProduct` | SQLite → cache → offline guard; parallel user-contributed fetch; used by some flows |
| **Result UI shell** | `app/result/[barcode].tsx` | First visible product shell; renders loading / partial / final states |
| **Trust score** | `calculateTrustScore` (imported in optimized service) | First score path once product object exists |
| **Data completeness** | `calculateDataCompleteness` | Gates “good data” early return; influences fallback eligibility |
| **Confidence** | `applyConfidenceScore` / `src/utils/confidenceScoring.ts` | Per-source confidence; applied to product |
| **Local DB** | `TruScoreOptimizedDatabase` | SQLite persistence and merge layer for optimized path |
| **Cache** | `productCacheService` / `getCachedProduct` / `setCachedProduct` | Fast path and TTL-style freshness |
| **Backend proxy** | `EXPO_PUBLIC_API_URL` + `/api/product/[barcode]` (see `src/services/apiService.ts`) | Server-side aggregation when configured |
| **Banner / ethics alerts** | `bannerAlertsService`, `ethicsPillarBannerAlerts` | Supplementary surfaces tied to product + preferences |

## First visible product shell

1. User navigates to `app/result/[barcode].tsx` (from scanner or deep link).
2. UI shows loading state while `fetchProductOptimized` (or alternate) runs.
3. **Early paint** may occur when:
   - Cached product exists (`getCachedProduct`) and is returned quickly, or
   - SQLite / optimized DB returns a row before network completes.
4. **“Good data” early return** (optimized path): when completeness ≥ threshold and core fields present, the service may return without waiting for all secondary sources (see `productServiceOptimized.ts`).

## First score path

1. Once a `Product` object is assembled (even partial), `calculateTrustScore` runs.
2. Score may **update** after Phase 2/3 background merges refresh ingredients, nutrition, or certifications.

## Background enrichment

In `fetchProductOptimized`:

- **Phase 1:** Primary sources (market-aware: AU vs NZ branches in source lists).
- **Phase 2 / 3:** Additional merges (e.g. nutrition, extended attributes) — may complete after first UI paint.
- UI should tolerate **score or field deltas** unless locked by product UX rules (document in scan-output contract).

## AU / NZ market branches

- Market detection uses app region / product context (see optimized service `getMarketAwareSources` and related helpers).
- Source lists differ for AU vs NZ (e.g. retailer APIs, FSANZ paths).
- **Certification and recall** surfaces are market-sensitive (cert keys, recall providers).

## Source order (conceptual)

Detailed ordering and fallback gating: [source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md).

High-level: **official / open data first** → **retailer APIs** → **optional fallbacks** (feature-flagged, completeness-gated).

## Timeout points

- Per-fetch timeouts are set in optimized service (`FETCH_TIMEOUT_MS`, `PHASE_TIMEOUT_MS` pattern).
- Phase timeouts prevent one slow source from blocking the entire scan.
- **User-visible** timeout = first phase that exhausts without minimal viable product → error / limited-data state (see performance budgets).

## Fallback points

- `shouldQueryFallbacks`: gated by `EXPO_PUBLIC_ENABLE_FALLBACK_APIS` and **completeness &lt; 70%** (see code).
- Fallback APIs are **lower confidence** per `confidenceScoring.ts`; must align with transparency copy.

## Cache touchpoints

- `getCachedProduct` / `setCachedProduct` — TTL and invalidation in cache service.
- SQLite `TruScoreOptimizedDatabase` — durable merge and offline-ish reads.

## Backend vs client responsibilities

| Concern | Client | Backend (`/api/product`) |
|---------|--------|---------------------------|
| Source orchestration | Yes (primary) | Can aggregate when API URL set |
| Rate limits / keys | Partial (env) | Preferred for secret keys |
| Normalization | Yes | Yes when used |
| Recall / certification enrichment | Display + merge | May supply enriched payload |
| Logging / analytics | Client events | Server logs if instrumented |

## Dedup and concurrency

- `activeProductQueries` Map deduplicates concurrent requests for the same barcode.
- Prevents duplicate network load and inconsistent merge order.

## Related documents

- [performance-budgets.md](performance-budgets.md)
- [source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md)
- [runtime-observability-plan.md](runtime-observability-plan.md)
