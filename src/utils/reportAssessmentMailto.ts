/**
 * Build a mailto URL for incorrect-assessment reports.
 * Does not invent a support address — caller must supply a configured email.
 */

import { Platform } from 'react-native';
import { getInstalledAppVersion } from './appVersion';

export type AssessmentReportFields = {
  barcode?: string;
  productName?: string;
  brand?: string;
  disputedStatement?: string;
  shareUrl?: string;
  errorType?: string;
  notes?: string;
  reporterContact?: string;
};

export function buildAssessmentReportMailto(
  supportEmail: string,
  subject: string,
  fields: AssessmentReportFields = {}
): string | null {
  const email = supportEmail.trim();
  if (!email) return null;

  const lines = [
    'RVEEL incorrect product information / assessment report',
    '',
    `Barcode / GTIN: ${fields.barcode?.trim() || '(include when available)'}`,
    `Product name: ${fields.productName?.trim() || '(include when available)'}`,
    `Brand: ${fields.brand?.trim() || '(include when available)'}`,
    `Concern type: ${
      fields.errorType?.trim() ||
      '(barcode or identity / name or brand / ingredients or nutrition / origins / certification or benchmark / manufacturer or parent / assessment or score explanation / recall or signal / share or preview / other)'
    }`,
    `What appears incorrect: ${fields.disputedStatement?.trim() || '(please describe)'}`,
    `Share or preview reference (if any): ${fields.shareUrl?.trim() || '(none)'}`,
    `Supporting notes: ${fields.notes?.trim() || '(optional)'}`,
    `Reporter contact (optional): ${fields.reporterContact?.trim() || '(optional)'}`,
    '',
    'Notes:',
    '- Optional pack photographs may help verify packaging differences; do not send identity documents.',
    '- Sending this report does not automatically change a RVEEL Score, Signal, or published statement.',
    '- Opening this draft does not confirm that RVEEL received a case.',
    '',
    `App version: ${getInstalledAppVersion()}`,
    `Platform: ${Platform.OS}`,
    `Generated: ${new Date().toISOString()}`,
  ];

  const body = lines.join('\n');
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
