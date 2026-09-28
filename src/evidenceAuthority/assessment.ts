import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/backendConfig';
import { CURRENT_PRODUCTION_CONTRIBUTION_EPOCH } from '../contributions/productionEpoch';
import type { ContributionEvidence } from '../contributions/types';
import type { AuthorityEnv, SharedEvidenceSnapshot } from './types';

export type AssessmentLoad = {
  evidence: ContributionEvidence[];
  offDispatchStatus: string | null;
  source: 'remote' | 'cache' | 'none';
};

/** A slow authority must not hold every Result open. */
export const SNAPSHOT_FETCH_TIMEOUT_MS = 8000;
/** Read cache is not a second authority. */
export const SNAPSHOT_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

type CacheEnvelope = {
  savedAt: number;
  snapshot: SharedEvidenceSnapshot;
};

function backendCacheScope(): string {
  return getBackendUrl() || 'unconfigured-backend';
}

function cacheKey(barcode: string): string {
  return `@rveel_evidence_snapshot_v1:${backendCacheScope()}:${barcode}`;
}

/**
 * Acceptance guard only. This value does not stamp, create, or alter evidence.
 * Unset or unknown builds fail closed.
 */
export function expectedAuthorityEnv(
  raw: string | undefined = process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV
): AuthorityEnv | null {
  if (raw === 'uat' || raw === 'production') return raw;
  return null;
}

/**
 * Server stamps stay on the snapshot. A build accepts a snapshot only when
 * snapshot.authorityEnv matches its expected environment.
 * Frozen receivers still require the production epoch gate, so a matched UAT
 * snapshot is presented through an ephemeral copy of that gate. The copy is
 * not written back onto the snapshot or the authority record.
 */
export function projectSnapshotForAssessment(
  snapshot: SharedEvidenceSnapshot | null,
  expected: AuthorityEnv | null = expectedAuthorityEnv()
): ContributionEvidence[] {
  if (!snapshot || !expected || snapshot.authorityEnv !== expected) return [];
  return snapshot.prevailing.map((row) => {
    const evidence: ContributionEvidence = {
      ...row.evidence,
      confirmations: [],
      disputes: [],
    };
    if (snapshot.authorityEnv === 'uat') {
      evidence.productionEpoch = CURRENT_PRODUCTION_CONTRIBUTION_EPOCH;
      evidence.recordClass = 'production';
    }
    return evidence;
  });
}

async function readCache(
  barcode: string,
  now: number,
  maxAgeMs: number
): Promise<SharedEvidenceSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(barcode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!parsed?.snapshot || parsed.snapshot.barcode !== barcode || typeof parsed.savedAt !== 'number') return null;
    if (now - parsed.savedAt > maxAgeMs) return null;
    return parsed.snapshot;
  } catch {
    return null;
  }
}

async function writeCache(snapshot: SharedEvidenceSnapshot, now: number): Promise<void> {
  const envelope: CacheEnvelope = { savedAt: now, snapshot };
  await AsyncStorage.setItem(cacheKey(snapshot.barcode), JSON.stringify(envelope));
}

export async function rememberSnapshot(snapshot: SharedEvidenceSnapshot, now = Date.now()): Promise<void> {
  await writeCache(snapshot, now);
}

/**
 * Authoritative snapshot from the configured backend, then a bounded read cache.
 * A miss of both yields no contribution evidence. Local unsent rows are not read.
 */
export async function loadAuthoritativeAssessment(
  barcode: string | undefined,
  deps?: {
    fetchSnapshot?: (barcode: string) => Promise<SharedEvidenceSnapshot | null>;
    now?: () => number;
    maxAgeMs?: number;
    timeoutMs?: number;
  }
): Promise<AssessmentLoad> {
  if (!barcode) return { evidence: [], offDispatchStatus: null, source: 'none' };
  const now = deps?.now ?? Date.now;
  const maxAgeMs = deps?.maxAgeMs ?? SNAPSHOT_CACHE_MAX_AGE_MS;
  const fetchSnapshot = deps?.fetchSnapshot ?? ((value: string) => defaultFetchSnapshot(value, deps?.timeoutMs));
  try {
    const remote = await fetchSnapshot(barcode);
    if (remote && remote.barcode === barcode) {
      await writeCache(remote, now());
      return {
        evidence: projectSnapshotForAssessment(remote),
        offDispatchStatus: remote.offDispatch[0]?.status ?? null,
        source: 'remote',
      };
    }
    return { evidence: [], offDispatchStatus: null, source: 'remote' };
  } catch {
    const cached = await readCache(barcode, now(), maxAgeMs);
    if (cached) {
      return {
        evidence: projectSnapshotForAssessment(cached),
        offDispatchStatus: cached.offDispatch[0]?.status ?? null,
        source: 'cache',
      };
    }
    return { evidence: [], offDispatchStatus: null, source: 'none' };
  }
}

async function defaultFetchSnapshot(
  barcode: string,
  timeoutMs = SNAPSHOT_FETCH_TIMEOUT_MS
): Promise<SharedEvidenceSnapshot | null> {
  const base = getBackendUrl();
  if (!base || typeof fetch !== 'function') throw new Error('evidence_authority_unavailable');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `${base.replace(/\/$/, '')}/api/evidence-authority?barcode=${encodeURIComponent(barcode)}`,
      { signal: controller.signal }
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('evidence_authority_unavailable');
    const body = (await response.json()) as { snapshot?: SharedEvidenceSnapshot };
    return body.snapshot ?? null;
  } finally {
    clearTimeout(timer);
  }
}
