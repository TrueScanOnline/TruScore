# Engine / output / framing drift review

**Purpose:** List **high-risk** gaps between implementation, user-visible copy, and governance.

## Score logic vs confidence

- **Risk:** Trust score updates after background merge while user already read **stale** confidence label.
- **Mitigation:** Bind confidence refresh to same event as score recompute; observability [runtime-observability-plan.md](runtime-observability-plan.md).

## Score vs alert conditions

- **Risk:** Preference signal implies **safety** (copy drift).
- **Mitigation:** Separate templates per [alerts-v2-taxonomy.md](alerts-v2-taxonomy.md); code-level `class` on each signal.

## Confidence vs public framing

- **Risk:** Marketing says “most accurate” while `confidence.label=low` common on fallbacks.
- **Mitigation:** Marketing claims only from **claim-registry** rows with measured prevalence caps.

## Share sheet vs in-app

- **Risk:** Shared image omits methodology / limited-data disclaimer.
- **Mitigation:** Footer on share layout; claim class **interpretation** requires disclaimer string.

## Premium framing

- **Risk:** Plus upsell adjacent to recall card reads like **paid recall info**.
- **Mitigation:** IA rules in [alerts-v2-information-architecture.md](alerts-v2-information-architecture.md).

## Phase 3 methodology highlights

- If “highlights” use LLM or heuristics, map every bullet to **interpretation** or **methodology** class in Phase 2 registry — no silent **direct fact** promotion.

## Action items (engineering)

1. Single `buildScanResult()` path that emits [scan-output-contract.md](scan-output-contract.md) (future refactor — **deferred** if large).
2. Diff check: `calculateTrustScore` inputs logged when score delta &gt; threshold between phases.
