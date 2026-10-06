/**
 * Packet information resolution.
 * Machine output and typed wording are proposals. Catalogue identity is decided here.
 * Scoring points stay on the existing Ethics mappings. This module does not award points.
 */

import type { EvidenceFactInput } from '../evidenceAuthority/types';
import {
  CERTIFICATION_ARTWORK_REGISTER_CSV,
  CERTIFICATION_CATALOGUE_CSV,
  CERTIFICATION_RECOGNITION_TERMS_CSV,
} from './governedCsv';
import { parseCatalogueCsv } from './parseCatalogueCsv';
import { formatCertificationTagForPicker } from '../services/ethicsCertificationsService';

export const PACKET_REVIEW_PROMPT = 'Is this on the pack?';
export const PACKET_REVIEW_YES = 'Yes';
export const PACKET_REVIEW_CHANGE = 'Change';
export const PACKET_REVIEW_REMOVE = 'Remove';
export const PACKET_MANUAL_ENTRY = 'Enter what\u2019s on the pack';
export const PACKET_UNMATCHED_ENTRY = 'Can\u2019t find it? Add what\u2019s on the pack';
export const CLOSER_PHOTO_TITLE = 'Certification mark detected';
export const CLOSER_PHOTO_BODY = 'A closer photo is needed to identify it.';
export const CLOSER_PHOTO_ACTION = 'Take closer photo';

export type CertificationScopeClass =
  | 'whole_product'
  | 'ingredient_component'
  | 'packaging'
  | 'other_governed'
  | 'unresolved';

export type CertificationLifecycle = 'active' | 'legacy' | 'retired' | 'invalidated';

export type CatalogueRow = {
  certificationId: string;
  displayName: string;
  familyName: string;
  lifecycle: string;
  identityClass: string;
  supportedScopes: string[];
  scopeRule: string;
  mvpScoreEligible: boolean;
  mvpPoints: number;
  mvpReceiver: string;
  succeededBy: string;
};

export type RecognitionTerm = {
  certificationId: string;
  term: string;
  termRole: 'identity_establishing' | 'discovery_only';
  termType: string;
  mayEstablishIdentity: boolean;
};

export type ArtworkRow = {
  certificationId: string;
  consumerDisplayPermission: string;
  assetRef: string;
};

export type GovernedCertificationAssets = {
  catalogue: CatalogueRow[];
  terms: RecognitionTerm[];
  artwork: ArtworkRow[];
};

export type PacketObservationInput = {
  observedWording?: string;
  visualMark?: boolean;
  ambiguity?: 'insufficient' | 'family_variants' | 'none';
  /** Model proposal only. Ignored unless the wording independently establishes that identity. */
  proposedCertificationId?: string;
  /** Deliberate search selection. This may establish identity. The typed discovery term alone cannot. */
  selectedCertificationId?: string;
  scopeClass?: string;
  scopeSubject?: string;
  proposedFamilyName?: string;
};

export type PacketSearchHit = {
  certificationId: string;
  displayName: string;
  matchedTerm: string;
};

export type PacketResolution =
  | {
      kind: 'certification';
      certificationId: string;
      displayName: string;
      observedWording: string;
      scoringLabel?: string;
      scopeClass: CertificationScopeClass;
      scopeSubject?: string;
    }
  | {
      kind: 'shortlist';
      familyName: string;
      options: Array<{ certificationId: string; displayName: string }>;
    }
  | { kind: 'closer_photo' }
  | { kind: 'wording'; observedWording: string };

const SCORING_LABELS: Record<string, string> = {
  'cert.fairtrade': 'en:fair-trade',
  'cert.rainforest_alliance': 'en:rainforest-alliance',
  'cert.utz': 'en:utz',
  'cert.msc': 'en:marine-stewardship-council',
  'cert.asc': 'en:asc',
  'cert.aco_organic': 'en:aco-certified-organic',
};

const TAG_TO_CERTIFICATION: Record<string, string> = {
  'en:fair-trade': 'cert.fairtrade',
  'en:fairtrade': 'cert.fairtrade',
  'en:rainforest-alliance': 'cert.rainforest_alliance',
  'en:rainforest-alliance-certified': 'cert.rainforest_alliance',
  'en:utz': 'cert.utz',
  'en:utz-certified': 'cert.utz',
  'en:marine-stewardship-council': 'cert.msc',
  'en:msc-certified': 'cert.msc',
  'en:asc': 'cert.asc',
  'en:asc-certified': 'cert.asc',
  'en:aquaculture-stewardship-council': 'cert.asc',
  'en:aco-certified-organic': 'cert.aco_organic',
  'en:australian-certified-organic': 'cert.aco_organic',
};

