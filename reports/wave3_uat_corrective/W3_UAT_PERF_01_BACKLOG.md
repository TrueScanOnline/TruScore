# W3-UAT-PERF-01 — Result hero image cold-load latency

**Status:** OPEN — Technical Backlog (MVP production-hardening)

**Baseline diagnosis (cfe133c):** Not a Wave 3 Nutrition/Claims/S25 regression. Same hero path as pre-Wave-3 baseline. Latency associated with full-size OFF preference, no early prefetch, hide-until-load.

**Interim mitigation in this corrective package (does not close the ticket):**
- Prefer `image_front_small_url` for Result hero when available
- Prefetch selected hero URL as soon as product exposes it
- Preserve fallbacks; do not block identity/scores/Result render

**Still required for closure:** dedicated production-hardening (CDN/cache architecture, broader retrieval, measured SLA) — out of scope for this UAT corrective pass.
