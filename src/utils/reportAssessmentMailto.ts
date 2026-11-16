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
    'RVEEL incorrect assessment report',
    '',
    `Barcode / GTIN: ${fields.barcode?.trim() || '(please fill)'}`,
    `Product name: ${fields.productName?.trim() || '(please fill)'}`,
    `Brand: ${fields.brand?.trim() || '(please fill)'}`,
    `Error type: ${fields.errorType?.trim() || '(identity / nutrition / claims / certification / signal / share / other)'}`,
    `Disputed statement / assessment: ${fields.disputedStatement?.trim() || '(please describe)'}`,
    `Share URL (if any): ${fields.shareUrl?.trim() || '(none)'}`,
    `Supporting notes: ${fields.notes?.trim() || '(optional)'}`,
    `Reporter contact (optional): ${fields.reporterContact?.trim() || '(optional)'}`,
    '',
    `App version: ${getInstalledAppVersion()}`,
    `Platform: ${Platform.OS}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    'Please attach pack photos if available.',
  ];

  const body = lines.join('\n');
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
