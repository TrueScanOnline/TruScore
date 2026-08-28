import { fetchProductFromOFF } from '../../../services/openFoodFacts';
import { fetchWithRateLimit } from '../../../utils/timeoutHelper';

jest.mock('../../../utils/timeoutHelper', () => ({
  fetchWithRateLimit: jest.fn(),
}));

const mockedFetch = fetchWithRateLimit as jest.MockedFunction<typeof fetchWithRateLimit>;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: async () => body,
  } as Response;
}

describe('fetchProductFromOFF retrieval outcomes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('first-attempt success returns hit', async () => {
    mockedFetch.mockResolvedValueOnce(
      jsonResponse({ status: 1, product: { product_name: 'Oats', code: '9300652815573' } })
    );
    const result = await fetchProductFromOFF('9300652815573');
    expect(result.kind).toBe('hit');
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it('authoritative not-found returns not_found', async () => {
    mockedFetch.mockResolvedValueOnce(jsonResponse({}, 404));
    const result = await fetchProductFromOFF('9999999999999');
    expect(result).toEqual({ kind: 'not_found' });
  });

  it('transient failure then second-attempt success', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(
        jsonResponse({ status: 1, product: { product_name: 'Retry Win' } })
      );
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result.kind).toBe('hit');
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('transient failures then third-attempt success', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(
        jsonResponse({ status: 1, product: { product_name: 'Third Try' } })
      );
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result.kind).toBe('hit');
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('three total attempts exhausted for 429 returns retrieval_error', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 429));
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual({ kind: 'retrieval_error', reason: 'rate_limit_exhausted' });
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('three total attempts exhausted for 5xx returns retrieval_error', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 504));
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual({ kind: 'retrieval_error', reason: 'server_error_exhausted' });
  });

  it('network/timeout exhaustion returns retrieval_error', async () => {
    mockedFetch
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockRejectedValueOnce(new Error('Request timeout after 10000ms'));
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result.kind).toBe('retrieval_error');
    if (result.kind === 'retrieval_error') {
      expect(result.reason).toMatch(/network_timeout_exhausted|retrieval_other/);
    }
  });

  it('malformed-response exhaustion returns retrieval_error', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as Response);
    const promise = fetchProductFromOFF('9300652815573');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual({ kind: 'retrieval_error', reason: 'malformed_response_exhausted' });
    expect(mockedFetch).toHaveBeenCalledTimes(3);
  });

  it('404 on first variant then hit on second variant without consuming transient budget', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(
        jsonResponse({ status: 1, product: { product_name: 'Variant Hit' } })
      );
    const result = await fetchProductFromOFF('01234567');
    expect(result.kind).toBe('hit');
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });

  it('404 on all variants returns not_found never retrieval_error', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({}, 404));
    const result = await fetchProductFromOFF('01234567');
    expect(result).toEqual({ kind: 'not_found' });
  });

  it('mixed variant 404 then transient exhaustion returns retrieval_error not not_found', async () => {
    mockedFetch
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockResolvedValueOnce(jsonResponse({}, 503));
    const promise = fetchProductFromOFF('01234567');
    await jest.runAllTimersAsync();
    const result = await promise;
    expect(result.kind).toBe('retrieval_error');
    expect(result).not.toEqual({ kind: 'not_found' });
  });
});
