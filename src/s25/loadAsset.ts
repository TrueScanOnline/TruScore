/**
 * S25 runtime asset loaders — committed JSON only (no TSV at runtime).
 */

import catalogueJson from './assets/catalogue_315.json';
import classesJson from './assets/classes_25.json';
import sourceProfilesJson from './assets/source_profiles.json';
import surfaceCopyJson from './assets/surface_copy.json';
import ingestionManifestJson from './assets/ingestion_manifest.json';
import type {
  S25CatalogueEntry,
  S25ClassEntry,
  S25SourceProfile,
  S25SurfaceCopy,
} from './types';

export const S25_CATALOGUE: readonly S25CatalogueEntry[] =
  catalogueJson as S25CatalogueEntry[];
export const S25_CLASSES: readonly S25ClassEntry[] = classesJson as S25ClassEntry[];
export const S25_SOURCE_PROFILES: readonly S25SourceProfile[] =
  sourceProfilesJson as S25SourceProfile[];
export const S25_SURFACE_COPY: S25SurfaceCopy = surfaceCopyJson as S25SurfaceCopy;
export const S25_INGESTION_MANIFEST = ingestionManifestJson as {
  asset_version: string;
  counts: {
    catalogue_rows: number;
    standard_rows: number;
    body6_rows: number;
    evidence_enabled: number;
    evidence_dual_source: number;
    unique_additive_ids: number;
  };
};

const catalogueById = new Map(S25_CATALOGUE.map((e) => [e.additive_id, e]));
const profileById = new Map(S25_SOURCE_PROFILES.map((p) => [p.profile_id, p]));

export function getCatalogueEntry(additiveId: string): S25CatalogueEntry | undefined {
  return catalogueById.get(additiveId);
}

export function getSourceProfile(profileId: string): S25SourceProfile | undefined {
  return profileById.get(profileId);
}

export function getStandardCatalogueEntries(): S25CatalogueEntry[] {
  return S25_CATALOGUE.filter((e) => !e.body6_existing);
}

export function getBody6CatalogueEntries(): S25CatalogueEntry[] {
  return S25_CATALOGUE.filter((e) => e.body6_existing);
}

export function getSurfaceCopy(key: string): string {
  return S25_SURFACE_COPY[key] ?? '';
}

export function formatResultCountCopy(count: number): string {
  if (count === 1) return getSurfaceCopy('result_count_singular');
  return getSurfaceCopy('result_count_plural').replace('{count}', String(count));
}

export function assertAssetCounts(): {
  catalogue_rows: number;
  standard_rows: number;
  body6_rows: number;
  evidence_enabled: number;
  evidence_dual_source: number;
  unique_additive_ids: number;
  duplicate_additive_ids: number;
} {
  const ids = S25_CATALOGUE.map((e) => e.additive_id);
  const unique = new Set(ids);
  const standard = S25_CATALOGUE.filter((e) => !e.body6_existing);
  const body6 = S25_CATALOGUE.filter((e) => e.body6_existing);
  const evidence = standard.filter((e) => e.evidence_enabled);
  const dual = evidence.filter((e) => e.evidence_source_count === 2);
  return {
    catalogue_rows: S25_CATALOGUE.length,
    standard_rows: standard.length,
    body6_rows: body6.length,
    evidence_enabled: evidence.length,
    evidence_dual_source: dual.length,
    unique_additive_ids: unique.size,
    duplicate_additive_ids: ids.length - unique.size,
  };
}
