# Dynamic Signals Asset v0.2 — bounded source-backed enrichment proposal

**Status:** **Partially applied** 2026-08-08 — see `ENRICHMENT_APPLIED_20260808.md`.  
Exact-product Safety GTINs and family memberships remain proposal-only where barcodes were not source-verified.

**Constraint:** No synthetic identity; founders approve semantic scope + evidence as a set.

Evidence hierarchy (Shared Identity): official brand/parent pages → regulator recall pages → national news naming → shelf/pack observation. Confidence must be `reviewed` before production membership or exact GTINs.

## A. Unresolved brands / entities (need Chaining rows before targets can resolve)

| Target gap | Proposed semantic | Likely evidence sources | Suggested ID action (founder-approved) | Confidence |
|------------|-------------------|-------------------------|----------------------------------------|------------|
| **Chickadees** (TGT-001–004) | Brand under Snackbrands Australia; exact packs 6×19g, 190g, 90g, 45g from FSANZ notice | FSANZ recall page; Snackbrands / retailer listings | Add reviewed `canonical_brands` + parent (or confirm existing Snackbrands parent); then **exact product/GTIN** rows — not brand-only Safety publish | Medium until GTINs verified from pack/notice |
| **Hoyt's** (TGT-012) | Spice brand (Hoyt's Food Industries / related AU entity) for turmeric family | Official Hoyt's site; ABC Four Corners naming; supermarket own listings | Add reviewed brand + parent; then `PF_*` + membership GTINs for tested turmeric packs only | Medium |
| **Talley's Group** (TGT-027) | NZ food company entity for company-context Signals | NZ Herald / Companies Office; Talley's corporate site | Add reviewed `canonical_parents` (entity) + consumer brand children as needed | Medium–high for entity; brand map TBD |

## B. Exact-product Safety (Food Recall Matcher packs — not Asset exact_only)

These must receive **structured recall notice / affected variant / batch-date criteria** in the Food Recall Matcher model before any public Safety card. Asset `exact_only` will not publish them.

| Signal / target | Required structured fields | Evidence | Notes |
|-----------------|---------------------------|----------|-------|
| Allen's iNSiDE OUTS 130g (SIG-SR-AU-002) | GTIN(s), batch codes, date marking per FSANZ | FSANZ Allen's recall page | Brand **B0059** already in A-data |
| Pams Beef Lasagne 1.3kg (SIG-SR-NZ-002) | GTIN, USE BY / printed-date criteria per MPI | MPI recall page | Brand **B0024** already in A-data |
| Chickadees packs (SIG-SR-AU-001) | Per-pack GTINs + date markings | FSANZ Chickadees recall | Depends on §A brand |

## C. Exact-product News (non-recall)

| Target | Proposed | Evidence | Notes |
|--------|----------|----------|-------|
| Anchor Blue Milk Powder 400g (TGT-018) | Exact GTIN(s) for packs with changed preparation directions | Consumer NZ article; Fonterra/Anchor pack photos | Prefer brand **B0139** (consumer Anchor); watch alias conflict with B0332 |
| Pams sparkling water outdated HSR (TGT-019) | Exact GTIN + label version; suppress when corrected packaging confirmed | RNZ + Foodstuffs acknowledgement | Brand **B0024** |

## D. Product-family memberships (family must be `reviewed` + membership `reviewed`)

| Family ID | Proposed membership scope | Evidence | Exclude |
|-----------|---------------------------|----------|---------|
| `PF_LEGGOS_TOMATO_PASTE_AU` | GTINs for Leggo's tomato **paste** packs named in ABC testing | ABC Four Corners; Simplot/Leggo's listings | Sauces, passata, diced, purée |
| `PF_REMANO_TOMATO_PASTE_AU` | Remano tomato paste GTINs from testing | ABC; Aldi Remano listings | Other Remano / Aldi lines |
| `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | Coles Italian Tomato Paste GTINs from testing | ABC; Coles listings | Other Coles tomato products |
| `PF_WOOLWORTHS_CAGEFREE_EGGS_SA` | **SA-only** carton GTINs matching tested range | ABC; Woolworths SA listings | National Woolworths eggs without SA evidence |
| `PF_KERI_FRUIT_JUICE_NZ` | Flavours/GTINs in 3L→2.4L transition | Consumer NZ | Unrelated Keri SKUs |
| `PF_ANCHOR_BUTTER_NZ` | Anchor butter GTINs with combined “100% NZ” + “grass-fed” historical wording | NZ Herald settlement reporting; pack archives | Current packs after label change (period-bound) |

## E. Brand hierarchy (already remediated for Cadbury)

| Relationship | Status |
|--------------|--------|
| B0241 Cadbury Dairy Milk → B0067 Cadbury | **Applied** in `brand_child_of_brand.csv` (reviewed) |
| Further Cadbury chocolate children (Flake, Crunchie, …) | **Propose later** only with explicit founder approval — not inferred from name |

## F. Still leave unresolved if evidence insufficient

- Any GTIN not confirmed from notice/pack photo  
- Hoyt’s ultimate parent legal entity if sources conflict  
- Talley’s site-level product implication (entity Signal must not over-claim)  
- National propagation of Woolworths cage-free eggs beyond SA tested range  

**Next step after founder acceptance of this set:** apply approved rows only (no bulk GTIN harvest).
