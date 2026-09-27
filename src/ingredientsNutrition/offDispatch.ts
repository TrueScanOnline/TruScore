import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../config/backendConfig';
import type { ContributionEvidence } from '../contributions/types';
import { projectOffWriteFields } from './nutritionSchema';

export const OFF_DISPATCH_STORAGE_KEY = '@rveel_in_off_dispatch_v1';
export const OFF_WRITE_PATH = '/api/off-product-write';

export type OffDispatchStatus = 'saved' | 'sent' | 'failed_retryable';

export type OffDispatchRecord = {
  evidenceId: string;
  barcode: string;
  payloadHash: string;
  fields: Record<string, string>;
  status: OffDispatchStatus;
  attemptCount: number;
  lastError?: string;
  updatedAt: number;
};

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string }
) => Promise<{ ok: boolean; status: number; json?: () => Promise<unknown> }>;

export function hashOffPayload(fields: Record<string, string>): string {
  return Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&');
}

function writePayload(evidence: ContributionEvidence): {
  fields: Record<string, string>;
  body: Record<string, unknown>;
} | null {
  const nutrition = evidence.ingredientsNutrition;
  const established = nutrition?.nutriments?.length
    ? {
        basis: nutrition.nutritionBasis!,
        amounts: nutrition.nutriments,
        nutritionComplete: nutrition.nutritionComplete,
      }
    : undefined;
  const fields = projectOffWriteFields({
    barcode: evidence.barcode,
    ingredientsText: nutrition?.ingredientsText,
    nutrition: established && nutrition?.nutritionBasis ? established : undefined,
  });
  if (!fields) return null;
  return {
    fields,
    body: {
      barcode: evidence.barcode,
      ingredientsText: nutrition?.ingredientsText,
      basis: nutrition?.nutritionBasis,
      amounts: nutrition?.nutriments || [],
    },
  };
}

async function readAll(): Promise<OffDispatchRecord[]> {
  const raw = await AsyncStorage.getItem(OFF_DISPATCH_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OffDispatchRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(rows: OffDispatchRecord[]): Promise<void> {
  await AsyncStorage.setItem(OFF_DISPATCH_STORAGE_KEY, JSON.stringify(rows));
}

/**
 * Ask the server to write established fields. The client never holds an OFF password.
 * Saved, sent, visible-on-OFF, and a later derived classification stay different states.
 */
export async function dispatchIngredientsNutritionToOff(params: {
  evidence: ContributionEvidence;
  fetchImpl?: FetchLike;
  now?: number;
}): Promise<OffDispatchRecord> {
  const projected = writePayload(params.evidence);
  if (!projected) throw new Error('off_dispatch_has_no_established_fields');
  const payloadHash = hashOffPayload(projected.fields);
  const rows = await readAll();
  const existing = rows.find(
    (row) => row.evidenceId === params.evidence.evidenceId && row.payloadHash === payloadHash
  );
  if (existing?.status === 'sent') return existing;

  const now = params.now ?? Date.now();
  const attempt = (existing?.attemptCount || 0) + 1;
  const endpoint = `${getBackendUrl()}${OFF_WRITE_PATH}`;
  let status: OffDispatchStatus = 'failed_retryable';
  let lastError: string | undefined;
  try {
    const fetchImpl = params.fetchImpl || fetch;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projected.body),
    });
    const payload = response.json ? await response.json().catch(() => null) : null;
    const serverStatus =
      payload && typeof payload === 'object' && 'status' in payload
        ? String((payload as { status?: unknown }).status)
        : '';
    if (response.ok && serverStatus === 'sent') status = 'sent';
    else {
      status = 'failed_retryable';
      lastError =
        payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error?: unknown }).error)
          : `off_http_${response.status}`;
    }
  } catch (error) {
    status = 'failed_retryable';
    lastError = error instanceof Error ? error.message : 'off_dispatch_failed';
  }
  const record: OffDispatchRecord = {
    evidenceId: params.evidence.evidenceId,
    barcode: params.evidence.barcode,
    payloadHash,
    fields: projected.fields,
    status,
    attemptCount: attempt,
    lastError,
    updatedAt: now,
  };
  const next = rows.filter((row) => row.evidenceId !== record.evidenceId);
  next.push(record);
  await writeAll(next);
  return record;
}

export async function latestOffDispatchStatus(barcode: string): Promise<OffDispatchStatus | null> {
  const rows = await readAll();
  const mine = rows.filter((row) => row.barcode === barcode);
  if (mine.length === 0) return null;
  mine.sort((a, b) => b.updatedAt - a.updatedAt);
  return mine[0].status;
}

export function offDispatchConsumerCopy(status: OffDispatchStatus | null): string {
  if (status === 'sent') return 'Sent to Open Food Facts. A Nutri-Score or NOVA group is not created by this send.';
  if (status === 'failed_retryable') return 'Saved in Rveel. The send to Open Food Facts can be retried.';
  return 'Saved in Rveel.';
}
