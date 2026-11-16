# RVEEL — PERMANENT PUBLIC MVP LEGAL RELEASE BLOCKER

**Status: BLOCKED / NO-GO as of 16 November 2026.**  
**Founder requirement:** Company formation, incorporation jurisdiction and operating/app territories have NOT been decided. No technical completion or passing test may be interpreted as legal approval.

This is a durable **release-control requirement**, not a time-based reminder. It MUST remain blocked until the future operating entity, relevant territories, applicable legislation, third-party rights, contracts, consumer privacy, claim/dispute process and full end-to-end UAT are each specifically reviewed and approved at the highest *practicable* evidence-backed standard appropriate to the chosen jurisdiction(s). There is no automatic legal immunity or single universal legal framework.

## Implemented controls

- Machine-readable registry: [MVP_PUBLIC_LAUNCH_GATE.json](./MVP_PUBLIC_LAUNCH_GATE.json), **all 15 requirements PENDING** and `publicReleaseStatus: BLOCKED`.
- Enforcement: `scripts/assert-public-launch-ready.cjs`; returns nonzero for public preflight unless every requirement has a reviewer, evidence, approval date and explicit APPROVED status; legal entity and incorporation country must be identified, and both founder and qualified counsel must approve.
- **Independent exact-code approval:** a protected release environment must provide `RVEEL_APPROVED_RELEASE_SHA` matching the actual Git commit. A repository-editable JSON file or `EXPO_PUBLIC_*` flag alone cannot release the application.
- Build entrypoints: `npm run build:apk`, `build:ios`, and `build:aab` run the public legal preflight. Expo EAS cloud runs the `eas-build-pre-install` hook even for direct EAS CLI builds (standard EAS lifecycle); unknown or store-targeted build profiles fail closed.
- Closed/UAT profiles (`development`, `uat-dynamic-signals-android/ios`, `uat-founders-android/ios`) can continue; testing does not clear legal approvals.
- GitHub Actions `legal-public-release-lock.yml` runs regression tests verifying that public profiles remain blocked, unknown profiles fail closed and founder UAT stays available.
- Gate output lists unresolved items rather than merely stating NO-GO.

## Required approvals (NOT satisfied)

1. Named registered legal entity, incorporation country, operational control and signatory.
2. NZ legal review, including defamation/related reputation torts, FTA, privacy and consumer rights.
3. AU legal review, including ACL, defamation laws, Privacy Act/APP applicability and unfair-terms rules.
4. Manufacturer liability, substantiation, scoring narratives and correction/takedown rights.
5. Data flow, overseas processors, retention/deletion and privacy law applicability.
6. Live and counsel-approved Terms/Privacy and verified legal destinations.
7. Versioned affirmative acceptance of those published Terms, without Skip bypass.
8. Monitored support, privacy officer/owner and manufacturer complaint escalation.
9. Deployed, secure, logged hold capability and full production-like hold/release UAT.
10. OFF ODbL/DbCL/CC BY-SA rights, attribution, derivatives, caching, images and shares.
11. OFF contribution consent, source-specific rights and valid identifying User-Agent.
12. BBFAW/KnowTheChain/certification permission or lawful narrower product strategy.
13. Documented retention/deletion, security and serious-breach response.
14. Android/iOS physical-device and backend checks for scanning, Result, NR/Checking, identity, share, legal links and holds.
15. App Store / Play Store disclosures, domains, contact, support and public-market release controls.

**Future markets:** Expansion beyond approved launch markets always requires a new territorial/legal review. Approval for NZ/AU alone must never be interpreted as global clearance.

## Release authority and activation rules

- **Do not** make up incorporation country, legal contacts, licence grants or legal opinions. Leave `PENDING` if unknown.
- Attach dated **external counsel advice**, actual licence evidence, contractual approvals, screenshots/test logs and live URL checks. Any condition or caveat means the corresponding gate remains `PENDING` until satisfactorily resolved.
- Only after resolving every entry may responsible founders change `publicReleaseStatus` to `CLEARED`, and only once the qualified legal adviser has confirmed jurisdictional scope and the specific release candidate. Protected CI/EAS approval must explicitly attest to the exact release SHA.
- Configure `RVEEL_APPROVED_RELEASE_SHA` **only** in a protected, access-controlled release environment, never in `.env.development`, public Expo config, source, docs or a local test bypass.
- Verify `npm run legal:release-preflight` for the exact source. Verify live production environment and store submission permissions separately before public distribution.
- Every material code/legal policy change after sign-off requires a new candidate assessment and exact-code approval.
- Any failed mandatory check blocks release; there is **no time expiry**, assumed approval, emergency toggle or temporary waiver for public launch.

## Day-to-day use

- `npm run legal:launch-status` — show outstanding decisions and why MVP release is blocked (informational; does not release).
- `npm run legal:release-preflight` — public release check; expected exit status **1** until all requirements are independently approved.
- `node --test scripts/assert-public-launch-ready.test.cjs` — enforce regression behaviour.
- `eas build --profile uat-founders-android` — remains available for closed development UAT.

## Important enforcement limits

No repository-level code can physically stop a person with full EAS/App Store/Play Console privileges from manually submitting a **previously built** binary or removing safeguards. Set up protected GitHub branches/environments, restricted EAS credentials, Play Console and App Store Connect submission permissions, and mandatory human release sign-off. Direct alternative build systems and manual store-console operations must be covered by these organisational controls. A production Vercel backend may already be deployed for closed UAT; this gate does **not** represent a verified lock on all public web infrastructure.

Any public publication or external legal representation still needs explicit founder approval. Do not promote the current draft Terms or Privacy Policy or enable `legalDestinations.*.ready` while this registry is blocked.

**Current engineering context:** Stabilisation at `f54ce5a6b4489c7edb388c827b60f876f1596c6f`; public hold/deep-link/device checks were not yet demonstrated end to end. Keep the legal release lock separate from scoring, Rateability and Evidence Authority.
