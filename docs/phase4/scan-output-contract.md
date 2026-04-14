# Per-scan product-result output contract

Logical shape returned to UI after a scan completes (success, partial, or error). Aligns with [expected-output-contract.md](expected-output-contract.md) for golden tests.

## Envelope

```ts
type ScanTerminalState = "success" | "partial" | "error" | "offline";

interface ProductScanResult {
  terminal_state: ScanTerminalState;
  barcode: string;
  market: "AU" | "NZ" | "UNKNOWN";
  product: Product | null;
  scores: {
    trust?: number;
    pillars?: Record<string, number | null>;
    methodology_version: string;
  } | null;
  signals: {
    safety_regulatory: SignalCard[];
    transparency: SignalCard[];
    user_preference: SignalCard[];
    premium_insight: SignalCard[];
  };
  confidence: { value: number; label: string };
  coverage: { completeness: number; flags: string[] };
  sources_trace: { id: string; status: string }[];
  premium: { subscriber: boolean };
  errors?: { code: string; message_key: string }[];
}
```

## `SignalCard` (minimum)

- `id`, `class` (A|B|C|D), `title_key`, `body_key`, `severity`, `why_key`, `links[]`, `dedupe_key`.

## Guarantees

1. **`terminal_state`** always set when UI leaves loading (no infinite pending).
2. **`methodology_version`** present whenever `scores.trust` is non-null.
3. **`signals`** object always present (may be empty arrays).
4. **`confidence` + `coverage`** present if `product` non-null.

## Partial success

- `terminal_state=partial` when usable product but Phase 2/3 incomplete — UI may show refresh affordance.

## Error

- `product=null`, `scores=null`, `errors` populated; optional Class B transparency explaining offline / not found.

## Premium

- `premium.subscriber` drives P3 population only; must not strip P0/P1.
