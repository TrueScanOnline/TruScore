/**
 * Versioned packet-certification discovery asset.
 * Search can surface wording. A deliberate tap on a selectable row names that
 * governed certification. Only selectable_existing rows have a scoring route.
 */

import { displayNameForCertification } from './resolveCertification';
import asset from './governed/packet_certification_manual_discovery_v1_0_1.json';
import selectionRegister from './governed/packet_certification_selection_v1_0_3.json';

export const DISCOVERY_ASSET_ID = 'rveel.packet_certification_manual_discovery';
export const DISCOVERY_BASE_VERSION = '1.0.1';
export const DISCOVERY_ASSET_VERSION = '1.0.3';

export type DiscoveryTreatment =
  | 'selectable_existing'
  | 'selectable_nonscoring'
  | 'discoverable_unapproved'
  | 'excluded_research_hold';

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
  /** True only for identities already connected to an approved scoring rule. */
  scoringEligible: boolean;
  productionId: string | null;
  terms: Array<{ text: string; role: DiscoveryTermRole }>;
  artwork: DiscoveryArtwork;
};

export type DiscoverySuggestion = {
  entryId: string;
  consumerName: string;
  qualifier: string | null;
  treatment: 'selectable_existing' | 'selectable_nonscoring' | 'discoverable_unapproved';
  selectable: boolean;
  scoringEligible: boolean;
  productionId: string | null;
};

export type DiscoveryValidation = {
  ok: boolean;
  assetId: string;
  assetVersion: string;
  entryCount: number;
  selectableExistingCount: number;
  selectableNonscoringCount: number;
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
  'selectable_nonscoring',
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
        selectableNonscoringCount: 0,
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
    let scoringEligible = false;
    if (treatment === 'selectable_existing') {
      scoringEligible = true;
      if (!productionId || !knownProductionId(productionId) || !selectable) {
        errors.push(`selectable_without_production_identity:${id}`);
        continue;
      }
    } else if (treatment === 'selectable_nonscoring') {
      scoringEligible = false;
      if (!productionId || !selectable) {
        errors.push(`nonscoring_without_identity:${id}`);
        continue;
      }
      if (knownProductionId(productionId)) {
        errors.push(`nonscoring_uses_scoring_identity:${id}`);
        continue;
      }
    } else {
      selectable = false;
      scoringEligible = false;
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
      scoringEligible,
      productionId: treatment === 'selectable_existing' || treatment === 'selectable_nonscoring' ? productionId : null,
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
        selectableNonscoringCount: 0,
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
      selectableNonscoringCount: entries.filter((entry) => entry.treatment === 'selectable_nonscoring').length,
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

type SelectionRegisterRow = {
  id?: unknown;
  runtime_treatment?: unknown;
  selectable?: unknown;
  scoring_eligible?: unknown;
  existing_production_id?: unknown;
  reason?: unknown;
};

function invalidRegister(
  loaded: { entries: DiscoveryEntry[]; validation: DiscoveryValidation },
  version: string,
  errors: string[]
): { entries: DiscoveryEntry[]; validation: DiscoveryValidation } {
  return {
    entries: [],
    validation: {
      ...loaded.validation,
      ok: false,
      assetVersion: version,
      entryCount: 0,
      selectableExistingCount: 0,
      selectableNonscoringCount: 0,
      errors: [...loaded.validation.errors, ...errors],
      aliasCollisions: [],
    },
  };
}

/** Applies the versioned selection register onto 1.0.1. Historical evidence is not rewritten. */
export function applySelectionRegister(
  loaded: { entries: DiscoveryEntry[]; validation: DiscoveryValidation },
  update: unknown
): { entries: DiscoveryEntry[]; validation: DiscoveryValidation } {
  const record = update && typeof update === 'object' ? (update as Record<string, unknown>) : null;
  const version = text(record?.asset_version);
  const base = text(record?.base_asset_version);
  const rows = Array.isArray(record?.register) ? (record.register as SelectionRegisterRow[]) : null;
  if (!record || text(record.asset_id) !== DISCOVERY_ASSET_ID || version !== DISCOVERY_ASSET_VERSION || base !== DISCOVERY_BASE_VERSION || !rows) {
    return invalidRegister(loaded, version, ['selection_register_invalid']);
  }
  if (!loaded.validation.ok) return loaded;
  const byId = new Map(loaded.entries.map((entry) => [entry.id, entry]));
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const row of rows) {
    const id = text(row.id);
    const current = byId.get(id);
    const treatment = row.runtime_treatment;
    const productionId = text(row.existing_production_id);
    const reason = text(row.reason);
    if (!current || seen.has(id) || !reason) {
      errors.push(`selection_register_rejected:${id || 'missing_id'}`);
      continue;
    }
    seen.add(id);
    if (treatment === 'selectable_existing') {
      if (
        current.treatment !== 'selectable_existing' ||
        row.selectable !== true ||
        row.scoring_eligible !== true ||
        !productionId ||
        productionId !== current.productionId
      ) {
        errors.push(`selection_register_rejected:${id}`);
      }
      continue;
    }
    if (treatment === 'excluded_research_hold') {
      if (current.treatment !== 'excluded_research_hold' || row.selectable !== false || row.scoring_eligible !== false || productionId) {
        errors.push(`selection_register_rejected:${id}`);
      }
      continue;
    }
    if (treatment === 'discoverable_unapproved') {
      if (current.treatment !== 'discoverable_unapproved' || row.selectable !== false || row.scoring_eligible !== false || productionId) {
        errors.push(`selection_register_rejected:${id}`);
      }
      continue;
    }
    if (treatment !== 'selectable_nonscoring' || current.treatment !== 'discoverable_unapproved' || row.selectable !== true || row.scoring_eligible !== false) {
      errors.push(`selection_register_rejected:${id}`);
      continue;
    }
    if (!productionId || productionId !== id || knownProductionId(productionId)) {
      errors.push(`selection_register_rejected:${id}`);
      continue;
    }
    byId.set(id, {
      ...current,
      treatment: 'selectable_nonscoring',
      selectable: true,
      scoringEligible: false,
      productionId,
    });
  }
  if (seen.size !== byId.size) errors.push('selection_register_incomplete');
  if (errors.length > 0) return invalidRegister(loaded, version, errors);
  const entries = [...byId.values()];
  return {
    entries,
    validation: {
      ...loaded.validation,
      ok: true,
      assetVersion: version,
      entryCount: entries.length,
      selectableExistingCount: entries.filter((entry) => entry.treatment === 'selectable_existing').length,
      selectableNonscoringCount: entries.filter((entry) => entry.treatment === 'selectable_nonscoring').length,
      aliasCollisions: aliasCollisions(entries),
    },
  };
}

const LOADED = applySelectionRegister(loadDiscoveryCatalogue(asset), selectionRegister);

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
        scoringEligible: false,
        productionId: null,
        rank: best,
      });
      continue;
    }
    if (
      (entry.treatment !== 'selectable_existing' && entry.treatment !== 'selectable_nonscoring') ||
      !entry.selectable ||
      !entry.productionId
    ) {
      continue;
    }
    ranked.push({
      entryId: entry.id,
      consumerName: entry.consumerName,
      qualifier: readableQualifier(entry),
      treatment: entry.treatment,
      selectable: true,
      scoringEligible: entry.scoringEligible,
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
      scoringEligible: row.scoringEligible,
      productionId: row.productionId,
    });
  }
  return suggestions;
}
