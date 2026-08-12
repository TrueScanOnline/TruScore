import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl, BackendEndpoints } from '../config/backendConfig';
import { logger } from '../utils/logger';
import type { ContributionEvidence } from './types';

const STORAGE_KEY = '@rveel_contribution_evidence_v1';

async function readLocal(): Promise<ContributionEvidence[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ContributionEvidence[]) : [];
  } catch {
    return [];
  }
}

async function writeLocal(rows: ContributionEvidence[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export async function upsertLocalEvidence(evidence: ContributionEvidence): Promise<void> {
  const rows = await readLocal();
  const idx = rows.findIndex((r) => r.evidenceId === evidence.evidenceId);
  if (idx >= 0) rows[idx] = evidence;
  else rows.push(evidence);
  await writeLocal(rows);
}

export async function getLocalEvidenceForBarcode(barcode: string): Promise<ContributionEvidence[]> {
  const rows = await readLocal();
  return rows.filter((r) => r.barcode === barcode);
}

export async function getLocalEvidenceById(evidenceId: string): Promise<ContributionEvidence | null> {
  const rows = await readLocal();
  return rows.find((r) => r.evidenceId === evidenceId) || null;
}

/** Best-effort remote persist; failure must not block scan or local save. */
export async function persistEvidenceRemote(evidence: ContributionEvidence): Promise<boolean> {
  try {
    const endpoint = BackendEndpoints.contributionEvidence(getBackendUrl());
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        evidence,
        evidenceId: evidence.evidenceId,
        barcode: evidence.barcode,
        domain: evidence.domain,
        claimValue: evidence.claimValue,
        imageUrl: evidence.imageUrl,
        exactWording: evidence.exactWording,
      }),
    });
    return response.ok;
  } catch (error) {
    logger.warn('[contributions] remote evidence persist failed (non-blocking)', error);
    return false;
  }
}

export async function fetchRemoteEvidence(barcode: string): Promise<ContributionEvidence[]> {
  try {
    const endpoint = `${BackendEndpoints.contributionEvidence(getBackendUrl())}?barcode=${encodeURIComponent(barcode)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.evidence) ? (data.evidence as ContributionEvidence[]) : [];
  } catch {
    return [];
  }
}
