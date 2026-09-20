# §9 Closure Report — Final Chaining + Benchmarks + Dynamic Signals
**Authority:** `Rveel_Final_Chaining_Benchmarks_Signals_Cursor_Execution_Package_20260918(1).docx`  
**Branch:** `refresh/si-v016-ktc-bbfaw-20260918`  
**Phase B tip (do not redo):** `46b2e634a15bf16e70f923c956f7560b4dd62483`  
**Phase C corpus commit:** `6e1c43169bcc1d6641901e86ec20cf099a99d728`  
**Phase D/E + §9 tip:** `f627b8c03d383a0ae2c925faf91a3d4df1d87ccc`  
**Worktree:** `C:\TrueScan-FoodScanner-wt-si-benchmark-refresh`  
**Clock for Decision Pack fixtures:** `2026-09-18T00:00:00Z`  
**Benchmark snapshots (unchanged):** `ktc-2026-v2` (45) · `bbfaw-2025-v1` (149)

---

## 1. Baseline and changed files

| Item | Value |
|------|--------|
| Phase B closed tip | `46b2e63` |
| Phase C feature commit present | `6e1c431` (predecessors/successors/new signals) |
| This closure completes | Phase C residual finalisation + Phase D embed + Phase E assurance + this report |
| Wave 3 branch | **not touched** |
| UAT build | **not cut** |

Primary governed deltas (C/D/E):

- `workstreamC/c-data/dynamic-signals-v0.3/input/signals.csv` (44 rows)
- `workstreamC/c-data/dynamic-signals-v0.3/input/signal_targets.csv` (62 rows)
- `workstreamC/c-data/dynamic-signals-v0.3/input/food_recall_*.csv`
- `workstreamA/a-data/chaining-extensions/v0.3/product_families.csv` (+ Vogel / Austral / Mon Sire NZ PFs)
- `src/dynamicSignals/asset/v0.2/dynamicSignalsAssetRuntimeEmbed.generated.ts` (regenerated)
- `scripts/generate-dynamic-signals-asset-runtime-embed.ts` (stable `generatedAt`; already on wave1-v0.16 + chaining v0.3)
- Focused tests: `assetV03Pack.test.ts`, `phaseE.refresh20260918.test.ts`, `pass4Corrective.na019_na020.signalsTemporalScope.test.ts`
- Docs: `README.md`, `TARGET_RESOLUTION.md`, `reports/phase_c_predecessor_repair_diff.md`, `reports/phase_c_held_targets.md`

Unrelated dirty/untracked workspace artefacts outside this delivery were preserved and not used as authority.

---

## 2. A-Data (Phase A — already closed; summary only)

| Pack | Path |
|------|------|
| Shared Identity | `workstreamA/a-data/wave1-v0.16` |
| Chaining | `workstreamA/a-data/chaining-extensions/v0.3` |

Phase C additions limited to product-family stubs required for target binding:

| product_family_id | Purpose |
|-------------------|---------|
| `PF_VOGELS_MPI_METAL_20260811` | Vogel's MPI recall family (membership empty until verified GTINs) |
| `PF_AUSTRALHERBS_PEPPERMINT_20260909` | Austral Herbs listed sizes |
| `PF_MONSIRE_BRIE_NZ_20260904` | NZ Mon Sire Sabato packs (AU-separated) |

Validation: `node scripts/_local_validate_si_v016_resolution.mjs` → `ok: true` (brands 791 / parents 175 / aliases 189).

---

## 3. B-Data (Phase B — already closed; summary only)

| Snapshot | Count | Cutoff |
|----------|-------|--------|
| `ktc-2026-v2` | 45 | 2025-09-30 |
| `bbfaw-2025-v1` | 149 | 2025-11-30 |

Founder dispositions retained: Arnott’s/Campbell KTC removed; Birds Eye AU/NZ/Conagra KTC removed; Tulip BBFAW fails closed; Magnum/Wall’s/Streets/Paddle Pop Unilever KTC + TMICC divergence; Fonterra BBFAW 2025 dairy retention. Evidence: `reports/SI_V016_KTC_BBFAW_REFRESH_CLOSURE.json`.

---

## 4. C-Data inventory

### Predecessor repair (§6.1)

- Workbook: `Rveel_Dynamic_Signals_Asset_20260819_v0_3_FINAL.xlsx` — **30** governed fields.
- CSV serialisation defect: **31** values/row (blank after `supersedes_signal_id`) shifted trailing semantics.
- Repair: field-by-field restore to workbook; **did not** apply September successor lifecycle to predecessors.
- Diff: [`reports/phase_c_predecessor_repair_diff.md`](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/phase_c_predecessor_repair_diff.md)

Verified fields include: `publishable_from`, `expires_at` (empty on predecessors), `supersedes_signal_id`, `lineage_reference`, `rationale_summary`, `evidence_policy_version` (`RVEEL-SIGNALS-MVP-2026-08-v0.2`/`v0.3` as workbook), review/publication/`reviewed_at`.

