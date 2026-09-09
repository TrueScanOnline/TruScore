# Pass 4 corrective candidate — NA-019 + NA-020

**Base:** `a4090f297c4fdc78d58a2371a203ec381fd9f47f`  
**Status:** candidate for narrow Claude assurance — **do not merge**  
**Scope:** NA-019 runtime temporal enforcement + NA-020 TGT-014/015 `cocoa_chocolate` guard + regenerated embed. No Signal date/content refresh. No scoring/Chaining/identity mutation.

## NA-019 (P1) — confirmed & corrected

**Finding:** Asset runtime did not enforce temporal expiry; records with past governed `expires_at` could remain consumer-visible while `signal_publication_state = publishable`.

**Supersedes earlier Asset-assurance conclusion** that copying `expires_at` into `staleness.valid_until` was sufficient to prevent expired-content leakage. That copy alone was never consulted on the Asset consumer path. Do not reopen the rest of that historical assurance.

**Correction:**
- `assetSignalTemporalPolicy.ts` — date-only `publishable_from` → start of UTC day; date-only `expires_at` → end of UTC day (aligned with `validityPolicy` end-of-day convention); full ISO used as authored.
- Matcher + food-recall Asset builders fail closed outside the window; `suppressed` / `expired` publication states never emit cards; inactive sources remain blocked.
- Render gate `isPublicationRecordPubliclyRenderable` additionally rejects past `staleness.valid_until`.
- **No** pack date rewrite; expired v0.3 records stay expired and must fail closed at current date.

## NA-020 (P2) — corrected in same candidate

TGT-014 / TGT-015: set `product_scope_guard=cocoa_chocolate` only; regenerated embed via `npm run generate:dsa-asset-runtime-embed`. No wording/target/hierarchy/publication changes.

## NA-021 — amended (no code)

Reclassified: **no current matcher defect / intended fail-closed**. UNKNOWN → zero Signals preserved. Pass 5: operational market-resolution proof only.

## NA-022 — reachability (no remediation in this candidate)

See `PASS4_NA022_REACHABILITY.md`.

## Tests

`src/__tests__/unit/review1/pass4Corrective.na019_na020.signalsTemporalScope.test.ts` + updated in-window clocks on related suites. Evidence: `PASS4_NA019_NA020_RAW_JEST.txt` (76 passed across focused suites).
