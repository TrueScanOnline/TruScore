/**

 * Builds the Phase 4 `ProductScanResult` — authoritative scan output (signals + scores + coverage).

 * Banner UI is derived via `scanResultPresentation.buildBannerAlertsDataFromScanResult` only.

 */



import type { Product, ProductWithTrustScore } from '../types/product';

import type { ProductScanResult, SignalCard, SignalClass } from '../types/scanOutputContract';

import type { AlertsPreferences } from '../store/useAlertsStore';
import type { BannerAlert } from '../types/bannerAlerts';

import { generateBannerAlerts } from './bannerAlertsService';

import { calculateDataCompleteness } from '../utils/dataCompleteness';

import { isWebSearchFallback } from './webSearchFallback';

import { RVEEL_SCORE_METHODOLOGY_VERSION } from '../config/methodologyVersion';

import { getUserCountryCode } from '../utils/countryDetection';

import { logScanObs } from './scanObservability';

import { deriveScanTerminalState } from '../utils/deriveScanTerminalState';

import { dedupeSignalCards } from '../utils/scanResultPresentation';

import { getSourceConfidence } from '../utils/confidenceScoring';
import {
  emptySignalsBuckets,
  isPublicationRecordPubliclyRenderable,
  mapPublicationRecordToSignalCard,
  mapSignalCardToBucket,
  sortPublicationRecordsForRender,
} from '../signals/signalRenderMapping';
import { resolveSharedIdentityContext } from '../identity/resolveSharedIdentityContext';
import type { DynamicSignalPublicationRecord } from '../dynamicSignals/publish/types';



export interface BuildProductScanResultOptions {

  barcode: string;

  product: Product | ProductWithTrustScore | null;

  userPreferences: AlertsPreferences;

  isSubscriber: boolean;

  market?: string | null;

  /** Used when deriveTerminal is false (tests) */

  terminal_state?: ProductScanResult['terminal_state'];

  /** When true, terminal_state comes from deriveScanTerminalState */

  deriveTerminal?: boolean;

  fetchPhase?: string;

  isFetchLoading?: boolean;

  isOffline?: boolean;

  loadError?: string | null;

  errors?: ProductScanResult['errors'];

  nowMs?: number;

  scan_id?: string;

  /**
   * Slice 6 input from 5B publication engine. Builder maps these through the owner mapping module;
   * no builder-side class-gate reinterpretation.
   */
  dynamicSignalRecords?: DynamicSignalPublicationRecord[];

  /**
   * Slice 7 seam-control mode:
   * - `transitional`: keep legacy/synthetic feeders (current MVP transitional mode)
   * - `governed_5b_only`: exclude legacy/synthetic feeders; only 5B publication records feed signals
   */
  phase6SignalSourceMode?: 'transitional' | 'governed_5b_only';

}



function confidenceLabelFromNumeric(value: number): 'high' | 'medium' | 'low' {

  if (value >= 0.8) return 'high';

  if (value >= 0.55) return 'medium';

  return 'low';

}



function sourcesTraceFromProduct(product: Product | ProductWithTrustScore | null): ProductScanResult['sources_trace'] {

  if (!product) return [];

  const analysis = (product as ProductWithTrustScore)._truscore_analysis;

  const trace = analysis?.fetchTrace;

  if (trace && trace.length > 0) {

    return trace.map((e, i) => ({

      id: `${e.order ?? i}:${e.database}`,

      status: e.hit ? 'hit' : 'miss',

    }));

  }

  const raw = (product as any)._fetchTrace as Array<{ database?: string; hit?: boolean }> | undefined;

  if (raw?.length) {

    return raw.map((e, i) => ({

      id: `${i}:${e.database ?? 'unknown'}`,

      status: e.hit ? 'hit' : 'miss',

    }));

  }

  if (product.source) {

    return [{ id: String(product.source), status: 'hit' }];

  }

  return [];

}



