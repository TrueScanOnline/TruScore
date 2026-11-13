# RVEEL-WEB-01 — Founder follow-up (read-only)

**Worktree:** `C:\TrueScan-FoodScanner-w5-web-teaser-v2`  
**Branch:** `feature/w5-web-product-teaser-v2`  
**Baseline:** `0ce99696bda120808298ce4cc223191865b821be`  
**Mode:** Diagnostic + design proposal only. **No source edits, deploy, commit, push, or merge.**

Preview under review: `https://truscoreapi-m5l6i4fv3-leightons-projects-d328c774.vercel.app`

---

## 1. Product identity investigation

### 1.1 Code path (share landing)

```text
GET /barcode/{barcode}
  → api/barcode/[barcode].ts
      fetch `${origin}/api/product-preview?barcode={barcode}`
      if response.ok → productData = JSON
      else productData = null
  → renderShareLandingHtml({ barcode, productData, ... })
```

`renderShareLandingHtml` treats any of `product_name` / `product_name_en` / `brands` / `image_url` as identity. It does **not** verify that catalogue identity is authoritative; it trusts product-preview.

### 1.2 Code path (product-preview)

```text
GET /api/product-preview?barcode={barcode}
  1) OFF v2 via offProductApiUrl → world.openfoodfacts.org
       if status===1 && product → toPublicProductPreview(...)  [Cache-Control max-age=3600]
  2) else upcitemdb trial: https://api.upcitemdb.com/prod/trial/lookup?upc={barcode}
       if items[0] → toPublicProductPreview(title/brand/image)  [Cache-Control max-age=3600]
  3) else 404 Product not found
```

Scores are always null (`publicPreviewContract.ts`). Identity fields are passed through without requiring `product.code === request barcode` after OFF parse (OFF usually returns matching `code` when status=1).

### 1.3 Observed API evidence (preview + production identical)

| Barcode | OFF direct | product-preview | HTML shown |
|---------|------------|-----------------|------------|
| `9300617064879` | status=1, Cadbury Dairy Milk, code exact | Cadbury Dairy Milk | Correct |
| `0000000000000` | status=0, “no code or invalid code” | **ORGANIC BLUE CORN TORTILLA CHIPS** brand N/A | Same name (unexpected) |
| `9999999999994` | status=1, **Light & Free SKYR A BOIRE**, code exact | Same SKYR name | Same name |

UPCITEMDB trial for `0000000000000` / `00000000`:

- `code=OK`, `total=1`
- `title=ORGANIC BLUE CORN TORTILLA CHIPS`, `ean=0000000000000`

UPCITEMDB for `9999999999994` returns a **different** product (Joolz stroller). Preview does **not** use that because OFF succeeds first.

### 1.4 Root cause

**`0000000000000` — not an exact OFF match; unrelated UPCITEMDB junk accepted**

1. OFF rejects the code (`status=0`).
2. `product-preview.ts` falls through to UPCITEMDB trial.
3. UPCITEMDB returns a spurious catalogue row keyed to all-zeros.
4. Share HTML sees a non-empty `product_name` → renders as a “known” product (not `sheet-unknown`).

This is **not** WEB-01 inventing a name in HTML. It is the **existing public preview fallback** accepting a non-authoritative third-party hit. Same behaviour on production `truscoreapi.vercel.app`.

**`9999999999994` — exact OFF barcode match (catalogue oddity, not a swap)**

OFF itself stores a product under code `9999999999994` named Light & Free SKYR A BOIRE. Preview correctly echoes that exact match. The surprise is catalogue quality, not a wrong-product join on the web renderer.

### 1.5 Caching

- product-preview: `Cache-Control: public, max-age=3600`
- barcode HTML: `Cache-Control: public, max-age=300`

No local fixture overrides these barcodes in the WEB-01 renderer.

### 1.6 Classification of any correction (approval required)

| Proposed correction | Touches | Class |
|---------------------|---------|-------|
| HTML-only: if barcode is all zeros / synthetic test patterns, force unknown presentation even when preview returns a name | Share HTML only; may diverge from preview API | **AMBER** (identity presentation vs API contract) |
| Stop using UPCITEMDB for public product-preview / share path | Public identity authority for web | **AMBER** (INV: public identity / fail-closed publication surface) |
| Require OFF `status===1` and `product.code` exact match (normalise leading zeros) before accepting identity | product-preview contract | **AMBER** |
| Change app Result identity / OFF read / Evidence Authority | App governance | **RED** — out of WEB-01 scope |
| Patch UPCITEMDB or OFF upstream data | External systems | Outside Wave 5 code zones; report only |

