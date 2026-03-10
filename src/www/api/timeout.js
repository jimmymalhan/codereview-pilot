/**
 * Timeout Management
 * Phase E: API Resilience Layer
 *
 * Implements request timeout handling with AbortController
 * to prevent hanging requests.
 */

import { TimeoutError } from './errors.js';

/**
 * Default timeout configuration (in milliseconds)
 */
export const DEFAULT_TIMEOUT_MS = 60000; // 60 seconds
export const MIN_TIMEOUT_MS = 5000; // 5 seconds minimum
export const MAX_TIMEOUT_MS = 300000; // 5 minutes maximum

/**
 * Create an AbortController with timeout
 *
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Object} { controller, signal, timeoutId }
 */
export function createTimeoutController(timeoutMs = DEFAULT_TIMEOUT_MS) {
  // Clamp timeout within reasonable bounds
  const clampedTimeout = Math.max(MIN_TIMEOUT_MS, Math.min(timeoutMs, MAX_TIMEOUT_MS));

  const controller = new AbortController();
  let timeoutId;

  timeoutId = setTimeout(() => {
    controller.abort();
  }, clampedTimeout);

  return {
    controller,
    signal: controller.signal,
    timeoutId,
    timeoutMs: clampedTimeout
  };
}

/**
 * Clear timeout controller
 */
export function clearTimeoutController({ timeoutId, controller }) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  // Note: We don't abort here - let it be handled by caller if needed
}

/**
 * Wrap a promise with timeout
 *
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} operationName - Name of operation (for error message)
 * @returns {Promise}
 */
export async function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS, operationName = 'Operation') {
  const { controller, timeoutId, signal } = createTimeoutController(timeoutMs);

  try {
    // Create a promise that rejects on abort
    const timeoutPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        reject(new TimeoutError(timeoutMs, { operationName }));
      });
    });

    // Race between the actual promise and timeout
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeoutController({ timeoutId, controller });
  }
}

/**
 * Create fetch options with timeout signal
 *
 * @param {Object} baseOptions - Base fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Object} Options with signal
 */
export function createFetchOptionsWithTimeout(baseOptions = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const { controller, signal, timeoutId, timeoutMs: clampedTimeout } = createTimeoutController(timeoutMs);

  return {
    ...baseOptions,
    signal,
    _timeoutController: controller,
    _timeoutId: timeoutId,
    _timeoutMs: clampedTimeout
  };
}

/**
 * Timeout statistics tracker
 */
export class TimeoutTracker {
  constructor() {
    this.totalRequests = 0;
    this.timedOutRequests = 0;
    this.averageTimeMs = 0;
    this.timeoutsByDuration = {};
  }

  recordRequest(durationMs, timedOut = false) {
    this.totalRequests++;

    if (timedOut) {
      this.timedOutRequests++;

      const bucket = Math.floor(durationMs / 1000) * 1000;
      this.timeoutsByDuration[bucket] = (this.timeoutsByDuration[bucket] || 0) + 1;
    }

    // Update running average
    this.averageTimeMs = ((this.averageTimeMs * (this.totalRequests - 1)) + durationMs) / this.totalRequests;
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      timedOutRequests: this.timedOutRequests,
      timeoutRate: this.totalRequests > 0
        ? (this.timedOutRequests / this.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      averageTimeMs: Math.round(this.averageTimeMs),
      timeoutsByDuration: this.timeoutsByDuration
    };
  }

  reset() {
    this.totalRequests = 0;
    this.timedOutRequests = 0;
    this.averageTimeMs = 0;
    this.timeoutsByDuration = {};
  }
}

/**
 * Validate timeout value
 */
export function isValidTimeout(ms) {
  return typeof ms === 'number' && ms > 0 && ms <= MAX_TIMEOUT_MS;
}