function bannerToSignalCard(alert: BannerAlert): SignalCard {

  const cls: SignalClass = alert.signalClass ?? 'B';

  const slug = alert.category.replace(/[^a-z0-9]+/gi, '_').toLowerCase();

  return {

    id: alert.id,

    class: cls,

    title_key: `legacy.banner.${slug}.title`,

    body_key: `legacy.banner.${slug}.body`,

    why_key: `legacy.banner.${slug}.why`,

    severity: alert.severity,

    links: alert.actionUrl ? [{ url: alert.actionUrl }] : [],

    dedupe_key: alert.dedupeKey ?? `banner:${alert.category}:${alert.source}:${alert.title.slice(0, 48)}`,

    title_display: alert.title,

    body_display: alert.message,

  };

}



function partitionSignals(cards: SignalCard[]): ProductScanResult['signals'] {

  const out: ProductScanResult['signals'] = emptySignalsBuckets();

  for (const c of cards) {
    out[mapSignalCardToBucket(c)].push(c);

  }

  return out;

}

function publicationCardsFromRecords(
  records: DynamicSignalPublicationRecord[] | undefined
): SignalCard[] {
  if (!records?.length) return [];
  return sortPublicationRecordsForRender(records)
    .filter(isPublicationRecordPubliclyRenderable)
    .map(mapPublicationRecordToSignalCard);
}



function syntheticTransparencyCards(

  product: Product | ProductWithTrustScore,

  completeness01: number,

  barcode: string

): SignalCard[] {

  const cards: SignalCard[] = [];

  if (completeness01 < 0.7) {

    cards.push({

      id: `transparency-limited-data-${barcode}`,

      class: 'B',

      title_key: 'result.signals.limited_data.title',

      body_key: 'result.signals.limited_data.body',

      why_key: 'result.signals.limited_data.why',

      severity: 'low',

      links: [],

      dedupe_key: `transparency:limited_data:${barcode}`,

    });

  }

  if (isWebSearchFallback(product)) {

    cards.push({

      id: `transparency-web-search-${barcode}`,

      class: 'B',

      title_key: 'result.signals.web_search_source.title',

      body_key: 'result.signals.web_search_source.body',

      why_key: 'result.signals.web_search_source.why',

      severity: 'medium',

      links: [],

      dedupe_key: `transparency:web_search:${barcode}`,

    });

  }

  return cards;

}



function resolveTerminalState(opts: BuildProductScanResultOptions): ProductScanResult['terminal_state'] {

  if (opts.deriveTerminal) {

    return deriveScanTerminalState({

      loadError: opts.loadError ?? null,

      product: opts.product,

      isOffline: !!opts.isOffline,

      fetchPhase: opts.fetchPhase ?? 'initializing',

      isFetchLoading: !!opts.isFetchLoading,

    });

  }

  return opts.terminal_state ?? 'success';

}



function effectiveConfidence(product: Product, completeness01: number): { value: number; label: 'high' | 'medium' | 'low' } {

  const tw = product as ProductWithTrustScore;

  const sourceConf = getSourceConfidence(product.source);

  let confValue = typeof tw.confidence === 'number' ? tw.confidence : sourceConf.confidence;

  const blend = 0.45 + 0.55 * completeness01;

  confValue = Math.min(confValue, Math.min(sourceConf.confidence * blend + 0.05, 1));

  if (isWebSearchFallback(product)) {

    confValue = Math.min(confValue, 0.45);

  }

  return { value: confValue, label: confidenceLabelFromNumeric(confValue) };

}



