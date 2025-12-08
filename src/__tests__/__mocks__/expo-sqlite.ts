/**
 * Mock for expo-sqlite
 */

export const openDatabase = jest.fn(() => ({
  transaction: jest.fn((callback) => {
    const mockTransaction = {
      executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
        if (successCallback) {
          successCallback({}, { rows: { _array: [], length: 0 } });
        }
      }),
    };
    if (callback) {
      callback(mockTransaction);
    }
    return Promise.resolve();
  }),
  close: jest.fn(),
  readTransaction: jest.fn((callback) => {
    const mockTransaction = {
      executeSql: jest.fn((sql, params, successCallback, errorCallback) => {
        if (successCallback) {
          successCallback({}, { rows: { _array: [], length: 0 } });
        }
      }),
    };
    if (callback) {
      callback(mockTransaction);
    }
    return Promise.resolve();
  }),
}));

export default {
  openDatabase,
};

