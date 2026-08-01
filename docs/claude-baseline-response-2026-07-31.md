# Claude baseline response — 31 July 2026

**Document type:** Cursor → Claude continuity brief (persistent, versioned)  
**Author role:** Cursor (primary implementation agent)  
**Audience:** Claude (Coding Quality Review, Advisory and Technical Expertise)  
**Founder briefing reference:** v1.1, 31 July 2026  
**Status:** Answers Claude’s start-of-engagement request items 1–11. No product decisions. No unsolicited code changes.  
**Amendments:** 1 Aug 2026 — §3 install / lint notes corrected after Claude fresh-clone verification (see § Amendments at end).

---

## Continuity note (item 11 — how this file is meant to be used)

Claude’s sessions reset. Prefer **repo-committed markdown under `docs/`** over chat-only answers.

| Artefact | Path pattern | Owner |
|----------|--------------|-------|
| This baseline response | `docs/claude-baseline-response-YYYY-MM-DD.md` | Cursor |
| Claude baseline / follow-up reviews | `docs/reviews/claude-baseline-review-YYYY-MM-DD.md` (create folder when first used) | Claude |
| Cursor replies to Claude findings | `docs/reviews/cursor-response-to-claude-YYYY-MM-DD.md` | Cursor |
| Founder/ChatGPT product authority | External briefing + UAT packs; mirror summaries only when founders ask | Founders / ChatGPT |

**Do not** treat chat transcripts as the system of record. Re-clone at the agreed commit and re-read the latest `docs/claude-*` / `docs/reviews/*` files.

---

## 1. Baseline commit confirmation and drift

### Confirmed baseline (as of 31 July 2026)

| Item | Value |
|------|-------|
| **Commit** | `0e91226ca762f4bda23c75074df10ada500c8570` |
| **Tag** | `v10.18.0-handoff-phase6-workstreamC-2026-07-30` (exact match on that commit) |
| **Remote** | `https://github.com/TrueScanOnline/TruScore.git` · branch `main` |
| **Still right for Claude’s baseline?** | **Yes** — use this commit/tag for the full-project baseline review. |

### Drift since `0e91226` (not pushed — local working tree only)

These exist on the founder/Cursor Windows machine and are **not** on `origin/main` as of this writing. Claude cloning GitHub will **not** see them unless/until committed and pushed:

| Path | Nature |
|------|--------|
| `app.config.js`, `eas.json`, `package.json` | Local UAT prep (build numbers 27/28, UAT EAS profiles, scripts) |
| `docs/uat/**` | On-device UAT handoff / preflight (31 Jul 2026) |
| `docs/EXTERNAL_AI_AGENT_DEVELOPMENT_HANDOFF_SUMMARY.md` | Broad external-agent handoff (Cursor-authored; complementary, not a substitute for this file) |
| `scripts/build-ios-uat-dual-flag.ps1`, `scripts/prevalidate-uat-retail-register.ts` | UAT helpers |
| `reports/phase6/*.json`, `workstreamC/.../IMPLEMENTATION_ASSUMPTIONS.txt` | Local gate/docs edits |

**Founder posture (31 Jul 2026):** TestFlight **build 26** remains the physical-UAT baseline unless a concrete blocker is confirmed. Dual builds 27/28 were prepared locally as optional flag-on/off variants; they are **not** the current required UAT replacement.

### Backend scope

| Question | Answer |
|----------|--------|
| Is `backend/vercel/` the complete backend in this repo? | **Yes** — the serverless API lives under `backend/vercel/` (routes in `api/`, shared code in `lib/`). |
| Separate private backend repo? | **Not used for day-to-day development.** Production deploy target is Vercel project served at `https://truscoreapi.vercel.app`. Cursor is not aware of a second private application repo that Claude must clone. |
| What Claude might *not* see | Vercel dashboard env/secrets, Neon/Postgres or Mongo credentials, Blob/Cloudinary tokens, Expo/EAS secrets, App Store Connect / Play Console consoles. |

---

## 2. Concise repository map

