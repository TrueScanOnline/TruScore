# RVEEL Privacy Policy

> **DRAFT — NOT APPROVED FOR PUBLICATION**
> **Draft date:** 16 November 2026 (factual code reconciliation updated 17 November 2026 — Account Trust closeout)
> **Basis:** Verified MVP data flows on branch `build/w5-founders-native-20261114`; factual reconciliation against Account Trust implementation (see `docs/legal/ACCOUNT_TRUST_DRAFT_RECONCILIATION_20261117.md`).
> **Companion evidence:** `docs/legal/STAGE2_B2_LEGAL_RISK_AND_LICENSING_20261116.md`
> This draft is for founder and NZ/Australian counsel review. It is **not** live at https://truescan.app/privacy. Account legal destinations remain `ready: false`.
>
> **Factual corrections vs substantive legal questions:** Updates marked *Factual (code)* reflect verified app behaviour. Items marked **APPROVAL REQUIRED** / **INTERPRETATION — counsel** remain unresolved legal decisions and are **not** answered by engineering.

---

## Approval-required identity block

The following must be completed before publication. **Do not invent values.**

| Field | Status |
|---|---|
| Legal entity name | **APPROVAL REQUIRED** |
| Registered / principal address | **APPROVAL REQUIRED** |
| Privacy contact email | **APPROVAL REQUIRED** (may later map to `EXPO_PUBLIC_SUPPORT_EMAIL` / Help UI once set) |
| Privacy officer (NZ) | **APPROVAL REQUIRED** if the entity is an NZ agency under the Privacy Act 2020 |
| Governing privacy jurisdictions asserted | **APPROVAL REQUIRED** (NZ and/or Australia — counsel) |
| Effective date | **APPROVAL REQUIRED** |

Until those fields are approved, this document remains an internal draft only.

---

## 1. Who we are

RVEEL (“**Rveel**”, “**we**”, “**us**”) provides a mobile application that helps you look up food products by barcode and view independent assessments under Rveel’s methodology (Body, Planet, Claims and Transparency), together with related product information and, where configured, Dynamic Signals such as certain recall notices.

This Privacy Policy explains how the **current MVP** handles information when you use the app. It does **not** describe future account, subscription or Premium features unless they are actually active in the build you use. Premium / Qonversion subscription tooling is gated off in the current MVP runtime configuration.

---

## 2. Scope

This Policy covers:

- The Rveel mobile app (Expo / store builds as released).
- Related Rveel-operated backends used by the app (including product preview, share events, photo upload and Evidence Authority services where enabled).

It does **not** control Open Food Facts, app stores, or other independent websites you open from links.

---

## 3. Information we handle

### 3.1 Information stored on your device

Depending on how you use the app, your device may store:

| Category | Examples | Purpose |
|---|---|---|
| Scan history | Barcodes, product names, timestamps | Show recent scans |
| Favourites | Barcodes, names, stored score fields, timestamps | Your saved products |
| Product cache | Product records and cached product images | Faster repeat views; offline resilience |
| Settings | Theme, language, units, packaging-market preference, onboarding completion, legal-acceptance timestamp **if recorded** | Operate the app |
| Share logs (on device) | Recent share attempts (barcode, platform, success/failure, timestamp, published score where available) — **only if local share analytics are explicitly enabled in the build** (default OFF for public MVP) | Optional diagnostics |
| Inbound share attribution | Barcode and referral fields when you open a shared link | Attribute inbound shares |
| Contribution / evidence materials (if you use contribution features) | Local evidence photos, session state, Evidence Authority contributor credential | Support optional evidence submissions |

**Important:** Clearing History, Favourites or Cache in Account → Privacy & Data removes those stores only. It does **not** automatically erase contributor credentials, evidence queues, on-device share logs, inbound share attribution, or all other local databases.

### 3.2 Information sent from your device when you use network features

| Activity | What may leave the device | Where it may go |
|---|---|---|
| Product lookup | Barcode / product request | Open Food Facts and/or Rveel backends that fetch Open Food Facts data |
| Share product link / preview | Barcode and share context; preview page may load product name, brand, image from Open Food Facts | Rveel share/preview hosts; Open Food Facts / image CDNs when images load |
| Share event reporting | Barcode, platform, item type, timestamp (successful shares) — **only if share-event telemetry is explicitly enabled in the build** (default OFF for public MVP) | Rveel `/api/share-event` (server logs) |
| Product photo upload | Barcode, image bytes, image type | Rveel upload APIs; **may also** be dispatched to Open Food Facts when that path runs |
| Evidence Authority contribution (when enabled) | Contribution payloads (e.g. ingredients text, nutrition, certifications, origins, packet wording), image hashes/bytes, bearer contributor token | Rveel Evidence Authority API and **private** blob storage |

