import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/backendConfig';
import { sha256Hex } from '../packetContribution/sha256';
import { getSession } from '../packetContribution/sessionStore';
import type { PacketContributionSession, PacketEvidenceUnit } from '../packetContribution/types';
import { governedCertificationLabels } from '../contributions/certificationLane';
import { expectedAuthorityEnv, rememberSnapshot } from './assessment';
import {
  beginRetryTrace,
  noteTransmitEnter,
  noteTransmitLeave,
  type ContributionTrace,
  type TraceRequestKind,
  type TraceRequestOutcome,
} from './contributionTrace';
import type { ManualTextDraft } from './manualTextAsset';
import type { EvidenceFactInput, SharedEvidenceSnapshot, SubmissionOutcome } from './types';
import { classifyInterruptedResume, resumeMarkerFor } from '../evidenceImage/resumeGuard';
import type { EvidenceResumeMarker, InterruptedResumeRecord } from '../packetContribution/types';

const OUTBOX_KEY = '@rveel_evidence_outbox_v1';
const CREDENTIAL_KEY = '@rveel_evidence_contributor_credential_v1';
/** Raw bytes per request. Base64 of this stays inside one Vercel body. */
export const EVIDENCE_ASSET_CHUNK_BYTES = 256 * 1024;
/** A stalled authority request becomes durable outbox state instead of an open wait. */
const AUTHORITY_REQUEST_TIMEOUT_MS = 20000;

type AdmissionListener = (barcode: string, snapshot: SharedEvidenceSnapshot) => void;
const admissionListeners = new Set<AdmissionListener>();

export function subscribeEvidenceAdmission(listener: AdmissionListener): () => void {
  admissionListeners.add(listener);
  return () => {
    admissionListeners.delete(listener);
  };
}

function notifyEvidenceAdmission(barcode: string, snapshot: SharedEvidenceSnapshot): void {
  for (const listener of admissionListeners) listener(barcode, snapshot);
}

async function timedAuthorityFetch(
  trace: ContributionTrace | null,
  kind: TraceRequestKind,
  run: (signal: AbortSignal) => Promise<Response>
): Promise<{ response: Response | null; outcome: TraceRequestOutcome; status: number | null }> {
  const started = Date.now();
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AUTHORITY_REQUEST_TIMEOUT_MS);
  let outcome: TraceRequestOutcome = 'network_error';
  let status: number | null = null;
  let response: Response | null = null;
  try {
    response = await run(controller.signal);
    status = response.status;
    outcome = response.ok ? 'ok' : 'http_error';
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    outcome = timedOut ? 'timeout' : name === 'AbortError' ? 'abort' : 'network_error';
  } finally {
    clearTimeout(timer);
    trace?.request({
      kind,
      durationMs: Date.now() - started,
      outcome,
      status,
      timeoutMs: AUTHORITY_REQUEST_TIMEOUT_MS,
    });
  }
  return { response, outcome, status };
}

type UnitRef = { unitId: string; revision: string };

type OutboxItem = {
  idempotencyKey: string;
  sessionId: string;
  barcode: string;
  unitRefs: UnitRef[];
  status: 'unsent' | 'acknowledged' | 'refused';
  createdAt: number;
  ceasedSubjectKeys?: string[];
  resumeInProgress?: EvidenceResumeMarker;
  interruptedResume?: InterruptedResumeRecord;
};

export type SubmissionResumeAttention = {
  idempotencyKey: string;
  sessionId: string;
  interruptedAt: number;
  attempt: number;
};

export type AuthorityTransmitResult = {
  admitted: boolean;
  admittedUnitIds: string[];
  pendingOutbox: boolean;
  /** Reviewed facts are held until the private image is verified. This is not admission. */
  pendingImage?: boolean;
  snapshot: SharedEvidenceSnapshot | null;
};

