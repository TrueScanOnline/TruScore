# Pass 3 inventory delta — evidence only

**Baseline:** `0568b807e9ff716880c290e72defc597e090b383`  
**Mode:** read-only · no remediation · no Claude review · no S25/S27 · no methodology change  
**Scope:** completion delta only (does not re-prove Pass 2)

---

## 1. S28 / TECH-019 — rendered fields & legacy narrative reachability

### Disposition (preserve — do not remediate)
Controlling spec:

> Legacy diagnostic descriptions are not consumer copy and must not be promoted. TECH-019 separately governs removal/neutralisation of historical narrative from the S28 diagnostic surface without changing scoring IDs/points/provenance.  
> — `reports/wave3/score-highlights-docs/..._S28_..._v0_5.txt` L1324

Commit J founder locks historically excluded “S28 TECH-019 cleanup”. **Disposition unchanged: open / preserve.**

### Gate
`shouldShowScoreDiagnosticsEntry` = `EXPO_PUBLIC_SCORE_DIAGNOSTICS === '1'` **AND** Settings `scoreDiagnosticsEnabled`  
(`src/config/scoreDiagnostics.ts` L11–34; Result L179–180, L1582–1594, L2625–2629)

### Currently rendered S28 string fields (`TruScoreAnalysisModal.tsx`)

| Visible field | Source |
|---|---|
| Placeholder when analysis null | Hardcoded UI L27–29 |
| Chrome / section titles | Hardcoded UI |
| Total score / barcode | `analysis.totalScore`, `analysis.barcode` |
| Fetch-trace cells | `entry.database`, `entry.queryKeyType` |
| Pillar name / scores | `pillar.pillarName`, `finalScore`, `baseScore` |
| Adjustment ID | `adj.adjustmentId` |
| **Primary narrative row** | **`adj.description`** (L104) |
| Highlight eligibility label | `adj.highlightEligible` |
| Source / query / reference | `sourceDatabase`, `queryKeyType`, `referenceUrl` |
| Points | `adj.value` |

**Not rendered on S28:** registry `highlightTitle` / `highlightExplainer`, governed L1/L2 commentary, `adjustmentMetadata`, `trust_score_breakdown.reasons`.

### Legacy narrative reachability (exact path)
1. Pillar registries set `description` on adjustment meta  
2. Scorers copy `meta.description` into fired rows  
3. `buildTruScoreAnalysis` copies into `_truscore_analysis`  
4. Modal renders `adj.description`

**Verdict:** Historical/diagnostic registry prose remains **reachable on S28 whenever diagnostics are open and analysis exists**. TECH-019 neutralization is **not done**. → **P3-I08**

---

## 2. NA-012 — restore P2 UAT-parity

| Evidence | Class |
|---|---|
| Pass 1 canvas: “Classified **P2 UAT parity**” | Registered severity |
| Evidence-completion NA register: NA-012 → **P2 UAT parity** / deferred intentional fail-closed | Registered severity |
| Pass 2 packaging: Expo Go lacks SCORE_DIAGNOSTICS (**Pass 1 P2**; not revisited) | Held |
| Prior Pass 3 inventory soft-label “P3 / UAT parity” | **Unauthorized severity drift** — no founder disposition found |

**Restore:** P3-I02 / NA-012 = **P2 UAT-parity**. Preserve. AU TestFlight / entitled EAS UAT = diagnostics vehicle; Metro/Expo Go default `SCORE_DIAGNOSTICS=0` (`app.config.js` L15–16).

---

## 3. Share — Result → ShareModal → generators

### Wiring
- Entry: `handleShare` → ShareModal (`app/result/[barcode].tsx` L1042–1060, L2810–2821)  
- Passes **both** `product` and `truScore={truScore || undefined}`  
- TruScore-card share type uses `product.trust_score < 40` for `negativeTruScore` vs `truScore` (L1557–1562) — type only  
- Insufficient-data card share: `productInfo` (L1634–1637) while Result `truScore` state is **null**

### Live text path
`ShareModal` → `ShareContentBuilder.buildContent` → `resolveShareOverallScore` / `resolveShareBreakdownForOverall` (`src/utils/shareScoreSemantics.ts`)

```ts
// Prefer TruScoreResult when present; else product.trust_score
if (truScore != null) return truScore.truscore;
return isGenuineNumber(product?.trust_score) ? product.trust_score : null;
```

Breakdown likewise falls back to `product.trust_score_breakdown` (body/planet/ethics/open).

### Image path
`ShareProductStoryCard` receives `truScore={resolveShareOverallScore(truScore, product)}` (`ShareModal.tsx` L412).

### Analytics
`ShareService` tracks `options.product.trust_score` when `options.truScore` is null (L83–86).

### What share does **not** read
`_truscore_analysis`, `breakdown.reasons`, registry commentary, Score Highlights constructors / governedCommentary.

### Parallel generator
`shareCardGenerator.getShareCardData` / `generateShareMessage` — **same resolvers**; **test-only / unused by live ShareModal** (imports only from unit tests).

### Insights share
`buildInsightsContent` reads `truScore?.insights[].reason` only; UI gated by `MVP_RUNTIME.legacyAlertsInsights === false` → **gated-dormant**.

### Non-empty consequence (P3-I09)
**Activation:** Result `truScore` state null **and** `product.trust_score` (and optionally breakdown) present — notably **manual / unstamped** products still `setProduct(manualProduct)` (L809–821) while Candidate 3 clears assessment UI; insufficient-data **productInfo** share still opens.

