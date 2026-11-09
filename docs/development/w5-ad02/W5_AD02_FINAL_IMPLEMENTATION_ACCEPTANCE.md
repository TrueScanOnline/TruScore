# W5-AD-02 — Final implementation acceptance (bounded ranking reconciliation)

**STATUS: STOP FOR FOUNDER / CHATGPT ACCEPTANCE**
**NO RUNTIME IMPLEMENTATION. NO COMMIT / PUSH / MERGE / EAS / OTA / RELEASE.**

## 1. Verified baseline identity

| Check | Result |
|---|---|
| Branch | `experiment/w5-ad02-discovery-order-20261109` |
| HEAD / W5-AD-01 checkpoint | `453e7ba2d678e8ddbd1e20061a642d814952fe1d` |
| Catalogue asset version | `v0.12-W5AD01-editorial` |
| Workbook SHA-256 (manifest) | `a70f860fd9a9c4f17deedf506d9e3d4106760973ee03b5c935a1648e72ece638` |
| Runtime `DISCOVERY_DISPLAY_SEQUENCE` | Still pilot 9 — **unchanged** |
| Catalogue / detection / merge / scoring | **Not modified** by this reconciliation |

## 2. Final classification counts

| Class | Count |
|---|---:|
| Editorial PROMOTE_CORE | 24 |
| **Effective CORE (runtime proposal)** | **22** |
| PROMOTE_EXTENDED | 18 |
| HOLD | 23 |
| EXCLUDE | 24 |
| INACTIVE_CORE_CANDIDATE (subset of editorial CORE) | 2 |

89-candidate assessment remains ACCEPTED IN PRINCIPLE. CORE-only remains the preferred implementation option.

## 3. Corrected CORE sequence (editorial 24)

Editorial CORE order unchanged from the accepted-in-principle list:

```
01. e120
02. e905b
03. e904
04. e901
05. e542
06. e1105
07. e1101
08. s8-nocode-002
09. s8-nocode-004
10. e957
11. e476
12. e445
13. e1522
14. e355
15. e943a
16. e944
17. e955
18. e123
19. e141
20. e415
21. e150c
22. e330
23. e334
24. e300
```

## 4. Effective CORE map (exclude unreachable IDs)

Proposed runtime map for a later implementation pass (CORE-only):

```ts
export const DISCOVERY_DISPLAY_SEQUENCE = {
  "e120": 1,
  "e905b": 2,
  "e904": 3,
  "e901": 4,
  "e542": 5,
  "e1105": 6,
  "e1101": 7,
  "e957": 8,
  "e476": 9,
  "e445": 10,
  "e1522": 11,
  "e355": 12,
  "e943a": 13,
  "e944": 14,
  "e955": 15,
  "e123": 16,
  "e141": 17,
  "e415": 18,
  "e150c": 19,
  "e330": 20,
  "e334": 21,
  "e300": 22,
} as const;
```

| Difference vs editorial 24 | Reason |
|---|---|
| Remove `s8-nocode-002` | INACTIVE_CORE_CANDIDATE — no code/tag path; name-only under declared class context; not verified on a normal scanned product |
| Remove `s8-nocode-004` | Same |
| Relative order of remaining 22 | Unchanged |
| EXTENDED not added | CORE-only option |

Discovery recommendations for the two nocode IDs are **preserved** for future activation if detection/reachability is separately authorised.

### Reachability evidence (read-only probe)

| Case | Result |
|---|---|
| Bare “Mushroom chitosan” | No hit / not rendered |
| `thickener (Mushroom chitosan)` | Hit `s8-nocode-002:name` + rendered |
| Bare “Sweet osmanthus ear glycolipids” | No hit / not rendered |
| `preservative (Sweet osmanthus ear glycolipids)` | Hit `s8-nocode-004:name` + rendered |
| Structured tags / E-codes | Impossible — `code_detection_enabled=false`, empty `code_aliases`, `schedule8_code=null`, normaliser only emits `e####` IDs |
| Current pilot map | Neither ID present |

Conclusion: theoretically name-reachable in rare class-context ingredient strings; **not** part of normal code/tag-driven additive lists → exclude from effective runtime map.

## 5. Concise reconciliation exceptions

| ID / item | Issue | Correction |
|---|---|---|
| `e308` (Stage-5 READONLY JSON ×2) | Profile `PLANT_EXTRACT`; unresolved-source confidence | Document only: v0.12 = `CHEMICAL_SYNTHESIS` / synthetic gamma-tocopherol; distinct from `e307b`; EXTENDED |
| `e308` (prior ranking review discovery text) | “Profile says plant-extract…” discovery line | Replaced with synthetic / CHEMICAL_SYNTHESIS wording in corrected review |
| `e1404` discovery blurb | Truncated prior detail sentence | Clarified in corrected review (remains EXCLUDE) |
| `s8-nocode-002` / `004` | Editorial CORE assumed runtime reachability | Flagged INACTIVE_CORE_CANDIDATE; removed from effective map |
| Other 86 T1/T2 entries | Profile match vs v0.12 | No material discrepancy found |

