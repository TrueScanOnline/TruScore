# MVP preselected-only — independent acceptance response (2026-11-17)

## Independent review verdict (received)

**Overall: FAIL for operational acceptance; BLOCKED for release.**

Reviewed tip named by handoff: `47ba9cc3685b59398855ac042b049d2b37e54797`  
Implementation: `956886b7eb60f87de75c82082f0e43ee8a4efbb9`

### Narrow source wording that *is* supportable (per review)

> At `47ba9cc…`, implementation `956886b7…` passes independent static review, its five targeted containment suites (27 tests), expanded affected regression checks except for one reproducible pre-existing backend-sync test blocker, and TypeScript. It implements default-on preselected-input containment in client and server source. It is not deployed to the active UAT backend, does not server-enforce Claims-NR eligibility for FM-03R, lacks complete Android/iOS negative-device evidence, and is not publicly releasable.

### Claims that must **not** be made until remediated

- UAT backend containment is operational  
- All consumer APIs reject prohibited evidence live  
- FM-03R admission is server-enforced as Claims-NR-only  
- Android / iOS negative UI acceptance complete  
- Doctrine R-8 gate fully green without sync disposition  
- Evidence file self-authenticating exact tip (was wrong at 47ba9cc)  
- Public release ready  

---

## Remediation actions in this response

| # | Review requirement | Action |
|---|--------------------|--------|
| 1–3 | Deploy UAT + confirm policy module + live 403 probes | Attempt `truscoreapi-uat` deploy from tip after `sync-truescan-src`; record deployment id and probe results below |
| 4 | FM-03R Claims-NR server enforcement | **Not implemented.** Explicit founder-deferred AMBER/RED admission control. Correct statement: *FM-03R remains Claims-NR gated in the client Result journey. Server-side Claims-NR admission enforcement is deferred.* |
| 5 | Android / iOS negative matrix | Android attempted against Expo Go after Metro reload; iOS remains OUTSTANDING |
| 6 | `wave4aSharedAuthority` / schemaReady | Disposition: `truescan-src/` is **gitignored**; requires `npm run sync-truescan-src --prefix backend/vercel`. Jest setup now auto-syncs when marker missing. Pre-existing at base `567a8ab`, not introduced by `956886b` |
| 7 | Evidence tip inconsistency | Corrected: exact acceptance tip and deployment SHA recorded separately |
| 8 | Legal | `publicReleaseStatus: BLOCKED` preserved; no requirement cleared |

---

## Exact SHAs (reconciled roles)

| Role | Identifier | Notes |
|------|------------|-------|
| Policy **implementation** | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` | Only commit that changes client/server containment code |
| Independent **review tip** | `47ba9cc3685b59398855ac042b049d2b37e54797` | Docs stamp after implementation; what the FAIL review named |
| Implementation stamp doc | `62934ff1a230ca6e1aac241c87ef5452033e7297` | Docs-only |
| Remediation **documentation** tip | `9f2ae6354219134d5bfb86c9795afc7db816ab89` | Docs-only FAIL remediation record |
| Remediation tip stamp | `f99386d43cb502a26628a48cfc376999e3057cf0` | Docs-only successor; **current branch tip** at gate continuation |
| **Deployed UAT backend** | `dpl_DGYNnsQuQ9161yCEUK3LoCFYD2hM` | CLI upload 2026-11-17 ~21:18 NZDT; Vercel `gitSource` **null** (not git-linked). Policy body ≡ implementation `956886b` (docs commits after deploy do not alter backend) |
| UAT alias | `https://truscoreapi-uat.vercel.app` | Remapped to `dpl_DGYNns…` on 2026-11-17 (was older `truscoreapi-pndkk8gci-…`) |

Do **not** treat `f99386d…` as the implementation or deployment revision.

---

## Live UAT probes (post-deploy + alias remap)

Target: `https://truscoreapi-uat.vercel.app`  
Expected when policy is live: HTTP **403** with `policyVersion: mvp_preselected_only_v1_20261117`.

| Probe | Result | Notes |
|-------|--------|-------|
| POST `/api/upload-photo` `{}` | **403** `mvp_preselected_only_photo_upload_forbidden` | PASS |
| POST `/api/manual-products` `{}` | **403** `mvp_preselected_only_manual_product_write_forbidden` | PASS |
| POST `/api/manufacturing-country` `{}` | **403** `mvp_preselected_only_manufacturing_country_write_forbidden` | PASS |
| EA `authorize-evidence-image` unauthenticated | **403** `mvp_preselected_only_evidence_action_forbidden` | PASS — before credential 401 |

Pre-remediation independent observation: legacy 400/401 on deployment `dpl_Cs5uwNsncq5XutXDi7YxCTb98axv` (16 Nov 2026). After deploy, alias remap was required before the public UAT host served the new policy.

---

## Doctrine classification (retroactive record for this founder decision)

| Classification | Scope |
|----------------|-------|
| **GREEN** | UI hiding of prohibited contribution entry; presentation-only gates |
| **AMBER** | Contribution solicitation availability; Result/PacketContributionModal orchestration; deferred Origins/catalogue choice paths |
| **RED (founder-authorised containment)** | Consumer Evidence Authority write eligibility tightening (reject photo/manual-text/non-attestation submit); VLM producer forced abstain for consumer MVP; **not** a change to admission meaning of already-admitted evidence or scoring |

Touched invariants (containment, not score rewrite): **INV-CO-1**, **INV-EA-1** (write-boundary eligibility only).

