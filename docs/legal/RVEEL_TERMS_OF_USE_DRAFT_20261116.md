# RVEEL Terms of Use

> **DRAFT — NOT APPROVED FOR PUBLICATION**
> **Draft date:** 16 November 2026 (reconciled same day — Phase B2 Final Legal Documentation Reconciliation)
> **Basis:** Verified MVP behaviour on branch `build/w5-founders-native-20261114`; reconciliation against HEAD `1f04a3fc8d10b3aaa662c982d36b379194af0296`.
> **Companion evidence:** `docs/legal/STAGE2_B2_LEGAL_RISK_AND_LICENSING_20261116.md`
> This draft is for founder and NZ/Australian counsel review. It is **not** live at https://truescan.app/terms. Account legal destinations remain `ready: false`.

**These Terms do not eliminate legal liability.** They allocate responsibility where the law allows and describe how Rveel works. Non-excludable consumer rights remain. Nothing in these Terms is a claim of legal immunity.

---

## Approval-required identity block

| Field | Status |
|---|---|
| Contracting legal entity | **APPROVAL REQUIRED** |
| Registered / principal address | **APPROVAL REQUIRED** |
| Legal notices email | **APPROVAL REQUIRED** |
| Governing law & courts | **APPROVAL REQUIRED** (NZ and/or Australia — counsel/founder) |
| Aggregate liability figure (if any) | **APPROVAL REQUIRED** — do not invent a cap |
| Effective date | **APPROVAL REQUIRED** |

---

## 1. Agreement and acceptance (reconciled)

### 1.1 Proposed published wording (subject to counsel)

These Terms and the Privacy Policy form a contract between you and **[APPROVAL REQUIRED — legal entity]** for use of the Rveel application (“**App**”).

### 1.2 How acceptance is intended to work (future fail-closed design)

For guest MVP use, Rveel’s **recommended** acceptance mechanism (not fully implemented today) is:

1. Present short plain-language summaries of these Terms and the Privacy Policy before first productive use;
2. Provide accessible full documents;
3. Require an **affirmative** action (for example “I agree”) that cannot be skipped;
4. Record a device-local acceptance timestamp and Terms/Privacy version identifiers;
5. Block Result/scoring use until acknowledgement is recorded.

### 1.3 Current MVP behaviour (verified — do not overstate)

| Mechanism | Status in current build |
|---|---|
| Merely displaying legal text in onboarding | Possible on the legal step path |
| Making Terms/Privacy URLs ready in Account | **`legalDestinations.*.ready` is false** — destinations not published |
| Affirmative acknowledgement | Only if the user completes the legal step (not Skip) |
| Recording `legalDisclaimersAcceptedAt` | Set on legal-step completion; **null** if the user uses **Skip intro** |
| Legal enforceability of “use = agree” alone | **INTERPRETATION — counsel**; browsewrap is weaker than recorded clickwrap |

**Corrected position:** Publishing these draft Terms does **not** by itself create a reliable acceptance record. The Skip intro path can complete onboarding without a legal-acceptance timestamp. Do not treat the existence of the timestamp field as proof that every user accepted.

Until a fail-closed acknowledgement ships, any temporary “by accessing or using the App you agree” language is a **counsel-risk interim** and must not be described as a completed control.

If you do not agree to Terms that are lawfully presented and accepted, do not use the App.

If you use the App on behalf of an organisation, you confirm you have authority to bind that organisation.

---

## 2. What Rveel is

Rveel provides **independent, methodology-based assessments** of identifiable food products, typically after a barcode scan or lookup. Assessments may include:

- An overall **Rveel Score** when publication rules allow;
- Pillar outcomes for **Body**, **Planet**, **Claims** and **Transparency**;
- Explanatory text, confidence indicators and related product information;
- **Dynamic Signals** (for example certain recall-related notices) that are **separate from** Rveel Score calculations.

Rveel is **not**:

- A laboratory, certifier, regulator or manufacturer;
- A provider of personalised medical, dietary, allergen-management or legal advice;
- A guarantee that any product is safe, healthy, sustainable, ethical or suitable for you.

---

## 3. Independent scoring and methodology

Rveel Score combines available product information, recognised external assessment systems (where present) and **Rveel’s own governed scoring and publication rules**.

Key publication rules (consumer summary):

1. While an assessment is **Checking**, no overall numeric score is published.
2. If any pillar is **UnRevealed (NR)** after settlement, the overall score remains UnRevealed.
3. An overall numeric score is published only when all four pillars are **Rated**.
4. **Confidence** reflects evidence strength/completeness under Rveel’s rules; it is not a second score or a probability that the assessment is correct.
5. Rveel explains its approach but does not promise that every user can independently reproduce every calculation.

Methodology details in the App may be updated as the product evolves. Marketing and store listing claims must remain consistent with these rules (**founder/counsel**).

---

## 4. Information limitations

