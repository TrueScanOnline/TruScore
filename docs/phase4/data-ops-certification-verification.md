# Data ops — certification verification

## Verification source

- Primary: certifying body database or published list (varies by scheme: organic, halal, etc.).
- Secondary: pack image review (human) with **expiry** on image-derived rows unless refreshed.

## Product vs parent level

| Level | When |
|-------|------|
| **Product (GTIN)** | Default — cert on pack applies to SKU. |
| **Parent / brand** | Only when scheme explicitly brand-wide AND evidence doc states “all products under brand X” — rare; flag `brand_wide=true`. |

## Eligibility

- Certification must be **in date** for display as “active”.
- Expired → show **“expired / verify on pack”** or suppress positive badge per product policy.

## Staleness

- Re-verify on **T_refresh** (e.g. 90 days) for high-risk claims; longer for stable schemes.
- App shows **last_verified_at** in transparency signal (Class B).

## Override / dispute

- **Override:** reviewer marks `disputed_override` with legal sign-off field (future).
- **Dispute from brand:** log ticket; do not auto-remove without review — may downgrade to “unverified claim on pack only”.

## App output

- Certification contributes to trust **only** when mapping row `status=verified` and not expired.
