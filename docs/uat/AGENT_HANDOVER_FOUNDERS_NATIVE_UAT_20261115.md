# Rveel — Agent handover: Founders native UAT (2026-11-15)

**Audience:** Next Cursor AI agent continuing Rveel / TruScore work.  
**Purpose:** Resume seamlessly from the current frozen founder-UAT state without losing integrity, legality, or accepted workflows.  
**Repo:** https://github.com/TrueScanOnline/TruScore  
**Primary local worktree (use this):** `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`

---

## 1. Current Git identity (authoritative)

| Item | Value |
|---|---|
| **Active branch** | `build/w5-founders-native-20261114` |
| **Upstream** | `origin/build/w5-founders-native-20261114` (in sync) |
| **HEAD / BUILD_SOURCE_SHA** | `c113ce6ca4ec83c47423073437b2340c7c2d58d2` |
| **HEAD commit** | `chore: prepare matched founder UAT native builds with incremented build numbers` |
| **Working tree** | Clean on that branch (as of handover) |
| **Do not treat as tip** | `main` is **not** this work — remote `main` = `8973374d23e271afb15ec9eb2ade02a835980234` |

### Frozen annotated tag for the matched Android + iOS binaries

| Item | Value |
|---|---|
| **Tag** | `w5-founders-uat-source-android-38-ios-64-20261114` |
| **Tag URL** | https://github.com/TrueScanOnline/TruScore/tree/w5-founders-uat-source-android-38-ios-64-20261114 |
| **Tag object SHA** | `add44c656bf61cfea8d14e9539772a9e3f733573` |
| **Tag peels to (commit)** | `c113ce6ca4ec83c47423073437b2340c7c2d58d2` |
| **Immutability** | Do **not** move, delete, or retarget this tag. New binaries need a **new** uniquely named tag. |

### Prior immutable source-review checkpoint (still valid)

| Item | Value |
|---|---|
| **Tag** | `w5-unified-source-review-20261114` |
| **Tag URL** | https://github.com/TrueScanOnline/TruScore/tree/w5-unified-source-review-20261114 |
| **Tag object SHA** | `60d578bb35df6e63b20e981c7bab0fd034701b91` |
| **Peels to** | `1059060448afb4cfcbe51e63edd1582bff7b890c` (additives art refinement) |

### Related published branches

| Branch | SHA | URL |
|---|---|---|
| `build/w5-founders-native-20261114` | `c113ce6…` | https://github.com/TrueScanOnline/TruScore/tree/build/w5-founders-native-20261114 |
| `feature/w5-additives-card-art-refine` | `1059060…` | https://github.com/TrueScanOnline/TruScore/tree/feature/w5-additives-card-art-refine |
| `integration/w5-unified-mvp-20261113` | `4affd99…` | https://github.com/TrueScanOnline/TruScore/tree/integration/w5-unified-mvp-20261113 |

**Prep diff (refinement → build source):**  
https://github.com/TrueScanOnline/TruScore/compare/1059060448afb4cfcbe51e63edd1582bff7b890c...c113ce6ca4ec83c47423073437b2340c7c2d58d2

### Checkout recipe for external review / clean builds

```bash
git clone https://github.com/TrueScanOnline/TruScore.git
cd TruScore
git fetch origin tag w5-founders-uat-source-android-38-ios-64-20261114
git checkout w5-founders-uat-source-android-38-ios-64-20261114
# equivalent: git checkout c113ce6ca4ec83c47423073437b2340c7c2d58d2
```

**Detached freeze worktree already on disk:**  
`C:\TrueScan-FoodScanner-w5-founders-build-freeze-20261114` @ `c113ce6…` (may contain local `artifacts/` — not part of GitHub source).

---

## 2. Where we came from (recent arc)

Ordered ancestry (newest last):

1. **Unified MVP integration baseline locked**  
   - Branch: `integration/w5-unified-mvp-20261113`  
   - SHA: `4affd99831e1871c0eab04e8c621c114aaae9b32`  
   - Message: `chore: lock unified UAT functional baseline before additives card refinement`  
   - Captured accepted Expo Go / UAT functional state (Contribution + WP09 restored for UAT, share host corrected, etc.).

