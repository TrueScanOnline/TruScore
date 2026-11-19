# Phase 1 — Repository / worktree / deployment provenance map

**Captured:** 2026-11-19 ~15:29 NZDT (session refresh)  
**Authority:** Master Founder Directive — Complete Historical Recovery  
**publicReleaseStatus:** BLOCKED  
**Preservation root (Cursor workspace):** `C:\TrueScan-FoodScanner\docs\governance\provenance-20261119-152948\`

---

## 1. Active worktrees

| Path | HEAD | Branch / state | Role |
|------|------|----------------|------|
| `C:\TrueScan-FoodScanner` | `0ce9969` | `experiment/w5-ad02-discovery-order-20261109` | RC1 presentation tip; local dirty AD02 docs / s25 CRLF |
| `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113` | `127ae20` | `recovery/w5-functional-baseline-20261119` (tracks origin) | **Primary recovery tip** — Stage 5 + Android evidence |
| `C:\TrueScan-FoodScanner-w5-cd-01` | `c3f7577` | `preserve/w5-cd-checkpoint-20261113` | CD-01 preserve |
| `C:\TrueScan-FoodScanner-w5-founders-build-freeze-20261114` | `c113ce6` | detached | Founders build freeze |
| `C:\TrueScan-FoodScanner-w5-web-teaser-v2` | `08ed964` | `preserve/w5-share-checkpoint-20261113` | Share/web preserve |
| `C:\TrueScan-FoodScanner-wt-rc1` | `0ce9969` | detached | RC1 mirror |
| Other wt-* / wave2 / claims / vlm worktrees | various | preserve / historic | Do not overwrite |

**Outstanding dirty (recovery tip):** only untracked `artifacts/` (P0 probes — not committed; preserve locally).

**Outstanding dirty (Cursor root):** AD02 review doc deletions, phase6/s25 CRLF — preserved in provenance patch.

---

## 2. Reference SHAs (resolved)

| Ref | Full SHA | Date | Summary |
|-----|----------|------|---------|
| `956886b` | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` | 2026-11-17 | Preselected-only containment |
| `b752fdf` | `b752fdf567a9ff7e36e6b24f1d5e45d1bb35fd23` | 2026-11-18 | **REJECTED** free-form restore |
| `e36ed7a` | `e36ed7aa05c31abaea88516bac514a8d690b546b` | 2026-11-18 | Reaffirm preselected-only |
| `43b424d` | `43b424dd466d3593faffa6bf1b94a71fa5191703` | 2026-11-18 | Structured Origins P0 |
| `5f2dce9` | `5f2dce9b7019e1dcf2706db2be9a9c9b156d721b` | 2026-11-18 | P0 stamp / unified base |
| `0ce9969` | `0ce99696bda120808298ce4cc223191865b821be` | 2026-11-11 | RC1 UI closure (`rveel-w5-rc1-20261111`) |
| `31e7e44` | `31e7e441003e4c9296ec3e93b81ffb49117e2f04` | 2026-11-19 | Stage 5 CF-01–03/06 recovery |
| `127ae20` | `127ae2000d84736faf4a8318265039480bf1eb73` | 2026-11-19 | Stage 5 Android evidence tip |
| B0 | `99102768b61bd6e518bb889e3ab6f01dfc3e1268` | 2026-10-07 | Wave 5 B0 / preserve tip |

**Ancestry:** `merge-base(0ce9969, 127ae20) = 0ce9969` — RC1 is an ancestor of the recovery tip (~110 commits after RC1 on recovery lineage).

---

## 3. Metro / Android runtime (this capture)

| Item | Status 2026-11-19 15:29 NZDT |
|------|------------------------------|
| Metro / Expo on :8081 | **Not running** |
| Android devices | **None attached** (`adb devices` empty) |
| Last known Metro source (prior session) | `C:\TrueScan-FoodScanner-w5-unified-mvp-20261113` @ recovery tip, `expo start -c --port 8081 --offline` |
| Last known Android frontend | Expo Go on Pixel_5 bundling that worktree @ `127ae20` / `31e7e44` JS |

Must re-bind Metro → recovery/integration tip before any new device PASS claim.

---

## 4. UAT backend

| Item | Finding |
|------|---------|
| Host | `https://truscoreapi-uat.vercel.app` — root **200**; EA OPTIONS **200** |
| `/api/health` | **404** (no health route) |
| Live deploy id | **NOT VERIFIED this session** — Vercel CLI token unavailable; header `X-Vercel-Id` region only |
| Documented deploy IDs (historical, may be superseded) | `dpl_DGYNns…` (956886b era), `dpl_4PtMCMM…` (e36ed7a stamp), `dpl_CnW7TWK…` (rejected restore), `dpl_AkpmnL9…` / `dpl_AMuxeFS…` (P0 Origins/Antarctica) |
| Risk | Alias may not match tip `127ae20` / `43b424d` server policy — **must reconfirm before Stage 7/8 PASS** |

---

## 5. EAS / iOS configuration (from `eas.json` tip)

| Profile class | GUIDED | COMMUNITY | EA env | Share origin | Notes |
|---------------|--------|-----------|--------|--------------|-------|
| `production` / `preview` / `preview-apk` / `production-apk` | `0` | `0` | production | `truscoreapi.vercel.app` | Store fail-closed for guided/WP09 |
| `development` | `0` | `0` | uat | `truscoreapi-uat.vercel.app` | Dev client; Asset=1 |
| Founders / UAT Dynamic Signals profiles | see `eas.json` remainder | often UAT-entitled | uat | uat share | Must not drop `EXPO_PUBLIC_DYNAMIC_SIGNALS_ASSET=1` |

iOS TestFlight acceptance for recovery tip: **NOT RUN**.

---

## 6. Recommended integration base (Phase 6)

**Candidate tip:** `127ae20` on `recovery/w5-functional-baseline-20261119`  
**Reason:** cumulative RC1 presentation + controlling preselected-only + structured Origins + Stage 5 WP09/Share/reconcile; does not baseline rejected `b752fdf`.  
**Not automatic acceptance** — Stage 6–8 required.

---

## 7. Preserve actions taken

1. Snapshot diffs/status under `docs/governance/provenance-20261119-152948/`.
2. Recovery tip already pushed; untracked `artifacts/` left intact.
3. Cursor root dirty tree not discarded.
4. No force-push, reset, or overwrite of preserve/* tips.
