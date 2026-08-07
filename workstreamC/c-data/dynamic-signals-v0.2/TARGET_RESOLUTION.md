# Signal_Targets — canonical_target_id resolution (Asset v0.2)

**Remediation note (2026-08-07):** Safety product/`exact_only` targets are **Food Recall Matcher only** — Asset will not publish them via generic barcode match even if `canonical_target_id` is later filled. Chickadees / Allen’s / Pams Lasagne remain non-public until structured recall packs exist.

| signal_target_id | canonical_target_id | resolution_status | Notes |
|------------------|---------------------|-------------------|-------|
| TGT-001–004 | _(empty)_ | needs_review | **UNRESOLVED** — Chickadees absent from A-data; Food Recall Matcher pack required |
| TGT-005 | _(empty)_ | needs_review | **UNRESOLVED** — Allen's brand B0059 OK; Food Recall Matcher pack + GTIN required |
| TGT-007 | _(empty)_ | needs_review | **UNRESOLVED** — Pams brand B0024 OK; Food Recall Matcher pack + GTIN required |
| TGT-008 | `P0002` | resolved_with_warning | Coles Group Limited parent (entity_descendants — not a product recall) |
| TGT-009 | `PF_LEGGOS_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0179) |
| TGT-010 | `PF_REMANO_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0032) |
| TGT-011 | `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty until reviewed GTINs (brand anchor B0013) |
| TGT-012 | _(empty)_ | needs_review | **UNRESOLVED** — Hoyt's brand absent from Workstream A wave1-v0.14 |
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
| TGT-027 | _(empty)_ | needs_review | **UNRESOLVED** — Talley's Group absent from Workstream A wave1-v0.14 |

## Founder disposition

Enrichment proposal (not applied): `ENRICHMENT_PROPOSAL_20260807.md`.
