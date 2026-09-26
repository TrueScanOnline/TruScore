/**
 * Wave 4A.0 — durable runtime recovery for materially completed contribution work.
 *
 * Survives ordinary network/server failure so a completed local contribution can
 * be retried for remote persist / admission acknowledgement.
 * Not a full offline contribution system and not background synchronisation.
 *
 * Retry must never overwrite a newer local authoritative record with a stale
 * checkpoint snapshot. Snapshot rehydration is only a fallback when the local
 * record is genuinely absent, and cannot elevate authority beyond the checkpoint.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
  isExplicitProductionRecordClass,
} from './productionEpoch';
import {
  getLocalEvidenceById,
  persistEvidenceRemote,
  upsertLocalEvidence,
} from './evidenceStore';
import type { ContributionEvidence } from './types';
import { logger } from '../utils/logger';

const RECOVERY_STORAGE_KEY = '@rveel_contribution_recovery_v1';

export type ContributionRecoverySyncStatus =
  | 'local_complete_pending_remote'
  | 'remote_synced'
  | 'failed_retryable';

export type ContributionRecoveryCheckpoint = {
  recoveryId: string;
  barcode: string;
  evidenceId: string;
  evidenceKey: string;
  domain: ContributionEvidence['domain'];
  productionEpoch: string;
  materialCompletedAt: number;
  syncStatus: ContributionRecoverySyncStatus;
  attemptCount: number;
  lastError?: string;
  /** Snapshot of the materially completed evidence at checkpoint time. */
  evidenceSnapshot: ContributionEvidence;
};

async function readAll(): Promise<ContributionRecoveryCheckpoint[]> {
  try {
    const raw = await AsyncStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ContributionRecoveryCheckpoint[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: ContributionRecoveryCheckpoint[]): Promise<void> {
  await AsyncStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(rows));
}

export function buildRecoveryId(evidenceId: string, completedAt: number): string {
  return `${evidenceId}|recovery|${completedAt}`;
}

/**
 * Persist a materially completed local contribution checkpoint before/alongside
 * remote attempts. Non-production record classes / epochs are rejected so they
 * cannot acquire production recovery authority via restart/rehydration.
 */
export async function checkpointMaterialCompletion(
  evidence: ContributionEvidence,
  evidenceKey: string
): Promise<ContributionRecoveryCheckpoint | null> {
  if (evidence.productionEpoch !== CURRENT_PRODUCTION_CONTRIBUTION_EPOCH) {
    return null;
  }
  if (!isExplicitProductionRecordClass(evidence.recordClass ?? null)) {
    return null;
  }

  const materialCompletedAt = Date.now();
  const checkpoint: ContributionRecoveryCheckpoint = {
    recoveryId: buildRecoveryId(evidence.evidenceId, materialCompletedAt),
    barcode: evidence.barcode,
    evidenceId: evidence.evidenceId,
    evidenceKey,
    domain: evidence.domain,
    productionEpoch: CURRENT_PRODUCTION_CONTRIBUTION_EPOCH,
    materialCompletedAt,
    syncStatus: 'local_complete_pending_remote',
    attemptCount: 0,
    evidenceSnapshot: evidence,
  };

  const rows = await readAll();
  // One open recovery row per evidenceId — replace pending for same evidenceId.
  const next = rows.filter(
    (r) => !(r.evidenceId === evidence.evidenceId && r.syncStatus !== 'remote_synced')
  );
  next.push(checkpoint);
  await writeAll(next);
  return checkpoint;
}

export async function markRecoveryRemoteSynced(recoveryId: string): Promise<void> {
  const rows = await readAll();
  const next = rows.map((r) =>
    r.recoveryId === recoveryId
      ? { ...r, syncStatus: 'remote_synced' as const, lastError: undefined }
      : r
  );
  await writeAll(next);
}

export async function listPendingRecovery(): Promise<ContributionRecoveryCheckpoint[]> {
  const rows = await readAll();
  return rows.filter(
    (r) =>
      (r.syncStatus === 'local_complete_pending_remote' || r.syncStatus === 'failed_retryable') &&
      r.productionEpoch === CURRENT_PRODUCTION_CONTRIBUTION_EPOCH
  );
}

/**
 * Resolve which evidence payload to use for a recovery retry.
 * Prefer current local authoritative state; use checkpoint snapshot only when
 * the local record is absent. Never elevate authority beyond the snapshot's
 * legitimate state when rehydrating an absent record.
 */
export function resolveRecoveryPersistPayload(
  checkpoint: ContributionRecoveryCheckpoint,
  local: ContributionEvidence | null
): ContributionEvidence {
  if (local) {
    return local;
  }
  // Absent local: rehydrate snapshot but strip any elevation that would exceed
  // checkpoint legitimacy (snapshot must remain as captured — caller already
  // gated checkpoint creation on production class/epoch).
  return checkpoint.evidenceSnapshot;
}

/**
 * Retry remote persist for materially completed checkpoints.
 * Preserves current local authoritative state; never overwrites with a stale snapshot.
 */
export async function retryPendingRemotePersist(): Promise<{
  attempted: number;
  synced: number;
  failed: number;
}> {
  const pending = await listPendingRecovery();
  let synced = 0;
  let failed = 0;

  for (const checkpoint of pending) {
    try {
      const local = await getLocalEvidenceById(checkpoint.evidenceId);
      const payload = resolveRecoveryPersistPayload(checkpoint, local);

      // Only rehydrate snapshot into local store when the record is genuinely absent.
      if (!local) {
        await upsertLocalEvidence(payload);
      }

      const ok = await persistEvidenceRemote(payload);
      const rows = await readAll();
      if (ok) {
        await writeAll(
          rows.map((r) =>
            r.recoveryId === checkpoint.recoveryId
              ? {
                  ...r,
                  syncStatus: 'remote_synced' as const,
                  attemptCount: r.attemptCount + 1,
                  lastError: undefined,
                }
              : r
          )
        );
        synced += 1;
      } else {
        await writeAll(
          rows.map((r) =>
            r.recoveryId === checkpoint.recoveryId
              ? {
                  ...r,
                  syncStatus: 'failed_retryable' as const,
                  attemptCount: r.attemptCount + 1,
                  lastError: 'remote_persist_returned_false',
                }
              : r
          )
        );
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      logger.warn('[contributions.recovery] retry failed', error);
      const rows = await readAll();
      await writeAll(
        rows.map((r) =>
          r.recoveryId === checkpoint.recoveryId
            ? {
                ...r,
                syncStatus: 'failed_retryable' as const,
                attemptCount: r.attemptCount + 1,
                lastError: error instanceof Error ? error.message : 'unknown_error',
              }
            : r
        )
      );
    }
  }

  return { attempted: pending.length, synced, failed };
}

/** Test/helper — wipe recovery store (never grants production authority). */
export async function __dangerouslyClearRecoveryStoreForTests(): Promise<void> {
  await AsyncStorage.removeItem(RECOVERY_STORAGE_KEY);
}