Servers that receive requests typically process technical logs such as IP address, time and user agent. Exact log retention is **APPROVAL REQUIRED** (hosting configuration).

### 3.3 Information we do not treat as “anonymous by default”

Barcode scans, device-held history, contributor credentials, photos, IP logs and share events can identify or be linked to a person in combination with other data. We do **not** claim that Rveel processes only anonymous information.

### 3.4 Camera and photos

If you grant camera or photo-library permission, you can capture or select product images. Evidence Authority image pipelines are designed to reject or strip certain location/EXIF metadata before **private** upload; other upload paths may differ. Always assume photos can identify a product and, indirectly, shopping behaviour.

**Three different photo uses (current MVP):**

1. **Private Rveel evidence** — stored for Rveel assessment workflows (private blob when Evidence Authority image upload is used).
2. **Display of Open Food Facts photographs** — product images already published by Open Food Facts may appear in Result, Share Cards and website teasers.
3. **Contribution to Open Food Facts** — some photo/product flows can send content to Open Food Facts, where Open Food Facts’ contributor terms apply (including Creative Commons Attribution-ShareAlike for photos).

Whether a specific capture is kept private, shown from Open Food Facts, or contributed publicly depends on the feature path. **Explicit Open Food Facts contribution consent controls are a future product requirement** and are **not** fully implemented as a separate opt-in in the current MVP (**APPROVAL REQUIRED** before asserting compliant contribution consent in a published Policy).

### 3.5 Privacy controls versus share telemetry (launch hardening)

**User-accessible controls in the released Account experience** currently include clearing History, Favourites and product Cache, and opening Legal / Privacy document destinations when those destinations are marked ready. There is **no** analytics or share-telemetry toggle on Account Home, Privacy & Data, or Legal & Methodology screens in the store Account navigation.

An internal `analyticsEnabled` preference exists in app settings storage (default off). In store-release builds it is **not** exposed through Account. That preference **does not** govern share telemetry.

**Public MVP default (16 Nov 2026 hardening):**

- Local share analytics persistence is **OFF** unless `EXPO_PUBLIC_LOCAL_SHARE_ANALYTICS=1`.  
- Outbound `/api/share-event` posts are **OFF** unless `EXPO_PUBLIC_SHARE_EVENT_TELEMETRY=1` (server also defaults OFF).  
- Functional sharing continues without those telemetry paths.  
- Inbound share attribution may still be stored locally when a shared link is opened.

Account clear actions still do not remove inbound share attribution keys; that residual behaviour remains documented.

Error-reporting SDK code may exist in the project; production activation depends on configuration. Crash reporting is **not** confirmed active in the reviewed MVP JavaScript lifecycle. If crash reporting is enabled in a released build, that fact must be confirmed and this Policy updated before publication (**APPROVAL REQUIRED**).

### 3.6 Children

Rveel is not directed at children. Do not use the app if you are under the age required by your country’s rules for this type of service without appropriate guardian authority. Exact age threshold: **APPROVAL REQUIRED** (counsel).

---

## 4. Why we handle information

We handle information to:

- Identify products and display assessments and related content.
- Cache data for performance.
- Enable sharing and preview pages. Optional share-event telemetry and local share analytics are **gated and default OFF** in the current MVP (*Factual (code)*); essential functional share/preview requests may still occur when you share.
- Support optional user contributions and evidence workflows when those features are enabled in a given build. Public Open Food Facts contribution remains **default disabled** until explicit consent controls are approved (*Factual (code)*).
- Secure services, prevent abuse and diagnose faults.
- Comply with law and respond to legitimate requests.

---

## 5. Local storage versus server processing

| | On device | On servers / third parties |
|---|---|---|
| History / favourites / settings | Yes | Not by default for those stores |
| Product catalogue fields | Cached copies | Retrieved from Open Food Facts / Rveel APIs |
| Share preview | Generates link on device | Preview host may fetch and display product fields/images |
| Share event | Local share analytics only if explicitly enabled (default OFF); outbound `/api/share-event` only if explicitly enabled (default OFF) (*Factual (code)*) | Rveel backend may log barcode/platform/item/time **only when** share-event telemetry is enabled |
| Evidence contributions | Prepared locally when contribution features are used | Submitted to Rveel backends when you contribute; private blob for EA images. Public OFF write paths default disabled (*Factual (code)*) |
| Guest Account / Privacy requests | Device clears for history, favourites and product cache; dedicated personal-information request mailto categories when support email is configured (*Factual (code)*) | Opening email does **not** complete server deletion or create a ticket |
| Administrative publication hold | Not a local privacy control | Founder/admin API may temporarily withhold consumer publication of an assessment without changing scoring engines (*Factual (code)*); distinct from NR/Checking |

