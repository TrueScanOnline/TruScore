# W10 As-Built Walkthrough — Admin / Support Inventory

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W10 — Admin / support inventory (acceptance series; supports Minimum Founder/Admin Requirements Spec later)  
**Authority:** MVP Launch Plan v0.4 §12 (Admin detailed rules **pending**); Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Depends on:** W6 (Signals founder ops absent), W7 (contribution moderation absent)  
**Code baseline:** Expo app + `backend/vercel` + Workstream A/C pack tooling as of handoff lineage  
**Status:** **Inventory only.** Expect thin. Do **not** invent admin roles, queues, SSO, or suppress workflows from this note. Minimum Founder/Admin Requirements Spec follows founder shape preference.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

Acceptance defines W10 as:

> **Admin / support inventory — Any scripts, DB tables, Vercel routes, or manual ops used today (expect thin)**

Acceptance honesty check (not Spec):

> No clear admin pages/endpoints for contribution moderation, Signal lifecycle, or emergency suppress in the assessed backend surface.

**Controlling reminder:**

| Layer | Status |
|-------|--------|
| Consumer contribute / scan / share APIs & UI | Present |
| Founder admin / ops / console UI | **Absent** |
| Admin moderation / Signal lifecycle HTTP APIs | **Absent** |
| Library FSMs + offline pack reports | Present (engineer tooling, not founder console) |
| Phase 4 admin / moderation **docs** | Design-only |
| Minimum Founder/Admin Requirements Spec | **After** this inventory + founder shape preference |

W10 answers: **what admin/support surfaces exist today?**

---

## 2. One-picture view (as-built)

```
FOUNDER / ADMIN RUNTIME
  Expo admin screens .............. ABSENT
  Web ops console ................. ABSENT
  /api/admin/* .................... ABSENT
  Role / SSO / isAdmin ............ ABSENT

WHAT EXISTS INSTEAD
  Consumer Vercel routes
    manufacturing-country | manual-products | upload-photo | user-prices | …
  Consumer tables (Neon)
    manufacturing_country_submissions | manual_products | photos | user_prices
  Engineer / pack ops (offline)
    Workstream A validate scripts + coverage JSON reports
    Workstream C / Phase 6 CSV editorial_review_state at pack time
    publicationStateEngine (library FSM — not an API)
  Docs-only
    docs/phase4/data-ops-*.md (admin contract, moderation states)
```

---

## 3. Admin / ops / console UI

### Present (consumer app only — not admin)

Expo routes under `app/`: index, result, search, settings, profile, history, favourites, alerts, onboarding, subscription, methodology.

Consumer contribution UI (write, not moderate): `ManualProductEntryModal`, `ManufacturingCountryModal`, dormant `PendingContributionsBanner` (W7).

### Absent

- No admin / ops / console / moderation / founder-tools screen or route  
- No separate web admin app or ops dashboard package  
- No in-app “founder mode”  
- Filename hits for “admin” are **docs** (e.g. `docs/phase4/data-ops-minimum-admin-contract.md`)

---

## 4. Backend routes & DB (consumer vs admin)

**All Vercel handlers:** `backend/vercel/api/`

| Route | Role today |
|-------|------------|
| `manufacturing-country.ts` | Consumer CoM submit/read; algorithmic threshold verify/dispute |
| `manual-products.ts` | Consumer proprietary-field write/read |
| `upload-photo.ts` | Consumer photo upload |
| `user-prices.ts` / `nz-prices.ts` | Price contrib / lookup |
| `barcode/[barcode].ts` / `product-preview.ts` | Product / share preview |
| `fsanz-*.ts` / `foodatlas-query.ts` | Data lookup |
| `legal/[page].ts` / `well-known-deep-links.ts` | Public |

**Consumer writes are not admin moderation.** CoM may log that “Manual review may be needed” on dispute — **no review endpoint** follows.

### Absent admin APIs

- No `/api/admin/*`  
- No moderation / review_state mutation / suppress / withdraw / approve-signal endpoints  
- No contribution review queue API  
- No PATCH/DELETE admin override of CoM or manual products  
- No auth headers / API keys / role checks on contribution handlers (CORS open for consumer use)

### DB tables used today

`manufacturing_country_submissions`, `manual_products`, `user_prices`, `photos`  
(`backend/vercel/lib/databaseNeon.ts` / `database.ts`)

**Absent tables:** review queue, reviewer audit log, signal lifecycle store, suppress list, stewardship mutation store.

**Dev script (not admin product):** `backend/vercel/data/inspect-db.js` — local NZ/AU JSON DB inspection.

---

## 5. Workstream A / Phase 6 / identity control surfaces

| Surface | Path | Nature |
|---------|------|--------|
| `review_state` enums | `src/identity/workstreamA/enums.ts`, `src/contracts/phase6/enums.ts` | Code/CSV contract |
| Coverage scorecard / gap reports | `src/identity/workstreamA/reports.ts` → `workstreamA/a-data/.../output/*.json` | Offline pack artifacts |
| In-memory stewardship helpers | `src/identity/coverage/identityCoverageStewardship.ts` | Library + tests; **not** persisted UI |
| Publication FSM | `src/dynamicSignals/publish/publicationStateEngine.ts` | Engine library (`to_publishable` / `to_suppressed` / `to_expired` / held) |
| Pack `editorial_review_state` | Workstream C CSV + skeleton publication core | Static at pack/build time |
| Validate scripts | `scripts/workstreamA-validate-pack.ts`, scaffold smoke | Engineer checks |

