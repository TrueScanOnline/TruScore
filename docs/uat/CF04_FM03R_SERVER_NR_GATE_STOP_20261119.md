# CF-04 — Server-side FM-03R Claims-NR gate — STOP

**Date:** 2026-11-19  
**Branch:** `recovery/w5-functional-baseline-20261119`  
**Founder approval:** bounded server Claims-NR enforcement, with explicit stop if eligibility cannot be established securely  
**publicReleaseStatus:** BLOCKED

## Decision

**STOP — not implemented.**

## Precise dependency

`POST /api/evidence-authority` action `finalize-packet-absence-attestation` (and the subsequent attestation `submit`) currently:

1. Authenticates the contributor.
2. Finalises a canonical packet-absence attestation asset via `EvidenceAuthority.finalizePacketAbsenceAttestation`.
3. Does **not** load product assessment, run `publishClaimsPillar` / `settleCrossPillarPublication`, or otherwise derive Claims `publicationStatus`.

Client eligibility uses `claimsPacketAbsencePillarIneligibilityReason`, which requires a settled `CrossPillarPublicationSnapshot` with `claims.publicationStatus === 'nr'`, live S26 opportunity, packet Add eligibility, and contradiction checks (`src/lib/scoreHighlights/highlightContributionLinks.ts`).

`backend/vercel/` has **no** import path that rebuilds that publication projection from authoritative server state. Trusting a client-supplied Claims status would violate CF-04 (“Do not trust client-provided Claims status”).

## What would be required (not authorised as inventable here)

A founder-approved server path that, **before any asset write**:

1. Loads the same authoritative product/evidence context Result uses for Claims publication.
2. Projects Claims publication server-side (equivalent gates to `claimsPacketAbsencePillarIneligibilityReason`).
3. Rejects ineligible / stale / ambiguous requests with **no storage side effects**.
4. Preserves idempotency for already-admitted eligible attestations.

Until that coupling exists, implementing a proxy, soft heuristic, or client-flag gate is forbidden by this CF.

## Interim control (unchanged)

- Client solicitation remains the NR UX gate.
- Preselected-only policy continues to block photo / free-text pathways.
- Stage 5 does not claim CF-04 complete.

## Stage 6 note

Treat CF-04 as **BLOCKED** in the acceptance matrix until the dependency above is designed and approved.
