import { offProductApiUrl, offProductReadHost } from '../../../services/offReadTarget';
import { summarizeOffWriteResponse } from '../../../evidenceAuthority/offWriteResponse';
import { fetchProductFromOFF } from '../../../services/openFoodFacts';
import { fetchWithRateLimit } from '../../../utils/timeoutHelper';

jest.mock('../../../utils/timeoutHelper', () => ({
  fetchWithRateLimit: jest.fn(),
}));

const mockedFetch = fetchWithRateLimit as jest.MockedFunction<typeof fetchWithRateLimit>;

describe('OFF read host allowlist', () => {
  it('keeps production and unknown environments on world.openfoodfacts.org', () => {
    expect(offProductReadHost(undefined)).toBe('world.openfoodfacts.org');
    expect(offProductReadHost('production')).toBe('world.openfoodfacts.org');
    expect(offProductReadHost('staging')).toBe('world.openfoodfacts.org');
    expect(offProductApiUrl('12345670', 'production')).toBe(
      'https://world.openfoodfacts.org/api/v2/product/12345670.json'
    );
  });

  it('sends UAT product reads to world.openfoodfacts.net', () => {
    expect(offProductReadHost('uat')).toBe('world.openfoodfacts.net');
    expect(offProductApiUrl('12345670', 'uat', 'v0')).toBe(
      'https://world.openfoodfacts.net/api/v0/product/12345670.json'
    );
  });
});

describe('fetchProductFromOFF host', () => {
  const previous = process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;

  afterEach(() => {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    else process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = previous;
  });

  it('requests the UAT staging host when the authority environment is uat', async () => {
    process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV = 'uat';
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 1, product: { code: '12345670', product_name: 'Staging' } }),
    } as Response);
    const result = await fetchProductFromOFF('12345670');
    expect(result.kind).toBe('hit');
    expect(String(mockedFetch.mock.calls[0][0])).toContain('https://world.openfoodfacts.net/api/v2/product/');
  });

  it('requests the production host when the authority environment is unset', async () => {
    delete process.env.EXPO_PUBLIC_EVIDENCE_AUTHORITY_ENV;
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 1, product: { code: '12345670', product_name: 'Production' } }),
    } as Response);
    const result = await fetchProductFromOFF('12345670');
    expect(result.kind).toBe('hit');
    expect(String(mockedFetch.mock.calls[0][0])).toContain('https://world.openfoodfacts.org/api/v2/product/');
  });
});
describe('OFF write response summary', () => {
  it('keeps the status reason and strips credentials', () => {
    const note = summarizeOffWriteResponse(
      200,
      '{"status":1,"status_verbose":"fields saved","user_id":"secret-user","password":"secret-pass"}'
    );
    expect(note).toContain('http_200');
    expect(note).toContain('fields saved');
    expect(note).not.toContain('secret-user');
    expect(note).not.toContain('secret-pass');
  });
});
