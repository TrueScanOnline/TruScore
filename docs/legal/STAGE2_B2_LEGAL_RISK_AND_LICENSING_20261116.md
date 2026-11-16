# RVEEL Stage 2 Phase B2 — Legal risk, licensing and operational readiness

**Status:** Documentation and drafting only. **Not legal advice.**
**Date:** 16 November 2026 (reconciled same day — Phase B2 Final Legal Documentation Reconciliation)
**Repository:** `TrueScanOnline/TruScore`
**Branch:** `build/w5-founders-native-20261114`
**Verified B2 starting SHA:** `cbf339474c52d6fdfa6788ed5f07c73fc938277b`
**Verified reconciliation starting HEAD:** `1f04a3fc8d10b3aaa662c982d36b379194af0296` (local = `origin`)
**Account Stage 1 / Phase B1 methodology copy:** Prior founder-accepted workstreams remain closed for behaviour; this pack does not reopen them.
**Phase B2 scope:** Evidence audit, licensing matrix, draft Privacy/Terms companion docs, operational recommendations, and B2-R01–R07 reconciliation. **No application or backend behaviour change. No publication of Privacy/Terms. `legalDestinations.*.ready` remains false.**

**Evidence legend**

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Verified in current source / config / official public documentation |
| **INTERPRETATION** | Legal or licensing reading that counsel must confirm |
| **UNRESOLVED** | Fact or decision missing; founder and/or counsel required |

---

## 1. Executive summary

RVEEL independently assesses identifiable food products and publishes comparative scores, pillar explanations, Signals and shareable previews. That product shape can attract manufacturer and consumer complaints even where engineering fail-closed publication and disclaimers exist.

**Overriding commercial priority reflected in this pack:** minimise exposure from inaccurate assessments, misleading statements, disputed facts, third-party data misuse and manufacturer complaints — without assuming that “educational”, “technology” or “opinion” labels alone defeat liability (**INTERPRETATION** — counsel).

**Highest residual launch blockers (engineering + legal):**

1. Open Food Facts ODbL / DbCL / CC BY-SA commercial reuse programme (attribution, share-alike, Share Cards, teasers, cache) — **not** categorically prohibited and **not** automatically compliant.
2. Incomplete public Privacy Policy / Terms (configured URLs not ready).
3. Onboarding “Skip intro” bypass of legal acknowledgement; draft Terms “use = agree” language is not the same as recorded affirmative acceptance.
4. Manufacturer correction / dispute process not operationally staffed or published (no live takedown system).
5. Bundled BBFAW / KnowTheChain reuse terms incompletely cleared for scoring display.
6. OFF API identification defects (`truescan@example.com` placeholder; inconsistent User-Agent; EA write path without UA).
7. Share telemetry transmitted off-device without a consumer-accessible analytics control in the released Account experience.

**Application behaviour under this instruction:** unchanged.

---

## 1A. Reconciliation log (B2-R01–R07) — 16 November 2026