2. **About These Additives card artwork refinement only**  
   - Branch: `feature/w5-additives-card-art-refine`  
   - SHA: `1059060448afb4cfcbe51e63edd1582bff7b890c`  
   - Message: `refine(ui): quiet formulation motif for About These Additives card art`  
   - Change confined to `src/components/result/ResultCardArt.tsx` molecular motif (subtle cream–sage wash, capsule/droplet/particle accents). **No** text/logic/scoring/CTA/governance changes.  
   - Tagged as source-review checkpoint `w5-unified-source-review-20261114`.

3. **Matched founder native build preparation**  
   - Branch: `build/w5-founders-native-20261114`  
   - SHA: `c113ce6ca4ec83c47423073437b2340c7c2d58d2`  
   - Added EAS profiles `uat-founders-android` / `uat-founders-ios`, `cli.appVersionSource: "local"`, bumped Android **38** / iOS **64**, synced `app.config.js` + `android/app/build.gradle`.  
   - Tagged `w5-founders-uat-source-android-38-ios-64-20261114`.

Immediately before that lock, live Metro/Expo Go E2E had exercised **Contribution** and **Share** against UAT EA (Cadbury `9300617064879` was a common probe product). Local UAT/restore artifacts were moved out of the repo to:

`C:\Users\leigh\Documents\ChatGPT\Rveel App\local-backups\rveel-source-review-20261114-225759`

**Leave that backup intact. Do not restore credentials, probe tokens, screenshots, or old bundles into build source.**

---

## 3. App / product status right now

### What the accepted app is

Consumer food-scan Result experience on Wave 5 rails: governed scores via consumption contract, Dynamic Signals (Asset embed), Certifications / Packaging UI work already integrated earlier, Product Origins, Packet Claims, About These Additives (S25), Share (public host), and UAT-entitled Guided Contribution + Community Agreements (WP09) on the **founder UAT** profiles / local `.env.development`.

### Matched native founder builds (same `BUILD_SOURCE_SHA`)

| Platform | Version | Build | EAS build ID | Status |
|---|---|---|---|---|
| **Android APK** | `10.0.0` | versionCode **38** | `386c9f0a-6e9d-4d02-9d58-8f75593adc54` | **FINISHED** — installable |
| **iOS IPA** | `10.0.0` | build **64** | `2667c58d-2871-41db-846c-af1b1cc62579` | **FINISHED** — uploaded to ASC |

| Artifact | Link / hash |
|---|---|
| Android EAS page | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/386c9f0a-6e9d-4d02-9d58-8f75593adc54 |
| Android APK | https://expo.dev/artifacts/eas/EMGdF6lqvOyiojLwi6t7JL5qqNyVuT28JQ65n-N_OYs.apk |
| Android APK SHA-256 | `dd0fecc4d629f486c2d632fc28274be80b79ef38ff565134f7cd0526a54bbeb8` |
| Android signing cert SHA-256 | `49b3a0fb32368d7679bf6272e03b20bc2d6fa922bdfe727b7da9bfea462a3962` (EAS keystore `Build Credentials Os907DiG84`) |
| Package ID | `com.truescan.foodscanner` |
| iOS EAS page | https://expo.dev/accounts/crwmlw/projects/truescan-food-scanner/builds/2667c58d-2871-41db-846c-af1b1cc62579 |
| iOS IPA | https://expo.dev/artifacts/eas/SZilBshJegW8dMWp-kQ7s6ApG9dXogzueqnta9wO12M.ipa |
| iOS IPA SHA-256 | `08c51f90f75131b9160de6875a7575edfed821e351a201a6a36696b4d06c95ac` |
| Bundle ID | `com.truescan.foodscanner` |
| Apple Team | `TUWF3MFYRF` (Matthew Gold) |
| ASC App ID | `6755704230` |
| EAS project ID | `1ac14572-9608-42fa-aceb-c0e2a2f60687` |

### TestFlight status (as last observed 2026-11-14 evening NZ)

1. First submit failed: Apple agreement missing/expired.  
2. After Account Holder accepted agreements, submit **succeeded**:  
   - Submission ID: `89418d10-0408-432f-9aea-547941d4ecaa`  
   - Exact build ID submitted: `2667c58d-2871-41db-846c-af1b1cc62579`  
   - Result: **Uploaded** to App Store Connect; Apple **processing** (~5–10+ minutes typical).  
3. TestFlight console: https://appstoreconnect.apple.com/apps/6755704230/testflight/ios  
4. Distinguish states carefully: **uploaded ≠ processing complete ≠ available to founders ≠ installed**. Re-check ASC/TestFlight before claiming “available”.

