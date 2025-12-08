/**
 * Mock for expo-file-system
 */

export const EncodingType = {
  UTF8: 'utf8',
  Base64: 'base64',
};

export const readAsStringAsync = jest.fn(() => Promise.resolve('mock-file-content'));

export const writeAsStringAsync = jest.fn(() => Promise.resolve());

export const deleteAsync = jest.fn(() => Promise.resolve());

export const makeDirectoryAsync = jest.fn(() => Promise.resolve());

export const getInfoAsync = jest.fn(() => Promise.resolve({ exists: true, isDirectory: false }));

export const documentDirectory = '/mock/document/directory/';

export const cacheDirectory = '/mock/cache/directory/';

export default {
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  makeDirectoryAsync,
  getInfoAsync,
  documentDirectory,
  cacheDirectory,
};

