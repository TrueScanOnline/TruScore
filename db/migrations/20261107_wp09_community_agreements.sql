-- WP-09 Community Agreements (display-only sidecar).
-- Do not apply automatically from request handlers.
-- Apply explicitly per environment when authorised:
--   node backend/vercel/scripts/apply-community-agreements-schema.cjs

CREATE TABLE IF NOT EXISTS community_agreements (
  agreement_id TEXT PRIMARY KEY,
  authority_env TEXT NOT NULL,
  barcode TEXT NOT NULL,
  variant_key TEXT NOT NULL DEFAULT '',
  card_group TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  revision_pairs TEXT[] NOT NULL,
  contributor_id TEXT NOT NULL REFERENCES evidence_contributors (contributor_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_agreements_unique_credential
    UNIQUE (authority_env, barcode, variant_key, card_group, revision_id, contributor_id)
);

CREATE INDEX IF NOT EXISTS community_agreements_revision_idx
  ON community_agreements (authority_env, barcode, variant_key, card_group, revision_id);

-- Durable WP09-R2 rate-limit buckets (shared across serverless instances).
-- Bucket key format: {dim}|{authority_env}|{id}|{window_start_ms}
CREATE TABLE IF NOT EXISTS community_agreement_rate_buckets (
  bucket_key TEXT PRIMARY KEY,
  window_start_ms BIGINT NOT NULL,
  hit_count INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