function randomKey(): string {
  const bytes = new Uint8Array(16);
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

export function splitAssetChunks(bytes: Uint8Array, chunkBytes = EVIDENCE_ASSET_CHUNK_BYTES): Uint8Array[] {
  if (!bytes.length) return [];
  const parts: Uint8Array[] = [];
  for (let index = 0; index < bytes.length; index += chunkBytes) {
    parts.push(bytes.subarray(index, Math.min(bytes.length, index + chunkBytes)));
  }
  return parts;
}

function sameRefs(left: UnitRef[], right: UnitRef[]): boolean {
  if (left.length !== right.length) return false;
  const key = (ref: UnitRef) => `${ref.unitId}:${ref.revision}`;
  const wanted = new Set(right.map(key));
  return left.every((ref) => wanted.has(key(ref)));
}

export function unitRevision(unit: PacketEvidenceUnit): string {
  return sha256Hex(
    new TextEncoder().encode(
      JSON.stringify({
        unitId: unit.unitId,
        domain: unit.domain,
        section: unit.section ?? null,
        statement: unit.statement,
        correctionText: unit.correctionText ?? null,
        packetAbsence: unit.packetAbsenceAffirmation === true,
        nutritionBasis: unit.nutritionBasis ?? null,
        nutritionAmounts: unit.nutritionAmounts ?? null,
        originClaimType: unit.originClaimType ?? null,
        originCountry: unit.originCountry ?? null,
        originCountries: unit.originCountries ?? null,
        originPercentage: unit.originPercentage ?? null,
        originPercentageQualifier: unit.originPercentageQualifier ?? null,
        originQualification: unit.originQualification ?? null,
        ingredientSubject: unit.ingredientSubject ?? null,
        support: unit.support,
      })
    )
  );
}

async function readOutbox(): Promise<OutboxItem[]> {
  const raw = await AsyncStorage.getItem(OUTBOX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OutboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: OutboxItem[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
}

async function patchOutbox(
  idempotencyKey: string,
  patch: { resumeInProgress?: OutboxItem['resumeInProgress'] | null; interruptedResume?: InterruptedResumeRecord | null }
): Promise<void> {
  const items = await readOutbox();
  await writeOutbox(
    items.map((item) => {
      if (item.idempotencyKey !== idempotencyKey) return item;
      const next: OutboxItem = { ...item };
      if ('resumeInProgress' in patch) {
        if (patch.resumeInProgress) next.resumeInProgress = patch.resumeInProgress;
        else delete next.resumeInProgress;
      }
      if ('interruptedResume' in patch) {
        if (patch.interruptedResume) next.interruptedResume = patch.interruptedResume;
        else delete next.interruptedResume;
      }
      return next;
    })
  );
}

export async function listUnsentSubmissions(): Promise<OutboxItem[]> {
  return (await readOutbox()).filter((item) => item.status === 'unsent' && item.unitRefs?.length);
}

function provenanceFor(
  session: PacketContributionSession,
  unit: PacketEvidenceUnit,
  finalizedAssetIds: ReadonlyMap<string, string>
): Pick<EvidenceFactInput, 'finalizedAssetId' | 'companionFinalizedAssetIds' | 'derivedAssetId' | 'region' | 'machineRunId' | 'unitId'> {
  const derived =
    unit.support.coverage === 'region'
      ? session.derivedAssets.find((asset) => asset.derivedAssetId === unit.support.derivedAssetId)
      : undefined;
  const region = derived?.transform.kind === 'region' ? derived.transform : undefined;
  const companions = (unit.companionSourceAssetIds || [])
    .map((assetId) => finalizedAssetIds.get(assetId))
    .filter((assetId): assetId is string => !!assetId);
  return {
    unitId: unit.unitId,
    machineRunId: unit.extractionRunId || undefined,
    finalizedAssetId: finalizedAssetIds.get(unit.support.sourceAssetId),
    ...(companions.length > 0 ? { companionFinalizedAssetIds: companions } : {}),
    derivedAssetId: unit.support.coverage === 'region' ? unit.support.derivedAssetId : undefined,
    region: region ? { x: region.x, y: region.y, width: region.width, height: region.height } : undefined,
  };
}

export function evidenceFactsForUnits(
  session: PacketContributionSession,
  units: PacketEvidenceUnit[],
  finalizedAssetIds: ReadonlyMap<string, string>
): EvidenceFactInput[] {
  return units.flatMap((unit) => factsFromUnit(session, unit, provenanceFor(session, unit, finalizedAssetIds)));
}

function factsFromUnit(
  session: PacketContributionSession,
  unit: PacketEvidenceUnit,
  provenance: Pick<EvidenceFactInput, 'finalizedAssetId' | 'derivedAssetId' | 'region' | 'machineRunId' | 'unitId'>
): EvidenceFactInput[] {
  if (unit.domain === 'ingredients_nutrition') {
    return [
      {
        ...provenance,
        domain: 'ingredients_nutrition',
        variantKey: session.variantKey,
        ingredientsText: unit.section === 'nutrition' ? undefined : unit.statement,
        nutriments: unit.section === 'nutrition' ? unit.nutritionAmounts : undefined,
        nutritionBasis: unit.nutritionBasis,
      },
    ];
  }
  if (unit.domain === 'packet_claims' && unit.packetAbsenceAffirmation === true) {
    return [{ ...provenance, domain: 'packet_claims', packetAbsence: true, variantKey: session.variantKey }];
  }
  if (unit.domain === 'packet_claims') {
    return [
      {
        ...provenance,
        domain: 'packet_claims',
        exactWording: unit.statement,
        claimValue: unit.statement,
        variantKey: session.variantKey,
      },
    ];
  }
  if (unit.domain === 'origins' && unit.originClaimType && unit.originClaimType !== 'other') {
    return [
      {
        ...provenance,
        domain: 'origins',
        ...(unit.statement.trim() ? { exactWording: unit.statement.trim() } : {}),
        claimValue: unit.originCountry || unit.ingredientSubject || unit.statement,
        variantKey: session.variantKey,
        originStructured: {
          claimType: unit.originClaimType,
          primaryCountry: unit.originCountry?.trim() || '',
          countries: unit.originCountries,
          ingredientSubject: unit.ingredientSubject,
          ingredientOriginPercentage: unit.originPercentage,
          percentageQualifier: unit.originPercentageQualifier,
          originQualification: unit.originQualification,
          originQualifications: unit.originQualifications,
          percentageNotStated: unit.percentageNotStated === true,
        },
      },
    ];
  }
  if (unit.domain === 'certifications' && unit.statement.trim()) {
    const labelsTags = governedCertificationLabels(unit.statement);
    return [
      {
        ...provenance,
        domain: 'certifications',
        claimValue: unit.statement,
        exactWording: unit.statement,
        ...(labelsTags ? { labelsTags } : {}),
        ...(unit.certificationScope ? { certificationScope: unit.certificationScope } : {}),
        ...(unit.certificationScopeSubject ? { certificationScopeSubject: unit.certificationScopeSubject } : {}),
        variantKey: session.variantKey,
      },
    ];
  }
  return [];
}

function authorityUrl(): string {
  return `${getBackendUrl().replace(/\/$/, '')}/api/evidence-authority`;
}

/** Acceptance guard only. The server still stamps environment and epoch. */
async function targetAuthorityAccepted(trace: ContributionTrace | null): Promise<boolean> {
  const expected = expectedAuthorityEnv();
  if (!expected) {
    trace?.mark('authority_check_end', 'failed');
    return false;
  }
  trace?.mark('authority_check_begin');
  const result = await timedAuthorityFetch(trace, 'authority_env', (signal) =>
    fetch(authorityUrl(), { method: 'GET', signal, headers: trace?.headers() })
  );
  trace?.flush('authority_check');
  if (!result.response || result.outcome !== 'ok') {
    trace?.mark('authority_check_end', result.outcome === 'ok' ? 'failed' : result.outcome);
    return false;
  }
  try {
    const body = (await result.response.json()) as { authorityEnv?: string };
    const accepted = body.authorityEnv === expected;
    trace?.mark('authority_check_end', accepted ? 'ok' : 'failed');
    return accepted;
  } catch {
    trace?.mark('authority_check_end', 'failed');
    return false;
  }
}

export async function contributorCredential(trace: ContributionTrace | null): Promise<string> {
  return credentialToken(trace);
}

export async function postContributorAction(
  token: string,
  body: Record<string, unknown>,
  trace: ContributionTrace | null,
  kind: TraceRequestKind
): Promise<Response> {
  return postAuthority(token, body, trace, kind);
}

async function credentialToken(trace: ContributionTrace | null): Promise<string> {
  trace?.mark('credential_begin');
  const existing = await AsyncStorage.getItem(CREDENTIAL_KEY);
  if (existing) {
    trace?.mark('credential_end', 'cache_hit');
    return existing;
  }
  const result = await timedAuthorityFetch(trace, 'issue_credential', (signal) =>
    fetch(authorityUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(trace?.headers() ?? {}) },
      body: JSON.stringify({ action: 'issue-credential' }),
      signal,
    })
  );
  trace?.flush('credential');
  if (!result.response || result.outcome !== 'ok') {
    trace?.mark('credential_end', result.outcome === 'ok' ? 'failed' : result.outcome);
    throw new Error('contributor_credential_unavailable');
  }
  const body = (await result.response.json()) as { token?: string };
  if (!body.token) {
    trace?.mark('credential_end', 'failed');
    throw new Error('contributor_credential_unavailable');
  }
  await AsyncStorage.setItem(CREDENTIAL_KEY, body.token);
  trace?.mark('credential_end', 'cache_miss');
  return body.token;
}

async function postAuthority(
  token: string,
  body: Record<string, unknown>,
  trace: ContributionTrace | null,
  kind: TraceRequestKind
): Promise<Response> {
  const result = await timedAuthorityFetch(trace, kind, (signal) =>
    fetch(authorityUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(trace?.headers() ?? {}),
      },
      body: JSON.stringify(body),
      signal,
    })
  );
  trace?.flush(kind);
  if (!result.response) throw new Error(result.outcome);
  return result.response;
}

