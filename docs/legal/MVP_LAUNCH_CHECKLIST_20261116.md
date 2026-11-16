# MVP launch checklist — legal protection & hardening

**Date:** 16 November 2026  
**Branch:** `build/w5-founders-native-20261114`  
**Companion evidence:** `MVP_LAUNCH_HARDENING_EVIDENCE_20261116.md`

## Product integrity

- [ ] Result methodology modal (S27) matches accepted B1 wording on a running build with this JS
- [ ] Account Stage 1 regression (Help, Privacy & Data, Legal destinations fail-closed)
- [ ] Rated / NR / Checking publication unchanged for non-held products
- [ ] Evidence Authority admission/provenance unchanged
- [ ] Product identity / share deep-links still match barcodes
- [ ] Premium / billing / authentication remain gated off

## Dispute & hold

- [ ] Report incorrect assessment opens only when `EXPO_PUBLIC_SUPPORT_EMAIL` configured
- [ ] Missing support email shows not-configured (no invented address)
- [ ] `POST /api/publication-hold` requires founder token; default is no hold
- [ ] Active hold withholds Result score UI without changing engines (distinct from NR/Checking)
- [ ] Web preview omits OFF image / sensitive fields under hold; `Cache-Control: no-store`
- [ ] Hold release restores publication after review
- [ ] Postgres configured before relying on hold persistence in production

## Legal acknowledgement

- [ ] Skip intro cannot bypass disclaimer acknowledgement
- [ ] Legacy Skip users are forced back through legal step
- [ ] No Terms/Privacy acceptance stamped while `legalDestinations.*.ready` is false
- [ ] Non-store `legalDocumentsTestReady` cannot activate in store releases

## OFF / licensing

- [ ] Automatic OFF public contribution disabled (`offPublicContribution` != 1)
- [ ] No `truescan@example.com` User-Agent
- [ ] Real OFF/support contact configured before any OFF write entitlement
- [ ] Share landing attributes OFF photos when an image is shown
- [ ] BBFAW / KTC send-ready letters reviewed; clearance still outstanding

## Privacy / telemetry

- [ ] Share-event telemetry default OFF
- [ ] Local share analytics default OFF
- [ ] Sharing still works without telemetry
- [ ] Privacy Policy draft updated; still **not published**

## Release gate (founder)

- [ ] Legal entity / contacts chosen
- [ ] Counsel-approved Privacy/Terms published
- [ ] `legalDestinations.*.ready` flipped only after publication
- [ ] Monitored support inbox live
- [ ] No public store submit without separate launch authorisation