Product data may be incomplete, outdated or incorrect. Sources include collaborative databases such as Open Food Facts, bundled benchmark datasets used in Claims scoring, and optional user contributions admitted under Evidence Authority rules.

Rveel may hide scores, show UnRevealed states, or show cautionary messaging when information is insufficient. That is not a representation that a product is free of allergens, additives or other risks.

---

## 5. Your responsibility

You must:

- Check the **physical product packaging** for ingredients, allergens, nutrition and origin statements before purchase or consumption;
- Consult **official regulatory notices** for recalls and safety warnings;
- Use your own judgement and professional advice where health conditions apply;
- Not rely solely on Rveel when making purchasing or consumption decisions.

---

## 6. No product certification

Display of certification-related signals (for example Fairtrade, organic, MSC/ASC labels drawn from product data) does **not** mean Rveel certifies the product or endorses the certifier. Certification marks remain owned by their respective owners.

---

## 7. Acceptable use

You agree not to:

- Misrepresent Rveel assessments as official government or manufacturer statements;
- Scrape, overload or attack our services;
- Upload unlawful, infringing, deceptive or privacy-invasive content;
- Attempt to manipulate scores by submitting false evidence;
- Use the App to harass individuals or to publish unverified allegations about people.

**Enforcement reality (reconciled):** Rveel may refuse or limit access where it reasonably believes these Terms are breached, **to the extent it has practical means to do so**. The current MVP does **not** ship a full account-ban, remote kill-switch or moderation console. Do not read this clause as a representation that automated enforcement tooling already exists. Store distribution, backend rate limits and future operational measures may be used where available.

---

## 8. User contributions and Open Food Facts photo rights

If contribution or photo features are enabled in your build:

### 8.1 Private Rveel evidence

You confirm you have the right to capture and submit the content. You grant Rveel a licence to host, process and use submissions to operate and improve assessments under Evidence Authority rules. Admittance into scoring is not guaranteed by submission alone. A device **contributor credential** may be created; it is not a full user account.

### 8.2 Display of Open Food Facts materials

Product fields and photographs sourced from Open Food Facts remain subject to Open Food Facts’ licences (including ODbL / DbCL / CC BY-SA as publicly described). Residual third-party rights (packaging artwork, trademarks) may still apply.

### 8.3 Contributing content to Open Food Facts — recommended Terms wording (future control)

**Proposed wording for when an OFF contribution path is presented:**

> If you choose to contribute a product photograph or product data to Open Food Facts through Rveel, you confirm that: (a) you took the photograph yourself or otherwise have the rights required by Open Food Facts; (b) the information comes from the product packaging; and (c) you irrevocably agree that Open Food Facts may publish the data under the Database Contents Licence and the photograph under the Creative Commons Attribution-ShareAlike licence, on Open Food Facts’ terms of contribution. Contributions may become public, may be edited by others, and generally cannot be made private later.

**Current MVP gap:** Some photo and manual-product flows can dispatch content to Open Food Facts **without** a dedicated contribution opt-in screen. Existing camera permission or general onboarding text must **not** be treated as satisfying Open Food Facts’ contributor-licence requirements. A separate affirmative control is recommended before launch of any automatic OFF publish path (**founder + counsel**; implementation not in this documentation phase).

Guided contribution / Community Agreements features may be disabled in store MVP builds.

---

## 9. Source data ownership and attribution

Product catalogue fields and many images originate from **Open Food Facts** and other sources. Those materials remain subject to their licences. Open Food Facts publicly authorises reuse (including commercial reuse) **under stated conditions** such as attribution and share-alike; that is **not** the same as automatic compliance by Rveel, and it is **not** a categorical prohibition on commercial reuse.

Benchmark datasets (for example BBFAW and KnowTheChain extracts used in Claims) remain subject to their owners’ terms.

You must not remove attribution notices that Rveel displays. Rveel’s compliance programme for these licences is described for counsel in the B2 risk pack and remains subject to approval before public launch claims of compliance.

---

## 10. Reporting incorrect information

If you believe a product identity or assessment is wrong:

1. Note the barcode, product name, what is wrong, and when you saw it;
2. Contact **[APPROVAL REQUIRED — support/legal email]**;
3. Include photos of the pack where helpful.

We will review reports under our manufacturer/consumer correction process once adopted (see companion risk pack §5A). That process is an **operational** commitment by Rveel when staffed; it is **not** a guaranteed public SLA and does **not** create a live manufacturer portal or one-click takedown button in the App today.

Open Food Facts catalogue errors may also need to be corrected upstream on Open Food Facts.

---

## 11. Manufacturer corrections and disputes

Manufacturers and brand owners may request correction of factual errors affecting their products, including wrong identity, barcode association, nutrition/ingredient evidence, Claims benchmarks or parent-company attribution, certification signals, Dynamic Signals / recall associations, misleading share or preview content, or disputed methodology judgements.

