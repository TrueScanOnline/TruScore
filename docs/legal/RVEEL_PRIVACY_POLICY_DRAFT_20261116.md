# RVEEL Privacy Policy

> **DRAFT — NOT APPROVED FOR PUBLICATION**  
> **Draft date:** 16 November 2026  
> **Basis:** Verified MVP data flows on branch `build/w5-founders-native-20261114` at starting SHA `cbf339474c52d6fdfa6788ed5f07c73fc938277b`.  
> **Companion evidence:** `docs/legal/STAGE2_B2_LEGAL_RISK_AND_LICENSING_20261116.md`  
> This draft is for founder and NZ/Australian counsel review. It is **not** live at https://truescan.app/privacy. Account legal destinations remain `ready: false`.

---

## Approval-required identity block

The following must be completed before publication. **Do not invent values.**

| Field | Status |
|---|---|
| Legal entity name | **APPROVAL REQUIRED** |
| Registered / principal address | **APPROVAL REQUIRED** |
| Privacy contact email | **APPROVAL REQUIRED** (may later map to `EXPO_PUBLIC_SUPPORT_EMAIL` / Help UI once set) |
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
| Settings | Theme, language, units, packaging-market preference, onboarding completion, legal-acceptance timestamp if recorded, analytics preference toggle | Operate the app |
| Share logs (on device) | Recent share attempts (barcode, platform, success/failure, timestamp, published score where available) | Diagnose sharing; product analytics store |
| Contribution / evidence materials (if you use contribution features) | Local evidence photos, session state, Evidence Authority contributor credential | Support optional evidence submissions |

**Important:** Clearing History, Favourites or Cache in Account → Privacy & Data removes those stores only. It does **not** automatically erase contributor credentials, evidence queues, share logs, or all other local databases.

### 3.2 Information sent from your device when you use network features

| Activity | What may leave the device | Where it may go |
|---|---|---|
| Product lookup | Barcode / product request | Open Food Facts and/or Rveel backends that fetch Open Food Facts data |
| Share product link / preview | Barcode and share context; preview page may load product name, brand, image from Open Food Facts | Rveel share/preview hosts; Open Food Facts / image CDNs when images load |
| Share event reporting | Barcode, platform, item type, timestamp | Rveel `/api/share-event` |
| Product photo upload | Barcode, image bytes, image type | Rveel upload APIs; optionally Open Food Facts image dispatch when that path is used |
| Evidence Authority contribution (when enabled) | Contribution payloads (e.g. ingredients text, nutrition, certifications, origins, packet wording), image hashes/bytes, bearer contributor token | Rveel Evidence Authority API and private blob storage |

Servers that receive requests typically process technical logs such as IP address, time and user agent. Exact log retention is **APPROVAL REQUIRED** (hosting configuration).

### 3.3 Information we do not treat as “anonymous by default”

Barcode scans, device-held history, contributor credentials, photos, IP logs and share events can identify or be linked to a person in combination with other data. We do **not** claim that Rveel processes only anonymous information.

### 3.4 Camera and photos

If you grant camera or photo-library permission, you can capture or select product images. Evidence Authority image pipelines are designed to reject or strip certain location/EXIF metadata before private upload; other upload paths may differ. Always assume photos can identify a product and, indirectly, shopping behaviour.

### 3.5 Analytics preference

The app includes an **analytics** setting (default off in settings defaults). In the current MVP source review, **local share analytics and share-event posts are not gated by that toggle**. Until product behaviour is changed or this Policy is updated after approval, treat share-related logging as described in §3.1–3.2.

Error-reporting SDK code may exist in the project; production activation depends on configuration. If crash reporting is enabled in a released build, that fact must be confirmed and this Policy updated before publication (**APPROVAL REQUIRED**).

### 3.6 Children

Rveel is not directed at children. Do not use the app if you are under the age required by your country’s rules for this type of service without appropriate guardian authority. Exact age threshold: **APPROVAL REQUIRED** (counsel).

---

## 4. Why we handle information

