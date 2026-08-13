/**
 * POST /api/contribution-evidence
 * GET  /api/contribution-evidence?barcode=...
 *
 * Stores community contribution evidence versions. Does not write
 * manufacturing_places / labels_tags onto Product or scoring fields.
 *
 * Confirmation/dispute thresholds come from src/config/contributionPolicy.ts
 * (same SoT as client lifecycle) — not hardcoded in this handler.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  saveContributionEvidence,
  getContributionEvidenceById,
  listContributionEvidenceForBarcode,
} from '../lib/database';
import {
  getCommunityVerificationThresholds,
  resolveVerificationLifecycleState,
} from '../../../src/config/contributionPolicy';

const ALLOWED_DOMAINS = new Set(['origins', 'certifications', 'ingredients_nutrition']);
const ALLOWED_ACTIONS = new Set(['submit', 'confirm', 'dispute']);

function handleCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function barcodeLooksValid(barcode: string): boolean {
  return /^\d{8,14}$/.test(String(barcode || '').trim());
}

function contributorIdOf(entry: unknown): string {
  const rec = asRecord(entry);
  if (typeof rec?.contributorId === 'string') return rec.contributorId;
  if (typeof entry === 'string') return entry;
  return '';
}

function asVerificationDomain(value: unknown): 'origins' | 'certifications' {
  return value === 'origins' ? 'origins' : 'certifications';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  handleCORS(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const barcode = typeof req.query.barcode === 'string' ? req.query.barcode.trim() : '';
      const evidenceId = typeof req.query.evidenceId === 'string' ? req.query.evidenceId.trim() : '';
      if (evidenceId) {
        const row = await getContributionEvidenceById(evidenceId);
        return res.status(200).json({ success: true, evidence: row });
      }
      if (!barcode || !barcodeLooksValid(barcode)) {
        return res.status(400).json({ success: false, error: 'Valid barcode required' });
      }
      const rows = await listContributionEvidenceForBarcode(barcode);
      return res.status(200).json({ success: true, evidence: rows, scoringFieldsWritten: false });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const body = asRecord(req.body) || {};
    const nested = asRecord(body.evidence);
    const action = typeof body.action === 'string' ? body.action : 'submit';
    if (!ALLOWED_ACTIONS.has(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    if (nested && typeof nested.evidenceId === 'string' && typeof nested.barcode === 'string') {
      const barcode = String(nested.barcode).trim();
      if (!barcodeLooksValid(barcode)) {
        return res.status(400).json({ success: false, error: 'Valid barcode required' });
      }
      const evidenceId = String(nested.evidenceId).trim();
      const stored = {
        ...nested,
        state: typeof nested.state === 'string' ? nested.state : 'pending',
        scoringEligible: nested.scoringEligible === true,
        canonicalPromoted: nested.canonicalPromoted === true,
      };
      await saveContributionEvidence(evidenceId, barcode, stored);
      return res.status(201).json({
        success: true,
        evidenceId,
        status: stored.state,
        scoringFieldsWritten: false,
      });
    }

    const barcode = typeof body.barcode === 'string' ? body.barcode.trim() : '';
    if (!barcode || !barcodeLooksValid(barcode)) {
      return res.status(400).json({ success: false, error: 'Valid barcode required' });
    }

    if (action === 'submit') {
      const domain = typeof body.domain === 'string' ? body.domain : '';
      if (!ALLOWED_DOMAINS.has(domain)) {
        return res.status(400).json({ success: false, error: 'Invalid domain' });
      }
      const evidenceId =
        typeof body.evidenceId === 'string' && body.evidenceId.trim()
          ? body.evidenceId.trim()
          : `ev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const evidence = {
        evidenceId,
        barcode,
        domain,
        claimValue: typeof body.claimValue === 'string' ? body.claimValue : '',
        imageUrl: typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
        exactWording: typeof body.exactWording === 'string' ? body.exactWording : undefined,
        state: 'pending',
        confirmations: [],
        disputes: [],
        scoringEligible: false,
        canonicalPromoted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        source: 'user_contribution',
      };
      await saveContributionEvidence(evidenceId, barcode, evidence);
      return res.status(201).json({
        success: true,
        evidenceId,
        status: 'pending',
        scoringFieldsWritten: false,
      });
    }

    const evidenceId = typeof body.evidenceId === 'string' ? body.evidenceId.trim() : '';
    if (!evidenceId) {
      return res.status(400).json({ success: false, error: 'evidenceId required' });
    }
    const existing = await getContributionEvidenceById(evidenceId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Evidence not found' });
    }

    const confirmations = Array.isArray(existing.confirmations) ? [...existing.confirmations] : [];
    const disputes = Array.isArray(existing.disputes) ? [...existing.disputes] : [];
    const contributorId =
      typeof body.deviceContributorHash === 'string'
        ? body.deviceContributorHash
        : typeof body.contributorId === 'string'
          ? body.contributorId
          : 'anon';
    const now = Date.now();
    const submitterId =
      typeof existing.submitterId === 'string' ? existing.submitterId : '';

    if (action === 'confirm') {
      const already = confirmations.some((c) => contributorIdOf(c) === contributorId);
      if (!already) confirmations.push({ contributorId, timestamp: now });
    } else if (action === 'dispute') {
      const already = disputes.some((d) => contributorIdOf(d) === contributorId);
      if (!already) {
        disputes.push({
          contributorId,
          timestamp: now,
          reason: typeof body.reason === 'string' ? body.reason : 'other',
        });
      }
    }

    const domain = asVerificationDomain(existing.domain);
    const thresholds = getCommunityVerificationThresholds(domain);
    const independentConfirmationCount = confirmations.filter(
      (c) => contributorIdOf(c) && contributorIdOf(c) !== submitterId
    ).length;
    const independentDisputeCount = new Set(
      disputes.map((d) => contributorIdOf(d)).filter(Boolean)
    ).size;

    const currentState = typeof existing.state === 'string' ? existing.state : 'pending';
    const state = resolveVerificationLifecycleState({
      currentState,
      independentConfirmationCount,
      independentDisputeCount,
      thresholds,
    });

    const updated = {
      ...existing,
      confirmations,
      disputes,
      state,
      // Preserve prior eligibility flags; MVP review_required does not auto-withdraw.
      scoringEligible: existing.scoringEligible === true,
      canonicalPromoted: existing.canonicalPromoted === true,
      updatedAt: now,
    };
    await saveContributionEvidence(evidenceId, barcode, updated);
    return res.status(200).json({
      success: true,
      evidenceId,
      status: state,
      scoringFieldsWritten: false,
    });
  } catch (error) {
    console.error('[contribution-evidence]', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal error',
    });
  }
}
