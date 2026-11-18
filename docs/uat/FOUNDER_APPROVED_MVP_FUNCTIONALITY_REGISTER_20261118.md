# Founder-Approved MVP Functionality Register — 2026-11-18 corrective

**Authority:** Founder corrective directive — Full Historical Development Reconciliation  
**Branch:** `build/w5-founders-native-20261114`  
**Public release:** **BLOCKED**  
**Method:** Git/docs/ChatGPT share forensic audit → controlled corrective (not blanket rollback).

**External shares:**
- [Contribution containment review](https://chatgpt.com/s/cx_6afd1bf789ec81918a1efbdadc4742e9) — independent FAIL of ops at `47ba9cc` / impl `956886b`; affirms default-deny preselected-only.
- [Publish source / builds](https://chatgpt.com/s/cx_6afd1c07ef488191a9f3611368b098e5) — earlier guided UAT builds; **superseded for input policy** by 17 Nov + this corrective.

**Rejected tip for product baseline:** free-form restore `b752fdf` / acceptance docs through `581fbb3`.

---

## Latest valid founder decisions

| Date | Decision | Impl SHA | Controlling? |
|------|----------|----------|--------------|
| 15 Nov 2026 | FM-01/02/03/03R (FM-03R Claims NR → admit → assessed-neutral **15/25** when methodology permits) | `7e1f59c` (+ related) | Yes for FM-03R |
| 17 Nov 2026 | Packet card exposes FM-03R when eligible | `c346551` | Yes |
| 17 Nov 2026 | Claims / Packet absence presentation consistency | `82ad946` | Yes |
| **17 Nov 2026** | **MVP preselected-only** (default-deny photos/free text/VLM; keep FM-03R + WP09 agree) | **`956886b`** | **Yes — reaffirmed** |
| 18 Nov 2026 | Cursor free-form “restore” (opt-in policy inactive) | `b752fdf` | **REJECTED** |
| **18 Nov 2026** | **This corrective:** reaffirm preselected-only; FM-03R when eligible; no Camera/Gallery/free-form | *(corrective SHA below)* | **Controlling** |

---

## Feature reconciliation (Phase A → corrective)

| Feature | Latest decision | Impl / good SHA | Pre-corrective (`581fbb3`) | Cause | Doctrine | Corrective |
|---------|-----------------|-----------------|----------------------------|-------|----------|------------|
| Preselected-only | 17 Nov + this directive default-deny | `956886b` | Inactive opt-in | `b752fdf` | RED containment | Restored `!== '0'` client/server |
| Camera / Gallery / free-text | Excluded from MVP | `956886b` | Reappeared | Restore | RED | Hidden via policy + gates |
| FM-03 photo absence | Retired for MVP | `956886b` | Re-exposed CTA | Restore | AMBER | CTA removed; `packet_absence` open blocked |
| **FM-03R** label | Keep when Claims **NR** eligible | `7e1f59c`, `c346551` | Hidden on Barker (**Rated** — correct) | Eligibility, not deletion | GREEN keep | Choice sheet still wires `result-packet-fm03r-absence` |
| Claims NR → 15/25 | Methodology assessed-neutral; no UI hardcode | EA + `packetAbsenceUserAttestation` | Unit PASS | — | GREEN verify | Unit re-PASS (score 15, limited, rated) |
| Server Claims-NR for FM-03R | Resolve via change control | **Never shipped** | Still client-only | Gap | **AMBER/RED — STOP** | See § Server Claims-NR; not invented here |
| Origins / Ingredients / Nutrition free-form | Contained | `956886b` | Exposed when guided | Restore | AMBER | Contained again |
| Add/Change/Remove free-form menus | Empty under policy | gates | Re-enabled | Restore | AMBER | Empty under policy (tests assert) |
| Preselected catalogues | Deferred — do not invent | — | Unavailable | Never implemented | Deferred | Unresolved capability |
| VLM/OCR | Abstain | `956886b` | Allowed when inactive | Restore | RED | Force abstain under policy |
| EA admission / scoring / Confidence | Protect | — | Intact | — | Protect | Unchanged |
| WP09 Agree | Keep when entitled | gates | Keep | — | GREEN | Keep (`COMMUNITY_AGREEMENTS=1` UAT) |
| WP09 Correct / Discovery free-text | Block under policy | `956886b` | Re-opened | Restore | AMBER | Contained |
| Store guided | Fail-closed OFF | eas prod | OFF | — | GREEN | Founders GUIDED=0 again |

### Uncertainty (not invented as approval)

- Exact founder wording of 18 Nov “restore previously implemented functionality” conflicted with 17 Nov preselected-only; **this corrective resolves for preselected-only**.
- FM-03R on **Rated** Claims products: **not** required; Barker Rated correctly hides FM-03R.
- Full server `publicationStatus === 'nr'` gate couples EA to publication → **AMBER/RED**; see below.

---

## Phase B–D corrective status

| Item | Status |
|------|--------|
| Client default-deny `EXPO_PUBLIC_MVP_PRESELECTED_ONLY !== '0'` | Done |
| Server default-deny `RVEEL_MVP_PRESELECTED_ONLY !== '0'` | Done |
| FM-03 photo CTA retired; FM-03R CTA retained | Done |
| `.env.development` / founders EAS GUIDED=0; PRESELECTED default-deny | Done |
| Regression tests (policy, FM-03R, menus empty, 15/25 pathway) | **57 PASS** in targeted suite |
| UAT backend redeploy + policy 403 probes | **PASS** — `dpl_4PtMCMM8Mk3EDtvZK6T5jpGS2V2g` aliased to `truscoreapi-uat`; photo/manual/EA image/manual-text → **403** `mvp_preselected_only_v1_20261118` |
| Android clean-bundle visual | Pending independent acceptance (not completed this tip) |
| iOS TestFlight visual | Pending / not run this tip |

**Policy version:** `mvp_preselected_only_v1_20261118` (default-deny activation; supersedes rejected opt-in reading of same date stamp).

---

## Phase C — Claims pathway + server NR

### Verified (unit / source)

1. Consumer choice FM-03R → `submitClaimsAbsenceAttestation` → `finalize-packet-absence-attestation` → submit attestation fact → EA admit.
2. `calculateEthicsPillar` + `publishClaimsPillar` yield **publicationStatus rated**, **publishedScore 15**, **confidence limited** for admitted packet absence with no other adjustments (`packetAbsenceUserAttestation.test.ts`).
3. UI does **not** hardcode 15/25 or force Rated from the button alone.
4. Ineligible cases: Claims Rated, published score present, packet lane assessed, contradiction, absence already admitted — client gate rejects.

### Server Claims-NR enforcement — AMBER/RED STOP

**Proposed change:** reject `finalize-packet-absence-attestation` unless Claims `publicationStatus === 'nr'` (and related client gates) using the same publication projection as Result.

**Why not implemented in this corrective:** wiring EA admission to live publication scoring changes governed admission fail-closed behaviour (Doctrine §10 / RED zone risk). Prior legal gate already recorded this as a separate founder decision. Implementing without explicit founder approval of that coupling would invent a RED change.

**Smallest next step after founder approval:** fail-closed helper in `backend/vercel/api/evidence-authority.ts` before `finalizePacketAbsenceAttestation`, with regression tests for NR allow / Rated reject, without changing Claims arithmetic.

Until then: **client solicitation remains the NR gate**; server still admits attestation assets when policy allows FM-03R writes.

---

## Acceptance buckets

### Restored and independently verified (automated)

- Preselected-only default-deny (client + server modules + tests)
- FM-03R wording + Result wire-up (photo-free)
- FM-03 photo CTA absent from Result
- Free-form menus empty under policy
- Claims assessed-neutral **15/25** pathway (unit)

### Present in code but not operationally verified this tip

- Live UAT 403 probes after redeploy *(pending deploy stamp)*
- FM-03R on a live Claims-NR GTIN (Barker is Rated — wrong fixture for UI presence)
- Android / iOS device visual matrix

### Missing or regressed (pre-corrective; addressed in source)

- Camera/Gallery/free-form exposure — **corrected in source**
- Rejected restore acceptance — superseded

### Approved but never implemented / deferred

- Governed catalogue-only Origins / Claims / certification consumer submission
- Server Claims-NR publication gate (awaiting founder approval of AMBER/RED)

### Intentionally deferred

- Post-MVP FM-03 photo reactivation
- Expanding FM-03R to Claims Rated

### Blocked by governance / legal

- `publicReleaseStatus: BLOCKED`
- Store shipping of guided contribution / WP09

---

## Provenance

| Role | SHA / id |
|------|----------|
| Containment (valid) | `956886b7eb60f87de75c82082f0e43ee8a4efbb9` |
| Rejected restore | `b752fdf567a9ff7e36e6b24f1d5e45d1bb35fd23` |
| Corrective implementation | `e36ed7aa05c31abaea88516bac514a8d690b546b` |
| Docs stamp tip | `44ea09e` (+ deploy evidence stamp below) |
| UAT deploy | `dpl_4PtMCMM8Mk3EDtvZK6T5jpGS2V2g` → `https://truscoreapi-uat.vercel.app` |

**STOP for independent acceptance review. Do not declare restoration complete solely because buttons are visible.**
