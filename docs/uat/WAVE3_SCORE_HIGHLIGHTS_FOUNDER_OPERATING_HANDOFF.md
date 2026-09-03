# Wave 3 Score Highlights — Founder operating handoff (S28)

**Status:** Candidate package for independent Claude post-implementation assurance. **Not** founder-accepted UAT until that assurance completes.

**Branch:** `wave3/score-highlights-s12-20260902`  
**Baseline:** `221145d` (Open v15)  
**Implementation tip:** see `git log --oneline 221145d..HEAD`

## Builds / EAS profiles

| Tester | Platform | EAS profile | Diagnostics entitlement |
|--------|----------|-------------|-------------------------|
| AU | iPhone TestFlight | `uat-dynamic-signals-ios` | `EXPO_PUBLIC_SCORE_DIAGNOSTICS=1`, `EXPO_PUBLIC_STORE_RELEASE=0` |
| NZ | Android internal / APK | `uat-dynamic-signals-android` | same |
| Store / production | iOS & Android | `production`, `production-apk`, `preview`, `preview-apk` | `EXPO_PUBLIC_SCORE_DIAGNOSTICS=0`, `EXPO_PUBLIC_STORE_RELEASE=1` |

**Do not** put `EXPO_PUBLIC_SCORE_DIAGNOSTICS=1` in committed `.env.development` (NZ Expo Go stays consumer-parity by default).

### Distribution routes (as configured in this repo)

- **iOS founder UAT:** EAS profile `uat-dynamic-signals-ios` → submit / install via the project’s existing TestFlight AU path (`eas submit` / ASC app id already wired for preview/production).
- **Android founder UAT:** EAS profile `uat-dynamic-signals-android` → internal APK distribution (profile extends `preview-apk`, `distribution: internal`).

Exact install links depend on the next EAS build you run from this branch; this handoff documents the profiles and gates, not a specific build ID until a candidate build is produced.

## Score diagnostics Off / On

1. Install an **entitled** UAT build (profiles above).
2. Open **Settings** (Developer Settings / Profile settings surfaces both use the same shared control).
3. Find **Score diagnostics**.
4. **Off** (default): Result has no “How was this scored?” entry — near-consumer parity for S12/S12a “What we found”.
5. **On**: Result shows **How was this scored?** → S28 per-scan ledger (IDs, points, eligibility). Toggle persists locally; no rebuild.

## Consumer-parity checks

- Entitled UAT + diagnostics **Off**, or any store/production build: no S28 entry, no Settings diagnostics row (store builds).
- Confirm “What we found” is a single neutral list (no Positive/Negative buckets, no visible points).

## Production exclusion checks

On `production` / `preview` / store builds:

- [ ] No Settings “Score diagnostics” row  
- [ ] No Result “How was this scored?”  
- [ ] App startup asserts fail-closed if store release is marked entitled (`assertScoreDiagnosticsReleaseSafe`)

## Cost

Ordinary EAS build minutes only. No new paid diagnostics service, admin accounts, or remote console.

## Known residuals (out of package / for Claude + founders)

- S27 static red/green educational copy may diverge from Result “What we found” — deferred S27 redesign.
- Alcohol consumer treatment not migrated (legacy alcohol highlight policy deleted).
- KTC/BBFAW benchmark refresh deferred after Wave 5.
- Open percentage / qualified-partial / verified-packet-gap origin L2 variants remain governed in the contract but are **not yet reachable** under the OFF-only MVP scoring path (`mvpUnreachable` registry rows); metadata plumbing is in place for states that fire today (clarity broad/coded/mixed; single-ingredient evidently complete).