async function finalizeManualTextAsset(
  token: string,
  session: PacketContributionSession,
  unit: PacketEvidenceUnit,
  trace: ContributionTrace | null
): Promise<string> {
  const labels = unit.domain === 'certifications' ? governedCertificationLabels(unit.statement) : undefined;
  const draft: ManualTextDraft = {
    barcode: session.barcode,
    variantKey: session.variantKey,
    sessionId: session.sessionId,
    unitId: unit.unitId,
    domain: unit.domain as ManualTextDraft['domain'],
    statement: unit.statement,
    ingredientsText: unit.domain === 'ingredients_nutrition' && unit.section !== 'nutrition' ? unit.statement : undefined,
    nutritionBasis: unit.nutritionBasis,
    nutritionAmounts: unit.nutritionAmounts,
    originClaimType: unit.originClaimType,
    originCountry: unit.originCountry,
    originCountries: unit.originCountries,
    originPercentage: unit.originPercentage,
    originPercentageQualifier: unit.originPercentageQualifier,
    originQualification: unit.originQualification,
    originQualifications: unit.originQualifications,
    percentageNotStated: unit.percentageNotStated === true,
    ingredientSubject: unit.ingredientSubject,
    labelsTags: labels,
    packetAbsence: unit.packetAbsenceAffirmation === true,
  };
  const response = await postAuthority(token, {
    action: 'finalize-manual-text',
    barcode: draft.barcode,
    variantKey: draft.variantKey,
    sessionId: draft.sessionId,
    unitId: draft.unitId,
    domain: draft.domain,
    statement: draft.statement,
    ingredientsText: draft.ingredientsText,
    nutritionBasis: draft.nutritionBasis,
    nutritionAmounts: draft.nutritionAmounts,
    originClaimType: draft.originClaimType,
    originCountry: draft.originCountry,
    originCountries: draft.originCountries,
    originPercentage: draft.originPercentage,
    originPercentageQualifier: draft.originPercentageQualifier,
    originQualification: draft.originQualification,
    originQualifications: draft.originQualifications,
    percentageNotStated: draft.percentageNotStated === true,
    ingredientSubject: draft.ingredientSubject,
    labelsTags: draft.labelsTags,
    packetAbsence: draft.packetAbsence,
  }, trace, 'finalize_manual_text');
  if (!response.ok) throw new Error('manual_text_not_finalized');
  const body = (await response.json()) as { assetId?: string };
  if (!body.assetId) throw new Error('manual_text_not_finalized');
  return body.assetId;
}

