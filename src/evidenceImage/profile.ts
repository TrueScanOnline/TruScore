/** Server-owned preparation envelope. The app fetches this; it does not invent a second profile. */

export type EvidenceImageProfile = {
  profileId: string;
  version: number;
  maxLongEdgePx: number;
  jpegQuality: number;
  maxBytes: number;
  crop: false;
  stripLocation: true;
};

export const EVIDENCE_IMAGE_CONTENT_TYPE = 'image/jpeg';

export const DEFAULT_EVIDENCE_IMAGE_PROFILE: EvidenceImageProfile = {
  profileId: 'evidence-image-v1',
  version: 1,
  maxLongEdgePx: 2560,
  jpegQuality: 0.85,
  maxBytes: 2 * 1024 * 1024,
  crop: false,
  stripLocation: true,
};

function clampInt(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function clampQuality(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_EVIDENCE_IMAGE_PROFILE.jpegQuality;
  const rounded = Math.round(parsed * 100) / 100;
  return Math.min(0.95, Math.max(0.5, rounded));
}

export function evidenceImageProfile(env: Record<string, string | undefined> = {}): EvidenceImageProfile {
  const requestedId = env.EVIDENCE_IMAGE_PROFILE_ID?.trim() || DEFAULT_EVIDENCE_IMAGE_PROFILE.profileId;
  const profileId = /^[a-z0-9-]{1,48}$/.test(requestedId) ? requestedId : DEFAULT_EVIDENCE_IMAGE_PROFILE.profileId;
  return {
    profileId,
    version: clampInt(env.EVIDENCE_IMAGE_PROFILE_VERSION, DEFAULT_EVIDENCE_IMAGE_PROFILE.version, 1, 1000),
    maxLongEdgePx: clampInt(env.EVIDENCE_IMAGE_MAX_LONG_EDGE, DEFAULT_EVIDENCE_IMAGE_PROFILE.maxLongEdgePx, 640, 4096),
    jpegQuality: clampQuality(env.EVIDENCE_IMAGE_JPEG_QUALITY),
    maxBytes: clampInt(env.EVIDENCE_IMAGE_MAX_BYTES, DEFAULT_EVIDENCE_IMAGE_PROFILE.maxBytes, 200_000, 2 * 1024 * 1024),
    crop: false,
    stripLocation: true,
  };
}

export function sameEvidenceImageProfile(left: EvidenceImageProfile, right: EvidenceImageProfile): boolean {
  return left.profileId === right.profileId && left.version === right.version;
}
