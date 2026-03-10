/**
 * Production-Grade API Client
 * Phase E: API Resilience Layer
 *
 * Complete HTTP client with:
 * - Automatic retry with exponential backoff
 * - Timeout management
 * - Comprehensive error handling
 * - Request/response interceptors
 * - Offline queue support
 * - Request tracking and metrics
 */

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
} from './errors.js';

import {
  withRetry,
  isRetryable,
  RETRY_CONFIG,
  RetryTracker
} from './retry.js';

import {
  createFetchOptionsWithTimeout,
  clearTimeoutController,
  DEFAULT_TIMEOUT_MS,
  TimeoutTracker,
  isValidTimeout
} from './timeout.js';

/**
 * API Client Configuration
 */
export const CLIENT_CONFIG = {
  baseURL: '/api',
  timeout: DEFAULT_TIMEOUT_MS,
  maxRetries: 3,
  retryDelay: 1000,
  validateStatus: (status) => status >= 200 && status < 300,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Main API Client
 */
export class APIClient {
  constructor(config = {}) {
    this.config = { ...CLIENT_CONFIG, ...config };
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    this.pendingRequests = new Map();
    this.retryTracker = new RetryTracker();
    this.timeoutTracker = new TimeoutTracker();
    this.offlineQueue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.requestId = 0;

    // Monitor online/offline status if in browser
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
    return () => {
      this.requestInterceptors.splice(this.requestInterceptors.indexOf(interceptor), 1);
    };
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
    return () => {
      this.responseInterceptors.splice(this.responseInterceptors.indexOf(interceptor), 1);
    };
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor) {
    this.errorInterceptors.push(interceptor);
    return () => {
      this.errorInterceptors.splice(this.errorInterceptors.indexOf(interceptor), 1);
    };
  }

  /**
   * Handle online status change
   */
  handleOnline() {
    this.isOnline = true;
    this.processOfflineQueue();
  }

  /**
   * Handle offline status change
   */
  handleOffline() {
    this.isOnline = false;
  }

  /**
   * Process queued requests when back online
   */
  async processOfflineQueue() {
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        const response = await this.request(request.method, request.url, request.data, request.options);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      }
    }
  }

  /**
   * Main request method
   */
  async request(method, url, data = null, options = {}) {
    const requestId = ++this.requestId;
    const fullUrl = this.buildUrl(url);
    const config = { ...this.config, ...options };

    // Validate timeout if provided
    if (config.timeout && !isValidTimeout(config.timeout)) {
      throw new ValidationError('Invalid timeout value', 'timeout');
    }

    // If offline, queue request
    if (!this.isOnline && method !== 'GET') {
      return new Promise((resolve, reject) => {
        this.offlineQueue.push({
          method,
          url,
          data,
          options: config,
          resolve,
          reject
        });
      });
    }

    const startTime = Date.now();
    this.pendingRequests.set(requestId, { method, url, startTime });

    try {
      // Build request options
      let fetchOptions = this.buildFetchOptions(method, data, config);

      // Run request interceptors
      fetchOptions = await this.runInterceptors(this.requestInterceptors, {
        method,
        url: fullUrl,
        ...fetchOptions
      });

      // Execute request with retry and timeout
      let fetchResponse;

      await withRetry(
        async () => {
          // Create fetch options with timeout
          const optionsWithTimeout = createFetchOptionsWithTimeout(
            { ...fetchOptions },
            config.timeout
          );

          // Perform the actual fetch
          fetchResponse = await fetch(fullUrl, optionsWithTimeout);

          // Clean up timeout controller
          if (optionsWithTimeout._timeoutId) {
            clearTimeoutController({
              timeoutId: optionsWithTimeout._timeoutId,
              controller: optionsWithTimeout._timeoutController
            });
          }

          return fetchResponse;
        },
        {
          maxAttempts: config.maxRetries,
          onRetry: (info) => this.onRetry(requestId, info)
        }
      );

      // Record metrics
      const duration = Date.now() - startTime;
      this.retryTracker.recordAttempt(true);
      this.timeoutTracker.recordRequest(duration, false);

      // Parse response
      let responseData;
      const contentType = fetchResponse.headers.get('content-type') || '';

      try {
        if (contentType.includes('application/json')) {
          responseData = await fetchResponse.json();
        } else {
          responseData = await fetchResponse.text();
        }
      } catch (error) {
        throw new ResponseError('Failed to parse response', { url, contentType });
      }

      // Validate status
      if (!config.validateStatus(fetchResponse.status)) {
        // Handle specific error codes
        if (fetchResponse.status === 402) {
          throw new CreditsError({ url, status: fetchResponse.status });
        }

        if (fetchResponse.status === 429) {
          const { retryAfterSeconds } = extractRetryInfo(fetchResponse.headers);
          throw new RateLimitError(retryAfterSeconds, { url, status: fetchResponse.status });
        }

        throw new HTTPError(
          fetchResponse.status,
          responseData?.message || fetchResponse.statusText,
          { url, responseData }
        );
      }

      // Run response interceptors
      const response = await this.runInterceptors(this.responseInterceptors, {
        data: responseData,
        status: fetchResponse.status,
        headers: Object.fromEntries(fetchResponse.headers),
        url: fullUrl
      });

      return response.data || response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.timeoutTracker.recordRequest(duration, error instanceof TimeoutError);

      // Run error interceptors
      let finalError = error;
      for (const interceptor of this.errorInterceptors) {
        try {
          finalError = await interceptor(error, { method, url: fullUrl, requestId });
        } catch (e) {
          finalError = e;
        }
      }

      this.pendingRequests.delete(requestId);
      throw finalError;
    } finally {
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Build full URL
   */
  buildUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return this.config.baseURL + (url.startsWith('/') ? url : '/' + url);
  }

  /**
   * Build fetch options
   */
  buildFetchOptions(method, data, config) {
    const options = {
      method,
      headers: { ...this.config.headers, ...config.headers }
    };

    if (data) {
      if (typeof data === 'string') {
        options.body = data;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    return options;
  }

  /**
   * Run interceptor chain
   */
  async runInterceptors(interceptors, config) {
    let result = config;

    for (const interceptor of interceptors) {
      if (typeof interceptor === 'function') {
        result = await interceptor(result);
      } else if (interceptor && typeof interceptor.onFulfilled === 'function') {
        result = await interceptor.onFulfilled(result);
      }
    }

    return result;
  }

  /**
   * Handle retry event
   */
  onRetry(requestId, info) {
    this.retryTracker.recordAttempt(false, info.error, info.delayMs);

    // Optionally dispatch event for UI update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api:retry', {
        detail: { requestId, ...info }
      }));
    }
  }

  /**
   * GET request
   */
  get(url, options = {}) {
    return this.request('GET', url, null, options);
  }

  /**
   * POST request
   */
  post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  /**
   * PUT request
   */
  put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }

  /**
   * PATCH request
   */
  patch(url, data, options = {}) {
    return this.request('PATCH', url, data, options);
  }

  /**
   * DELETE request
   */
  delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }

  /**
   * Get pending requests
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      retries: this.retryTracker.getStats(),
      timeouts: this.timeoutTracker.getStats(),
      pendingRequests: this.getPendingRequests().length,
      offlineQueueSize: this.offlineQueue.length,
      isOnline: this.isOnline
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.retryTracker.reset();
    this.timeoutTracker.reset();
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    this.pendingRequests.forEach((request, id) => {
      this.pendingRequests.delete(id);
    });
  }
}

/**
 * Create singleton instance
 */
let globalClient;

export function getClient(config = {}) {
  if (!globalClient) {
    globalClient = new APIClient(config);
  }
  return globalClient;
}

export function createClient(config = {}) {
  return new APIClient(config);
}

/**
 * Default export
 */
export default APIClient;
