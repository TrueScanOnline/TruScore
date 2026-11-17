# Proposed native Share Card OFF attribution correction

**Status:** Prepared for founder / counsel review — **not implemented in closeout code**  
**Date:** 17 November 2026  
**Doctrine:** Presentation-only; does **not** change scoring, Rateability, Confidence, EA or Signals.

## Why this is a public-release dependency

- Open Food Facts product photographs are commonly licensed **CC BY-SA**.
- Web share preview HTML already may render: product photograph attribution to Open Food Facts (CC BY-SA) + database ODbL when an image is present (`backend/vercel/lib/shareLandingHtml.ts`).
- Native `ShareProductStoryCard` can display `product.image_url` with **no** on-card attribution line today.
- Account Legal disclosure of this gap **does not** cure CC BY-SA / related reuse obligations.

## Exact proposed technical change (for approval)

**File:** `src/components/ShareProductStoryCard.tsx`  
**Scope:** When `showImage` is true, render a small footer attribution line under the image (and the equivalent additives-card image path if an OFF image is shown), for example:

> Product photograph may include Open Food Facts material (CC BY-SA). Database: ODbL.

**Constraints for a future GREEN implementation:**

1. Do not claim every image is independently verified by RVEEL.
2. Prefer conditional wording until image provenance is reliably classified (OFF vs private EA vs other).
3. Do not alter score chrome, pillar values, publication semantics or share score fail-closed behaviour.
4. Mirror web preview wording where accurate; keep share-alike / trademark questions for counsel.
5. Add a focused unit/contract test that the attribution string appears iff an image is shown.

## Why not implemented in this closeout

Image provenance on `product.image_url` is not yet a verified exclusive OFF classifier in the Share Card path. Shipping a definitive “this is an OFF photo” line without that classifier could itself be misleading. Counsel should confirm acceptable conditional wording before code lands.

## Related register

Update `MVP_PUBLIC_LAUNCH_GATE.json` requirement `off_database_and_image_reuse` nonbinding engineering note only; status remains **PENDING**.
