# Methodology version lock — Rveel Score

## Source of truth

| Artifact | Role |
|----------|------|
| `src/config/methodologyVersion.ts` | **Single constant** `RVEEL_SCORE_METHODOLOGY_VERSION` (currently `1.4`). |
| `src/i18n/locales/en.json` → `infoModal.trustScore.note` | Must contain the substring `v{VERSION}` (e.g. `v1.4`) and stay aligned with engine behaviour. |
| `src/i18n/locales/fr.json` / `es.json` → same path | **Parity:** same version token and materially the same limitations (sources, public systems, missing-grade baselines). |

## Automated check

`src/__tests__/unit/config/methodologyVersion.test.ts` fails if any of EN/FR/ES notes omit the version string from `methodologyVersion.ts`.

## Human review trigger

When touching paths in `METHODOLOGY_REVIEW_TRIGGER_PATHS` (exported from `methodologyVersion.ts`):

1. Re-read the three `note` strings and pillar step copy.  
2. Bump `RVEEL_SCORE_METHODOLOGY_VERSION` if user-visible scoring meaning changes.  
3. Update `docs/phase2/claim-registry.csv` rows `method-info-modal-*` if claim posture shifts.

## Out of scope for this doc

Eco-Score modal versioning is separate; repeat this pattern there if Eco-Score explainer starts citing specific schema versions.
