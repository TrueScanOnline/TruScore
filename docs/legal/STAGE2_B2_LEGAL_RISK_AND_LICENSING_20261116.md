# RVEEL Stage 2 Phase B2 — Legal risk, licensing and operational readiness

**Status:** Documentation and drafting only. **Not legal advice.**  
**Date:** 16 November 2026  
**Repository:** `TrueScanOnline/TruScore`  
**Branch:** `build/w5-founders-native-20261114`  
**Verified starting SHA:** `cbf339474c52d6fdfa6788ed5f07c73fc938277b` (local = `origin`)  
**Account Stage 1 / Phase B1 methodology copy:** Prior founder-accepted workstreams remain closed for behaviour; this pack does not reopen them.  
**Phase B2 scope:** Evidence audit, licensing matrix, draft Privacy/Terms companion docs, operational recommendations. **No application or backend behaviour change. No publication of Privacy/Terms. `legalDestinations.*.ready` remains false.**

**Evidence legend**

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Verified in current source / config / prior Stage 2 docs |
| **INTERPRETATION** | Legal or licensing reading that counsel must confirm |
| **UNRESOLVED** | Fact or decision missing; founder and/or counsel required |

---

## 1. Executive summary

RVEEL independently assesses identifiable food products and publishes comparative scores, pillar explanations, Signals and shareable previews. That product shape can attract manufacturer and consumer complaints even where engineering fail-closed publication and disclaimers exist.

**Overriding commercial priority reflected in this pack:** minimise exposure from inaccurate assessments, misleading statements, disputed facts, third-party data misuse and manufacturer complaints — without assuming that “educational”, “technology” or “opinion” labels alone defeat liability (**INTERPRETATION** — counsel).

**Highest residual launch blockers (engineering + legal):**

1. Open Food Facts ODbL / DbCL / CC BY-SA compliance for commercial NZ/AU reuse (Share Cards, teasers, cache).  
2. Incomplete public Privacy Policy / Terms (configured URLs not ready).  
3. Onboarding “Skip intro” bypass of legal acknowledgement.  
4. Manufacturer correction / dispute process not operationally defined or published.  
5. Bundled BBFAW / KnowTheChain reuse terms incompletely cleared for scoring display.

**Application behaviour under this instruction:** unchanged.

---

## 2. Manufacturer liability and assessment risk

*Do not treat this section as a determination that any claim would succeed. It maps exposure pathways for counsel.*

### 2.1 Defamation / business reputation (**INTERPRETATION**)

| | |
|---|---|
| **Feature creating exposure** | Published Claims/Ethics outcomes, Highlights/L3 text naming companies (BBFAW/KTC), packaging-claim assessments, share cards and web teasers tied to an identifiable GTIN/brand. |
| **Current safeguards** | Governed methodology; publication latch (no Rated number while Checking / Overall NR); Evidence Authority admission for contributor facts; Result disclaimer / data-limitation cards; methodology copy revised in B1 to reduce absolute claims (**CONFIRMED** — Stage 2 B1 evidence). |
| **Remaining vulnerability** | Comparative score + company-named welfare/labour benchmarks can still be read as reputational criticism of a named trader. Wrong barcode identity amplifies harm. |
| **Recommended operational protection** | Documented correction SLA; rapid identity verification; preserve assessment provenance; counsel-reviewed wording for L3 company narratives; avoid unverified dispute narratives in public replies. |
| **Counsel required?** | **Yes** — NZ/AU defamation and related reputation torts for product-rating apps. |

### 2.2 Injurious falsehood / commercial disparagement (**INTERPRETATION**)

| | |
|---|---|
| **Feature** | Statements that a product “scores poorly”, lacks certifications, or fails Claims benchmarks; share republication. |
| **Safeguards** | Fail-closed presentation; score bands framed as methodology outcomes (B1 closeout); Signals separated from Score in consumer copy. |
| **Vulnerability** | Factual assertions about certifications, Nutri/Eco/NOVA, or manufacturer practices that prove false for that GTIN. |
| **Protection** | Substantiation file per published assertion class; manufacturer portal/email for contested facts; temporary suppression workflow (recommend only — **not implemented**). |
| **Counsel?** | **Yes**. |