### Local / Expo Go path (NZ)

`.env.development` on the unified worktree (committed intent for NZ Expo Go) includes:

- `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV=uat`
- `EXPO_PUBLIC_BACKEND_URL=https://truscoreapi-uat.vercel.app`
- `EXPO_PUBLIC_SHARE_WEB_ORIGIN=https://truscoreapi.vercel.app`  ← public share host, **not** UAT share
- `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION=1`
- `EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS=1`
- `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1`
- `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH=1`
- `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=0`
- `EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT=1`

Dual UAT convention remains mandatory:

| Tester | Platform | Path |
|---|---|---|
| Australia | iPhone | TestFlight (native EAS store-signed UAT profile) |
| New Zealand | Android | Expo Go + Metro — do not break this |

---

## 4. Founder UAT EAS profiles (correct behaviour)

Profiles on `c113ce6…` in `eas.json`:

- **`uat-founders-android`** — `distribution: internal`, `android.buildType: apk`, `autoIncrement: false`
- **`uat-founders-ios`** — `distribution: store` (TestFlight signing), `simulator: false`, Release, `autoIncrement: false`
- **Submit profile** `uat-founders-ios` → `ascAppId: "6755704230"`

Required env (both founder profiles) — **do not “fix” these back to the older `uat-dynamic-signals-*` mistakes**:

| Setting | Required |
|---|---|
| `EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV` | `uat` |
| `EXPO_PUBLIC_BACKEND_URL` | `https://truscoreapi-uat.vercel.app` |
| `EXPO_PUBLIC_SHARE_WEB_ORIGIN` | `https://truscoreapi.vercel.app` |
| `EXPO_PUBLIC_MVP_GUIDED_CONTRIBUTION` | `1` |
| `EXPO_PUBLIC_MVP_COMMUNITY_AGREEMENTS` | `1` |
| `EXPO_PUBLIC_STORE_RELEASE` | `0` |
| `EXPO_PUBLIC_CLOSED_PRELAUNCH_VISUAL_UAT` | `1` |
| `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET` | `1` |
| `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` | `1` |
| `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` | `0` |
| `EXPO_PUBLIC_SCORE_DIAGNOSTICS` | `0` |

**Critical distinctions:**

- iOS `distribution: "store"` is for **signing / TestFlight**, **not** for turning on production authority. Keep `EXPO_PUBLIC_STORE_RELEASE=0` and EA=`uat` on founder UAT builds.
- Older profiles `uat-dynamic-signals-android/ios` still have **incorrect** share origin (`truscoreapi-uat.vercel.app`) and contribution gates **off**, diagnostics **on**, and older build numbers (37/63). Prefer **`uat-founders-*`** for founder UAT.
- Production / preview profiles must stay production-safe (contribution/WP09 **off**, store release as designed).
- Versioning: `cli.appVersionSource: "local"`. Android native `versionCode` lives in **`android/app/build.gradle`** (checked-in native project) — Expo config alone is insufficient. Last allocated pair used: **38 / 64**. Next pair must be **latest allocated + 1** after checking EAS/ASC.

Feature gates implementation: `src/config/mvpFeatureGates.ts` (fail closed unless explicit `'1'`; store-release assert blocks entitled contribution on store-public runtimes).

---

## 5. Founder / Cursor standing rules (must obey)

Always-applied Cursor rules in this worktree:

| Rule file | Intent |
|---|---|
| `.cursor/rules/wave5-change-control.mdc` | Classify every change GREEN / AMBER / RED vs Wave 5 Doctrine. UI must not invent scores; NR/Checking/missing publication fail closed. Do not reactivate dormant modules (RED). |
| `.cursor/rules/uat-delivery-integration.mdc` | Protect plumbing; commit accepted work as traceable SHAs; device visual QA; keep `docs/uat/UAT_INTEGRATION_SHA_LIST.md`; one tested release SHA. |
| `.cursor/rules/dual-uat-expo-testflight.mdc` | Keep AU TestFlight + NZ Expo Go both viable; preserve Asset/env defaults; regenerate DSA embed after pack changes. |
| `.cursor/rules/platforms.mdc` | Android + iOS compliance for code changes. |

### Hard authorization boundaries (from recent founder directions)

**Do not without explicit founder approval:**