function asBool(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

export function loadGovernedCertificationAssets(): GovernedCertificationAssets {
  const catalogue = parseCatalogueCsv(CERTIFICATION_CATALOGUE_CSV).map((row) => ({
    certificationId: row.certification_id,
    displayName: row.display_name,
    familyName: row.family_name,
    lifecycle: row.lifecycle,
    identityClass: row.identity_class,
    supportedScopes: (row.supported_scopes || '')
      .split('|')
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0),
    scopeRule: row.scope_rule,
    mvpScoreEligible: asBool(row.mvp_score_eligible),
    mvpPoints: Number(row.mvp_points) || 0,
    mvpReceiver: row.mvp_receiver,
    succeededBy: row.succeeded_by,
  }));
  const terms = parseCatalogueCsv(CERTIFICATION_RECOGNITION_TERMS_CSV).map((row) => ({
    certificationId: row.certification_id,
    term: row.term,
    termRole: row.term_role === 'identity_establishing' ? 'identity_establishing' as const : 'discovery_only' as const,
    termType: row.term_type,
    mayEstablishIdentity: asBool(row.may_establish_identity) && row.term_role === 'identity_establishing',
  }));
  const artwork = parseCatalogueCsv(CERTIFICATION_ARTWORK_REGISTER_CSV).map((row) => ({
    certificationId: row.certification_id,
    consumerDisplayPermission: row.consumer_display_permission,
    assetRef: row.asset_ref,
  }));
  return { catalogue, terms, artwork };
}

const GOVERNED_ASSETS = loadGovernedCertificationAssets();

export function governedCertificationAssets(): GovernedCertificationAssets {
  return GOVERNED_ASSETS;
}

