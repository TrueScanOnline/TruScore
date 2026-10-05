import { serverTraceMark, serverTraceTransaction } from './contributionTrace';
import { assertEvidenceAuthoritySchemaReady } from '../truescan-src/evidenceAuthority/schemaReady';
import type { AuthorityStore, AuthorityTx, SubjectRow } from '../truescan-src/evidenceAuthority/store';
import type {
  AssetChunkRecord,
  ContributorRecord,
  DispatchRecord,
  EventRecord,
  GovernanceState,
  OffFieldLineage,
  ResponseRecord,
  SubmissionOutcome,
  VersionRecord,
} from '../truescan-src/evidenceAuthority/types';

type Queryable = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

type PoolLike = Queryable & {
  connect: () => Promise<Queryable & { release: () => void }>;
};

function text(value: unknown): string {
  return String(value ?? '');
}

function bytesOf(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return new Uint8Array(value);
  return new Uint8Array();
}

function versionFrom(row: Record<string, unknown>): VersionRecord {
  return {
    versionId: text(row.version_id),
    subjectId: text(row.subject_id),
    subjectKey: text(row.subject_key),
    barcode: text(row.barcode),
    domain: text(row.domain) as VersionRecord['domain'],
    versionNo: Number(row.version_no),
    submissionKey: text(row.submission_key),
    contributorId: text(row.contributor_id),
    content: row.content_json as VersionRecord['content'],
    sourceAssetId: text(row.source_asset_id),
    regionId: row.region_id ? text(row.region_id) : null,
    admissionStatus: text(row.admission_status) as VersionRecord['admissionStatus'],
    admissionSeq: row.admission_seq == null ? null : Number(row.admission_seq),
    governance: text(row.governance_state) as GovernanceState,
    authorityEpoch: text(row.authority_epoch),
    authorityRecordClass: text(row.authority_record_class) as VersionRecord['authorityRecordClass'],
    createdAt: Number(row.created_at),
  };
}

export class PostgresAuthorityStore implements AuthorityStore {
  private schemaReady = false;

  constructor(private readonly pool: PoolLike) {}

  /** Confirms the explicit migration has already been applied. Does not create tables. */
  async assertSchemaReady(): Promise<void> {
    if (this.schemaReady) return;
    const found = await this.pool.query(`SELECT to_regclass('public.evidence_versions') AS relation`);
    const relation = found.rows[0]?.relation;
    assertEvidenceAuthoritySchemaReady(relation == null ? null : String(relation));
    this.schemaReady = true;
  }

