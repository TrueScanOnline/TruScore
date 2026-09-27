import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContributionEvidence } from '../contributions/types';
import type { SharedEvidenceSnapshot } from './types';

export type AssessmentLoad = {
  evidence: ContributionEvidence[];
  offDispatchStatus: string | null;
  source: 'remote' | 'cache' | 'none';
};

function backendCacheScope(): string {
  return process.env.EXPO_PUBLIC_BACKEND_URL || 'unconfigured-backend';
}

function cacheKey(barcode: string): string {
  return `@rveel_evidence_snapshot_v1:${backendCacheScope()}:${barcode}`;
}

/**
 * The connected backend's snapshot is the outcome. This does not read or
 * stamp an evidence epoch or record class.
 * Packet rows keep the authority subject in the variant slot the frozen
 * Packet Claims receiver already uses to separate subjects.
 */
export function projectSnapshotForAssessment(
  snapshot: SharedEvidenceSnapshot | null
): ContributionEvidence[] {
  if (!snapshot) return [];
  return snapshot.prevailing.map((row) => {
    const evidence: ContributionEvidence = { ...row.evidence, confirmations: [], disputes: [] };
    if (evidence.domain === 'packet_claims') {
      evidence.variantKey = row.subjectKey;
    }
    return evidence;
  });
}

async function readCache(barcode: string): Promise<SharedEvidenceSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(barcode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SharedEvidenceSnapshot;
    if (!parsed || parsed.barcode !== barcode) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(snapshot: SharedEvidenceSnapshot): Promise<void> {
  await AsyncStorage.setItem(cacheKey(snapshot.barcode), JSON.stringify(snapshot));
}

export async function rememberSnapshot(snapshot: SharedEvidenceSnapshot): Promise<void> {
  await writeCache(snapshot);
}

/**
 * Authoritative snapshot from the configured backend, then the read-only cache.
 * A miss of both yields no contribution evidence. Local unsent rows are not read.
 */
export async function loadAuthoritativeAssessment(
  barcode: string | undefined,
  deps?: { fetchSnapshot?: (barcode: string) => Promise<SharedEvidenceSnapshot | null> }
): Promise<AssessmentLoad> {
  if (!barcode) return { evidence: [], offDispatchStatus: null, source: 'none' };
  const fetchSnapshot = deps?.fetchSnapshot ?? defaultFetchSnapshot;
  try {
    const remote = await fetchSnapshot(barcode);
    if (remote && remote.barcode === barcode) {
      await writeCache(remote);
      return {
        evidence: projectSnapshotForAssessment(remote),
        offDispatchStatus: remote.offDispatch[0]?.status ?? null,
        source: 'remote',
      };
    }
    return { evidence: [], offDispatchStatus: null, source: 'remote' };
  } catch {
    const cached = await readCache(barcode);
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

async function defaultFetchSnapshot(barcode: string): Promise<SharedEvidenceSnapshot | null> {
  const base = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  if (!base || typeof fetch !== 'function') throw new Error('evidence_authority_unavailable');
  const response = await fetch(
    `${base.replace(/\/$/, '')}/api/evidence-authority?barcode=${encodeURIComponent(barcode)}`
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('evidence_authority_unavailable');
  const body = (await response.json()) as { snapshot?: SharedEvidenceSnapshot };
  return body.snapshot ?? null;
}
