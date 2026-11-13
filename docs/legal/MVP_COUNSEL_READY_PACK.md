# Rveel MVP — Counsel-ready legal pack (NZ / Australia)

**Branch tip at pack authoring:** see Git `integration/w5-unified-mvp-20261113`  
**Release target:** Limited NZ/Australia Android MVP (iOS separate)  
**Purpose:** One consolidated pack for qualified NZ/AU counsel. Not a substitute for legal advice.

## 1. Product promise (MVP)

Scan a food barcode → identify the product → show the governed Rveel assessment when publication permits (or NR / Checking / unknown when it does not) → share an exact-product link.

Optional deferred for this MVP: guided Evidence Authority contribution submit; Community Agreements (WP09).

## 2. Critical technical safety controls (engineering status)

| Risk | Control | Status |
|---|---|---|
| Wrong product identity | WEB-01A `publicShareCodesMatch`; OFF-only public web; SJ-06 stale load guards; no unrelated fallback on zeros | Implemented; regression suite covers contracts |
| Unpublished score leak | Publication latch; web teaser veil; Share image score semantics gated on `publicationSettled` | Implemented |
| NR / Checking as Rated | Fail-closed presentation (no number / colour / Rated label) | Implemented |
| Contribution before admission | Evidence Authority admit path; MVP feature gate defaults guided submit **OFF** for store builds | Gate added for MVP |
| Community Agreements writes | WP09 migration **not** applied; feature gate defaults **OFF**; client fetch/submit no-op when OFF | Deferred |

## 3. Open Food Facts — data and image rights (for counsel)

**Facts (engineering inventory):**
- Product identity, nutrition, ingredients, categories, ecoscore-related fields, and front/ingredients/nutrition images are retrieved from Open Food Facts (OFF) APIs and related CDN image hosts in normal scan flows.
- Share / Vercel landing pages may display OFF product title, brand, barcode, and OFF-hosted front image URLs for the matched barcode.
- The app also references Open Food Facts as an external website for unknown products.

**Licence posture (public OFF documentation — counsel to confirm for commercial use):**
- OFF database: Open Database License (ODbL) — share-alike / attribution / database combination obligations may apply.
- Product photographs on OFF: generally Creative Commons Attribution-ShareAlike (CC BY-SA), with possible third-party rights remaining.
- Public API availability ≠ automatic clearance for every commercial redistribution pattern.

**Unresolved for counsel (do not waive):**
1. Exact attribution and share-alike obligations for in-app display, Share Cards, and Vercel HTML teaser pages under NZ/AU commercial release.
2. Whether any local caching / derived databases trigger ODbL share-alike publication duties.
3. Image rights where OFF image may embed third-party trademarks or unlicensed photography.
4. Required user-facing attribution copy and placement (app Settings, Result, Share landing footer).

**Engineering interim:** Prefer fail-closed unknown / missing imagery over inventing identity; retain barcode-exact matching; do not fabricate scores from incomplete OFF data.

## 4. Privacy, terms, correction route

| Item | Engineering note | Counsel action |
|---|---|---|
| Privacy Policy / Terms | Share landing links to `/privacy`; onboarding legal acceptance components exist; confirm shipping URLs and store listing match live documents | Review and approve final copy + hosting |
| Support / correction contact | `EXPO_PUBLIC_SUPPORT_EMAIL` expected in EAS env before store submission (`app.config.js`) | Confirm monitored NZ/AU-capable inbox and SLA |
| Evidence trail | Evidence Authority sessions/snapshots retain admission provenance for contributed facts; OFF-sourced publication uses governed methodology | Confirm adequacy for complaint investigation |
| Analytics / permissions | Disclosures must match shipping build (camera, network, any analytics SDK) | Review against Privacy Policy |
| Independent assessment disclaimer | Result presentation includes limitation / confidence surfaces; disclaimer must not excuse misleading assessments | Review wording |

## 5. Fair Trading / ACL substantiation

Published assessments must remain tied to governed methodology and evidence. Engineering must not:
- Attach a score or claim to the wrong barcode.
- Show Rated presentation without publication permission.
- Treat user contribution as authoritative pre-admission.
- Invent health, safety, certification, or misconduct allegations outside governed lanes.

Counsel should review the consumer-facing methodology summary and any marketing claims separately from this pack.

## 6. App Links / signing (Android)

- Debug APK App Links verification used a **temporary debug** certificate fingerprint in `assetlinks.json`.
- Google Play App Signing uses a **different** certificate. Production `assetlinks.json` must list the Play App Signing SHA-256 before public link verification can be claimed.
- Debug verification ≠ release verification.

## 7. Explicit MVP exclusions (not launch blockers)

- WP09 Community Agreements migration and UI.
- Guided contribution submit (store default OFF; prior UAT admit proved on UAT host only; public host currently reports `authorityEnv=uat` while store profiles expect `production` — do not enable submit for public until authority env and admission are production-safe).
- Permanent custom domain website.
- Exhaustive third-party share-channel matrix (WhatsApp/SMS/etc.) beyond working Share Product Link.
- Simultaneous iOS launch / Universal Links.

## 8. Recommended counsel questions (one review)

1. Is current OFF data/image usage lawful for a commercial NZ/AU food-assessment app under ODbL/CC BY-SA as implemented?
2. Are Privacy Policy, Terms, and correction routes adequate for public ratings of identifiable products?
3. Are Result / Share consumer statements substantiated for Fair Trading Act / Australian Consumer Law purposes?
4. Any additional mandatory notices before limited public Android release?

## 9. Engineering GO vs LEGAL HOLD

Technical MVP may be **GO** with deferred optional features gated off.  
Public launch remains **LEGAL HOLD** until counsel clears §§3–5 and production App Links signing is aligned.