FM-03R Claims-NR **server** enforcement remains a **separate** unresolved RED/AMBER admission decision — out of scope for this remediation.

---

## Device matrix (this remediation)

| Platform | Status |
|----------|--------|
| Android Expo Go | **Partial (2026-11-17).** Pre-reload capture (`02_barker_hero.png`) showed a **stale** bundle still offering Camera/gallery + FM-03 photo — proving reload was required. After Metro `--clear` restart the app was still bundling/loading at capture time (`03`–`05`). |
| Android Expo Go | **Fresh matrix 2026-11-18 — see gate continuation below.** |
| iOS | **OUTSTANDING** |

## Operational containment status after remediation

| Area | Status |
|------|--------|
| Live UAT policy 403s (4 probes) | **PASS** on `truscoreapi-uat.vercel.app` → `dpl_DGYNnsQuQ9161yCEUK3LoCFYD2hM` |
| Alias remap required | **Yes** — public alias had remained on older deployment until remapped |
| FM-03R server Claims-NR | **Still deferred** (client-only) — formal disposition below |
| Android/iOS full negative UI | Android fresh path closed for prohibited UI on fixture GTIN; iOS **OUTSTANDING** |
| Public release | **BLOCKED** |

---

## Gate continuation 2026-11-18 (post-FAIL review of remediation)

Independent review of the remediation report kept **Acceptance FAIL** open and **publicReleaseStatus: BLOCKED**. This section records further operational evidence only. It is **not** an independent acceptance verdict and does **not** broaden contribution capabilities.

### 1. Android negative UI after clean Metro reload

| Item | Result |
|------|--------|
| Setup | Pixel_5 emu; freed disk; `npx expo start -c --port 8081`; `adb reverse`; `pm clear host.exp.exponent`; fresh bundle 2130 modules |
| Fixture | GTIN `9414732208565` via Search tab |
| Hero | **PASS** — no Take photo / gallery / upload (`21_result_hero.png`) |
| Prohibited string scan | **PASS** — absent across hero + Result scrolls |
| Packet Claims / Origins “add them now” | Copy remains; TextViews `clickable=false`; taps did **not** open free-form / photo sheet (`33`/`34`) |
| Claims pillar sheet | Opens; no photo/gallery strings in tree; sheet body expand flaky → **PARTIAL** visual |
| Prior stale free-form sheet | **Not reproduced** after pm clear + Metro `--clear` |
| Record | `artifacts/mvp-preselected-only-20261117/ANDROID_NEGATIVE_UI_MATRIX_20261118.txt` |

### 2. iOS negative UI

**OUTSTANDING** — no AU TestFlight / device session in this gate.

### 3. Expanded prohibited server routes + storage side-effect checks

Target: `https://truscoreapi-uat.vercel.app` → `dpl_DGYNnsQuQ9161yCEUK3LoCFYD2hM`  
Artifacts: `EXPANDED_EA_POLICY_PROBES.txt`, `EXPANDED_POLICY_PROBES_SIDEFFECT.txt`

| Probe | HTTP | Error |
|-------|------|-------|
| upload-photo (full body) | 403 | `mvp_preselected_only_photo_upload_forbidden` |
| manual-products (full body) | 403 | `mvp_preselected_only_manual_product_write_forbidden` |
| manufacturing-country (full body) | 403 | `mvp_preselected_only_manufacturing_country_write_forbidden` |
| EA `authorize-evidence-image` | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `finalize-evidence-image` | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `finalize-manual-text` | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `upload-asset-chunk` | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `finalize-asset` | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `submit` prohibited fact / sourceBase64 / attestation+wording | 403 | `mvp_preselected_only_evidence_submit_forbidden` |
| EA unknown write action | 403 | `mvp_preselected_only_evidence_action_forbidden` |
| EA `submit` clean attestation shape (no credential) | 401 | `contributor_credential_required` (policy allowed through to auth) |

**Storage side-effect check (limited):** GET EA snapshot for `9414732208565` after rejects → `prevailing: []`, `withdrawnSubjectKeys: []`. Source places policy reject **before** auth/storage for forbidden actions and before upload-photo storage. This does **not** prove every possible backend path or authenticated storage miss; it supports reject-before-storage for the exercised unauthenticated prohibited writes.

### 4. SHA evidence

See reconciled table above. Implementation = `956886b`; review tip = `47ba9cc`; docs tip = `f99386d`; deployed backend = `dpl_DGYNns…` (CLI, no gitSource).

### 5. FM-03R server-side Claims-NR — deferred disposition

| Field | Disposition |
|-------|-------------|
| Scope deferred | Server must **not** be claimed to re-check Claims publicationStatus / NR eligibility before accepting `finalize-packet-absence-attestation` / attestation `submit` |
| What remains enforced | Client Result journey gates FM-03R via Claims-NR eligibility; server still rejects photo / manual-text / non-attestation sources under `mvp_preselected_only_v1_20261117` |
| Risk | Authenticated client that bypasses UI could attempt attestation submit without Claims-NR; server would not currently fail closed on NR alone |
| Classification | AMBER/RED admission control — **founder-deferred**; out of scope for this containment remediation |
| Capability change | **None** — do not broaden permitted contribution inputs while deferred |

### 6. Fresh independent acceptance

**Not obtained in this response.** Cursor operational evidence only. Reviewer must issue a new independent verdict against implementation `956886b` + deployment `dpl_DGYNns…` + named device builds.

## Public release

**BLOCKED.** No requirement status flipped. Do not interpret this gate continuation as acceptance.
