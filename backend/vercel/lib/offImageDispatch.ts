import { liveOffNetworkWriteAllowed } from '../truescan-src/evidenceAuthority/authority';
import { offImageDispatchDecision, offImageFieldAllowed } from '../truescan-src/evidenceAuthority/offImageDispatchGate';
import { summarizeOffWriteResponse } from '../truescan-src/evidenceAuthority/offWriteResponse';

const OFF_IMAGE_UPLOAD = 'https://world.openfoodfacts.org/cgi/product_image_upload.pl';
const MAX_IMAGE_BASE64_CHARS = 12_000_000;

export type OffImageDispatchResult =
  | { ok: true; imageUrl: string }
  | { ok: false; status: number; reason: string };

function imageUrlFor(barcode: string, field: string): string {
  return `https://images.openfoodfacts.org/images/products/${barcode.substring(0, 3)}/${barcode.substring(3, 6)}/${barcode.substring(6, 9)}/${barcode}/${field}.jpg`;
}

export async function dispatchOffImage(input: {
  barcode: string;
  imageField: string;
  imageBase64: string;
  mimeType?: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}): Promise<OffImageDispatchResult> {
  const env = input.env || process.env;
  const barcode = input.barcode.trim();
  const field = input.imageField.trim();
  if (!/^\d{8,14}$/.test(barcode) || !offImageFieldAllowed(field)) {
    return { ok: false, status: 400, reason: 'off_image_incomplete' };
  }
  if (!input.imageBase64 || input.imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return { ok: false, status: 400, reason: 'off_image_incomplete' };
  }
  const authorityEnv = env.RVEEL_EVIDENCE_AUTHORITY_ENV === 'production' ? 'production' : 'uat';
  const user = env.OFF_LIVE_WRITE_USER_ID?.trim() || '';
  const password = env.OFF_LIVE_WRITE_PASSWORD?.trim() || '';
  const decision = offImageDispatchDecision({
    authorityEnv,
    execute: env.OFF_LIVE_WRITE_EXECUTE?.trim() || '',
    hasUser: user.length > 0,
    hasPassword: password.length > 0,
    networkAllowed: liveOffNetworkWriteAllowed(),
  });
  if (decision !== 'ok') {
    return { ok: false, status: decision === 'disabled' ? 403 : 409, reason: `off_image_dispatch_${decision}` };
  }
  const bytes = Buffer.from(input.imageBase64, 'base64');
  const form = new FormData();
  form.set('code', barcode);
  form.set('imagefield', field);
  form.set('user_id', user);
  form.set('password', password);
  form.set(
    `imgupload_${field}`,
    new Blob([new Uint8Array(bytes)], { type: input.mimeType || 'image/jpeg' }),
    `${barcode}_${field}.jpg`
  );
  const fetchImpl = input.fetchImpl || fetch;
  const response = await fetchImpl(OFF_IMAGE_UPLOAD, {
    method: 'POST',
    headers: { 'User-Agent': 'Rveel/1.0.0 (truescan@example.com)' },
    body: form,
  });
  const responseText = await response.text();
  const note = summarizeOffWriteResponse(response.status, responseText);
  console.log('[off-image-dispatch]', JSON.stringify({ barcode, field, status: response.status, note }));
  const accepted = response.ok && (responseText.includes('status="ok"') || responseText.includes('"status":1'));
  if (!accepted) return { ok: false, status: 502, reason: 'off_image_rejected' };
  return { ok: true, imageUrl: imageUrlFor(barcode, field) };
}
