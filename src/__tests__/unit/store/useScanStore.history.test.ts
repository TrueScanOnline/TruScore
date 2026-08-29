import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScanStore } from '../../../store/useScanStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useScanStore history terminal behaviour', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScanStore.setState({ recentScans: [], currentBarcode: null });
  });

  it('first-ever failed scan does not create a History row', async () => {
    expect(useScanStore.getState().recentScans).toEqual([]);
    await useScanStore.getState().removeLegacyProvisionalScan('9300652815573');
    expect(useScanStore.getState().recentScans).toEqual([]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('successful scan creates a retained History row', async () => {
    await useScanStore.getState().addScan({
      barcode: '9300652815573',
      timestamp: 10,
      productName: 'Cached Oats',
    });

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
    ]);
  });

  it('later retrieval_error for same barcode keeps prior successful row', async () => {
    useScanStore.setState({
      recentScans: [
        { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
      ],
    });

    await useScanStore.getState().removeLegacyProvisionalScan('9300652815573');

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
    ]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('later not_found for same barcode keeps prior successful row', async () => {
    useScanStore.setState({
      recentScans: [
        { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
      ],
    });

    await useScanStore.getState().removeLegacyProvisionalScan('9300652815573');

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
    ]);
  });

  it('removes only legacy null-name provisional row without affecting successful row', async () => {
    useScanStore.setState({
      recentScans: [
        { barcode: '9300652815573', timestamp: 1, productName: null },
        { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
      ],
    });

    await useScanStore.getState().removeLegacyProvisionalScan('9300652815573');

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
    ]);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('removeLegacyProvisionalScan is a no-op when no null-name row exists', async () => {
    useScanStore.setState({
      recentScans: [
        { barcode: '9300675079655', timestamp: 2, productName: 'Pump Water' },
      ],
    });

    await useScanStore.getState().removeLegacyProvisionalScan('9300675079655');

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300675079655', timestamp: 2, productName: 'Pump Water' },
    ]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});