Rveel’s intended operational response (intake, identity verification, evidence preservation, triage, escalation, correction / temporary withholding / republication, decision records, careful communications) is set out in `STAGE2_B2_LEGAL_RISK_AND_LICENSING_20261116.md` §5A. That framework is **recommended**, not a live contractual SLA, until founders publish and staff it.

We may correct data, leave an assessment UnRevealed where publication rules or future moderation tools allow, or decline methodology challenges that merely disagree with Rveel’s published rules. We will not use dispute handling to publish unverified allegations.

---

## 12. Intellectual property

The App, Rveel trademarks, methodology presentation and original content are owned by Rveel or its licensors. You receive a limited, revocable, non-exclusive licence to use the App for personal, non-commercial purposes unless a written commercial agreement says otherwise.

You may not copy, reverse engineer (except to the extent permitted by law), or exploit Rveel’s branding to imply endorsement.

Third-party trademarks and certification marks remain with their owners. Open Food Facts and other source licences continue to apply to redistributed source materials.

---

## 13. Sharing

If you share product links or images, you are responsible for how and where you share them. Preview pages may omit scores; native shares may include published assessment elements when a score is published. Shared copies may persist outside Rveel’s control even if Rveel later corrects an assessment.

Successful shares may generate operational share-event records as described in the Privacy Policy draft.

---

## 14. Liability limitations

**To the maximum extent permitted by applicable law:**

- The App and assessments are provided on an “as available” basis;
- Rveel is not liable for indirect, consequential, special or lost-profit damages arising from use of or reliance on the App, **except** where such exclusion is prohibited;
- Any aggregate liability cap for claims relating to the App is limited to **[APPROVAL REQUIRED — counsel-approved figure or alternative remedy]**. **No figure is asserted in this draft.**

**Non-excludable rights:** Nothing in these Terms excludes, restricts or modifies any consumer guarantee, right or remedy under the Australian Consumer Law, the New Zealand Consumer Guarantees Act, or other laws that cannot lawfully be excluded. Where liability can be limited to resupply of the services or the cost of resupply, and that limitation is permitted, Rveel may rely on it.

**Unfair contract terms (**INTERPRETATION — counsel**):** Liability and suspension wording must be reviewed for unfair-contract-term regimes applicable to standard-form consumer contracts in NZ/AU. Over-broad waivers, unilateral variation without notice, or one-sided indemnities may be unenforceable or unlawful.

**These limitations are not a claim of immunity** from all legal claims, including claims about misleading conduct or defamation, which counsel must assess separately.

---

## 15. Indemnity (optional — counsel)

**Default for this draft: no user indemnity clause is activated.**

**APPROVAL REQUIRED:** Counsel may later approve a **narrow** indemnity limited to losses arising from unlawful uploads or clear misuse by the user. Do **not** enable a broad indemnity that shifts Rveel’s own assessment liability onto guest users without counsel review (unfair-contract and enforceability risk).

---

## 16. Changes to the App; suspension

You may stop using the App at any time. We may change or discontinue features. Where we suspend or limit access for breach or security reasons, we will do so only to the extent practical means exist (**see §7**). Provisions that by nature should survive (IP, liability, any approved indemnity) survive termination of use.

---

## 17. Governing law

**APPROVAL REQUIRED:** These Terms are governed by the laws of **[New Zealand / Australia / other]**, and courts of **[venue]** have non-exclusive jurisdiction, without prejudice to mandatory consumer protections in your place of residence.

Do not treat any placeholder as a chosen jurisdiction.

---

## 18. Changes to these Terms

We may update these Terms. Material changes should be notified reasonably (for example in-app or on the website once published). Whether continued use after notice constitutes acceptance is **counsel**-dependent and should align with the fail-closed acknowledgement design in §1.2 where implemented.

---

## 19. Contact

**Legal notices:** [APPROVAL REQUIRED — email]
**Support / corrections:** [APPROVAL REQUIRED — email]
**Website (planned Terms host):** https://truescan.app/terms (not ready as of 15–16 Nov 2026 verification)

---

## Draft control notes (internal — remove before publication)

| Clause theme | Traceability |
|---|---|
| Acceptance / Skip bypass | B2-R04; `app/onboarding.tsx` Skip vs `legalDisclaimersAcceptedAt` |
| OFF photo operations | B2-R02; OFF terms + upload tutorial 16 Nov 2026; automatic dispatch gap |
| OFF commercial reuse | Neither prohibited nor auto-compliant |
| Dispute process | B2-R06 §5A — proposed, not a live portal/SLA |
| Enforcement | Softened — no fake moderation capability |
| Liability / UCT / indemnity | B2-R07 — non-excludable rights preserved; cap/entity/law unresolved |
| Entity / law / caps | All marked APPROVAL REQUIRED |

**Do not publish** until entity, contacts, governing law, liability approach and counsel sign-off are complete, and a separate founder authorisation flips `legalDestinations.terms.ready`.
