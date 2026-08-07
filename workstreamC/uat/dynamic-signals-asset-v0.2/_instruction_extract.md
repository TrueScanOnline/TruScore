Rveel Dynamic Signals Asset v0.2 — governed implementation authorisation
Please treat the attached Rveel_Dynamic_Signals_Asset_20260807_v0_2.xlsx as the founder-approved implementation candidatefor the bounded MVP Dynamic Signals data asset.
This instruction follows closure and acceptance of Wave 1 — Signals Skeleton UAT & Remediation under tag wave1-signals-skeleton-uat-remediation-closure-20260807. The accepted Skeleton behaviour and assurance findings are the starting baseline. Proceed with the implementation below unless the Dynamic Signals Asset itself exposes a new material architectural contradiction or a requirement that cannot be implemented safely without a founder decision..
Existing baseline to preserve
Repository: TrueScanOnline/TruScore
accepted Skeleton canonical data: workstreamC/c-data/v0.4/
accepted Skeleton canonical pack commit: f5ebf36
handoff baseline/tag: 0e91226 / v10.18.0-handoff-phase6-workstreamC-2026-07-30
existing public Signal render contract: ProductScanResult.signals
accepted Skeleton/UAT artefacts remain historical proof and must not be silently rewritten.
Implementation objective
Extend the existing Dynamic Signals architecture from the fixed Skeleton proof into a governed repo-native implementation of the attached asset, without creating a second Signals engine or public render path.
The workbook contains:
13 authorised source channels;
14 controlled Reveal Domains;
16 current Signal candidate records;
25 Signal target records.
Convert these into the smallest appropriate version-controlled CSV/JSON representation compatible with the existing architecture. XLSX is founder-review input, not the production runtime source.
Signal source and record implementation
Implement the Source Universe as the authorised-source registry. Preserve the separate publisher_type, editorial_function and geographic_reach dimensions.
Implement the Signal records using the field meanings and controlled values in the asset. Do not rename canonical publication/review concepts merely to suit existing code.
All supplied Signals are implementation candidates only. Do not promote records to publishable, mark reviews complete, fabricate review dates or otherwise change governance states merely to make runtime tests pass.
subject_response is supporting balance/context, not a publication prerequisite. Preserve its status/source fields. Material future developments must be capable of updating, suppressing, expiring or superseding a Signal without rewriting historical source lineage.
Identity and target implementation
Reconcile Signal_Targets to the Shared Identity / Chaining asset.
Runtime eligibility must be driven only by:
market_key + target_type + canonical_target_id + propagation_mode
The human-readable target_label and scope_review_summary fields are review aids only and must never participate in runtime matching.
Supported propagation semantics are:
exact_only
family_members
brand_descendants
entity_descendants
operational_descendants
No generic keyword, fuzzy-name, product-title, article-text or bespoke per-Signal scope-rule engine is authorised for public matching.
Subject identities must resolve through reviewed canonical Chaining objects and fail closed where unresolved or ambiguous.
Product-family extension
Implement the smallest governed canonical product_family extension in the Shared Identity / Chaining layer necessary to support family_members, consistent with the accepted Skeleton closure findings and the approved Dynamic Signals Asset v0.2.
Product-family identity and membership belong to Chaining, not the Dynamic Signals asset.
The Signals asset must reference one canonical family ID and must not reproduce a manually maintained list of all descendant products.
Family membership must be reviewed, market-aware, lineage-bearing and deterministic. Do not infer family membership at runtime from product names.
Expose family identity/membership through SharedIdentityContext or the smallest architecturally equivalent additive contract.
Existing Skeleton logic
Preserve the accepted Skeleton fixtures/tests as historical UAT proof where useful, but do not allow the UAT-only Cadbury bridge, broad product-name heuristics, GLOBAL_CONTEXT shortcuts or synthetic fixture behaviour to become the production matching mechanism.
Production Dynamic Signals must use the deterministic canonical target model above.
Required implementation safeguards
ProductScanResult.signals remains the only public chain-dependent Signal render path.
No Dynamic Signals logic may mutate Body, Planet, Ethics, Open or overall TruScore.
No Dynamic Signals logic may mutate frozen BBFAW/KTC attribution or scoring eligibility.
Market resolution must fail closed rather than leak AU content into NZ or vice versa.
unresolved/ambiguous target links cannot become publishable;
source-channel validation must reject non-authorised sources;
public matching cannot rely on free text;
entity inheritance must follow current reviewed ownership relationships, not retailer stocking relationships;
product-family inheritance must come only from canonical reviewed family membership.
Automated proof required before founder/device UAT
Add focused automated tests demonstrating at minimum:
exact-product positive and sibling negative matching;
multiple pack sizes in a canonical product family inherit the same Signal;
a product outside that family does not;
an approved brand descendant inherits a brand Signal;
unrelated sibling brands do not;
a company/entity Signal propagates to its reviewed current descendants;
third-party products merely sold by a retailer do not inherit the retailer's entity Signal;
Cadbury chocolate can inherit an appropriately scoped cocoa Signal while Ritz does not merely because both chain to Mondelēz;
AU/NZ market isolation;
blocked/needs-review targets fail closed;
candidate Signals do not render publicly;
two legitimate distinct Signals are not incorrectly deduped;
no score or frozen-benchmark mutation.
Please also retain or adapt the existing relevant Workstream C automated gates rather than creating unnecessary parallel test machinery.
Return before any new device/UAT build
Please provide one consolidated implementation response containing:
exact base commit used;
resulting commit SHA and proposed tag;
exact repo paths for all new/changed governed data and code;
workbook → repo schema mapping;
confirmation of the resulting row counts;
product-family implementation and SharedIdentityContext impact;
resolved canonical_target_id values;
a clear list of any target that could not be safely resolved;
before/after explanation of Cadbury/Ritz matching;
confirmation that no free-text production matching remains;
automated test commands and results;
diff confirmation that Workstream A governed identity data and Workstream B frozen benchmark outputs were not improperly mutated;
any material issue requiring founder disposition.
Do not prepare a TestFlight/device UAT release under this instruction. Stop after implementation, automated verification and the consolidated review response so the exact commit can undergo independent review.