### Absent

- No runtime founder UI for disputed counts, review queues, or scorecards  
- No API to change identity `review_state` or signal publication state in production

---

## 6. Signals founder ops

| Layer | Status |
|-------|--------|
| UI (approve / withdraw / expire / suppress) | **Absent** |
| Admin/HTTP API | **Absent** |
| Library FSM | Present — `publicationStateEngine.ts` |
| Pack editorial gate | Present — CSV at generate/build time |

Matches W6 §5 and acceptance layered Signals status: founder ops still MVP outstanding.

---

## 7. Contribution moderation

| Item | Status |
|------|--------|
| Consumer submit CoM / manual / photo / price | Present |
| Multi-user CoM threshold verify/dispute | Present (algorithmic, not human review) |
| Founder approve / reject / suppress queue | **Absent** (W7) |
| Doc moderation state machine | Docs only (§8) |
| `userContributionVerification.ts` | Client quality checks — **not** admin |
| Unified pending banner | Dormant on Result (W7) |

---

## 8. Docs-only admin designs (no runtime)

| Doc | Path |
|-----|------|
| Minimum admin / back-office contract | `docs/phase4/data-ops-minimum-admin-contract.md` |
| User submission moderation states | `docs/phase4/data-ops-moderation-states.md` |
| Canonical mapping workflow | `docs/phase4/data-ops-canonical-mapping-workflow.md` |
| Cert / recall ops notes | `docs/phase4/data-ops-certification-verification.md`, `data-ops-recall-matching-rules.md` |
| Phase 6 steward queues (pack language) | `docs/phase6/phase6-chaining-signals-execution-pack.md` |
| Future score-highlight admin panel | `SCORE_HIGHLIGHT_RULES_MANAGEMENT_STRATEGY.md` (labeled FUTURE) |

These define **what a proper admin may need later** — they are not shipped product surfaces.

---

## 9. Auth / role gating

**Absent:** admin role, `isAdmin`, founder flag, RBAC, SSO / reviewer identity on contribution or signal APIs.  
CoM `userId` is a client-supplied string for consumer dedupe — not an admin credential.  
Settings “reset onboarding” is consumer debug, not ops auth.

---

## 10. Tests related to admin

**No tests for an admin product.** Closest coverage:

| Test | Covers |
|------|--------|
| `publicationStateEngine.test.ts` | Engine transitions (incl. suppressed/expired) |
| `identityCoverageStewardship.test.ts` | In-memory scorecard helpers |
| Workstream A pack/enums tests | CSV/schema, not ops UI |
| `userContribution*.ts` | Consumer submit/read |

**Absent:** admin API / UI / auth / moderation-queue tests.

---

## 11. Manual ops that exist in practice today

Factual engineer/founder workarounds (not a product console):

1. Edit Workstream A/C CSV packs → regenerate / validate → ship in app build  
2. Optional direct inspection of Neon consumer tables / local JSON DBs  
3. Rely on consumer CoM algorithmic threshold for country disputes  
4. No dedicated ops toolset in repo for emergency Signal suppress

---

## 12. Gaps vs acceptance W10

| Acceptance expectation | As-built |
|------------------------|----------|
| Inventory scripts / DB / routes / manual ops | **This document** — thin |
| Admin pages for contribution moderation | **Absent** |
| Signal lifecycle / emergency suppress endpoints | **Absent** (library FSM + pack CSV only) |
| Founder ops approve/withdraw/expire/suppress | **Absent** |
| Follow-on Minimum Founder/Admin Requirements | **Out of scope** — after inventory + founder shape preference (web ops vs DB/script vs in-app founder mode) |

**Do not implement** an admin product from this note.

---

## 13. Key file index

```
app/                                  # consumer routes only
backend/vercel/api/                   # consumer routes only (no admin/)
backend/vercel/lib/databaseNeon.ts
backend/vercel/data/inspect-db.js
src/dynamicSignals/publish/publicationStateEngine.ts
src/identity/workstreamA/reports.ts
src/identity/coverage/identityCoverageStewardship.ts
scripts/workstreamA-validate-pack.ts
docs/phase4/data-ops-minimum-admin-contract.md
docs/phase4/data-ops-moderation-states.md
docs/as-built/W6-chaining-signals-and-commentary-20260803.md
docs/as-built/W7-community-contribution-and-verification-20260803.md
docs/cursor-acceptance-mvp-v0.4-20260803.md
```

---

## 14. Bottom line for founders / Claude

**What exists:** Consumer write/read APIs and tables; offline pack validation reports; publication/identity libraries; phase docs describing a future admin.

**What does not exist:** Any founder-facing admin UI, admin API, role gating, contribution moderation queue, or emergency Signal suppress path in production.

**Next decision (founders, not Cursor):** Admin shape preference after this inventory — then Minimum Founder/Admin Requirements Spec before coding.
