# Phase 1 OFF “0 products in ~3s” vs ~20s duplicate OFF (fixed)

## What went wrong

`getProductOptimized` wrapped `Promise.allSettled([OFF, OBF])` in `Promise.race` against a **3s timeout that resolved to `[]`**.

If Open Food Facts needed **longer than 3s** (slow network, many regional mirrors), the **timeout won**:

- Phase 1 logged **`0 products found`** and treated the scan as a miss.
- Phase 2 then called **`queryAllDatabases`**, which ran a **second full OFF query** (~20s in bad conditions).

So the user waited **3s “failure” + full duplicate OFF path** instead of **one OFF completion**.

## Fix

Phase 1 now **awaits `Promise.allSettled([OFF, OBF])` only** — no empty-array timeout race. OFF still uses its own per-request timeouts inside `fetchProductFromOFF`.

## Expected impact

- Fewer **duplicate OFF** round-trips for the same barcode.
- Phase 1 may take **longer wall-clock when OFF is slow**, but **total time to first good result** should drop because Phase 2 is not redoing the same work.

## Related UX

Open pillar: NOVA 3–4 with **no vague-term matches** previously showed **−2** and **+2** on separate lines; these are merged into **one neutral “net 0”** line (same score).
