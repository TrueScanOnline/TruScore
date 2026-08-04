# Builds 27/28 factual audit + controlled build-and-release procedure

**Date:** 4 August 2026 (revised same day after Claude narrow assurance review)  
**Status:** Audit accepted; **revised procedure proposed**; config prepared in working tree — **not committed**; **no** EAS build / ASC / TestFlight / Play action authorised  
**Audience:** Founders + NZ Release Owner + Claude (assurance)

---

## A. Factual audit — builds 27 and 28

*(Accepted by founders 4 Aug 2026 as sufficiently candid. Unchanged historical record.)*

### A.1 Build inventory

| Item | Failed flag-off attempt | Build **27** (finished) | Build **28** (finished) |
|------|-------------------------|-------------------------|-------------------------|
| EAS ID | `2221164c-d39a-4d40-ae71-7e56ec641e2d` | `2c05fdf1-1cdf-4ea7-a393-ea6f48369d14` | `172dbfc7-6405-4260-a54f-56da2fb57428` |
| Profile | `uat-ios-flag-off` | `uat-ios-flag-off` | `uat-ios-flag-on` |
| App build number | 27 | **27** | **28** |
| Status | **ERRORED** (`XCODE_BUILD_ERROR`) | **FINISHED** | **FINISHED** |
| Git commit | `0e91226` | `0e91226` | `0e91226` |
| Initiating actor (EAS) | `crwmlw` | `crwmlw` | `crwmlw` |
| Created (UTC) | 2026-07-30T23:10:33Z | 2026-07-30T23:15:47Z | 2026-07-30T23:24:36Z |
| iOS image at attempt | `latest` (then Xcode **26.4**) | `sdk-53` → **Xcode 16.4** | `sdk-53` → **Xcode 16.4** |

### A.2 Who / what initiated the builds

| Question | Fact |
|----------|------|
| **Who** | Expo account **`crwmlw`** (EAS `initiatingActor.displayName`) |
| **What process** | Cursor agent session on **31 July 2026**, executing PowerShell helper `scripts/build-ios-uat-dual-flag.ps1` via the Cursor Shell tool |
| **Exact commands** | `eas build --platform ios --profile uat-ios-flag-off --non-interactive` then `eas build --platform ios --profile uat-ios-flag-on --non-interactive` (script also patched `app.config.js` build numbers). First sequence used `image: latest` and failed; retry after pinning `sdk-53` succeeded |
| **Machine / environment** | Founder Windows workstation (`C:\TrueScan-FoodScanner`, PowerShell, `eas-cli` on win32-x64). Not Expo dashboard click; not CI GitHub Actions for these IDs |
| **Did Cursor directly initiate?** | **Yes** — Cursor invoked the dual-build script / `eas build` non-interactively in that session |
| **Credential category** | **Personal Expo login session** for `crwmlw` (local Expo session secret present at that time; **no** access-token / service-account auth). Credential value not disclosed |
| **Post-audit logout (4 Aug 2026)** | Cursor logged out `crwmlw` on this Windows workspace; local Expo session cleared. Apple/Google signing credentials were **not** revoked or modified. Addresses Claude Finding 1 for this workspace |
| **Dashboard / automation** | No evidence these three builds were started from the Expo website UI. An EAS workflow named `submit-ios.yaml` exists (created 2026-03-16) but was **not** the initiator of builds 27/28 |

### A.3 Founder instruction treated as authority

**Treated as authority (31 Jul 2026):** Founder message accepting Alignment Paper + On-Device UAT Execution Pack and explicitly directing Cursor to prepare separate flag-off and flag-on iOS builds with distinct build numbers.

That instruction authorised **UAT preparation builds**, not production release, and not NZ partner submission ownership transfer.

### A.4 How profiles and build numbers were supplied (historical — superseded by §C)

| Mechanism | Detail |
|-----------|--------|
| **Flag env** | Committed `eas.json` profiles with `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` = `"0"` / `"1"` |
| **Build numbers** | Local script **rewrote** `app.config.js` (not in commit `0e91226`) — **disallowed under revised procedure** |

### A.5 App Store Connect / TestFlight submission

| Question | Fact |
|----------|------|
| **Submit attempted?** | **Yes** — Cursor ran `eas submit` after finishes; CLI failed generically |
| **Auto-submit configured?** | **No** in `eas.json` |
| **Did builds land in TestFlight?** | Not confirmed from EAS alone — NZ Release Owner verifies ASC |

