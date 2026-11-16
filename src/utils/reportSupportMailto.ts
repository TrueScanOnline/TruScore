/**
 * Mailto builders for technical support and manufacturer/brand-owner review requests.
 * Distinct from privacy-data and product-assessment templates.
 */

import { Platform } from 'react-native';
import { getInstalledAppVersion } from './appVersion';

export type TechnicalSupportFields = {
  category?: string;
  stepsToReproduce?: string;
  expectedBehaviour?: string;
  actualBehaviour?: string;
  notes?: string;
};

export type ManufacturerReviewFields = {
  organisation?: string;
  barcode?: string;
  productName?: string;
  disputedInformation?: string;
  supportingEvidence?: string;
  authorityNote?: string;
  reporterContact?: string;
};

export function buildTechnicalSupportMailto(
  supportEmail: string,
  subject: string,
  fields: TechnicalSupportFields = {}
): string | null {
  const email = supportEmail.trim();
  if (!email) return null;

  const lines = [
    'RVEEL technical support request',
    '',
    `Problem category: ${fields.category?.trim() || '(crash / scan / search / display / other)'}`,
    `Steps to reproduce: ${fields.stepsToReproduce?.trim() || '(please describe)'}`,
    `Expected behaviour: ${fields.expectedBehaviour?.trim() || '(please describe)'}`,
    `Actual behaviour: ${fields.actualBehaviour?.trim() || '(please describe)'}`,
    `Additional notes: ${fields.notes?.trim() || '(optional)'}`,
    '',
    'Notes:',
    '- Do not include passwords, tokens, Evidence Authority credentials, or full device logs in this draft.',
    '- Opening this draft does not confirm that RVEEL received a support ticket.',
    '',
    `App version: ${getInstalledAppVersion()}`,
    `Platform: ${Platform.OS}`,
    `Generated: ${new Date().toISOString()}`,
  ];

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildManufacturerReviewMailto(
  supportEmail: string,
  subject: string,
  fields: ManufacturerReviewFields = {}
): string | null {
  const email = supportEmail.trim();
  if (!email) return null;

  const lines = [
    'RVEEL manufacturer / brand-owner review request',
    '',
    `Organisation: ${fields.organisation?.trim() || '(please identify)'}`,
    `Barcode / GTIN: ${fields.barcode?.trim() || '(if applicable)'}`,
    `Product name: ${fields.productName?.trim() || '(if applicable)'}`,
    `Information in question: ${fields.disputedInformation?.trim() || '(please describe specifically)'}`,
    `Supporting evidence: ${fields.supportingEvidence?.trim() || '(optional — attach separately if needed)'}`,
    `Authority to represent the organisation: ${
      fields.authorityNote?.trim() ||
      '(RVEEL may need to verify authority before disclosing case information)'
    }`,
    `Contact for reply: ${fields.reporterContact?.trim() || '(please provide)'}`,
    '',
    'Notes:',
    '- A request for review does not automatically change or remove an assessment.',
    '- Do not include confidential legal strategy or irrelevant personal data in this draft.',
    '- Opening this draft does not confirm receipt or create a case until an operator records it.',
    '',
    `App version: ${getInstalledAppVersion()}`,
    `Platform: ${Platform.OS}`,
    `Generated: ${new Date().toISOString()}`,
  ];

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}
