/**
 * Versioned packet-certification discovery asset.
 * Search can surface wording. Only a deliberate tap on a selectable_existing
 * row may name an existing production certification. Scoring is unchanged.
 */

import { displayNameForCertification } from './resolveCertification';
import asset from './governed/packet_certification_manual_discovery_v1_0_1.json';

export const DISCOVERY_ASSET_ID = 'rveel.packet_certification_manual_discovery';
export const DISCOVERY_ASSET_VERSION = '1.0.1';

export type DiscoveryTreatment = 'selectable_existing' | 'discoverable_unapproved' | 'excluded_research_hold';

export type DiscoveryTermRole = 'canonical_display' | 'identity_establishing' | 'discovery_only';

export type DiscoveryArtwork = {
  assetRef: string | null;
  permissionStatus: string;
  renderEnabled: boolean;
  approvedSurfaces: string[];
  validUntil: string | null;
  revokedAt: string | null;
  territory: string | null;
  platform: string | null;
  productAssociationRequired: boolean;
  approvedVariant: string | null;
  permissionEvidenceRef: string | null;
};

export type DiscoveryEntry = {
  id: string;
  familyId: string;
  consumerName: string;
  semanticVariant: string;
  subjectScopeDescription: string;
  lifecycle: string;
  treatment: DiscoveryTreatment;
  searchVisible: boolean;
  selectable: boolean;
  productionId: string | null;
  terms: Array<{ text: string; role: DiscoveryTermRole }>;
  artwork: DiscoveryArtwork;
};

export type DiscoverySuggestion = {
  entryId: string;
  consumerName: string;
  qualifier: string | null;
  treatment: 'selectable_existing' | 'discoverable_unapproved';
  selectable: boolean;
  productionId: string | null;
};

export type DiscoveryValidation = {
  ok: boolean;
  assetId: string;
  assetVersion: string;
  entryCount: number;
  selectableExistingCount: number;
  errors: string[];
  /** Exact normalised terms shared by more than one visible entry. Search lists every entry. */
  aliasCollisions: Array<{ term: string; entryIds: string[] }>;
};

type RawTerm = { text?: unknown; role?: unknown };
type RawEntry = {
  id?: unknown;
  family_id?: unknown;
  consumer_name?: unknown;
  semantic_variant?: unknown;
  subject_scope_description?: unknown;
  lifecycle?: unknown;
  runtime_treatment?: unknown;
  search_visible?: unknown;
  selectable?: unknown;
  existing_production_id?: unknown;
  terms?: unknown;
  artwork?: unknown;
};

const TREATMENTS = new Set<DiscoveryTreatment>([
  'selectable_existing',
  'discoverable_unapproved',
  'excluded_research_hold',
]);

export function normalizeDiscoveryQuery(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function artworkOf(value: unknown): DiscoveryArtwork {
  const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const surfaces = Array.isArray(row.approved_surfaces)
    ? row.approved_surfaces.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
  return {
    assetRef: text(row.asset_ref) || null,
    permissionStatus: text(row.permission_status) || 'not_obtained',
    renderEnabled: row.render_enabled === true,
    approvedSurfaces: surfaces,
    validUntil: text(row.valid_until) || null,
    revokedAt: text(row.revoked_at) || null,
    territory: text(row.territory) || null,
    platform: text(row.platform) || null,
    productAssociationRequired: row.product_association_required === true,
    approvedVariant: text(row.approved_variant) || null,
    permissionEvidenceRef: text(row.permission_evidence_ref) || null,
  };
}

function termRole(value: unknown): DiscoveryTermRole | null {
  if (value === 'canonical_display' || value === 'identity_establishing' || value === 'discovery_only') return value;
  return null;
}

function knownProductionId(id: string): boolean {
  return id.length > 0 && !!displayNameForCertification(id);
}

/**
 * Validate a published snapshot. Duplicate ids or a missing version fail the asset.
 * A malformed entry is omitted. Excluded and non-visible rows never become suggestions.
 */
export function loadDiscoveryCatalogue(raw: unknown): { entries: DiscoveryEntry[]; validation: DiscoveryValidation } {
  const errors: string[] = [];
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
  const assetId = text(record?.asset_id);
  const assetVersion = text(record?.asset_version);
  if (!record) errors.push('asset_not_object');
  if (assetId !== DISCOVERY_ASSET_ID) errors.push('asset_id_mismatch');
  if (!assetVersion) errors.push('asset_version_missing');
  const rawEntries = Array.isArray(record?.entries) ? (record?.entries as RawEntry[]) : null;
  if (!rawEntries) errors.push('entries_missing');
  if (errors.length > 0 || !rawEntries) {
    return {
      entries: [],
      validation: {
        ok: false,
        assetId,
        assetVersion,
        entryCount: 0,
        selectableExistingCount: 0,
        errors,
        aliasCollisions: [],
      },
    };
  }

  const seen = new Set<string>();
  const entries: DiscoveryEntry[] = [];
  for (const row of rawEntries) {
    const id = text(row.id);
    const treatment = row.runtime_treatment;
    if (!id || seen.has(id) || !TREATMENTS.has(treatment as DiscoveryTreatment)) {
      if (id && seen.has(id)) errors.push(`duplicate_id:${id}`);
      else errors.push(`malformed_entry:${id || 'missing_id'}`);
      continue;
    }
    seen.add(id);
    const consumerName = text(row.consumer_name);
    if (!consumerName) {
      errors.push(`malformed_entry:${id}`);
      continue;
    }
    const productionId = text(row.existing_production_id) || null;
    let selectable = row.selectable === true;
    const searchVisible = row.search_visible === true;
    if (treatment === 'selectable_existing') {
      if (!productionId || !knownProductionId(productionId) || !selectable) {
        errors.push(`selectable_without_production_identity:${id}`);
        continue;
      }
    } else {
      selectable = false;
    }
    const terms: DiscoveryEntry['terms'] = [];
    if (Array.isArray(row.terms)) {
      for (const term of row.terms as RawTerm[]) {
        const role = termRole(term.role);
        const label = text(term.text);
        if (!role || !label) continue;
        terms.push({ text: label, role });
      }
    }
    entries.push({
      id,
      familyId: text(row.family_id),
      consumerName,
      semanticVariant: text(row.semantic_variant),
      subjectScopeDescription: text(row.subject_scope_description),
      lifecycle: text(row.lifecycle),
      treatment: treatment as DiscoveryTreatment,
      searchVisible,
      selectable,
      productionId: treatment === 'selectable_existing' ? productionId : null,
      terms,
      artwork: artworkOf(row.artwork),
    });
  }

  if (errors.some((error) => error.startsWith('duplicate_id:'))) {
    return {
      entries: [],
      validation: {
        ok: false,
        assetId,
        assetVersion,
        entryCount: 0,
        selectableExistingCount: 0,
        errors,
        aliasCollisions: [],
      },
    };
  }

  return {
    entries,
    validation: {
      ok: errors.length === 0,
      assetId,
      assetVersion,
      entryCount: entries.length,
      selectableExistingCount: entries.filter((entry) => entry.treatment === 'selectable_existing').length,
      errors,
      aliasCollisions: aliasCollisions(entries),
    },
  };
}

function aliasCollisions(entries: DiscoveryEntry[]): DiscoveryValidation['aliasCollisions'] {
  const groups = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!entry.searchVisible || entry.treatment === 'excluded_research_hold') continue;
    for (const term of entry.terms) {
      const key = normalizeDiscoveryQuery(term.text);
      if (!key) continue;
      const ids = groups.get(key) || new Set<string>();
      ids.add(entry.id);
      groups.set(key, ids);
    }
  }
  return [...groups.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([term, ids]) => ({ term, entryIds: [...ids].sort() }));
}