| ID | Original weakness | Verified evidence | Corrected position | Tag |
|---|---|---|---|---|
| **B2-R01** | §4.4 / Privacy §3.5 implied an “analytics setting” that consumers could use as consent | `analyticsEnabled` in `useSettingsStore` (default false); only toggled in legacy `app/settings.tsx`, now mounted as `DeveloperSettings` when `!isStoreReleaseRuntime()`; Account stack has no analytics control (`AccountStack`, `PrivacyDataScreen`); `ShareService.recordShare` → `shareAnalytics` + `reportShareEventToBackend` with **no** `analyticsEnabled` read | Distinguish: (a) internal/developer setting; (b) local `@truescan_share_analytics` + `@truescan_share_inbound`; (c) off-device `/api/share-event`; (d) dormant Sentry/Qonversion. Do **not** call `analyticsEnabled` a user-accessible privacy control for store MVP | **CONFIRMED** behaviour; legal classification of share telemetry **UNRESOLVED** (founder/counsel) |
| **B2-R02** | OFF photo rights treated as one bucket | OFF Terms (accessed 16 Nov 2026): https://world.openfoodfacts.org/terms-of-use — photos CC BY-SA; contributors irrevocably licence photos under CC BY-SA; photos must be taken by contributor. OFF image-upload tutorial: user photos need consent for CC BY-SA (should be part of service terms). Code: private EA Blob vs Result/Share/teaser OFF image display vs automatic `uploadProductPhoto` / `submitProductToOpenFoodFacts` without contribution-specific consent UI | Three operations require separate permissions; existing in-app consent does **not** satisfy OFF contribution licence requirements | **CONFIRMED** ops + OFF public terms; adequacy of future consent wording **INTERPRETATION** |
| **B2-R03** | UA noted only as placeholder in submissions | Official OFF API docs (accessed 16 Nov 2026): https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ — custom User-Agent form `AppName/Version (ContactEmail)`. Reads: `Rveel/1.0.0` (no contact). Submissions/image dispatch: `Rveel/1.0.0 (truescan@example.com)` TODO. EA `product_jqm2` write: **no** User-Agent | Placeholder contact is a **release-readiness defect**. Recommend one governed `AppName/Version (real-contact)` for all OFF paths once founders approve contact | **CONFIRMED** |
| **B2-R04** | Terms §1 “by using you agree” vs Skip bypass noted only as internal note | `app/onboarding.tsx`: Skip calls `handleComplete()` without setting `legalDisclaimersAcceptedAt`; timestamp only set on legal-step path; Account Legal destinations `ready: false` | Distinguish display / accessibility / affirmative acknowledgement / recorded evidence / enforceability. Recommend fail-closed guest onboarding. Do not treat any timestamp as sufficient merely because the field exists | **CONFIRMED** behaviour; enforceability **INTERPRETATION** |
| **B2-R05** | Privacy law reduced to one vague paragraph | NZ Privacy Act 2020 (legislation.govt.nz); IPP 3A via Privacy Amendment Act 2025 in force 1 May 2026 (MoJ / OPC); s 201 privacy officers; OPC notifiable breach guidance; OAIC APP entity / small-business exemption / APP 8 / NDB (accessed 16 Nov 2026) | Expand compliance register: applicability, IPP 3A relevance, privacy officer, breach response, offshore **processor** vs overseas **disclosure**, AU APP conditional coverage. Do not treat every international server hop as the same cross-border disclosure event | Confirmed statute/guidance URLs; RVEEL applicability **UNRESOLVED** until entity known |
| **B2-R06** | Dispute §5 too thin for commercial priority | Product surfaces: identity, Claims/BBFAW/KTC, certs, Signals, share/preview | Expanded operational sequence; implemented vs proposed; founder-selectable targets; counsel gates. **No** live portal/SLA invented | Framework **recommended** only |
| **B2-R07** | Terms risked implying live enforcement / over-strong liability | Draft Terms §§7, 14–17 | Soften enforcement; keep non-excludable rights; flag UCT/indemnity/cap/law as counsel; no invented entity, cap or jurisdiction | Draft wording **INTERPRETATION** |

---

## 2. Manufacturer liability and assessment risk

*Do not treat this section as a determination that any claim would succeed. It maps exposure pathways for counsel.*

### 2.1 Defamation / business reputation (**INTERPRETATION**)

| | |
|---|---|
| **Feature creating exposure** | Published Claims/Ethics outcomes, Highlights/L3 text naming companies (BBFAW/KTC), packaging-claim assessments, share cards and web teasers tied to an identifiable GTIN/brand. |
| **Current safeguards** | Governed methodology; publication latch (no Rated number while Checking / Overall NR); Evidence Authority admission for contributor facts; Result disclaimer / data-limitation cards; methodology copy revised in B1 to reduce absolute claims (**CONFIRMED** — Stage 2 B1 evidence). |
| **Remaining vulnerability** | Comparative score + company-named welfare/labour benchmarks can still be read as reputational criticism of a named trader. Wrong barcode identity amplifies harm. |
| **Recommended operational protection** | Staffed correction process (§5 / §5A); rapid identity verification; preserve assessment provenance; counsel-reviewed wording for L3 company narratives; avoid unverified dispute narratives in public replies. |
| **Counsel required?** | **Yes** — NZ/AU defamation and related reputation torts for product-rating apps. |

### 2.2 Injurious falsehood / commercial disparagement (**INTERPRETATION**)