### 2.3 Misleading or unsubstantiated consumer representations (**INTERPRETATION** — NZ Fair Trading Act / Australian Consumer Law)

| | |
|---|---|
| **Feature** | Marketing, store listings, Result labels, Confidence badge, Highlights, methodology modal, share captions. |
| **Safeguards** | Publication contracts; INV-SC-7/8 consumption guards; B1 methodology accuracy corrections; in-app disclaimers. |
| **Vulnerability** | Historical absolute claims (largely corrected in B1); residual educational NOVA/health language; users treating Confidence as accuracy probability; Skip-bypass users never seeing legal text. |
| **Protection** | Counsel review of store listing + first-run legal step; close Skip bypass; keep methodology copy locked to engines. |
| **Counsel?** | **Yes** for ACL/FTA substantiation of consumer-facing claims. |

### 2.4 Incorrect product identification / barcode association

| | |
|---|---|
| **Feature** | Scan → OFF exact GTIN; history/favourites; share deep links; web preview by barcode. |
| **Safeguards** | Core Truth / OFF-primary Result path; share identity contracts (WEB-01A / publicShareCodesMatch noted in counsel pack); stale-load guards; no inventing identity for zeros (**CONFIRMED** — `MVP_COUNSEL_READY_PACK.md`). |
| **Vulnerability** | OFF mis-linked barcode; reused GTINs; user-scanned wrong pack; dormant non-OFF discovery paths if ever reactivated for Result. |
| **Protection** | Keep Result scoring OFF-only; manufacturer identity challenge process; barcode + photo evidence retention for disputes. |
| **Counsel?** | Advisable for duty-of-care framing; engineering controls already primary. |

### 2.5 Inaccurate nutritional / environmental / ethical / certification assessments

| | |
|---|---|
| **Feature** | Body / Planet / Claims / Transparency pillars; Highlights; Certifications UI. |
| **Safeguards** | Versioned pillar registries; highest-scheme cert selection; Rateability NR/Checking; Whole Produce gate; additives registry. |
| **Vulnerability** | Stale OFF fields; wrong brand→parent mapping for BBFAW/KTC; cert tag false positives; packet OCR/contribution errors before/after admission. |
| **Protection** | Provenance display; correction workflow; periodic dataset refresh governance; do not present benchmarks as RVEEL’s own investigation of factory conditions. |
| **Counsel?** | **Yes** for how comparative assessments must be framed. |

### 2.6 Incorrect source information / outdated evidence

| | |
|---|---|
| **Feature** | Product cache; bundled BBFAW/KTC JSON; local Dynamic Signals pack; recall pack. |
| **Safeguards** | Cache clear in Account Privacy; Signals pack versioning; recall path control flags. |
| **Vulnerability** | Cached product out of date vs pack; bundled benchmark year lag; MILO/test GTIN notes in recall pack require careful production gating. |
| **Protection** | Retention/TTL policy; “last assessed” / source date where feasible; counsel on outdated-rating risk. |
| **Counsel?** | Partly. |

### 2.7 Manufacturer disputes, correction and takedown demands

| | |
|---|---|
| **Feature** | Any published assessment or share preview for an identifiable SKU. |
| **Safeguards** | Support email slot via `EXPO_PUBLIC_SUPPORT_EMAIL` / `productIdentity.supportEmail` (**CONFIRMED** — may be empty if unset); Account Help; no live Privacy/Terms pages yet. |
| **Vulnerability** | No published correction policy; no triage SLA; no governed withdrawal feature. |
| **Protection** | Adopt §6 operational framework below; staff training; counsel-approved response templates. |
| **Counsel?** | **Yes** for takedown vs correction vs “right to reply” design. |

### 2.8 Sharing / republication of disputed assessments

| | |
|---|---|
| **Feature** | Share Product story card; clipboard URL; `/api/product-preview` HTML teaser; `/api/share-event`. |
| **Safeguards** | Web teaser keeps score null / veiled; share analytics local + optional POST. |
| **Vulnerability** | Native share image may include published score/pillars once Rated; third parties keep copies after withdrawal. |
| **Protection** | Record share events for contested barcodes; teaser refresh; counsel on “already shared” residual risk. |
| **Counsel?** | Advisable. |