**Recommendation for founder approval (not implemented):** treat public share identity as OFF-exact-match only; on miss, render barcode-only unknown. Optionally keep UPCITEMDB for non-public tooling only.

---

## 2. App-to-web visual comparison

### 2.1 Screenshot provenance (important)

| Asset | Provenance |
|-------|------------|
| `docs/uat/w5-ui10/A-full-result.png` | **Prior UAT evidence** — Cadbury emerald Result (live app capture from earlier Wave 5 UI work). **Not** re-captured in this diagnostic turn. |
| `docs/uat/w5-web-01-gateway-v2/preview/media/app-result-rated.png` | Marketing/teaser media of Cadbury Result (prior). |
| `docs/uat/w5-web-01-gateway-v2/screenshots/preview-known-390.png` | **Live WEB-01 preview** Cadbury teaser (this workstream). |
| `docs/uat/w5-web-01-gateway-v2/screenshots/app-emulator-current.png` | **Live this session** — Expo Go “Loading…” only. Deep link `truescan://` unresolved on emulator; Cadbury Result not opened. |

### 2.2 Component matrix

| Component | RC1 app (source of truth) | WEB-01 V2 landing | Gap |
|-----------|---------------------------|-------------------|-----|
| Wallpaper | Emerald gradient `#27B899` → `#10957E` → `#087565` (`resultPresentation.emerald.wallpaper`) | Mint/neutral wash + soft emerald accents | Web deliberately lighter; less “Result immersion” |
| Product hero | Mint gradient card, photo ~144×170, brand 11px tracking, name ~28px dominant, dog-ear fold 46, fav/share controls | Similar mint card + dog-ear SVG; photo smaller share; **no** fav/share controls | Good direction; photo/name hierarchy still weaker than app |
| Score frame | Glass sheet peeks (`backingPeek`), white card, title “Rveel Score” | “Four perspectives” card with light sheet peeks | Naming/structure differ; no score title (correct for teaser) |
| Pillar tiles | Pastel gradients + dog-ear peel + MCI glyphs apple/leaf/message-text/eye + **published `/25` + chevron** | Pastel tiles + soft corner highlight + simplified SVG icons + “IN RVEEL” + **no values** | Colour family OK; icons (esp. Body heart vs apple) and peel geometry weaker; chevrons absent |
| Consumer labels | `consumerPillarLabel`: Body / Planet / **Claims** / **Transparency** (Ethics→Claims, Open→Transparency) | Body / Planet / Claims / Transparency | Aligned |
| Medallion | Published: number + band colour + arc; NR: `?` glyph; Checking: `—` | Neutral lock + “Reveal” caption | Correctly not Rated; lock is **not** NR `?` — distinguishable (good) but less authentic than glass medallion silhouette |
| Confidence / Signals | Limited-confidence strip, Dynamic Signals, etc. | None | Intentional omission for teaser |
| Motion | Native card depth | Mild pillar float | Under-powered vs app presence |
| CTA | In-app share / contribute | Open in Rveel + stores | Conversion hierarchy present; App Store often “coming soon” on preview |

### 2.3 What can safely be reused on the web (without governed scoring)

**Safe to replicate as presentation tokens/CSS only (GREEN if copy-only):**

- Emerald wallpaper / hero mint gradients / ink / muted / line colours from `resultPresentation.ts`
- Pillar pastel stops and icon colours (Body/Planet/Ethics/Open)
- Dog-ear geometry constants from `dogEar.ts` (path data as static SVG)
- Hero photo radius, brand tracking, name weight
- Glass-sheet peek motif above the score/reveal card
- Neutral medallion face (`medallion: #FFF → #EDF0F2`) **without** score digits, bands, or arc dashoffset derived from scores
- Consumer pillar labels Claims / Transparency

**Must not reuse on the web:**

