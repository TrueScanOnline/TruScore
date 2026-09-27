/**
 * Wave 4A.1 shared packet contribution contracts.
 * Machine output is proposal-only. Governed admission stays in Wave 4A.0.
 */

export const PACKET_SESSION_SCHEMA = 'wave4a.1' as const;

export type CaptureSource = 'camera' | 'gallery';

/** Set after capture. Users are not asked to classify a photo before taking it. */
export type SourceFraming = 'unspecified' | 'targeted' | 'broad';

export type LocationMetadataDisposition = 'stripped' | 'absent';

export type PacketSourceAsset = {
  assetId: string;
  sessionId: string;
  contentSha256: string;
  byteLength: number;
  /** Private local object key. Not a public upload URL. */
  privateKey: string;
  source: CaptureSource;
  framing: SourceFraming;
  locationMetadata: LocationMetadataDisposition;
  capturedAt: number;
  variantKey?: string;
};

export type DerivedTransform =
  | { kind: 'region'; x: number; y: number; width: number; height: number }
  | { kind: 'privacy_location_strip' };

export type PacketDerivedAsset = {
  derivedAssetId: string;
  sourceAssetId: string;
  transform: DerivedTransform;
  createdAt: number;
};

export type SupportCoverage =
  | { coverage: 'whole_image'; sourceAssetId: string }
  | { coverage: 'region'; sourceAssetId: string; derivedAssetId: string };

export type ExtractionStatus = 'observations' | 'abstained' | 'failed';

export type MachineObservation = {
  observationId: string;
  text: string;
  /** Optional. Absence is not a zero fact. */
  confidence?: number;
  alternatives?: string[];
  support: SupportCoverage;
};

export type ExtractionProducerKind = 'vlm' | 'ocr_assisted' | 'ocr_degraded' | 'abstaining' | 'other';

export type ExtractionRun = {
  runId: string;
  sessionId: string;
  producerId: string;
  producerKind: ExtractionProducerKind;
  modelName?: string;
  modelVersion?: string;
  configurationId?: string;
  status: ExtractionStatus;
  /** Human-readable abstention or failure. Never a blank product fact. */
  statusDetail: string;
  observations: MachineObservation[];
  startedAt: number;
  finishedAt: number;
};

export type ProposalStatus = 'open' | 'set_aside' | 'reviewed';

/** Later packages assign A/B/C/D. Null means no domain rule has classified the unit. */
export type ReviewDisposition = 'A' | 'B' | 'C' | 'D' | null;

export type ReviewAction =
  | 'accept'
  | 'acknowledge_correction'
  | 'choose_option'
  | 'recapture'
  | 'manual_entry'
  | 'set_aside';

export type EvidenceUnitDomain =
  | 'ingredients_nutrition'
  | 'origins'
  | 'certifications'
  | 'packet_claims'
  | 'unspecified';

export type PacketEvidenceUnit = {
  unitId: string;
  sessionId: string;
  domain: EvidenceUnitDomain;
  /** User-visible proposal or manual statement. Not governed truth. */
  statement: string;
  support: SupportCoverage;
  origin: 'machine_proposal' | 'manual';
  extractionRunId: string | null;
  observationId: string | null;
  disposition: ReviewDisposition;
  status: ProposalStatus;
  reviewAction?: ReviewAction;
  correctionText?: string;
  chosenOption?: string;
  /** Ingredients list versus nutrition facts. Omitted for other domains. */
  section?: 'ingredients' | 'nutrition';
  nutriments?: Record<string, number>;
  nutritionBasis?: 'per_100g' | 'per_serving';
  /** Set only after a governed submit (not admission). */
  governedEvidenceId?: string;
  submittedAt?: number;
};

export type PacketContributionSession = {
  schema: typeof PACKET_SESSION_SCHEMA;
  sessionId: string;
  barcode: string;
  variantKey?: string;
  createdAt: number;
  updatedAt: number;
  status: 'open' | 'closed';
  sourceAssets: PacketSourceAsset[];
  derivedAssets: PacketDerivedAsset[];
  extractionRuns: ExtractionRun[];
  units: PacketEvidenceUnit[];
};

export type StagedCapture = {
  stagedId: string;
  bytes: Uint8Array;
  source: CaptureSource;
  metadata?: Record<string, unknown>;
};