export function buildProductScanResult(opts: BuildProductScanResultOptions): {

  result: ProductScanResult;

} {

  const { product, barcode, userPreferences, isSubscriber, errors, nowMs, scan_id } = opts;
  const signalSourceMode = opts.phase6SignalSourceMode ?? 'transitional';

  const marketHint = opts.market ?? getUserCountryCode();
  let market: ProductScanResult['market'] = (() => {
    if (marketHint === 'AU') return 'AU';
    if (marketHint === 'NZ') return 'NZ';
    return 'UNKNOWN';
  })();
  if (product) {
    const identityResolution = resolveSharedIdentityContext({
      gtin: barcode,
      product,
      marketHint,
    });
    market = identityResolution.public_market;
    (product as ProductWithTrustScore)._shared_identity_context = identityResolution.context;
  }

  const nowFn = nowMs !== undefined ? () => nowMs : undefined;

  const terminal_state = resolveTerminalState(opts);



  if (!product) {

    const empty: ProductScanResult = {

      terminal_state,

      barcode,

      market,

      product: null,

      scores: null,

      signals: {
        ...emptySignalsBuckets(),
      },

      confidence: { value: 0, label: 'low' },

      coverage: { completeness: 0, flags: ['no_product'] },

      sources_trace: [],

      premium: { subscriber: isSubscriber },

      errors,

    };

    if (scan_id) {

      logScanObs({

        event: 'signals_built',

        scan_id,

        barcode,

        terminal_state,

        signal_counts: { A: 0, B: 0, C: 0, D: 0 },

      });

    }

    return { result: empty };

  }



  const fromBanners =
    signalSourceMode === 'governed_5b_only'
      ? []
      : generateBannerAlerts(product, userPreferences, { now: nowFn }).alerts.map(bannerToSignalCard);



  const metrics = calculateDataCompleteness(product);

  const completeness01 = Math.min(1, Math.max(0, metrics.total / 100));

  const flags: string[] = [];

  if (completeness01 < 0.7) flags.push('low_completeness');

  if (isWebSearchFallback(product)) flags.push('web_search_fallback');

  if (!metrics.breakdown.hasNutrition) flags.push('missing_nutrition');

  if (!metrics.breakdown.hasIngredients) flags.push('missing_ingredients');

  if (terminal_state === 'partial') flags.push('analysis_incomplete');



  const synthetic =
    signalSourceMode === 'governed_5b_only'
      ? []
      : syntheticTransparencyCards(product, completeness01, barcode);

  const publicationCards = publicationCardsFromRecords(
    opts.dynamicSignalRecords ??
      ((product as ProductWithTrustScore)._dynamic_signal_publication_records as
        | DynamicSignalPublicationRecord[]
        | undefined)
  );
  const allCards = dedupeSignalCards([...fromBanners, ...publicationCards, ...synthetic]);

  const signals = partitionSignals(allCards);



  const confidence = effectiveConfidence(product, completeness01);



  const tw = product as ProductWithTrustScore;

  const trust = tw.trust_score ?? undefined;

  const scores: ProductScanResult['scores'] =

    trust === undefined || trust === null

      ? null

      : {

          trust,

          pillars: tw.trust_score_breakdown

            ? {

                body: tw.trust_score_breakdown.body ?? null,

                planet: tw.trust_score_breakdown.planet ?? null,

                ethics: tw.trust_score_breakdown.ethics ?? null,

                open: tw.trust_score_breakdown.open ?? null,

              }

            : undefined,

          methodology_version: `v${RVEEL_SCORE_METHODOLOGY_VERSION}`,

        };



  const result: ProductScanResult = {

    terminal_state,

    barcode,

    market,

    product,

    scores,

    signals,

    confidence,

    coverage: { completeness: completeness01, flags },

    sources_trace: sourcesTraceFromProduct(product),

    premium: { subscriber: isSubscriber },

    errors,

  };



  if (scan_id) {

    const s = result.signals;

    logScanObs({

      event: 'signals_built',

      scan_id,

      barcode,

      terminal_state,

      trust_score: trust ?? null,

      signal_counts: {

        A: s.safety_regulatory.length,

        B: s.transparency.length,

        C: s.user_preference.length,

        D: s.premium_insight.length,

      },

      coverage_completeness: completeness01,

      confidence_label: confidence.label,

      source_trace_len: result.sources_trace.length,

    });

  }



  return { result };

}