export async function transmitSessionToAuthority(
  sessionId: string,
  trace?: ContributionTrace,
  ceasedSubjectKeys?: string[]
): Promise<AuthorityTransmitResult> {
  const none: AuthorityTransmitResult = { admitted: false, admittedUnitIds: [], pendingOutbox: false, snapshot: null };
  const active = trace ?? beginRetryTrace();
  noteTransmitEnter(active);
  try {
    return await transmitSession(sessionId, active, none, ceasedSubjectKeys);
  } finally {
    noteTransmitLeave(active);
    active.flush('transmit_leave');
  }
}

/** Removal of the last prevailing subject has no new fact. The closure still withdraws it. */
export async function transmitPrevailingClosure(
  barcode: string,
  ceasedSubjectKeys: string[],
  trace?: ContributionTrace
): Promise<AuthorityTransmitResult> {
  const none: AuthorityTransmitResult = { admitted: false, admittedUnitIds: [], pendingOutbox: false, snapshot: null };
  const keys = [...new Set(ceasedSubjectKeys.map((key) => key.trim()).filter((key) => key.length > 0))];
  if (!barcode || keys.length === 0) return none;
  const active = trace ?? beginRetryTrace();
  try {
    if (!(await targetAuthorityAccepted(active))) return none;
    const token = await credentialToken(active);
    const response = await postAuthority(
      token,
      {
        action: 'submit',
        idempotencyKey: randomKey(),
        barcode,
        facts: [],
        ceasedSubjectKeys: keys,
      },
      active,
      'submit'
    );
    if (!response.ok) return { ...none, pendingOutbox: true };
    const body = (await response.json()) as { outcome?: SubmissionOutcome };
    const snapshot = body.outcome?.snapshot ?? null;
    if (body.outcome?.status === 'admitted' && snapshot) {
      await rememberSnapshot(snapshot);
      notifyEvidenceAdmission(barcode, snapshot);
      return { admitted: true, admittedUnitIds: [], pendingOutbox: false, snapshot };
    }
    return { ...none, snapshot };
  } catch {
    return { ...none, pendingOutbox: true };
  } finally {
    active.flush('closure_leave');
  }
}

