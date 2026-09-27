import type {
  ContributorRecord,
  DispatchRecord,
  EventRecord,
  GovernanceState,
  ResponseRecord,
  SubmissionOutcome,
  VersionRecord,
} from './types';

export type SubjectRow = {
  subjectId: string;
  barcode: string;
  domain: string;
  subjectKey: string;
  createdAt: number;
};

export type AuthorityTx = {
  getSubmission(key: string): Promise<SubmissionOutcome | null>;
  putSubmission(record: { key: string; contributorId: string; barcode: string; outcome: SubmissionOutcome }): Promise<void>;
  putAsset(asset: { assetId: string; sha256: string; bytes: Uint8Array; contentType: string | null }): Promise<void>;
  putRegion(region: {
    regionId: string;
    assetId: string;
    transform: { x: number; y: number; width: number; height: number };
  }): Promise<void>;
  ensureSubject(row: SubjectRow): Promise<SubjectRow>;
  nextVersionNo(subjectId: string): Promise<number>;
  insertVersion(row: VersionRecord): Promise<void>;
  getVersion(versionId: string): Promise<VersionRecord | null>;
  versionsForBarcode(barcode: string): Promise<VersionRecord[]>;
  updateGovernance(versionId: string, governance: GovernanceState): Promise<void>;
  appendEvent(event: EventRecord): Promise<void>;
  eventsForVersion(versionId: string): Promise<EventRecord[]>;
  putResponse(row: ResponseRecord): Promise<void>;
  responsesForVersion(versionId: string): Promise<ResponseRecord[]>;
  nextAdmissionSeq(): Promise<number>;
  putDispatch(row: DispatchRecord): Promise<void>;
  dispatchesForBarcode(barcode: string): Promise<DispatchRecord[]>;
  updateDispatch(
    dispatchId: string,
    patch: { status: DispatchRecord['status']; readBackStatus?: DispatchRecord['readBackStatus'] }
  ): Promise<void>;
};

export interface AuthorityStore {
  transaction<T>(fn: (tx: AuthorityTx) => Promise<T>): Promise<T>;
  saveContributor(row: ContributorRecord): Promise<void>;
  findContributorByTokenHash(tokenHash: string): Promise<ContributorRecord | null>;
  linkAccount(contributorId: string, accountId: string): Promise<void>;
}
