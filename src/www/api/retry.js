/**
 * Retry Logic with Exponential Backoff
 * Phase E: API Resilience Layer
 *
 * Implements exponential backoff retry strategy with jitter
 * for handling transient failures.
 */

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  jitterFactor: 0.1
};

/**
 * Calculate exponential backoff delay with jitter
 *
 * Formula: min(initialDelay * (multiplier ^ attemptNumber), maxDelay) + random jitter
 * Example: 1s, 2s, 4s, 8s (with jitter)
 */
export function calculateBackoffDelay(attemptNumber, config = RETRY_CONFIG) {
  const { initialDelayMs, maxDelayMs, backoffMultiplier, jitterFactor } = config;

  // Calculate base delay with exponential backoff
  const baseDelay = initialDelayMs * Math.pow(backoffMultiplier, attemptNumber - 1);
  const cappedDelay = Math.min(baseDelay, maxDelayMs);

  // Add random jitter (±10% by default)
  const jitter = cappedDelay * jitterFactor * (Math.random() - 0.5) * 2;
  const delayWithJitter = Math.max(0, cappedDelay + jitter);

  return Math.round(delayWithJitter);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if error is retryable
 */
export function isRetryable(error) {
  // Explicit retryable check (from APIError)
  if (error && typeof error.isRetryable === 'boolean') {
    return error.isRetryable();
  }

  // Check error code
  const nonRetryable = [
    'INVALID_INPUT',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'NO_CREDITS'
  ];

  if (error && error.code && nonRetryable.includes(error.code)) {
    return false;
  }

  // Network and timeout errors are retryable
  if (error && (error.name === 'NetworkError' || error.name === 'TimeoutError')) {
    return true;
  }

  // AbortError from timeout is retryable
  if (error && error.name === 'AbortError') {
    return true;
  }

  return false;
}

/**
 * Retry function with exponential backoff
 *
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result from function
 */
export async function withRetry(fn, options = {}) {
  const config = { ...RETRY_CONFIG, ...options };
  const { maxAttempts, onRetry } = config;

  let lastError;

  for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on non-retryable errors
      if (!isRetryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attemptNumber === maxAttempts) {
        throw error;
      }

      // Calculate backoff delay
      const delayMs = calculateBackoffDelay(attemptNumber, config);

      // Call retry callback if provided
      if (onRetry) {
        onRetry({
          attemptNumber,
          delayMs,
          error,
          nextAttemptIn: `${(delayMs / 1000).toFixed(1)}s`
        });
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Retry statistics tracker
 */
export class RetryTracker {
  constructor() {
    this.totalAttempts = 0;
    this.successAfterRetry = 0;
    this.totalRetries = 0;
    this.totalBackoffMs = 0;
    this.failureReasons = {};
  }

  recordAttempt(success, error = null, backoffMs = 0) {
    this.totalAttempts++;

    if (!success) {
      this.totalRetries++;
      this.totalBackoffMs += backoffMs;

      const reason = error && error.code ? error.code : 'UNKNOWN';
      this.failureReasons[reason] = (this.failureReasons[reason] || 0) + 1;
    } else if (this.totalRetries > 0) {
      this.successAfterRetry++;
    }
  }

  getStats() {
    return {
      totalAttempts: this.totalAttempts,
      successAfterRetry: this.successAfterRetry,
      totalRetries: this.totalRetries,
      averageBackoffMs: this.totalRetries > 0
        ? Math.round(this.totalBackoffMs / this.totalRetries)
        : 0,
      failureReasons: this.failureReasons,
      successRate: this.totalAttempts > 0
        ? ((this.totalAttempts - this.totalRetries) / this.totalAttempts * 100).toFixed(2) + '%'
        : '100%'
    };
  }

  reset() {
    this.totalAttempts = 0;
    this.successAfterRetry = 0;
    this.totalRetries = 0;
    this.totalBackoffMs = 0;
    this.failureReasons = {};
  }
}