### A.6 Why these artifacts are problematic for Apple submission

Successful builds used `sdk-53` → **Xcode 16.4**. Apple uploads now require **Xcode 26+**. The first attempt on `latest` (Xcode 26.4) failed compile (`fmt` / `consteval`). Replacement builds need an explicit Xcode **26.x** image that both compiles and is Apple-eligible.

---

## B. Build quota / cost (unchanged limits of Cursor visibility)

| Question | Determination |
|----------|---------------|
| Plan / remaining credits / $ | Founders check Expo Billing for `@crwmlw` |
| Credits for failed-27 + 27 + 28 | Almost certainly all three consumed credits |
| Replacement dual UAT iOS builds | **2** billable iOS builds if both succeed; **1** if flag-off is run first and fails (stop before flag-on) |
| Spend alerts | Founders configure in Expo UI |

---

## C. Prepared configuration (working tree — not committed until founder approval)

### C.1 Deterministic build-number mechanism

**Mechanism:** Per-profile env `RVEEL_IOS_BUILD_NUMBER` in committed `eas.json`; `app.config.js` reads `process.env.RVEEL_IOS_BUILD_NUMBER` (fallback `'26'` = last committed non-UAT default when unset).

| Profile | Skeleton flag | iOS buildNumber | Image |
|---------|---------------|-----------------|-------|
| `uat-ios-flag-off` | `0` | **29** | `macos-sequoia-15.6-xcode-26.0` |
| `uat-ios-flag-on` | `1` | **30** | `macos-sequoia-15.6-xcode-26.0` |

- No local patching of `app.config.js` for UAT builds.  
- Each artifact is reproducible from the **recorded commit** + **committed** `eas.json` / `app.config.js`.  
- Distinct numbers prevent ASC collision between flag-off and flag-on.

### C.2 Apple-compliant image

Explicit pin: **`macos-sequoia-15.6-xcode-26.0`** (Xcode 26.0) on both UAT profiles.  
Not `sdk-53` (Xcode 16.4). Not `latest` (previously resolved to 26.4 and failed compile).

**Residual risk:** Xcode 26 may still hit the prior `fmt`/`consteval` compile failure. If so, stop after the first failed build; do not burn a second credit until founders approve an alternate image or native fix.

### C.3 Build-only script

`scripts/build-ios-uat-dual-flag.ps1` rewritten to:

- Run local preflight / validate committed profile config  
- Print exact `eas build` commands for the **NZ Release Owner**  
- **Never** call `eas build` or `eas submit`  
- **Never** rewrite build numbers  

`eas.json` contains **no** UAT submit profiles in this control commit (build-only). Existing `preview`/`production` submit stubs are unchanged and unused by the UAT helper. `autoSubmit` remains off.

### C.4 Files in the proposed diff

- `eas.json` — UAT env build numbers + Xcode 26.0 image  
- `app.config.js` — read `RVEEL_IOS_BUILD_NUMBER`  
- `scripts/build-ios-uat-dual-flag.ps1` — preflight + emit commands only  
- This procedure document  

---

## D. Revised controlled build-and-release procedure (post-Claude)

### D.1 Structural separation (hard)

| Role | May do | Must not do |
|------|--------|-------------|
| **Cursor** | Prepare code, tests, committed profiles, scripts, exact commands, preflight evidence, ledger draft | Hold or use any founder Expo, Apple, or Google **login, session, or token**; initiate EAS builds; submit to ASC/Play; assign testers |
| **Founders (AU)** | Authorise credit-consuming builds and (separately) store submits; set monthly credit threshold | — |
| **NZ founding partner** | **Release Owner** — initiate approved `eas build` from founder-controlled environment; exclusively control ASC/TestFlight and Google Play submission and tester assignment | Delegate store submit to Cursor |
| **Restricted build-only automation identity** | Optional future; **only after separate founder approval** | Not assumed in this procedure |

Until a restricted automation identity is separately approved: **Cursor remains credential-free** for Expo/Apple/Google on build/release machines.

### D.2 Hard rules

