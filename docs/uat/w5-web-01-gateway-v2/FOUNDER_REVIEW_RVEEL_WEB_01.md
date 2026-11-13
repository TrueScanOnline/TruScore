# RVEEL-WEB-01 — Product Reveal Gateway V2 (Stage 1)

**Branch:** `feature/w5-web-product-teaser-v2`  
**Baseline:** `0ce99696bda120808298ce4cc223191865b821be` (`rveel-w5-rc1-20261111`)  
**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Status:** Local implementation + verification only. **Not pushed, merged, or deployed.**

## Classification

| Change | Zone | Class |
|--------|------|-------|
| Share landing HTML redesign | Public web teaser renderer | **GREEN** |
| Share landing CSS (Emerald Perspectives tokens) | Public stylesheet | **GREEN** |
| Contract test copy updates (fail-closed retained) | Presentation contract tests | **GREEN** |
| Regenerated `shareLandingHtml.bundle.mjs` | Build artifact | **GREEN** |

No scoring, Rateability, publication, Evidence Authority, contribution, Dynamic Signals, or Result orchestration changes.

---

## A. Code changes

| File | Summary |
|------|---------|
| `backend/vercel/lib/shareLandingHtml.ts` | Product Reveal Gateway V2 markup: product-first hero with dog-ear, four pillar tease (no scores), deliberate open/download CTAs, removed page-load auto deep-link, iOS-safe header store routing, curiosity copy |
| `backend/vercel/lib/shareLandingHtml.bundle.mjs` | Regenerated via `npm run build:share-landing` |
| `backend/vercel/public/rveel.css` | Mint/neutral canvas, gateway layout (mobile stack / desktop split), hero + pillar + medallion presentation tokens from Wave 5 emerald palette |
| `src/__tests__/unit/wave5/publicWebShare.contract.test.ts` | Updated expected teaser copy; retained score fail-closed assertions; asserts no `openInApp(true)` / auto-launch |
| `docs/uat/w5-web-01-gateway-v2/**` | Local preview fixtures + screenshots for founder review |

Unchanged by design: `shareLandingMeta.ts` (recall/safety context wording preserved), product-preview contract, barcode API handler, app Result code.

---

## B. Screenshots

Local preview: `http://127.0.0.1:4177/` (fixtures under `docs/uat/w5-web-01-gateway-v2/preview/`)

| Scenario | File |
|----------|------|
| Known product · 390 px | `screenshots/known-390.png` (`9300617064879` Cadbury Dairy Milk) |
| Known product · 1440 px | `screenshots/known-1440.png` (+ `known-1440-view.png`) |
| No image · 390 px | `screenshots/no-image-390.png` |
| Unknown product · 390 px | `screenshots/unknown-390.png` |

### Before / after (behavioural)

| Before (RC1 teaser) | After (Gateway V2) |
|---------------------|--------------------|
| Full-height emerald wash | Mint/neutral canvas with emerald accent regions |
| Compact blurred score veil | Clear product hero + labelled pillar tiles + neutral Reveal lock |
| Auto deep-link on mobile page load | Deliberate “Open this product in Rveel” only |
| Header “Get the app” → Play for everyone | Header prefers App Store when configured; Android → Play; else `#get-app` |
| “Someone shared…” default headline | “There's more to this product than meets the eye.” |

---

## C. Test evidence

```text
npm run build:share-landing
→ backend/vercel/lib/shareLandingHtml.bundle.mjs 19.1kb  OK

npx jest src/__tests__/unit/wave5/publicWebShare.contract.test.ts \
         src/__tests__/unit/utils/buildShareUrl.test.ts --runInBand
→ Test Suites: 2 passed
→ Tests: 22 passed

npm run typecheck
→ tsc --noEmit  OK (exit 0)

npx eslint backend/vercel/lib/shareLandingHtml.ts \
           src/__tests__/unit/wave5/publicWebShare.contract.test.ts
→ 0 errors

npm run lint (repo-wide)
→ exit 1 with pre-existing baseline errors/warnings outside WEB-01 files
  (WEB-01 touched files clean)
```

---

## D. Architecture observations

1. **Product identity mismatch risk (report only):** Web identity still comes from `/api/product-preview`. In-app Result may resolve a different display name/image via app-side evidence paths. No new cross-system identity authority was introduced.
2. **Deep-link:** `truescan://barcode/{barcode}` preserved. Context query params remain on the canonical web URL; app-side deep-link parsing was not changed. Passthrough of `ctx` into the native open path still depends on existing app linking behaviour.
3. **Stores:** Google Play always offered. App Store offered only when `APP_STORE_ID` is a verified numeric id; otherwise “App Store — coming soon”. No deferred deep-link / install-to-product restore.
4. **Recall / safety copy:** `shareLandingMeta.ts` context strings (including recall) left unchanged pending separate review.
5. **Desktop:** At ≥900 px, identity (left) and reveal/CTAs (right). Confirmed computed `grid-template-columns` two-track at 1440 px.

---

## E. Final declaration

- No scoring or governed functionality changed.
- RC1 branch `release/rveel-w5-rc1-20261111` and tag `rveel-w5-rc1-20261111` were not modified.
- Original worktree `C:\TrueScan-FoodScanner` remains on `experiment/w5-ad02-discovery-order-20261109` at `0ce9969` with prior local WIP intact.
- **No production deployment, push, or merge was performed.**

Awaiting founder visual review before further work.
