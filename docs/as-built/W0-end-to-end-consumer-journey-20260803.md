# W0 As-Built Walkthrough — End-to-End Consumer Journey

**Document type:** Critical Output Integrity as-built demonstration (plain language)  
**Module:** W0 — Scan → Result → Explore → Contribute / Share (+ shell tabs)  
**Authority:** MVP Launch Plan v0.4 §4 (demonstrate before remediation); Cursor acceptance `docs/cursor-acceptance-mvp-v0.4-20260803.md`  
**Code baseline:** `0e91226` / tag `v10.18.0-handoff-phase6-workstreamC-2026-07-30` for product behaviour; this note authored on `main` after docs-only commits  
**Status:** As-built facts only. **Not** product acceptance. **Not** authority to change Confidence, Origins, Admin, or other §12-spec areas.

**Date:** 3 August 2026  
**Author:** Cursor (implementation agent)

---

## 1. Purpose of this walkthrough

Founders and ChatGPT asked Cursor to demonstrate the **current** consumer journey in plain language before specifying polish or remediation.

W0 answers:

- What happens when a user scans (or types) a real barcode?
- What do they see if the product is found vs missing/thin?
- How do they explore, share, and contribute — and can they skip?
- What else in the tab shell can confuse an MVP user (paywall, allergens, Alerts)?
- How do empty, error, and offline paths behave today?

**Evidence this note is based on:** code inspection of the live app routes and services listed in §8. Device screenshots from TestFlight build 26 / Android APK can be attached by founders during UAT; they are not required for this first as-built text.

---

## 2. Journey in one picture

```
Onboarding (first launch)
        ↓
App tabs: Scan | Search | History | Favourites | Alerts | Settings
        ↓
Scan (camera or manual GTIN 8–14 digits)
        ↓
Result screen
   ├─ Found / usable product → explore cards → share / contribute (optional)
   └─ Unknown / missing / too-thin → contribute CTAs or “Scan another” (skippable)
```

**Primary path for MVP UAT:** Scan (or History/Search) → Result → explore TruScore / Signals / Origins-related CoM → optional share or contribute → Scan another.

---

## 3. Step-by-step as-built behaviour

### 3.1 First launch / shell

| What exists | Behaviour today |
|-------------|-----------------|
| Onboarding | Shown until completed; then tab shell |
| Tabs | **Scan, Search, History, Favourites, Alerts, Settings** (`src/navigation/AppTabs.tsx`) |
| Settings | Implemented as **Profile** (`app/profile.tsx`) — includes Upgrade to Premium, restore purchases, clear history, etc. |

**Founder note (fact):** The shell is broader than “scan → result → share/contribute.” Search, Favourites, Alerts preferences, and Subscription upgrade are all reachable on current builds.

---

### 3.2 Scan (camera or keypad)

**Screen:** `app/index.tsx`

| User action | What the app does |
|-------------|-------------------|
| Opens Scan tab | Requests camera permission if needed; shows live camera when granted |
| Permission denied | Full-screen prompt to grant camera; can open Settings |
| Camera mount failure | Alert (Retry / Settings / Cancel) + on-screen retry |
| Points at EAN-13 / EAN-8 / UPC barcode | Validates `8–14` digits; adds row to local history; navigates to Result |
| Scans QR / DataMatrix | Only proceeds if a GTIN (`8–14` digits) can be extracted; otherwise Alert |
| Invalid / empty read | Alert; camera ready to scan again |
| Taps keypad | Modal for manual barcode; same `8–14` digit rule; then history + Result |
| Offline | Orange/red banner on scan chrome (“no connection” / offline messaging) |

**Can the user continue without contributing?** Yes — scan only navigates to Result; no contribution is required at scan time.

---

### 3.3 Result — loading and product resolution

**Screen:** `app/result/[barcode].tsx`  
**Primary fetch:** `fetchProductOptimized` (`src/services/productServiceOptimized.ts`)  
**Scan assembly:** `buildProductScanResult` (+ identity / Workstream C when applicable)

| Situation | What the user sees / what happens |
|-----------|-----------------------------------|
| Valid barcode, sources hit | Loading spinner with progressive phase messages; then product UI as data arrives |
| Manual product already saved for barcode | Short-circuit to that manual record first |
| All sources miss / null product | **Unknown Product** page: barcode shown; CTAs to add information, open Open Food Facts website, or scan another |
| Fetch throws | Fallback fetch / cache / optional minimal product; may still land on unknown heuristics |
| Invalid barcode format on Result | Error + not-found style handling |
| Pull to refresh | Re-fetches product |