**Consumer consequence:** Share text/image can advertise a numeric Overall (and pillars if breakdown present) that Result **refuses** to present as authoritative assessment.  
Ordinary Core Truth session with non-null `truScore` uses session numbers first — Pass 2 “session-bound” claim is **incomplete** because product fallback remains.

**Class:** P2 observation · preserve · no remediation now. Not P0/P1 (Result card itself remains gated).

---

## 4. P3-I06 — authoritative score without `_truscore_analysis`

| Path | Evidence | Reachable? |
|---|---|---|
| Ordinary Core Truth score | `calculateTrustScore` builds analysis from `pillarDetails` when present (`trustScore.ts` L117–135); local hits re-score | Always attaches analysis on success |
| SQLite persistence | Scoring payload does not store analysis; reload re-scores | Analysis rebuilt |
| Manual | Writes `trust_score` / breakdown **without** `_truscore_analysis` **and without** Core Truth stamp (`manualProductService.ts` L115–134) | Not **authoritative** — Result requires `hasCoreTruthAuthority` for TruScore/Highlights (L456–499, L2614–2617) |

**Authoritative + non-null score/breakdown + missing analysis:** no production path found at `0568b80`.

**Close P3-I06 as unreachable** on the ordinary/authoritative path. Defensive UI (Highlights omit via `firedLedgerFromTruScoreResult` returning null; S28 placeholder) remains but is not a live miss path.

---

## 5. Transparency Origins → Product Origins / TECH-011

| Step | Evidence |
|---|---|
| Highlight IDs route to `product_origins` | `resolveL3Route.ts` OPEN_ORIGINS_IDS L46–55 |
| Result always marks host available | `productOriginsL3Available: true` (L517–522) |
| Deep-link action | Scroll to CoM block (`openInAppScoreHighlightL3` L557–561; section L1756–1760) |
| L3 modal content | `resolveL3Content('product_origins')` → `null` (dedicated host) (`l3/content.ts` L729–732) |
| Highlight evidence field | Open Origins scores **`origins_tags` only** (`openPillarOriginsV15.ts` L5–8); manufacturing fields are **not** ingredient-origin completeness |
| Destination UI field | CoM prefers **`manufacturing_places*`** then falls back to origins (`extractManufacturingCountry` L382–428) |

Founder handoff already records: **Open Origins destination-state seam** (`origins_tags` vs CoM `manufacturing_places`) → Wave 4  
(`docs/uat/WAVE3_SCORE_HIGHLIGHTS_FOUNDER_OPERATING_HANDOFF.md` L65)

**TECH-011** string not present in committed docs; reconcile as this **existing P2 cross-surface seam**. Destination exists but can be empty/mismatched vs Highlight evidence. → **P3-I07 preserve/defer (Wave 4)**. No Pass 3 remediation / no Wave 4 redesign.

---

## 6. Legacy / alternate interpretation sweep

| Hit | Class | Gate | Authority conflict? |
|---|---|---|---|
| Registry `description` on S28 | **Reachable** (UAT) | SCORE_DIAGNOSTICS + toggle | Diagnostic vs consumer commentary (TECH-019) |
| `generateTrustReasons` / `breakdown.reasons` write | **Write-only / no consumer reader** | On score write | Comment: no live Open prose reader (`trustScore.ts` L250–252); no `.reasons` UI reader in `src/` |
| `ProductCards` + modular `TruScoreCard` / `useTruScoreData` | **Dead** (no `app/` importers) | Unwired | Would bypass Result gate if rewired |
| Parallel `app/result/*.refactored*` | **Dead** (only `[barcode].tsx`) | — | None |
| Legacy alerts insights + insights share | **Gated-dormant** | `legacyAlertsInsights === false` | None while off |
| `shareCardGenerator` message helpers | **Test-only** for live share | Tests only | Same product fallback semantics if revived |
| `TrustScoreInfoModal` Transparency bullets | **Reachable** (methodology, Core Truth + score) | Authority + score | High-level Open description; not Highlights L3 |
| `ProcessingLevelModal` / `EcoScoreInfoModal` | **Reachable** educational | Result cards | Explicitly **not** Score Highlights L3 (handoff P1-1) |
| v8 `scoreHighlightDefinitions` / `productFlags` / alcohol highlight registries | **Dead** (absent) | — | None |

Mere dead source presence is **not** a finding.

---

## 7. TECH backlog reconciliation

| ID | In-repo evidence | Pass 3 mapping |
|---|---|---|
| **TECH-011** | No ticket ID string; handoff Origins destination-state seam → Wave 4 | **P3-I07** P2 cross-surface — preserve/defer |
| **TECH-013** | Founder Technical Backlog Register 2026-09-08: P3 Score Highlights regression-assurance hardening | **Preserve/defer** — no remediation in NA-018 correction |
| **TECH-016** | Founder Technical Backlog Register 2026-09-08: P3 orphaned/dead Result-surface cleanup | **Preserve/defer** — no remediation in NA-018 correction |
| **TECH-019** | Spec v0.5 L1324 — neutralize S28 historical narrative later | **P3-I08** open/preserve; S28 still shows `description` |
| **TECH-018** | Founder instruction: release/OTA provenance | **Handoff to Pass 5** — recorded, not silently omitted |
| **TECH-011** | Handoff Origins destination-state seam → Wave 4 | **P3-I07** P2 cross-surface — preserve/defer |

---

## Revised interim conclusion

**No P0/P1 Interpretation Negative stop at `0568b80` after this delta.**

Stop for founder disposition. Do not remediate.
