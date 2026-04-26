import { buildProductScanResult } from '../../../services/buildProductScanResult';
import type { AlertsPreferences } from '../../../store/useAlertsStore';
import * as signalRenderMapping from '../../../signals/signalRenderMapping';

const prefs: AlertsPreferences = {
  israelPalestine: 'neutral',
  indiaChina: 'neutral',
  avoidAnimalTesting: false,
  avoidForcedLabour: false,
  avoidPalmOil: false,
  geopoliticalEnabled: false,
  ethicalEnabled: false,
  environmentalEnabled: false,
};

describe('buildProductScanResult mapping owner integration', () => {
  it('routes signal partition through signalRenderMapping owner module', () => {
    const spy = jest.spyOn(signalRenderMapping, 'mapSignalCardToBucket');

    buildProductScanResult({
      barcode: '9300633072391',
      market: 'AU',
      isSubscriber: false,
      userPreferences: prefs,
      product: {
        barcode: '9300633072391',
        source: 'openfoodfacts',
      },
    });

    expect(spy).toHaveBeenCalled();
  });
});

