# Phase 1 close-out: engineering vs release

## Judgment split (authoritative framing)

| Track | Status | Meaning |
|--------|--------|---------|
| **Phase 1 engineering** | Recommended for sign-off with minor follow-up | Rename foundation, identity layer, exhaustive inventory generator, legal routes in-repo, support email wiring, compile/share checks — structurally sound. |
| **Release / store-facing** | Not ready until items below are done | Live legal pages, populated support email in build envs, store assets/copy, UI spot-checks, operational UA verification. |

Phase 2 claim governance can start once engineering sign-off is accepted; **do not** block Phase 2 on an empty support inbox alone — treat that as release operations.

---

## Sign-off table (close the loop)

Fill **owner**, **status**, **evidence**, and **completed date** as each row is finished. Empty cells mean not done yet.

| item | owner | status | evidence | completed date |
|------|-------|--------|----------|----------------|
| Live Terms/Privacy pages show Rveel on the host users open from the app | | | URL + screenshot or written confirmation of host/stack | |
| `EXPO_PUBLIC_SUPPORT_EMAIL` set in EAS / production build envs | | | EAS env screenshot or redacted config reference | |
| Store listing copy (title, subtitle, description) — no legacy public names | | | Store Console screenshot or export | |
| **Store screenshots, preview video, and promotional / feature graphic text** — no legacy names or wordmarks | | | Asset filenames + store preview screenshots | |
| App icon / adaptive icon / splash — no legacy wordmarks where applicable | | | Design sign-off or asset review link | |
| **EN** UI spot-check: onboarding, result, modals, alerts, share, subscription/paywall, legal links | | | Short test note or checklist tick | |
| **FR** UI spot-check: same critical paths | | | Short test note or checklist tick | |
| **ES** UI spot-check: same critical paths | | | Short test note or checklist tick | |
| User-Agent / provider ops confirmation (allowlists, logs, vendor docs) | | | Ticket ID or operator sign-off | |
| Triage `name-readiness-audit-full.csv` (public-risk / Layer B / docs / backlog) | | | Spreadsheet or doc with triage column | |

---

## Required before **release-facing** closure

1. **Live legal pages** — In a real browser, on the **same host** users get from the app (`productIdentity` URLs), confirm Terms and Privacy show **Rveel** branding (title, headings, body). If `truescan.app` is not served by this repo’s Vercel project, update that stack or route until this is true.
2. **`EXPO_PUBLIC_SUPPORT_EMAIL`** — Set in EAS / CI / local env used for store builds; confirm `productIdentity.supportEmail` resolves in a production build.
3. **Store surfaces** — App Store Connect / Play Console: **listing copy** (title, subtitle, description, keywords) with no legacy public product names.
4. **Store media** — **Screenshots, app preview / promo video on-screen text, feature graphic / promo asset text, and any “what’s new” imagery** — these surfaces often keep old names after listing copy is fixed; verify explicitly.
5. **Icons / wordmarks** — Adaptive icon, store icon, splash (if it shows a wordmark): no legacy public branding where users would see it.
6. **UI spot-check (EN, FR, ES)** — Same pass in each language, focused on:
   - **Onboarding** (including legal acceptance if shown)
   - **Result screen** (score labels, cards, disclaimers)
   - **Modals** (methodology, score info, premium gates)
   - **Alerts** (destructive confirms, errors, success toasts where product name appears)
   - **Share flow** (preview text, system sheet, copied strings)
   - **Subscription / paywall** (feature bullets, restore, terms links)
   - **Legal links** (Terms, Privacy open correct URLs; page branding matches Rveel)

---

## Required before **clean Phase 1 archival** (inventory hygiene)

1. **Triage** `docs/phase1/name-readiness-audit-full.csv` (regenerate with `npm run audit:phase1-names` after large edits). For each cluster of hits, mark intent:
   - **public-risk** — fix or track as release blocker  
   - **Layer B** — intentional legacy (see `stable-technical-identifiers.md`)  
   - **docs-comment-log** — no user-visible change required  
   - **backlog** — optional future migration  
2. **User-Agent / provider ops** — Document any backend allowlists, vendor dashboards, or log filters that still expect old `TrueScan-*` UA patterns; confirm or update with operators.

---

## Phase 2

Engineering foundation for Phase 1 is **accepted**; remaining rows in the sign-off table are **release or archival operations** — track them here, do not widen Phase 1 code scope.

Claim governance lives under `docs/phase2/` and `src/claims/`. See [`docs/phase2/README.md`](../phase2/README.md).
