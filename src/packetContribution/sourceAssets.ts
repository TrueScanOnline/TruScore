import { sha256Hex } from './sha256';
import { provenanceForImport } from './privacy';
import { getSession, upsertSession } from './sessionStore';
import type {
  CaptureSource,
  DerivedTransform,
  PacketContributionSession,
  PacketDerivedAsset,
  PacketSourceAsset,
  SourceFraming,
} from './types';

export type PrivateByteStore = {
  put(key: string, bytes: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
  /** Delete private packet objects. Must not touch unrelated app files. */
  clearPacketObjects(): Promise<void>;
};

const memoryBytes = new Map<string, Uint8Array>();

export const memoryPrivateByteStore: PrivateByteStore = {
  async put(key, bytes) {
    memoryBytes.set(key, bytes);
  },
  async get(key) {
    const found = memoryBytes.get(key);
    return found ? found.slice() : null;
  },
  async delete(key) {
    memoryBytes.delete(key);
  },
  async clearPacketObjects() {
    for (const key of [...memoryBytes.keys()]) {
      if (key.startsWith('packet/')) memoryBytes.delete(key);
    }
  },
};

let byteStore: PrivateByteStore = memoryPrivateByteStore;

export function __setPrivateByteStoreForTests(next: PrivateByteStore | null): void {
  byteStore = next || memoryPrivateByteStore;
  if (!next) memoryBytes.clear();
}

export function getPrivateByteStore(): PrivateByteStore {
  return byteStore;
}

export function __resetMemoryPrivateBytesForTests(): void {
  memoryBytes.clear();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Durable on-device store. Not the public product-photo upload path. */
export async function activateDevicePrivateByteStore(): Promise<void> {
  const FileSystem = await import('expo-file-system');
  const root = `${FileSystem.documentDirectory}rveel-packet-evidence/`;
  byteStore = {
    async put(key, bytes) {
      const path = `${root}${key}`;
      const dir = path.slice(0, path.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      await FileSystem.writeAsStringAsync(path, bytesToBase64(bytes), {
        encoding: FileSystem.EncodingType.Base64,
      });
    },
    async get(key) {
      const path = `${root}${key}`;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      const encoded = await FileSystem.readAsStringAsync(path, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64ToBytes(encoded);
    },
    async delete(key) {
      await FileSystem.deleteAsync(`${root}${key}`, { idempotent: true });
    },
    async clearPacketObjects() {
      await FileSystem.deleteAsync(root, { idempotent: true });
    },
  };
}

function assetIdFor(sessionId: string, hash: string): string {
  return `src_${sessionId}_${hash.slice(0, 16)}`;
}

export async function commitStagedCapture(params: {
  sessionId: string;
  bytes: Uint8Array;
  source: CaptureSource;
  metadata?: Record<string, unknown>;
  now?: number;
}): Promise<{ session: PacketContributionSession; asset: PacketSourceAsset; duplicate: boolean }> {
  const session = await getSession(params.sessionId);
  if (!session || session.status !== 'open') {
    throw new Error('packet_session_not_open');
  }
  const provenance = provenanceForImport(params.source, params.metadata);
  if (params.source === 'gallery' && provenance.locationMetadata !== 'stripped' && provenance.locationMetadata !== 'absent') {
    throw new Error('gallery_location_metadata_not_stripped');
  }
  const contentSha256 = sha256Hex(params.bytes);
  const existing = session.sourceAssets.find((asset) => asset.contentSha256 === contentSha256);
  if (existing) {
    return { session, asset: existing, duplicate: true };
  }
  const asset: PacketSourceAsset = {
    assetId: assetIdFor(session.sessionId, contentSha256),
    sessionId: session.sessionId,
    contentSha256,
    byteLength: params.bytes.byteLength,
    privateKey: `packet/${session.sessionId}/${contentSha256}`,
    source: provenance.source,
    framing: 'unspecified',
    locationMetadata: provenance.locationMetadata,
    capturedAt: params.now ?? Date.now(),
    variantKey: session.variantKey,
  };
  await byteStore.put(asset.privateKey, params.bytes);
  const next: PacketContributionSession = {
    ...session,
    sourceAssets: [...session.sourceAssets, asset],
  };
  const saved = await upsertSession(next);
  return { session: saved, asset, duplicate: false };
}

/** Retake/reject: drop the temporary object and do not attach it to the session. */
export async function rejectStagedCapture(tempKey: string): Promise<void> {
  await byteStore.delete(tempKey);
}

export async function readSourceBytes(asset: PacketSourceAsset): Promise<Uint8Array | null> {
  return byteStore.get(asset.privateKey);
}

export async function setSourceFraming(
  sessionId: string,
  assetId: string,
  framing: Exclude<SourceFraming, 'unspecified'>
): Promise<PacketContributionSession> {
  const session = await getSession(sessionId);
  if (!session) throw new Error('packet_session_missing');
  const next: PacketContributionSession = {
    ...session,
    sourceAssets: session.sourceAssets.map((asset) =>
      asset.assetId === assetId ? { ...asset, framing } : asset
    ),
  };
  return upsertSession(next);
}

export async function addDerivedAsset(params: {
  sessionId: string;
  sourceAssetId: string;
  transform: DerivedTransform;
  now?: number;
}): Promise<{ session: PacketContributionSession; derived: PacketDerivedAsset }> {
  const session = await getSession(params.sessionId);
  if (!session) throw new Error('packet_session_missing');
  const source = session.sourceAssets.find((asset) => asset.assetId === params.sourceAssetId);
  if (!source) throw new Error('source_asset_missing');
  if (params.transform.kind === 'region') {
    const { x, y, width, height } = params.transform;
    const inside = x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 1 && y + height <= 1;
    if (!inside) throw new Error('region_out_of_bounds');
  }
  const before = await readSourceBytes(source);
  const derived: PacketDerivedAsset = {
    derivedAssetId: `der_${source.assetId}_${session.derivedAssets.length + 1}`,
    sourceAssetId: source.assetId,
    transform: params.transform,
    createdAt: params.now ?? Date.now(),
  };
  const saved = await upsertSession({
    ...session,
    derivedAssets: [...session.derivedAssets, derived],
  });
  const after = await readSourceBytes(source);
  if (!before || !after || sha256Hex(before) !== source.contentSha256 || sha256Hex(after) !== source.contentSha256) {
    throw new Error('source_mutated_by_derivative');
  }
  return { session: saved, derived };
}
