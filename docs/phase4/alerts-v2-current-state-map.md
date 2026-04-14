# Alerts v2 — current state map

**Product name:** Rveel. **Problem:** Multiple surfaces use “alert” language for different semantics. This map is the baseline for taxonomy redesign.

## Surfaces inventory

| Surface | Code / area | What the user sees | Nature |
|---------|-------------|-------------------|--------|
| **Product recalls** | Recall integration on result / safety modules | Government-linked recall notices | **Safety / regulatory** |
| **Banner alerts** | `bannerAlertsService`, ethics pillar banners | Top-of-flow messages (ethics, data gaps, etc.) | **Mixed** — methodology, preference, or safety-adjacent |
| **Alerts tab / “Values” legacy** | `useAlertsStore`, preferences in SecureStore | User toggles for geopolitical / ethical / environmental “alerts” | **User-choice / preference** (not regulator alerts) |
| **Shareable alert-like content** | Share flows on result / score cards | Exported summaries | **Trust + interpretation** — must match claim class |
| **Premium-gated insight** | Premium hooks on result / methodology deep links | Deeper breakdowns | **Premium depth** — must not hide safety |

## Overlap risks

1. **Preference “alerts”** vs **recall alerts** — same word, different legal weight.
2. **Banner** copy can read like **official** warning without source attribution.
3. **Ethics pillar** messages may imply **scored regulatory** outcome.

## Data inputs today

- Product fields (ingredients, categories, certifications, origin).
- `useAlertsStore` dimensions and boycott lists.
- Recall feed matching (see data ops recall doc).
- Premium flags from subscription state.

## Gaps vs governed system

- No single **alert_class** on all surfaces.
- Suppression / dedupe rules are implicit in UI order.
- “Why am I seeing this?” is inconsistent.

## Next

- [alerts-v2-taxonomy.md](alerts-v2-taxonomy.md)
- [alerts-v2-priority-and-suppression-rules.md](alerts-v2-priority-and-suppression-rules.md)
