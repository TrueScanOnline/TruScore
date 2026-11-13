# SJ-05 AMBER proposal — cross-barcode async acceptance guard

**Status:** Prepared for founder approval — **NOT IMPLEMENTED**

## Gap vs SJ-04 patch alone

The SJ-04 clear (`setProduct(null)` on barcode change) addresses **failed** retrieval leaving prior UI (E2 offline miss).

It does **not** guarantee:

> Information displayed for barcode B is supported only by accepted product state for B.

`acceptProductUpdate` (`app/result/[barcode].tsx` ~L1184–1221) applies `next` into `setProduct` / `setProgressiveProduct` without asserting `getPrimaryBarcode(next.barcode) === getPrimaryBarcode(barcode)` (route).

A late `loadProduct` / `onProgress` completion for barcode A can therefore overwrite Result for B (E4 race).

## Proposed minimal AMBER patch (approval required)

In `acceptProductUpdate`, before mutating product state:

```ts
if (getPrimaryBarcode(next.barcode) !== getPrimaryBarcode(barcode)) {
  return false;
}
```

Optionally: load-generation token checked in `onProgress` / end of `loadProduct` (same effect; slightly larger).

**Do not** cancel Evidence Authority / discard authoritative evidence on screen change.

## Invariants

- INV / H-01 Result orchestration — product acceptance path
- Cross-barcode presentation isolation (SJ-05)
- Preserve same-barcode settled miss behaviour (`shouldPreserveSettledResultOnLoadMiss`)

## Classification

**AMBER** — Result orchestration / product acceptance.

## Regression

E2, E3, E4 (both completion orders), E5; existing Result contract suites as applicable.
