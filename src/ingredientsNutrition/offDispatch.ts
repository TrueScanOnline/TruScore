import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ContributionEvidence } from '../contributions/types';

export const OFF_DISPATCH_STORAGE_KEY = '@rveel_in_off_dispatch_v1';

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

type FetchLike = (url: string, init: { method: string; body: FormData }) => Promise<{ ok: boolean; status: number }>;

function payloadFromEvidence(evidence: ContributionEvidence): Record<string, string> {
  const fields: Record<string, string> = { code: evidence.barcode };
  const payload = evidence.ingredientsNutrition;
  const ingredients = payload?.ingredientsText?.trim();
  if (ingredients) fields.ingredients_text = ingredients;
  if (payload?.nutritionBasis) fields.nutrition_data_per = payload.nutritionBasis === 'per_serving' ? 'serving' : '100g';
  for (const [key, value] of Object.entries(payload?.nutriments || {})) {
    if (!key.trim() || !Number.isFinite(value)) continue;
    fields[`nutriment_${key}`] = String(value);
  }
  return fields;
}

export function hashOffPayload(fields: Record<string, string>): string {
  return Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('&');
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
 * Send only established Ingredients & Nutrition fields.
 * Saved, sent, and later OFF-derived classification are different states.
 */
export async function dispatchIngredientsNutritionToOff(params: {
  evidence: ContributionEvidence;
  fetchImpl?: FetchLike;
  now?: number;
}): Promise<OffDispatchRecord> {
  const fields = payloadFromEvidence(params.evidence);
  delete fields.code;
  if (Object.keys(fields).length === 0) {
    throw new Error('off_dispatch_has_no_established_fields');
  }
  fields.code = params.evidence.barcode;
  const payloadHash = hashOffPayload(fields);
  const rows = await readAll();
  const existing = rows.find((row) => row.evidenceId === params.evidence.evidenceId && row.payloadHash === payloadHash);
  if (existing?.status === 'sent') return existing;

  const now = params.now ?? Date.now();
  const attempt = (existing?.attemptCount || 0) + 1;
  const endpoint = 'https://world.openfoodfacts.org/cgi/product_jqm2.pl';
  let status: OffDispatchStatus = 'failed_retryable';
  let lastError: string | undefined;
  try {
    const body = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value.trim()) body.append(key, value);
    }
    const userId = process.env.EXPO_PUBLIC_OFF_USER_ID?.trim();
    const password = process.env.EXPO_PUBLIC_OFF_PASSWORD?.trim();
    if (userId && password) {
      body.append('user_id', userId);
      body.append('password', password);
    }
    const fetchImpl = params.fetchImpl || fetch;
    const response = await fetchImpl(endpoint, { method: 'POST', body });
    if (response.ok) status = 'sent';
    else {
      status = 'failed_retryable';
      lastError = `off_http_${response.status}`;
    }
  } catch (error) {
    status = 'failed_retryable';
    lastError = error instanceof Error ? error.message : 'off_dispatch_failed';
  }
  const record: OffDispatchRecord = {
    evidenceId: params.evidence.evidenceId,
    barcode: params.evidence.barcode,
    payloadHash,
    fields,
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