| | |
|---|---|
| **Feature** | Statements that a product “scores poorly”, lacks certifications, or fails Claims benchmarks; share republication. |
| **Safeguards** | Fail-closed presentation; score bands framed as methodology outcomes (B1 closeout); Signals separated from Score in consumer copy. |
| **Vulnerability** | Factual assertions about certifications, Nutri/Eco/NOVA, or manufacturer practices that prove false for that GTIN. |
| **Protection** | Substantiation file per published assertion class; manufacturer intake channel; temporary withholding workflow (**proposed — not implemented**). |
| **Counsel?** | **Yes**. |

### 2.3 Misleading or unsubstantiated consumer representations (**INTERPRETATION** — NZ Fair Trading Act / Australian Consumer Law)

| | |
|---|---|
| **Feature** | Marketing, store listings, Result labels, Confidence badge, Highlights, methodology modal, share captions. |
| **Safeguards** | Publication contracts; INV-SC-7/8 consumption guards; B1 methodology accuracy corrections; in-app disclaimers. |
| **Vulnerability** | Residual educational NOVA/health language; users treating Confidence as accuracy probability; Skip-bypass users never seeing legal text; Privacy/Terms not ready. |
| **Protection** | Counsel review of store listing + fail-closed first-run legal step; keep methodology copy locked to engines. |
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
| **Safeguards (implemented)** | Support email **slot** via `EXPO_PUBLIC_SUPPORT_EMAIL` / `productIdentity.supportEmail` (**CONFIRMED** — may be empty if unset); Account Help; fail-closed score publication rules. |
| **Vulnerability** | No published correction policy; no staffed triage; **no** governed withdrawal/moderation feature in product. |
| **Protection** | Adopt §5A operational framework; counsel-approved response templates. |
| **Counsel?** | **Yes** for takedown vs correction vs “right to reply” design. |

### 2.8 Sharing / republication of disputed assessments

| | |
|---|---|
| **Feature** | Share Product story card; clipboard URL; `/api/product-preview` HTML teaser; `/api/share-event`. |
| **Safeguards (implemented)** | Web teaser keeps score null / veiled; local share log + backend share-event log exist for successful shares (**CONFIRMED** — not a consent control). |
| **Vulnerability** | Native share image may include published score/pillars once Rated; third parties keep copies after any later correction. |
| **Protection** | Use share-event records in disputes; teaser refresh; counsel on residual “already shared” risk. |
| **Counsel?** | Advisable. |

---

## 3. Third-party data and licensing matrix

### 3.1 Open Food Facts (priority)

**Official sources accessed 16 November 2026:**

- https://world.openfoodfacts.org/data — Conditions for reuse (ODbL database; DbCL contents; CC BY-SA images).
- https://world.openfoodfacts.org/terms-of-use — Terms of use, contribution and re-use (French original prevails; English for information).
- https://opendatacommons.org/licenses/odbl/1-0/ — ODbL 1.0 text.
- https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/ — API User-Agent and write auth.
- https://openfoodfacts.github.io/openfoodfacts-server/api/tutorial-uploading-photo-to-a-product/ — image licence / user-consent note.
- https://support.openfoodfacts.org/help/en-gb/12-api-data-reuse/94-are-there-conditions-to-use-the-api — API reuse conditions summary.

**Corrected position on commercial reuse:** OFF licences **authorise** reuse including commercial use **subject to** attribution, share-alike and other licence conditions, and subject to residual third-party rights in packaging artwork/trademarks. RVEEL is **neither** automatically compliant **nor** categorically prohibited from commercial reuse. Compliance is a programme for counsel + founders (**INTERPRETATION** on adapted-database / NZ-AU trademark overlay).

| Topic | Status |
|---|---|
| Database licence | **CONFIRMED** public statement: ODbL |
| Contents | **CONFIRMED** public statement: DbCL |
| Photographs | **CONFIRMED** public statement: CC BY-SA; may embed third-party rights |
| In-app / API reads | **CONFIRMED** User-Agent `Rveel/1.0.0` (`openFoodFacts.ts`, product-preview) — **missing contact email** vs OFF `AppName/Version (ContactEmail)` form |
| Image / product submissions | **CONFIRMED** User-Agent `Rveel/1.0.0 (truescan@example.com)` — **release-readiness defect** |
| EA OFF product write | **CONFIRMED** Content-Type only; **no** User-Agent (**defect**) |
| Attribution in MVP UI | **UNRESOLVED** prominence/placement for ODbL — counsel |
| Share Cards + teaser images | **CONFIRMED** may display OFF-hosted front images; CC BY-SA attribution + trademark residual rights **UNRESOLVED** |
| Local product/image cache | **CONFIRMED** AsyncStorage + FileSystem cache; adapted-database share-alike trigger **INTERPRETATION** — counsel |
| Contribution-back to OFF | **CONFIRMED** automatic paths exist; contribution-specific CC BY-SA consent **absent** |

