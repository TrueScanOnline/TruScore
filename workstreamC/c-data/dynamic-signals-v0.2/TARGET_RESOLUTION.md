# Signal_Targets — canonical_target_id resolution (Asset v0.2)

**Single-authority note (2026-08-08):** Dynamic Signals Asset is the sole production Signal-content authority. Safety product/`exact_only` targets publish only via Asset-governed Food Recall Matcher eligibility (`food_recall_eligibility` + structured variants). Historical MILO Stage 2 pack cannot originate production Signals. Chickadees / Allen’s / Pams Lasagne remain non-public until structured recall packs with verified GTINs exist.

| signal_target_id | canonical_target_id | resolution_status | Notes |
|------------------|---------------------|-------------------|-------|
| TGT-001–004 | _(empty)_ | needs_review | Chickadees brand **B0654** reviewed; **UNRESOLVED** exact GTINs (FSANZ dates only) + no Asset recall_eligibility |
| TGT-005 | _(empty)_ | needs_review | Allen's B0059 OK; **UNRESOLVED** GTIN (FSANZ batch/date only) + no recall_eligibility |
| TGT-007 | _(empty)_ | needs_review | Pams B0024 OK; **UNRESOLVED** GTIN (MPI date criteria) + no recall_eligibility |
| TGT-008 | `P0002` | resolved_with_warning | Coles Group Limited parent (entity_descendants — not a product recall) |
| TGT-009 | `PF_LEGGOS_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0179) |
| TGT-010 | `PF_REMANO_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0032) |
| TGT-011 | `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0013) |
| TGT-012 | `PF_HOYTS_TURMERIC_AU` | resolved_with_warning | Brand **B0653** / parent **P0157** reviewed; membership empty until tested turmeric GTINs |
| TGT-013 | `PF_WOOLWORTHS_CAGEFREE_EGGS_SA` | resolved_with_warning | Family stub; membership empty until reviewed SA GTINs (brand anchor B0001) |
| TGT-014 | `B0067` | resolved | Cadbury AU — `brand_descendants` includes reviewed child **B0241** |
| TGT-015 | `B0067` | resolved | Cadbury NZ — same hierarchy |
| TGT-017 | `PF_KERI_FRUIT_JUICE_NZ` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0268) |
| TGT-018 | _(empty)_ | needs_review | **UNRESOLVED** — Anchor brand B0139 OK; no reviewed exact product_id/GTIN |
| TGT-019 | _(empty)_ | needs_review | **UNRESOLVED** — Pams sparkling water GTIN missing |
| TGT-020 | `B0241` | resolved | Cadbury Dairy Milk AU (narrow — does not expand to B0067) |
| TGT-021 | `B0241` | resolved | Cadbury Dairy Milk NZ |
| TGT-022 | `B0060` | resolved | KitKat |
| TGT-023 | `B0050` | resolved | Mars |
| TGT-024 | `B0105` | resolved | Magnum |
| TGT-025 | `B0164` | resolved | Hershey's |
| TGT-026 | `PF_ANCHOR_BUTTER_NZ` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0139) |
| TGT-027 | `P0158` | resolved_with_warning | Talley's Group Limited entity + brand **B0655**; company-context only |

## Enrichment applied (bounded)

See `ENRICHMENT_APPLIED_20260808.md`. Identity added via chaining-extensions (wave1-v0.14 not mutated). Exact Safety GTINs and family memberships left unresolved where source evidence lacked barcodes.
