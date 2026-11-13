# Product Display — card inventory (from live code)

**Baseline**
- Branch: `experiment/w5-contribution-delight-20261111`
- HEAD: `b239f7e91600f086bc71558a81b724f3a9d1ec58`
- Local uncommitted: Product Origins V2 panels + W5-CARD-ART decoration (presentation)
- Preserve: `rveel-w5-rc1-20261111`, `w5-cd-01-founder-approved-20261111`, Product Origins approved design

**Classification:** GREEN — presentation-only (`src/components/**` layout/decoration). Product Origins left unchanged. No scoring / publication / EA / contribution logic edits.

| # | Card | Component / host | Source | Purpose | Art treatment | Protected |
|---|------|------------------|--------|---------|---------------|-----------|
| 1 | Product Hero | `ProductHeroSection` | `src/components/product/ProductHeroSection.tsx` | Identity + image | Soft `heroGlow` overlay; dog-ear preserved | Image containment |
| 2 | Banner alerts | `BannerAlertsCard` | `src/components/BannerAlertsCard.tsx` | Recall/alerts | **Skipped** (meaning-sensitive) | Alert semantics |
| 3 | Partial scan | inline | `app/result/[barcode].tsx` | Analysis incomplete | **Skipped** (status banner) | Status copy |
| 4 | Rveel Score frame | `EmeraldScoreFrame` + `TruScore` | `EmeraldScoreFrame.tsx`, `TruScore.tsx` | Published score + pillars | Soft `scoreAura` behind content | Score values/colours/bands/publication |
| 5 | Data limitations | `ProductDataLimitationsCard` | `productLegal/ProductDataLimitationsCard.tsx` | S26 | **Skipped** this pass (dense legal) | S26 copy |
| 6 | What we noticed | `ScoreHighlightsList` host | `app/result/[barcode].tsx` | Highlights | `discovery` dots/arcs | Highlight wording/selection |
| 7 | Insufficient data | inline | `app/result/[barcode].tsx` | No score | Unchanged | Fail-closed NR |
| 8 | Alerts preference | Insights carousel host | `app/result/[barcode].tsx` | User alerts | **Skipped** (conditional) | Insights content |
| 9 | Nutrition & Ingredients | `NutritionTable` + `ResultIngredientsSection` | `NutritionTable.tsx`, `[barcode].tsx` | Nutrients + ingredients + NOVA | `nutrition` grid; `ingredients` flow lines | Nutrient levels/NOVA colours |
| 10 | About these Additives | `AboutTheseAdditivesCard` | `AboutTheseAdditivesCard.tsx` | Additive count entry | `molecular` nodes/links | Count + navigation |
| 11 | Product Origins | Declaration panels | `ProductOriginsDeclarationPanel.tsx` | Origins | **UNCHANGED (benchmark)** | Origins data |
| 12 | Packet Claims | Certifications card | `app/result/[barcode].tsx` | Claims/certs | `paper` layered label | Claims confidence |
| 13 | Palm oil | `PalmOilCard` | features card | Hidden on Result | N/A | — |
| 14 | Pricing | `UniversalPricingCard` | MVP-gated | Deferred | N/A | — |
| 15 | Allergens | PremiumGate card | MVP-gated | Deferred | N/A | — |
| 16 | Disclaimer | `ProductDisclaimerCard` | productLegal | Legal | **Skipped** this pass | Legal copy |
