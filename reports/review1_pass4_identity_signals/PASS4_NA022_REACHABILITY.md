# NA-022 — Result Signals stale-state reachability (a4090f2)

**Mode:** bounded source trace only — **no remediation** in the NA-019/020 candidate.  
**Baseline:** `a4090f297c4fdc78d58a2371a203ec381fd9f47f`

## Question

Is there an ordinary current Result path where the **same barcode** can transition during one mounted Result session from `hasCoreTruthAuthority === true` to `false`? If yes, do previously attached Signals remain rendered?

## Answer — REACHABLE (ordinary production path)

### Exact transition

1. User scans / loads a **Core Truth–stamped** product → `setProduct(stampedProduct)` (`app/result/[barcode].tsx` progressive/fetch paths require stamp).  
2. Signals eval builds `signalsEvalContext` via `authoritativeProductForScan` (requires stamp) → `evaluateDynamicSignalsAssetProgressive` → `setDynamicSignalRecords(evaluated.records)` (~L717).  
3. User completes **manual product save** on that barcode → `handleManualProductSave` → `loadProduct()` (L1116–1119).  
4. `loadProduct` checks `getManualProduct(barcode)` **first** (L809–834). Manual products are **unstamped** (Candidate 3 / NA-003).  
5. `setProduct(manualProduct)` replaces the stamped product **without changing barcode**.  
6. `hasCoreTruthAuthority(product)` becomes **false**.  
7. `signalsEvalContext` useMemo returns **`null`** because `authoritativeProductForScan` fails (L635–638).  
8. Signals `useEffect` (L672–674):

```ts
if (!ctx) return; // does NOT clear dynamicSignalRecords
```

9. `dynamicSignalRecords` from step 2 **remain in React state** and continue to drive banners until barcode change (L287–297 clears only on barcode change).

### Distinction from “reviewed identity unresolved”

When Core Truth remains true but Chaining fails closed (`brand_id`/`parent_id` null), `signalsEvalContext` is **still built**, eval re-runs, and `setDynamicSignalRecords` receives the new (usually empty/fewer) records. That path **correctly clears/replaces** Signals. NA-022 is **not** that case — it is **authority loss** collapsing the eval context without a clear.

### Other mid-session setters

| Caller | Can drop authority same barcode? |
|---|---|
| Progressive / fetch `setProduct` | No — unstamped ignored / treated unavailable |
| Photo `setProduct(updatedProduct)` | Spreads prior product — **keeps** stamp if present |
| Manual load on first entry | Starts unstamped — never had Signals from Core Truth on that mount |

### Consumer consequence / severity (pre-disposition)

Previously matched Safety / In the News cards can remain visible after Result assessment identity is no longer Core Truth–authorised.  
**Proposed class if accepted:** **P2** (stale Signal epoch after authority drop; not a false Chaining invent).  
**Not remediated** in this candidate — await founder severity acceptance.

### Disposition for this candidate

**Do not close as unreachable.** Record as **reachable / deferred** pending severity acceptance. No code change here.
