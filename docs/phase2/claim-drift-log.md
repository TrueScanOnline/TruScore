# Claim drift log (Phase 2 + Phase 3 updates)

Phase 2 captured risks; **Phase 3 (Information Modals & Trust Surface Remediation)** applied targeted fixes. This log records both the original assessment and **post-remediation status** where applicable.

Legend: **keep** · **revise** · **retire** · **defer** · **remediated** (Phase 3 shipped a concrete wording/code change)

---

## Phase 3 — remediation summary (2026-04-14)

| Area | Action |
|------|--------|
| **Score highlights** | Replaced health-outcome / superlative phrasing in Nutri A/B, NOVA 1/4, additives-avoid, EWG-high, IARC-1 descriptions in `src/config/scoreHighlightDefinitions.ts` with source-based, non-diagnostic wording. |
| **Share (`ShareContentBuilder`)** | Removed “EXCELLENT / best products” hooks; softened low-score alarmism; replaced `#HealthyEating` / `#EthicalShopping` with neutral tags; palm-oil share hashtags no longer use `EthicalShopping`. |
| **Premium (`premiumFeatures.ts`)** | `ENHANCED_INSIGHTS` no longer promises a separate recommendation engine; tier-3 features explicitly marked planned / not in current build. |
| **Methodology version lock** | Added `src/config/methodologyVersion.ts`, `docs/phase2/methodology-version-lock.md`, and `methodologyVersion.test.ts` (EN/FR/ES `infoModal.trustScore.note` must contain `v{VERSION}`). |
| **FR/ES methodology** | Replaced incorrect “average of four dimensions” explainer with EN-aligned four-pillar 0–25 model, formula, steps 1–5, and v1.4 `note`; softened `nutritionDesc` health framing. |

**Deferred (not in Phase 3 scope):** search paywall “precise control”; onboarding taglines; web OG landing full pass; `bannerAlertsService` TruScore **comment** rename; recall share “URGENT” tone (safety trade-off).

---

## Overall Rveel Score explainer (`infoModal.trustScore.*`, TrustScoreInfoModal)

| Item | Classification | Phase 2 | Phase 3 |
|------|----------------|---------|---------|
| v1.4 methodology note | `C` | defer | **remediated** — constant + tests + FR/ES parity |
| “100% transparent methodology / no proprietary formulas” | `C` | keep | **keep** |

---

## Analysis / breakdown modal (`TruScoreAnalysisModal.tsx`)

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| Title “Rveel Score breakdown” | keep | **keep** |
| File name `TruScoreAnalysisModal` | defer (code) | **defer** |

---

## Score highlights (`scoreHighlightDefinitions.ts`)

| Item | ID | Phase 2 | Phase 3 |
|------|-----|---------|---------|
| Nutri A description | `body-nutri-a` | revise | **remediated** — Nutri-Score–anchored, informational |
| Nutri B description | `body-nutri-b` | revise | **remediated** |
| NOVA 1 “healthiest” | `body-nova-1` | (risk) | **remediated** |
| NOVA 4 obesity/gut | `body-nova-4` | (risk) | **remediated** — population-study framing |
| Additives avoid | `body-additives-avoid` | (risk) | **remediated** |
| EWG high | `body-ewg-high` | (risk) | **remediated** |
| IARC 1 “Proven cancer risk” | `body-iarc-1` | (risk) | **remediated** — IARC-framed, professional-advice caveat |
| Alcohol overrides | various | keep | **keep** |

---

## Share builder (`ShareContentBuilder.ts`)

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| Hooks (EXCELLENT / best / “need to see”) | revise | **remediated** |
| Hashtags `#HealthyEating` `#EthicalShopping` | revise | **remediated** → `#FoodTransparency` etc. |
| Palm oil `#EthicalShopping` | revise | **remediated** |
| “Free app - no sign-up needed” | keep | **keep** |

---

## Alerts disclaimer + data limitations (i18n `result.legal*`)

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| Disclaimer P1–P7 (EN) | keep | **keep** (unchanged) |
| Data limitations P2 (EN) | keep | **keep** |
| FR/ES legal P1 / data P2 | (not in Phase 2 table) | **keep** — already aligned; methodology was the FR/ES gap |

---

## Banner / recall / ethics

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| Recall banners | defer | **defer** |
| Comment “TruScore engine” | defer | **defer** |
| Ethics banners | keep | **keep** |

---

## Paywall / premium

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| `ENHANCED_INSIGHTS` copy | defer | **remediated** |
| Tier-3 roadmap features in `PremiumFeatureDescriptions` | (implicit) | **remediated** — explicit “planned / not in current build” |
| “Best Value” (`subscription.bestValue`) | keep | **keep** |
| Search paywall “precise control” | revise (soft) | **defer** |

---

## Onboarding / web

| Item | Phase 2 | Phase 3 |
|------|---------|---------|
| Onboarding taglines | revise / defer | **defer** |
| OG share landing | defer | **defer** |

---

## Summary

| Outcome | Approx. count |
|---------|----------------|
| remediated (Phase 3) | 12+ |
| keep | unchanged |
| defer | still several (see above) |
| retire | 0 |

---

## Phase 4 — documentation package (2026-04-14)

Phase 4 added `docs/phase4/*` (runtime/fetch graph, performance budgets, source priority, observability, Alerts v2 taxonomy and IA, data-ops workflows, golden UAT packs + expected-output contract, confidence/coverage and scan-output contracts, drift review, update-review triggers). **No user-facing copy or claim-registry rows were changed in this package** — when implementation follows these specs, update `claim-registry.csv` and append rows here per [update-review-triggers.md](../phase4/update-review-triggers.md).

---

## Phase 5 — implementation tranche (2026-04-14)

Shipped: concrete source-order appendix in [source-priority-and-fallback-rules.md](../phase4/source-priority-and-fallback-rules.md); `buildProductScanResult` + `ProductScanResult` types; `signalClass` / `dedupeKey` on banner alerts and ethics pillar banners; `SCAN_OBS` structured logs; Jest golden snapshots (`npm run test:golden`). **New UI strings** are limited to optional `title_display` / `body_display` on synthetic transparency `SignalCard`s inside the scan contract (not yet wired to i18n). No `claim-registry.csv` row changes in this tranche; register keys under `signals.*` when those lines ship in product UI.

---

## Phase 5B — contract adoption + golden expansion (2026-04-14)

- **Authoritative path:** Banners are built only from `ProductScanResult` via `buildBannerAlertsDataFromScanResult` (no parallel `generateBannerAlerts` in the result screen). `terminal_state` derived from fetch phase + score; partial banner uses i18n `result.analysisPartial*`.
- **i18n:** `result.signals.*` (EN/FR/ES) + claim-registry rows `scan-partial-banner`, `signals-limited-data`, `signals-web-search`, `signals-preference-footer`.
- **Golden:** Expanded Jest pack + `deriveScanTerminalState` unit tests; see `npm run test:golden` and `src/__tests__/unit/utils/deriveScanTerminalState.test.ts`.
- **Deferred:** See [phase5b-deferred-edge-cases.md](../phase4/phase5b-deferred-edge-cases.md).
