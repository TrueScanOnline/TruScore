# Language standard — risky terms (Phase 2)

Purpose: give **Legal/Compliance** and **Product** a consistent rubric to reject or rewrite wording. This is **not** legal advice. Counsel may add stricter rules.

Legend: **Prohibited** (do not use in user-visible claims in listed contexts) · **Restricted** (only with narrow qualifying context) · **Preferred** substitutes · **Exception** (defensible narrow uses)

---

### healthy / unhealthy

| | |
|--|--|
| **Prohibited** | Calling a **product** “healthy” / “unhealthy” as an absolute fact based only on app scores or third-party grades. |
| **Restricted** | “Healthier choice” comparisons without clear scope (e.g. within same category, same serving basis, same data window). |
| **Preferred** | “Nutrient-dense profile (per Nutri-Score)”, “higher in fibre / lower in sugar (per label data)”, “informational only — not dietary advice”. |
| **Exception** | Quoting **exact** external marketing text clearly labeled as manufacturer claim, not Rveel’s voice. |

---

### safe / unsafe

| | |
|--|--|
| **Prohibited** | “This product is safe for you”, “unsafe to eat”, “safe for allergies” from app logic alone. |
| **Restricted** | “Safer packaging choice” **only** when tied to a defined methodology (e.g. recyclability rule) and not allergy/medical safety. |
| **Preferred** | “Does not assert safety — check the label”, “recycling compatibility (informational)”, “allergen information may be incomplete (see data limitations)”. |
| **Exception** | Regulatory recall text quoted **verbatim** with source attribution (FDA/USDA/CFIA/RASFF). |

---

### toxic

| | |
|--|--|
| **Prohibited** | “Toxic product”, “toxic ingredients” as broad consumer-facing claims without statutory/regulatory definition and source. |
| **Restricted** | Scientific terms in **educational** copy only with definition and source (e.g. specific contaminant above limit with agency link). |
| **Preferred** | “Additive flagged as ‘avoid’ in our database (informational)”, “substance restricted in [jurisdiction] per [source]”. |
| **Exception** | None for casual marketing tone. |

---

### ethical / unethical

| | |
|--|--|
| **Prohibited** | “Unethical company” / “ethical product” as moral verdicts without defined criteria and source. |
| **Restricted** | “Ethics pillar reflects certifications and published benchmarks (BBFAW/KTC etc.)” — OK if **scoped** to methodology. |
| **Preferred** | “Ethics score reflects public certifications and published supply-chain benchmarks (see methodology)”, “informational, not a moral judgment”. |
| **Exception** | User’s own values overlay described as **preference match**, not fact (`D_user_preference_overlay`). |

---

### proven / guaranteed / verified

| | |
|--|--|
| **Prohibited** | “Clinically proven”, “guaranteed results”, “verified safe”, “100% verified” for app scores or aggregated data. |
| **Restricted** | “Verified” **only** when referring to a **specific** third-party process (e.g. MSC API validation flag) and labeled as such. |
| **Preferred** | “Based on available data”, “matches public listing at time of scan”, “API-confirmed for this barcode (MSC)”. |
| **Exception** | Qonversion/receipt “purchase verified” in subscription **system** copy (not product health). |

---

### causes / supports (causal)

| | |
|--|--|
| **Prohibited** | “Causes cancer”, “causes obesity”, “supports heart health” from app interpretation without licensed clinical backing. |
| **Restricted** | Correlational public-health copy must be clearly marked **not** from Rveel as medical fact; prefer omit. |
| **Preferred** | “Associated with (in population studies)” only when quoting an external source **verbatim** with link; otherwise avoid causality. |
| **Exception** | None for Rveel Score narrative. |

---

### clean

| | |
|--|--|
| **Prohibited** | “Clean ingredients”, “clean label” as objective scientific classification in app voice. |
| **Restricted** | Marketing term **only** inside clearly quoted manufacturer text. |
| **Preferred** | “Few additives”, “short ingredient list (per displayed data)”, “NOVA group …”. |
| **Exception** | User-generated content not authored by Rveel (if ever shown, must be labeled UGC). |

---

### best

| | |
|--|--|
| **Prohibited** | “Best product”, “best for your health”, “#1” without transparent, contestable methodology disclosed in-app. |
| **Restricted** | “Best value” **for subscription pricing tier** (price comparison) — acceptable if clearly **subscription** context, not health. |
| **Preferred** | “Higher Rveel Score than average in category (when data available)”, “lower sugar than median (informational)”. |
| **Exception** | UI label “Best Value” on annual vs monthly plan (`subscription.bestValue` i18n) — financial context only; still avoid implying health superiority. |

---

### Implementation note

Automated tests (`src/__tests__/unit/claims/governance.test.ts`) enforce a **small** `mustNotSay` subset on selected `en.json` paths. Full enforcement is **review + registry** plus future expansion of tests.

**Phase 3 note:** In-app share hashtags no longer use `#HealthyEating` / `#EthicalShopping` (see `ShareContentBuilder.ts`); prefer neutral tags such as `#FoodTransparency` aligned with this document.