### Successors (§6.2)

- Rule: `old_signal_id + "-20260918"` for all 18 predecessors.
- Same `dedupe_key`; `supersedes_signal_id` set; `expires_at=2026-12-31`; evidence `RVEEL-SIGNALS-MVP-2026-09-v0.4`.
- Dedupe amendment enforced in tests: one publishable head per dedupe family.

### New Signals (§6.3)

Eight founder IDs with locked copy: `SIG-SR-AU-005`…`008`, `SIG-SR-NZ-004`…`006`, `SIG-IN-GL-003`.

### Recall tables (§6.5–6.6)

| File | Row count |
|------|-----------|
| `food_recall_notices.csv` | 12 |
| `food_recall_affected_variants.csv` | 18 (GTIN empty where unverified) |
| `food_recall_eligibility.csv` | 3 (Vogel successor, Austral, Mon Sire NZ) |
| `food_recall_related_gtins.csv` | 0 |

Candidate GTINs `4975186250043` / `8801047559610` **not** promoted.

### Resolution counts (outputs of deterministic resolution)

| Metric | Value |
|--------|-------|
| Legacy Signals with ≥1 resolved target **before** this implementation | **4/18** |
| Legacy Signals with ≥1 resolved target **after** | **12/18** |
| Legacy Signals still held | **6/18** |
| New founder Signals resolved | **3/8** |
| New founder Signals held | **5/8** |
| Total refreshed/new Signals with ≥1 publishable path (`publishable` + resolved target) | **15** (12 successors + 3 new) |

---

## 5. Target closure table — starting backlog of 17

| Target | Label | Canonical | Final state | Publication path | Test evidence |
|--------|-------|-----------|-------------|------------------|---------------|
| TGT-001–004 | Chickadees packs | — | **blocked** | held (SIG-SR-AU-001*) | `phase_c_held_targets.md`; Phase E blocked fail-closed |
| TGT-005 | Allen's iNSiDE OUTS 130g | — | **blocked** | held | held report |
| TGT-007 | Pams Beef Lasagne 1.3kg | — | **blocked** | held | held report |
| TGT-009 | Leggo's tomato paste | `PF_LEGGOS_TOMATO_PASTE_AU` | **resolved** | SIG-IN-AU-001-20260918 publishable | Phase E family PF positive |
| TGT-010 | Remano tomato paste | `PF_REMANO_TOMATO_PASTE_AU` | **resolved** | successor publishable | pack load |
| TGT-011 | Coles Italian tomato paste | `PF_COLES_ITALIAN_TOMATO_PASTE_AU` | **resolved** | successor publishable | pack load |
| TGT-012 | Hoyt's turmeric | `PF_HOYTS_TURMERIC_AU` | **resolved** | successor publishable | pack load |
| TGT-013 | Woolworths SA cage-free eggs | `PF_WOOLWORTHS_CAGEFREE_EGGS_SA` | **resolved** | successor publishable | pack load |
| TGT-017 | Keri fruit juice | `PF_KERI_FRUIT_JUICE_NZ` | **resolved** | successor publishable | pack load |
| TGT-018 | Anchor Blue Milk Powder 400g | — | **blocked** | held | held report |
| TGT-019 | Pams sparkling water HSR | — | **blocked** | held | held report |
| TGT-026 | Anchor butter | `PF_ANCHOR_BUTTER_NZ` | **resolved** | successor publishable | pack load |
| TGT-028 | Vogel's MPI scope | `PF_VOGELS_MPI_METAL_20260811` | **resolved** | SIG-SR-NZ-003-20260918 publishable; eligibility row; membership empty → live matcher fail-closed until GTINs | assetV03 + eligibility |
| TGT-029 | Mr Chen's chilli oil 250g | — | **blocked** | held | held report |

### New recall / Mondelez targets

| Signal | Canonical | State | Blocker / note |
|--------|-----------|-------|----------------|
| SIG-SR-AU-005 | — | blocked | Candidate GTIN unverified |
| SIG-SR-AU-006 | — | blocked | Exact GTIN not governed |
| SIG-SR-AU-007 | `PF_AUSTRALHERBS_PEPPERMINT_20260909` | resolved | Publishable; membership pending |
| SIG-SR-AU-008 | — | blocked | AU Mon Sire 1kg GTIN absent; must not cross NZ |
| SIG-SR-NZ-004 | — | blocked | Candidate GTIN unverified |
| SIG-SR-NZ-005 | — | blocked | Exact cereal GTIN absent; no Woolworths entity propagation |
| SIG-SR-NZ-006 | `PF_MONSIRE_BRIE_NZ_20260904` | resolved | Publishable; AU-separated |
| SIG-IN-GL-003 | `P0009` | resolved | Publishable; no cocoa guard; comparators excluded |

---

## 6. Residual held evidentiary blockers

