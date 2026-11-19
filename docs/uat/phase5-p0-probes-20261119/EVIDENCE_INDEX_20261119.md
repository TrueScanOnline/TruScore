# Evidence index — MVP baseline recovery follow-up (2026-11-19)

**Branch:** `integration/w5-mvp-baseline-recovery-20261119`  
**Implementation tip under test (product behaviour):** `46f3913d3e8ddddce5c944805892532cf99de70e`  
**Evidence-preservation commit:** tip of this branch after this commit (parent = `46f3913`; full SHA reported at push)  
**UAT backend deploy:** `dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV` → `https://truscoreapi-uat.vercel.app` (Ready)  
**Policy:** `mvp_preselected_only_v1_20261118`  
**publicReleaseStatus:** BLOCKED  
**Gate 2:** NOT PASSED  
**Gate 3:** NOT PASSED  

## GTINs and admissions

| GTIN | Journey | Admission / state |
|------|---------|-------------------|
| `9300617064879` | Origins Add → Admit → Reassess → Confetti | `origins\|made_in` Fiji **seq 363**; `origins\|packed_in` Australia **seq 364** |
| `9300652817232` | Packet Claims Agree persistence + Correct Alert | Agree persisted (`You already agreed. 1 person agrees`); Correct = non-mutating unavailable Alert |

## Automated results (implementation tip `46f3913`; re-verified on evidence tip after push)

| Suite | Result |
|-------|--------|
| `mvpBaselineContracts.test.ts` | 7/7 PASS |
| `reconcileAfterLostSubmitAck.test.ts` | PASS |
| `mvpEaActionPolicy.snapshotRead.test.ts` | PASS |
| `wp09PacketPersistenceAndCorrectPath.test.ts` | PASS |
| Combined | 14/14 PASS |

## Files in this pack

### Acceptance / index
- `docs/uat/INTEGRATED_MVP_BASELINE_ACCEPTANCE.md`
- `docs/uat/phase5-p0-probes-20261119/DEVICE_JOURNEY_EVIDENCE_20261119.md`
- `docs/uat/phase5-p0-probes-20261119/EVIDENCE_INDEX_20261119.md` (this file)
- `docs/uat/phase5-p0-probes-20261119/uat_deploy_compat_20261119.txt`

### Contract / behavioural tests
- `src/__tests__/unit/governance/mvpBaselineContracts.test.ts` (already on `46f3913`)
- `src/__tests__/unit/backend/mvpEaActionPolicy.snapshotRead.test.ts`
- `src/__tests__/unit/evidenceAuthority/reconcileAfterLostSubmitAck.test.ts`
- `src/__tests__/unit/communityAgreement/wp09PacketPersistenceAndCorrectPath.test.ts`
- `baseline_contracts_at_46f3913.txt`, `baseline_contracts_run_meta.txt`, `jest_review_followup.txt`

### Live probes
- `probe_snapshot_get_vs_post.js` + `probe_snapshot_get_vs_post_out.json` (GET 200 vs POST 403)
- `probe_structured_origins_fiji.json` (API admit seq 363)
- `cadbury_origins_snapshot_post_ui_admit.json` (post UI admit; submitter IDs redacted)

### Device — Origins
- `screen_origins_card.png`, `ui_origins_scroll.xml`
- `screen_origins_change.png`, `ui_origins_change_sheet.xml`
- `screen_origins_add.png`, `ui_origins_add_sheet.xml`
- `ui_origins_country.xml`, `ui_origins_australia.xml`
- `screen_origins_pre_admit.png`, `ui_origins_pre_admit.xml`
- `screen_origins_after_submit2.png`, `ui_origins_after_submit2.xml`, `ui_origins_what_next.xml`
- `screen_origins_post_admit_result.png`, `ui_origins_post_admit_result.xml`

### Device — Packet Claims
- `screen_packet_card.png`, `ui_packet_card_full.xml`
- `screen_packet_agree_persisted.png`, `ui_packet_agree_idempotent.xml`
- `screen_packet_correct_alert.png`, `ui_packet_correct_alert.xml`

## Explicitly unresolved (do not clear)

- CF-04 / FM-03R server eligibility
- Packet Correct complete journey (FAIL — Alert only)
- iOS TestFlight
- Legal publication + legal preflight (BLOCKED)

## Excluded from this commit

- `artifacts/` temporary build outputs
- Intermediate Expo connection / splash debug dumps not required for the journey verdict
- Live auth tokens (none committed; probe scripts use runtime-issued credentials only)
