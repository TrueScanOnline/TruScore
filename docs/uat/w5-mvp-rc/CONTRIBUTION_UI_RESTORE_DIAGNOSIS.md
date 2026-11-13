# Contribution / WP09 UI restore — diagnosis (source only)

**Branch:** `integration/w5-unified-mvp-20261113`  
**HEAD at restore:** confirm with `git rev-parse HEAD` (started from `67f9edd`).

## Task 1 — Why buttons disappeared

| Surface | Cause |
|---|---|
| Origins **Add product origins** card CTA | Code present; hidden because `productInformationMenu` returns `[]` when `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION ≠ 1` |
| Packet Claims **Add packet information** CTA | Same MVP gate |
| Pillar / Score Highlights contribution links | Same MVP gate in `highlightContributionLinks` |
| Information missing / Improve product information menus | Same MVP gate in `voluntaryContributionOffer` + `productInformationMenu` |
| Guided Capture → Review → Confirm → Success | Present (`PacketContributionModal`); `openContribution` no-ops when gate OFF |
| Community Agreements thumbs | Code present; `isCommunityAgreementsEnabled()` OFF → bar returns null / no network |
| Checking / ineligible pillars | Still governed eligibility (publication latch + S26 live opportunity) — unchanged |

Not missing from integration. Not a second authority path. Backend for guided contribution remains the existing UAT Evidence Authority host in `.env.development`.

## Local / UAT enablement (explicit)

`.env.development` now sets:

- `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1`
- `EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS=1`
- `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV=uat`
- `EXPO_PUBLIC_BACKEND_URL=https://truscoreapi-uat.vercel.app`

Store / EAS profiles keep both MVP flags at `0`. `assertMvpFeatureGatesReleaseSafe` rejects store entitlement of either flag.

## WP09 backend

UAT `GET /api/community-agreement` returned `200` with `eligible:true` for a Cadbury origins probe (schema present on UAT). Production migration remains founder-gated and must not be applied for this restore.

## Artwork

`ResultCardArt` motif `molecular` replaced with a quieter sage/cream wash; `AboutTheseAdditivesCard` intensity lowered. Card data/behaviour unchanged.

## Visual preview

Metro / Expo Go picks up `.env.development`. The prior standalone-embedded APK will **not** show these JS/env changes until a new local test build is founder-approved.
