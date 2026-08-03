# W6 As-Built Walkthrough — Chaining & Signals + Signal Alert Commentary

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Modules:** W6 / Critical Output Integrity **#7** (Chaining & Signals) and **#10** (Signal Alert Commentary)  
**Authority:** MVP Launch Plan v0.4 §6 layered Signals status; Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Depends on:** W1 (dual identity), W0 (Result placement), W5 (Score Highlights ≠ this module)  
**Code baseline:** Phase 6 engine + Workstream C Skeleton path at handoff lineage  
**Status:** As-built facts only. Engine/Skeleton ≠ MVP Signals operating capability. **Not** launch certification.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose & controlling reminder

v0.4 requires founders and agents to describe Signals **by layer**. Broad labels such as “Signals built” or “Phase 6 complete” are too coarse.

**Controlling layered status (Cursor will keep using this):**

| Layer | Status |
|-------|--------|
| Architecture / Docs 1–6 | Established |
| Core engine + app integration | Substantially implemented and automatically tested |
| Workstream C Skeleton | Completed as controlled proof/UAT (not full AU/NZ corpus) |
| Founder/partner on-device UAT | Not evidenced — repeat controlled testing |
| AU/NZ source coverage & reviewed content | MVP work outstanding |
| Founder ops (approve / withdraw / expire / suppress) | MVP work outstanding — **absent in product surface** |
| Production persistence / governed runtime | Requires confirmation/hardening |
| Full MVP Signals capability | **Not launch-ready** |

Automated scraping and MyChoices Signals are **not** MVP requirements.

---

## 2. One-picture view (as-built)

```
Scan Product (OFF + merge)
        ↓
┌───────────────────────────┬────────────────────────────────────┐
│ Phase-6 identity          │ Workstream C retail chain          │
│ resolveSharedIdentity…    │ B#### / P#### (reviewed pack)      │
│ (soft ambiguity)          │ Hard fail-closed for C Signals     │
└───────────────────────────┴────────────────────────────────────┘
        ↓ (only if EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1)
C publication records (safety_regulatory / in_the_news)
        ↓
buildProductScanResult (default mode: transitional)
  + optional legacy/synthetic feeders
        ↓
signalRenderMapping → ProductScanResult.signals
        ↓
BannerAlertsCard  (“ALERT” — above TruScore)     ← module #7 UI

PARALLEL (#10 — not the same feed):
  Alerts tab preferences → generateInsights → InsightsCarousel
  (preference matches; does NOT summarise C Signal cards)

SEPARATE (#9):
  Score Highlights green/red lists (W5)
```

---

## 3. Module #7 — Chaining into Signals

### 3.1 Two identity systems (W1 cross-ref)

| System | IDs | Effect on Signals |
|--------|-----|-------------------|
| Phase 6 Slice 1 | Synthetic `brand:…` / `gtin:…` | Market + soft ambiguity on scan contract |
| Workstream C retail chain | Reviewed **B#### / P####** | **Hard gate** for Skeleton Signal attach |

No reviewed C chain → **no** Workstream C Signal cards (fail-closed).

### 3.2 Cadbury bridge

App-only helper: Cadbury B0067 + Mondelez P0009 + chocolate/cocoa/confectionery context → B0241 for curated NGO links.  
**Skeleton-UAT-only** — not production architecture; does not mutate closed A-data.

### 3.3 Workstream C Skeleton pack

| Artefact | Role |
|----------|------|
| `workstreamC/c-data/v0.4/input/*.csv` | Curated signals, subject links, sources, UX copy |
| `workstreamCRuntimePack.generated.ts` | Embedded runtime bundle |
| `buildWorkstreamCRuntimePublicationRecords` | Builds publishable records for the scan |

**Classes in pack:** `safety_regulatory`, `in_the_news` (only).  
**Gate:** build-time `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT === '1'`.  
**Evidence:** `source_record_url` when present → card links.  
**Editorial:** pack CSV state at build time — not a live founder console.

This is a **fixed curated proof**, not a live AU/NZ news/regulatory ingest corpus.

### 3.4 Publication → banner UI

