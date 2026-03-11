# ETHICS Pillar: Best Practice Setup for Barcode → BBFAW → Display

This document explains how the app currently works, the accuracy challenge, and the best industry-practice method to give users the most accurate BBFAW data in the ETHICS pillar score and Highlights modal.

---

## 1. Current End-to-End Flow (How It Works Today)

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│ User scans      │────▶│ App fetches product   │────▶│ Product data has:   │
│ barcode in      │     │ from Open Food Facts  │     │ • brands: "Nestlé"  │
│ store           │     │ (or merged sources)   │     │ • brand_owner: "..." │
└─────────────────┘     └──────────────────────┘     └──────────┬──────────┘
                                                                │
                                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ETHICS PILLAR CALCULATION (ethicsPillar.ts)                                  │
│ 1. getDirectCompanyForBBFAW(product):                                       │
│    - Primary: product.brand_owner                                            │
│    - Fallback: product.brands (first value if comma-separated)               │
│ 2. checkBBFAWTier(companyName): EXACT match only vs BBFAW 2024 list          │
│ 3. If match: apply Tier score + Impact score; else: nil (score stays 15)      │
│ 4. Cap: 0–25                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DISPLAY                                                                      │
│ • TruScore component: breakdown.Ethics (0–25)                                │
│ • TruScoreAnalysisModal: pillar adjustments (BBFAW Tier X, Impact Y)         │
│ • Highlights (ETHICS_HIGHLIGHTS): trigger(product) → show Tier/Impact blurb   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Where BBFAW Data Lives

| Stage | Location | When used |
|-------|----------|-----------|
| Source document | `Database files/ETHICS Pillar/bbfaw-2024-report.docx` | Input for extraction script |
| Extracted JSON | `Database files/ETHICS Pillar/bbfaw-2024-data.json` | Output of extraction (not loaded at runtime) |
| App data | `src/data/bbfaw2024Data.ts` | **Runtime** – imported by bbfawService |

The app does **not** read from `Database files` at runtime. It uses the generated `bbfaw2024Data.ts` which was produced by running:

```bash
yarn extract-bbfaw2024
```

That script reads `bbfaw-2024-report.docx` and writes both `bbfaw-2024-data.json` and `bbfaw2024Data.ts`.

---

## 2. The Fundamental Accuracy Challenge

### Mismatch: Product Data vs BBFAW Report Names

| Source | Field | Example values |
|--------|-------|----------------|
| Open Food Facts | `brands` | "Nestlé", "Nestle", "The Spice Tailor", "M&S" |
| Open Food Facts | `brand_owner` | "Nestlé SA", "Premier Foods", "Parmalat", often empty |
| BBFAW 2024 report | Company names | "Nestlé SA", "Nestlé", "Premier Foods PLC", "Tyson Foods Inc" |

Problems:
1. **Spelling / accents**: "Nestle" ≠ "Nestlé" (exact match fails).
2. **Suffixes**: "Premier Foods" vs "Premier Foods PLC".
3. **Brand vs parent**: BBFAW lists **parent companies**; OFF often has the **product brand**.
4. **Missing brand_owner**: Many products have only `brands`, no `brand_owner`.

With **exact match only** (current setup), many valid BBFAW companies are never matched, so the user sees base score 15 and no BBFAW explanation.

---

## 3. Best Industry Practice: Recommended Architecture

### A. Authoritative Data Source

**Use `Database files/ETHICS Pillar` as the source of truth:**

1. Keep `bbfaw-2024-report.docx` (or equivalent from BBFAW).
2. Run `yarn extract-bbfaw2024` when BBFAW publishes a new report (e.g. annually).
3. Ship the generated `bbfaw2024Data.ts` with the app.

Optional: Load `bbfaw-2024-data.json` at startup instead of a baked-in TS file, so updates can happen without rebuilding the app (e.g. remote config or OTA update).

### B. Matching Strategy: Canonical Alias Table (Recommended)

Instead of exact-match only or full fuzzy logic, use a **canonical alias table** that maps common product variants to BBFAW official names:

