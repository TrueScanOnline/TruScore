# Claude â€” Wave 1 Signals Skeleton Closure Assurance Review

**Source file:** `claude_wave1_signals_closure_assurance_review_20260807_1.docx`  
**Preserved:** 2026-08-07  
**Authority:** Independent Claude assurance (founders reviewed)

---
Claude — Wave 1 Signals Skeleton Closure: Independent Assurance Review
Reviewer: Claude
Date: 7 August 2026
Build 30 baseline: 1c12e339edcaa39572f107a49e906473ba117e38
Clarification/remediation code: a92be423535c8137bc56b3455e0ed45a7e74c95f
Evidence tip reviewed: 35c5e247c4fa9df9e9453683fa97b6e7952889e3
Method: Adversarial code inspection against the founder instruction extract and the evidence pack — code read directly, not inferred from Cursor's summaries. Where a claim was cheap and falsifiable to check, it was checked (absence-searches across the full tree, not just the files Cursor pointed at; direct reads of the resolver logic, the runtime wiring, the dedupe function, and the actual test bodies, not just test titles).
One provenance note, resolved rather than left open: signals_architectural_remediation_evidence.md cites an internal “package tip” (0e8e5fc) that differs from the evidence tip I was given (35c5e24). Checked directly — 0e8e5fc is a real, verified ancestor of 35c5e24; it's an intermediate commit from the same packaging sequence, not a discrepancy. No finding.
§2 — Single public Signals pathway
Confirmed. D (safeguard).
phase6SignalSourceMode — the option that previously restored transitional blending — has zero references anywhere in production src/ or app/ (searched independently, not taken from the evidence doc). syntheticTransparencyCards, the function that generated Limited Product Data and Web Search Source cards, is not merely disconnected — it no longer exists in the codebase at all. The evidence pack's own repository-search doc corroborates this from a different angle: the only remaining reference to phase6SignalSourceMode anywhere in the repository is inside the golden test, which deliberately spreads it as an unknown prop and asserts zero legacy cards result — a deliberate architecture negative test, not a residual escape hatch.
The six preference-banner producers (generateBannerAlerts / bannerAlertsService.ts) are still defined — appropriately retained for their own unit tests per the instruction's allowance — but have exactly one other reference in the entire app: a comment in scanResultPresentation.ts documenting that the production list is built “only from ProductScanResult” with no parallel call. No live call site exists.
Legacy SIG_REG_* subject-link suppression (already verified in the prior recall-matcher review) is unconditional and applied before any branching, unaffected by this remediation.
This satisfies the instruction's core requirement: one production behaviour, governed publication records only, with no caller, flag, or environment setting able to restore anything else.
§3 — KitKat / AU-02 chain contract
Confirmed. D (safeguard).
Read resolveWorkstreamCRetailChain.ts in full, not the summary. The root cause matches the diagnosis in build30_as_built_signals_alerts_inventory.md: the reviewed “kitkat” alias (6 characters) was being blocked by an old ≥ 8-character substring gate, and the umbrella Nestlé brand was preferred over the more specific one when both were candidates. The fix:
Alias matching now includes a general ≥ 5-character contiguous-compact-match rule (f.length >= 5 && nameCompact.includes(f)) — this is what lets “kitkat” through. The literal string “kitkat” does not appear anywhere in the resolution logic — the fix is a generic threshold change, not a special case, satisfying the instruction's explicit requirement that the correction “must not be implemented as a KitKat-specific exception.”
pickPrimaryBrandId's scoring gives a same-entity product-name refinement (KitKat) a base score of 1000+, versus 100+ for a brands-field-only umbrella match (Nestlé) — so the more specific brand wins the primary slot when both are legitimately present.
validateReviewedChain always returns brand_id and parent_id together — there's no code path that can return one without the other, so brand and parent structurally cannot compete for a single winning node.
generic_name is read nowhere in this file — only product_name is used for refinement, with a dedicated negative test (generic_name KitKat alone does not override Nestlé product brand).
Cross-parent ambiguity fails closed by an explicit check (pickPrimaryBrandId, lines 199–210): if brands-field and product-name refinement candidates share no common parent, the function returns null rather than guessing.
The new test suite (resolveWorkstreamCRetailChain.test.ts, mvpSignalScopeContract.test.ts) is genuinely well-targeted — I read the bodies, not just the titles. It includes a non-obvious regression case that gives real confidence the fix generalises rather than being a narrow patch: a different Nestlé product (condensed milk) correctly resolves to its own specific brand rather than being accidentally pulled toward KitKat. It also directly tests sibling non-inheritance (a Nestlé sibling brand does not receive the KitKat-scoped Signal), parent-scope qualification (a genuine Nestlé-entity Signal still matches), and dedupe (same signal via brand + parent displays once, verified against the actual dedupeSignalCards function, which dedupes by dedupe_key unconditionally before any capping).
§4 — GTIN-independent identity resolution
A: confirmed. B: partial gap. C: confirmed. D: confirmed.
(A) Ordinary product with no GTIN link — confirmed safe. resolveReviewedRetailChainUnified's primary path (used whenever a product object is available, which is the normal scan flow) never touches the GTIN table at all. GTIN lookup only happens in the separate fallback branch used when no product object is supplied (a non-app harness case). So the ordinary flow does not depend on GTIN maintenance — this is the instruction's central ask, and it's met.
(B) GTIN link as supplementary evidence — not currently implemented for the normal path. This is the one finding worth carrying forward. When a product is supplied and brand/product-name resolution fails (returns null — e.g., genuinely ambiguous or poor source data), the code does not then check whether a reviewed GTIN link exists for that exact barcode before giving up. It fails closed today, which is the safe direction, not a wrong-match risk — but it means the instruction's aspiration (“GTIN links... provide stronger identity evidence... particularly where external product data is ambiguous or poor”) isn't actually realised in the normal runtime path yet.
Classification: B — required before integrated Dynamic Signals MVP acceptance, not a Wave 1 blocker. Smallest safe correction: when the primary path returns null, add one additional check against the same gtinRows lookup already used in the fallback branch, before returning null. This doesn't create a GTIN-maintenance obligation — it only uses links that already exist.
(C) Fail-closed on conflicting evidence — confirmed, per the cross-parent check described above in §3.
(D) No operational GTIN-maintenance dependency — confirmed, following directly from (A).
§5 — Product-family scope
Confirmed. D (safeguard).
The Cadbury/Ritz bridge (applyCadburyNgoSubjectBridge) remains narrowly gated by isChocolateOrCocoaContext, which requires an explicit chocolate/cocoa/confectionery category tag or keyword — there's no path by which it could silently widen. The test suite includes both the positive case (Cadbury chocolate correctly bridges) and the negative case (Ritz cracker, sharing category adjacency, does not bridge) — the boundary is tested on both sides, not just asserted. Product-family implementation itself remains read-only, as instructed; no expansion attempted.
§6 — Safety & Recalls separation
Confirmed. D (safeguard).
Re-verified against this remediation, not re-litigated from scratch: evaluateFoodRecallMatch.ts and pathControl.ts are untouched by this diff, and the MVP contract test suite includes a direct cross-check (pack product_familyAlfamino Safety does not fire for KitKat) proving the identity-resolution changes in this remediation don't leak into recall matching. Exact-product/variant/batch/date controls, fail-closed defaults, and single-pathway publication were independently verified in the prior Stage 2 review and are unaffected here.
§7 — Code-quality and architecture standard
No unauthorised Workstream A/B or TruScore mutation — confirmed by direct diff: zero files under workstreamA/, workstreamB/, or the pillar-scoring engine are touched by this remediation.
No iOS/Android divergence risk in the touched code — no Platform.OS/Platform.select branching anywhere in the modified identity-resolution or runtime files; the logic is shared, not platform-forked, which is the simplest way to guarantee contract parity for this kind of decision logic.
One item worth recording (C — defer, not blocking): the repository-search evidence notes RecallsCard/RecallAlertModal still exist in an unmounted file, app/result/[barcode].refactored.tsx — confirmed not routed to the live screen today. Low risk as-is, but its mere presence sits slightly against the instruction's “removal or strict isolation of liability-relevant dead code” standard. Recommend deleting it or moving it under a clearly-quarantined path during the integrated Dynamic Signals build, not urgently.
Summary of findings
#
Finding
Class
Note
1
Single governed public Signals pathway; all non-governed producers removed or structurally unreachable
D
Verified by absence-search, not summary
2
KitKat/Nestlé chain: brand + parent coexist, generic fix (no hardcoding), fail-closed ambiguity, generic_name excluded
D
Read in full; scoring and fail-closed logic confirmed in code
3
GTIN-independent resolution for the normal (product-provided) path
D
No GTIN dependency introduced
4
Reviewed GTIN link not consulted as fallback evidence when primary resolution fails
B
Fails safe today; small additive fix recommended before integration
5
Cadbury/Ritz bridge remains narrowly bounded, tested both directions
D

6
Recall matching unaffected and cross-verified against the identity changes
D

7
No A/B/TruScore mutation
D
Confirmed by empty diff on those paths
8
Dead RecallsCard/RecallAlertModal component still present in an unmounted file
C
Low risk, recommend cleanup during integration
9
Test suite: genuinely targeted, includes non-obvious regression and boundary cases
D
Read test bodies, not just titles

No A (Wave 1 closure blocker) findings.
Final recommendation
Accept Wave 1 remediation for closure/tagging.
Finding 4 (B) and Finding 8 (C) should be carried forward as named conditions for the integrated Dynamic Signals MVP build — neither is a reason to withhold this closure. Every claim I could independently verify — the removed transitional path, the KitKat resolution mechanics, the fail-closed conflict handling, the dedupe behaviour, and the absence of A/B/TruScore mutation — held up against direct code inspection.
