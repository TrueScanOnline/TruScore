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

## Exact SHAs

| Role | SHA |
|------|-----|
| Independent review tip | `47ba9cc3685b59398855ac042b049d2b37e54797` |
| Policy implementation | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` |
| This remediation tip | `9f2ae6354219134d5bfb86c9795afc7db816ab89` |
| UAT deployment | `dpl_DGYNnsQuQ9161yCEUK3LoCFYD2hM` (distinct from Git tip) |
| UAT alias | `https://truscoreapi-uat.vercel.app` → remapped to above deployment on 2026-11-17 (previously still pointed at older `truscoreapi-pndkk8gci-…`) |

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
| Android Expo Go | **Partial.** Pre-reload capture (`02_barker_hero.png`) showed a **stale** bundle still offering Camera/gallery + FM-03 photo — proving reload was required. After Metro `--clear` restart the app was still bundling/loading at capture time (`03`–`05`). Full negative matrix **not** closed. Artifacts remain local/untracked under `artifacts/mvp-preselected-only-20261117/`. |
| iOS | **OUTSTANDING** |

## Operational containment status after remediation

| Area | Status |
|------|--------|
| Live UAT policy 403s (4 probes) | **PASS** on `truscoreapi-uat.vercel.app` → `dpl_DGYNnsQuQ9161yCEUK3LoCFYD2hM` |
| Alias remap required | **Yes** — public alias had remained on older deployment until remapped |
| FM-03R server Claims-NR | **Still deferred** (client-only) |
| Android/iOS full negative UI | **Not closed** |
| Public release | **BLOCKED** |

## Public release

**BLOCKED.** No requirement status flipped.
