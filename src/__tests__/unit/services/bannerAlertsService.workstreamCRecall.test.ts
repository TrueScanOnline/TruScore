import { generateBannerAlerts } from '../../../services/bannerAlertsService';
import type { AlertsPreferences } from '../../../store/useAlertsStore';

const neutralPrefs: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

describe('generateBannerAlerts — legacy product.recalls permanently off product-result path', () => {
  it('never emits product.recalls or FDA-homepage-style recall banners (safety uses Workstream C signals only)', () => {
    const now = Date.now();
    const product = {
      barcode: '1234567890123',
      recalls: [
        {
          isActive: true,
          recallDate: new Date(now).toISOString(),
          classification: 'Class I',
          reason: 'Test recall',
          url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/example-notice',
          recallId: 'FDA-TEST',
        },
      ],
    };
    const data = generateBannerAlerts(product as any, neutralPrefs, { now: () => now });
    expect(data.alerts.filter((a) => a.category === 'recall')).toHaveLength(0);
  });

  it('never emits brand-database FDA recall-history banner', () => {
    const now = Date.now();
    const product = {
      barcode: '9998887776665',
      brands: 'SomeBrand',
      recalls: [],
    };
    const data = generateBannerAlerts(product as any, neutralPrefs, { now: () => now });
    expect(data.alerts.filter((a) => a.dedupeKey?.includes('recall'))).toHaveLength(0);
  });
});