```
TruScore (Rveel)
├── app/                          # Expo screens (scan, result, history, settings, alerts, subscription, …)
├── src/
│   ├── lib/truscoreEngine/       # TruScore + four pillars (body, planet, ethics, open)
│   ├── data/databases/           # Query orchestrator (MVP_MODE), progressive fetch
│   ├── data/ethics/              # Bundled BBFAW/KTC-derived assets used at runtime
│   ├── services/                 # OFF, USDA, FSANZ, contributions, pricing APIs, error reporting, …
│   ├── identity/workstreamA/     # Shared identity scaffolding
│   ├── workstreamB/              # Frozen benchmark scaffolding
│   ├── workstreamC/              # Dynamic Signals skeleton runtime + generated pack
│   ├── dynamicSignals/           # Publication FSM / ingest (includes MyChoicesChainContext type)
│   ├── signals/                  # signalRenderMapping (mandatory Phase 6 mapping owner)
│   ├── claims/                   # Phase 2 claim governance
│   ├── features/alerts/          # Alert UI surfaces
│   ├── store/                    # Zustand stores
│   └── __tests__/                # Unit, integration, golden, phase6 gates
├── backend/vercel/               # Vercel serverless API + optional DB/Blob
├── workstreamA|B|C/              # CSV / pack data (governed data packs)
├── Database files/               # Source FSANZ / FoodAtlas / ethics Excel+JSON (large, tracked)
├── Spec documents/               # Authoritative scoring/spec artefacts (xlsx/docx)
├── docs/                         # Controlling phase / UAT / review docs (prefer this over root *)
├── scripts/                      # Import, EAS helpers, Windows release verify, ethics extract
├── reports/phase6/               # Gate artefacts
├── assets/                       # Icons, splash
├── test-build/                   # Tracked Expo export / Hermes artefacts (see §1 orientation flags)
├── app.config.js / eas.json      # Expo + EAS
└── ~600 root *.md                # Mostly historical agent session output (see §4)
```

### Explicit call-outs: MyChoices, pricing, analytics

| Area | Status | Where |
|------|--------|-------|
| **MyChoices** | **Not a shipped user feature.** Type/hook only: `MyChoicesChainContext` in `src/dynamicSignals/publish/types.ts` used by publication class gates (`my_choices_chain`). No MyChoices UI screen/product flow in `app/`. | Prospective / Phase 6 adjacency |
| **Pricing (product comparison)** | **Partial / MVP-constrained.** NZ prices via Vercel `/api/nz-prices` (Playwright). Broader retailer/pricing APIs exist under `src/services/pricingApis/` and `src/types/pricing.ts` but retailer tiers are **disabled** when `MVP_MODE = true`. Premium flag `pricing_trends` marked deprecated in `premiumFeatures.ts`. | Implemented stub/partial + docs (`PRICING_SETUP_GUIDE.md` is **subscription** store pricing, not grocery comparison) |
| **Analytics** | **Not productised.** No first-party product analytics SDK wired as a core module. Optional share telemetry endpoint `/api/share-event` (no PII by design). Sentry is error reporting, not product analytics. Root docs mention analytics as future. | Exploratory / deferred |

---

## 3. Local setup, toolchain, env (no secrets)

### Canonical environment

| Fact | Value |
|------|-------|
| **Canonical founder/Cursor host** | **Windows 10/11 + PowerShell** |
| **Node** | `.nvmrc` → **20.19.4** (EAS also pins `20.19.4`). No `engines` field in `package.json` — treat `.nvmrc` + EAS as authoritative. |
| **POSIX** | Possible (CI uses `ubuntu-latest` for pillar tests). Most `package.json` ops scripts are `.ps1`. Prefer documenting PowerShell; do not assume bash helpers exist for every script. |
| **Expo SDK** | ~53.0.27 · RN 0.79.6 · TypeScript ~5.8 |

### Install / run / quality

Root `npm install` alone is **not** enough for a clean `npm run lint`. The ESLint scope includes `backend/vercel/api` and `backend/vercel/lib`, which resolve packages (`@vercel/node`, `playwright`, `pg`, `mongodb`, …) and the synced `../truescan-src/...` paths from the **backend workspace**. Without the two steps below, a fresh clone typically reports **16** `import/no-unresolved` **errors** (false signal — missing backend install/sync, not app defects).

```powershell
git clone https://github.com/TrueScanOnline/TruScore.git
cd TruScore
git checkout v10.18.0-handoff-phase6-workstreamC-2026-07-30
# or: git checkout 0e91226
npm install
copy .env.example .env   # then fill locally; never commit .env

# Required before lint (and before backend-aware work):
cd backend/vercel
npm install
npm run sync-truescan-src
cd ../..

npm start                # Expo Go / Metro
npm run start:clear
npm run typecheck
npm run lint             # Expect 0 errors after backend install+sync; ~1169 warnings on app+src, ~1311 with backend/vercel included
npm test
npm run test:phase6:gate:public
npm run test:workstreamC
```

