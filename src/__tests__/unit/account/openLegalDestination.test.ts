import { Linking } from 'react-native';
import { openLegalDestination } from '../../../utils/openLegalDestination';
import * as legalConfig from '../../../config/legalDestinations';

describe('openLegalDestination', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns blocked when destination is not ready and does not open URL', async () => {
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const result = await openLegalDestination('privacy');
    expect(result).toBe('blocked');
    expect(openSpy).not.toHaveBeenCalled();
  });

  test('opens verified URL when destination is explicitly marked ready', async () => {
    jest.spyOn(legalConfig, 'isLegalDestinationReady').mockReturnValue(true);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    const result = await openLegalDestination('terms');
    expect(result).toBe('opened');
    expect(openSpy).toHaveBeenCalledWith(legalConfig.legalDestinations.terms.url);
  });

  test('returns failed when Linking cannot open a ready destination', async () => {
    jest.spyOn(legalConfig, 'isLegalDestinationReady').mockReturnValue(true);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const openSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);

    const result = await openLegalDestination('privacy');
    expect(result).toBe('failed');
    expect(openSpy).not.toHaveBeenCalled();
  });
});
