CREATE TABLE IF NOT EXISTS evidence_contributors (
  contributor_id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  account_id TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_subjects (
  subject_id TEXT PRIMARY KEY,
  barcode TEXT NOT NULL,
  domain TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE (barcode, subject_key)
);

CREATE TABLE IF NOT EXISTS evidence_submissions (
  idempotency_key TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL,
  barcode TEXT NOT NULL,
  outcome_json JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_source_assets (
  asset_id TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  content_type TEXT,
  bytes BYTEA NOT NULL,
  verified BOOLEAN NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_asset_chunks (
  upload_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_count INTEGER NOT NULL,
  total_bytes INTEGER NOT NULL,
  declared_sha256 TEXT NOT NULL,
  chunk_bytes BYTEA NOT NULL,
  PRIMARY KEY (upload_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS evidence_asset_uploads (
  upload_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES evidence_source_assets(asset_id),
  sha256 TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_regions (
  region_id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES evidence_source_assets(asset_id),
  transform_json JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_admission_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  next_seq BIGINT NOT NULL
);

INSERT INTO evidence_admission_counter (id, next_seq)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS evidence_versions (
  version_id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES evidence_subjects(subject_id),
  version_no INTEGER NOT NULL,
  submission_key TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  content_json JSONB NOT NULL,
  source_asset_id TEXT REFERENCES evidence_source_assets(asset_id),
  region_id TEXT,
  admission_status TEXT NOT NULL,
  admission_seq BIGINT UNIQUE,
  governance_state TEXT NOT NULL,
  authority_epoch TEXT NOT NULL,
  authority_record_class TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  UNIQUE (subject_id, version_no)
);

CREATE INDEX IF NOT EXISTS evidence_subjects_barcode_idx
  ON evidence_subjects (barcode);

CREATE TABLE IF NOT EXISTS evidence_events (
  event_id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES evidence_versions(version_id),
  kind TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  detail_json JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_responses (
  response_id TEXT PRIMARY KEY,
  version_id TEXT NOT NULL REFERENCES evidence_versions(version_id),
  contributor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL,
  UNIQUE (version_id, contributor_id)
);

CREATE TABLE IF NOT EXISTS evidence_off_dispatch (
  dispatch_id TEXT PRIMARY KEY,
  submission_key TEXT NOT NULL,
  version_id TEXT NOT NULL REFERENCES evidence_versions(version_id),
  barcode TEXT NOT NULL,
  status TEXT NOT NULL,
  target TEXT,
  fields_json JSONB NOT NULL,
  lineage_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  read_back_status TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

ALTER TABLE evidence_off_dispatch ADD COLUMN IF NOT EXISTS lineage_json JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION evidence_versions_content_immutable() RETURNS trigger AS $$
BEGIN
  IF NEW.content_json IS DISTINCT FROM OLD.content_json
     OR NEW.version_no IS DISTINCT FROM OLD.version_no
     OR NEW.subject_id IS DISTINCT FROM OLD.subject_id
     OR NEW.contributor_id IS DISTINCT FROM OLD.contributor_id
     OR NEW.source_asset_id IS DISTINCT FROM OLD.source_asset_id
     OR (OLD.admission_seq IS NOT NULL AND NEW.admission_seq IS DISTINCT FROM OLD.admission_seq)
  THEN
    RAISE EXCEPTION 'evidence_version_content_immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_versions_content_immutable_trg ON evidence_versions;
CREATE TRIGGER evidence_versions_content_immutable_trg
  BEFORE UPDATE ON evidence_versions
  FOR EACH ROW EXECUTE PROCEDURE evidence_versions_content_immutable();

CREATE OR REPLACE FUNCTION evidence_events_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'evidence_events_append_only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_events_no_update ON evidence_events;
CREATE TRIGGER evidence_events_no_update
  BEFORE UPDATE ON evidence_events
  FOR EACH ROW EXECUTE PROCEDURE evidence_events_append_only();

DROP TRIGGER IF EXISTS evidence_events_no_delete ON evidence_events;
CREATE TRIGGER evidence_events_no_delete
  BEFORE DELETE ON evidence_events
  FOR EACH ROW EXECUTE PROCEDURE evidence_events_append_only();
