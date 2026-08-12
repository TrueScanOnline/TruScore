# Wave 4 User Contributions — closure handoff (2026-08-12)

## Package

First bounded Wave 4 implementation: contribution policy, evidence lifecycle, confirm/dispute, eligibility/promotion boundary, cert/origin leakage stop, country producer convergence, Ingredients/Nutrition local-scoring isolation, exposure inventory, required proofs.

**Not in this package:** UI consolidation, Lane A/Origins provisional scoring activation, egg reveal, Wave 1/EAS/OTA/deploy, allergen feature work, OCR expansion, extra architecture specs.

## Baseline and branch

| Item | Value |
|---|---|
| Assurance baseline | `f283494` / tag `wave4-assurance-baseline-20260809` |
| Implementation branch | `wave4/contribution-governance-20260812` |
| Preserved dirty WIP (not accepted) | `preserve/post-f283494-contribution-wip-20260809` (`b7bf15d`) |
| Deploy / EAS / OTA | **Not authorised — not done** |

## Policy (SoT)

`src/config/contributionPolicy.ts`

- Origins: 1 independent confirmation, 1 active response/contributor/version, 2 disputes → `review_required`, no automatic withdrawal, founder override supported, **canonicalPromotionPermission = false**, no personal provisional scoring.
- Certifications: same confirm/dispute math; Lane A provisional **off**; Lane B **non-scoring**; promotion permission reserved (`true`) but `calculateTruScore` does **not** auto-union promoted tags.
- Ingredients/Nutrition: no local/cross-user/canonical scoring from submitted evidence; authority = OFF public product retrieval.

## Runtime wiring

- `calculateTruScore` → `toScoringProduct` (pending / standalone local contribution fields stripped). Boundary failure strips unauthored fields and still returns a score (SCAN).
- Manual Edit save: origin/certs → `submitGovernedEvidence`; Vercel `manual-products` payload is allergens/additives only.
- CoM overlay: `submitManufacturingCountry` also writes governed Origins evidence; verification threshold = `1 + independentConfirmationsRequired`.
- Client merge: does not copy origin/cert/nutrition/ingredients from contributions onto the scoring Product.
- Backend GET `/api/manual-products` sanitizes leak keys; historical leak keys are **preserved in storage** (no deletion).
- New `POST/GET /api/contribution-evidence` persists evidence versions (`scoringFieldsWritten: false`).

## Proofs

```
npm run test:wave4-contributions
npm run test:user-contributions
npm run test:user-contributions-e2e
npm run inventory:wave4-contributions
```

Required IDs covered: POL-01/02/03, CERT-01/02/03, ORG-01/02, NUT-01/02, SCAN-01/02/03, W1-01.

Inventory: `docs/uat/WAVE4_CONTRIBUTION_EXPOSURE_INVENTORY_20260812.md` (classify only; conservative treatment **pending**; no deletion).

## Dual-device UAT

No env/EAS/Signal-pack/Asset changes. AU TestFlight + NZ Expo Go convention unchanged. This package is JS/TS only.

## Founder next (not this package)

- Review/merge branch when ready.
- Deploy Vercel API (`contribution-evidence` + `manual-products` sanitize) only when a later instruction authorises backend deploy.
- Do not activate Origins/Cert Lane A scoring or UI consolidation until separately authorised.
