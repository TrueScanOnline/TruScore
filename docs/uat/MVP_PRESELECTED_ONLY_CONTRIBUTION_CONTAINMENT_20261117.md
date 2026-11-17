# MVP preselected-only contribution containment — 2026-11-17

**Branch:** `build/w5-founders-native-20261114`  
**Worktree:** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`  
**Verified starting remote HEAD:** `567a8ab1915db96ecec4a7ff3bfff3a249163da8`  
**Implementation SHA:** `956886b7eb60f87de75c82082f0e43ee8a4efbb9`  
**Final pushed tip:** `62934ff1a230ca6e1aac241c87ef5452033e7297`

---

## 1. Founder decision and scope

**ALL consumer product-evidence contributions before MVP must use Rveel predefined selectable options / authorised attestations.**

**Prohibited:** camera, gallery, photo upload, free-text packet/ingredients/origins/product wording, arbitrary typed nutrition or percentages, unrestricted manual product creation, VLM/OCR/machine packet extraction, and any alternate API achieving the same.

**Not product-evidence (kept):** barcode scanning, product search, viewing already-available source photographs, contacting support.

Historical evidence and existing scores are not deleted or rewritten merely because earlier builds allowed broader inputs.

---

## 2. Contribution-route inventory (audit)

| ID | Route | Prior inputs | MVP treatment |
|----|-------|--------------|---------------|
| CE-01 | Product information menu | Chooser | Empty while free-form guided OFF |
| CE-02 | Ingredients/Nutrition guided modal | Camera, gallery, free text, typed nutrition | **DISABLED** |
| CE-03 | Origins guided modal | Structured + free %/wording + photos | **DISABLED** (structured-only path **DEFERRED**) |
| CE-04 | Packet claims/certs free-form + photo FM-03 | Camera, gallery, free text, discovery | **DISABLED** |
| CE-05 | FM-03R absence attestation | Attestation tap | **KEEP** (Claims NR gates unchanged) |
| CE-06 | Hero Take photo → `/api/upload-photo` | Camera/gallery | **DISABLED** UI + server reject |
| CE-07 | ManualProductEntryModal → upload + manual-products | Free text + photos | **DISABLED** UI + server reject |
| CE-08 | View OFF website (unknown product) | Off-app edit | **HIDDEN** under policy |
| CE-09 | Community Agreements WP09 | Agree / Correct→guided | **KEEP agree** when entitled; Correct blocked while guided OFF |
| BE-01 | `/api/evidence-authority` | Images, manual-text, attestation, submit | Images/manual-text **rejected**; attestation submit **allowed** |
| BE-02 | `/api/upload-photo` | Public photo POST | **403 before storage** |
| BE-03 | `/api/manual-products` POST | Manual tags/product | **403**; GET historical read retained |
| BE-05/06 | OFF public write | Kill-switch | Remains **OFF** |
| BE-09 | `/api/manufacturing-country` POST | Country + optional photo | **403** under same write policy |

---

## 3. Previously enabled prohibited paths

- Expo Go `.env.development` and `uat-founders-*` previously set `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1`, entitling free-form guided surfaces.
- Hero Take photo and ManualProductEntry were **ungated** on all profiles.
- `/api/upload-photo` and `/api/manual-products` POST accepted unauthenticated consumer writes.
- Discovery asset `packet_certification_manual_discovery_v1_0_1.json` declares `free_text_is_always_available: true` (immutable; superseded by MVP overlay).

---

## 4. Allowed-input matrix (now)

| Input class | Consumer MVP |
|-------------|--------------|
| FM-03R `packet_absence_user_attestation` | **Allowed** when Claims NR eligibility + authority env |
| Community Agreement **agree** | **Allowed** when `EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS=1` |
| Governed country / origin claim type / cert ID / packet-claim option (standalone, no free text/photo) | **Unavailable** — deferred gap (no inventoried taxonomy/path) |
| Photos, free text, manual product, VLM/OCR | **Forbidden** |

---

## 5. Frontend and backend enforcement

**Canonical policy:** `src/config/mvpContributionInputPolicy.ts` (`mvp_preselected_only_v1_20261117`), default-deny (`EXPO_PUBLIC_MVP_PRESELECTED_ONLY !== '0'`).

**Gates:** `src/config/mvpFeatureGates.ts` — free-form guided blocked while policy active; FM-03R via `isClaimsAbsenceAttestationContributionEnabled()`.

**UI:** Hero `allowTakePhoto=false`; ManualProductEntry unmounted; PacketContributionModal auto-closes if opened; FM-03 photo choice retired; Add claim/cert hidden; unknown-product free-text/OFF-edit CTAs hidden.

**Server:** `backend/vercel/lib/mvpContributionInputPolicy.ts` wired into `upload-photo.ts`, `manual-products.ts`, `evidence-authority.ts`, `manufacturing-country.ts`. Founder-admin bypass only with matching `X-Rveel-Founder-Admin` / `RVEEL_FOUNDER_ADMIN_TOKEN`.

**Discovery overlay:** `mvpDiscoveryInputRestriction()` / `discoveryFreeTextConsumerSubmissionAvailable()` — does not rewrite immutable JSON.

**VLM:** `runExtraction` forces abstaining producer under policy.

**Packet card / Claims pillar:** `packetEvidenceStatus` helper retained; no inference from empty lists or score 15; AMBER variant-scope risk unchanged.

---

## 6. FM-03 vs FM-03R

| | FM-03 photo | FM-03R attestation |
|--|-------------|-------------------|
| MVP consumer entry | **Retired** | **Retained** |
| Eligibility | n/a | Claims NR gates **not** broadened to Rated |
| Characterisation | Photograph | User attestation (not independently verified) |

---

## 7. Intentionally deferred

- Preselected-only Origins (country + claim type without free text/photo) as a dedicated consumer path.
- Catalogue-only certification / packet-claim selection without free text.
- Server-side Claims NR requirement for FM-03R admission (AMBER/RED).
- Variant-scoped absence presentation (AMBER, preserved).

---

## 8. Tests

- `mvpContributionInputPolicy.test.ts`, `mvpContributionInputPolicy.server.test.ts`, updated `mvpFeatureGates`, FM-03/FM-03R entry tests.
- Legal preflight remains **DENIED / BLOCKED**.
- TypeScript check expected PASS on tip.

UI tests do **not** prove live UAT API containment until the Vercel UAT backend is redeployed with this server policy.

---

## 9. Device evidence

| Platform | Status |
|----------|--------|
| Android Expo Go | Partial — Result load captures under `artifacts/mvp-preselected-only-20261117/` (reload Metro after tip). Full negative UI matrix outstanding after bundle refresh. |
| iOS | **OUTSTANDING** |

---

## 10. UAT backend deployment

Server reject paths are **in source** on this branch. They are **not** claimed operational on `truscoreapi-uat.vercel.app` until that environment is redeployed from this tip and independently exercised (without using production DBs for malicious POSTs).

Env: `RVEEL_MVP_PRESELECTED_ONLY` defaults active; set `0` only with post-MVP founder approval.

---

## 11. Protected invariants

- Account tab CLOSED  
- Frozen native UAT tag unchanged  
- `publicReleaseStatus: BLOCKED`; 15 requirements PENDING  
- No scoring / Rateability / Confidence / admission-meaning / source-precedence changes  
- OFF public contribution remains OFF  
- No production backend deploy / store submission  

---

## 12. Technical completion vs public launch

| Verdict | Meaning |
|---------|---------|
| **Technical (source)** | Preselected-only containment implemented in client + server source; FM-03R preserved; free-form/photo paths closed in UI and reject helpers. |
| **Public launch** | **BLOCKED** — legal gate unchanged; UAT server redeploy + device matrix + deferred catalogues remain. |