---

## 3. Third-party data and licensing matrix

### 3.1 Open Food Facts (priority)

**Official sources accessed 16 November 2026:**

- https://world.openfoodfacts.org/data — Conditions for reuse (ODbL database; DbCL contents; CC BY-SA images).  
- https://opendatacommons.org/licenses/odbl/1-0/ — ODbL 1.0 text.  
- OFF guidance summarises attribution, share-alike, API compliance, bulk-export preference for offline/cache, contribution-back spirit, prominent UI attribution (`reuse@openfoodfacts.org`).

| Topic | Status |
|---|---|
| Database licence | **CONFIRMED** public statement: ODbL |
| Contents | **CONFIRMED** public statement: DbCL |
| Photographs | **CONFIRMED** public statement: CC BY-SA; may embed third-party rights |
| In-app / API use | **CONFIRMED** Result path uses World OFF; User-Agent `Rveel/1.0.0` on reads (`src/services/openFoodFacts.ts`, product-preview) |
| Legacy submission UA | **CONFIRMED** contains placeholder `truescan@example.com` TODO in `openFoodFactsSubmission.ts` — **must not ship** as contact |
| Attribution in MVP UI | **UNRESOLVED** — methodology/sources copy acknowledges OFF; counsel must confirm prominence/placement for ODbL |
| Share Cards + teaser images | **CONFIRMED** may display OFF-hosted front images; **UNRESOLVED** CC BY-SA + trademark clearance |
| Local product/image cache | **CONFIRMED** AsyncStorage + FileSystem cache; **INTERPRETATION** whether this is an “adapted database” triggering share-alike publication — **counsel** |
| Commercial redistribution | **INTERPRETATION** — public API ≠ unrestricted commercial freedom |

**Do not declare OFF licence compliance based on wording alone.**

### 3.2 BBFAW (Business Benchmark on Farm Animal Welfare)

| | |
|---|---|
| **Use** | **CONFIRMED** bundled `src/data/ethics/bbfaw2025Canonical.json`; drives Claims adjustments; L3 links to bbfaw.com |
| **Source note in JSON** | Extract from BBFAW 2025 report PDF URL recorded in file |
| **Licence** | **UNRESOLVED** — no completed counsel clearance for redistributing extracted tier/impact tables inside a commercial scoring app |
| **Risk** | Copyright in report tables; misrepresentation of BBFAW methodology as RVEEL investigation |

### 3.3 KnowTheChain (Business & Human Rights Resource Centre)

| | |
|---|---|
| **Use** | **CONFIRMED** bundled `ktcParents.json` / alias map; Claims scoring; L3 attribution |
| **Public reuse note** (accessed 16 Nov 2026 via BHRRC “How we work”) | Third parties asked to acknowledge KnowTheChain as author, cite “KnowTheChain”, link to hosting site; KTC does not warrant third-party conclusions; may disallow harmful uses; logo needs written consent |
| **Licence** | **INTERPRETATION** — attribution conditions appear; full commercial scoring licence still **counsel** |
| **Risk** | Company-named labour/forced-labour context in consumer UI |

### 3.4 Certification marks (Fairtrade, Rainforest, MSC, ASC, Organic, etc.)

| | |
|---|---|
| **Use** | OFF labels + optional admitted evidence; highest-scheme Claims weights; MSC API not implemented as network client in current inventory |
| **Risk** | Trademark / certification-mark misuse if UI implies RVEEL certifies the product |
| **Status** | **UNRESOLVED** mark-owner policies — counsel / founder |

### 3.5 Dynamic Signals / recall pack

| | |
|---|---|
| **Use** | **CONFIRMED** local bundled asset embed; not Score; path flags in env |
| **Licence / provenance** | **UNRESOLVED** for each pack source row; official recall URLs referenced in packs where present |
| **Risk** | Wrong recall match; test GTINs if mis-shipped |

### 3.6 Dormant / non-Score paths

