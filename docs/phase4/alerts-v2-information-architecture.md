# Alerts v2 — information architecture

## Umbrella label

**Recommended:** Primary nav label **“Signals”**; retain “Alerts” only as SEO/legacy alias in one subtitle release, then drop.

## Product result page

| Block | Content |
|-------|---------|
| **Trust strip** | Score + confidence + freshness chip (P1 as needed). |
| **Safety block** | P0 only — recalls, critical notices. |
| **Insight row** | Short ethics / preference hits (P2) with distinct visual. |
| **Premium row** | P3, collapsed by default for free users. |

## Tab structure

**Tab 1 — “For this product”**  
- All classes relevant to current barcode, grouped by priority rules.

**Tab 2 — “Your preferences”** (or settings sub-screen)  
- Toggles, boycott lists, import/export (future), **clear disclaimer** vs recalls.

**Activity / history (optional later)**  
- Separate from regulator content; label **“Your scan history”** not “Alerts history” if it mixes non-safety items.

## Premium controls

- Settings → **“Rveel Plus”** subsection: what extra **signals** subscribers get (depth, not safety).
- Product page: single **“Plus”** entry point; no interstitial on P0 tap.

## IA anti-patterns

- Single list mixing recall + “you dislike palm oil” without headers.
- Tab named “Alerts” containing only preferences.

## Related

- [alerts-v2-entitlement-matrix.md](alerts-v2-entitlement-matrix.md)
- Phase 3 tab spec if exists — align naming in one PR when implementing.
