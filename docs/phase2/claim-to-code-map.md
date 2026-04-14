# Claim-to-code map (Phase 2)

Concrete traceability from **public claim surfaces** to **data, engines, or copy sources**. Status reflects wording alignment only where noted; engine correctness is out of scope for this doc.

**Claim classes:** `A_direct_product_fact` · `B_third_party_methodology_output` · `C_app_native_interpretation` · `D_user_preference_overlay`

---

## 0. Methodology version lock (Phase 3)

| Artifact | Role |
|----------|------|
| `src/config/methodologyVersion.ts` | `RVEEL_SCORE_METHODOLOGY_VERSION` + `METHODOLOGY_REVIEW_TRIGGER_PATHS` |
| `docs/phase2/methodology-version-lock.md` | Maintainer checklist when bumping version or editing the engine |
| `src/__tests__/unit/config/methodologyVersion.test.ts` | Asserts `v{VERSION}` appears in EN/FR/ES `infoModal.trustScore.note` |

---

## 1. Overall Rveel Score (number + breakdown)

| Aspect | Claim class | Primary logic / data | Primary UI / copy |
|--------|-------------|----------------------|-------------------|
| Total 0–100 | `C` | `trust_score` from truscore engine pipeline under `src/lib/truscoreEngine/` | `src/features/product/cards/TruScoreCard/TruScoreCard.tsx`, `app/result/[barcode].tsx` |
| Pillar sub-scores | `C` | Same engine; breakdown `trust_score_breakdown.{body,planet,ethics,open}` | `src/components/TruScoreAnalysisModal.tsx`, TruScoreCard |
| “Insufficient data” | `C` | Gating when score not computed / low confidence paths in engine + product service | `src/i18n/locales/en.json` → `result.insufficientDataMessage`; result screens |
| Score info / methodology | `C` | Copy must track engine version (e.g. v1.4 in `infoModal.trustScore.note`) | `src/components/TrustScoreInfoModal.tsx`, `en.json` → `infoModal.trustScore.*` |

---

## 2. Pillar explanations

| Pillar | Claim class | Logic | Copy / UI |
|--------|-------------|-------|-----------|
| Body | `B` + `C` | Nutri-Score, NOVA, additives from OFF + internal mappings | `TrustScoreInfoModal` body section; `src/lib/truscoreEngine/pillars/bodyPillar.ts` (and related) |
| Planet | `B` + `C` | Eco-Score grade + packaging fallback `computePackagingFallback` | `src/lib/truscoreEngine/pillars/planetPackagingFallback.ts`; Planet section in TrustScoreInfoModal |
| Ethics | `B` + `C` | Certifications + BBFAW/KTC adjustments | `src/lib/truscoreEngine/pillars/ethicsPillar.ts`, `ethicsCertificationsService`, BBFAW/KTC services |
| Open | `C` | Hidden ingredient / transparency heuristics | `src/lib/truscoreEngine/pillars/openPillar.ts`; Open section in modal |

---

## 3. Generated highlights (“why this score” style)

| Aspect | Claim class | Logic | Copy |
|--------|-------------|-------|------|
| Highlight selection | `C` | `src/utils/scoreHighlights.ts` reads `src/config/scoreHighlightDefinitions.ts` triggers + severities | Titles/descriptions **in** `scoreHighlightDefinitions.ts` (Phase 3: health-outcome copy remediated; still trace to Nutri/NOVA/OFF) |
| Display | `C` | Flags merged into product UI cards | Product result feature cards consuming `ProductFlag` / highlights |

**Assessment:** Highlight **body** Nutri-Score strings use causal/health language (see `claim-drift-log.md`). Logic ties to `nutriscore_grade` (`B`); wording is `C` and needs review.

---

## 4. Alerts / banners

| Type | Claim class | Logic | Copy |
|------|-------------|-------|------|
| Recalls | `A` | `product.recalls` filtered in `src/services/bannerAlertsService.ts` | Dynamic titles/messages built in same file |
| Ethics (BBFAW/KTC) | `C` | `calculateEthicsPillar` + `buildEthicsPillarBannerAlerts` in `src/services/ethicsPillarBannerAlerts.ts` | Strings derived to mirror pillar (see file) |
| User preference matches | `D` | `generateBannerAlerts(..., userPreferences)` with `AlertsPreferences` from `src/store/useAlertsStore.ts` | Must present as preference overlay, not product fact |

---

## 5. Data limitations / disclaimers

| Surface | Claim class | Source | Code |
|---------|-------------|--------|------|
| Result teaser + modal | `C` | `src/i18n/locales/*.json` → `result.legalDataLimitations*` | `src/components/productLegal/ProductDisclaimerCard.tsx` |
| Legal disclaimer modal | `C` | `result.legalDisclaimerModalP*` | Same component |
| Onboarding acceptance | `C` | `onboarding.legal*` + modal paragraphs | `src/components/productLegal/OnboardingLegalAcceptanceStep.tsx` |

---

## 6. User-preference overlays

| Surface | Claim class | Logic | Code |
|---------|-------------|-------|------|
| Alerts tab preferences | `D` | `useAlertsStore` | `src/store/useAlertsStore.ts`; consumption in `bannerAlertsService` |
| Search filter “teaser” / paywall | `C` + product | Filter counts vs subscription | `src/i18n/locales/en.json` → `search.teaser`, `search.paywall`; search UI under `app/` |

---

## 7. Share text builders (substantive claims)

| Builder | Claim class | Logic | Code |
|---------|-------------|-------|------|
| Universal link + UTM | `A`/`C` | `buildShareUrl` | `src/utils/shareUrl.ts` |
| Main share body | `C` | Templates from product + score | `src/features/sharing/services/ShareContentBuilder.ts` (Phase 3: defensible hooks/hashtags in `buildTruScoreContent`, palm-oil branch) |
| Nutrition burn lines | `C` | MET copy | `src/utils/nutritionShareCopy.ts`; `nutrition.burnSharePrefill` in `en.json` |
| Platform trim | `C` | `ShareService` / `optimizeForPlatform` | `src/features/sharing/services/ShareService.ts` |

---

## 8. Paywall / premium value copy

| Surface | Claim class | Source | Code |
|---------|-------------|--------|------|
| Subscription screen | `C` | i18n `subscription.*` | `app/subscription.tsx` |
| Feature bullets (static EN) | `C` | `PremiumFeatureDescriptions` | `src/utils/premiumFeatures.ts` |
| Qonversion products | `A` | Store prices from Qonversion API | `src/services/subscriptionService.ts` |

---

## 9. Legal / web from app

| Surface | Claim class | Source | Code |
|---------|-------------|--------|------|
| In-app Terms/Privacy links | `C` | `productIdentity` URLs | `src/config/productIdentity.ts`; `app/subscription.tsx` (`Linking`) |
| Hosted Terms/Privacy HTML | `C` | Static HTML stubs | `backend/vercel/lib/rveelLegalPages.ts`, `api/terms.ts`, `api/privacy.ts` |
| Share landing OG copy | `C` | Barcode context | `backend/vercel/lib/shareLandingMeta.ts`, `backend/vercel/api/barcode/[barcode].ts` |

---

## 10. Store / OS-visible (in repo)

| Surface | Claim class | Source | Code |
|---------|-------------|--------|------|
| App display name + permission strings | `C` | `productIdentity.expo.json` | `src/config/productIdentity.expo.json` → `app.config.js` |

Store Connect / Play listing text **outside** repo is tracked only in `claim-registry.csv` notes until captured in templates.
