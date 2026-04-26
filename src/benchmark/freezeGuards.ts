/**
 * Service- and store-layer intent labels for frozen benchmark row writes. Slice 4: in-place
 * mutation of a frozen (non-superseded) row is always rejected; only supersession creates a new row.
 */

import type { FrozenBenchmarkAttributionObject } from './types';
import { frozenAttributionRowKey } from './frozenAttributionRowKey';
import { FREEZE_GUARD_INTENT, FREEZE_GUARD_RESULT } from './freezeGuardEventKinds';
import type { FreezeGuardIntent, FreezeGuardResult } from './freezeGuardEventKinds';

export type { FreezeGuardIntent, FreezeGuardResult } from './freezeGuardEventKinds';
export { FREEZE_GUARD_INTENT, FREEZE_GUARD_RESULT } from './freezeGuardEventKinds';

export type FreezeWriteSource = 'persistence' | 'service' | 'dynamic_refresh' | 'test';

export interface FreezeGuardEvent {
  at: string;
  row_key: string;
  intent: FreezeGuardIntent;
  result: FreezeGuardResult;
  detail: string;
  source: FreezeWriteSource;
}

const events: FreezeGuardEvent[] = [];
const maxEvents = 5000;

function pushEvent(e: FreezeGuardEvent): void {
  if (events.length >= maxEvents) events.shift();
  events.push(e);
}

export function getFreezeGuardEvents(): readonly FreezeGuardEvent[] {
  return events;
}

export function resetFreezeGuardEventsForTests(): void {
  events.length = 0;
}

/**
 * In-place update of a row that is `freeze_status: frozen` and still active (not superseded) is not permitted;
 * corrections go through supersession (new `snapshot_version` and new store key) per locked pack.
 */
export function isInPlaceMutationOnFrozen(
  existing: FrozenBenchmarkAttributionObject,
  _attemptedNext: FrozenBenchmarkAttributionObject,
  source: FreezeWriteSource,
  existingRowIsSuperseded: boolean
): { blocked: boolean; reason: string } {
  const k1 = frozenAttributionRowKey(existing);
  const k2 = frozenAttributionRowKey(_attemptedNext);
  if (k1 !== k2) return { blocked: false, reason: '' };
  if (existingRowIsSuperseded) return { blocked: false, reason: '' };
  if (existing.freeze.freeze_status === 'frozen') {
    const at = new Date().toISOString();
    const reason =
      'In-place update blocked for an active frozen row: use a superseding correction (new snapshot_version, new key).';
    pushEvent({
      at,
      row_key: k1,
      intent: FREEZE_GUARD_INTENT.in_place_update,
      result: FREEZE_GUARD_RESULT.blocked,
      detail: reason,
      source,
    });
    return { blocked: true, reason };
  }
  return { blocked: false, reason: '' };
}

export function logRegisterInitial(rowKey: string, source: FreezeWriteSource, detail: string): void {
  pushEvent({
    at: new Date().toISOString(),
    row_key: rowKey,
    intent: FREEZE_GUARD_INTENT.register_initial,
    result: FREEZE_GUARD_RESULT.allowed,
    detail,
    source,
  });
}

export function logSupersede(
  fromKey: string,
  toKey: string,
  source: FreezeWriteSource,
  detail: string
): void {
  pushEvent({
    at: new Date().toISOString(),
    row_key: `${fromKey}→${toKey}`,
    intent: FREEZE_GUARD_INTENT.supersede,
    result: FREEZE_GUARD_RESULT.allowed,
    detail,
    source,
  });
}