---

## 6. Third parties, processors and overseas handling

We use service providers and data sources, which may process data outside New Zealand or Australia, including:

- **Open Food Facts** — independent product database and images (see their terms and licences). When we send contributions to Open Food Facts, Open Food Facts handles that content under its own terms.
- **Hosting and API providers** for Rveel backends (currently including Vercel-hosted APIs and blob storage in source). Where a provider only processes information **on our behalf**, we remain responsible for that processing under applicable NZ privacy rules (**INTERPRETATION — counsel**).
- **App stores / OS vendors** — install and permission frameworks.

Exact subprocessors, countries and contracts: **APPROVAL REQUIRED**.

**Cross-border note:** Not every international server request is the same legal event. Using a contracted host to process Rveel requests can differ from **disclosing** personal information to an independent overseas organisation. Australian APP 8 (if the Australian Privacy Act applies) and New Zealand overseas-disclosure rules must be mapped per flow by counsel. This Policy does **not** assume every transfer automatically triggers the same cross-border disclosure rule.

When a share or product page loads an image from Open Food Facts or a CDN, that host may receive the viewer’s network metadata.

---

## 7. Retention and deletion

| Store | Current engineering behaviour | Policy target |
|---|---|---|
| History | Capped list; user can clear | Retain only as long as needed for the feature; user clear available |
| Favourites | User-managed; user can clear | Same |
| Product cache | User can clear | Same |
| Share analytics (device) | Capped recent events; **not** cleared by Account Privacy actions today | **APPROVAL REQUIRED** retention and deletion UX |
| Server logs / share-event | Not fully specified in app source | **APPROVAL REQUIRED** |
| Evidence Authority records | Server-linked to contributor id | **APPROVAL REQUIRED** retention and deletion process |

To request deletion of server-held contribution or other records we control, contact the privacy email once published. We may retain information where required by law or for dispute/security purposes.

---

## 8. Your privacy rights

Depending on applicable New Zealand and/or Australian privacy law, you may have rights to request access, correction, deletion, or to complain to a privacy regulator. How those rights apply to Rveel: **APPROVAL REQUIRED (counsel)** — including whether Rveel is an NZ “agency”, whether Australian APP entity rules apply (including any small-business exemption or exception), and how IPP 3A (indirect collection notice obligations from 1 May 2026) maps to specific data flows.

**Notifiable privacy breaches (NZ):** If a privacy breach is likely to cause serious harm, New Zealand law requires assessment and, where notifiable, notification to the Office of the Privacy Commissioner and affected individuals (subject to exceptions). Our internal breach playbook and contacts: **APPROVAL REQUIRED**.

**Complaint path (draft):** contact the privacy email → we investigate → if unresolved, you may contact the Office of the Privacy Commissioner (NZ) and/or the Office of the Australian Information Commissioner, as applicable.

---

## 9. Security and limitations

We use technical measures appropriate to an MVP (HTTPS APIs, private blob uploads for Evidence Authority images, token hashing on contributor credentials). No method is perfectly secure. You are responsible for the security of your device.

---

## 10. Contributions and contributor credentials

If contribution features are enabled in your build, the app may create a **device contributor credential** (a pseudonymous token) used to authenticate Evidence Authority requests. That credential is not a consumer login account. Treat it as identifying operational data. Revocation/deletion process: **APPROVAL REQUIRED**.

If content is contributed to Open Food Facts, Open Food Facts’ contributor terms apply (including public edit history and photo licensing). Rveel’s future contribution consent control is described for founders/counsel in the B2 risk pack and is **not** asserted as complete in this MVP Policy.

---

## 11. Future accounts and Premium

Paid subscription / account systems may be added later. They are **out of scope for this MVP draft** unless a specific released build enables them. A new Policy section will be required before launch of those features.

---

## 12. Changes

We may update this Policy. Material changes should be notified in-app or on the website once published. Continued use after the effective date may constitute acceptance where permitted by law (**INTERPRETATION — counsel**).

---

## 13. Contact

**Privacy contact:** [APPROVAL REQUIRED — email]
**Privacy officer:** [APPROVAL REQUIRED — name/role]
**Postal address:** [APPROVAL REQUIRED]
**Website (planned Policy host):** https://truescan.app/privacy (not ready as of 15–16 Nov 2026 verification)

---

## Draft control notes (internal — remove before publication)

- Traceability: §3–6 map to Stage 2 B2 inventory and B2-R01/R02/R05 reconciliation (Account has no analytics toggle; share-event ungated; OFF photo operations separated; IPP 3A / processor vs disclosure flagged).
- Unresolved facts marked **APPROVAL REQUIRED**.
- Do not publish until entity, contact, counsel sign-off and `legalDestinations.privacy.ready` authorised separately.
