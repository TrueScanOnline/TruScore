import AsyncStorage from '@react-native-async-storage/async-storage';
import { carriesCurrentProductionEpoch } from '../contributions/productionEpoch';
import { getPrivateByteStore } from './sourceAssets';

export const WAVE4A1_UAT_CUTOVER_ID = 'wave4a.1';
export const WAVE4A1_UAT_CUTOVER_MARKER = '@rveel_wave4a1_uat_cutover';

export const GOVERNED_EVIDENCE_STORAGE_KEY = '@rveel_contribution_evidence_v1';
export const GOVERNED_RECOVERY_STORAGE_KEY = '@rveel_contribution_recovery_v1';

/**
 * Whole keys this cutover may delete.
 * The 4A.0 evidence and recovery stores are not in this list. They are pruned
 * in place so current production-epoch rows remain.
 */
export const UAT_CUTOVER_WHOLE_KEYS = [
  '@rveel_packet_contribution_sessions_v1',
  'manufacturing_country_submissions',
] as const;

export const UAT_CUTOVER_WHOLE_KEY_PREFIXES = ['@truescan_pending_contributions_'] as const;

export type UatCutoverReport = {
  removedWholeKeys: string[];
  prunedEvidenceIds: string[];
  retainedProductionEvidenceIds: string[];
  prunedRecoveryIds: string[];
  retainedProductionRecoveryIds: string[];
  clearedPacketObjects: string[];
};

function isWholeCutoverKey(key: string): boolean {
  if ((UAT_CUTOVER_WHOLE_KEYS as readonly string[]).includes(key)) return true;
  return UAT_CUTOVER_WHOLE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function parseObjectArray(raw: string | null): Record<string, unknown>[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((row) => row && typeof row === 'object') as Record<string, unknown>[];
  } catch {
    return null;
  }
}

function isProtectedProductionRecord(row: Record<string, unknown> | undefined): boolean {
  if (!row) return false;
  return carriesCurrentProductionEpoch({
    productionEpoch: typeof row.productionEpoch === 'string' ? row.productionEpoch : null,
    recordClass: typeof row.recordClass === 'string' ? row.recordClass : null,
  });
}

export async function resetWave4a1UatContributionState(): Promise<UatCutoverReport> {
  const keys = await AsyncStorage.getAllKeys();
  const removedWholeKeys = keys.filter((key) => isWholeCutoverKey(key));
  if (removedWholeKeys.length > 0) {
    await AsyncStorage.multiRemove(removedWholeKeys);
  }

  const prunedEvidenceIds: string[] = [];
  const retainedProductionEvidenceIds: string[] = [];
  const evidenceRows = parseObjectArray(await AsyncStorage.getItem(GOVERNED_EVIDENCE_STORAGE_KEY));
  if (evidenceRows) {
    const kept = evidenceRows.filter((row) => {
      if (isProtectedProductionRecord(row)) {
        if (typeof row.evidenceId === 'string') retainedProductionEvidenceIds.push(row.evidenceId);
        return true;
      }
      if (typeof row.evidenceId === 'string') prunedEvidenceIds.push(row.evidenceId);
      else prunedEvidenceIds.push('unidentified');
      return false;
    });
    if (prunedEvidenceIds.length > 0) {
      await AsyncStorage.setItem(GOVERNED_EVIDENCE_STORAGE_KEY, JSON.stringify(kept));
    }
  }

  const prunedRecoveryIds: string[] = [];
  const retainedProductionRecoveryIds: string[] = [];
  const recoveryRows = parseObjectArray(await AsyncStorage.getItem(GOVERNED_RECOVERY_STORAGE_KEY));
  if (recoveryRows) {
    const kept = recoveryRows.filter((row) => {
      const snapshot =
        row.evidenceSnapshot && typeof row.evidenceSnapshot === 'object'
          ? (row.evidenceSnapshot as Record<string, unknown>)
          : undefined;
      const recoveryId = typeof row.recoveryId === 'string' ? row.recoveryId : 'unidentified';
      if (isProtectedProductionRecord(snapshot)) {
        retainedProductionRecoveryIds.push(recoveryId);
        return true;
      }
      prunedRecoveryIds.push(recoveryId);
      return false;
    });
    if (prunedRecoveryIds.length > 0) {
      await AsyncStorage.setItem(GOVERNED_RECOVERY_STORAGE_KEY, JSON.stringify(kept));
    }
  }

  const clearedPacketObjects = await getPrivateByteStore().clearPacketObjects();
  return {
    removedWholeKeys,
    prunedEvidenceIds,
    retainedProductionEvidenceIds,
    prunedRecoveryIds,
    retainedProductionRecoveryIds,
    clearedPacketObjects,
  };
}

export async function ensureWave4a1UatCutoverOnce(): Promise<{ ran: boolean } & UatCutoverReport> {
  const empty: UatCutoverReport = {
    removedWholeKeys: [],
    prunedEvidenceIds: [],
    retainedProductionEvidenceIds: [],
    prunedRecoveryIds: [],
    retainedProductionRecoveryIds: [],
    clearedPacketObjects: [],
  };
  const marker = await AsyncStorage.getItem(WAVE4A1_UAT_CUTOVER_MARKER);
  if (marker === WAVE4A1_UAT_CUTOVER_ID) {
    return { ran: false, ...empty };
  }
  const report = await resetWave4a1UatContributionState();
  await AsyncStorage.setItem(WAVE4A1_UAT_CUTOVER_MARKER, WAVE4A1_UAT_CUTOVER_ID);
  return { ran: true, ...report };
}
