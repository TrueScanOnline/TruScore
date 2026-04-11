/** Jest mock — real expo-linking ships ESM that breaks node test env without extra transforms. */
export function createURL(_path: string): string {
  return 'https://example.test/';
}

export default {
  createURL,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  canOpenURL: jest.fn(async () => true),
  getInitialURL: jest.fn(async () => null),
  openURL: jest.fn(async () => true),
};