#### 3.1.1 Three OFF photo operations (B2-R02)

| Operation | What happens today | Permissions required (licence / privacy / IP) | Current gap |
|---|---|---|---|
| **1. Private evidence intake** | EA pipeline → private Vercel Blob `evidence-images/...` (`access: 'private'`); EXIF stripping designed on EA path | User authority to capture/upload; privacy notice; RVEEL host licence for processing; **not** an OFF publication grant | Disclose purpose; retention/deletion still **UNRESOLVED** |
| **2. Display / redistribute OFF-sourced photos** | Result hero, Share Card capture, `/api/product-preview` + share landing `og:image` / `<img>` | OFF CC BY-SA re-use (attribution + share-alike); check residual packaging/trademark rights; consumer Privacy disclosure for network fetch | Attribution programme incomplete; commercial share-image clearance **counsel** |
| **3. Contribute user photos/data to OFF** | `uploadProductPhoto` / manual product save → `/api/off-image-dispatch` and/or `submitProductToOpenFoodFacts`; EA gated write transport | OFF contributor terms: irrevocable DbCL (data) + CC BY-SA (photos); photo taken by contributor; reproduction rights; **explicit user authorisation** to place photo under CC BY-SA (OFF upload tutorial) | **No** contribution-specific consent UI before automatic OFF submit (**CONFIRMED**) |

**Recommended future consent-control specification (not implemented):**

1. Separate toggles/screens: “Save privately for Rveel evidence” vs “Publish to Open Food Facts under CC BY-SA / DbCL”.
2. Before any OFF transfer: plain-language notice that the contribution becomes public, irrevocable under OFF terms, attributed via product page, and editable by other OFF contributors.
3. Require affirmative action (unchecked by default).
4. Record consent timestamp + contributor credential + barcode + artefact hash.
5. Do not treat general Terms acceptance or camera permission as sufficient for OFF publication.

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
| Vercel Blob | Private evidence images; separate public upload-photo path | **CONFIRMED** |
| Open Food Facts / CDN | Product + images | **CONFIRMED** |
| Expo / stores | Distribution | Standard |
| Sentry | Dependency + wrapper present; `initialize()` not called in reviewed JS lifecycle | **CONFIRMED** dormant |
| Qonversion | Gated off MVP (`subscriptionAndPaywall` false) | **CONFIRMED** |

---

## 4. Privacy and actual data handling (verified inventory)

### 4.1 Local-only / primarily local

| Data | Storage | Notes |
|---|---|---|
| Scan history | `@truescan_history` | barcode, name, timestamp; max 100 |
| Favourites | `@truescan_favorites` | may store score fields |
| Product cache | `@truescan_product_cache` + image files under cache `truescan/` | full product objects |
| Settings | `@truescan_settings` | includes `analyticsEnabled` (default false), `legalDisclaimersAcceptedAt`, onboarding |
| Share analytics (local) | `@truescan_share_analytics` | **always recorded on share outcomes**; **not** gated by `analyticsEnabled` (**CONFIRMED**) |
| Inbound share attribution | `@truescan_share_inbound` | barcode/ctx/src/ref/timestamp; ungated (**CONFIRMED**) |
| EA credential / outbox | `@rveel_evidence_*` | device contributor token |
| Packet evidence photos | documentDirectory private path | EXIF/location stripping on EA pipeline |

**Account clears** remove history, favourites, or product cache only — **not** credentials, share analytics, inbound attribution, evidence queues (**CONFIRMED**).

### 4.2 Transmitted off-device (when features used)

| Flow | Destinations | Examples |
|---|---|---|
| Barcode product fetch | Open Food Facts | GTIN lookup; User-Agent `Rveel/1.0.0` |
| Share preview | RVEEL backend → may fetch OFF | barcode → HTML teaser |
| Share event | `/api/share-event` | barcode, platform, item type, client timestamp — **only on successful share**; **not** gated by `analyticsEnabled` |
| Photo upload | `/api/upload-photo`, optional OFF image dispatch | barcode + image |
| Evidence Authority | `/api/evidence-authority` + Blob | contributions, bearer token, hashes, JPEG |
| Manual products / other APIs | backend routes listed in `backendConfig` | gated/feature-dependent |

