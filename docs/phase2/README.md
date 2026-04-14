# Phase 2 — Truth Engine & Claim Governance

Documentation-first foundation for **Rveel** (formerly Phase 1 rename complete for engineering; release items stay in `docs/phase1/phase1-closeout-checklist.md`).

## Deliverables (this phase)

| File | Purpose |
|------|---------|
| [`claim-registry.csv`](claim-registry.csv) | Machine-sortable inventory of material public-facing claims (55 data rows + header). |
| [`language-standard.md`](language-standard.md) | Prohibited / restricted / preferred wording for high-risk terms. |
| [`claim-to-code-map.md`](claim-to-code-map.md) | Trace claims → engine, i18n, or services (concrete paths). |
| [`controlled-terms.md`](controlled-terms.md) | Approved vocabulary for recurring concepts. |
| [`claim-drift-log.md`](claim-drift-log.md) | keep / revise / retire / defer with rationale. |
| [`methodology-version-lock.md`](methodology-version-lock.md) | Rveel Score `v*` string maintenance + review triggers (Phase 3). |

## Claim classes (required taxonomy)

- `A_direct_product_fact` — barcode, label-sourced fields, recall records, etc.  
- `B_third_party_methodology_output` — Nutri-Score, Eco-Score, NOVA, certification systems.  
- `C_app_native_interpretation` — Rveel Score, pillars, highlights wording, share templates, disclaimers.  
- `D_user_preference_overlay` — preference-driven alerts and overlays.

## Registry maintenance

Regenerate CSV from the inline generator (keeps columns stable):

```bash
node scripts/generate-phase2-claim-registry.mjs
```

Edit **rows inside** `scripts/generate-phase2-claim-registry.mjs`, then run the command above.  
Alternatively, edit `claim-registry.csv` directly and mirror critical rows into `src/claims/definitions.ts` for EN automated tests.

## Automated EN checks (subset)

```bash
npm test -- src/__tests__/unit/claims/governance.test.ts
```

`src/claims/definitions.ts` lists `enI18nPath` entries checked for `mustNotSay` / `approvedAnchors` drift against `src/i18n/locales/en.json`.

## Phase 3 suggestions

1. Expand governance tests to FR/ES for parity on legal + data-limitation modals.  
2. Tighten **ShareContentBuilder** and highlight strings per `claim-drift-log.md` (small targeted PRs).  
3. Versioned **methodology changelog** tied to engine folder releases.  
4. Optional: CSV → JSON codegen to avoid dual maintenance.
