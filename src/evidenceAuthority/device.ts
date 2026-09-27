import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/backendConfig';
import { getPrivateByteStore } from '../packetContribution/sourceAssets';
import { getSession } from '../packetContribution/sessionStore';
import type { PacketContributionSession, PacketEvidenceUnit } from '../packetContribution/types';
import { rememberSnapshot } from './assessment';
import type { EvidenceFactInput, SharedEvidenceSnapshot, SubmissionOutcome } from './types';

const OUTBOX_KEY = '@rveel_evidence_outbox_v1';
const CREDENTIAL_KEY = '@rveel_evidence_contributor_credential_v1';

type OutboxItem = {
  idempotencyKey: string;
  sessionId: string;
  barcode: string;
  status: 'unsent' | 'acknowledged';
  createdAt: number;
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
  return (await readOutbox()).filter((item) => item.status === 'unsent');
}

function factsFromSession(session: PacketContributionSession): EvidenceFactInput[] {
  const facts: EvidenceFactInput[] = [];
  for (const unit of session.units) {
    if (unit.status !== 'reviewed') continue;
    facts.push(...factsFromUnit(session, unit));
  }
  return facts;
}

function factsFromUnit(session: PacketContributionSession, unit: PacketEvidenceUnit): EvidenceFactInput[] {
  if (unit.domain === 'ingredients_nutrition') {
    return [
      {
        domain: 'ingredients_nutrition',
        variantKey: session.variantKey,
        ingredientsText: unit.section === 'nutrition' ? undefined : unit.statement,
        nutriments: unit.section === 'nutrition' ? unit.nutritionAmounts : undefined,
        nutritionBasis: unit.nutritionBasis,
        machineRunId: unit.extractionRunId || undefined,
      },
    ];
  }
  if (unit.domain === 'packet_claims' && unit.packetAbsenceAffirmation === true) {
    return [{ domain: 'packet_claims', packetAbsence: true, variantKey: session.variantKey }];
  }
  if (unit.domain === 'packet_claims') {
    return [
      {
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
    return [
      {
        domain: 'certifications',
        claimValue: unit.statement,
        exactWording: unit.statement,
        labelsTags: [unit.statement],
        variantKey: session.variantKey,
      },
    ];
  }
  return [];
}

async function credentialToken(): Promise<string> {
  const existing = await AsyncStorage.getItem(CREDENTIAL_KEY);
  if (existing) return existing;
  const response = await fetch(`${getBackendUrl().replace(/\/$/, '')}/api/evidence-authority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'issue-credential' }),
  });
  if (!response.ok) throw new Error('contributor_credential_unavailable');
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error('contributor_credential_unavailable');
  await AsyncStorage.setItem(CREDENTIAL_KEY, body.token);
  return body.token;
}

export async function transmitSessionToAuthority(sessionId: string): Promise<{
  admitted: boolean;
  pendingOutbox: boolean;
  snapshot: SharedEvidenceSnapshot | null;
}> {
  const session = await getSession(sessionId);
  if (!session) return { admitted: false, pendingOutbox: false, snapshot: null };
  const items = await readOutbox();
  let item = items.find((row) => row.sessionId === sessionId);
  if (!item) {
    item = {
      idempotencyKey: randomKey(),
      sessionId,
      barcode: session.barcode,
      status: 'unsent',
      createdAt: Date.now(),
    };
    items.push(item);
    await writeOutbox(items);
  }
  if (item.status === 'acknowledged') {
    return { admitted: true, pendingOutbox: false, snapshot: null };
  }
  const source = session.sourceAssets[0];
  const bytes = source ? await getPrivateByteStore().get(source.privateKey) : null;
  if (!source || !bytes?.length) return { admitted: false, pendingOutbox: true, snapshot: null };
  try {
    const token = await credentialToken();
    const response = await fetch(`${getBackendUrl().replace(/\/$/, '')}/api/evidence-authority`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'submit',
        idempotencyKey: item.idempotencyKey,
        barcode: session.barcode,
        declaredSha256: source.contentSha256,
        contentType: 'application/octet-stream',
        sourceBase64: bytesToBase64(bytes),
        facts: factsFromSession(session),
      }),
    });
    if (!response.ok) return { admitted: false, pendingOutbox: true, snapshot: null };
    const body = (await response.json()) as { outcome?: SubmissionOutcome };
    const snapshot = body.outcome?.snapshot ?? null;
    if (body.outcome?.status === 'admitted' && snapshot) {
      await rememberSnapshot(snapshot);
      item.status = 'acknowledged';
      await writeOutbox(items);
      return { admitted: true, pendingOutbox: false, snapshot };
    }
    return { admitted: false, pendingOutbox: true, snapshot };
  } catch {
    return { admitted: false, pendingOutbox: true, snapshot: null };
  }
}
