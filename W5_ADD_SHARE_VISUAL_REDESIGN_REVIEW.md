# W5-ADD-SHARE-01B — Additives Share visual redesign

**Status:** Local checkpoint authorised after founder / ChatGPT ACCEPT
**Baseline HEAD:** `8d7972e23e0718ea34881ee7942e596dba9b24a2`

Functional W5-ADD-SHARE-01 plumbing is preserved. Presentation lives inside the existing ShareModal / ShareProductStoryCard path.

---

## 1. Before / after comparison

| Aspect | Before (W5-ADD-SHARE-01) | After (01B) |
| --- | --- | --- |
| Modal title | “Share Product” | “Share Additives” / “Share Discovery” |
| Lead content | Large Rveel Score + four pillar tiles | Compact product header + additive discoveries |
| Additive layout | One continuous text block | Separate rounded card per additive |
| Hierarchy | Formal titles + dense lines | Code badge → name → discovery → source → qual |
| Long lists | Silent / mid-sentence feel | Up to 3 complete cards + dynamic remainder |
| Chips | Safety / recalls / concern | Curiosity-only for additives contexts |
| Link label | “Open in Rveel” | “Explore this product in Rveel” |
| Disclaimer | Repeated / mixed into blob | One card-level non-safety line |

Before / after capture artefacts live under `docs/uat/w5-add-share-visual-20261110/` (local UAT only; not committed).

---

## 2–4. Visual evidence

- Overview: Dairy Milk (2 cards), Favourites (3 + “12 more”), Indomie long-list
- Detail: Favourites Cochineal; Indomie TBHQ + CHEMICAL_SYNTHESIS qualification
- Export: same `ShareProductStoryCard` drives preview and `captureRef` (no parallel renderer)

Post-polish exports: `POLISH_DAIRY_MILK_SHARE_OVERVIEW.png`, `POLISH_INDOMIE_SHARE_DISCOVERY.png`

---

## 5. Files in this checkpoint

- `src/components/ShareProductStoryCard.tsx` — additives composition; score/pillars suppressed when `additiveShare` is set
- `src/components/ShareModal.tsx` — contextual header + curiosity chips; tips suppressed for additives contexts
- `src/features/sharing/additivesShareContent.ts` — payload / message builders
- `src/components/AboutTheseAdditivesModal.tsx`, `app/result/[barcode].tsx` — share entry points
- `src/features/sharing/{index,types,services/ShareContentBuilder}.ts`, `sharePathSummary.ts`, `shareStoryHeading.ts`
- i18n en/es/fr share-modal strings
- `src/__tests__/unit/features/sharing/additivesShareContent.test.ts`

**Not modified:** governed catalogue, CORE-22 ordering logic, scoring, publication, detection, Evidence Authority, BODY6, `backend/vercel/**`.

---

## 6. Test results

```text
npx jest src/__tests__/unit/features/sharing/ --no-coverage
→ 3 suites / 21 tests PASS

npx tsc --noEmit
→ exit 0
```

---

## 7. Android UAT

Emulator Expo Go: Dairy Milk, Favourites, Indomie — overview + detail + export + cancel verified.

---

## 8. iOS status

**Not visually checked on iOS TestFlight.** Outstanding before release.

---

## 9. Invariant verification

| Invariant | Result |
| --- | --- |
| No catalogue / CORE-22 reorder edits | Pass |
| No scoring / publication / detection changes | Pass |
| No Evidence Authority / BODY6 / backend/vercel edits | Pass |
| Ordinary product Score share unchanged | Pass |
| No safety / toxicity ranking UI | Pass |
| Bounded polish (tips / subheading / barcode) | Pass |

---

## 10. Recommendation

**ACCEPT** — local checkpoint of approved Additives Share implementation + polish.

**NO PUSH. NO MERGE. NO PR. NO EAS. NO OTA. NO RELEASE.**
