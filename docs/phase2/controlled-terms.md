# Controlled terminology — Rveel (Phase 2)

Use these definitions consistently in **new** user-facing copy, registry rows, and reviews. Existing UI may still vary; align opportunistically when touching a surface.

| Term | Approved meaning | Preferred user-facing phrasing | Do not conflate with |
|------|-------------------|-------------------------------|----------------------|
| **Rveel** | The public product (mobile app) | “Rveel”, “the Rveel app” | Bundle IDs, repo folder name, `truescan` scheme, or backend hostnames (Layer B). |
| **Rveel Score** | App-native 0–100 composite from four pillars | “Rveel Score”, “score out of 100” | Nutri-Score, Eco-Score, NOVA alone, or “official government score”. |
| **Pillar** | One of four equal contributors to Rveel Score: Body, Planet, Ethics, Open | “Body pillar”, “Planet pillar”, … | Generic “category” or unnamed “section”. |
| **Alert** (generic) | Any prominent in-flow notice | Use “alert” only if the UI pattern is clearly an alert/banner. | Push notification (unless it is one). |
| **Informational alert** | Non-blocking notice explaining data, scoring, or recall context | “Informational alert”, “for your information” | Medical warning, legal order, or guaranteed risk statement. |
| **User preference** | Setting from Alerts tab / preferences that filters or highlights | “Based on your preferences”, “when this preference is enabled” | Objective product fact or regulatory classification. |
| **Source-based** | Derived from a named upstream dataset or API field | “From Open Food Facts”, “label-listed”, “according to [source]” | App-invented fact not present in source data. |
| **Limited data** | Known gaps in upstream fields for this barcode | “Limited data”, “incomplete listing”, “missing fields” | “Product has no issues” or “safe”. |
| **Data unavailable** | Field or score cannot be shown | “Not available”, “no data yet”, “insufficient data to show” | Zero or “best” implied. |
| **Non-scored** | Feature or banner does not change the numeric Rveel Score | “Does not affect your Rveel Score”, “informational only” | Hidden penalty or secret score change. |
| **Score impact** | Change to pillar or total from a rule | “Affects the [Body/Planet/…] contribution”, “reflected in Rveel Score” | Moral judgment on the shopper. |
| **Methodology** | Documented rules for computing Rveel Score and pillars | “Methodology”, “how we calculate” | Proprietary black box (we state public-system basis). |
| **Third-party data** | Data from OFF, OBFF, agencies, certification bodies, etc. | “Third-party data”, “public database” | Data owned or audited by Rveel unless explicitly true. |
| **Confidence** | App signal for completeness/reliability of inputs to scoring | “Confidence”, “data confidence” | Statistical confidence interval unless defined that way in UI. |
| **Explanation** | Text describing *why* a score or highlight appears | “Why you’re seeing this”, “explanation” | Personalized medical or legal advice. |

**Legacy public names** (TruScore, TrueScore, TrueScan, TruScan) must not appear in **new** approved wording. Registry `mustNotSay` may include them where drift is a risk.