**Dismiss / continue without contributing:** Always available via **Scan Another Product** (returns to Scan home). Contribution modals can be closed without saving.

---

### 3.4 Result — explore (when a usable product is shown)

Approximate on-screen order today (top → bottom):

1. Legal disclaimer card  
2. Product hero (image, name, brand; take photo)  
3. **Banner Signals / alerts** (`BannerAlertsCard`) when scan-result signals exist — includes Workstream C Skeleton path when build flag enables it  
4. Partial-analysis banner when terminal state is partial  
5. **TruScore** + Body / Planet / Ethics / Open bars, confidence badge, score highlights; “How was this scored?”  
6. Insufficient-data card if no TruScore  
7. Preference **Insights** carousel (if Alerts-tab toggles enabled)  
8. Nutrition table (tap may open edit)  
9. **Country of Manufacture** (current Origins-related surface) + contribute/update CTA  
10. Eco-Score (when shown)  
11. Palm oil **product card** — **hidden** in UI (`PALM_OIL_PRODUCT_CARD_VISIBLE = false`); palm analysis may still affect scoring/insights  
12. Packaging  
13. Carbon footprint (conditional)  
14. Certifications  
15. Pricing card  
16. Ingredients + processing / NOVA  
17. **Allergens & Additives** section — **still present in code and UI**  
18. Additives risk card (if data)  
19. Data limitations card  
20. Scan another (footer)

Share icons appear on several cards (TruScore, nutrition, CoM, ingredients, etc.).

---

### 3.5 Share

| Item | As-built |
|------|----------|
| How | Tap share on a card → `ShareModal` |
| What | Platform share sheet, copy link, optional story/image capture |
| Link shape | Web/deep style `truescan.app` / `truescan://` barcode URLs with optional context params |
| Key files | `src/components/ShareModal.tsx`, `src/features/sharing/`, `src/utils/shareUrl.ts` |

**Integrity note for later modules:** Whether shared text retains confidence / source qualifications is **W8 / module #11** — not certified here.

---

### 3.6 Contribute (all skippable)

| Entry point | Opens | Skip? |
|-------------|-------|-------|
| Unknown product — Add Product Information | `ManualProductEntryModal` | Yes |
| Unknown product — Open Food Facts website | External OFF edit/view | Yes |
| Hero — take photo | Camera capture → photo upload | Yes (close) |
| Empty nutrition / ingredients / certs CTAs | Manual product edit modal | Yes |
| Country of Manufacture missing / update | `ManufacturingCountryModal` | Yes |

**Verification today (preview only):** Manufacturing-country contributions have verified/disputed/threshold concepts in `manufacturingCountryService`. This is **not** the full Community Verification Spec model across all fields (v0.4 §12 still required before expansion).

---

### 3.7 Past Scans (History)

**Screen:** `app/history.tsx` · store: `src/store/useScanStore.ts`

| Behaviour | Fact |
|-----------|------|
| Storage | Local device (AsyncStorage), max **100**, dedupe by barcode |
| Open | Tap row → Result for that barcode |
| Delete | **Clear all** only (confirm); no per-item delete |
| Cloud sync | Not implemented (matches v0.4 deferral) |

---

### 3.8 Other tabs that affect the journey

| Tab / surface | As-built risk for MVP clarity |
|---------------|-------------------------------|
| **Search** | Full search UI; paywall/teaser components still wired (`app/search.tsx`) even though `ENABLE_PREMIUM_GATING = false` |
| **Favourites** | Save/open products → Result |
| **Alerts** | User toggles for geopolitical / ethical / environmental preferences → drive **Insights** on Result — separate from Banner Signals |
| **Settings / Profile** | **Upgrade to Premium**, restore purchases, clear history/favorites/cache; some Account/Help items are placeholder Alerts |
| **Subscription** | Qonversion purchase UI (`app/subscription.tsx`) |

**Paywall park (v0.4):** Feature gating flag is already **off**, but upgrade/subscription **UI is still reachable**. Hiding/disabling those surfaces is a recommended early authorised task (not done in this W0 note).

---

## 4. Empty / error / offline matrix