async function transmitSession(
  sessionId: string,
  trace: ContributionTrace,
  none: AuthorityTransmitResult,
  ceasedSubjectKeys?: string[]
): Promise<AuthorityTransmitResult> {
  const session = await getSession(sessionId);
  if (!session) return none;
  const items = await readOutbox();
  const acknowledged = new Set(
    items
      .filter((item) => item.status === 'acknowledged')
      .flatMap((item) => item.unitRefs || [])
      .map((ref) => `${ref.unitId}:${ref.revision}`)
  );
  const pendingUnits = session.units.filter(
    (unit) => unit.status === 'reviewed' && !acknowledged.has(`${unit.unitId}:${unitRevision(unit)}`)
  );
  if (pendingUnits.length === 0) return none;
  trace.setDomains(pendingUnits.map((unit) => unit.domain));
  if (!(await targetAuthorityAccepted(trace))) return none;
  const unitRefs = pendingUnits.map((unit) => ({ unitId: unit.unitId, revision: unitRevision(unit) }));
  let item = items.find((row) => row.sessionId === sessionId && row.status === 'unsent' && sameRefs(row.unitRefs || [], unitRefs));
  if (!item) {
    item = {
      idempotencyKey: randomKey(),
      sessionId,
      barcode: session.barcode,
      unitRefs,
      ceasedSubjectKeys: ceasedSubjectKeys && ceasedSubjectKeys.length > 0 ? ceasedSubjectKeys : undefined,
      status: 'unsent',
      createdAt: Date.now(),
    };
    items.push(item);
    await writeOutbox(items);
  }
  if (ceasedSubjectKeys && ceasedSubjectKeys.length > 0) {
    item.ceasedSubjectKeys = ceasedSubjectKeys;
    await writeOutbox(items);
  }
  const sourceIds = [
    ...new Set(
      pendingUnits.flatMap((unit) => [unit.support.sourceAssetId, ...(unit.companionSourceAssetIds || [])])
    ),
  ];
  const finalized = new Map<string, string>();
  try {
    const token = await credentialToken(trace);
    trace.mark('finalisation_begin');
    for (const sourceId of sourceIds) {
      const source = session.sourceAssets.find((asset) => asset.assetId === sourceId);
      if (source?.imagePhase === 'available' && source.remoteAssetId) {
        finalized.set(sourceId, source.remoteAssetId);
        continue;
      }
      if (source && (source.imagePhase || source.privateKey.startsWith('packet/'))) {
        trace.mark('finalisation_end', 'pending_source');
        return { ...none, pendingOutbox: true, pendingImage: true };
      }
      const related = pendingUnits.filter((unit) => unit.support.sourceAssetId === sourceId);
      const manualOnly =
        related.length === 1 &&
        related[0].origin === 'manual' &&
        related[0].packetAbsenceAffirmation !== true &&
        related[0].support.sourceAssetId.startsWith('manual-text:');
      if (!manualOnly) {
        trace.mark('finalisation_end', 'failed');
        return { ...none, pendingOutbox: true };
      }
      finalized.set(sourceId, await finalizeManualTextAsset(token, session, related[0], trace));
    }
    trace.mark('finalisation_end', 'ok');
    const facts = evidenceFactsForUnits(session, pendingUnits, finalized);
    if (facts.length === 0 || facts.some((fact) => !fact.finalizedAssetId)) {
      return { ...none, pendingOutbox: true };
    }
    trace.mark('submit_request_begin');
    const response = await postAuthority(token, {
      action: 'submit',
      idempotencyKey: item.idempotencyKey,
      barcode: session.barcode,
      facts,
      ...(item.ceasedSubjectKeys && item.ceasedSubjectKeys.length > 0
        ? { ceasedSubjectKeys: item.ceasedSubjectKeys }
        : {}),
    }, trace, 'submit');
    if (!response.ok) {
      trace.mark('snapshot_received', 'http_error');
      return { ...none, pendingOutbox: true };
    }
    const body = (await response.json()) as { outcome?: SubmissionOutcome };
    const snapshot = body.outcome?.snapshot ?? null;
    const admittedUnitIds = body.outcome?.admittedUnitIds || [];
    if (body.outcome?.status === 'admitted' && admittedUnitIds.length > 0 && snapshot) {
      trace.mark('snapshot_received', 'admitted');
      await rememberSnapshot(snapshot);
      item.status = 'acknowledged';
      item.unitRefs = unitRefs.filter((ref) => admittedUnitIds.includes(ref.unitId));
      const refused = unitRefs.filter((ref) => !admittedUnitIds.includes(ref.unitId));
      if (refused.length > 0) {
        items.push({
          idempotencyKey: randomKey(),
          sessionId,
          barcode: session.barcode,
          unitRefs: refused,
          status: 'refused',
          createdAt: Date.now(),
        });
      }
      await writeOutbox(items);
      notifyEvidenceAdmission(session.barcode, snapshot);
      return { admitted: true, admittedUnitIds, pendingOutbox: false, snapshot };
    }
    if (body.outcome && body.outcome.status !== 'admitted' && body.outcome.status !== 'pending_source') {
      item.status = 'refused';
      await writeOutbox(items);
    }
    trace.mark('snapshot_received', 'refused');
    return { admitted: false, admittedUnitIds: [], pendingOutbox: item.status === 'unsent', snapshot };
  } catch {
    trace.mark('submit_failed', 'failed');
    return { ...none, pendingOutbox: true };
  }
}

