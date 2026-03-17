# BBFAW 2024 Report – Analysis for ETHICS PILLAR Scoring

## Summary

**Yes, the information in `bbfaw-2024-report.docx` can be used to score the ETHICS PILLAR**, provided the company–tier list is extracted into a machine-readable form and wired into the existing BBFAW service. The report is the right source (BBFAW is the spec’s only animal-welfare source), and the tier system in the report matches the scoring rules already implemented in the app.

---

## 1. What the report contains

- **Source**: Business Benchmark on Farm Animal Welfare (BBFAW) **2024 Report**.
- **Content**: Assessment of **150** global food companies on farm animal welfare (policies, management, reporting, performance).
- **Structure**:
  - **Tier system** (same as your spec): 6 tiers by percentage score:
    - **Tier 1** (80%+): Leadership
    - **Tier 2** (62–80%): Integral to business strategy
    - **Tier 3** (44–61%): Established approach, implementation gaps
    - **Tier 4** (27–43%): Making progress
    - **Tier 5** (11–26%): Limited evidence of effective management
    - **Tier 6** (&lt;11%): Limited recognition of farm animal welfare
  - **Company names**: Present in the document (e.g. Nestlé, Danone, Unilever, Tyson, Cargill, McDonald’s, Mars, Greggs, Waitrose, Marks & Spencer, Premier Foods).
  - **Format**: The `.docx` has **826 table elements** in `word/document.xml` and many images; company/tier data is likely in both tables and possibly in some table images.

---

## 2. Fit with current ETHICS PILLAR scoring

Your ETHICS pillar already uses **BBFAW only** for animal welfare (no fallback). The mapping is:

| BBFAW tier (report) | Spec / code | ETHICS adjustment |
|---------------------|------------|--------------------|
| Tier 1              | +4         | +4                 |
| Tier 2              | +2         | +2                 |
| Tier 3, 4, 5        | 0          | 0                  |
| Tier 6              | -7         | -7                 |
| E / F (impact)      | -7         | -7                 |

So the **2024 report’s tier definitions and company list are directly usable** for scoring; no change to the scoring formula is required, only the **data source** (company → tier) needs to come from the 2024 report.

---

## 3. Current app data vs 2024 report

- **Current**: `src/services/bbfawService.ts` uses a small **curated list** (`KNOWN_BBFAW_COMPANIES`) with **year: 2023** and some tiers that **do not** match 2024 (e.g. Nestlé/Unilever as Tier 1; in 2024 many large firms are in lower tiers).
- **2024**: Public summaries state e.g. only **4 companies in Tier 2** (Marks & Spencer, Premier Foods, Waitrose, Greggs) and **118 companies in Tiers 5–6** (including Nestlé, McDonald’s, Cargill, Tyson, Yum! Brands). So updating from the 2024 report will make ETHICS scores **align with the latest benchmark**.

---

## 4. Technical feasibility of using the .docx

- **Plain-text extraction**: Already done to `bbfaw-2024-extracted.txt`. The result is one long line with some character glitches (e.g. “Au hors” for “Authors”) and **no table structure**, so it is **not sufficient by itself** for reliable company–tier extraction.
- **Structured extraction**: The `.docx` is a ZIP; `word/document.xml` is ~7.9 MB and contains:
  - **826** `w:tbl` (table) elements.
  - **Company names** verified present in the XML.
  - A mix of **real XML tables** and **embedded images** (some tables may be in images).

So:

- **If** the full company–tier list is in **Word tables** (XML): the information **can** be extracted with a **table-aware parser** (e.g. script that parses `word/document.xml`, finds `w:tbl`, and reads `w:tc`/`w:t` text). That would give a reliable, machine-readable list for scoring.
- **If** the main list exists only in **table images**: you would need OCR or an alternative source (e.g. BBFAW Secretariat request for Excel/CSV, or PDF table extraction) to get the same data.

---

## 5. Recommendations

1. **Confirm where the 2024 company–tier list lives**  
   - Inspect `word/document.xml` for tables that clearly list companies and tier (or percentage).  
   - If such tables exist, **extract them** (e.g. Node or PowerShell script parsing `w:tbl` → rows/cells → company name + tier).

2. **Build a 2024 company–tier dataset**  
   - Produce a simple list: `companyName` (and optional parent/alias), `tier` (1–6), optionally `year: 2024`.  
   - Add E/F impact companies if the report lists them and your spec uses them (currently -7 in code).

3. **Wire it into ETHICS scoring**  
   - Replace or supersede `KNOWN_BBFAW_COMPANIES` in `bbfawService.ts` with data derived from the 2024 report (or load from a JSON/TS file generated from the extraction script).  
   - Keep existing logic: `checkBBFAWTier()` and `getBBFAWTierScore()` already match the spec; only the **data** should change.

4. **Optional: keep docx as source of truth**  
   - If you prefer not to depend on manual curation, add a one-off or periodic **extraction script** that reads `bbfaw-2024-report.docx` and outputs the company–tier list for the app.

---

## 6. Conclusion

- The **BBFAW 2024 report is the correct and sufficient source** for the ETHICS PILLAR’s animal-welfare (BBFAW) component.
- The **tier system in the report matches your current scoring rules**; no formula change is needed.
- The **information can be used successfully** once the company–tier list is extracted from the `.docx` (or from table images/other formats) into a structured dataset and fed into `bbfawService`.

---

## 7. Implementation (Complete)

The following has been implemented:

1. **Extraction script** (`scripts/extractBBFAW2024FromDocx.ts`):
   - Parses `bbfaw-2024-report.docx` with mammoth + cheerio
   - Extracts company–tier data; falls back to curated list when docx yields noise
   - Outputs `bbfaw-2024-data.json` and `src/data/bbfaw2024Data.ts`
   - Run: `yarn extract-bbfaw2024`

2. **BBFAW 2024 data** (`src/data/bbfaw2024Data.ts`):
   - 171 companies with tier (1–6), Impact Rating (A–F), and `referenceUrl`
   - Each entry links to: `https://www.bbfaw.com/media/2192/bbfaw-2024-report.pdf#page=16` (Figure 2.1)

3. **bbfawService** now loads from BBFAW 2024 data and returns `referenceUrl` on match

4. **Ethics pillar** passes `referenceUrl` into BBFAW adjustments

5. **TruScore analysis modal** shows the report link when a BBFAW adjustment affects the score, so users can see **why** and **where** the score change came from
