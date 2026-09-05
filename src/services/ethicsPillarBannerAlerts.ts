/**
 * Ethics pillar–sourced banner alerts (BBFAW, KTC).
 *
 * TruScore Ethics (v37 spec) is computed in `calculateEthicsPillar`. Banners for animal welfare
 * (BBFAW) and supply-chain labour (KTC) MUST use that same calculation so UI never contradicts
 * the pillar / spec sheet.
 */

import type { Product, ProductWithTrustScore } from '../types/product';
import type { BannerAlert } from '../types/bannerAlerts';
import type { EthicsPillarResult } from '../lib/truscoreEngine/pillars/ethicsPillar';
import { calculateEthicsPillar } from '../lib/truscoreEngine/pillars/ethicsPillar';
import { consumerPillarLabel } from '../lib/scoreHighlights';

/** Consumer pillar name. Internal pillar key, adjustment IDs and dedupe keys stay Ethics. */
const CONSUMER_PILLAR = consumerPillarLabel('Ethics');

const BBFAW_REF = 'https://www.bbfaw.com/food-companies/';
const KTC_REF = 'https://www.business-humanrights.org/en/companies/';

function severityFromNegativeTotal(totalNeg: number): 'high' | 'medium' | 'low' {
  const a = Math.abs(totalNeg);
  if (a >= 8) return 'high';
  if (a >= 4) return 'medium';
  return 'low';
}

function isBbfawAdjustment(desc: string): boolean {
  return desc.includes('BBFAW');
}

function isKtcAdjustment(desc: string): boolean {
  return desc.includes('KTC');
}

/**
 * Build banner alerts that mirror negative Ethics pillar adjustments from BBFAW and KTC only.
 */
export function buildEthicsPillarBannerAlerts(
  product: Product | ProductWithTrustScore,
  ethics: EthicsPillarResult,
  opts?: {
    /** Appends a sentence when user enabled forced/child labour alert preference. */
    mentionForcedLabourPreference?: boolean;
  }
): BannerAlert[] {
  const alerts: BannerAlert[] = [];
  const barcode = product.barcode || 'unknown';

  const bbfawNeg = ethics.adjustments.filter((a) => isBbfawAdjustment(a.description) && a.value < 0);
  if (bbfawNeg.length > 0) {
    const total = bbfawNeg.reduce((s, a) => s + a.value, 0);
    const detail = bbfawNeg.map((a) => `${a.description} (${a.value})`).join(' ');
    const actionUrl = bbfawNeg.find((a) => a.referenceUrl)?.referenceUrl ?? BBFAW_REF;
    alerts.push({
      id: `ethics-pillar-bbfaw-${barcode}`,
      source: 'app',
      category: 'animal_cruelty',
      signalClass: 'B',
      dedupeKey: `transparency:ethics:bbfaw:${barcode}`,
      title: `Animal welfare (BBFAW) — ${CONSUMER_PILLAR} pillar`,
      message: `This matches your Rveel Score ${CONSUMER_PILLAR} pillar (same BBFAW tier/impact as the spec sheet): ${detail}. Tap for official BBFAW reference.`,
      severity: severityFromNegativeTotal(total),
      timestamp: Date.now(),
      actionUrl,
      sourceDetails: { organization: `BBFAW (${CONSUMER_PILLAR} pillar v37)` },
    });
  }

  const ktcNeg = ethics.adjustments.filter((a) => isKtcAdjustment(a.description) && a.value < 0);
  if (ktcNeg.length > 0) {
    const total = ktcNeg.reduce((s, a) => s + a.value, 0);
    const detail = ktcNeg.map((a) => `${a.description} (${a.value})`).join(' ');
    const actionUrl = ktcNeg.find((a) => a.referenceUrl)?.referenceUrl ?? KTC_REF;
    let message = `This matches your Rveel Score ${CONSUMER_PILLAR} pillar (KnowTheChain 2026 benchmark used in scoring): ${detail}. Tap for reference.`;
    if (opts?.mentionForcedLabourPreference) {
      message +=
        ' This also relates to your alert preference to avoid forced or child labour concerns.';
    }
    alerts.push({
      id: `ethics-pillar-ktc-${barcode}`,
      source: 'app',
      category: 'labor_violations',
      signalClass: 'B',
      dedupeKey: `transparency:ethics:ktc:${barcode}`,
      title: `Supply chain labour (KTC) — ${CONSUMER_PILLAR} pillar`,
      message,
      severity: severityFromNegativeTotal(total),
      timestamp: Date.now(),
      actionUrl,
      sourceDetails: { organization: `KnowTheChain / BHRRC (${CONSUMER_PILLAR} pillar v37)` },
    });
  }

  return alerts;
}

/** Convenience: compute pillar once and return its BBFAW/KTC banners. */
export function generateEthicsPillarBannerAlertsOnly(
  product: Product | ProductWithTrustScore,
  opts?: { mentionForcedLabourPreference?: boolean }
): BannerAlert[] {
  const ethics = calculateEthicsPillar(product);
  return buildEthicsPillarBannerAlerts(product, ethics, opts);
}
