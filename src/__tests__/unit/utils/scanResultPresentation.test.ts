import type { ProductScanResult } from '../../../types/scanOutputContract';
import { buildBannerAlertsDataFromScanResult, dedupeSignalCards, flattenSignalsOrdered } from '../../../utils/scanResultPresentation';
import type { SignalCard } from '../../../types/scanOutputContract';
import * as signalRenderMapping from '../../../signals/signalRenderMapping';

const t = (key: string, opts?: { defaultValue?: string }) => {
  const map: Record<string, string> = {
    'result.signals.limited_data.title': 'Limited product data',
    'result.signals.limited_data.body': 'Some fields are missing.',
    'result.signals.limited_data.why': 'Because completeness is low.',
  };
  return map[key] ?? opts?.defaultValue ?? key;
};

describe('scanResultPresentation', () => {
  it('dedupes by dedupe_key keeping higher severity', () => {
    const a: SignalCard = {
      id: '1',
      class: 'B',
      title_key: 'k',
      body_key: 'b',
      why_key: 'w',
      severity: 'low',
      links: [],
      dedupe_key: 'same',
    };
    const b: SignalCard = { ...a, id: '2', severity: 'high' };
    const out = dedupeSignalCards([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe('high');
  });

  it('builds banner data from scan result with i18n keys resolved via defaultValue', () => {
    const scan: ProductScanResult = {
      terminal_state: 'success',
      barcode: '1',
      market: 'AU',
      product: null,
      scores: null,
      signals: {
        safety_regulatory: [],
        transparency: [
          {
            id: 'x',
            class: 'B',
            title_key: 'result.signals.limited_data.title',
            body_key: 'result.signals.limited_data.body',
            why_key: 'result.signals.limited_data.why',
            severity: 'low',
            links: [],
            dedupe_key: 'transparency:limited_data:1',
          },
        ],
        user_preference: [],
        premium_insight: [],
      },
      confidence: { value: 0.9, label: 'high' },
      coverage: { completeness: 0.5, flags: [] },
      sources_trace: [],
      premium: { subscriber: false },
    };
    const data = buildBannerAlertsDataFromScanResult(scan, t as any);
    expect(data.hasAlerts).toBe(true);
    expect(data.alerts[0].title).toBe('Limited product data');
  });

  it('uses owner module for class ordering (anti-drift)', () => {
    const orderSpy = jest.spyOn(signalRenderMapping, 'signalClassOrder');
    const scan: ProductScanResult = {
      terminal_state: 'success',
      barcode: '1',
      market: 'AU',
      product: null,
      scores: null,
      signals: {
        safety_regulatory: [],
        transparency: [
          { id: 'b', class: 'B', title_key: 'k', body_key: 'b', why_key: 'w', severity: 'low', links: [], dedupe_key: 'b' },
        ],
        user_preference: [
          { id: 'c', class: 'C', title_key: 'k', body_key: 'b', why_key: 'w', severity: 'low', links: [], dedupe_key: 'c' },
        ],
        premium_insight: [],
      },
      confidence: { value: 0.8, label: 'high' },
      coverage: { completeness: 1, flags: [] },
      sources_trace: [],
      premium: { subscriber: false },
    };
    flattenSignalsOrdered(scan.signals);
    expect(orderSpy).toHaveBeenCalled();
    const banners = buildBannerAlertsDataFromScanResult(scan, t as any);
    expect(banners.alerts.some((a) => a.signalClass === 'C')).toBe(false);
  });
});