Full detail: [`reports/phase_c_held_targets.md`](file:///C:/TrueScan-FoodScanner-wt-si-benchmark-refresh/reports/phase_c_held_targets.md)

| Signal | Exact missing fact | Evidence that would resolve |
|--------|--------------------|-----------------------------|
| SIG-SR-AU-001 (+ succ) | Verified Chickadees GTINs not on FSANZ notice | Official/verified GTINs per pack size |
| SIG-SR-AU-002 (+ succ) | Verified Allen's 130g GTIN | Official/verified GTIN |
| SIG-SR-NZ-002 (+ succ) | Verified Pams Lasagne 1.3kg GTIN | Official/verified GTIN |
| SIG-IN-NZ-002 (+ succ) | GTIN + packaging-version for Anchor Blue 400g | Reviewed GTIN + version marker |
| SIG-IN-NZ-003 (+ succ) | GTIN + label-version for outdated HSR sparkling water | Reviewed GTIN + label identity |
| SIG-SR-AU-004 (+ succ) | Verified Mr Chen's 250g GTIN | Official/verified GTIN |
| SIG-SR-AU-005 | Verified Red Hat GTIN (candidate non-authoritative) | Independent verification of `4975186250043` or alternate |
| SIG-SR-AU-006 | Verified JC Seafood 275g GTIN | Official/verified GTIN |
| SIG-SR-AU-008 | Verified Mon Sire AU 1kg GTIN | Official/verified GTIN |
| SIG-SR-NZ-004 | Verified Dongwon GTIN (candidate non-authoritative) | Independent verification of `8801047559610` or alternate |
| SIG-SR-NZ-005 | Verified Woolworths Multi Grain 500g GTIN | Official/verified GTIN |

---

## 7. Phase D — generation

**Commands (exact):**

```text
npm run generate:dsa-asset-runtime-embed
npm run generate:dsa-asset-runtime-embed
```

**Result:**

- Generator path: `scripts/generate-dynamic-signals-asset-runtime-embed.ts`
- Consumes: `wave1-v0.16` + `chaining-extensions/v0.3` + refreshed C-Data
- Output: `src/dynamicSignals/asset/v0.2/dynamicSignalsAssetRuntimeEmbed.generated.ts`
- Rows: signals=44, targets=62, brands=791, gtins=3
- Deterministic regeneration: **byte-identical** on second run  
  `sha256=B7F52CCC5274844B4891487B5D7A6A6F42A206FC5AAA3188B7AA891F2EF1ACAB`
- No hand-edits of generated artefacts

---

## 8. Phase E — assurance map (§8)

| Requirement | Evidence | Result |
|-------------|----------|--------|
| §8.1 Fixed clock / KTC 45 / BBFAW 149 | Phase B closure JSON; Decision Pack clock in Phase E tests | Pass (prior) |
| §8.2 SI positives / no duplicate Pams-Chickadees-Vogel | `_local_validate_si_v016_resolution.mjs` | Pass |
| §8.3 Frozen benchmarks / Arnott–Birds Eye–Tulip | Phase B tip `46b2e63` | Pass (prior; not re-mutated) |
| §8.4 Positives (Mondelez AU/NZ, Leggo's family, successors) | `phaseE.refresh20260918.test.ts`, `assetV03Pack.test.ts` | Pass |
| §8.5 Negatives (Mon Sire separation, Woolworths non-prop, comparators, candidate GTIN, blocked residuals) | `phaseE.refresh20260918.test.ts` | Pass |
| NA-019 / NA-020 updated to successors | `pass4Corrective.na019_na020.signalsTemporalScope.test.ts` | Pass |
| assetV02Matcher / resultIsolation | Jest suites | Pass |
| Predecessor/successor dedupe integrity | Phase E lineage test | Pass |

**Focused Jest command:**

```text
npx jest --config jest.config.js --testPathPattern="assetV03Pack|phaseE.refresh20260918|pass4Corrective.na019_na020" --no-coverage
```

**Result:** 3 suites, **38 passed**, 0 failed.

---

## 9. Confirmations

- Frozen KTC/BBFAW snapshots were **not** mutated by Phase C/D/E.
- No Claims/S28 redesign, no Body/Planet/Open/TruScore redesign, no Score Highlights promotion change, no consumer UI redesign.
- ProductScanResult.signals remains the public Signals path; Asset embed is the production content authority.
- No Wave 3 corrective branch work; no store/TestFlight build cut in this task.

---

## 10. True blockers (isolated)

Exact-product Safety activation remains blocked solely by **absence of verified GTINs** on official notices (and non-promotion of candidate GTINs). Family-bound Safety (Vogel / Austral / Mon Sire NZ) is **identity-resolved and publishable** but live Food Recall Matcher fire still requires verified GTIN rows in `food_recall_affected_variants` / membership — intentionally fail-closed.

No contradiction in the controlling authority prevented deterministic execution of resolvable work.