We handle information to:

- Identify products and display assessments and related content.  
- Cache data for performance.  
- Enable sharing and preview pages.  
- Support optional user contributions and evidence workflows when enabled.  
- Secure services, prevent abuse and diagnose faults.  
- Comply with law and respond to legitimate requests.

---

## 5. Local storage versus server processing

| | On device | On servers / third parties |
|---|---|---|
| History / favourites / settings | Yes | Not by default for those stores |
| Product catalogue fields | Cached copies | Retrieved from Open Food Facts / Rveel APIs |
| Share preview | Generates link on device | Preview host may fetch and display product fields/images |
| Evidence contributions | Prepared locally | Submitted to Rveel backends when you contribute |

---

## 6. Third parties and overseas processing

We use service providers and data sources, which may process data outside New Zealand or Australia, including:

- **Open Food Facts** — product database and images (see their terms and licences).  
- **Hosting and API providers** for Rveel backends (currently including Vercel-hosted APIs and blob storage in source).  
- **App stores / OS vendors** — install and permission frameworks.  

Exact subprocessors, countries and DPAs: **APPROVAL REQUIRED**.

When a share or product page loads an image from Open Food Facts or a CDN, that host may receive the viewer’s network metadata.

---

## 7. Retention and deletion

| Store | Current engineering behaviour | Policy target |
|---|---|---|
| History | Capped list; user can clear | Retain only as long as needed for the feature; user clear available |
| Favourites | User-managed; user can clear | Same |
| Product cache | User can clear | Same |
| Share analytics (device) | Capped recent events | **APPROVAL REQUIRED** retention |
| Server logs / share-event | Not fully specified in app source | **APPROVAL REQUIRED** |
| Evidence Authority records | Server-linked to contributor id | **APPROVAL REQUIRED** retention and deletion process |

To request deletion of server-held contribution or account-adjacent records, contact the privacy email once published. We may retain information where required by law or for dispute/security purposes.

---

## 8. Your privacy rights

Depending on applicable New Zealand and/or Australian privacy law, you may have rights to request access, correction, deletion, or to complain to a privacy regulator. How those rights apply to Rveel: **APPROVAL REQUIRED (counsel)**.

**Complaint path (draft):** contact the privacy email → we investigate → if unresolved, you may contact the Office of the Privacy Commissioner (NZ) and/or the Office of the Australian Information Commissioner, as applicable.

---

## 9. Security and limitations

We use technical measures appropriate to an MVP (HTTPS APIs, private blob uploads for evidence images, token hashing on contributor credentials). No method is perfectly secure. You are responsible for the security of your device.

---

## 10. Contributions and contributor credentials

If contribution features are enabled in your build, the app may create a **device contributor credential** (a pseudonymous token) used to authenticate Evidence Authority requests. That credential is not a consumer login account. Treat it as identifying operational data. Revocation/deletion process: **APPROVAL REQUIRED**.

---

## 11. Future accounts and Premium

Paid subscription / account systems may be added later. They are **out of scope for this MVP draft** unless a specific released build enables them. A new Policy section will be required before launch of those features.

---

## 12. Changes

We may update this Policy. Material changes should be notified in-app or on the website once published. Continued use after the effective date may constitute acceptance where permitted by law (**INTERPRETATION — counsel**).

---

## 13. Contact

**Privacy contact:** [APPROVAL REQUIRED — email]  
**Postal address:** [APPROVAL REQUIRED]  
**Website (planned Policy host):** https://truescan.app/privacy (not ready as of 15–16 Nov 2026 verification)

---

## Draft control notes (internal — remove before publication)

- Traceability: §3–5 map to Stage 2 B2 inventory (AsyncStorage keys, share analytics ungated, EA bearer token, OFF User-Agent, legalDestinations not ready, onboarding Skip bypass is a Terms/ops issue).  
- Unresolved facts marked **APPROVAL REQUIRED**.  
- Do not publish until entity, contact, counsel sign-off and `legalDestinations.privacy.ready` authorised separately.
