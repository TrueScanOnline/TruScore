# Alerts v2 — Phase 2 claim governance map

Maps each signal class to Phase 2 claim categories (**direct fact** | **third-party methodology** | **app-native interpretation** | **user-preference overlay**).

## Class A — Safety & regulatory

| Typical UI | Governance class | Notes |
|------------|------------------|-------|
| Recall title from authority | **Direct fact** (as cited) | Quote or link; no rewrite beyond shortening with ellipsis. |
| “May apply” uncertain match | **App-native interpretation** | Must use approved uncertain phrasing in claim registry. |

## Class B — Transparency & methodology

| Typical UI | Governance class |
|------------|------------------|
| “Limited data” | **App-native interpretation** (bounded) |
| Methodology version string | **Third-party methodology** reference (TESTUME / internal version ids) |
| Source name list | **Direct fact** (which API responded) + **interpretation** for “trusted” adjectives — check registry |

## Class C — User preference

| Typical UI | Governance class |
|------------|------------------|
| “Flags your boycott list” | **User-preference overlay** |
| Ethical “concern” wording | **App-native interpretation** — must not imply government action |

## Class D — Premium insight

| Typical UI | Governance class |
|------------|------------------|
| Comparative “worse than category” | **Third-party methodology** + **interpretation** — needs registry row |
| “AI summary” (if any) | **Interpretation** — highest scrutiny; align with drift log |

## When to update Phase 2 artifacts

Any new **automatic** copy string shown to users for Classes A–D → update `docs/phase2/claim-registry.csv` and log in `docs/phase2/claim-drift-log.md`.

See also [update-review-triggers.md](update-review-triggers.md).