**IP addresses / server logs:** not defined in app source; **UNRESOLVED** at hosting layer — treat as candidate personal information under NZ/AU privacy law (**INTERPRETATION**).

### 4.3 Camera / permissions

Camera (and related) permission strings from `productIdentity.native`; capture via `expo-image-picker` for product/contribution photos (**CONFIRMED**).

### 4.4 Analytics consent and share telemetry (B2-R01) — corrected

| Layer | What exists | Store-user accessible? | Gated by `analyticsEnabled`? |
|---|---|---|---|
| `analyticsEnabled` preference | Persisted in `@truescan_settings`; default `false` | **No** in released Account UX. Toggle lives only on legacy Settings now exposed as `DeveloperSettings` when `EXPO_PUBLIC_STORE_RELEASE` is not `1` | N/A (it **is** the flag) |
| Local share analytics | `@truescan_share_analytics` via `ShareService.recordShare` | Not a user-facing control; Account clear does **not** delete | **No** |
| Inbound share attribution | `@truescan_share_inbound` | Same | **No** |
| Off-device share telemetry | `POST /api/share-event` → Vercel log line | Same | **No** |
| Sentry | Installed, not initialized in reviewed JS | N/A | N/A (dormant) |
| Qonversion analytics mode | Would use `LaunchMode.ANALYTICS` if subscriptions enabled | MVP gate off | Would also lack `analyticsEnabled` gate if reactivated |

**Original incomplete statement:** “analytics setting exists but does not gate share analytics” — true but incomplete because it implied consumers could find the setting.

**Corrected position:** For released store MVP, there is **no** user-accessible analytics privacy control in Account. Share telemetry (local + successful off-device posts) runs as product behaviour today. Founders must either (A) disclose it as operational telemetry and keep it, or (B) later authorise code to add Account controls and/or gate transmission — **do not invent a legal classification here**.

### 4.5 NZ Privacy Act 2020 / Australian Privacy Act (B2-R05)

**Official sources accessed 16 November 2026:**

- Privacy Act 2020 (NZ): https://www.legislation.govt.nz/act/public/2020/31/en/latest/
- Privacy Amendment Act 2025 (IPP 3A commencement 1 May 2026): https://www.legislation.govt.nz/act/public/2025/53/en/latest/
- MoJ notice IPP 3A in force: https://www.justice.govt.nz/about/news-and-media/news/new-privacy-information-principle-in/
- OPC IPP 3A: https://www.privacy.org.nz/privacy-principles/3a/
- OPC IPP 3A guidance PDF: https://www.privacy.org.nz/assets/DOCUMENTS/20251216-IPP3A-guidance-finalised-for-web-A1135067.pdf
- Privacy officers (s 201): https://www.legislation.govt.nz/act/public/2020/0031/latest/LMS23683.html/
- OPC breach management / NotifyUs: https://www.privacy.org.nz/responsibilities/poupou-matatapu-doing-privacy-well/breach-management/ ; https://www.privacy.org.nz/responsibilities/privacy-breaches/notify-us/
- OAIC small business: https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/small-business
- OAIC APP 8: https://www.oaic.gov.au/privacy/australian-privacy-principles/australian-privacy-principles-guidelines/chapter-8-app-8-cross-border-disclosure-of-personal-information
- OAIC NDB scheme overview: https://www.oaic.gov.au/privacy/notifiable-data-breaches/preventing-preparing-for-and-responding-to-data-breaches/data-breach-preparation-and-response/part-4-notifiable-data-breach-ndb-scheme

