/**
 * Consumer contribution vocabulary and which current propositions a journey shows.
 * Add contributes something Rveel does not hold. Change amends what it holds.
 * This module does not score, admit, or construct the Submit payload.
 */

import { ceasedPrevailingSubjectKeys, correctionClosureFacts } from './correctionClosure';
import type { OriginContributionDraft } from './governedDisplayProjection';
import { ordinaryLinesBesideRecognisedCertifications } from '../certifications/resolveCertification';
import { originFactLabel } from '../origins/productOriginsCard';
import type { GovernedOriginFact } from '../origins/governedFacts';

export type ContributionSurfaceMode = 'add' | 'change';

export const CHANGE_NUTRITION = 'Change nutrition';
export const CHANGE_INGREDIENTS = 'Change ingredients';
export const CHANGE_PACKET_INFORMATION = 'Change packet information';
export const ADD_PACKET_INFORMATION = 'Add packet information';
export const CHANGE_PRODUCT_ORIGINS = 'Change product origins';
export const ADD_PRODUCT_ORIGINS = 'Add product origins';

const EMPTY_ORIGIN: OriginContributionDraft = {
  claimType: null,
  wording: '',
  place: '',
  ingredient: '',
  percentage: '',
  intent: 'new',
};

const ORIGIN_GAP_MESSAGES = new Set([
  'Choose the type of origin statement and the country.',
  'Choose the type of origin statement.',
  'Name the ingredient on the pack.',
  'Choose the country.',
]);

/** Lines still drawn as ordinary packet text after certification badges have been rendered. */
export function resultPacketInformationLines(input: {
  claimWordings: string[];
  certificationNames: string[];
  recognisedCertificationNames: string[];
}): string[] {
  const recognised = input.recognisedCertificationNames.map((name) => name.trim()).filter((name) => name.length > 0);
  return [
    ...ordinaryLinesBesideRecognisedCertifications(input.claimWordings, recognised),
    ...recognised,
    ...ordinaryLinesBesideRecognisedCertifications(input.certificationNames, recognised),
  ];
}

/** A packet row is editable only when it has wording. Add hides propositions Rveel already holds. */
export function packetRowVisible(mode: ContributionSurfaceMode, row: string, retained: string[]): boolean {
  const text = row.trim();
  if (!text) return false;
  if (mode === 'add') {
    return !retained.some((item) => item.trim().toLowerCase() === text.toLowerCase());
  }
  return true;
}

/**
 * Change opens the current origin propositions.
 * Add opens one empty statement and does not copy a current proposition into it.
 */
export function originRowsForJourney(
  mode: ContributionSurfaceMode,
  governed: OriginContributionDraft[],
  offPlace: string
): OriginContributionDraft[] {
  const current = governed.filter((row) => row.claimType && row.place.trim());
  if (mode === 'change' && current.length > 0) return current;
  if (mode === 'add' && current.length > 0) return [{ ...EMPTY_ORIGIN }];
  const place = offPlace.trim();
  if (place) return [{ ...EMPTY_ORIGIN, place }];
  return [{ ...EMPTY_ORIGIN }];
}

/** Structured origin sentence. Observed packet wording is not part of this line. */
export function originChangeLine(claimType: GovernedOriginFact['claimType'], country: string): string {
  return `${originFactLabel(claimType)} ${country}`;
}

/** Subject keys for origin propositions removed from the Change form. */
export function ceasedOriginsRemovedFromForm(
  opened: OriginContributionDraft[],
  current: OriginContributionDraft[]
): string[] {
  const closure = correctionClosureFacts({ initialOrigins: opened, origins: current });
  return ceasedPrevailingSubjectKeys(closure.baseline, closure.represented);
}

/**
 * Removing the last origin leaves the form without a replacement statement.
 * That gap is the removal, and the prevailing proposition is made non-current.
 */
export function originRemovalClosesWithoutReplacement(
  messages: string[],
  removedKeys: string[],
  contexts: string[]
): boolean {
  if (removedKeys.length === 0) return false;
  if (!contexts.includes('origins')) return false;
  if (contexts.some((context) => context !== 'origins')) return false;
  return messages.length > 0 && messages.every((message) => ORIGIN_GAP_MESSAGES.has(message));
}
