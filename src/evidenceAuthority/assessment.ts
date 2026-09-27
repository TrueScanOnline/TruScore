import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_PRODUCTION_CONTRIBUTION_EPOCH } from '../contributions/productionEpoch';
import type { ContributionEvidence } from '../contributions/types';
import type { AuthorityEnv, SharedEvidenceSnapshot } from './types';

export type AssessmentLoad = {
  evidence: ContributionEvidence[];
  offDispatchStatus: string | null;
  source: 'remote' | 'cache' | 'none';
};

function appAuthorityEnv(): AuthorityEnv {
  return process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV === 'production' ? 'production' : 'uat';
}

function cacheKey(env: AuthorityEnv, barcode: string): string {
  return `@rveel_evidence_snapshot_v1:${env}:${barcode}`;
}

export function projectSnapshotForAssessment(
  snapshot: SharedEvidenceSnapshot | null,
  appEnv: AuthorityEnv = appAuthorityEnv()
): ContributionEvidence[] {
  if (!snapshot || snapshot.authorityEnv !== appEnv) return [];
  return snapshot.prevailing.map((row) => {
    const evidence: ContributionEvidence = { ...row.evidence, confirmations: [], disputes: [] };
    if (appEnv !== 'production') {
      evidence.productionEpoch = CURRENT_PRODUCTION_CONTRIBUTION_EPOCH;
      evidence.recordClass = 'production';
    }
    if (evidence.domain === 'packet_claims') {
      evidence.variantKey = row.subjectKey;
    }
    return evidence;
  });
}

async function readCache(env: AuthorityEnv, barcode: string): Promise<SharedEvidenceSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(env, barcode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SharedEvidenceSnapshot;
    if (parsed?.authorityEnv !== env || parsed.barcode !== barcode) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeCache(snapshot: SharedEvidenceSnapshot): Promise<void> {
  await AsyncStorage.setItem(cacheKey(snapshot.authorityEnv, snapshot.barcode), JSON.stringify(snapshot));
}

export async function rememberSnapshot(snapshot: SharedEvidenceSnapshot): Promise<void> {
  await writeCache(snapshot);
}

/**
 * Authoritative snapshot, then the read-only device cache.
 * A miss of both yields no contribution evidence. Local unsent rows are not read.
 */
export async function loadAuthoritativeAssessment(
  barcode: string | undefined,
  deps?: { fetchSnapshot?: (barcode: string) => Promise<SharedEvidenceSnapshot | null> }
): Promise<AssessmentLoad> {
  const env = appAuthorityEnv();
  if (!barcode) return { evidence: [], offDispatchStatus: null, source: 'none' };
  const fetchSnapshot = deps?.fetchSnapshot ?? defaultFetchSnapshot;
  try {
    const remote = await fetchSnapshot(barcode);
    if (remote && remote.authorityEnv === env && remote.barcode === barcode) {
      await writeCache(remote);
      return {
        evidence: projectSnapshotForAssessment(remote, env),
        offDispatchStatus: remote.offDispatch[0]?.status ?? null,
        source: 'remote',
      };
    }
    return { evidence: [], offDispatchStatus: null, source: 'remote' };
  } catch {
    const cached = await readCache(env, barcode);
    if (cached) {
      return {
        evidence: projectSnapshotForAssessment(cached, env),
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
