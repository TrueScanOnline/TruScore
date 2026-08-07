# Build 30 — Subject scope path + product_family assessment (read-only)

**Baseline:** `1c12e339edcaa39572f107a49e906473ba117e38`  
**Authority:** Wave 1 closure addendum — disclosure and recommendation only. **No** product_family implementation, A-data mutation, or production matching change authorised here.

## 1. Current subject-resolution / eligibility path

Entry: `buildWorkstreamCRuntimePublicationRecords` → `resolveReviewedRetailChainUnified` → `buildWorkstreamCPublicationRecordsFromParsedPack`.

| Mechanism | Behaviour | File |
|-----------|-----------|------|
| Brand candidates | Tokens from `brand_owner` + comma-split `brands` | `resolveWorkstreamCRetailChain.ts` |
| Alias match | Reviewed aliases: exact token; or alias_normalized length ≥8 substring in brands+name blob | same |
| Canonical match | Exact token vs canonical/display name | same |
| Pick | Build 30: longest canonical name; **remediation:** prefer product_name token hits | same |
| Cadbury bridge | B0067+P0009 + chocolate/cocoa context → B0241 | `applyCadburyNgoSubjectBridge` |
| `linkMatchesChain` | brand equality; parent equality; product_family Alfamino hardcoded + name includes `alfamino` | `workstreamCPublicationCore.ts` |
| `GLOBAL_CONTEXT` | Eligible only if scan market AU or NZ | `marketMatchesLink` |
| Injected chain | Tests only; runtime `injectedChain: null` | runtime |
| Legacy Safety | Always suppressed Stage 2 | `pathControl.ts` |

**SharedIdentityContext** is separate and does **not** feed C subject matching.

## 2. Cadbury dual-positive vs Ritz negative

| | Cadbury | Ritz |
|--|---------|------|
| Typical chain | B0067 → bridge **B0241** / P0009 | **B0069** / P0009 |
| Links | **SL008**, **SL011** (`subject_id=B0241`) | none for B0069 |
| Signals | `SIG_NEWS_GLOBAL_001` + `SIG_NEWS_GLOBAL_002` | none |
| Why | Brand equality to B0241 | Shared parent P0009 insufficient; no Ritz-specific exclude |

## 3. Recommended deterministic Signal target model (founder review)

Ordered targets via **explicit reviewed links only** (no keyword scope engine):

1. **product** (GTIN / governed product_id)  
2. **product_family** (canonical family id + membership table)  
3. **brand / sub-brand**  
4. **entity / operational entity**

## 4. product_family impact assessment (read-only)

### Proposed structures

- `product_family`: id, display name, market_keys, review_state, lineage  
- `product_family_membership`: reviewed product_id/GTIN → family_id (no fuzzy name membership)

### SharedIdentityContext

Expose `canonical.product_family_ids[]` (and/or primary) from membership tables only.

### Dynamic Signals

Subject links: `subject_type=product_family`, `subject_id=<family id>` — one link, many members. Retire Alfamino name heuristic when membership exists. Keep NGO brand-scoped SLs unless founders add family subjects.

### Migration

| Link | Today | Direction |
|------|-------|-----------|
| SL002 Alfamino | Hardcoded name | Family membership |
| Brand NGO SLs | Stay brand | Do not widen to parent |
| Recall RPF_* | Separate recall family ids | Decide align vs separate |

### Required tests (when authorised)

Positive member; negative sibling/same-parent non-member; Cadbury dual + Ritz − regressions; KitKat B0060; fail-closed unreviewed membership; no legacy Safety brand-wide restore.

**No implementation in this instruction.**

## 5. Multiple reviewed brand pathways (clarification 2026-08-07)

**Current runtime:** `resolveReviewedRetailChainUnified` returns a **single** `{ brand_id, parent_id }` chain. Signal matching then uses that brand and parent at each link’s `subject_type`.

**MVP required for KitKat:** KitKat brand + Nestlé parent only — supported.

**Not supported yet:** simultaneous Product → Brand A → Entity A **and** Product → Brand B → Entity B co-brand paths. Do **not** infer a second brand from descriptive text alone.

**Recorded for later Chaining Asset recalibration** (with product_family membership): multi-path reviewed brand relationships; deterministic evaluation at each approved target level. Do not expand remediation into co-branding ontology under Wave 1 closure.

## 6. Terminology

Next integrated work consumes the **founder-approved Rveel Dynamic Signals Asset** / **integrated Dynamic Signals build** — not “Launch Corpus”.
