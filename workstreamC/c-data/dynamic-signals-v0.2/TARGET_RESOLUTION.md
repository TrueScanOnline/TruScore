# Signal_Targets — canonical_target_id resolution (Asset v0.2)

**Production baseline (2026-08-08):** Signals do not create product identity. Dynamic Signals Asset is the sole production Signal-content authority. Skeleton runtime retired. See `PRODUCTION_BASELINE_DISPOSITION_20260808.md`.

| signal_target_id | canonical_target_id | resolution_status | Notes |
|------------------|---------------------|-------------------|-------|
| TGT-001–004 | _(empty)_ | needs_review | Chickadees brand **B0654** reviewed; **UNRESOLVED** exact GTINs + no Asset recall_eligibility |
| TGT-005 | _(empty)_ | needs_review | Allen's B0059 OK; **UNRESOLVED** GTIN + no recall_eligibility |
| TGT-007 | _(empty)_ | needs_review | Pams B0024 OK; **UNRESOLVED** GTIN + no recall_eligibility |
| TGT-008 | `P0002` | resolved_with_warning | Coles Group — entity_descendants (own-label only) |
| TGT-009 | `PF_LEGGOS_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty |
| TGT-010 | `PF_REMANO_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty |
| TGT-011 | `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | resolved_with_warning | Family stub; membership empty |
| TGT-012 | `PF_HOYTS_TURMERIC_AU` | resolved_with_warning | B0653 / P0157 reviewed; membership empty |
| TGT-013 | `PF_WOOLWORTHS_CAGEFREE_EGGS_SA` | resolved_with_warning | Family stub; membership empty |
| TGT-014 | `B0067` | resolved | Cadbury AU (+ child B0241) |
| TGT-015 | `B0067` | resolved | Cadbury NZ |
| TGT-017 | `PF_KERI_FRUIT_JUICE_NZ` | resolved_with_warning | Family stub; membership empty |
| TGT-018 | _(empty)_ | needs_review | Anchor B0139 OK; **UNRESOLVED** exact GTIN |
| TGT-019 | _(empty)_ | needs_review | Pams sparkling **UNRESOLVED** GTIN |
| TGT-020 | `B0241` | resolved | Cadbury Dairy Milk AU |
| TGT-021 | `B0241` | resolved | Cadbury Dairy Milk NZ |
| TGT-022 | `B0060` | resolved | KitKat |
| TGT-023 | `B0050` | resolved | Mars |
| TGT-024 | `B0105` | resolved | Magnum |
| TGT-025 | `B0164` | resolved | Hershey's |
| TGT-026 | `PF_ANCHOR_BUTTER_NZ` | resolved_with_warning | Family stub; membership empty |
| TGT-027 | `P0158` | resolved_with_warning | Talley's Group entity + B0655 |

**Fail-closed accepted:** product/family Signals without reviewed GTINs remain non-public. No broadening to parent entity solely because the narrower target cannot resolve.
