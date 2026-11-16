# MVP launch checklist — legal protection & hardening

> **PERMANENT FOUNDER-MANDATED PUBLIC RELEASE BLOCKER — NO-GO.** Incorporation country, operating entity, applicable territorial legal requirements and external counsel review remain unresolved. This checklist and technical QA do NOT constitute legal clearance. See [MVP_PUBLIC_LAUNCH_BLOCKER.md](./MVP_PUBLIC_LAUNCH_BLOCKER.md) and the fail-closed [MVP_PUBLIC_LAUNCH_GATE.json](./MVP_PUBLIC_LAUNCH_GATE.json). Production/store-targeted EAS builds must pass `npm run legal:release-preflight`; closed founder UAT remains allowed. Do not mark public MVP ready until the approvals and exact release SHA are independently attested.


**Date:** 16 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Companion evidence:** `MVP_LAUNCH_HARDENING_EVIDENCE_20261116.md`

## Product integrity

- [x] Result methodology modal (S27) matches accepted B1 wording on a running build with this JS *(prior B1; not re-opened this UAT)*
- [x] Account Stage 1 regression (Help, Privacy & Data, Legal destinations fail-closed) *(contract tests + device Account guest Free)*
- [x] Rated / NR / Checking publication unchanged for non-held products *(device: 56 Fair before hold and after release)*
- [x] Evidence Authority admission/provenance unchanged *(no EA admission edits; Claims 15/25 stable)*
- [x] Product identity / share deep-links still match barcodes *(held/unheld identity retained)*
- [x] Premium / billing / authentication remain gated off *(Account: Free / guest)*

## Dispute & hold

- [x] Report incorrect assessment opens only when `EXPO_PUBLIC_SUPPORT_EMAIL` configured *(copy: no placeholder; device shows not-configured path messaging)*
- [x] Missing support email shows not-configured (no invented address)
- [x] `POST /api/publication-hold` requires founder token; default is no hold *(UAT: 401 unauth; GET none before hold)*
- [x] Active hold withholds Result score UI without changing engines (distinct from NR/Checking) *(device screenshot)*
- [x] Web preview omits OFF image / sensitive fields under hold; `Cache-Control: no-store` *(live UAT)*
- [x] Hold release restores publication after review *(API + device Result 56 restored)*
- [x] Postgres configured before relying on hold persistence in production *(UAT Neon isolated; operational=1)*
- [x] Audit hold/release history persisted *(publication_hold_events)*

## Legal acknowledgement

- [x] Skip intro cannot bypass disclaimer acknowledgement *(prior hardening + returning-user path)*
- [x] Legacy Skip users are forced back through legal step *(covered by legal gate tests)*
- [x] No Terms/Privacy acceptance stamped while `legalDestinations.*.ready` is false *(device: legalDocumentsAcceptedVersion null)*
- [x] Non-store `legalDocumentsTestReady` cannot activate in store releases *(unit)*
- [x] Public release preflight exits nonzero; all 15 registry requirements PENDING

## OFF / licensing

- [x] Automatic OFF public contribution disabled (`offPublicContribution` != 1)
- [x] No `truescan@example.com` User-Agent
- [ ] Real OFF/support contact configured before any OFF write entitlement *(still outstanding for public)*
- [x] Share landing attributes OFF photos when an image is shown *(prior hardening)*
- [ ] BBFAW / KTC send-ready letters reviewed; clearance still outstanding

## Privacy / telemetry

- [x] Share-event telemetry default OFF
- [x] Local share analytics default OFF
- [x] Sharing still works without telemetry
- [x] Privacy Policy draft updated; still **not published**

## Release gate (founder)

- [ ] Legal entity / contacts chosen
- [ ] Counsel-approved Privacy/Terms published
- [ ] `legalDestinations.*.ready` flipped only after publication
- [ ] Monitored support inbox live
- [x] No public store submit without separate launch authorisation *(preflight + this UAT)*
- [ ] iOS TestFlight visual QA on current tip
