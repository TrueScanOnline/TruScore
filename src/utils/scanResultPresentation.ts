/**
 * Phase 5B — single presentation path: ProductScanResult → deduped signals → BannerAlertsData + i18n.
 */

import type { TFunction } from 'i18next';
import type { ProductScanResult, SignalCard } from '../types/scanOutputContract';
import type { BannerAlert, BannerAlertsData, AlertCategory } from '../types/bannerAlerts';

const SEVERITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function severityRank(s: SignalCard): number {
  return SEVERITY_RANK[s.severity] ?? 1;
}

/** Dedupe by dedupe_key; keep highest severity; preserve first-seen order for ties */
export function dedupeSignalCards(cards: SignalCard[]): SignalCard[] {
  const order: string[] = [];
  const map = new Map<string, SignalCard>();
  for (const c of cards) {
    const k = c.dedupe_key;
    if (!map.has(k)) {
      map.set(k, c);
      order.push(k);
      continue;
    }
    const prev = map.get(k)!;
    if (severityRank(c) > severityRank(prev)) {
      map.set(k, c);
    }
  }
  return order.map((k) => map.get(k)!);
}

/** P0–P3 order: all A, then B, C, D; soft cap applies only to non-A when capNonA is set */
export function flattenSignalsOrdered(signals: ProductScanResult['signals']): SignalCard[] {
  const rank = (c: SignalCard) => {
    if (c.class === 'A') return 0;
    if (c.class === 'B') return 1;
    if (c.class === 'C') return 2;
    return 3;
  };
  const flat = [
    ...signals.safety_regulatory,
    ...signals.transparency,
    ...signals.user_preference,
    ...signals.premium_insight,
  ];
  flat.sort((a, b) => {
      const dr = rank(a) - rank(b);
      if (dr !== 0) return dr;
      return severityRank(b) - severityRank(a);
    });
  return flat;
}

export function applyNonASignalCap(cards: SignalCard[], maxNonA: number): SignalCard[] {
  const a = cards.filter((c) => c.class === 'A');
  const nonA = cards.filter((c) => c.class !== 'A');
  return [...a, ...nonA.slice(0, maxNonA)];
}

export function resolveSignalCopy(card: SignalCard, t: TFunction): { title: string; message: string; why: string } {
  const title =
    t(card.title_key, { defaultValue: card.title_display ?? card.title_key }) ||
    card.title_display ||
    card.title_key;
  const message =
    t(card.body_key, { defaultValue: card.body_display ?? '' }) || card.body_display || '';
  const why =
    t(card.why_key, { defaultValue: '' }) || '';
  return { title, message, why };
}

function categoryFromSignal(card: SignalCard): AlertCategory {
  if (card.class === 'A' || card.dedupe_key.includes('recall')) return 'recall';
  if (card.class === 'C') {
    if (card.dedupe_key.includes('palm_oil')) return 'palm_oil';
    if (card.dedupe_key.includes('geopolitical')) return 'geopolitical';
    if (card.dedupe_key.includes('animal')) return 'animal_cruelty';
    return 'other';
  }
  if (card.dedupe_key.includes('ethics') || card.dedupe_key.includes('bbfaw') || card.dedupe_key.includes('ktc')) {
    return card.dedupe_key.includes('ktc') ? 'labor_violations' : 'animal_cruelty';
  }
  return 'other';
}

function sourceFromSignal(card: SignalCard): 'app' | 'user_preference' {
  return card.class === 'C' ? 'user_preference' : 'app';
}

/** Single UI list derived only from ProductScanResult (no parallel generateBannerAlerts). */
export function buildBannerAlertsDataFromScanResult(
  scan: ProductScanResult,
  t: TFunction,
  options?: { maxNonASignals?: number }
): BannerAlertsData {
  const maxNonA = options?.maxNonASignals ?? 4;
  const flat = dedupeSignalCards(flattenSignalsOrdered(scan.signals));
  const capped = applyNonASignalCap(flat, maxNonA);
  const alerts: BannerAlert[] = capped.map((card) => {
    let { title, message } = resolveSignalCopy(card, t);
    if (card.class === 'C' && card.dedupe_key.startsWith('preference:')) {
      const foot = t('result.signals.preferenceBasedFooter');
      if (foot) message = `${message} ${foot}`.trim();
    }
    const base: BannerAlert = {
      id: card.id,
      source: sourceFromSignal(card),
      category: categoryFromSignal(card),
      signalClass: card.class,
      dedupeKey: card.dedupe_key,
      title,
      message,
      severity: card.severity,
      timestamp: Date.now(),
    };
    if (card.links[0]?.url) {
      base.actionUrl = card.links[0].url;
    }
    if (card.class === 'C') {
      base.sourceDetails = { preferenceType: card.dedupe_key };
    }
    return base;
  });
  return {
    alerts,
    hasAlerts: alerts.length > 0,
    alertCount: alerts.length,
  };
}