| Step | File |
|------|------|
| Wire on Result | `app/result/[barcode].tsx` |
| Single builder | `src/services/buildProductScanResult.ts` |
| Mapping owner | `src/signals/signalRenderMapping.ts` |
| Presentation / dedupe | `src/utils/scanResultPresentation.ts` |
| UI | `src/components/BannerAlertsCard.tsx` |

**Default mode on live Result:** `phase6SignalSourceMode` **not passed** → defaults to **`transitional`**.

| Mode | Meaning |
|------|---------|
| `transitional` (default) | Governed/C records **plus** legacy/synthetic feeders |
| `governed_5b_only` | Only governed publication records (used in tests/gates; not default UI) |

**Typical mapping:**

| Signal class | UI role |
|--------------|---------|
| `safety_regulatory` | Class A — high severity ALERT |
| `in_the_news` | Class B — transparency / news style |
| Preference banners (legacy) | Class C — user preference |

Ordering is deterministic (class, then keys/ids). Presentation prefers pack `skeleton_card_copy` / UX CSV where present; otherwise record headline/summary.

### 3.5 Legacy / synthetic feeders still possible (transitional)

While the app stays in **transitional** mode, banners can also include:

- Preference-driven banner cards (from Alerts toggles)  
- Synthetic “limited data” / web-search transparency cards  

**As-built off the banner path:** product FDA-homepage style recalls as legacy result banners (tests assert Workstream C safety uses governed URLs instead). BBFAW/KTC are Ethics score surfaces, not banner Signals.

### 3.6 Skeleton UX copy

Pack UX rows cover only **some** signal IDs; others fall back to signal_records headline/summary/notes.  
Copy is intended to attribute third-party material — full neutrality review is still a founder/Claude task for MVP ops.

---

## 4. Module #10 — Signal Alert Commentary (as-built meaning)

**Important naming honesty:** In the live app, the surface that looks like “alert commentary” for **user preferences** is **`generateInsights` → InsightsCarousel**. It is **not** a neutral summariser of Workstream C Signal cards.

| Module #9 (W5) | Module #10 (this section) | Module #7 banners |
|----------------|---------------------------|-------------------|
| Score Highlights | Preference Insights | ProductScanResult.signals |
| Score drivers | Alerts-tab preferences vs product | Safety / news / synthetic / preference banners |
| Green/red lists | InsightsCarousel | BannerAlertsCard |

### 4.1 How #10 works today

**Files:** `src/lib/alertsInsights.ts`, `src/components/InsightsCarousel.tsx`, Alerts preferences store.

**Inputs:** `Product` + user toggles (geopolitical / ethical / environmental).  
**Does not read:** Workstream C publication records or `ProductScanResult.signals` copy.

**Copy character (as-built):** app-authored preference language and static brand/parent lists, with reference links (e.g. OFF, NGO sites) — **not** the FSANZ/MPI/news URLs from the Skeleton Signal pack.

**Integrity risk (factual):** Relative to v0.4’s “Signal Alert Commentary must summarise third-party material and avoid original Rveel allegations,” the **InsightsCarousel** path is closer to **preference matching commentary** than governed Signal summarisation. Preference content can also appear again as Class C banners via a **different** heuristic path — inconsistency possible.

Founders/ChatGPT should decide in the Integrity programme whether:

1. #10 means **neutral copy on Signal cards** (pack UX / future editorial), and Insights are renamed/scoped separately, or  
2. Insights are in-scope for #10 and must be rewritten under claim-governance rules.

Cursor will not redefine that product boundary here.

---

## 5. Admin lifecycle (as-built)

| Capability | Present in consumer app / Vercel admin product? |
|------------|--------------------------------------------------|
| Approve / withdraw / expire / suppress Signals | **No** |
| Pack CSV editorial_review_state | Yes (static at generate/build time) |
| `publicationStateEngine` transitions | Library/tests only — not founder console |

This matches v0.4: Cursor must **inventory** admin first; founders approve minimum operating approach later.

---

## 6. Tests (encouraging for engine; not MVP ops proof)