UPCitemdb, Barcode Spider, FDA enforcement API remain in tree for discovery/legacy but are **not** MVP Result Score inputs (**CONFIRMED** — B1 copy + inventory). Reactivation would reopen licensing and privacy review.

### 3.7 Hosting / subprocessors (partial)

| Service | Role | Status |
|---|---|---|
| Vercel (`truscoreapi` / UAT) | API, preview, evidence, share-event | **CONFIRMED** code paths; region/retention **UNRESOLVED** |
| Vercel Blob | Private evidence images | **CONFIRMED** |
| Open Food Facts / CDN | Product + images | **CONFIRMED** |
| Expo / stores | Distribution | Standard |
| Sentry | Error SDK present; init appears dormant in reviewed JS | **CONFIRMED** dormant unless DSN/native differs |
| Qonversion | Gated off MVP | **CONFIRMED** |

---

## 4. Privacy and actual data handling (verified inventory)

### 4.1 Local-only / primarily local

| Data | Storage | Notes |
|---|---|---|
| Scan history | `@truescan_history` | barcode, name, timestamp; max 100 |
| Favourites | `@truescan_favorites` | may store score fields |
| Product cache | `@truescan_product_cache` + image files under cache `truescan/` | full product objects |
| Settings | `@truescan_settings` | includes `analyticsEnabled` (default false), `legalDisclaimersAcceptedAt`, onboarding |
| Share analytics (local) | `@truescan_share_analytics` | **recorded even when analyticsEnabled false** (**CONFIRMED**) |
| EA credential / outbox | `@rveel_evidence_*` | device contributor token |
| Packet evidence photos | documentDirectory private path | EXIF/location stripping on EA pipeline |

**Account clears** remove history, favourites, or product cache only — **not** credentials, share analytics, evidence queues, SQLite extras (**CONFIRMED**).

### 4.2 Transmitted off-device (when features used)

| Flow | Destinations | Examples |
|---|---|---|
| Barcode product fetch | Open Food Facts | GTIN lookup; User-Agent `Rveel/1.0.0` |
| Share preview | RVEEL backend → may fetch OFF | barcode → HTML teaser |
| Share event | `/api/share-event` | barcode, platform, item type, timestamp |
| Photo upload | `/api/upload-photo`, optional OFF image dispatch | barcode + image |
| Evidence Authority | `/api/evidence-authority` + Blob | contributions, bearer token, hashes, JPEG |
| Manual products / other APIs | backend routes listed in `backendConfig` | gated/feature-dependent |

**IP addresses / server logs:** not defined in app source; **UNRESOLVED** at hosting layer — treat as likely personal information under NZ/AU privacy law (**INTERPRETATION**).

### 4.3 Camera / permissions

Camera (and related) permission strings from `productIdentity.native`; capture via `expo-image-picker` for product/contribution photos (**CONFIRMED**).

### 4.4 Analytics consent gap

`analyticsEnabled` UI exists but does **not** gate local share analytics or `/api/share-event` (**CONFIRMED**). Privacy Policy draft must either disclose this or founders must change product behaviour in a later authorised phase.

### 4.5 NZ Privacy Act 2020 / Australian Privacy Act (**INTERPRETATION**)

Applicability depends on entity, turnover, APP entity status, and overseas disclosure. Cross-border processing via Vercel/OFF is likely. Individual access/correction/deletion rights need a monitored contact and process. **Counsel must determine applicability and APP/IPP mapping.**

### 4.6 Personal information candidates (**INTERPRETATION** pending counsel)

- Device-held history/favourites/preferences  
- Contributor credential / contributorId  
- Uploaded photos and EXIF-derived metadata (even if stripped, originals may briefly exist)  
- IP and request logs on backend  
- Support emails  
- Share-event and analytics records correlatable to devices  

**Do not describe the MVP as anonymous or “data never leaves the phone”.**

---

## 5. Operational protection framework (recommended — not implemented)

