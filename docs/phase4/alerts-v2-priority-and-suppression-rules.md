# Alerts v2 — priority, suppression, grouping

## Priority stack (render order)

1. **P0** — Safety & regulatory (active recall, critical compliance).
2. **P1** — Transparency / methodology (limited data, stale, source attribution).
3. **P2** — User preference hits (boycott, ethical dimension).
4. **P3** — Premium insight (badged).

## Non-burial rules

- P0 must appear **above the fold** on product result or in a dedicated **immutable strip** (one tap to expand details).
- P0 cannot be collapsed into generic “3 alerts” without explicit **“includes safety recall”** text.

## Anti-mimicry

- P2 must **not** use red government-style iconography reserved for P0.
- Copy for P2 must include **“based on your preferences”** where any warning tone is used.

## Duplicate suppression

- Same underlying event (e.g. recall + banner both from one recall id) → **single** P0 card; link out for detail.
- Dedupe key examples: `recall_id`, `certification_id`, `preference_rule_id`.

## Visible signal cap

- Soft cap: **4** expanded cards on result; beyond → **“+ N more”** grouped sheet.
- P0 always fully listed (not hidden inside collapsed group).

## “Why am I seeing this?”

Each class requires:

| Class | Minimum explanation |
|-------|---------------------|
| A | Match path (barcode vs brand), authority link, date. |
| B | Completeness %, primary source, methodology version id. |
| C | Preference name + toggle deep link. |
| D | “Subscriber insight” + methodology scope. |

## Premium vs core trust

- Premium must **not** replace P0/P1 slots or intercept recall navigation.
- Paywall upsell may appear **below** trust stack or on dedicated insight tab.

## Alert generation timing (Lane 1 dependency)

- Signals computed on **terminal or declared-stable** product snapshot per [runtime-observability-plan.md](runtime-observability-plan.md).
- If score updates after Phase 3 merge, **re-evaluate** B/C classes; **re-evaluate** A only if recall matcher is phase-aware (usually static).
