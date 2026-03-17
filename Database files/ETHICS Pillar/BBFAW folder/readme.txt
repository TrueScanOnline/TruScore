BBFAW 2024 Animal-Welfare Seed Mapping Table	
Purpose	Static seed table for GTIN product -> brand -> BBFAW parent matching for packaged supermarket products only.
What is complete here?	The Parent_Entities sheet covers the supermarket-relevant BBFAW 2024 entities included in this seed workbook. The Brand_Alias_Map gives at least one canonical brand/own-label seed row for each included parent entity, plus aliases suitable for first-pass normalisation.
What is not complete?	This is not a complete corporate-portfolio register. For some B2B/private-label-heavy companies, the brand seed is intentionally minimal and marked Low confidence or Coverage Gap.
Use rule 1	Match on aliases_csv after lowercasing, removing punctuation, replacing '&' with 'and', and trimming spaces.
Use rule 2	Only apply BBFAW scoring when a canonical brand resolves to a single parent_entity_exact with sufficient confidence.
Use rule 3	Where seed_status is 'Coverage Gap' or mapping_confidence is Low, return neutral and queue for manual review/user submission.
Primary score source	https://www.bbfaw.com/media/2207/bbfaw-2024-report.pdf
Tier changes source	BBFAW 2024 Report Table 2.4
Impact changes source	BBFAW 2024 Report Table 2.7
Scope note	Restaurants and bars were intentionally excluded unless a parent had clear packaged-supermarket relevance; the focus is supermarket shelves and barcoded packaged goods.
Maintenance	Refresh annually after each BBFAW release and review ownership changes for high-volume brands quarterly.