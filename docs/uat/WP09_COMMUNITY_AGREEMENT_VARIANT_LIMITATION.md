# WP-09 Community Agreements — variant limitation

Evidence Authority `subjectKey` values do not include `variantKey`. Prevailing rows are selected per `(barcode, subject_key)`.

WP-09 therefore uses a **canonical empty** `variant_key` (`''`, `NOT NULL`) for all agreement identities.

- Client-supplied non-empty variant labels are rejected (`unsupported_variant`).
- WP-09 does not invent product-variant agreement partitions.
- If a future authoritative variant distinction is added to Evidence Authority, revisit this gate under a new change-control package.