| Command / suite | Covers |
|-----------------|--------|
| `npm run test:workstreamC` | Runtime publish, chain, Cadbury bridge, recall-off banners |
| `npm run test:phase6:gate:public` | Golden fixtures, modes, order, market leak |
| `signalRenderMapping` / `buildProductScanResult` unit tests | Mapping ownership |
| `publicationStateEngine` tests | Engine FSM (not Skeleton UI) |

**Weak:** no suite that proves Insights copy is neutral relative to Signal records.

---

## 7. Gaps vs v0.4 MVP Signals (factual)

| Expectation | As-built |
|-------------|----------|
| Bounded real AU/NZ sources + reviewed content | Skeleton fixtures only |
| Neutral Signal commentary | Card UX partially pack-driven; Insights are preference-authored |
| Renewed on-device UAT | Required; historical acceptance not relied upon |
| Founder lifecycle controls | Absent |
| Production persistence | Embedded pack; transitional default |
| Governed-only public path | Available in code/tests; **not** default Result mode |

---

## 8. Practical Skeleton UAT reminder (not certification)

1. Confirm whether TestFlight build 26 baked `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1`.  
2. Use **real retail GTINs** only; identity gate before Signal pass/fail.  
3. Missing Signal cards with Nestlé-only brand (e.g. Milo case) = product-data variation class, not automatic engine failure.  
4. Skeleton pass ≠ MVP Signals operating capability.

---

## 9. What founders / ChatGPT should do with W6

| Action | Owner |
|--------|--------|
| Keep layered status language in all reporting | All agents |
| Decide #10 scope: Signal-card UX vs InsightsCarousel vs both | Founders + ChatGPT |
| Specify bounded AU/NZ source list + editorial process | Founders + ChatGPT |
| After Cursor admin inventory: Minimum Founder/Admin Requirements | Founders |
| Authorise governed-mode default only after explicit decision | Founders |
| Repeat physical UAT under controlled flag/build | Founders |

**Cursor will not** invent live ingest, admin consoles, or commentary policy from this note.

---

## 10. Suggested Claude questions

1. In `transitional` mode, which legacy/synthetic feeders can still reach BannerAlertsCard, and what is the smallest safe path to `governed_5b_only` for public MVP?  
2. Does InsightsCarousel create claim-governance risk by using original Rveel preference language alongside governed Signal cards?  
3. Are Cadbury bridge + brand-string sensitivity (Milo/Nestlé) acceptable Skeleton limitations or P1 integrity issues for supermarket UAT?  
4. What production persistence model is minimally required before “MVP Signals ops” can be claimed?

---

## 11. Code map

| Concern | Path |
|---------|------|
| Phase-6 identity | `src/identity/resolveSharedIdentityContext.ts` |
| C retail chain + Cadbury bridge | `src/workstreamC/skeleton/resolveWorkstreamCRetailChain.ts` |
| C runtime + flag | `src/workstreamC/runtime/workstreamCRuntimePublicationRecords.ts` |
| Pack | `workstreamC/c-data/v0.4/` |
| Builder | `src/services/buildProductScanResult.ts` |
| Mapping owner | `src/signals/signalRenderMapping.ts` |
| Banner UI | `src/components/BannerAlertsCard.tsx` |
| Legacy banners | `src/services/bannerAlertsService.ts` |
| #10 Insights | `src/lib/alertsInsights.ts`, `InsightsCarousel.tsx` |
| Engine FSM (library) | `src/dynamicSignals/publish/` |
| Result wire | `app/result/[barcode].tsx` |

---

## 12. Series status & next

| Walkthrough | Focus | Status |
|-------------|-------|--------|
| W0–W5 | Journey → Highlights | Done |
| **W6** | **Chaining & Signals + #10 commentary** | **Done (this doc)** |
| W7 (proposed) | Community contribution & verification (#13) |
| W8 (proposed) | Sharing (#11) |
| W9 (proposed) | Scan-result assembly (#14) |
| W10–W11 | Admin inventory; monitoring inventory |

---

*End of W6. No implementation changes were made for this demonstration.*
