/**
 * Client presentation coverage checks for WP-09.
 * The control stays hidden unless the consumer card represents the full
 * authoritative agreement target set for the group.
 */

import {
  ordinaryLinesBesideRecognisedCertifications,
  consumerCertificationLine,
  displayCertificationName,
} from '../certifications/resolveCertification';
import { packetLineWithdrawn } from '../components/packetClaimsCardCopy';
import type { SharedEvidenceSnapshot } from '../evidenceAuthority/types';
import type { Product } from '../types/product';
import type { AgreementSubjectVersion, CommunityAgreementGroup } from './types';
import {
  nutritionOffKeyConsumerLabel,
  representedCommunityNutritionKeys,
} from './communityMarkers';
import { nutritionOffKeyForSubjectKey } from './targets';

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
}

function prevailingByVersion(
  snapshot: SharedEvidenceSnapshot,
  versionId: string
): SharedEvidenceSnapshot['prevailing'][number] | undefined {
  return snapshot.prevailing.find((row) => row.versionId === versionId);
}

function visiblePacketCommunity(product: Product): {
  claimWordings: Set<string>;
  certificationNames: Set<string>;
  absence: boolean;
} {
  const recognisedNames = (product.certifications || []).map((cert) => displayCertificationName(cert));
  const withdrawn = product.rveelWithdrawnPacketSubjectKeys;
  const visibleCertifications = ordinaryLinesBesideRecognisedCertifications(
    product.rveelGovernedCertifications || [],
    recognisedNames
  ).filter((name) => !packetLineWithdrawn('certification', name, withdrawn));
  const visibleClaims = (product.rveelGovernedPacketClaims || []).filter(
    (claim) =>
      !packetLineWithdrawn('claim', claim.exactWording, withdrawn) &&
      ordinaryLinesBesideRecognisedCertifications([claim.exactWording], recognisedNames).length > 0
  );
  return {
    claimWordings: new Set(visibleClaims.map((claim) => claim.exactWording)),
    certificationNames: new Set(visibleCertifications),
    absence: product.rveelPacketAbsenceEstablished === true,
  };
}

function presentationMatchesNutrition(
  product: Product,
  snapshot: SharedEvidenceSnapshot,
  pairs: AgreementSubjectVersion[]
): boolean {
  const expectedKeys = new Set<string>();
  for (const pair of pairs) {
    const key = nutritionOffKeyForSubjectKey(pair.subjectKey);
    if (!key) return false;
    expectedKeys.add(key);
  }
  // Only keys that actually drive NutritionTable-displayed values count as represented.
  const represented = representedCommunityNutritionKeys(
    product.nutriments,
    product.rveelGovernedNutrimentKeys
  );
  if (!setsEqual(expectedKeys, represented)) return false;
  for (const pair of pairs) {
    const row = prevailingByVersion(snapshot, pair.versionId);
    if (!row?.evidence?.ingredientsNutrition?.nutriments?.length) return false;
  }
  return expectedKeys.size > 0;
}

function presentationMatchesIngredients(
  product: Product,
  snapshot: SharedEvidenceSnapshot,
  pairs: AgreementSubjectVersion[]
): boolean {
  if (pairs.length !== 1) return false;
  const row = prevailingByVersion(snapshot, pairs[0].versionId);
  const text = row?.evidence?.ingredientsNutrition?.ingredientsText?.trim();
  if (!text) return false;
  const displayed = product.rveelGovernedIngredientsText?.trim();
  return displayed === text;
}

function presentationMatchesOrigins(
  product: Product,
  snapshot: SharedEvidenceSnapshot,
  pairs: AgreementSubjectVersion[]
): boolean {
  const facts = product.rveelGovernedOrigins || [];
  if (facts.length === 0 || pairs.length === 0) return false;
  const productIds = new Set(facts.map((fact) => fact.evidenceId));
  const targetIds = new Set<string>();
  for (const pair of pairs) {
    const row = prevailingByVersion(snapshot, pair.versionId);
    const evidenceId = row?.evidence?.evidenceId;
    if (!evidenceId) return false;
    targetIds.add(evidenceId);
  }
  return setsEqual(productIds, targetIds);
}

function presentationMatchesPacket(
  product: Product,
  snapshot: SharedEvidenceSnapshot,
  pairs: AgreementSubjectVersion[]
): boolean {
  if (pairs.length === 0) return false;
  const visible = visiblePacketCommunity(product);
  const expectedClaims = new Set<string>();
  const expectedCerts = new Set<string>();
  let expectAbsence = false;

  for (const pair of pairs) {
    const row = prevailingByVersion(snapshot, pair.versionId);
    if (!row) return false;
    if (pair.subjectKey === 'packet_claims|absence|scope:whole_packet') {
      expectAbsence = true;
      continue;
    }
    if (pair.subjectKey.startsWith('packet_claims|')) {
      const wording = row.evidence.exactWording?.trim();
      if (!wording) return false;
      expectedClaims.add(wording);
      continue;
    }
    if (pair.subjectKey.startsWith('certifications|')) {
      const name = consumerCertificationLine({
        certificationId: row.evidence.certificationId,
        exactWording: row.evidence.exactWording,
        claimValue: row.evidence.claimValue,
        certificationScope: row.evidence.certificationScope,
        certificationScopeSubject: row.evidence.certificationScopeSubject,
      });
      if (!name) return false;
      expectedCerts.add(name);
      continue;
    }
    return false;
  }

  if (expectAbsence !== visible.absence) return false;
  if (!setsEqual(expectedClaims, visible.claimWordings)) return false;
  if (!setsEqual(expectedCerts, visible.certificationNames)) return false;
  return true;
}

/**
 * True only when every authoritative target for the group is clearly represented
 * on the current consumer card, and no extra community lines for that group exist.
 */
export function presentationMatchesAgreementTargets(
  group: CommunityAgreementGroup,
  product: Product | null | undefined,
  snapshot: SharedEvidenceSnapshot | null | undefined,
  pairs: AgreementSubjectVersion[]
): boolean {
  if (!product || !snapshot || pairs.length === 0) return false;
  if (group === 'nutrition') return presentationMatchesNutrition(product, snapshot, pairs);
  if (group === 'ingredients') return presentationMatchesIngredients(product, snapshot, pairs);
  if (group === 'origins') return presentationMatchesOrigins(product, snapshot, pairs);
  if (group === 'packet_information') return presentationMatchesPacket(product, snapshot, pairs);
  return false;
}

/** Short consumer hint listing which community details the prompt covers. */
export function communityAgreementScopeHint(
  group: CommunityAgreementGroup,
  product: Product | null | undefined
): string {
  if (group === 'nutrition') {
    const represented = [
      ...representedCommunityNutritionKeys(product?.nutriments, product?.rveelGovernedNutrimentKeys),
    ];
    if (represented.length === 0) return 'Only nutrient rows marked Community-added';
    const labels = [...new Set(represented.map(nutritionOffKeyConsumerLabel))];
    return `Only nutrient rows marked Community-added: ${labels.join(', ')}`;
  }
  if (group === 'ingredients') return 'The ingredients list marked Community-added';
  if (group === 'origins') {
    return 'Origin statements marked Community-added (not the OFF country hero)';
  }
  return 'Packet lines marked Community-added (not OFF-only badges)';
}