| Condition | As-built handling |
|-----------|-------------------|
| Camera denied | Permission UI / Settings |
| Camera mount error | Alert + retry |
| Invalid barcode on Scan | Alert; stay on Scan |
| Product not in databases | Unknown Product + skippable contribute CTAs |
| Thin / heuristic “unknown” page | Complex heuristics may treat minimal records as unknown |
| Network error mid-fetch | Fallbacks; may still show unknown or thin product |
| Offline banner on Scan | Shown; premium “offline mode” feature marked not implemented |
| Offline fetch | `isOffline` passed into result/assembly; optimized fetch does **not** clearly short-circuit to cache-only — network may still be attempted |
| Empty History | Empty state + CTA to Scan |

---

## 5. Layered Signals reminder (for this journey)

When founders test **Signal cards** on Result:

- Engine + Skeleton pathway can show Banner Signals when the **build-time** flag `EXPO_PUBLIC_WORKSTREAMC_SKELETON_UAT=1` was baked into that binary.
- TestFlight **build 26** is the physical-UAT baseline; flag state for that binary must be confirmed before treating missing Signal cards as an engine failure.
- Skeleton proof ≠ full AU/NZ MVP Signals operating capability (v0.4 §6).

---

## 6. Factual gaps vs a polished MVP journey (not a fix list)

These are **observations for founders/ChatGPT**, not Cursor self-authorised work:

1. **Allergens & Additives UI still live** on Result despite v0.4 removing Allergens & Dietary Needs from MVP.  
2. **Six-tab shell + Subscription upgrade** broader than the core MVP promise path.  
3. **Paywall/premium UI still reachable** while gating flag is off.  
4. **Offline** messaging exists; true offline-first behaviour is incomplete.  
5. **History** has no single-item delete.  
6. **Palm oil** hidden as a product card but still in scoring/insights — explore surface uneven.  
7. **Unknown vs thin product** heuristics can blur “not found” vs “sparse record.”  
8. **Settings** still has placeholder “coming soon” style items.  
9. Result screen remains a **large monolith** (`app/result/[barcode].tsx` ~136KB) — known debt; not automatically P0/P1.

---

## 7. Code map (evidence anchors)

| Area | Primary files |
|------|----------------|
| Scan | `app/index.tsx` |
| Result | `app/result/[barcode].tsx` |
| Tabs | `src/navigation/AppTabs.tsx` |
| Fetch | `src/services/productServiceOptimized.ts`, `src/services/productService.ts` |
| Scan assembly | `src/services/buildProductScanResult.ts` |
| Share | `src/components/ShareModal.tsx`, `src/features/sharing/` |
| Manual / photo / CoM | `ManualProductEntryModal`, `photoUploadService`, `manufacturingCountryService` |
| History | `app/history.tsx`, `src/store/useScanStore.ts` |
| Premium flag | `src/utils/premiumFeatures.ts` (`ENABLE_PREMIUM_GATING`) |
| Search / Profile / Subscription | `app/search.tsx`, `app/profile.tsx`, `app/subscription.tsx` |
| Alerts preferences | `app/alerts.tsx` |

---

## 8. What founders should do with W0

| Action | Owner |
|--------|--------|
| Confirm this matches the experience on TestFlight build 26 (AU) and Android (NZ), or note divergences | Founders (physical devices) |
| Confirm whether allergen section should be **hidden for MVP** as part of paywall/deferred isolation | Founders + ChatGPT |
| Confirm whether early **paywall UI park** task is authorised now | Founders |
| Attach screenshots to this note’s evidence folder when UAT runs (optional) | Founders |
| Do **not** treat W0 as approval of TruScore, Confidence, Signals ops, or Origins product rules | All |

---

## 9. Next as-built walkthrough (proposed)

Unless founders reorder:

| ID | Focus |
|----|--------|
| **W1** | Product identity & data-source retrieval/merging (module #12) |
| **W2** | Body / Planet / Ethics / Open / Overall TruScore (modules #1–5) |
| **W3** | Confidence as currently implemented (module #8) — demo only; build not accepted |

---

## 10. Cursor checklist status (from v0.4 §14, W0 slice)

| Checklist item | W0 status |
|----------------|-----------|
| Plain-language as-built for end-to-end journey | **Done (this document)** |
| Admin / monitoring inventory | Not in W0 — scheduled W10–W11 |
| 14 Critical Output modules | W0 covers journey shell only; modules #1–14 continue in W1+ |

---

*End of W0. No implementation changes were made for this demonstration.*
