# Dynamic Signals Asset v0.2 — production baseline disposition

**Date:** 2026-08-08  
**Status:** Production-readiness pass for founder acceptance (pre-tag / pre-build / pre-UAT)  
**Governing principle:** Signals do not create product identity. Fail-closed is accepted.

## Counts

| Layer | Count |
|-------|------:|
| Sources | 13 |
| Reveal domains | 14 |
| Signals | 16 (all remain `candidate`) |
| Targets | 25 |
| Product families | 7 |
| Family memberships (reviewed GTINs) | 0 |
| Production recall_eligibility rows | 0 |
| Extension brands / parents | 3 / 2 |

## Per-Signal disposition

| Signal ID | Target(s) | Identity resolution | Product(s) in approved Rveel universe? | Publication eligibility | Reason if unresolved / non-public |
|-----------|-----------|---------------------|----------------------------------------|-------------------------|-----------------------------------|
| SIG-SR-AU-001 | TGT-001–004 product exact_only | Brand B0654 reviewed; GTINs empty | No exact Chickadees GTINs in governed links | **candidate / held** | FSANZ pack/date only; no Asset recall_eligibility; recall must not invent product identity |
| SIG-SR-AU-002 | TGT-005 product exact_only | Brand B0059 reviewed; GTIN empty | No Allen's 130g GTIN in governed links | **candidate / held** | FSANZ batch/date only; no structured eligibility pack |
| SIG-SR-NZ-002 | TGT-007 product exact_only | Brand B0024 reviewed; GTIN empty | No Pams Lasagne GTIN in governed links | **candidate / held** | MPI date criteria only; no verified barcode |
| SIG-SR-AU-003 | TGT-008 entity P0002 | **resolved_with_warning** | Coles own-label brands under P0002 exist | **resolved — eligible for later publication** | Company-context entity_descendants; not a product invent |
| SIG-IN-AU-001 | TGT-009 PF_LEGGOS… | Family stub; B0179 exists | No reviewed tomato-paste GTINs | **candidate / held** | Membership empty; news ≠ product identity; do not broaden to brand |
| SIG-IN-AU-002 | TGT-010 PF_REMANO… | Family stub; B0032 exists | No reviewed GTINs | **candidate / held** | Same |
| SIG-IN-AU-003 | TGT-011 PF_COLES_ITALIAN… | Family stub; B0013 exists | No reviewed GTINs | **candidate / held** | Same; do not fall back to Coles entity Signal |
| SIG-IN-AU-004 | TGT-012 PF_HOYTS_TURMERIC… | Family + B0653 / P0157 reviewed | No tested turmeric GTINs | **candidate / held** | Membership empty |
| SIG-IN-AU-005 | TGT-013 PF_WOOLWORTHS_EGGS_SA | Family stub; B0001 exists | No SA carton GTINs | **candidate / held** | SA-only; no national broaden |
| SIG-IN-GL-001 | TGT-014/015 brand B0067 | **resolved** (+ child B0241) | Cadbury brand identity exists | **resolved — eligible for later publication** | Brand-context; no packet invent |
| SIG-IN-NZ-001 | TGT-017 PF_KERI… | Family stub; B0268 exists | No reviewed GTINs | **candidate / held** | Pack-transition membership empty |
| SIG-IN-NZ-002 | TGT-018 product exact_only | Brand B0139 exists; GTIN empty | No Anchor Blue 400g GTIN | **candidate / held** | Exact pack version unresolved |
| SIG-IN-NZ-003 | TGT-019 product exact_only | Brand B0024 exists; GTIN empty | No Pams sparkling GTIN | **candidate / held** | Exact label variant unresolved |
| SIG-IN-GL-002 | TGT-020–025 brands | **resolved** (B0241, B0060, B0050, B0105, B0164) | Brand identities exist | **resolved — eligible for later publication** | Brand-risk context only |
| SIG-IN-NZ-004 | TGT-026 PF_ANCHOR_BUTTER… | Family stub; B0139 exists | No reviewed butter GTINs | **candidate / held** | Historical label membership empty |
| SIG-IN-NZ-005 | TGT-027 entity P0158 | **resolved_with_warning** | Talley's brand B0655 under P0158 | **resolved — eligible for later publication** | Company-context only |

**Rollup:** 4 Signals resolved-eligible · 12 candidate/held · 0 forced publishable · 0 GTINs invented for Signals.

## Identity changes in this production pass

**None new.** Prior enrichment (Hoyt's / Talley's / Chickadees) preserved. No family memberships or GTINs added.

## Skeleton retirement (this pass)

| Item | Disposition |
|------|-------------|
| `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` | **Removed** |
| `src/workstreamC/runtime/workstreamCRuntimePack.generated.ts` | **Removed** |
| `src/workstreamC/skeleton/buildSkeletonPublicationRecords.ts` | **Removed** |
| Skeleton subject-link publisher in `workstreamCPublicationCore.ts` | **Removed** (maps retained for Asset chain) |
| `app/result/[barcode].tsx` Skeleton branch | **Removed** — Asset-only |
| `signalsProducerGuard` | **Asset \| none** (legacy Skeleton flag ignored) |
| `eas.json` Skeleton UAT env | **Removed** from UAT profiles |
| Cadbury UAT bridge default | **Off** (opt-in for historical tests only) |
| Food Recall Matcher + Asset governed path | **Retained** |
| `workstreamC/c-data/v0.4/**` pack CSVs | **Retained as historical data** (not runtime) |
| Closure docs / git history | **Retained** |

## Confirmations

- No product/GTIN was introduced solely to satisfy a Signal.
- Dynamic Signals Asset remains the sole production Signal-content authority.
- Holds continue: tag, Signal promotion, Asset enablement, device/TestFlight build.
