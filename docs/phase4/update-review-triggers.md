# Update review triggers

When the following change, run the paired review:

| Change | Review |
|--------|--------|
| `SOURCE_CONFIDENCE_MAP` or completeness thresholds | [confidence-and-coverage-rules.md](confidence-and-coverage-rules.md), claim-registry rows for “trust” / “sources”, golden baselines |
| Source order / new API | [source-priority-and-fallback-rules.md](source-priority-and-fallback-rules.md), golden `sources` arrays, observability dashboards |
| Phase timeouts / budgets | [performance-budgets.md](performance-budgets.md), UX copy for slow paths |
| `calculateTrustScore` weights | Golden scores, methodology doc, claim-drift-log |
| New user-visible signal copy | claim-registry.csv + claim-drift-log.md |
| `methodologyVersion` / TESTUME strings | All locale methodology JSON + Phase 2 generator scripts |
| Recall matcher logic | [data-ops-recall-matching-rules.md](data-ops-recall-matching-rules.md), golden recall edge pack |
| Premium gates on result | [alerts-v2-entitlement-matrix.md](alerts-v2-entitlement-matrix.md), store compliance |
| `EXPO_PUBLIC_ENABLE_FALLBACK_APIS` default | Legal/trust review, transparency strings |

## PR checklist snippet (for humans)

- [ ] Phase 2 registry updated if copy/class changed  
- [ ] Golden baseline ticket filed if scores/signals affected  
- [ ] Alerts taxonomy class assigned for any new banner  
