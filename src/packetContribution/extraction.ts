import { getSession, upsertSession } from './sessionStore';
import type {
  ExtractionProducerKind,
  ExtractionRun,
  ExtractionStatus,
  MachineObservation,
  PacketContributionSession,
  PacketEvidenceUnit,
  SupportCoverage,
} from './types';

export type ExtractionProducer = {
  id: string;
  kind: ExtractionProducerKind;
  modelName?: string;
  modelVersion?: string;
  configurationId?: string;
  extract(input: {
    session: PacketContributionSession;
  }): Promise<{
    status: ExtractionStatus;
    statusDetail: string;
    observations: Array<Omit<MachineObservation, 'observationId'>>;
  }>;
};

/** Default producer. Failure and abstention stay explicit. */
export const abstainingExtractionProducer: ExtractionProducer = {
  id: 'rveel.abstaining',
  kind: 'abstaining',
  modelName: 'none',
  modelVersion: 'wave4a.1',
  configurationId: 'no-provider',
  async extract() {
    return {
      status: 'abstained',
      statusDetail: 'No extraction producer is configured. Nothing was read from the packet.',
      observations: [],
    };
  },
};

function supportIsKnown(session: PacketContributionSession, support: SupportCoverage): boolean {
  const source = session.sourceAssets.some((asset) => asset.assetId === support.sourceAssetId);
  if (!source) return false;
  if (support.coverage === 'region') {
    return session.derivedAssets.some(
      (derived) =>
        derived.derivedAssetId === support.derivedAssetId && derived.sourceAssetId === support.sourceAssetId
    );
  }
  return true;
}

export async function runExtraction(params: {
  sessionId: string;
  producer?: ExtractionProducer;
  now?: number;
}): Promise<{ session: PacketContributionSession; run: ExtractionRun }> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const producer = params.producer || abstainingExtractionProducer;
  const startedAt = params.now ?? Date.now();
  let status: ExtractionStatus = 'failed';
  let statusDetail = 'Extraction failed before a result was produced.';
  let observations: MachineObservation[] = [];
  try {
    const result = await producer.extract({ session });
    status = result.status;
    statusDetail = result.statusDetail;
    if (status === 'observations') {
      observations = result.observations
        .filter((observation) => observation.text.trim() && supportIsKnown(session, observation.support))
        .map((observation, index) => ({
          ...observation,
          observationId: `obs_${startedAt}_${index + 1}`,
        }));
      if (observations.length === 0) {
        status = 'abstained';
        statusDetail = 'The producer returned no supported observations.';
      }
    } else {
      observations = [];
    }
  } catch (error) {
    status = 'failed';
    statusDetail = error instanceof Error ? error.message : 'extraction_failed';
    observations = [];
  }
  const run: ExtractionRun = {
    runId: `run_${session.sessionId}_${session.extractionRuns.length + 1}`,
    sessionId: session.sessionId,
    producerId: producer.id,
    producerKind: producer.kind,
    modelName: producer.modelName,
    modelVersion: producer.modelVersion,
    configurationId: producer.configurationId,
    status,
    statusDetail,
    observations,
    startedAt,
    finishedAt: params.now ?? Date.now(),
  };
  const units: PacketEvidenceUnit[] =
    status === 'observations'
      ? observations.map((observation, index) => ({
          unitId: `eu_${run.runId}_${index + 1}`,
          sessionId: session.sessionId,
          domain: 'unspecified',
          statement: observation.text,
          support: observation.support,
          origin: 'machine_proposal' as const,
          extractionRunId: run.runId,
          observationId: observation.observationId,
          disposition: null,
          status: 'open' as const,
        }))
      : [];
  const saved = await upsertSession({
    ...session,
    extractionRuns: [...session.extractionRuns, run],
    units: [...session.units, ...units],
  });
  return { session: saved, run };
}

export function extractionSucceeded(run: ExtractionRun): boolean {
  return run.status === 'observations' && run.observations.length > 0;
}