- Published Overall / pillar numbers, band labels, arc colours driven by score
- NR `?` treatment that could be mistaken for a genuine unpublished assessment unless clearly framed as “open in app”
- Any HTML that embeds real scores then hides them with CSS/blur
- Fake `/25` placeholders or fabricated confidence

---

## 3. WEB Gateway V3 — design proposal (not implementation)

### 3.1 Product-first emphasis

- Mobile: hero card is the first viewport anchor (photo larger, name primary, brand secondary, barcode tertiary).
- Reduce marketing headline height; keep curiosity line but subordinate to product identity.
- Desktop: sticky product column (~42%) / reveal column (~58%), max width ~1080–1120.

### 3.2 Authentic app fidelity

- Reproduce hero + reveal frame silhouettes from Emerald Perspectives (static SVG/CSS).
- Pillar tiles: true dog-ear peels, apple/leaf/message/eye glyphs, chevron affordance as **non-functional** visual cue (“opens in app”).
- Central medallion: frosted glass disc matching app proportions; content = lock / “In Rveel” — never digits.

### 3.3 Frosted-glass / masked reveal

- Pillar faces show **structure only** (label + icon), not blurred fake numerals.
- Optional frost overlay is decorative; **no score strings exist in DOM**.
- Copy: “The full product view is in Rveel” + “Explore published findings and what may still be missing.”

### 3.4 Motion

- Hero enter (opacity/translate)
- Medallion soft pulse
- Pillar peel shimmer (reduced-motion: off)
- Primary CTA glow pulse (existing pattern)

### 3.5 Conversion hierarchy

1. Primary: Open this product in Rveel (deep link, deliberate only)
2. Platform-primary store
3. Secondary store / coming soon
4. Fine print: no install-to-product restore promise

### 3.6 Safe states

| State | Treatment |
|-------|-----------|
| Known + photo | Full hero |
| Known + no photo | Barcode placeholder well (current) |
| Unknown / unresolved | Barcode-dominant card; no invented brand/name; `sheet-unknown` |
| All-zero / rejected identity (if AMBER fix approved) | Same as unknown even if UPCITEMDB returns junk |
| NR analogy | Neutral medallion — **not** app NR `?` unless founder approves distinct “teaser lock” art |

### 3.7 Hard prohibitions (unchanged)

- No unpublished scores in HTML
- No CSS-hidden real scores
- No fake scores / bands / findings
- No auto deep-link on load

---

## 4. Visual references

| Role | Path / URL |
|------|------------|
| App Cadbury Result (prior UAT) | `docs/uat/w5-ui10/A-full-result.png` |
| Web preview Cadbury 390 | `docs/uat/w5-web-01-gateway-v2/screenshots/preview-known-390.png` |
| Web preview Cadbury 1440 | `docs/uat/w5-web-01-gateway-v2/screenshots/preview-known-1440.png` |
| Live preview Cadbury URL | https://truscoreapi-m5l6i4fv3-leightons-projects-d328c774.vercel.app/barcode/9300617064879 |
| Unexpected zero URL | …/barcode/0000000000000 |
| OFF-real “999…” URL | …/barcode/9999999999994 |

---

## 5. GREEN / AMBER / RED for proposed next work

| Work package | Class | Notes |
|--------------|-------|-------|
| V3 visual HTML/CSS fidelity (dog-ear SVG, icons, layout, motion, CTA hierarchy) using presentation tokens only | **GREEN** | Bounded to share landing + stylesheet + contract tests |
| Remove auto-open already done; keep deliberate open | **GREEN** | Already in V2 |
| Reject UPCITEMDB (or all-zero) on public product-preview | **AMBER** | Changes public identity authority; needs founder approval |
| Require OFF code exact-match gate in product-preview | **AMBER** | Same |
| HTML ignore preview name for synthetic barcodes without API change | **AMBER** | Presentation/API divergence |
| Import RN Result components / scoring / publication into web | **RED** | Forbidden |
| Show real scores blurred | **RED** | Forbidden |
| Change app Result orchestration or deep-link parsing | **RED** / separate assessment |

---

## 6. Declarations

- No source code edited in this follow-up.
- No deploy / commit / push / merge.
- RC1 baseline and other worktrees not modified.
- Awaiting founder approval before any AMBER identity fix or GREEN V3 implementation.
