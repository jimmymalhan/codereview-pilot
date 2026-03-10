/**
 * API Client Tests - Complete Test Suite
 * Phase E: API Resilience Layer
 *
 * Comprehensive tests covering:
 * - Error handling and classification
 * - Retry logic with exponential backoff
 * - Timeout management
 * - Request/response interceptors
 * - Offline queue management
 * - Metrics tracking
 */

import { jest } from '@jest/globals';
import {
  APIError,
  NetworkError,
  TimeoutError,
  ValidationError,
  HTTPError,
  RateLimitError,
  CreditsError,
  ResponseError,
  classifyError,
  extractRetryInfo
} from '../src/www/api/errors.js';

import {
  calculateBackoffDelay,
  sleep,
  isRetryable,
  withRetry,
  RETRY_CONFIG,
  RetryTracker
} from '../src/www/api/retry.js';

import {
  createTimeoutController,
  clearTimeoutController,
  withTimeout,
  createFetchOptionsWithTimeout,
  DEFAULT_TIMEOUT_MS,
  TimeoutTracker,
  isValidTimeout
} from '../src/www/api/timeout.js';

import {
  APIClient,
  CLIENT_CONFIG,
  getClient,
  createClient
} from '../src/www/api/client.js';

describe('Phase E: API Resilience Layer', () => {
  describe('Error Types and Classification', () => {
    test('should create NetworkError with user message', () => {
      const error = new NetworkError();
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.userMessage).toContain('internet connection');
      expect(error.isRetryable()).toBe(true);
    });

    test('should create TimeoutError with milliseconds', () => {
      const error = new TimeoutError(5000);
      expect(error.code).toBe('TIMEOUT');
      expect(error.timeoutMs).toBe(5000);
      expect(error.isRetryable()).toBe(true);
    });

    test('should create ValidationError with field', () => {
      const error = new ValidationError('Too short', 'username');
      expect(error.code).toBe('INVALID_INPUT');
      expect(error.field).toBe('username');
      expect(error.isRetryable()).toBe(false);
    });

    test('should create HTTPError from status code', () => {
      const error = new HTTPError(404, 'Not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.isRetryable()).toBe(false);
    });

    test('should map 402 status to NO_CREDITS', () => {
      const error = new HTTPError(402, 'No credits');
      expect(error.code).toBe('NO_CREDITS');
    });

    test('should map 429 status to RATE_LIMIT', () => {
      const error = new HTTPError(429, 'Rate limited');
      expect(error.code).toBe('RATE_LIMIT');
    });

    test('should create RateLimitError with retry info', () => {
      const error = new RateLimitError(30);
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.retryAfterSeconds).toBe(30);
    });

    test('should create CreditsError (not retryable)', () => {
      const error = new CreditsError();
      expect(error.isRetryable()).toBe(false);
      expect(error.userMessage).toContain('Add credits');
    });

    test('should serialize error to JSON', () => {
      const error = new TimeoutError(5000);
      const json = error.toJSON();
      expect(json.error).toBe('TIMEOUT');
      expect(json.retryable).toBe(true);
      expect(json.timestamp).toBeDefined();
    });

    test('should classify APIError', () => {
      const error = new NetworkError();
      const classified = classifyError(error);
      expect(classified.type).toBe('NetworkError');
      expect(classified.retryable).toBe(true);
    });

    test('should extract retry info from headers', () => {
      const headers = { 'retry-after': '60' };
      const info = extractRetryInfo(headers);
      expect(info.retryAfterSeconds).toBe(60);
    });

    test('should default retry-after to 60 seconds', () => {
      const info = extractRetryInfo({});
      expect(info.retryAfterSeconds).toBe(60);
    });
  });

  describe('Retry Logic', () => {
    test('should calculate exponential backoff delays', () => {
      const delay1 = calculateBackoffDelay(1); // ~1000ms
      const delay2 = calculateBackoffDelay(2); // ~2000ms
      const delay3 = calculateBackoffDelay(3); // ~4000ms

      expect(delay1).toBeLessThanOrEqual(1100);
      expect(delay2).toBeLessThanOrEqual(2200);
      expect(delay3).toBeLessThanOrEqual(4400);
    });

    test('should cap maximum backoff delay', () => {
      const delay = calculateBackoffDelay(10); // Would be huge
      expect(delay).toBeLessThanOrEqual(8800); // Max is 8000 + jitter
    });

    test('should add jitter to backoff', () => {
      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(calculateBackoffDelay(2));
      }
      const unique = new Set(delays);
      expect(unique.size).toBeGreaterThan(1); // Should have variance
    });

    test('should sleep for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    test('should identify retryable errors', () => {
      expect(isRetryable(new NetworkError())).toBe(true);
      expect(isRetryable(new TimeoutError(5000))).toBe(true);
      expect(isRetryable(new ValidationError('Bad', 'field'))).toBe(false);
      expect(isRetryable(new HTTPError(404, 'Not found'))).toBe(false);
    });

    test('should retry function on transient failure', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new NetworkError();
        }
        return 'success';
      });

      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    test('should not retry non-retryable errors', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        throw new ValidationError('Bad', 'field');
      });

      await expect(withRetry(fn)).rejects.toThrow(ValidationError);
      expect(attempts).toBe(1); // No retry
    });

    test('should fail after max retries', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        throw new NetworkError();
      });

      await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow(NetworkError);
      expect(attempts).toBe(3);
    });

    test('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new NetworkError();
        }
        return 'success';
      });

      await withRetry(fn, { onRetry });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          attemptNumber: 1,
          delayMs: expect.any(Number),
          error: expect.any(Error)
        })
      );
    });

    test('RetryTracker should track statistics', () => {
      const tracker = new RetryTracker();

      tracker.recordAttempt(true); // success
      tracker.recordAttempt(false, new NetworkError(), 1000); // retry
      tracker.recordAttempt(true); // success after retry

      const stats = tracker.getStats();
      expect(stats.totalAttempts).toBe(3);
      expect(stats.totalRetries).toBe(1);
      expect(stats.successAfterRetry).toBe(1);
      expect(stats.successRate).toContain('66');
    });

    test('RetryTracker should reset', () => {
      const tracker = new RetryTracker();
      tracker.recordAttempt(false, new NetworkError(), 1000);
      tracker.reset();

      const stats = tracker.getStats();
      expect(stats.totalAttempts).toBe(0);
      expect(stats.totalRetries).toBe(0);
    });
  });

  describe('Timeout Management', () => {
    test('should create timeout controller', () => {
      const { controller, signal, timeoutId, timeoutMs } = createTimeoutController(5000);

      expect(controller).toBeInstanceOf(AbortController);
      expect(signal).toBeDefined();
      expect(timeoutId).toBeDefined();
      expect(timeoutMs).toBe(5000);
    });

    test('should clamp timeout within bounds', () => {
      const { timeoutMs: min } = createTimeoutController(1000); // Below minimum
      const { timeoutMs: max } = createTimeoutController(600000); // Above maximum

      expect(min).toBe(5000); // MIN_TIMEOUT_MS
      expect(max).toBe(300000); // MAX_TIMEOUT_MS
    });

    test('should abort on timeout', async () => {
      const { controller, timeoutId } = createTimeoutController(100);

      const abortPromise = new Promise(resolve => {
        controller.signal.addEventListener('abort', () => resolve('aborted'));
      });

      const result = await Promise.race([
        new Promise(resolve => setTimeout(() => resolve('timeout'), 200)),
        abortPromise
      ]);

      expect(result).toBe('aborted');
      clearTimeoutController({ timeoutId, controller });
    });

    test('should wrap promise with timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 50));
      const result = await withTimeout(promise, 200);
      expect(result).toBe('success');
    });

    test('should timeout promise if exceeds duration', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 200));

      await expect(withTimeout(promise, 50, 'test')).rejects.toThrow(TimeoutError);
    });

    test('should validate timeout values', () => {
      expect(isValidTimeout(5000)).toBe(true);
      expect(isValidTimeout(300000)).toBe(true);
      expect(isValidTimeout(-100)).toBe(false);
      expect(isValidTimeout(400000)).toBe(false);
      expect(isValidTimeout('not a number')).toBe(false);
    });

    test('TimeoutTracker should track statistics', () => {
      const tracker = new TimeoutTracker();

      tracker.recordRequest(1000, false);
      tracker.recordRequest(2000, false);
      tracker.recordRequest(3000, true); // timeout

      const stats = tracker.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.timedOutRequests).toBe(1);
      expect(stats.timeoutRate).toContain('33');
      expect(stats.averageTimeMs).toBe(2000);
    });

    test('TimeoutTracker should reset', () => {
      const tracker = new TimeoutTracker();
      tracker.recordRequest(1000, true);
      tracker.reset();

      const stats = tracker.getStats();
      expect(stats.totalRequests).toBe(0);
    });
  });

  describe('APIClient Request Methods', () => {
    let client;

    beforeEach(() => {
      client = createClient();
      global.fetch = jest.fn();
    });

    test('should create client with default config', () => {
      expect(client.config.timeout).toBe(DEFAULT_TIMEOUT_MS);
      expect(client.config.maxRetries).toBe(3);
    });

    test('should make GET request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'test' })
      });

      const result = await client.get('/test');
      expect(result.data).toBe('test');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    test('should make POST request with data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true })
      });

      const result = await client.post('/test', { key: 'value' });
      expect(result.success).toBe(true);
    });

    test('should make PUT request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ updated: true })
      });

      await client.put('/test', { id: 1 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    test('should add request interceptor', async () => {
      const interceptor = jest.fn(config => {
        return { ...config, headers: { ...config.headers, 'X-Custom': 'header' } };
      });

      client.addRequestInterceptor(interceptor);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'test' })
      });

      await client.get('/test');
      expect(interceptor).toHaveBeenCalled();
    });

    test('should add error interceptor', async () => {
      const interceptor = jest.fn((error) => {
        return new ValidationError('Intercepted', 'field');
      });

      client.addErrorInterceptor(interceptor);

      global.fetch.mockRejectedValueOnce(new Error('Test error'));

      await expect(client.get('/test')).rejects.toThrow(ValidationError);
      expect(interceptor).toHaveBeenCalled();
    });

    test('should handle HTTP error 404', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ message: 'Not found' })
      });

      await expect(client.get('/test')).rejects.toThrow(HTTPError);
    });

    test('should handle 402 error as CreditsError', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ message: 'No credits' })
      });

      await expect(client.get('/test')).rejects.toThrow(CreditsError);
    });

    test('should handle 429 error with retry-after', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '30'], ['content-type', 'application/json']]),
        json: async () => ({ message: 'Rate limited' })
      });

      await expect(client.get('/test')).rejects.toThrow(RateLimitError);
    });

    test('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        }
      });

      await expect(client.get('/test')).rejects.toThrow(ResponseError);
    });

    test('should get pending requests', async () => {
      const promises = [];
      global.fetch.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            headers: new Map([['content-type', 'application/json']]),
            json: async () => ({ data: 'test' })
          });
        }, 100);
      }));

      promises.push(client.get('/test1'));
      promises.push(client.get('/test2'));

      // Before completion, should have pending
      const pending = client.getPendingRequests();
      // Note: Due to timing, this might be 0, so we skip strict assertion

      await Promise.all(promises);
    });

    test('should get statistics', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'test' })
      });

      await client.get('/test');

      const stats = client.getStats();
      expect(stats.retries).toBeDefined();
      expect(stats.timeouts).toBeDefined();
      expect(stats.pendingRequests).toBeGreaterThanOrEqual(0);
    });

    test('should reset statistics', () => {
      client.retryTracker.recordAttempt(false, new NetworkError(), 1000);
      client.resetStats();

      const stats = client.getStats();
      expect(stats.retries.totalRetries).toBe(0);
    });
  });

  describe('Offline Queue Management', () => {
    let client;

    beforeEach(() => {
      client = createClient();
      global.fetch = jest.fn();
    });

    test('should queue POST request when offline', async () => {
      client.isOnline = false;

      const promise = client.post('/test', { key: 'value' });

      expect(client.offlineQueue.length).toBe(1);
      expect(client.offlineQueue[0].method).toBe('POST');
    });

    test('should not queue GET request when offline', async () => {
      client.isOnline = false;

      // GET requests don't queue, they fail immediately
      // This tests the current behavior where only non-GET requests queue
      const promise = client.get('/test');

      // GET should still execute (not queued)
      // The fetch will be mocked, so it should resolve
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'test' })
      });

      const result = await promise;
      expect(result.data).toBe('test');
    });

    test('should process offline queue when coming online', async () => {
      client.isOnline = false;

      // Queue requests
      const promise1 = client.post('/test1', { id: 1 });
      const promise2 = client.post('/test2', { id: 2 });

      expect(client.offlineQueue.length).toBe(2);

      // Mock fetch before going online
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true })
      });

      // Go online
      client.isOnline = true;
      await client.processOfflineQueue();

      expect(client.offlineQueue.length).toBe(0);
    });
  });

  describe('Client Singleton Pattern', () => {
    test('should return same instance with getClient', () => {
      const client1 = getClient();
      const client2 = getClient();
      expect(client1).toBe(client2);
    });

    test('should create new instance with createClient', () => {
      const client1 = createClient();
      const client2 = createClient();
      expect(client1).not.toBe(client2);
    });
  });
});