- Merge to `main`
- Public App Store / Google Play release
- Backend / production-data deployment or migration
- Moving immutable tags (`w5-unified-source-review-20261114`, `w5-founders-uat-source-android-38-ios-64-20261114`)
- Changing governed scoring, Evidence Authority rules, Signals matching logic, or publication semantics to “make UI work”
- Deleting/weakening tests to green the build
- Requiring custom native-only modules for MVP Result/Signals unless founders authorize
- Inventing founder emails / ASC tester identities
- Force-push / rewrite of accepted history
- Restoring local backup credentials into the repo

**Routine UI defect fixes** (Certifications, Packaging & Recycling, Hero, Score presentation, Signals presentation) may proceed under standing UAT rules **if** they do not touch governed plumbing — still classify GREEN/AMBER/RED first.

### Integrity reminders

- Same evidence → same governed outcome (Doctrine §10).
- UI reads scores/labels only from the consumption contract (Doctrine §5).
- Visual/art changes must not alter card copy, CTA behaviour, or contribution logic.
- External AI reviewers must be pointed at the **frozen build-source tag / `BUILD_SOURCE_SHA`**, not at a moving branch tip after later commits.
- Android and iOS binaries are **not** byte-identical; they must share the **same committed source SHA**.

---

## 6. Key files for continuity

| Area | Paths |
|---|---|
| EAS / submit | `eas.json` |
| Expo config / IDs | `app.config.js` |
| Android native version | `android/app/build.gradle` |
| MVP gates | `src/config/mvpFeatureGates.ts` |
| Additives card + art | `src/components/AboutTheseAdditivesCard.tsx`, `src/components/result/ResultCardArt.tsx` |
| Share / public web | `src/features/sharing/**`, wave5 public-share contract tests |
| Local Metro env | `.env.development` |
| EAS archive hygiene | `.easignore` |
| Standing UAT SHA list | `docs/uat/UAT_INTEGRATION_SHA_LIST.md` (note: historically keyed to older `wave5/score-experience-20261008`; current founder tip is the unified/build path above — update carefully when integrating) |
| NZ Expo steps | `docs/uat/NZ_EXPO_GO_SIMPLE_TEST_STEPS.md` |

---

## 7. Known gaps / next-agent watchouts

1. **Confirm TestFlight “Ready to Test”** for `10.0.0 (64)` and founder-group availability — last confirmed state was **uploaded/processing**, not “installed by founders”.
2. **Emulator APK deep Result UI** (Contribution/Additives) was only partially exercised after install because of onboarding; standalone launch + package identity + baked backend/share hosts were verified. Prefer a clean Result journey on device/emulator when validating further.
3. **EAS upload archives are large (~434 MB)** — `.easignore` exists; further size hygiene is optional, not required for integrity.
4. **Do not reuse iOS build number 64** for a new IPA if Apple already accepted that number; bump if a new binary is required.
5. **Multiple git worktrees** exist under `C:\` for older experiments. Prefer **`C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`** unless the founder names another root. Do not casually commit from detached experiment worktrees.
6. **Credentials:** Expo user used for builds was `crwmlw` / `flagshipdevelopments@gmail.com`. Apple ASC API key is stored in EAS (`48KPFB2A7N`). Do not print secrets into docs/commits.
7. If correcting build config after a freeze: preserve failed IDs/logs → new commit → **new** annotated tag → same SHA for both platforms → new build numbers as required.

---

## 8. Suggested first actions for the next agent

1. `cd C:\TrueScan-FoodScanner-w5-unified-mvp-20261113`
2. `git fetch origin --tags`
3. Confirm `git rev-parse HEAD` == `c113ce6ca4ec83c47423073437b2340c7c2d58d2` and branch `build/w5-founders-native-20261114` (or explicitly start a **new** feature branch from that SHA — do not silently diverge the freeze tag).
4. Read `.cursor/rules/*.mdc` and this handover.
5. Ask founder what the next authorized change is; classify GREEN/AMBER/RED before editing.
6. If continuing founder phone UAT: verify TestFlight 64 availability and Android APK 38 install; keep NZ Expo Go path working for day-to-day UI work.

---

## 9. One-line north star

**Current legal/integrity tip for founders’ matched native UAT is tag `w5-founders-uat-source-android-38-ios-64-20261114` = commit `c113ce6ca4ec83c47423073437b2340c7c2d58d2` on branch `build/w5-founders-native-20261114`; preserve governance, dual UAT paths, and immutable tags; advance only with classified, authorized changes and new SHAs.**