1. **No** credit-consuming `eas build` without recorded founder **build** approval (purpose, profiles, platforms, commit, expected credits).  
2. **No** ASC/TestFlight/Play submit without a **separate** recorded founder **submit** approval.  
3. Build and submit are **separate commands** and **separate approvals**.  
4. **No** `autoSubmit` / automated store submission unless separately approved.  
5. UAT vs production vs internal profiles remain distinct (`uat-*` vs `production` / `preview` / `development`).  
6. Avoid duplicate flag/profile builds unless prior build failed or is Apple-ineligible.  
7. Monthly build budget / threshold: further builds need fresh founder approval once threshold hit.  
8. Build numbers only via **committed** configuration (no out-of-band local patching).

### D.3 Approval packet fields (every credit-consuming build)

- Purpose (one sentence)  
- Profile(s) + platform(s)  
- Commit SHA (after founders approve and commit the config diff)  
- Image pin  
- Build number(s) from committed `eas.json`  
- Preflight checklist result  
- Expected credit use  
- Explicit: submit = **separate approval**; NZ Release Owner only  

### D.4 Pre-cloud checklist (mandatory before requesting build approval)

| Check | Pass criterion |
|-------|----------------|
| Diff matches proposed packet | Founders reviewed |
| `npm run typecheck` | Pass |
| `npm run test:phase6:gate:public` | Pass |
| `npm run test:workstreamC` | Pass |
| `npm run uat:prevalidate-retail` | Pass |
| Script validate of UAT profiles | Distinct BN; explicit Xcode 26.x image; flags 0/1 |
| Auto-submit | Confirmed **off** |
| Cursor Expo session on prepare machine | Logged out / no founder token |

### D.5 Build ledger

`date | initiator (Release Owner) | authority ref | commit | profile | platform | purpose | EAS id | result | credit note | submitter | ASC/Play result`

### D.6 Credentials

- Cursor: **no** founder Expo/Apple/Google credentials.  
- NZ Release Owner: Expo + ASC + Play for build initiate and submit.  
- Founders: Expo Billing alerts + security/2FA review.

---

## E. Exact intended build commands (Release Owner only — not authorised to run yet)

```bash
# After founders approve + commit the config diff; from founder-controlled env; logged in as Release Owner Expo identity
eas build --platform ios --profile uat-ios-flag-off --non-interactive
eas build --platform ios --profile uat-ios-flag-on --non-interactive
```

**Submit commands are intentionally not part of this build packet.** Issue separately if/when founders authorise TestFlight.

---

## F. Founder approval packet — two replacement UAT iOS builds

| Field | Value |
|-------|--------|
| **Purpose** | Replace Apple-ineligible builds 27/28 with Xcode 26.0 UAT binaries for Skeleton flag-off / flag-on on-device UAT |
| **Authority requested** | **Build only** (2× iOS). **No** submit / tester assignment in this packet |
| **Profiles** | `uat-ios-flag-off`, `uat-ios-flag-on` |
| **Platform** | iOS |
| **Intended build numbers** | **29** (flag-off), **30** (flag-on) via committed `RVEEL_IOS_BUILD_NUMBER` |
| **Image** | `macos-sequoia-15.6-xcode-26.0` |
| **Commit** | *TBD after founders approve and authorise commit of the prepared diff* |
| **Estimated EAS credit use** | **2** iOS cloud builds if both succeed; stop after flag-off if it errors (saves the second credit) |
| **Initiator** | NZ Release Owner (founder-controlled environment) |
| **Cursor role** | Diff + preflight only; no credentials; no `eas build` / `eas submit` |
| **Residual technical risk** | Xcode 26 compile may fail (`fmt`/`consteval` seen on 26.4); treat flag-off as first execution |
| **Submit** | **Not requested** — separate packet later |

### F.1 Founder decision checklist

- [ ] Approve revised procedure (§D)  
- [ ] Approve proposed repository diff (§C / git diff)  
- [ ] Authorise NZ Release Owner to run the two `eas build` commands  
- [ ] Confirm monthly credit threshold / billing alerts reviewed  
- [ ] Confirm Cursor remains logged out of founder Expo on prepare machines  

---

## G. Cursor standing commitment

Until founders expressly approve the proposed diff **and** a specific build packet:

- **No** git commit of these config changes (unless separately ordered)  
- **No** EAS build  
- **No** ASC / TestFlight / Play submit  
- **No** tester assignment  
- **No** holding founder Expo / Apple / Google login, session, or token  

---

*End of revised audit/procedure. Configuration prepared in working tree only; no store or cloud build actions taken in producing this revision.*