const LOADED = loadDiscoveryCatalogue(asset);

export function discoveryCatalogueValidation(): DiscoveryValidation {
  return LOADED.validation;
}

export function discoveryEntries(): DiscoveryEntry[] {
  return LOADED.entries;
}

export function discoveryEntryByProductionId(productionId: string): DiscoveryEntry | undefined {
  return LOADED.entries.find((entry) => entry.productionId === productionId && entry.selectable);
}

function readableQualifier(entry: DiscoveryEntry): string | null {
  const name = normalizeDiscoveryQuery(entry.consumerName);
  const variant = entry.semanticVariant.replace(/_/g, ' ').trim();
  if (variant && !name.includes(normalizeDiscoveryQuery(variant))) return variant.charAt(0).toUpperCase() + variant.slice(1);
  if (entry.subjectScopeDescription.includes('packaging') && !name.includes('packaging')) return 'Packaging component';
  return null;
}

function rankTerm(query: string, label: string, role: DiscoveryTermRole | 'name'): number | null {
  const text = normalizeDiscoveryQuery(label);
  if (!query || !text) return null;
  const exact = text === query;
  const prefix = text.startsWith(query);
  const inside = text.includes(query);
  if (!exact && !prefix && !inside) return null;
  if (role === 'canonical_display' || role === 'name') {
    if (exact) return 0;
    if (prefix) return 1;
  }
  if (role === 'identity_establishing' && exact) return 2;
  if (prefix) return 3;
  return 4;
}

/** Suggestions for the open field. Excluded and hidden rows are absent. Nothing is pre-selected. */
export function searchDiscoveryCatalogue(query: string, entries: DiscoveryEntry[] = LOADED.entries): DiscoverySuggestion[] {
  const normalized = normalizeDiscoveryQuery(query);
  if (normalized.length < 1) return [];
  const ranked: Array<DiscoverySuggestion & { rank: number }> = [];
  for (const entry of entries) {
    if (entry.treatment === 'excluded_research_hold' || !entry.searchVisible) continue;
    if (entry.lifecycle === 'retired') continue;
    let best: number | null = rankTerm(normalized, entry.consumerName, 'name');
    for (const term of entry.terms) {
      const rank = rankTerm(normalized, term.text, term.role);
      if (rank == null) continue;
      if (best == null || rank < best) best = rank;
    }
    if (best == null) continue;
    if (entry.treatment === 'discoverable_unapproved') {
      ranked.push({
        entryId: entry.id,
        consumerName: entry.consumerName,
        qualifier: readableQualifier(entry),
        treatment: 'discoverable_unapproved',
        selectable: false,
        productionId: null,
        rank: best,
      });
      continue;
    }
    if (!entry.selectable || !entry.productionId) continue;
    ranked.push({
      entryId: entry.id,
      consumerName: entry.consumerName,
      qualifier: readableQualifier(entry),
      treatment: 'selectable_existing',
      selectable: true,
      productionId: entry.productionId,
      rank: best,
    });
  }
  ranked.sort((left, right) => left.rank - right.rank || left.consumerName.localeCompare(right.consumerName));
  const seen = new Set<string>();
  const suggestions: DiscoverySuggestion[] = [];
  for (const row of ranked) {
    if (seen.has(row.entryId)) continue;
    seen.add(row.entryId);
    suggestions.push({
      entryId: row.entryId,
      consumerName: row.consumerName,
      qualifier: row.qualifier,
      treatment: row.treatment,
      selectable: row.selectable,
      productionId: row.productionId,
    });
  }
  return suggestions;
}
