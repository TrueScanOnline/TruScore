# Phase 5 P0 device evidence — tip 46f3913 (2026-11-19 review follow-up)

**Frontend tip:** `46f3913d3e8ddddce5c944805892532cf99de70e`  
**Branch:** `integration/w5-mvp-baseline-recovery-20261119`  
**Device:** Android Expo Go + Metro (`exp://10.0.2.2:8081`, adb reverse)  
**UAT backend:** alias `https://truscoreapi-uat.vercel.app` → deploy `dpl_AMuxeFSsPDzx2LjvDMJjeUpu36WV` (Ready)

## Expo Go recovery

Remote-update / `--offline` splash stall cleared by restarting Metro without `--offline`, `adb reverse tcp:8081 tcp:8081`, and connecting Expo Go to `exp://10.0.2.2:8081`. Scan home loaded; full Result journeys executed on this tip.

## B-02 / C-03 Origins Add → Admit → Reassess → Confetti

| Step | Evidence | Result |
|------|----------|--------|
| Open Cadbury `9300617064879` Product Origins | `screen_origins_card.png`, `ui_origins_scroll.xml` | Made in Fiji visible |
| Add → Packed in → Australia → Local ingredients → Submit | `ui_origins_pre_admit.xml`, `screen_origins_pre_admit.png` | Statement: "This product is packed in Australia" |
| Celebration / confetti success | `ui_origins_after_submit2.xml`, `screen_origins_after_submit2.png` | "You made a difference!" / contribution added |
| Keep exploring → Result refresh | `ui_origins_post_admit_result.xml`, `screen_origins_post_admit_result.png` | Made in Fiji + Packed in Australia |
| Authoritative snapshot | `cadbury_origins_snapshot_post_ui_admit.json` | `origins\|made_in` Fiji seq 363; `origins\|packed_in` Australia seq 364 |

## Snapshot POST 403 vs authorised GET

| Call | Result |
|------|--------|
| GET `/api/evidence-authority?barcode=…` | 200 authorised snapshot read |
| POST action `"snapshot"` | 403 `mvp_preselected_only_evidence_action_forbidden` |
| POST free-form finalize | 403 same policy |

Evidence: `probe_snapshot_get_vs_post.js`, `probe_snapshot_get_vs_post_out.json`, unit `mvpEaActionPolicy.snapshotRead.test.ts`.  
Reconcile after lost submit ack: unit `reconcileAfterLostSubmitAck.test.ts` (PASS).

## Packet Claims Agree persistence + Correct path (`9300652817232`)

| Check | Evidence | Result |
|-------|----------|--------|
| Claims visible | `screen_packet_card.png`, `ui_packet_card_full.xml` | High calcium / Low sugar / 7 Vitamins & Minerals / High Fibre |
| Agree persistence | `screen_packet_agree_persisted.png` | `You already agreed. 1 person agrees` |
| Correct path | `ui_packet_correct_alert.xml`, `screen_packet_correct_alert.png` | Alert "Correction not available yet" — non-mutating; not a submitting Correct journey |
| Switch/reset | unit `wp09PacketPersistenceAndCorrectPath.test.ts` | Agree once per revision; count resets on new admitted version |

**Packet Correct complete journey:** still FAIL / unresolved (honest unavailable only).

## Automated suites at exact tip

See `baseline_contracts_at_46f3913.txt`, `jest_review_followup.txt`, `baseline_contracts_run_meta.txt`.  
7/7 baseline contracts PASS; 14 behavioural/policy tests PASS across 4 suites.

## Explicitly unresolved

- CF-04 / FM-03R server eligibility (STOPPED)
- Packet Correct structured destination incomplete
- iOS TestFlight not run
- Legal publication + legal preflight BLOCKED
- Gate 2 / Gate 3 NOT PASSED
- `publicReleaseStatus: BLOCKED`
