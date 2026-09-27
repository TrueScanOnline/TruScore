import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PacketContributionSession } from './types';

export const PACKET_SESSION_STORAGE_KEY = '@rveel_packet_contribution_sessions_v1';

export type SessionPersistence = {
  load(): Promise<PacketContributionSession[]>;
  save(rows: PacketContributionSession[]): Promise<void>;
};

const asyncStoragePersistence: SessionPersistence = {
  async load() {
    const raw = await AsyncStorage.getItem(PACKET_SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PacketContributionSession[];
    return Array.isArray(parsed) ? parsed : [];
  },
  async save(rows) {
    await AsyncStorage.setItem(PACKET_SESSION_STORAGE_KEY, JSON.stringify(rows));
  },
};

let persistence: SessionPersistence = asyncStoragePersistence;

export function __setSessionPersistenceForTests(next: SessionPersistence | null): void {
  persistence = next || asyncStoragePersistence;
}

export async function loadSessions(): Promise<PacketContributionSession[]> {
  return persistence.load();
}

export async function saveSessions(rows: PacketContributionSession[]): Promise<void> {
  await persistence.save(rows);
}

export async function upsertSession(session: PacketContributionSession): Promise<PacketContributionSession> {
  const rows = await loadSessions();
  const idx = rows.findIndex((row) => row.sessionId === session.sessionId);
  const next = { ...session, updatedAt: Date.now() };
  if (idx >= 0) rows[idx] = next;
  else rows.push(next);
  await saveSessions(rows);
  return next;
}

export async function getSession(sessionId: string): Promise<PacketContributionSession | null> {
  const rows = await loadSessions();
  return rows.find((row) => row.sessionId === sessionId) || null;
}

export async function openSessionForProduct(params: {
  barcode: string;
  variantKey?: string;
  now?: number;
}): Promise<PacketContributionSession> {
  const rows = await loadSessions();
  const existing = rows
    .filter(
      (row) =>
        row.status === 'open' &&
        row.barcode === params.barcode &&
        (row.variantKey || '') === (params.variantKey || '')
    )
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (existing) return existing;
  const now = params.now ?? Date.now();
  const created: PacketContributionSession = {
    schema: 'wave4a.1',
    sessionId: `pcs_${params.barcode}_${now}`,
    barcode: params.barcode,
    variantKey: params.variantKey,
    createdAt: now,
    updatedAt: now,
    status: 'open',
    sourceAssets: [],
    derivedAssets: [],
    extractionRuns: [],
    units: [],
  };
  await upsertSession(created);
  return created;
}
