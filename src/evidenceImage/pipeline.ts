import { contributorCredential, listUnsentSubmissions, postContributorAction, retryUnsentEvidenceSubmissions } from '../evidenceAuthority/device';
import { ContributionTrace, readClientPlatform } from '../evidenceAuthority/contributionTrace';
import { getSession, loadSessions, upsertSession } from '../packetContribution/sessionStore';
import { sha256Hex } from '../packetContribution/sha256';
import type { CaptureSource, EvidenceImagePhase, PacketSourceAsset } from '../packetContribution/types';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { fittedLongEdge, jpegContainsExif } from './jpeg';
import { evidenceImageProfile, sameEvidenceImageProfile, type EvidenceImageProfile } from './profile';
import { localEvidenceAbandoned } from './retention';
import { classifyInterruptedResume, resumeMarkerFor } from './resumeGuard';
import type { EvidenceResumeStep } from '../packetContribution/types';

type FileSystemModule = typeof import('expo-file-system');

let advancing = false;
let advanceAgain = false;

function randomId(prefix: string): string {
  const bytes = new Uint8Array(8);
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex}`;
}

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function fileSystem(): Promise<FileSystemModule> {
  return FileSystem as FileSystemModule;
}

function objectPath(fs: FileSystemModule, key: string): string {
  return `${fs.documentDirectory}rveel-packet-evidence/${key}`;
}

async function readFileBytes(fs: FileSystemModule, key: string): Promise<Uint8Array | null> {
  const path = objectPath(fs, key);
  const info = await fs.getInfoAsync(path);
  if (!info.exists) return null;
  const encoded = await fs.readAsStringAsync(path, { encoding: fs.EncodingType.Base64 });
  return base64ToBytes(encoded);
}

async function patchAsset(
  sessionId: string,
  assetId: string,
  patch: Partial<PacketSourceAsset>
): Promise<PacketSourceAsset | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const current = session.sourceAssets.find((asset) => asset.assetId === assetId);
  if (!current) return null;
  const next = { ...current, ...patch };
  await upsertSession({
    ...session,
    sourceAssets: session.sourceAssets.map((asset) => (asset.assetId === assetId ? next : asset)),
  });
  return next;
}

function traceFor(asset: PacketSourceAsset, recovering: boolean): ContributionTrace {
  const trace = new ContributionTrace('capture', readClientPlatform(), {
    traceId: asset.traceId || randomId('ctr_'),
    t0: asset.capturedAt,
  });
  trace.byteRequests = asset.byteRequestCount || 0;
  if (recovering) trace.mark('recovery', 'ok');
  return trace;
}

export function evidenceImageStatus(asset: {
  imagePhase?: EvidenceImagePhase;
  lastPutStatus?: number | null;
}): string {
  const phase = asset.imagePhase;
  if (phase === 'local_accepted' || phase === 'preparing') {
    return 'Photo saved on this phone. Preparing it does not submit a contribution.';
  }
  if (phase === 'prepared' || phase === 'uploading') {
    return 'Saving the photo securely. This is not an admitted contribution.';
  }
  if (phase === 'available') return 'Photo ready to review. It is not admitted until you submit.';
  if (phase === 'failed_retryable') {
    const status = asset.lastPutStatus ? ` The direct upload returned ${asset.lastPutStatus}.` : '';
    return `Photo saved on this phone. Saving will retry.${status} Nothing has been admitted.`;
  }
  if (phase === 'parked_after_interrupted_resume') {
    return 'This photo needs attention. It is still saved on this phone. Nothing has been admitted.';
  }
  return '';
}

/** Copy the capture into app storage and return. Upload continues after this. */
export async function acceptLocalCapture(input: {
  sessionId: string;
  uri: string;
  source: CaptureSource;
  width: number;
  height: number;
}): Promise<{ assetId: string; traceId: string; fileUri: string }> {
  const fs = await fileSystem();
  const session = await getSession(input.sessionId);
  if (!session || session.status !== 'open') throw new Error('packet_session_not_open');
  const capturedAt = Date.now();
  const traceId = randomId('ctr_');
  const assetId = `src_${input.sessionId.slice(0, 12)}_${traceId.slice(4, 12)}`;
  const privateKey = `packet/${input.sessionId}/original/${assetId}`;
  const path = objectPath(fs, privateKey);
  await fs.makeDirectoryAsync(path.slice(0, path.lastIndexOf('/')), { intermediates: true });
  await fs.copyAsync({ from: input.uri, to: path });
  const info = await fs.getInfoAsync(path);
  const byteLength = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0;
  const asset: PacketSourceAsset = {
    assetId,
    sessionId: input.sessionId,
    contentSha256: '',
    byteLength,
    privateKey,
    source: input.source,
    framing: 'targeted',
    locationMetadata: input.source === 'gallery' ? 'stripped' : 'absent',
    capturedAt,
    variantKey: session.variantKey,
    imagePhase: 'local_accepted',
    lineageWidth: input.width,
    lineageHeight: input.height,
    traceId,
    byteRequestCount: 0,
  };
  await upsertSession({ ...session, sourceAssets: [...session.sourceAssets, asset] });
  const trace = traceFor(asset, false);
  trace.mark('capture_accepted', 'ok');
  trace.flush('capture_accepted');
  void resumeEvidenceImages();
  return { assetId, traceId, fileUri: path };
}

async function hashOriginal(asset: PacketSourceAsset): Promise<PacketSourceAsset | null> {
  const fs = await fileSystem();
  const bytes = await readFileBytes(fs, asset.privateKey);
  if (!bytes?.length) {
    return patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
  }
  const contentSha256 = sha256Hex(bytes);
  const session = await getSession(asset.sessionId);
  const duplicate = session?.sourceAssets.find(
    (item) => item.assetId !== asset.assetId && item.contentSha256 === contentSha256
  );
  if (duplicate) {
    await fs.deleteAsync(objectPath(fs, asset.privateKey), { idempotent: true });
    if (session) {
      await upsertSession({
        ...session,
        sourceAssets: session.sourceAssets.filter((item) => item.assetId !== asset.assetId),
      });
    }
    return null;
  }
  return patchAsset(asset.sessionId, asset.assetId, {
    contentSha256,
    byteLength: bytes.byteLength,
    imagePhase: 'preparing',
  });
}

async function readProfile(trace: ContributionTrace, token: string): Promise<EvidenceImageProfile> {
  const response = await postContributorAction(token, { action: 'evidence-image-profile' }, trace, 'evidence_image_profile');
  if (!response.ok) return evidenceImageProfile();
  const body = (await response.json()) as { profile?: EvidenceImageProfile };
  return body.profile?.maxBytes ? body.profile : evidenceImageProfile();
}

/** Metro dynamic import() enumerates every react-native export. Keep preparation on expo-image-manipulator. */
export function resumeFailureNote(error: unknown): string {
  const fromError = error instanceof Error ? error.message : '';
  const fromObject =
    !fromError && error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  const message = fromError || fromObject || (typeof error === 'string' ? error : '') || 'resume_failed';
  return message.replace(/\s+/g, ' ').slice(0, 180);
}

async function prepareAsset(asset: PacketSourceAsset, profile: EvidenceImageProfile, trace: ContributionTrace): Promise<PacketSourceAsset | null> {
  const fs = await fileSystem();
  // Named import of the linked manipulator. Do not import the react-native barrel:
  // Metro enumerates every export, including PushNotificationIOS, and that constructs
  // NativeEventEmitter with a null iOS module.
  const sourceUri = objectPath(fs, asset.preparedPrivateKey || asset.privateKey);
  let currentUri = sourceUri;
  let current = {
    width: asset.lineageWidth && asset.lineageWidth > 0 ? asset.lineageWidth : 0,
    height: asset.lineageHeight && asset.lineageHeight > 0 ? asset.lineageHeight : 0,
  };
  let quality = profile.jpegQuality;
  let edge = profile.maxLongEdgePx;
  let prepared: { uri: string; width: number; height: number; byteLength: number } | null = null;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const knownSize = current.width > 0 && current.height > 0;
    const fitted = knownSize ? fittedLongEdge(current.width, current.height, edge) : null;
    const actions =
      fitted && (fitted.width !== current.width || fitted.height !== current.height)
        ? [{ resize: { width: fitted.width } }]
        : [];
    const saved = await manipulateAsync(currentUri, actions, {
      compress: quality,
      format: SaveFormat.JPEG,
    });
    const info = await fs.getInfoAsync(saved.uri);
    const byteLength = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : Number.MAX_SAFE_INTEGER;
    const sized = { width: saved.width, height: saved.height };
    prepared = { uri: saved.uri, width: sized.width, height: sized.height, byteLength };
    if (byteLength <= profile.maxBytes) break;
    currentUri = saved.uri;
    current = sized;
    if (quality > 0.55) quality = Math.round((quality - 0.1) * 100) / 100;
    else edge = Math.max(640, Math.round(edge * 0.85));
  }
  if (!prepared || prepared.byteLength > profile.maxBytes) {
    trace.mark('prepared', 'failed');
    trace.flush('prepared');
    return patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
  }
  const bytes = base64ToBytes(await fs.readAsStringAsync(prepared.uri, { encoding: fs.EncodingType.Base64 }));
  if (jpegContainsExif(bytes)) {
    trace.mark('prepared', 'failed');
    trace.flush('prepared');
    return patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable', lastPutStatus: null });
  }
  const preparedSha256 = sha256Hex(bytes);
  const preparedPrivateKey = `packet/${asset.sessionId}/prepared/${preparedSha256}`;
  const destination = objectPath(fs, preparedPrivateKey);
  await fs.makeDirectoryAsync(destination.slice(0, destination.lastIndexOf('/')), { intermediates: true });
  await fs.copyAsync({ from: prepared.uri, to: destination });
  if (asset.privateKey !== preparedPrivateKey) {
    await fs.deleteAsync(objectPath(fs, asset.privateKey), { idempotent: true });
  }
  trace.mark('prepared', 'ok');
  trace.flush('prepared');
  return patchAsset(asset.sessionId, asset.assetId, {
    imagePhase: 'prepared',
    preparedPrivateKey,
    preparedSha256,
    preparedByteLength: prepared.byteLength,
    preparedWidth: prepared.width,
    preparedHeight: prepared.height,
    profileId: profile.profileId,
    profileVersion: profile.version,
    locationMetadata: 'stripped',
  });
}

async function uploadPrepared(asset: PacketSourceAsset, trace: ContributionTrace, token: string): Promise<void> {
  const session = await getSession(asset.sessionId);
  if (!session || !asset.preparedSha256 || !asset.preparedPrivateKey) return;
  const response = await postContributorAction(
    token,
    {
      action: 'authorize-evidence-image',
      barcode: session.barcode,
      preparedSha256: asset.preparedSha256,
      preparedByteLength: asset.preparedByteLength,
      width: asset.preparedWidth,
      height: asset.preparedHeight,
      profileId: asset.profileId,
      profileVersion: asset.profileVersion,
      lineageSha256: asset.contentSha256,
      lineageByteLength: asset.byteLength,
      lineageWidth: asset.lineageWidth,
      lineageHeight: asset.lineageHeight,
    },
    trace,
    'authorize_evidence_image'
  );
  if (!response.ok) {
    trace.mark('upload_begin', 'failed');
    trace.flush('upload_begin');
    await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
    return;
  }
  const body = (await response.json()) as {
    status?: string;
    assetId?: string;
    presignedUrl?: string;
    pathname?: string;
    headers?: Record<string, string>;
    profile?: EvidenceImageProfile;
  };
  if (body.status === 'already_available' && body.assetId) {
    trace.mark('remote_verified', 'ok');
    trace.flush('remote_verified');
    await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'available', remoteAssetId: body.assetId });
    return;
  }
  if (body.status === 'profile_stale' && body.profile) {
    await prepareAsset(asset, body.profile, trace);
    return;
  }
  if (body.status !== 'upload' || !body.presignedUrl || !body.pathname || !body.headers) {
    await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
    return;
  }
  const fs = await fileSystem();
  trace.mark('upload_begin', 'ok');
  trace.byteRequests += 1;
  const started = Date.now();
  let status: number | null = null;
  let outcome: 'ok' | 'http_error' | 'network_error' = 'network_error';
  try {
    const uploaded = await fs.uploadAsync(body.presignedUrl, objectPath(fs, asset.preparedPrivateKey), {
      httpMethod: 'PUT',
      uploadType: fs.FileSystemUploadType.BINARY_CONTENT,
      headers: body.headers,
    });
    status = uploaded.status;
    outcome = uploaded.status >= 200 && uploaded.status < 300 ? 'ok' : 'http_error';
  } catch {
    outcome = 'network_error';
  }
  trace.request({
    kind: 'evidence_image_put',
    durationMs: Date.now() - started,
    outcome,
    status,
    timeoutMs: 0,
  });
  trace.flush('upload_end');
  await patchAsset(asset.sessionId, asset.assetId, {
    imagePhase: outcome === 'ok' ? 'uploading' : 'failed_retryable',
    byteRequestCount: trace.byteRequests,
    remotePathname: body.pathname,
    lastPutStatus: status,
  });
  if (outcome !== 'ok') return;
  const finalized = await postContributorAction(
    token,
    {
      action: 'finalize-evidence-image',
      pathname: body.pathname,
      preparedSha256: asset.preparedSha256,
    },
    trace,
    'finalize_evidence_image'
  );
  if (!finalized.ok) {
    trace.mark('remote_verified', 'failed');
    trace.flush('remote_verified');
    await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
    return;
  }
  const verified = (await finalized.json()) as { assetId?: string };
  if (!verified.assetId) {
    await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'failed_retryable' });
    return;
  }
  trace.mark('remote_verified', 'ok');
  trace.flush('remote_verified');
  await patchAsset(asset.sessionId, asset.assetId, { imagePhase: 'available', remoteAssetId: verified.assetId });
}

async function advanceAsset(asset: PacketSourceAsset, recovering: boolean): Promise<boolean> {
  if (asset.imagePhase === 'available' && asset.remoteAssetId) return false;
  if (asset.imagePhase === 'parked_after_interrupted_resume') return false;
  const trace = traceFor(asset, recovering || asset.imagePhase === 'failed_retryable' || asset.imagePhase === 'uploading');
  let current = asset.contentSha256 ? asset : await hashOriginal(asset);
  if (!current) return false;
  const token = await contributorCredential(trace);
  const profile = await readProfile(trace, token);
  const stale =
    current.imagePhase === 'prepared' &&
    current.profileId &&
    current.profileVersion != null &&
    !sameEvidenceImageProfile(profile, {
      profileId: current.profileId,
      version: current.profileVersion,
      maxLongEdgePx: profile.maxLongEdgePx,
      jpegQuality: profile.jpegQuality,
      maxBytes: profile.maxBytes,
      crop: false,
      stripLocation: true,
    });
  if (!current.preparedSha256 || current.imagePhase === 'local_accepted' || current.imagePhase === 'preparing' || stale) {
    current = (await beginResumeStep(current, 'prepare')) || current;
    current = (await prepareAsset(current, profile, trace)) || current;
    current = (await clearResumeStep(current)) || current;
  }
  // A failed direct PUT stays failed_retryable with the prepared file intact.
  // Resume retries that one binary upload. It does not prepare a second image.
  if (!current.preparedSha256) return false;
  const before = current.remoteAssetId;
  current = (await beginResumeStep(current, 'upload')) || current;
  await uploadPrepared(current, trace, token);
  await clearResumeStep(current);
  const after = (await getSession(current.sessionId))?.sourceAssets.find((item) => item.assetId === current.assetId);
  return !!after?.remoteAssetId && after.remoteAssetId !== before;
}

function photoHeldOnDevice(asset: PacketSourceAsset): boolean {
  return asset.imagePhase === 'parked_after_interrupted_resume' || !!asset.resumeInProgress || !!asset.interruptedResume;
}

async function beginResumeStep(asset: PacketSourceAsset, step: EvidenceResumeStep): Promise<PacketSourceAsset | null> {
  const attempt = asset.resumeInProgress?.attempt && asset.resumeInProgress.attempt > 0 ? asset.resumeInProgress.attempt : 1;
  return patchAsset(asset.sessionId, asset.assetId, {
    resumeInProgress: resumeMarkerFor(step, attempt, Date.now()),
  });
}

async function clearResumeStep(asset: PacketSourceAsset): Promise<PacketSourceAsset | null> {
  return patchAsset(asset.sessionId, asset.assetId, { resumeInProgress: undefined });
}

async function settleInterruptedAssets(now: number): Promise<void> {
  const sessions = await loadSessions();
  for (const session of sessions) {
    for (const asset of session.sourceAssets) {
      if (!asset.resumeInProgress || asset.imagePhase === 'parked_after_interrupted_resume') continue;
      const decision = classifyInterruptedResume(asset.resumeInProgress, now);
      if (!decision.resume) {
        await patchAsset(session.sessionId, asset.assetId, {
          imagePhase: 'parked_after_interrupted_resume',
          interruptedResume: decision.park,
          resumeInProgress: undefined,
        });
        continue;
      }
      await patchAsset(session.sessionId, asset.assetId, { resumeInProgress: decision.marker });
    }
  }
}

async function sweepAbandonedLocalFiles(now: number): Promise<void> {
  const unsent = new Set((await listUnsentSubmissions()).map((item) => item.sessionId));
  const sessions = await loadSessions();
  const fs = await fileSystem().catch(() => null);
  for (const session of sessions) {
    if (!localEvidenceAbandoned(session.updatedAt, now, unsent.has(session.sessionId))) continue;
    if (!fs) continue;
    for (const asset of session.sourceAssets) {
      if (photoHeldOnDevice(asset)) continue;
      if (asset.privateKey) await fs.deleteAsync(objectPath(fs, asset.privateKey), { idempotent: true });
      if (asset.preparedPrivateKey) await fs.deleteAsync(objectPath(fs, asset.preparedPrivateKey), { idempotent: true });
    }
  }
}

/** Continue prepare/upload for every captured image. Safe to call from foreground and after capture. */
export async function resumeEvidenceImages(): Promise<void> {
  if (advancing) {
    advanceAgain = true;
    return;
  }
  advancing = true;
  try {
    do {
      advanceAgain = false;
      const now = Date.now();
      await settleInterruptedAssets(now);
      await sweepAbandonedLocalFiles(now);
      const sessions = await loadSessions();
      let becameAvailable = false;
      for (const session of sessions) {
        for (const asset of session.sourceAssets) {
          if (!asset.imagePhase || asset.imagePhase === 'available' || asset.imagePhase === 'parked_after_interrupted_resume') continue;
          try {
            const ready = await advanceAsset(asset, asset.imagePhase === 'failed_retryable' || asset.imagePhase === 'uploading');
            becameAvailable = becameAvailable || ready;
          } catch (error) {
            await patchAsset(session.sessionId, asset.assetId, {
              imagePhase: 'failed_retryable',
              preparationError: resumeFailureNote(error),
              resumeInProgress: undefined,
            }).catch(() => undefined);
          }
        }
      }
      if (becameAvailable) await retryUnsentEvidenceSubmissions();
    } while (advanceAgain);
  } finally {
    advancing = false;
  }
}

/** Manual retry clears the interrupted park and runs one guarded resume. Files stay on the phone. */
export async function retryParkedEvidenceImage(sessionId: string, assetId: string): Promise<void> {
  const session = await getSession(sessionId);
  const asset = session?.sourceAssets.find((item) => item.assetId === assetId);
  if (!asset || asset.imagePhase !== 'parked_after_interrupted_resume') return;
  const restore =
    asset.interruptedResume?.step === 'upload' && asset.preparedSha256
      ? 'prepared'
      : asset.contentSha256
        ? 'preparing'
        : 'local_accepted';
  await patchAsset(sessionId, assetId, {
    imagePhase: restore,
    interruptedResume: undefined,
    resumeInProgress: undefined,
    preparationError: undefined,
  });
  await resumeEvidenceImages();
}