| Topic | Confirmed legal material | RVEEL application |
|---|---|---|
| NZ agency obligations | Privacy Act 2020 IPPs apply to agencies handling personal information | Whether the contracting entity is an NZ “agency” and which holdings are personal information: **UNRESOLVED** until entity/jurisdiction fixed (**counsel**) |
| Privacy officer | s 201 — agency must appoint one or more privacy officers (with narrow domestic-affairs exception) | **Founder must appoint** once NZ agency status applies; name/contact **APPROVAL REQUIRED** |
| IPP 3A (from 1 May 2026) | Indirect collection → reasonable steps to notify individual of collection facts unless exception (e.g. already aware; publicly available; non-identifying statistical use, etc.). Does **not** apply to PI collected before 1 May 2026 | Potentially relevant if RVEEL obtains personal information **other than from the individual** (e.g. some log/correlation scenarios, third-party referrals). Product barcodes and OFF catalogue fields about **products** are not automatically “personal information about an individual”. Applicability of IPP 3A to specific flows: **INTERPRETATION — counsel** |
| Notifiable privacy breach (NZ) | Assess serious harm; notify OPC as soon as practicable (OPC expects ~72 hours as guide); notify affected individuals unless exception | Need incident playbook before launch (**founder ops + counsel**) |
| Offshore processors vs overseas disclosure | OPC: sending PI to a provider that only processes **on your behalf** — you remain responsible (s 11 context / third-party provider guidance). AU APP 8 focuses on **disclosure** to an overseas **recipient**, with accountability consequences; using a contracted processor is fact-specific | Do **not** assume every Vercel/OFF request is the same “overseas disclosure”. Classify each flow: RVEEL-controlled processing vs disclosure to independent controller (e.g. OFF as separate organisation). **Counsel** |
| AU Privacy Act / APPs | Generally covers APP entities; many small businesses (≤ $3m turnover) exempt unless exception (health service, trading in PI, etc.) | Whether RVEEL is an APP entity: **UNRESOLVED** (turnover, Australian link, exceptions). Even if exempt, ACL and voluntary best practice still matter |
| Access / correction / complaint | NZ IPPs and (if APP entity) APPs provide access/correction paths; regulators OPC / OAIC | Need monitored privacy contact before publishing Privacy Policy |
| Retention / deletion | NZ IPP 9 — do not keep longer than required; AU APP 11.2 destruction/de-identification when no longer needed (if APPs apply) | Engineering TTLs incomplete; Account clear incomplete for share/EA keys — policy targets **APPROVAL REQUIRED** |

### 4.6 Personal information candidates (**INTERPRETATION** pending counsel)

- Device-held history/favourites/preferences
- Contributor credential / contributorId
- Uploaded photos and EXIF-derived metadata (even if stripped, originals may briefly exist)
- IP and request logs on backend
- Support emails
- Share-event and local share analytics correlatable to devices

**Do not describe the MVP as anonymous or “data never leaves the phone”.**

---

## 5. Operational protection framework (recommended — not implemented)

*Original §5 retained and expanded as §5A for B2-R06. Nothing below is a live product feature unless marked Implemented.*

### 5A. Manufacturer / consumer dispute framework (highest commercial priority)

#### Dispute classes in scope

| Class | Examples | Typical severity start |
|---|---|---|
| Wrong product identity | Mismatched name/brand/pack vs GTIN | P1 |
| Wrong barcode association | Reused/mis-linked GTIN; stale OFF identity | P1 |
| False/outdated nutrition or ingredients | Wrong nutrients, allergens, ingredient list used in Body | P0–P2 |
| Wrong Claims benchmark / parent attribution | BBFAW/KTC parent map error; company-named L3 | P1–P2 |
| Inaccurate certification claim | False Fairtrade/organic/MSC signal | P1–P2 |
| Wrong Dynamic Signal / recall | Incorrect recall association | P0 |
| Misleading share/preview content | Teaser image/name wrong; stale share card | P1–P2 |
| Disputed methodology judgement | Disagreement with RVEEL rules despite correct inputs | P3 |

#### Operational sequence (proposed)

1. **Receive complaint** — monitored email/form (**not yet designated**). Capture reporter role (manufacturer/consumer/other), contact, barcode/GTIN, product name as sold, contested statement (score / pillar / Signal / highlight / share URL), observed date/time, market, supporting pack photos and docs.
2. **Verify identity and contested statement** — confirm barcode ↔ pack ↔ in-app Result/share URL; quote the exact contested text/number; note publication state (Rated / NR / Checking).
3. **Preserve evidence** — freeze snapshot: inputs used, pillar breakdown, methodology/registry versions, OFF revision if known, Signals pack version, share-event ids, EA keys if any. **Do not** overwrite logs while investigating.
4. **Triage** — P0 safety/allergen/recall; P1 identity; P2 factual cert/benchmark/nutrition; P3 methodology-only opinion.
5. **Escalate** — P0/P1 to founder (+ counsel when reputational/legal threat). Prefer silent containment over public commentary.
6. **Decide outcome** — correct upstream/local data; temporary withhold / leave UnRevealed (**capability largely not built** — see table); republish after fix; decline P3 with reasons; or refer catalogue errors to OFF.
7. **Record decision** — ticket id, decision, approver, timestamps, what changed.
8. **Communicate** — factual outcome to complainant only; **no** republication of unverified allegations; no admission of liability without counsel.

