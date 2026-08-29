import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScanStore } from '../../../store/useScanStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useScanStore history terminal cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScanStore.setState({ recentScans: [], currentBarcode: null });
  });

  it('removeScanByBarcode drops a provisional/failed row', async () => {
    useScanStore.setState({
      recentScans: [
        { barcode: '9300652815573', timestamp: 1, productName: null },
        { barcode: '9300675079655', timestamp: 2, productName: 'Pump Water' },
      ],
    });

    await useScanStore.getState().removeScanByBarcode('9300652815573');

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300675079655', timestamp: 2, productName: 'Pump Water' },
    ]);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('addScan preserves successful history rows', async () => {
    await useScanStore.getState().addScan({
      barcode: '9300652815573',
      timestamp: 10,
      productName: 'Cached Oats',
    });

    expect(useScanStore.getState().recentScans).toEqual([
      { barcode: '9300652815573', timestamp: 10, productName: 'Cached Oats' },
    ]);
  });
});
