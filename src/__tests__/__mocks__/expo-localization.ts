/**
 * Mock for expo-localization
 */

export const getLocales = jest.fn(() => [
  {
    countryCode: 'US',
    languageTag: 'en-US',
    languageCode: 'en',
    regionCode: 'US',
  },
]);

export const getCalendars = jest.fn(() => ['gregory']);

export const getCountryCodeAsync = jest.fn(() => Promise.resolve('US'));

export const getCurrencyCodeAsync = jest.fn(() => Promise.resolve('USD'));

export const getDecimalSeparator = jest.fn(() => '.');

export const getDigitGroupingSeparator = jest.fn(() => ',');

export const getISOCurrencyCodes = jest.fn(() => ['USD', 'EUR', 'GBP']);

export const getTimeZone = jest.fn(() => 'America/New_York');

export const uses24HourClock = jest.fn(() => false);

export const usesMetricSystem = jest.fn(() => false);

export default {
  getLocales,
  getCalendars,
  getCountryCodeAsync,
  getCurrencyCodeAsync,
  getDecimalSeparator,
  getDigitGroupingSeparator,
  getISOCurrencyCodes,
  getTimeZone,
  uses24HourClock,
  usesMetricSystem,
};

