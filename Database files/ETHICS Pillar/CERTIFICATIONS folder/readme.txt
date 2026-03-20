ETHICS PILLAR — CERTIFICATIONS (source of truth)

Primary rules: see "ETHICS SPEC sheet.xlsx" in the parent folder (sheet Ethics_Scoring_Spec_34).

Bundled implementation:
- Scoring logic: src/services/ethicsCertificationsService.ts
- Weights (max single scheme in MVP, no stacking): Fairtrade +5, Rainforest Alliance / UTZ +4, ASC +4, MSC +4, RSPO +3, Organic +2
- MSC: positive credit only when MSC Data Validation API confirms the product (see ethics_msc_api_validated on Product), unless EXPO_PUBLIC_ETHICS_MSC_OFF_FALLBACK is enabled for development.
- OFF labels / structured product fields used for non-MSC schemes; Organic requires a recognised certifier signal (not bare "organic" alone).

Optional future JSON alias maps can be placed here and synced via scripts/syncEthicsPillarData.ts.