export function normalizeCertificationText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function phraseIn(haystack: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${haystack} `.includes(` ${phrase} `);
}

function catalogueById(assets: GovernedCertificationAssets): Map<string, CatalogueRow> {
  return new Map(assets.catalogue.map((row) => [row.certificationId, row]));
}

export function scoringLabelForCertification(certificationId: string): string | undefined {
  const row = catalogueById(GOVERNED_ASSETS).get(certificationId);
  if (!row?.mvpScoreEligible) return undefined;
  return SCORING_LABELS[certificationId];
}

export function certificationIdForScoringTag(tag: string): string | undefined {
  return TAG_TO_CERTIFICATION[tag.trim().toLowerCase()];
}

export function displayNameForCertification(certificationId: string): string | undefined {
  return catalogueById(GOVERNED_ASSETS).get(certificationId)?.displayName;
}

/** Emblems render only when the artwork register grants consumer display permission. */
export function consumerEmblemPermitted(certificationId: string): boolean {
  const row = GOVERNED_ASSETS.artwork.find((item) => item.certificationId === certificationId);
  if (!row) return false;
  const permission = row.consumerDisplayPermission.trim().toLowerCase();
  return permission === 'permitted' || permission === 'granted' || permission === 'yes';
}

export function consumerEmblemPermittedForTag(tag: string): boolean {
  const certificationId = certificationIdForScoringTag(tag);
  if (!certificationId) return true;
  return consumerEmblemPermitted(certificationId);
}

function identityMatches(wording: string, assets: GovernedCertificationAssets): string[] {
  const normalized = normalizeCertificationText(wording);
  if (!normalized) return [];
  const hits = new Set<string>();
  const terms = assets.terms
    .filter((term) => term.mayEstablishIdentity)
    .slice()
    .sort((a, b) => normalizeCertificationText(b.term).length - normalizeCertificationText(a.term).length);
  for (const term of terms) {
    const phrase = normalizeCertificationText(term.term);
    if (phraseIn(normalized, phrase)) hits.add(term.certificationId);
  }
  for (const row of assets.catalogue) {
    const name = normalizeCertificationText(row.displayName);
    if (phraseIn(normalized, name)) hits.add(row.certificationId);
  }
  return [...hits];
}

function establishedScope(input: PacketObservationInput): {
  scopeClass: CertificationScopeClass;
  scopeSubject?: string;
} {
  const allowed: CertificationScopeClass[] = ['whole_product', 'ingredient_component', 'packaging', 'other_governed'];
  if (!input.scopeClass || !allowed.includes(input.scopeClass as CertificationScopeClass)) {
    return { scopeClass: 'unresolved' };
  }
  const scopeClass = input.scopeClass as CertificationScopeClass;
  const subject = input.scopeSubject?.trim();
  if (scopeClass === 'ingredient_component' && !subject) return { scopeClass: 'unresolved' };
  return { scopeClass, ...(subject ? { scopeSubject: subject } : {}) };
}

function certificationResolution(
  certificationId: string,
  observedWording: string,
  input: PacketObservationInput,
  assets: GovernedCertificationAssets
): PacketResolution {
  const row = catalogueById(assets).get(certificationId);
  if (!row) return { kind: 'wording', observedWording };
  const scope = establishedScope(input);
  const scoringLabel = scoringLabelForCertification(certificationId);
  return {
    kind: 'certification',
    certificationId,
    displayName: row.displayName,
    observedWording: observedWording.trim() || row.displayName,
    ...(scoringLabel ? { scoringLabel } : {}),
    scopeClass: scope.scopeClass,
    ...(scope.scopeSubject ? { scopeSubject: scope.scopeSubject } : {}),
  };
}

function familyShortlist(
  familyName: string,
  assets: GovernedCertificationAssets
): Array<{ certificationId: string; displayName: string }> {
  const normalized = normalizeCertificationText(familyName);
  if (!normalized) return [];
  return assets.catalogue
    .filter((row) => normalizeCertificationText(row.familyName) === normalized)
    .filter((row) => row.lifecycle === 'active' || row.lifecycle === 'legacy')
    .map((row) => ({ certificationId: row.certificationId, displayName: row.displayName }));
}

/**
 * Deterministic resolution. Generic wording and discovery terms never establish identity.
 * An unclear mark asks for a closer photo. It does not offer a subject-matter shortlist.
 */
export function resolvePacketObservation(
  input: PacketObservationInput,
  assets: GovernedCertificationAssets = GOVERNED_ASSETS
): PacketResolution {
  const observedWording = (input.observedWording || '').trim();
  const catalogue = catalogueById(assets);

  if (input.selectedCertificationId && catalogue.has(input.selectedCertificationId)) {
    return certificationResolution(input.selectedCertificationId, observedWording || catalogue.get(input.selectedCertificationId)!.displayName, input, assets);
  }

  const matches = observedWording ? identityMatches(observedWording, assets) : [];
  const proposed = input.proposedCertificationId?.trim();
  if (proposed && catalogue.has(proposed) && matches.includes(proposed) && matches.length === 1) {
    return certificationResolution(proposed, observedWording, input, assets);
  }
  if (matches.length === 1) {
    return certificationResolution(matches[0], observedWording, input, assets);
  }
  if (matches.length > 1) {
    const families = new Set(matches.map((id) => catalogue.get(id)?.familyName || id));
    if (input.visualMark && input.ambiguity === 'family_variants' && families.size === 1) {
      const familyName = [...families][0];
      const options = matches
        .map((id) => catalogue.get(id))
        .filter((row): row is CatalogueRow => !!row)
        .map((row) => ({ certificationId: row.certificationId, displayName: row.displayName }));
      if (options.length > 1) return { kind: 'shortlist', familyName, options };
    }
    return { kind: 'closer_photo' };
  }

  if (input.visualMark || input.ambiguity === 'insufficient') {
    if (input.ambiguity === 'family_variants' && input.proposedFamilyName) {
      const options = familyShortlist(input.proposedFamilyName, assets);
      if (input.visualMark && options.length > 1) {
        return { kind: 'shortlist', familyName: input.proposedFamilyName, options };
      }
    }
    return { kind: 'closer_photo' };
  }

  return { kind: 'wording', observedWording };
}

/** Deliberate search. Discovery terms can retrieve rows. They do not establish identity until selected. */
export function searchPacketInformation(query: string, assets: GovernedCertificationAssets = GOVERNED_ASSETS): PacketSearchHit[] {
  const normalized = normalizeCertificationText(query);
  if (normalized.length < 2) return [];
  const catalogue = catalogueById(assets);
  const hits = new Map<string, PacketSearchHit>();
  const consider = (certificationId: string, matchedTerm: string) => {
    const row = catalogue.get(certificationId);
    if (!row || hits.has(certificationId)) return;
    hits.set(certificationId, { certificationId, displayName: row.displayName, matchedTerm });
  };
  for (const row of assets.catalogue) {
    if (phraseIn(normalizeCertificationText(row.displayName), normalized) || phraseIn(normalized, normalizeCertificationText(row.displayName))) {
      consider(row.certificationId, row.displayName);
    }
  }
  for (const term of assets.terms) {
    const phrase = normalizeCertificationText(term.term);
    if (!phrase) continue;
    if (phraseIn(phrase, normalized) || phraseIn(normalized, phrase)) consider(term.certificationId, term.term);
  }
  return [...hits.values()];
}

export function evidenceFactFromResolution(resolution: PacketResolution): EvidenceFactInput | null {
  if (resolution.kind === 'certification') {
    return {
      domain: 'certifications',
      exactWording: resolution.observedWording,
      claimValue: resolution.observedWording,
      certificationId: resolution.certificationId,
      ...(resolution.scopeClass !== 'unresolved'
        ? {
            certificationScope: resolution.scopeClass,
            ...(resolution.scopeSubject ? { certificationScopeSubject: resolution.scopeSubject } : {}),
          }
        : {}),
    };
  }
  if (resolution.kind === 'wording' && resolution.observedWording.trim()) {
    return {
      domain: 'packet_claims',
      exactWording: resolution.observedWording,
      claimValue: resolution.observedWording,
    };
  }
  return null;
}

export function isSameCurrentProposition(resolution: PacketResolution, currentWordings: string[]): boolean {
  if (resolution.kind !== 'certification' && resolution.kind !== 'wording') return false;
  return currentWordings.some((current) => {
    const existing = resolvePacketObservation({ observedWording: current });
    if (resolution.kind === 'certification' && existing.kind === 'certification') {
      return (
        existing.certificationId === resolution.certificationId &&
        existing.scopeClass === resolution.scopeClass &&
        (existing.scopeSubject || '') === (resolution.scopeSubject || '')
      );
    }
    if (resolution.kind === 'wording' && existing.kind === 'wording') {
      return normalizeCertificationText(existing.observedWording) === normalizeCertificationText(resolution.observedWording);
    }
    return false;
  });
}

/**
 * A later photo that does not mention a current proposition is not removal.
 * Removal happens only when the consumer uses Remove or replaces that proposition.
 */
export function retainCurrentDespiteNonDetection<T>(current: readonly T[]): T[] {
  return current.slice();
}

/**
 * Preserved Ethics mappings are not scope-dependent. An assessment that declares
 * it needs scope is withheld until the packet establishes that scope.
 */
export function scopeDependentAssessment(input: { requiresScope: boolean; scopeClass?: CertificationScopeClass }): 'apply' | 'withheld' {
  if (!input.requiresScope) return 'apply';
  if (!input.scopeClass || input.scopeClass === 'unresolved') return 'withheld';
  return 'apply';
}

/**
 * Ordinary packet text is withheld when the same certification is already shown
 * with its certification treatment. Generic wording that is not that certification stays.
 */
export function ordinaryLinesBesideRecognisedCertifications(
  ordinaryLines: string[],
  recognisedDisplayNames: string[]
): string[] {
  const shownNames = new Set(recognisedDisplayNames.map((name) => normalizeCertificationText(name)));
  const shownCertifications = new Set(
    recognisedDisplayNames
      .map((name) => canonicalCertificationKey(name))
      .filter((key): key is string => key != null)
  );
  return ordinaryLines.filter((line) => {
    const text = line.trim();
    if (!text) return false;
    if (shownNames.has(normalizeCertificationText(text))) return false;
    const key = canonicalCertificationKey(text);
    return key == null || !shownCertifications.has(key);
  });
}

export function displayCertificationName(cert: { name?: string; tag?: string; id?: string }): string {
  const name = (cert.name || '').trim();
  if (name && !/^[a-z]{2}:/i.test(name)) return name;
  return formatCertificationTagForPicker(cert.tag || cert.id || name);
}

function canonicalCertificationKey(wording: string): string | null {
  const resolved = resolvePacketObservation({ observedWording: wording });
  if (resolved.kind !== 'certification') return null;
  return `${resolved.certificationId}|${resolved.scopeClass}|${resolved.scopeSubject || ''}`;
}

export function consumerCertificationLine(input: {
  certificationId?: string;
  exactWording?: string;
  claimValue?: string;
  certificationScope?: string;
  certificationScopeSubject?: string;
}): string {
  const governedName = input.certificationId ? displayNameForCertification(input.certificationId) : undefined;
  const base = (governedName || input.exactWording || input.claimValue || '').trim();
  if (input.certificationScope === 'ingredient_component' && input.certificationScopeSubject?.trim()) {
    const subject = input.certificationScopeSubject.trim();
    const pretty = subject.charAt(0).toUpperCase() + subject.slice(1);
    return `${base} / ${pretty}`;
  }
  return base;
}
