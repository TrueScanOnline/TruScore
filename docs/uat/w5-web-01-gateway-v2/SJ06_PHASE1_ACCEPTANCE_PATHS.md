# SJ-06 Phase 1 — Result product acceptance paths

| Path | Updates visible Result? | Route barcode check | Load generation |
|---|---|---|---|
| Barcode-change effect | Clears product/score/loading | keyed on `[barcode]` | **Bumps** (invalidates in-flight) |
| `loadProduct` | Yes | closed-over route | **Bumps + guards** |
| `onProgress` → `acceptProductUpdate` | Yes | via accept | **Guarded** |
| `loadProduct` success/miss/error/`finally` | Yes | via accept / `isCurrentLoad` | **Guarded** |
| Manual product short-circuit | Yes | match before set | **Guarded** |
| `handleRefresh` | Yes | via accept | **Bumps + guards** |
| `acceptProductUpdate` | Yes | **`productBarcodesMatch`** | Optional `loadGeneration` |
| `subscribeEvidenceAdmission` | Yes | barcode + snapshot | **Generation-agnostic** |
| `onSharedEvidenceAdmitted` | Yes | barcode + snapshot | **Generation-agnostic** |
| TruScore derive effect | Score only from `product` | indirect | N/A |
| Signals eval | Signals cards | `authoritativeProductForScan` | eval-key (separate) |

**Invariant:** Only the active fetch/refresh generation for the current route barcode may write fetch-driven Result UI. EA admission remains generation-agnostic with barcode + snapshot ordering.