1. **Intake:** Dedicated manufacturer/consumer report channel (email or form). Capture reporter identity, barcode/GTIN, product name, contested statement (score, pillar, Signal, highlight text), date/time, jurisdiction, supporting docs.  
2. **Identity lock:** Confirm barcode ↔ product ↔ pack photo; freeze assessment snapshot (inputs, pillar breakdown, publication state, methodology registry ids, OFF revision if known).  
3. **Evidence preserve:** Retain EA snapshot keys, cache copy, share-event ids, Signals pack version.  
4. **Triage:**  
   - P0 safety/recall mismatch or allergen-critical error  
   - P1 wrong product identity  
   - P2 factual cert/benchmark error  
   - P3 methodology disagreement / opinion challenge  
5. **Escalation:** P0/P1 to founder + counsel within defined hours; do not publicise unverified allegations.  
6. **Outcomes:** Correct data; republish; temporary unpublish/NR; decline with reasons; or refer to OFF for catalogue errors.  
7. **Records:** Ticket id, decision, timestamps, who approved republication.  
8. **Comms hygiene:** No social posting of dispute details; no admitting liability without counsel.

**Separation:** This framework is **operational recommendation**. Withdrawal/moderation mechanisms are **not** built under B2.

---

## 6. Founder decisions required

1. Legal entity name, incorporation jurisdiction, and contracting party for Terms/Privacy.  
2. Monitored support + legal-notice email (must replace any placeholder; `EXPO_PUBLIC_SUPPORT_EMAIL` before store UI exposure).  
3. Whether to publish Privacy/Terms at `truescan.app/privacy` and `/terms` and when to set `legalDestinations.*.ready = true`.  
4. Manufacturer correction policy and SLA.  
5. Onboarding Skip intro: remove bypass vs force legal step vs other control.  
6. Whether share analytics / share-event must honour `analyticsEnabled` or be reclassified as essential ops telemetry.  
7. Retention periods for cache, logs, evidence, share events.  
8. Approval of draft Privacy Policy and Terms (companion docs).  
9. OFF attribution placement and contribution-back posture.  
10. BBFAW/KTC commercial reuse confirmation or removal path.

## 7. Counsel decisions required

1. Defamation / injurious falsehood / ACL-FTA risk appetite for identifiable product ratings.  
2. OFF ODbL/DbCL/CC BY-SA compliance plan for app, cache, Share Cards, teasers.  
3. BBFAW and KnowTheChain licence/attribution adequacy.  
4. Privacy Act (NZ) / Privacy Act (AU) applicability and overseas disclosure wording.  
5. Enforceability of liability limitations vs non-excludable consumer guarantees.  
6. Correction/takedown legal design.  
7. Whether Confidence / score-band language remains substantiated.  
8. Subprocessor list and DPA needs (Vercel, Blob, OFF, future Sentry).

## 8. Prioritised recommendations (non-implementing)

| Priority | Recommendation |
|---|---|
| P0 | Counsel OFF compliance + approve Privacy/Terms drafts; then publish URLs and flip readiness only with founder auth |
| P0 | Close or redesign onboarding Skip legal bypass |
| P0 | Stand up monitored support inbox + dispute intake template |
| P1 | Align analytics consent with actual telemetry or disclose clearly |
| P1 | Clear BBFAW/KTC reuse; fix OFF submission User-Agent contact placeholder |
| P1 | Define retention/deletion for EA credentials and evidence |
| P2 | Attribution UI audit vs OFF guidelines |
| P2 | Share-card image licence notice |

## 9. Companion drafts

- `docs/legal/RVEEL_PRIVACY_POLICY_DRAFT_20261116.md` — **DRAFT — NOT APPROVED FOR PUBLICATION**  
- `docs/legal/RVEEL_TERMS_OF_USE_DRAFT_20261116.md` — **DRAFT — NOT APPROVED FOR PUBLICATION**

## 10. Confirmation

- Starting SHA verified: `cbf339474c52d6fdfa6788ed5f07c73fc938277b`  
- Ending SHA: recorded at commit/push of this pack  
- **No scoring, Rateability, Confidence, Evidence Authority, Account navigation, onboarding, Premium, auth, or `legalDestinations.ready` changes were made under Phase B2.**  
- Untracked `artifacts/` preserved.
