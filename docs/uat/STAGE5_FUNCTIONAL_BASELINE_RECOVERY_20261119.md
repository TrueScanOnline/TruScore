# Stage 5 — Functional baseline recovery delivery

**Branch:** `recovery/w5-functional-baseline-20261119`  
**Base tip:** `5f2dce9` (unified MVP / P0 stamp)  
**Founder CF decisions:** approved 2026-11-19  
**publicReleaseStatus:** **BLOCKED** — STOP for Stage 6 independent acceptance

## Scope delivered

| CF | Outcome |
|----|---------|
| CF-01/02 Option C | Agree≠Change promoted; dual thumbs always shown when WP09 surface open; structured Correct when destination eligible (Origins under preselected-only); honest non-submit Alert when structured Correct unavailable (Packet / free-form-gated groups) |
| CF-03 | Packet Claims header Share restored (create → share → info parity with Origins); governed share rows/text via existing share framework |
| CF-04 | **STOP** — documented in `CF04_FM03R_SERVER_NR_GATE_STOP_20261119.md`; no proxy/client-trusted gate |
| CF-05 | Recovery branch created from `5f2dce9` without overwriting RC1 `0ce9969` |
| CF-06 | Transmit reconcile (`reconcileFailedTransmit` + `fetchAuthoritativeSnapshot`) promoted with regression contract tests |

## WP09 persistence (investigated, unchanged)

- Agree identity: env/barcode/group/`revisionId` (prevailing subject/version hash).
- Duplicate agree → `hasAgreed` without double-count.
- New admitted version → new revision → counts reset.
- Thumbs-down never confirms, disputes, or withdraws EA evidence.

## Tests run (automated)

- `wp09AgreeWithoutFreeFormChange.test.ts`
- `wp09DualThumbsCorrectUnavailable.test.ts`
- `packetClaimsShare.test.ts`
- `reconcileFailedTransmit.test.ts`

## Stage 5 completion conditions vs status

| # | Condition | Status |
|---|-----------|--------|
| 1 | Dual thumbs + Edit/Share/Info on Packet fixture | Code ready — **device Stage 6** |
| 2 | Origins Add/Change/Remove + authoritative refresh | Structured path present — **device Stage 6** |
| 3 | Eligible FM-03R + publication | Client path only; **CF-04 BLOCKED** |
| 4 | Admission → success/confetti | Paths wired — **device Stage 6** |
| 5 | Prohibited image/free-text remain unavailable | Policy retained — **device negative Stage 6** |
| 6 | Reconcile vs baseline register | This package + Stage 1–4 docs |
| 7 | Commit + push traceable SHA | Required after this tip |
| 8 | Android then iOS acceptance | **Stage 6** |

## Do not claim

- Public release readiness
- CF-04 complete
- Independent Stage 6 PASS without device evidence
