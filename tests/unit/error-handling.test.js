/**
 * Unit Tests: Error Handling
 *
 * Tests for error types, classification, retry logic,
 * and user-facing messages across API and UI layers.
 */

import { jest } from '@jest/globals';
import {
  RateLimitError,
  NetworkError,
  TimeoutError,
  ValidationError,
  HTTPError,
  CreditsError,
  classifyError,
  extractRetryInfo,
} from '../../src/www/api/errors.js';

describe('Error Handling: RateLimitError', () => {
  test('getUserMessage includes wait time in minutes', () => {
    const err = new RateLimitError(60);
    expect(err.userMessage).toMatch(/minute/);
    expect(err.userMessage).toMatch(/1/);
    expect(err.userMessage).toContain('Too many requests');
  });

  test('getUserMessage pluralizes minutes when > 1', () => {
    const err = new RateLimitError(120);
    expect(err.userMessage).toMatch(/minutes/);
    expect(err.userMessage).toMatch(/2/);
  });

  test('getSuggestion provides retry guidance', () => {
    const err = new RateLimitError(30);
    expect(err.suggestion).toMatch(/retry|wait|frequency/);
  });

  test('retryAfterSeconds is preserved', () => {
    const err = new RateLimitError(90);
    expect(err.retryAfterSeconds).toBe(90);
    expect(err.details.retryAfterSeconds).toBe(90);
  });

  test('is retryable', () => {
    const err = new RateLimitError(60);
    expect(err.retryable).toBe(true);
  });
});

describe('Error Handling: classifyError', () => {
  test('returns retryAfterSeconds for RateLimitError', () => {
    const err = new RateLimitError(45);
    const classified = classifyError(err);
    expect(classified.retryAfterSeconds).toBe(45);
    expect(classified.code).toBe('RATE_LIMIT');
  });

  test('classifies NetworkError with retryable true', () => {
    const err = new NetworkError();
    const classified = classifyError(err);
    expect(classified.type).toBe('NetworkError');
    expect(classified.retryable).toBe(true);
    expect(classified.userMessage).toMatch(/connect|connection/);
  });

  test('classifies TimeoutError', () => {
    const err = new TimeoutError(5000);
    const classified = classifyError(err);
    expect(classified.type).toBe('TimeoutError');
    expect(classified.retryable).toBe(true);
  });

  test('classifies ValidationError as not retryable', () => {
    const err = new ValidationError('Too short', 'incident');
    const classified = classifyError(err);
    expect(classified.retryable).toBe(false);
  });

  test('classifies generic Error as unknown', () => {
    const classified = classifyError(new Error('Something broke'));
    expect(classified.code).toBe('UNKNOWN');
  });

  test('classifies Failed to fetch as NetworkError', () => {
    const classified = classifyError(new Error('Failed to fetch'));
    expect(classified.code).toBe('NETWORK_ERROR');
  });
});

describe('Error Handling: extractRetryInfo', () => {
  test('extracts retry-after from Headers-like object', () => {
    const headers = { get: (name) => (name === 'retry-after' ? '30' : null) };
    const info = extractRetryInfo(headers);
    expect(info.retryAfterSeconds).toBe(30);
  });

  test('extracts retry-after from plain object', () => {
    const headers = { 'retry-after': '120' };
    const info = extractRetryInfo(headers);
    expect(info.retryAfterSeconds).toBe(120);
  });

  test('defaults to 60 when header missing', () => {
    const info = extractRetryInfo({});
    expect(info.retryAfterSeconds).toBe(60);
  });

  test('defaults to 60 when headers null', () => {
    const info = extractRetryInfo(null);
    expect(info.retryAfterSeconds).toBe(60);
  });

  test('ignores non-numeric retry-after', () => {
    const headers = { 'retry-after': 'invalid' };
    const info = extractRetryInfo(headers);
    expect(info.retryAfterSeconds).toBe(60);
  });
});

describe('Error Handling: HTTP status mapping', () => {
  test('400 maps to INVALID_INPUT', () => {
    const err = new HTTPError(400, 'Bad request');
    expect(err.code).toBe('INVALID_INPUT');
  });

  test('401 maps to UNAUTHORIZED', () => {
    const err = new HTTPError(401, 'Unauthorized');
    expect(err.code).toBe('UNAUTHORIZED');
  });

  test('403 maps to FORBIDDEN', () => {
    const err = new HTTPError(403, 'Forbidden');
    expect(err.code).toBe('FORBIDDEN');
  });

  test('404 maps to NOT_FOUND', () => {
    const err = new HTTPError(404, 'Not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  test('429 maps to RATE_LIMIT', () => {
    const err = new HTTPError(429, 'Too many requests');
    expect(err.code).toBe('RATE_LIMIT');
  });

  test('500 maps to SERVER_ERROR', () => {
    const err = new HTTPError(500, 'Internal error');
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.retryable).toBe(true);
  });
});
