# Alerts v2 — taxonomy (governed **Signals** model)

**Umbrella term:** **Signals** — user-facing label can remain “Alerts” in some locales if needed, but **types are never ambiguous**.

## Class A — Safety & regulatory signals

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Protect user from known hazards (recalls, contamination, non-compliance). |
| **User meaning** | “Official or legally serious — act or verify.” |
| **Automatic vs user** | Automatic when match criteria met; user cannot disable **active recall** visibility (may allow acknowledgment UI only). |
| **Scored** | Not a “preference score”; binary or severity band tied to authority. |
| **Official vs app** | **Official** (authority-sourced) or **app routing** to authority with clear label. |
| **Free vs premium** | **Always free** for active, matched recalls. |
| **Severity** | High default for matched recalls. |
| **Confidence** | Shown as match quality (exact barcode vs brand-only). |
| **Shareability** | Share text must not over-claim beyond authority wording. |
| **Priority** | **P0** — never buried. |

## Class B — Transparency & methodology signals

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Explain data limits, source, freshness, methodology version. |
| **User meaning** | “How we know / what we don’t know.” |
| **Automatic** | Driven by completeness, confidence, stale data, fallback use. |
| **Scored** | Often non-scored; may reference score **methodology**. |
| **Official vs app** | **App-native interpretation** bounded by Phase 2 claim registry. |
| **Free vs premium** | Core transparency **free**; extended methodology narrative may be premium **if** it does not gate safety. |
| **Severity** | Low–medium (informational). |
| **Shareability** | Encourage linking to methodology doc over screenshot claims. |
| **Priority** | **P1** — visible but below P0. |

## Class C — User-choice & preference signals

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Reflect user ethics / geopolitical / environmental preferences. |
| **User meaning** | “You asked us to flag this pattern.” |
| **User-controlled** | Tied to `useAlertsStore` (or successor) toggles. |
| **Scored** | May tie into ethics pillars; clearly labeled **preference overlay**. |
| **Official vs app** | **User-preference overlay**, not regulator. |
| **Free vs premium** | Base toggles **free**; advanced lists / org tools **premium-eligible**. |
| **Severity** | User-configurable; default medium. |
| **Shareability** | Must label as preference-based in share snippets. |
| **Priority** | **P2** — must not mimic P0 styling. |

## Class D — Premium insight signals (optional layer)

| Attribute | Definition |
|-----------|------------|
| **Purpose** | Deeper narrative, comparisons, history, advanced org. |
| **Automatic** | Mixed — may auto-surface for subscribers with clear badge. |
| **Scored** | Often **methodology-extended** or composite insights. |
| **Free vs premium** | **Premium** for depth; never sole carrier of P0. |
| **Priority** | **P3** — below P0–P2 on same screen. |

## Naming in UI

- Tab: **“Signals”** or **“Alerts & signals”** (pick one per locale and stick).
- Preference settings: **“Your alert preferences”** with subtitle **“Not government recalls.”**

## Lane 2 / Lane 1 boundary

**Taxonomy, IA, copy, and settings models** can ship in design/spec first. **Broad new automatic triggers** for Class A/B wait on Lane 1 explicitness ([source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md), [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md)).
