import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/backendConfig';
import { getPrivateByteStore } from '../packetContribution/sourceAssets';
import { sha256Hex } from '../packetContribution/sha256';
import { getSession } from '../packetContribution/sessionStore';
import type { PacketContributionSession, PacketEvidenceUnit } from '../packetContribution/types';
import { governedCertificationLabels } from '../contributions/certificationLane';
import { expectedAuthorityEnv, rememberSnapshot } from './assessment';
import type { ManualTextDraft } from './manualTextAsset';
import type { EvidenceFactInput, SharedEvidenceSnapshot, SubmissionOutcome } from './types';

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

function authoritySignal(): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTHORITY_REQUEST_TIMEOUT_MS);
  if (typeof timer === 'object' && timer && 'unref' in timer && typeof timer.unref === 'function') {
    timer.unref();
  }
  return controller.signal;
}

type UnitRef = { unitId: string; revision: string };

type OutboxItem = {
  idempotencyKey: string;
  sessionId: string;
  barcode: string;
  unitRefs: UnitRef[];
  status: 'unsent' | 'acknowledged' | 'refused';
  createdAt: number;
};

export type AuthorityTransmitResult = {
  admitted: boolean;
  admittedUnitIds: string[];
  pendingOutbox: boolean;
  snapshot: SharedEvidenceSnapshot | null;
};

function randomKey(): string {
  const bytes = new Uint8Array(16);
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return globalThis.btoa(binary);
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
        exactWording: unit.statement,
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
async function targetAuthorityAccepted(): Promise<boolean> {
  const expected = expectedAuthorityEnv();
  if (!expected) return false;
  try {
    const response = await fetch(authorityUrl(), { method: 'GET', signal: authoritySignal() });
    if (!response.ok) return false;
    const body = (await response.json()) as { authorityEnv?: string };
    return body.authorityEnv === expected;
  } catch {
    return false;
  }
}

async function credentialToken(): Promise<string> {
  const existing = await AsyncStorage.getItem(CREDENTIAL_KEY);
  if (existing) return existing;
  const response = await fetch(authorityUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'issue-credential' }),
    signal: authoritySignal(),
  });
  if (!response.ok) throw new Error('contributor_credential_unavailable');
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error('contributor_credential_unavailable');
  await AsyncStorage.setItem(CREDENTIAL_KEY, body.token);
  return body.token;
}

async function postAuthority(token: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(authorityUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: authoritySignal(),
  });
}

async function finalizeManualTextAsset(token: string, session: PacketContributionSession, unit: PacketEvidenceUnit): Promise<string> {
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
    ingredientSubject: draft.ingredientSubject,
    labelsTags: draft.labelsTags,
    packetAbsence: draft.packetAbsence,
  });
  if (!response.ok) throw new Error('manual_text_not_finalized');
  const body = (await response.json()) as { assetId?: string };
  if (!body.assetId) throw new Error('manual_text_not_finalized');
  return body.assetId;
}

async function uploadFinalizedAsset(
  token: string,
  bytes: Uint8Array,
  declaredSha256: string,
  barcode: string
): Promise<string> {
  const uploadId = randomKey();
  const parts = splitAssetChunks(bytes);
  for (let index = 0; index < parts.length; index += 1) {
    const response = await postAuthority(token, {
      action: 'upload-asset-chunk',
      uploadId,
      chunkIndex: index,
      chunkCount: parts.length,
      totalBytes: bytes.length,
      declaredSha256,
      chunkBase64: bytesToBase64(parts[index]),
    });
    if (!response.ok) throw new Error('asset_chunk_failed');
  }
  const finalized = await postAuthority(token, {
    action: 'finalize-asset',
    uploadId,
    declaredSha256,
    barcode,
    contentType: 'application/octet-stream',
  });
  if (!finalized.ok) throw new Error('asset_not_finalized');
  const body = (await finalized.json()) as { assetId?: string };
  if (!body.assetId) throw new Error('asset_not_finalized');
  return body.assetId;
}

export async function transmitSessionToAuthority(sessionId: string): Promise<AuthorityTransmitResult> {
  const none: AuthorityTransmitResult = { admitted: false, admittedUnitIds: [], pendingOutbox: false, snapshot: null };
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
  if (!(await targetAuthorityAccepted())) return none;
  const unitRefs = pendingUnits.map((unit) => ({ unitId: unit.unitId, revision: unitRevision(unit) }));
  let item = items.find((row) => row.sessionId === sessionId && row.status === 'unsent' && sameRefs(row.unitRefs || [], unitRefs));
  if (!item) {
    item = {
      idempotencyKey: randomKey(),
      sessionId,
      barcode: session.barcode,
      unitRefs,
      status: 'unsent',
      createdAt: Date.now(),
    };
    items.push(item);
    await writeOutbox(items);
  }
  const sourceIds = [
    ...new Set(
      pendingUnits.flatMap((unit) => [unit.support.sourceAssetId, ...(unit.companionSourceAssetIds || [])])
    ),
  ];
  const finalized = new Map<string, string>();
  try {
    const token = await credentialToken();
    for (const sourceId of sourceIds) {
      const source = session.sourceAssets.find((asset) => asset.assetId === sourceId);
      const bytes = source ? await getPrivateByteStore().get(source.privateKey) : null;
      if (source && bytes?.length) {
        finalized.set(sourceId, await uploadFinalizedAsset(token, bytes, source.contentSha256, session.barcode));
        continue;
      }
      const related = pendingUnits.filter((unit) => unit.support.sourceAssetId === sourceId);
      const manualOnly =
        related.length === 1 &&
        related[0].origin === 'manual' &&
        related[0].packetAbsenceAffirmation !== true &&
        related[0].support.sourceAssetId.startsWith('manual-text:');
      if (!manualOnly) return { ...none, pendingOutbox: true };
      finalized.set(sourceId, await finalizeManualTextAsset(token, session, related[0]));
    }
    const facts = evidenceFactsForUnits(session, pendingUnits, finalized);
    if (facts.length === 0 || facts.some((fact) => !fact.finalizedAssetId)) {
      return { ...none, pendingOutbox: true };
    }
    const response = await postAuthority(token, {
      action: 'submit',
      idempotencyKey: item.idempotencyKey,
      barcode: session.barcode,
      facts,
    });
    if (!response.ok) return { ...none, pendingOutbox: true };
    const body = (await response.json()) as { outcome?: SubmissionOutcome };
    const snapshot = body.outcome?.snapshot ?? null;
    const admittedUnitIds = body.outcome?.admittedUnitIds || [];
    if (body.outcome?.status === 'admitted' && admittedUnitIds.length > 0 && snapshot) {
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
    return { admitted: false, admittedUnitIds: [], pendingOutbox: item.status === 'unsent', snapshot };
  } catch {
    return { ...none, pendingOutbox: true };
  }
}

/** Retry completed unsent batches. Does not require the contribution modal. */
export async function retryUnsentEvidenceSubmissions(): Promise<void> {
  const unsent = await listUnsentSubmissions();
  const sessionIds = [...new Set(unsent.map((item) => item.sessionId))];
  for (const sessionId of sessionIds) {
    await transmitSessionToAuthority(sessionId);
  }
}