#### Implemented vs proposed

| Capability | Status |
|---|---|
| Fail-closed score publication (Checking / Overall NR) | **Implemented** |
| Account Help + `supportEmail` config slot | **Implemented** (email may be empty) |
| Local share analytics + `/api/share-event` logs | **Implemented** (ops artefact, not a dispute UI) |
| Product cache clear by user | **Implemented** |
| Monitored legal/support inbox | **Proposed** |
| Manufacturer portal | **Proposed — not built** |
| One-click takedown / forced NR moderation tool | **Proposed — not built** |
| Guaranteed response SLA | **Not offered**; founders may choose **targets** below |
| Public “right to reply” page | **Proposed — counsel** |

#### Founder-selectable response **targets** (not SLAs; not commitments)

| Severity | Suggested internal target (founder chooses) | Counsel before action? |
|---|---|---|
| P0 | Acknowledge intake quickly; escalate same business day | Yes if safety/legal exposure unclear |
| P1 | Identity verification within a small number of business days | Yes if manufacturer litigation threat |
| P2 | Factual investigation queued | Usually after substantiation file |
| P3 | Standard reply explaining methodology independence | Rarely |

**Do not publish numeric SLAs in consumer Terms until staffing exists.**

---

## 6. Founder decisions required (summary list)

See **§11 Founder Decision Register** for options, implications and preferred recommendations.

1. Legal entity name, incorporation jurisdiction, and contracting party for Terms/Privacy.
2. Monitored support + legal-notice + privacy-officer contact (must replace placeholders; wire `EXPO_PUBLIC_SUPPORT_EMAIL` before store UI exposure).
3. Whether to publish Privacy/Terms at `truescan.app/privacy` and `/terms` and when to set `legalDestinations.*.ready = true`.
4. Manufacturer correction policy and internal response targets.
5. Onboarding Skip intro: remove bypass vs force legal step vs other control.
6. Share telemetry: disclose as operational vs later gate/control in Account.
7. Retention periods for cache, logs, evidence, share events.
8. Approval of draft Privacy Policy and Terms (companion docs).
9. OFF attribution, User-Agent contact, and contribution-back consent posture.
10. BBFAW/KTC commercial reuse confirmation or removal path.

## 7. Counsel decisions required

1. Defamation / injurious falsehood / ACL-FTA risk appetite for identifiable product ratings.
2. OFF ODbL/DbCL/CC BY-SA compliance plan for app, cache, Share Cards, teasers (commercial reuse conditions — not prohibition vs automatic compliance).
3. Adequacy of contribution consent + Terms wording for OFF CC BY-SA photo transfer.
4. BBFAW and KnowTheChain licence/attribution adequacy.
5. Privacy Act (NZ) / Privacy Act (AU) applicability; IPP 3A mapping; processor vs disclosure classification; breach playbook.
6. Enforceability of browsewrap/clickwrap acceptance; unfair-contract-term risk; liability limitations vs non-excludable consumer guarantees.
7. Correction/takedown legal design.
8. Whether Confidence / score-band language remains substantiated.
9. Subprocessor list and DPA needs (Vercel, Blob, OFF, future Sentry).
10. Whether a narrow user indemnity is appropriate for guest MVP.

## 8. Prioritised recommendations (non-implementing)

| Priority | Recommendation |
|---|---|
| P0 | Counsel OFF compliance + approve Privacy/Terms drafts; then publish URLs and flip readiness only with founder auth |
| P0 | Close or redesign onboarding Skip legal bypass (fail-closed acknowledgement) |
| P0 | Stand up monitored support/privacy inbox + dispute intake template; appoint privacy officer if NZ agency |
| P0 | Replace `truescan@example.com` and unify OFF User-Agent **after** real contact approved (implementation phase) |
| P1 | Disclose or later control share telemetry; extend Account deletion to share keys if classified as PI |
| P1 | Add OFF contribution consent control before any automatic CC BY-SA transfer (future phase) |
| P1 | Clear BBFAW/KTC reuse |
| P1 | Define retention/deletion for EA credentials and evidence |
| P2 | Attribution UI audit vs OFF guidelines; share-card image licence notice |

