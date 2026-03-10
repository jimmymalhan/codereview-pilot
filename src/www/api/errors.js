/**
 * API Error Types and Handling
 * Phase E: API Resilience Layer
 *
 * Defines all error types, classifications, user-friendly messages,
 * and recovery strategies for production-grade error handling.
 */

/**
 * Base API Error Class
 */
export class APIError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userMessage = this.getUserMessage();
    this.suggestion = this.getSuggestion();
    this.retryable = this.isRetryable();
  }

  getUserMessage() {
    const messages = {
      NETWORK_ERROR: 'Unable to connect. Check your internet connection.',
      TIMEOUT: 'Request took too long. The server may be slow or busy.',
      INVALID_INPUT: 'Your input is invalid. Please check and try again.',
      UNAUTHORIZED: 'You are not authorized to perform this action.',
      FORBIDDEN: 'Access denied. Contact support if you believe this is an error.',
      NOT_FOUND: 'The requested resource was not found.',
      RATE_LIMIT: 'Too many requests. Please wait before trying again.',
      SERVER_ERROR: 'Server error occurred. Please try again later.',
      MAINTENANCE: 'Service is temporarily unavailable for maintenance.',
      NO_CREDITS: 'Insufficient API credits. Add credits to continue.',
      MALFORMED_RESPONSE: 'Server response was invalid. Please try again.',
      UNKNOWN: 'An unexpected error occurred. Please try again.'
    };
    return messages[this.code] || messages.UNKNOWN;
  }

  getSuggestion() {
    const suggestions = {
      NETWORK_ERROR: 'Check your internet connection and try again.',
      TIMEOUT: 'Wait a moment and try again. The service may be experiencing high load.',
      INVALID_INPUT: 'Review your input and ensure it meets all requirements.',
      UNAUTHORIZED: 'Log in again or contact support.',
      FORBIDDEN: 'Contact support for access.',
      NOT_FOUND: 'Verify the resource ID and try again.',
      RATE_LIMIT: 'Wait a few seconds before retrying.',
      SERVER_ERROR: 'Try again in a few moments.',
      MAINTENANCE: 'Please check back in a few minutes.',
      NO_CREDITS: 'Visit https://console.anthropic.com/account/billing/overview to add credits.',
      MALFORMED_RESPONSE: 'Try again. Contact support if this persists.',
      UNKNOWN: 'Contact support if this problem persists.'
    };
    return suggestions[this.code] || suggestions.UNKNOWN;
  }

  isRetryable() {
    const nonRetryable = [
      'INVALID_INPUT',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'NO_CREDITS'
    ];
    return !nonRetryable.includes(this.code);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      userMessage: this.userMessage,
      suggestion: this.suggestion,
      retryable: this.retryable,
      timestamp: this.timestamp,
      details: this.details
    };
  }
}

/**
 * Network Error - Connection or DNS issues
 */
export class NetworkError extends APIError {
  constructor(details = {}) {
    super('NETWORK_ERROR', 'Network connectivity error', details);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout Error - Request exceeded time limit
 */
export class TimeoutError extends APIError {
  constructor(timeoutMs, details = {}) {
    super(
      'TIMEOUT',
      `Request timeout after ${timeoutMs}ms`,
      { ...details, timeoutMs }
    );
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Validation Error - Invalid input
 */
export class ValidationError extends APIError {
  constructor(message, field, details = {}) {
    super(
      'INVALID_INPUT',
      message,
      { ...details, field }
    );
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * HTTP Error - Server returned error status
 */
export class HTTPError extends APIError {
  constructor(status, message, details = {}) {
    const code = mapStatusToCode(status);
    super(code, `HTTP ${status}: ${message}`, { ...details, status });
    this.name = 'HTTPError';
    this.status = status;
  }
}

/**
 * Rate Limit Error - Too many requests
 */
export class RateLimitError extends APIError {
  constructor(retryAfterSeconds, details = {}) {
    super(
      'RATE_LIMIT',
      `Rate limited. Retry after ${retryAfterSeconds}s`,
      { ...details, retryAfterSeconds }
    );
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Credits Error - No API credits available
 */
export class CreditsError extends APIError {
  constructor(details = {}) {
    super(
      'NO_CREDITS',
      'Insufficient API credits',
      details
    );
    this.name = 'CreditsError';
    this.retryable = false;
  }
}

/**
 * Response Error - Malformed response
 */
export class ResponseError extends APIError {
  constructor(message, details = {}) {
    super(
      'MALFORMED_RESPONSE',
      `Malformed response: ${message}`,
      details
    );
    this.name = 'ResponseError';
  }
}

/**
 * Map HTTP status code to error code
 */
function mapStatusToCode(status) {
  switch (status) {
    case 400:
      return 'INVALID_INPUT';
    case 401:
      return 'UNAUTHORIZED';
    case 402:
      return 'NO_CREDITS';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 429:
      return 'RATE_LIMIT';
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
    case 503:
      return 'MAINTENANCE';
    default:
      return 'SERVER_ERROR';
  }
}

/**
 * Classify error for handling
 */
export function classifyError(error) {
  if (error instanceof APIError) {
    return {
      type: error.name,
      code: error.code,
      retryable: error.retryable,
      userMessage: error.userMessage,
      suggestion: error.suggestion,
      timeoutMs: error.timeoutMs,
      status: error.status
    };
  }

  if (error.name === 'AbortError') {
    return {
      type: 'TimeoutError',
      code: 'TIMEOUT',
      retryable: true,
      userMessage: 'Request timeout. Please try again.',
      suggestion: 'Wait a moment and retry.'
    };
  }

  if (error.message && error.message.includes('Failed to fetch')) {
    return {
      type: 'NetworkError',
      code: 'NETWORK_ERROR',
      retryable: true,
      userMessage: 'Network connectivity error.',
      suggestion: 'Check your connection and retry.'
    };
  }

  return {
    type: 'UnknownError',
    code: 'UNKNOWN',
    retryable: false,
    userMessage: 'An unexpected error occurred.',
    suggestion: 'Contact support if this persists.'
  };
}

/**
 * Extract retry info from response headers
 */
export function extractRetryInfo(headers) {
  let retryAfterSeconds = 60;

  if (headers) {
    const retryAfter = headers['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        retryAfterSeconds = seconds;
      }
    }
  }

  return { retryAfterSeconds };
}