export async function listSubmissionResumeAttention(): Promise<SubmissionResumeAttention[]> {
  return (await readOutbox())
    .filter((item) => item.status === 'unsent' && item.interruptedResume?.step === 'submission')
    .map((item) => ({
      idempotencyKey: item.idempotencyKey,
      sessionId: item.sessionId,
      interruptedAt: item.interruptedResume?.interruptedAt || item.createdAt,
      attempt: item.interruptedResume?.attempt || 0,
    }));
}

/** One manual send after automatic resume has parked the batch. The outbox row and its refs stay. */
export async function retryParkedEvidenceSubmission(idempotencyKey: string): Promise<void> {
  const item = (await readOutbox()).find((row) => row.idempotencyKey === idempotencyKey && row.interruptedResume);
  if (!item) return;
  await patchOutbox(idempotencyKey, {
    interruptedResume: null,
    resumeInProgress: resumeMarkerFor('submission', 1, Date.now()),
  });
  try {
    await transmitSessionToAuthority(item.sessionId);
  } finally {
    await patchOutbox(idempotencyKey, { resumeInProgress: null });
  }
}

let submissionRetrying = false;
let submissionRetryAgain = false;

async function retryUnsentEvidenceSubmissionsOnce(): Promise<void> {
  const unsent = await listUnsentSubmissions();
  const runnable: OutboxItem[] = [];
  for (const item of unsent) {
    if (item.interruptedResume) continue;
    let attempt = 1;
    if (item.resumeInProgress) {
      const decision = classifyInterruptedResume(item.resumeInProgress, Date.now());
      if (!decision.resume) {
        await patchOutbox(item.idempotencyKey, { resumeInProgress: null, interruptedResume: decision.park });
        continue;
      }
      attempt = decision.marker.attempt;
    }
    await patchOutbox(item.idempotencyKey, {
      resumeInProgress: resumeMarkerFor('submission', attempt, Date.now()),
    });
    runnable.push(item);
  }
  const sessionIds = [...new Set(runnable.map((item) => item.sessionId))];
  try {
    for (const sessionId of sessionIds) {
      await transmitSessionToAuthority(sessionId);
    }
  } finally {
    for (const item of runnable) {
      await patchOutbox(item.idempotencyKey, { resumeInProgress: null });
    }
  }
}

/** Retry completed unsent batches. Does not require the contribution modal. */
export async function retryUnsentEvidenceSubmissions(): Promise<void> {
  if (submissionRetrying) {
    submissionRetryAgain = true;
    return;
  }
  submissionRetrying = true;
  try {
    do {
      submissionRetryAgain = false;
      await retryUnsentEvidenceSubmissionsOnce();
    } while (submissionRetryAgain);
  } finally {
    submissionRetrying = false;
  }
}