### Build (cloud)

```powershell
npm run build:apk        # eas build -p android --profile preview
npm run build:ios        # eas build -p ios --profile preview
npm run build:aab        # android production AAB
```

### Env template (names only)

Committed: `.env.example` currently documents:

- `EXPO_PUBLIC_BACKEND_URL` (default production: `https://truscoreapi.vercel.app`)

Additional common names (see `app.config.js` / backend `ENV_TEMPLATE.md`; **values are secrets**):

- Mobile: `EXPO_PUBLIC_SUPPORT_EMAIL`, `EXPO_PUBLIC_QONVERSION_*`, `EXPO_PUBLIC_USDA_API_KEY`, barcode/nutrition fallback keys, `EXPO_PUBLIC_OFF_USER_ID` / `_PASSWORD`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` (`0`/`1`, build-time)
- Backend: `DATABASE_URL` / `POSTGRES_URL` or `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN` or `CLOUDINARY_*`, `TRUESCAN_DEFAULT_COUNTRY_CODE`

---

## 4. Authoritative specs vs historical root markdown

### Prefer as source of truth

| Layer | Location |
|-------|----------|
| **Scoring / pillar baselines** | `Spec documents/` (e.g. `PLANET Pillar/Planet_Scoring_Specification_v19.xlsx`, OPEN pillar xlsx, Score Highlights, Cross-Pillar tables, IARC agents workbook) |
| **Phase / engineering control** | `docs/phase1/`, `docs/phase2/`, `docs/phase4/`, `docs/phase6/`, `docs/workstreams/` |
| **Chaining & Signals Docs 1–6** | External `.docx` architecture set (referenced from `docs/phase6/phase6-chaining-signals-execution-pack.md`) — normative; pack is operational |
| **MVP scope decisions** | `IMPLEMENTATION_PLAN_MVP.md` |
| **Product identity / technical IDs** | `src/config/productIdentity.expo.json`, `docs/phase1/stable-technical-identifiers.md` |
| **Scan contract** | `docs/phase4/scan-output-contract.md`, golden packs under `docs/phase4/` |
| **UAT (current physical methodology)** | Founder/ChatGPT packs; repo companion when present: `docs/uat/*` (may be local-only until pushed) |
| **Workstream C assumptions** | `workstreamC/c-data/v0.4/IMPLEMENTATION_ASSUMPTIONS.txt` |

### Root-level ~600 `*_COMPLETE.md` / `*_ANALYSIS.md` / `*_FIX.md`

**Default: treat as historical agent-session / status output, not authority**, unless founders explicitly elevate a named file. Prefer `docs/` + `Spec documents/` + locked Docs 1–6.

Exceptions that still carry practical weight (not “phase architecture,” but operational):

- `IMPLEMENTATION_PLAN_MVP.md`
- `TESTING_GUIDE_NZ_AU.md` (tester device context; UAT cases themselves are founder-owned)
- `ARCHITECTURE_SUMMARY.md` (known debt proposal for result screen modularisation — still a proposal)
- Selected deployment guides when actively used (`README_DEPLOYMENT.md`, backend env guides)

`README.md` is **partially stale** (still describes early Phase 1/2 narrative).

---

## 5. Known failures, debt, bridges, flags, fragility

### Accepted / documented test deviations (preflight on `0e91226`)

| Item | Status |
|------|--------|
| `scanOutputContract.golden.test.ts` | Failing — obsolete recall snapshot |
| `csvDatabaseService.test.ts` | Failing — rice farming impact assertion |
| `barcodeNormalization.test.ts` | Failing — EAN-8 length |
| Lint | **0 errors** only after `backend/vercel` `npm install` + `sync-truescan-src`; ~**1169** warnings (app+src) / ~**1311** with backend included. Fresh root-only install → **16** false `import/no-unresolved` errors |
| Phase 6 `test:phase6:gate:public` | **Pass** (bounded 6-fixture set) |
| `test:workstreamC` | **Pass** (4 suites / 18 tests) |

### Feature flags / modes

| Flag / mode | Meaning |
|-------------|---------|
| `MVP_MODE = true` in `truScoreOptimizedDatabase.ts` | Disables non-food Open Facts + retailer query tiers (code retained) |
| `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT` | Build-time gate for Skeleton Signals runtime UI (`=== '1'`) |
| `phase6SignalSourceMode` | Default **`transitional`** in app; gates distinguish transitional vs governed feeders |
| `EXPO_PUBLIC_ENABLE_COMMERCIAL_NUTRITION_APIS` | Off unless explicitly enabled |
| `EXPO_PUBLIC_ENABLE_FALLBACK_APIS` | Fallback barcode APIs / golden paths |

### Temporary bridges / legacy

- **Cadbury B0067→B0241** app-layer bridge: **Skeleton-UAT helper only**, not long-term architecture (`IMPLEMENTATION_ASSUMPTIONS.txt` §8).
- Legacy alert/recall feeders may still exist under transitional mode; Phase 6 goal is single public path via `ProductScanResult.signals`.
- Synthetic lab barcodes were **rejected** as primary physical UAT method (founder decision, 31 Jul 2026).

### Known fragility (engineering opinion — see also §10)

- `app/result/[barcode].tsx` ~136KB / ~3400 lines — known concentration of UI+logic (see §orientation).
- Large dual responsibility: query orchestration + presentation.
- Qonversion native module: guarded; crashes historically in Expo Go.
- Preview Vercel URLs can 401; app falls back to production URL logic in `backendConfig.ts`.
- EAS iOS image: prefer **`sdk-53`** pin; `latest` previously failed (Xcode/`fmt`).

### Deferred production

- Full live Dynamic Signals ingestion (skeleton CSV pack ≠ production feeds)
- MyChoices product surface
- Broad grocery pricing modal / retailer re-enable post-MVP
- Product analytics platform
- Phase 1 **release-facing** checklist items (live legal branding, support email in EAS, store assets) — `docs/phase1/phase1-closeout-checklist.md`

---

## 6. Automated test inventory and recent results

### Inventory (approx.)

- **~47** `*.test.ts` files under `src/` (unit, integration, e2e, golden)
- Dedicated gates: `src/__tests__/golden/phase6.releaseHardening.test.ts`
- Workstream suites via npm scripts (`test:workstreamA:scaffold`, `test:workstreamB:scaffold`, `test:workstreamC`)

### Commands

| Command | Role |
|---------|------|
| `npm test` | Full Jest |
| `npm run test:pillars` | Four pillars |
| `npm run test:golden` | Scan output contract golden |
| `npm run test:phase6:gate:merge` | Phase 6 merge gate |
| `npm run test:phase6:gate:rc` | Release candidate gate |
| `npm run test:phase6:gate:public` | **Public release gate** (strictest scripted level in-repo) |
| `npm run test:workstreamC` | Workstream C unit pack |
| `npm run typecheck` / `npm run lint` | TS / ESLint |

**Platform exclusions:** Jest runs on Node (Windows or Linux CI). No device farm in CI. Live Vercel HTTP skipped when `CI=true` for ethics/open backend E2E. iOS device console capture requires Mac (not Windows-native).

### Latest recorded results (`docs/uat/preflight-results-0e91226.md`, 31 Jul 2026)

Against commit `0e91226`:

- `typecheck` — Pass  
- `test:phase6:gate:public` — **Pass** (1 suite / 1 test; six named fixtures green)  
- `test:workstreamC` — Pass  
- `lint` — Pass (0 errors; warnings accepted) **when** backend/vercel deps + `sync-truescan-src` are present (see §3)  
- `npm test` — 44 suites pass; **3** accepted failures listed in §5  

**Note:** If Claude re-runs locally, expect the same three failures unless founders authorise fixing them.

**FYI (Claude, 1 Aug 2026 — not blocking):** full `npx jest` may print `Jest did not exit one second after the test run` (open async handles). Not treated as a known tracked defect; a future `--detectOpenHandles` pass is optional hygiene if founders authorise.

### GitHub Actions

| Workflow | What it runs | Gap |
|----------|--------------|-----|
| `.github/workflows/ci-truscore-pillars.yml` | Pillar unit tests + ethics/open E2E (`CI=true`) on push/PR to main/master/develop | **Does not** run full `npm test`, phase6 public gate, lint, or typecheck |
| `.github/workflows/deploy-fsanz.yml` | FSANZ → Vercel on path changes | Deploy automation; Node 18 in workflow vs app Node 20 |

---

## 7. Data sources and generation workflows

| Domain | Inputs | Workflow / scripts | Runtime use |
|--------|--------|--------------------|-------------|
| **Open Food Facts** | Live API | `src/services/openFoodFacts.ts`; submissions via OFF credentials | Primary barcode product fetch |
| **Manual products** | User edits | App → Vercel `/api/manual-products` (+ photos) | Proprietary fields overlay |
| **FSANZ AU/NZ** | `Database files/` Excel → SQLite/JSON | `npm run import-afcd` / `import-nzfcd` / FSANZ scripts; Vercel `/api/fsanz-*` | Name-based nutrition enrichment |
| **Pillar inputs** | Spec documents + OFF/FSANZ/ethics fields | Engine under `src/lib/truscoreEngine/pillars/` | TruScore |
| **BBFAW / KTC** | `Database files/ETHICS Pillar/` + extract scripts | `npm run ethics-pillar:refresh` / extract-* scripts → bundled JSON | Ethics pillar + Workstream B |
| **Workstream A** | `workstreamA/a-data/` CSV waves | Loaders/validators in `src/identity/workstreamA/` | Identity resolution |
| **Workstream B** | `workstreamB/b-data/` | `workstreamB:generate-from-repo`, validate/smoke scripts | Frozen benchmarks |
| **Workstream C** | `workstreamC/c-data/v0.4/input/*.csv` | `npm run workstreamC:generate-runtime-bundle` → `src/workstreamC/runtime/workstreamCRuntimePack.generated.ts` | Skeleton Signals when flag on |

### MyChoices / pricing / analytics status (summary)

| Capability | Implemented | Documented | Exploratory only |
|------------|-------------|------------|------------------|
| MyChoices | Type + publication gate hook | Phase 6 notes | Product UX |
| Grocery pricing comparison | NZ scrape partial; AU/retailer code present but MVP-disabled | Many root guides | Full multi-retailer modal |
| Analytics | Share-event optional; no product analytics suite | Mentions in old reviews | Full funnel analytics |

---

## 8. Release / build setup (safe boundaries)

| Surface | Mechanism | Boundary |
|---------|-----------|----------|
| **iOS** | EAS Build → App Store Connect / TestFlight (`ascAppId` `6755704230`) | Store distribution; physical UAT baseline = **TestFlight build 26** unless founders change |
| **Android** | EAS APK (`preview`) or AAB (`production`) | NZ tester typically APK sideload or Play track |
| **EAS project** | `1ac14572-9608-42fa-aceb-c0e2a2f60687` · Expo account `crwmlw` | Secrets in EAS, not repo |
| **Profiles (on `0e91226`)** | `preview`, `preview-apk`, `development`, `production`, `production-apk` | Local uncommitted UAT profiles `uat-ios-flag-off/on` exist only in dirty tree |
| **Vercel** | Deploy from `backend/vercel` (`npm run deploy:vercel:prod`) | Production URL `https://truscoreapi.vercel.app`; preview URLs may require auth |
| **Expo Go** | Local iteration | Not a store/UAT substitute for native modules (Qonversion) or build-time flags |

Do **not** treat Cursor-local build 27/28 prep as required for Claude’s baseline unless founders promote them.

---

## 9. Security, privacy, telemetry, auth, CI

| Topic | Current state |
|-------|---------------|
| **Auth (end-user)** | No full end-user account system as core MVP path; contributions are lightly attributed / device-oriented patterns |
| **Secrets** | `.env` gitignored; `.env.example` minimal; EAS + Vercel hold production secrets |
| **Telemetry** | Optional `/api/share-event` (designed no PII); not a full analytics stack |
| **Sentry** | Package present (`@sentry/react-native`); `src/services/errorReporting.ts` wraps init/capture **if** `EXPO_PUBLIC_SENTRY_DSN` set. Imported from `app/_layout.tsx` but production wiring depends on DSN in build env. `SENTRY_SETUP.md` is setup documentation — **do not assume always-on in TestFlight builds**. |
| **Privacy / retention** | Legal pages / support email still on Phase 1 release checklist; treat as open operational items |
| **Third-party data** | OFF, USDA, FSANZ, ethics packs, optional commercial APIs — keys optional; MVP reduces retailer scraping |
| **GitHub Actions** | Pillars + limited E2E only; **not** full quality gate on every PR |

---

## 10. Highest-risk areas — Cursor engineering opinion (not product priority)

**Clearly opinion, not founder-accepted priority order.** Whole-product review requested — Chaining/Signals is one slice, not the whole.

| Priority for Claude’s first pass (opinion) | Why |
|--------------------------------------------|-----|
| **1. TruScore four pillars + merge/`buildProductScanResult`** | Core proposition; silent score drift is existential |
| **2. `truScoreOptimizedDatabase` / OFF + FSANZ merge path** | Wrong product identity → wrong everything downstream |
| **3. `app/result/[barcode].tsx`** | Monolith: regressions and untestable coupling |
| **4. User contribution + Vercel backend write paths** | Data integrity / abuse / PII edge cases |
| **5. Claim language / Phase 2 governance surfaces** | Regulatory and trust risk |
| **6. Subscription / Qonversion gating** | Revenue + crash surface; Expo Go vs store divergence |
| **7. Workstream A/B/C + Signals publication** | Important, but secondary to score correctness for baseline; review after 1–3 |
| **8. Pricing API surface area (MVP-disabled)** | Dead/half-live code paths that can be re-enabled unsafely |

**Most valuable early deliverable from Claude:** prioritised findings on **score correctness, identity/fetch integrity, and result-screen maintainability**, with a separate “do not change without product approval” list — then Chaining/Signals depth.

---

## Orientation flags (Claude’s quick pass — confirmed)

### Large tracked assets / root markdown

| Observation | Retention rationale |
|-------------|---------------------|
| ~600 root status/analysis markdown files | Historical agent/session artefacts; **not** source of truth (see §4). Cleanup is a founder decision — do not auto-delete. |
| `Database files/` (large Excel/JSON/txt) | **Intentional source corpus** for FSANZ/ethics pipelines and regeneration; tracked for reproducibility of imports. |
| `test-build/` (incl. Hermes `.hbc`) | **Tracked build export artefacts** — useful historically for debugging native bundles; Claude may note repo bloat risk, but do not treat as accidental junk without founder policy. Prefer flagging as hygiene recommendation, not a defect. |

### `app/result/[barcode].tsx` (~136KB)

**Confirmed known tech debt.** Documented for years in `ARCHITECTURE_SUMMARY.md`, `IMPLEMENTATION_TODO_LIST.md`, `IMPLEMENTATION_PROGRESS.md` (modular cards proposal). **Do not open a duplicate “discover monolith” finding as novel** — assess residual risk, coupling, and safe decomposition boundaries instead.

---

## Responsibilities reminder (founder reset, 31 Jul 2026)

| Party | Owns |
|-------|------|
| Founders + ChatGPT | Product intent, requirements, architecture authority, UAT pack, real products/barcodes, acceptance, sign-off |
| Cursor | Implementation, technical executability, builds when requested, defect investigation, approved fixes |
| Claude | Independent code quality review, defect/fragility/debt identification, fix-quality advice, specialist alternatives — **not** product/UAT/architecture ownership |

**Physical UAT:** real retail barcodes; normal fetch → identity → chaining → Signals. No force-hits, UAT-only product maps, or artificial Signal triggering as the primary method.

**Claude mandate:** Do not make changes solely for review unless founders authorise. Return structured baseline review with prioritised findings, “do not change without product approval,” and separate question sets for Cursor vs ChatGPT/founders.

---

## Related reading (optional)

- `docs/EXTERNAL_AI_AGENT_DEVELOPMENT_HANDOFF_SUMMARY.md` — longer operational handoff (may be local-only until pushed)
- `docs/phase6/phase6-chaining-signals-execution-pack.md`
- `IMPLEMENTATION_PLAN_MVP.md`
- `docs/phase1/phase1-closeout-checklist.md`

---

## Amendments

### 1 Aug 2026 — Claude fresh-clone verification (accepted)

Claude independently checked out `0e91226`, installed, and re-ran gates. Confirmed: commit/tag alignment; three known Jest failures; 44/47 suite split; typecheck.

**Correction applied to this doc:**

- §3 / §5 / §6: lint **0 errors** requires `backend/vercel` → `npm install` **and** `npm run sync-truescan-src` after root install. Root-only install → 16 `import/no-unresolved` errors under `backend/vercel/api` and `backend/vercel/lib`.
- After those steps: 0 errors, ~1169 warnings (app+src), consistent with ~1311 when backend/vercel is included in the lint path.
- FYI logged: Jest open-handle warning on full `npx jest` (optional `--detectOpenHandles` later; not blocking).

**Standing:** Founders confirming review scope/format/order with ChatGPT before Claude’s findings pass. No further Cursor action required until that is settled.

---

*End of Cursor baseline response. Next expected Claude artefact: `docs/reviews/claude-baseline-review-2026-07-31.md` (or dated equivalent) committed to the repo when founders authorise Claude to write findings back.*
