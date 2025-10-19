import { fetchWithRetry, isRetryableError, generateIdempotencyKey } from '../lib/fetchWithRetry';

// Mock fetch
global.fetch = jest.fn();

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const mockResponse = { data: 'success' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await fetchWithRetry('/api/test');

    expect(result.body).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: { message: 'Server error' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      });

    const result = await fetchWithRetry('/api/test', {
      retries: 2,
      baseDelay: 10,
    });

    await jest.runAllTimersAsync();

    expect(result.body).toEqual({ data: 'success' });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 400 error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ error: { message: 'Bad request' } }),
    });

    await expect(
      fetchWithRetry('/api/test', { retries: 2 })
    ).rejects.toThrow();

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should respect timeout', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const promise = fetchWithRetry('/api/test', {
      timeout: 1000,
      retries: 0,
    });

    jest.advanceTimersByTime(1100);

    await expect(promise).rejects.toThrow();
  });

  it('should attach idempotency key', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success' }),
    });

    const idempotencyKey = 'test-key-123';
    await fetchWithRetry('/api/test', {
      method: 'POST',
      idempotencyKey,
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].headers['Idempotency-Key']).toBe(idempotencyKey);
  });

  it('should call onRetry callback', async () => {
    const onRetry = jest.fn();
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: { message: 'Server error' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: 'success' }),
      });

    await fetchWithRetry('/api/test', {
      retries: 2,
      baseDelay: 10,
      onRetry,
    });

    await jest.runAllTimersAsync();

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Object));
  });
});

describe('isRetryableError', () => {
  it('should identify network errors as retryable', () => {
    expect(isRetryableError({ name: 'TypeError' })).toBe(true);
    expect(isRetryableError({ name: 'AbortError' })).toBe(true);
  });

  it('should identify 5xx errors as retryable', () => {
    expect(isRetryableError({ res: { status: 500 } })).toBe(true);
    expect(isRetryableError({ res: { status: 503 } })).toBe(true);
  });

  it('should respect explicit retryable flag', () => {
    expect(isRetryableError({ retryable: false })).toBe(false);
    expect(isRetryableError({ retryable: true })).toBe(true);
  });
});

describe('generateIdempotencyKey', () => {
  it('should generate unique keys', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    
    expect(key1).not.toBe(key2);
    expect(key1).toMatch(/^idem_/);
  });

  it('should use custom prefix', () => {
    const key = generateIdempotencyKey('booking');
    expect(key).toMatch(/^booking_/);
  });
});
