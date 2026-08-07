# Dynamic Signals Asset v0.2 — enrichment applied (bounded) + single-authority cleanup

**Date:** 2026-08-08  
**Bases:** remediation `7fbfaced…` / docs tip `bc7fdc76…`  
**Status:** Applied for founder acceptance. Holds remain: no Asset tag, no public promotion, no device/TestFlight, no production Asset enablement.

## Single-authority cleanup

| Change | Detail |
|--------|--------|
| Retired | Independent MILO production content path via former `buildFoodRecallSafetyPublicationRecords` calling `evaluateMiloFoodRecallMatch` |
| Preserved | `evaluateMiloFoodRecallMatch`, `miloRecallPack.ts`, `pathControl.ts`, Stage 2 tests — regression/Skeleton historical only |
| Contract | `food_recall_eligibility.csv` (signal_id → recall_notice_id) + `food_recall_notices.csv` + `food_recall_affected_variants.csv` |
| Kill switch | `EXPO_PUBLIC_FOOD_RECALL_CORRECTED_PATH` gates matcher evaluation only; cannot create content without a governed Asset Signal + reviewed eligibility + structured variants |
| Skeleton | Remains historical/regression; mutual exclusion unchanged |

## Identity enrichment (source-backed)

| ID | Semantic | Evidence |
|----|----------|----------|
| P0157 | Hoyt Food Manufacturing Industries Pty. Limited | ABN 12 004 489 212; https://hoytsfood.com.au/about-us/ |
| B0653 | Hoyt's | Official Hoyts Food site; ABC Four Corners turmeric naming (2026-07-27) |
| PF_HOYTS_TURMERIC_AU | Hoyt's Turmeric family stub | Brand/parent reviewed; membership empty (no verified tested GTINs) |
| B0654 | Chickadees | FSANZ Chickadees recall (Snackbrands Australia); parent P0156 Intersnack (Snackbrands local context) |
| P0158 | Talley's Group Limited | https://www.talleys.co.nz/about-us; NZBN 9429040188935; NZ Herald court reporting |
| B0655 | Talley's | Official Talley's brand presentation under Group |

## Left unresolved (no invented GTINs)

- Chickadees / Allen's / Pams Lasagne exact GTINs + Asset recall_eligibility
- Anchor Blue Milk Powder 400g GTIN
- Pams sparkling water GTIN
- Tomato-paste / Woolworths SA eggs / Keri / Anchor Butter / Hoyt's turmeric membership GTINs

## Counts after this pass

| Layer | Count |
|-------|------:|
| Sources | 13 |
| Reveal domains | 14 |
| Signals | 16 (all candidate) |
| Signal targets | 25 |
| Product families | 7 |
| Extension brands | 3 |
| Extension parents | 2 |
| Production recall_eligibility rows | 0 |
