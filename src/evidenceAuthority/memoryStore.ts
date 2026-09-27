import type {
  ContributorRecord,
  DispatchRecord,
  EventRecord,
  ResponseRecord,
  SubmissionOutcome,
  VersionRecord,
} from './types';
import type { AuthorityStore, AuthorityTx, SubjectRow } from './store';

type MemoryState = {
  contributors: ContributorRecord[];
  subjects: SubjectRow[];
  submissions: Array<{ key: string; contributorId: string; barcode: string; outcome: SubmissionOutcome }>;
  assets: Array<{ assetId: string; sha256: string; bytes: Uint8Array; contentType: string | null }>;
  regions: Array<{ regionId: string; assetId: string; transform: Record<string, number> }>;
  versions: VersionRecord[];
  events: EventRecord[];
  responses: ResponseRecord[];
  dispatches: DispatchRecord[];
  admissionSeq: number;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryAuthorityStore implements AuthorityStore {
  private state: MemoryState = {
    contributors: [],
    subjects: [],
    submissions: [],
    assets: [],
    regions: [],
    versions: [],
    events: [],
    responses: [],
    dispatches: [],
    admissionSeq: 0,
  };
  private chain: Promise<void> = Promise.resolve();

  transaction<T>(fn: (tx: AuthorityTx) => Promise<T> | T): Promise<T> {
    const run = this.chain.then(async () => {
      const snapshot = clone(this.state);
      try {
        return await fn(this.tx());
      } catch (error) {
        this.state = snapshot;
        throw error;
      }
    });
    this.chain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  async saveContributor(row: ContributorRecord): Promise<void> {
    if (this.state.contributors.some((item) => item.tokenHash === row.tokenHash)) {
      throw new Error('contributor_token_exists');
    }
    this.state.contributors.push(clone(row));
  }

  async findContributorByTokenHash(tokenHash: string): Promise<ContributorRecord | null> {
    return this.state.contributors.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async linkAccount(contributorId: string, accountId: string): Promise<void> {
    const row = this.state.contributors.find((item) => item.contributorId === contributorId);
    if (!row) throw new Error('contributor_missing');
    row.accountId = accountId;
  }

  dangerouslyRewriteContent(): void {
    throw new Error('evidence_version_content_immutable');
  }

  private tx(): AuthorityTx {
    const state = this.state;
    return {
      async getSubmission(key) {
        const found = state.submissions.find((item) => item.key === key)?.outcome ?? null;
        return found ? clone(found) : null;
      },
      async putSubmission(record) {
        if (state.submissions.some((item) => item.key === record.key)) {
          throw new Error('idempotency_key_exists');
        }
        state.submissions.push(clone(record));
      },
      async putAsset(asset) {
        state.assets.push({ ...asset, bytes: asset.bytes.slice() });
      },
      async putRegion(region) {
        state.regions.push(clone(region));
      },
      async ensureSubject(row) {
        const existing = state.subjects.find(
          (item) => item.barcode === row.barcode && item.subjectKey === row.subjectKey
        );
        if (existing) return existing;
        state.subjects.push(row);
        return row;
      },
      async nextVersionNo(subjectId) {
        const versions = state.versions.filter((item) => item.subjectId === subjectId);
        return versions.reduce((max, item) => Math.max(max, item.versionNo), 0) + 1;
      },
      async insertVersion(row) {
        if (state.versions.some((item) => item.subjectId === row.subjectId && item.versionNo === row.versionNo)) {
          throw new Error('evidence_version_collision');
        }
        if (row.admissionSeq != null && state.versions.some((item) => item.admissionSeq === row.admissionSeq)) {
          throw new Error('admission_seq_collision');
        }
        state.versions.push(clone(row));
      },
      async getVersion(versionId) {
        const found = state.versions.find((item) => item.versionId === versionId);
        return found ? clone(found) : null;
      },
      async versionsForBarcode(barcode) {
        return state.versions.filter((item) => item.barcode === barcode).map((item) => clone(item));
      },
      async updateGovernance(versionId, governance) {
        const row = state.versions.find((item) => item.versionId === versionId);
        if (!row) throw new Error('version_missing');
        row.governance = governance;
      },
      async appendEvent(event) {
        state.events.push(clone(event));
      },
      async eventsForVersion(versionId) {
        return state.events.filter((item) => item.versionId === versionId).map((item) => clone(item));
      },
      async putResponse(row) {
        if (state.responses.some((item) => item.versionId === row.versionId && item.contributorId === row.contributorId)) {
          throw new Error('active_response_exists');
        }
        state.responses.push(clone(row));
      },
      async responsesForVersion(versionId) {
        return state.responses.filter((item) => item.versionId === versionId).map((item) => clone(item));
      },
      async nextAdmissionSeq() {
        state.admissionSeq += 1;
        return state.admissionSeq;
      },
      async putDispatch(row) {
        state.dispatches.push(clone(row));
      },
      async dispatchesForBarcode(barcode) {
        return state.dispatches.filter((item) => item.barcode === barcode).map((item) => clone(item));
      },
      async updateDispatch(dispatchId, patch) {
        const row = state.dispatches.find((item) => item.dispatchId === dispatchId);
        if (!row) throw new Error('dispatch_missing');
        row.status = patch.status;
        if (patch.readBackStatus) row.readBackStatus = patch.readBackStatus;
      },
    };
  }
}
