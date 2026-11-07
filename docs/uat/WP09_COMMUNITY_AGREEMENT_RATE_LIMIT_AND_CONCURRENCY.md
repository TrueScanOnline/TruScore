# WP-09 Community Agreements — rate limits and revision concurrency

## Rate limits (WP09-R2)

**Production / UAT API** uses durable Postgres buckets in `community_agreement_rate_buckets` (same DATABASE_URL as Evidence Authority). Process-memory maps are **test/local only** (`createMemoryAgreementAbuseGuard`).

| Dimension | Limit | Key material |
|---|---|---|
| Contributor credential | 30 POSTs / rolling minute | Bearer → `contributor_id` |
| Edge client key | 60 POSTs / rolling minute | Vercel `X-Forwarded-For` / `X-Real-IP` (not body fields) |
| Barcode | 120 POSTs / rolling minute | Request barcode |

Independent controls (always on): UNIQUE agreement row, self-agreement rejection, stale-revision 409.

### Deployment prerequisites

1. Apply `db/migrations/20261107_wp09_community_agreements.sql` (agreements **and** rate buckets) to the target DB — **not done in this package**.
2. Deploy `/api/community-agreement` after schema apply.
3. Optional hardening: Vercel WAF / firewall rule on `POST /api/community-agreement` (platform config; not invented in-app).
4. UAT verification: exceed each limit from two instances (or sequential bursts) and expect HTTP 429; confirm counts remain correct for allowed POSTs.

Production activation remains **blocked** until the migration is applied. Without the rate-bucket table the API returns 503 `community_agreements_schema_unavailable`.

## Revision concurrency (WP09 additional check)

POST flow:

1. Authenticate contributor.
2. Load Evidence Authority snapshot.
3. Derive revision from prevailing pairs; reject if `expectedRevisionId` mismatches.
4. Abuse / rate-limit check.
5. **Second snapshot read** (`revalidateSnapshot`) and re-derive revision; reject on mismatch.
6. `INSERT` into `community_agreements` keyed by that `revision_id` (UNIQUE per credential).

**Guarantee:** An agreement row is always for the `revision_id` validated against the snapshot(s) in that request. A newer admitted revision has a different `revision_id` and starts at count 0. Agreements never transfer to a newer revision or inflate its counter.

**Not claimed:** Steps 2–6 and Evidence Authority admission are **not** one atomic cross-store transaction. A contribution admitted between the final snapshot revalidation and insert can still leave a historical increment on the **previous** revision; the new revision’s displayed count remains unaffected. Strengthening that further would require changing Evidence Authority admission behaviour (out of WP-09 scope).