No governed catalogue copy was rewritten.

## 6. Source-confidence findings

| ID | Identity support | Process / stream claim | Product-specific origin | Confidence |
|---|---|---|---|---|
| `e905b` | FSANZ S8/S16 petrolatum / petroleum jelly | v0.12 `PETROLEUM_REFINED` + SP refining copy | Not inferred per pack | High (class) |
| `e355` | FSANZ S8 adipic acid | v0.12 `CHEMICAL_SYNTHESIS` + petrochemical intermediates wording | Not inferred per pack | High with caution — **not** PETROLEUM_REFINED |
| `e943a` | FSANZ S8/S16 butane (pressurised containers) | FOOD_GAS; natural-gas / petroleum-refining streams in SP | Not inferred per pack | High (stream class) |
| `e944` | FSANZ S8/S16 propane (pressurised containers) | Same as butane | Not inferred per pack | High (stream class) |
| `e1101` | FSANZ S8 “Proteases (papain, bromelain, ficin)” | Named plant proteases + possible microbial proteases in SP | Fail-closed on which preparation | High identity / bounded process |
| `e308` | FSANZ S15 synthetic gamma-tocopherol (v0.12 authorised) | CHEMICAL_SYNTHESIS | Explicitly not feedstock-specific | High after v0.12 correction |

Discovery order remains non-safety / non-toxicity / non-avoidance.

## 7. Confirmation — previous catalogue corrections intact

| Control | Status |
|---|---|
| `e308` CHEMICAL_SYNTHESIS / synthetic gamma-tocopherol | Intact in `catalogue_315.json` |
| `e309` CHEMICAL_SYNTHESIS / synthetic delta-tocopherol | Intact |
| `e307b` PLANT_EXTRACT mixed tocopherols concentrate | Intact / distinct |
| `e472e` unchanged | Intact |
| BODY6 (6) | Intact / separate |
| Evidence URLs/copy | Not touched |
| Detection / merge / scoring / Signals | Not touched |
| `backend/vercel/**` | Not touched |
| Existing AD-02 runtime pilot map | Not touched |

## 8. Corrected UAT expectations (for later implementation)

Align with **authorised Stage 2C behaviour** (do not assert stronger conditions):

| Expectation | Correct assertion |
|---|---|
| Intro visible | `shouldShowDiscoveryOrderIntro` true iff ≥2 cards **and** ≥1 sequenced/promotable card (incl. colour-group min rule) |
| Intro hidden | 0–1 cards, or all unranked |
| Favourites head (CORE-only effective map) | Among rendered CORE hits: `e120` → `e476` → `e150c` → `e330`, then occurrence-ordered remainder |
| Demoted pilot IDs (`e471`,`e322`,`e422`,`e575`,`e223`) | Remain visible in normal list; not forced into discovery head |
| Nocode IDs | Not expected in Favourites / normal code-tag scans |
| BODY6 / colour-group / unranked order / score | Unchanged |
| Safety language | Intro still states order is not a safety ranking; no risk ladder |

## 9. Exact proposed runtime map-only diff

File: `src/s25/discoveryPresentationOrder.ts` — **only** `DISCOVERY_DISPLAY_SEQUENCE` object (later, if authorised).

```diff
 export const DISCOVERY_DISPLAY_SEQUENCE: Readonly<Record<string, number>> = {
-  e120: 1,
-  e471: 2,
-  e476: 3,
-  e150c: 4,
-  e330: 5,
-  e322: 6,
-  e422: 7,
-  e575: 8,
-  e223: 9,
+  e120: 1,
+  e905b: 2,
+  e904: 3,
+  e901: 4,
+  e542: 5,
+  e1105: 6,
+  e1101: 7,
+  e957: 8,
+  e476: 9,
+  e445: 10,
+  e1522: 11,
+  e355: 12,
+  e943a: 13,
+  e944: 14,
+  e955: 15,
+  e123: 16,
+  e141: 17,
+  e415: 18,
+  e150c: 19,
+  e330: 20,
+  e334: 21,
+  e300: 22,
 };
```

Tests to update later: `src/__tests__/unit/s25/w5Ad02DiscoveryOrdering.test.ts` Favourites / mixed expectations only.
No catalogue, detection, merge, BODY6, evidence, scoring, or vercel changes.

## 10. GO / HOLD recommendation

| Gate | Recommendation |
|---|---|
| Documentation / ranking reconciliation | **GO** — discrepancies resolved; effective 22-CORE map ready for implementation authority |
| Runtime ranking implementation | **HOLD** — do not implement until founder issues an explicit implementation authorisation |
| Push / merge / EAS / OTA / release | **HOLD** |

### Corrected artifacts

- `docs/development/w5-ad02/W5_AD02_FINAL_DISCOVERY_RANKING_REVIEW_CORRECTED.md`
- `docs/development/w5-ad02/W5_AD02_FINAL_IMPLEMENTATION_ACCEPTANCE.md` (this file)

Historical Stage-5 READ-ONLY JSON files remain provenance and still contain the outdated E308 `PLANT_EXTRACT` rows — do not use those rows for implementation.

**STOP.**