# SJ-05 Phase 1 — SJ-04 barcode-clear patch review

**Source SHA (HEAD):** `0ce99696bda120808298ce4cc223191865b821be`  
**File:** `app/result/[barcode].tsx`  
**Diff:** +9 lines inside existing `useEffect(..., [barcode])` (approx. L639–647)

## Exact change

Inside the barcode-change effect (already cleared signals / publication latch / additives share), the SJ-04 patch adds:

```ts
setProduct(null);
setProgressiveProduct(null);
setTruScore(null);
setError(null);
setLoading(true);
setLoadingPhase('initializing');
```

## What it does / does not do

| Question | Answer |
|---|---|
| Clears old product when route barcode changes? | **Yes** — `setProduct(null)` + `setProgressiveProduct(null)` |
| Prevents previous product during transition? | **Intended yes** — loading gate is `loading && !product && !progressiveProduct` |
| Prevents older async fetch overwriting newer barcode? | **No** — does not add a load generation / abort; relies on existing `acceptProductUpdate` / barcode match checks (partial) |
| Resets loading / error for the new barcode? | **Yes** |
| Preserves same-barcode settled refresh? | **Yes** — `shouldPreserveSettledResultOnLoadMiss` unchanged; effect only runs when `barcode` changes |
| Clears shared / authoritative evidence stores? | **No** — only React screen state; Evidence Authority / cache untouched |
| Alters publication / Rateability / Confidence semantics? | **No** — does not change assessment math; resets latch so new barcode can Check (pre-existing latch clear) |

## Doctrine classification — **AMBER** (corrects prior GREEN mis-class)

Doctrine §6.2 / H-01: `app/result/[barcode].tsx` mixes layout (GREEN) with governed orchestration (AMBER). Product load / product acceptance / publication latch / cross-barcode Result state are listed orchestration blocks.

This patch:

- Mutates Result **product acceptance surface** (`product` / `progressiveProduct` / `truScore`).
- Changes **cross-barcode state** transition behaviour.
- Sits adjacent to publication latch reset already in the same effect.

Therefore it is **AMBER**, not GREEN. SJ-04 GREEN classification is withdrawn for founder architectural assessment.

**Why necessary:** Offline uncached deep link left Cadbury visible for barcode B (SJ-04 E2). Render path keeps prior `product` when `retrieval_error` sets `error=null`.

**Why behaviour-preserving for valid results:** On barcode change, UI shows loading; successful fetch for B still goes through `acceptProductUpdate` / Core Truth gates unchanged. Same-barcode offline preserve latch unchanged.

**Minimum regression evidence:** E2 offline contamination; E3 recovery; E4 race (if feasible); E5 sequential surfaces; existing Result contract suites if run.

**Governance:** Local patch may be **tested**. Do **not** commit or expand without founder AMBER approval.