## 9. Companion drafts

- `docs/legal/RVEEL_PRIVACY_POLICY_DRAFT_20261116.md` — **DRAFT — NOT APPROVED FOR PUBLICATION**
- `docs/legal/RVEEL_TERMS_OF_USE_DRAFT_20261116.md` — **DRAFT — NOT APPROVED FOR PUBLICATION**

## 10. Confirmation

- Reconciliation starting HEAD verified: `1f04a3fc8d10b3aaa662c982d36b379194af0296`
- Ending SHA: recorded at commit/push of this reconciliation
- **No scoring, Rateability, Confidence, Evidence Authority, Account navigation, onboarding, Premium, auth, share telemetry, OFF headers, or `legalDestinations.ready` changes were made under Phase B2 reconciliation.**
- Untracked `artifacts/` preserved.

---

## 11. Founder Decision Register (prioritised)

| ID | Question | Realistic options | Legal / ops implications | Preferred option (reasoned) | Counsel must approve? | Required before public launch? |
|---|---|---|---|---|---|---|
| FD-1 | Contracting legal entity and jurisdiction | NZ company; AU company; dual entities; hold launch | Determines Privacy Act/APP coverage, governing law, notices | **Do not choose here.** Prefer single clear contracting entity matching ops reality once founders decide | Yes | **Yes** |
| FD-2 | Monitored support + legal + privacy contact | One inbox; split legal/privacy; outsourced | Without a live inbox, correction and privacy rights are paper-only | Single monitored inbox + named privacy officer (can be founder initially) | Counsel on notice wording | **Yes** |
| FD-3 | Publish Privacy/Terms + flip `legalDestinations.*.ready` | Publish after counsel; delay launch; soft-launch without ready flags | Soft-launch without policies increases FTA/ACL and trust risk | Publish only after FD-1/2 + counsel sign-off, then flip ready | Yes | **Yes** for store public launch |
| FD-4 | Manufacturer complaint process | Email-only targets; portal later; outsource | Highest commercial priority for inaccurate assessments | Adopt §5A email intake + internal targets now; portal later | Yes for templates/takedown | **Yes** (process), portal **No** |
| FD-5 | Share telemetry consent posture | (A) Disclose as operational essential; (B) Add Account toggle + gate `/api/share-event`; (C) Stop off-device share-event | (A) needs clear Privacy wording; (B)/(C) need code phase | **(A) for MVP launch disclosure**, with scheduled (B) if counsel says consent required | Yes on classification | Disclosure **Yes**; code gate optional if (A) accepted |
| FD-6 | Onboarding legal acceptance | Remove Skip; Skip keeps but forces later legal gate; clickwrap before first scan | Current Skip leaves `legalDisclaimersAcceptedAt` null; browsewrap weak | Fail-closed: cannot complete guest onboarding without affirmative acknowledgement + timestamp | Yes on enforceability | **Yes** |
| FD-7 | Privacy retention periods | Short TTLs; align to feature caps; counsel matrix | IPP 9 / APP 11.2 if applicable | Feature-aligned caps + documented server-log TTL | Yes | **Yes** (policy numbers) |
| FD-8 | OFF source compliance programme | Attribution + UA fix + contribution consent; or reduce OFF image use in shares | Commercial reuse allowed under conditions — must execute programme | Full programme: attribution, real UA contact, contribution consent before OFF publish, counsel on share images | Yes | **Yes** |
| FD-9 | BBFAW/KTC rights | Licence letter; heavier attribution; remove from consumer Claims UI | Copyright + reputational naming risk | Seek written comfort or narrow display; else remove named tiers from consumer UI | Yes | **Yes** if Claims UI keeps named benchmarks |
| FD-10 | Liability cap / governing law / indemnity in Terms | NZ law; AU law; dual; omit cap; narrow indemnity for uploads only | UCT / non-excludable guarantee risk if over-aggressive | Counsel-drafted limitation preserving ACL/CGA; **no** absolute immunity; indemnity only if counsel endorses narrow upload misuse clause | **Yes** | **Yes** before Terms publication |
