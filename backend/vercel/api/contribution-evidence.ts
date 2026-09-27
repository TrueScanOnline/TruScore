/**
 * GET /api/contribution-evidence
 *
 * Pre-authority blob store. Reads remain available for historical inspection.
 * POST no longer writes. Assessment does not read this table.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getContributionEvidenceById, listContributionEvidenceForBarcode } from '../lib/database';

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function barcodeLooksValid(barcode: string): boolean {
  return /^\d{8,14}$/.test(String(barcode || '').trim());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const barcode = typeof req.query.barcode === 'string' ? req.query.barcode.trim() : '';
      const evidenceId = typeof req.query.evidenceId === 'string' ? req.query.evidenceId.trim() : '';
      if (evidenceId) {
        const row = await getContributionEvidenceById(evidenceId);
        return res.status(200).json({
          success: true,
          evidence: row,
          authority: 'pre_authority_not_assessed',
        });
      }
      if (!barcode || !barcodeLooksValid(barcode)) {
        return res.status(400).json({ success: false, error: 'Valid barcode required' });
      }
      const rows = await listContributionEvidenceForBarcode(barcode);
      return res.status(200).json({
        success: true,
        evidence: rows,
        scoringFieldsWritten: false,
        authority: 'pre_authority_not_assessed',
      });
    }

    if (req.method === 'POST') {
      return res.status(410).json({
        success: false,
        error: 'pre_authority_blob_retired',
        authority: 'pre_authority_not_assessed',
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('[contribution-evidence]', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal error',
    });
  }
}
