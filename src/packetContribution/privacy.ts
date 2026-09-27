import type { CaptureSource, LocationMetadataDisposition } from './types';

const LOCATION_KEYS = [
  'gps',
  'GPS',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'location',
  'Location',
  'GPSLatitude',
  'GPSLongitude',
  'GPSInfo',
];

export function metadataHasLocation(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) return false;
  return LOCATION_KEYS.some((key) => metadata[key] != null && metadata[key] !== '');
}

/** Drop GPS/location keys. Pixel bytes are not cropped or recomposed here. */
export function stripLocationMetadata(metadata: Record<string, unknown> | undefined): {
  metadata: Record<string, unknown>;
  locationMetadata: LocationMetadataDisposition;
} {
  const next: Record<string, unknown> = { ...(metadata || {}) };
  const had = metadataHasLocation(next);
  for (const key of LOCATION_KEYS) delete next[key];
  return { metadata: next, locationMetadata: had ? 'stripped' : 'absent' };
}

export function provenanceForImport(source: CaptureSource, metadata?: Record<string, unknown>): {
  source: CaptureSource;
  locationMetadata: LocationMetadataDisposition;
  retainedMetadata: Record<string, unknown>;
} {
  const stripped = stripLocationMetadata(metadata);
  return {
    source,
    locationMetadata: source === 'gallery' ? 'stripped' : stripped.locationMetadata,
    retainedMetadata: stripped.metadata,
  };
}