  async transaction<T>(fn: (tx: AuthorityTx) => Promise<T>): Promise<T> {
    serverTraceMark('db_connect_begin');
    await this.assertSchemaReady();
    const client = await this.pool.connect();
    serverTraceMark('db_connected');
    try {
      await client.query('BEGIN');
      serverTraceTransaction('begin');
      const result = await fn(this.tx(client));
      await client.query('COMMIT');
      serverTraceTransaction('commit');
      return result;
    } catch (error) {
      serverTraceTransaction('rollback');
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveContributor(row: ContributorRecord): Promise<void> {
    await this.assertSchemaReady();
    await this.pool.query(
      `INSERT INTO evidence_contributors (contributor_id, token_hash, account_id, created_at)
       VALUES ($1, $2, $3, $4)`,
      [row.contributorId, row.tokenHash, row.accountId, row.createdAt]
    );
  }

  async findContributorByTokenHash(tokenHash: string): Promise<ContributorRecord | null> {
    await this.assertSchemaReady();
    const found = await this.pool.query(
      `SELECT contributor_id, token_hash, account_id, created_at FROM evidence_contributors WHERE token_hash = $1`,
      [tokenHash]
    );
    const row = found.rows[0];
    if (!row) return null;
    return {
      contributorId: text(row.contributor_id),
      tokenHash: text(row.token_hash),
      accountId: row.account_id ? text(row.account_id) : null,
      createdAt: Number(row.created_at),
    };
  }

  async linkAccount(contributorId: string, accountId: string): Promise<void> {
    await this.assertSchemaReady();
    await this.pool.query(`UPDATE evidence_contributors SET account_id = $2 WHERE contributor_id = $1`, [
      contributorId,
      accountId,
    ]);
  }

  private tx(client: Queryable): AuthorityTx {
    return {
      async getSubmission(key) {
        const found = await client.query(`SELECT outcome_json FROM evidence_submissions WHERE idempotency_key = $1`, [key]);
        return (found.rows[0]?.outcome_json as SubmissionOutcome) ?? null;
      },
      async putSubmission(record) {
        await client.query(
          `INSERT INTO evidence_submissions (idempotency_key, contributor_id, barcode, outcome_json, created_at)
           VALUES ($1, $2, $3, $4::jsonb, $5)`,
          [record.key, record.contributorId, record.barcode, JSON.stringify(record.outcome), Date.now()]
        );
      },
      async putAsset(asset) {
        const bytes = asset.bytes ? Buffer.from(asset.bytes) : null;
        const byteLength = asset.byteLength ?? bytes?.byteLength ?? 0;
        await client.query(
          `INSERT INTO evidence_source_assets (
             asset_id, sha256, byte_length, content_type, bytes, verified, contributor_id, barcode, created_at,
             storage_kind, blob_pathname, image_width, image_height, profile_id, profile_version,
             lineage_sha256, lineage_byte_length, lineage_width, lineage_height
           ) VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            asset.assetId,
            asset.sha256,
            byteLength,
            asset.contentType,
            bytes,
            asset.contributorId,
            asset.barcode,
            Date.now(),
            asset.storageKind ?? 'postgres_bytes',
            asset.blobPathname ?? null,
            asset.imageWidth ?? null,
            asset.imageHeight ?? null,
            asset.profileId ?? null,
            asset.profileVersion ?? null,
            asset.lineageSha256 ?? null,
            asset.lineageByteLength ?? null,
            asset.lineageWidth ?? null,
            asset.lineageHeight ?? null,
          ]
        );
      },
      async getAsset(assetId) {
        const found = await client.query(
          `SELECT asset_id, sha256, verified, contributor_id, barcode, content_type, bytes
             FROM evidence_source_assets WHERE asset_id = $1`,
          [assetId]
        );
        const row = found.rows[0];
        if (!row || row.verified !== true) return null;
        return {
          assetId: text(row.asset_id),
          sha256: text(row.sha256),
          verified: true,
          contributorId: text(row.contributor_id),
          barcode: text(row.barcode),
          contentType: row.content_type == null ? null : text(row.content_type),
          bytes: bytesOf(row.bytes),
        };
      },
      async findVerifiedAssetByBinding(binding) {
        const found = await client.query(
          `SELECT asset_id, sha256 FROM evidence_source_assets
            WHERE sha256 = $1 AND contributor_id = $2 AND barcode = $3 AND content_type = $4 AND verified = TRUE
            LIMIT 1`,
          [binding.sha256, binding.contributorId, binding.barcode, binding.contentType]
        );
        const row = found.rows[0];
        return row ? { assetId: text(row.asset_id), sha256: text(row.sha256) } : null;
      },
      async putChunk(chunk: AssetChunkRecord) {
        const inserted = await client.query(
          `INSERT INTO evidence_asset_chunks (
             upload_id, chunk_index, chunk_count, total_bytes, declared_sha256, chunk_bytes
           ) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (upload_id, chunk_index) DO NOTHING
           RETURNING chunk_index`,
          [
            chunk.uploadId,
            chunk.chunkIndex,
            chunk.chunkCount,
            chunk.totalBytes,
            chunk.declaredSha256,
            Buffer.from(chunk.bytes),
          ]
        );
        if (inserted.rows.length > 0) return 'stored' as const;
        const existing = await client.query(
          `SELECT chunk_count, total_bytes, declared_sha256, chunk_bytes
           FROM evidence_asset_chunks WHERE upload_id = $1 AND chunk_index = $2`,
          [chunk.uploadId, chunk.chunkIndex]
        );
        const row = existing.rows[0];
        const storedBytes = row?.chunk_bytes;
        const sameBytes =
          Buffer.isBuffer(storedBytes) && Buffer.from(chunk.bytes).equals(storedBytes);
        const same =
          !!row &&
          Number(row.chunk_count) === chunk.chunkCount &&
          Number(row.total_bytes) === chunk.totalBytes &&
          text(row.declared_sha256) === chunk.declaredSha256 &&
          sameBytes;
        return same ? ('duplicate' as const) : ('conflict' as const);
      },
      async listChunks(uploadId) {
        const found = await client.query(
          `SELECT upload_id, chunk_index, chunk_count, total_bytes, declared_sha256, chunk_bytes
           FROM evidence_asset_chunks WHERE upload_id = $1 ORDER BY chunk_index ASC`,
          [uploadId]
        );
        return found.rows.map((row) => ({
          uploadId: text(row.upload_id),
          chunkIndex: Number(row.chunk_index),
          chunkCount: Number(row.chunk_count),
          totalBytes: Number(row.total_bytes),
          declaredSha256: text(row.declared_sha256),
          bytes: Uint8Array.from(Buffer.isBuffer(row.chunk_bytes) ? row.chunk_bytes : Buffer.from(row.chunk_bytes as Uint8Array)),
        }));
      },
      async finalizedUpload(uploadId) {
        const found = await client.query(
          `SELECT asset_id, sha256 FROM evidence_asset_uploads WHERE upload_id = $1`,
          [uploadId]
        );
        const row = found.rows[0];
        return row ? { assetId: text(row.asset_id), sha256: text(row.sha256) } : null;
      },
      async rememberFinalizedUpload(uploadId, assetId, sha256) {
        await client.query(
          `INSERT INTO evidence_asset_uploads (upload_id, asset_id, sha256) VALUES ($1, $2, $3)
           ON CONFLICT (upload_id) DO NOTHING`,
          [uploadId, assetId, sha256]
        );
      },
      async putRegion(region) {
        await client.query(
          `INSERT INTO evidence_regions (region_id, asset_id, transform_json, created_at) VALUES ($1, $2, $3::jsonb, $4)`,
          [region.regionId, region.assetId, JSON.stringify(region.transform), Date.now()]
        );
      },
      async ensureSubject(row: SubjectRow) {
        await client.query(
          `INSERT INTO evidence_subjects (subject_id, barcode, domain, subject_key, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (barcode, subject_key) DO NOTHING`,
          [row.subjectId, row.barcode, row.domain, row.subjectKey, row.createdAt]
        );
        const locked = await client.query(
          `SELECT subject_id, barcode, domain, subject_key, created_at
           FROM evidence_subjects WHERE barcode = $1 AND subject_key = $2 FOR UPDATE`,
          [row.barcode, row.subjectKey]
        );
        const found = locked.rows[0];
        return {
          subjectId: text(found.subject_id),
          barcode: text(found.barcode),
          domain: text(found.domain),
          subjectKey: text(found.subject_key),
          createdAt: Number(found.created_at),
        };
      },
      async nextVersionNo(subjectId) {
        const found = await client.query(
          `SELECT COALESCE(MAX(version_no), 0) + 1 AS next_no FROM evidence_versions WHERE subject_id = $1`,
          [subjectId]
        );
        return Number(found.rows[0].next_no);
      },
      async insertVersion(row) {
        await client.query(
          `INSERT INTO evidence_versions (
             version_id, subject_id, version_no, submission_key, contributor_id, content_json,
             source_asset_id, region_id, admission_status, admission_seq, governance_state,
             authority_epoch, authority_record_class, created_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14
           )`,
          [
            row.versionId,
            row.subjectId,
            row.versionNo,
            row.submissionKey,
            row.contributorId,
            JSON.stringify(row.content),
            row.sourceAssetId,
            row.regionId,
            row.admissionStatus,
            row.admissionSeq,
            row.governance,
            row.authorityEpoch,
            row.authorityRecordClass,
            row.createdAt,
          ]
        );
      },
      async getVersion(versionId) {
        const found = await client.query(
          `SELECT v.*, s.subject_key, s.barcode, s.domain
           FROM evidence_versions v
           JOIN evidence_subjects s ON s.subject_id = v.subject_id
           WHERE v.version_id = $1`,
          [versionId]
        );
        return found.rows[0] ? versionFrom(found.rows[0]) : null;
      },
      async versionsForBarcode(barcode) {
        const found = await client.query(
          `SELECT v.*, s.subject_key, s.barcode, s.domain
           FROM evidence_versions v
           JOIN evidence_subjects s ON s.subject_id = v.subject_id
           WHERE s.barcode = $1
           ORDER BY v.created_at ASC`,
          [barcode]
        );
        return found.rows.map(versionFrom);
      },
      async updateGovernance(versionId, governance) {
        await client.query(`UPDATE evidence_versions SET governance_state = $2 WHERE version_id = $1`, [
          versionId,
          governance,
        ]);
      },
      async appendEvent(event: EventRecord) {
        await client.query(
          `INSERT INTO evidence_events (event_id, version_id, kind, actor_id, detail_json, created_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
          [event.eventId, event.versionId, event.kind, event.actorId, JSON.stringify(event.detail), event.createdAt]
        );
      },
      async eventsForVersion(versionId) {
        const found = await client.query(
          `SELECT event_id, version_id, kind, actor_id, detail_json, created_at
           FROM evidence_events WHERE version_id = $1 ORDER BY created_at ASC`,
          [versionId]
        );
        return found.rows.map((row) => ({
          eventId: text(row.event_id),
          versionId: text(row.version_id),
          kind: text(row.kind),
          actorId: text(row.actor_id),
          detail: (row.detail_json as Record<string, unknown>) || {},
          createdAt: Number(row.created_at),
        }));
      },
      async putResponse(row: ResponseRecord) {
        await client.query(
          `INSERT INTO evidence_responses (response_id, version_id, contributor_id, kind, active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [row.responseId, row.versionId, row.contributorId, row.kind, row.active, row.createdAt]
        );
      },
      async responsesForVersion(versionId) {
        const found = await client.query(
          `SELECT response_id, version_id, contributor_id, kind, active, created_at
           FROM evidence_responses WHERE version_id = $1`,
          [versionId]
        );
        return found.rows.map((row) => ({
          responseId: text(row.response_id),
          versionId: text(row.version_id),
          contributorId: text(row.contributor_id),
          kind: text(row.kind) as ResponseRecord['kind'],
          active: row.active === true,
          createdAt: Number(row.created_at),
        }));
      },
      async nextAdmissionSeq() {
        const found = await client.query(
          `UPDATE evidence_admission_counter SET next_seq = next_seq + 1 WHERE id = 1 RETURNING next_seq`
        );
        return Number(found.rows[0].next_seq);
      },
      async putDispatch(row: DispatchRecord) {
        await client.query(
          `INSERT INTO evidence_off_dispatch (
             dispatch_id, submission_key, version_id, barcode, status, target, fields_json, lineage_json, read_back_status, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
          [
            row.dispatchId,
            row.submissionKey,
            row.versionId,
            row.barcode,
            row.status,
            row.target,
            JSON.stringify(row.fields),
            JSON.stringify(row.lineage),
            row.readBackStatus,
            row.createdAt,
          ]
        );
      },
      async dispatchesForBarcode(barcode) {
        const found = await client.query(
          `SELECT dispatch_id, submission_key, version_id, barcode, status, target, fields_json, lineage_json, read_back_status, created_at
           FROM evidence_off_dispatch WHERE barcode = $1 ORDER BY created_at ASC`,
          [barcode]
        );
        return found.rows.map((row) => ({
          dispatchId: text(row.dispatch_id),
          submissionKey: text(row.submission_key),
          versionId: text(row.version_id),
          barcode: text(row.barcode),
          status: text(row.status) as DispatchRecord['status'],
          target: row.target ? text(row.target) : null,
          fields: (row.fields_json as Record<string, string>) || {},
          lineage: (row.lineage_json as OffFieldLineage[]) || [],
          readBackStatus: text(row.read_back_status) as DispatchRecord['readBackStatus'],
          createdAt: Number(row.created_at),
        }));
      },
      async updateDispatch(dispatchId, patch) {
        await client.query(
          `UPDATE evidence_off_dispatch
           SET status = $2, read_back_status = COALESCE($3, read_back_status)
           WHERE dispatch_id = $1`,
          [dispatchId, patch.status, patch.readBackStatus ?? null]
        );
      },
    };
  }
}
