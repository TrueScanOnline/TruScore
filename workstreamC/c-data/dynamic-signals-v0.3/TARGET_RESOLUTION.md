# Signal_Targets — canonical_target_id resolution (Asset v0.3 Phase C refresh 2026-09-18)

Phase C supersedes the former all-`needs_review` posture. Predecessors retain workbook lifecycle (`candidate`); publishable heads are successors (`*-20260918`) or new records when ≥1 target resolves.

| signal_target_id | canonical_target_id | resolution_status | product_scope_guard | Notes |
|------------------|---------------------|-------------------|---------------------|-------|
| TGT-001–005, TGT-007 | _(empty)_ | needs_review | | Exact recall packs; no verified GTIN — see `reports/phase_c_held_targets.md` |
| TGT-008 | `P0002` | resolved | | Coles entity — successor TGT-106 publishable |
| TGT-009 | `PF_LEGGOS_TOMATO_PASTE_AU` | resolved | | Family bound; membership GTINs still empty |
| TGT-010 | `PF_REMANO_TOMATO_PASTE_AU` | resolved | | Family bound; membership empty |
| TGT-011 | `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | resolved | | Family bound; membership empty |
| TGT-012 | `PF_HOYTS_TURMERIC_AU` | resolved | | Family bound; membership empty |
| TGT-013 | `PF_WOOLWORTHS_CAGEFREE_EGGS_SA` | resolved | | Family bound; membership empty |
| TGT-014–015 | `B0067` | resolved | cocoa_chocolate | Cadbury brand; successor mirrors retain guard |
| TGT-017 | `PF_KERI_FRUIT_JUICE_NZ` | resolved | | Family bound; membership empty |
| TGT-018–019 | _(empty)_ | needs_review | | Exact IN products; GTIN missing |
| TGT-020–024 | `P0009`/`P0008`/`P0007`/`P0033`/`P0013` | resolved | cocoa_chocolate | Global Witness cocoa entities |
| TGT-025 | `B0105` | resolved | cocoa_chocolate | Magnum explicit brand bridge |
| TGT-026 | `PF_ANCHOR_BUTTER_NZ` | resolved | | Family bound; membership empty |
| TGT-027 | `P0158` | resolved | | Talley's entity |
| TGT-028 | `PF_VOGELS_MPI_METAL_20260811` | resolved | | Exact MPI Vogel's recall family stub; membership empty |
| TGT-029 | _(empty)_ | needs_review | | Mr Chen's 250g GTIN missing (brand B0796 exists) |
| TGT-100–126 | _(mirrors)_ | as predecessor | preserved | Successor-linked targets for `*-20260918` signals |
| TGT-127–128, TGT-130–132 | _(empty)_ | needs_review | | New exact recalls without verified GTIN; candidate GTINs not promoted |
| TGT-129 | `PF_AUSTRALHERBS_PEPPERMINT_20260909` | resolved | | Listed peppermint size family; membership empty |
| TGT-133 | `PF_MONSIRE_BRIE_NZ_20260904` | resolved | | NZ Mon Sire only — never cross AU |
| TGT-134 | `P0009` | resolved | _(none)_ | SIG-IN-GL-003 Mondelez EUDR; no cocoa guard |

**Fail-closed:** Safety exact-product recalls without reviewed `food_recall_affected_variants` / eligibility do not become public via the Food Recall Matcher. Family-resolved IN targets remain match-inert until membership GTINs are governed.