```ts
// Example: BBFAW canonical + common product aliases
const BBFAW_ALIASES: Record<string, string> = {
  'nestle': 'Nestlé SA',           // No accent
  'nestlé': 'Nestlé SA',
  'premier foods': 'Premier Foods PLC',
  'tyson': 'Tyson Foods',
  'tyson foods inc': 'Tyson Foods Inc',
  'm&s': 'Marks & Spencer PLC',
  'marks and spencer': 'Marks & Spencer PLC',
  // ... curated from real OFF product data
};
```

Flow:
1. Take `brand_owner` or first `brands` value.
2. Normalise (lowercase, trim, basic cleanup).
3. Look up in alias table → get BBFAW official name.
4. If no alias, try exact match on BBFAW list.
5. If still no match → nil (no adjustment).

Benefits:
- No risky fuzzy matching.
- Controlled, auditable mappings.
- Can be built from real OFF data and BBFAW report.

### C. Data Quality Enhancements

1. **Request `brand_owner` from OFF**
   - Ensure the OFF API request includes `brand_owner` (and related fields).
   - Prefer `brand_owner` over `brands` when both exist.

2. **Merge logic**
   - When merging from multiple sources, preserve `brand_owner` from the highest-quality source (e.g. OFF before fallbacks).

3. **Enrichment (future)**
   - Optional: product→parent mapping from Open Corporates or similar, where brand_owner is missing.

### D. Transparency for the User

1. **Score breakdown**
   - Show: "BBFAW Tier 2 (+4) – Animal welfare governance"
   - Include reference link to BBFAW report (already implemented).

2. **Highlights modal**
   - Use the same BBFAW match and Tier/Impact logic as the pillar.
   - Show the correct Tier/Impact blurb only when the product is actually matched.

3. **“No match” case**
   - When there is no BBFAW match, say something like:  
     "Company not in BBFAW 2024 report – no animal welfare adjustment applied."

---

## 4. Recommended Implementation Steps

### Phase 1: Data Pipeline (Already in Place)

1. Keep BBFAW source in `Database files/ETHICS Pillar`.
2. Run `yarn extract-bbfaw2024` when BBFAW updates.
3. Commit updated `bbfaw2024Data.ts` (or equivalent) with the release.

### Phase 2: Alias Table (Improves Match Rate)

1. Collect a sample of products with `brand_owner`/`brands` that should map to BBFAW.
2. Build `BBFAW_ALIASES` from that sample (OFF values → BBFAW official names).
3. Use this in `checkBBFAWTier`:
   - Normalise input.
   - Resolve via alias first.
   - Fall back to exact match on BBFAW list.

### Phase 3: API and Merge Improvements

1. Verify OFF (and any other APIs) are requested with `brand_owner` included.
2. Ensure merge logic keeps `brand_owner` when present.
3. Log when `brand_owner` is missing but `brands` is present (for future alias work).

### Phase 4: Optional Runtime Loading

1. If desired, load BBFAW data from JSON at startup instead of a static TS module.
2. Enables updates without app rebuild (e.g. when a new BBFAW report is released).

---

## 5. Summary: Best Practice Checklist

| Practice | Status | Action |
|----------|--------|--------|
| BBFAW source in `Database files/ETHICS Pillar` | ✅ | Keep docx there; run extraction script |
| Generated data in app bundle | ✅ | `bbfaw2024Data.ts` is used at runtime |
| Primary: `brand_owner`, fallback: `brands` | ✅ | Implemented in ethicsPillar |
| Exact match only (no fuzzy) | ✅ | Reduces false positives |
| Canonical alias table | ✅ | BBFAW_2024_Supermarket_Parent_Brand_Mapping.xlsx → brandAliasMap.json; see docs/BBFAW_MAPPING_EXCEL_ANALYSIS.md |
| OFF API includes `brand_owner` | ⚠️ | Confirm in product fetch logic |
| User sees BBFAW reference link | ✅ | In pillar details |
| “No match” explanation | ⚠️ | Add explicit message when nil |

---

## 6. Current vs Recommended Flow

**Current:**
```
Barcode → Product (OFF etc.) → brand_owner or brands → EXACT match vs BBFAW → Score + Highlights
```
Problem: Many real BBFAW companies never match due to name variants.

**Recommended:**
```
Barcode → Product (OFF etc.) → brand_owner or brands
       → Normalise → Alias lookup → BBFAW official name
       → Match vs BBFAW → Score + Highlights
```
This keeps the logic simple and auditable while improving match rate via a curated alias table.
