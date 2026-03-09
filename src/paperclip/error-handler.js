/**
 * Error Handler for Paperclip Integration
 *
 * Centralized error handling with retry logic and escalation.
 */

const ERROR_TYPES = {
  VALIDATION_ERROR: 'ValidationError',
  PERMISSION_ERROR: 'PermissionError',
  EXECUTION_ERROR: 'ExecutionError',
  TIMEOUT_ERROR: 'TimeoutError',
  RESOURCE_ERROR: 'ResourceError'
};

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // ms
  maxDelay: 10000,
  backoffMultiplier: 2
};

export class ErrorHandler {
  constructor(auditLogger = null) {
    this.auditLogger = auditLogger;
    this.errorLog = [];
  }

  /**
   * Wrap function with error handling and automatic retry
   */
  async executeWithRetry(fn, context = {}) {
    let lastError;
    let delay = RETRY_CONFIG.initialDelay;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const result = await fn();
        if (attempt > 0) {
          this._log({
            type: 'retry_success',
            attempt,
            context
          });
        }
        return { success: true, result, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        this._logError(error, attempt, context);

        if (attempt < RETRY_CONFIG.maxRetries) {
          await this._sleep(delay);
          delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
        }
      }
    }

    // All retries exhausted
    return this._handleFinalError(lastError, context);
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    const message = error.message || '';

    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION_ERROR;
    }
    if (message.includes('permission') || message.includes('denied')) {
      return ERROR_TYPES.PERMISSION_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_TYPES.TIMEOUT_ERROR;
    }
    if (message.includes('resource') || message.includes('memory')) {
      return ERROR_TYPES.RESOURCE_ERROR;
    }
    return ERROR_TYPES.EXECUTION_ERROR;
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(error) {
    const type = this.classifyError(error);
    return [ERROR_TYPES.TIMEOUT_ERROR, ERROR_TYPES.RESOURCE_ERROR].includes(type);
  }

  /**
   * Escalate error to higher level
   */
  escalate(error, level = 'engineering') {
    const errorType = this.classifyError(error);
    const escalation = {
      timestamp: new Date().toISOString(),
      error: error.message,
      type: errorType,
      level,
      action: this._getEscalationAction(errorType)
    };

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'escalation_triggered',
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    }

    return escalation;
  }

  /**
   * Get all logged errors
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Internal: Log error
   */
  _logError(error, attempt, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      error: error.message,
      type: this.classifyError(error),
      attempt,
      context,
      retryable: this.isRetryable(error)
    };

    this.errorLog.push(entry);

    if (this.auditLogger) {
      this.auditLogger.log({
        event: 'governance_override',
        reason: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Internal: Log message
   */
  _log(entry) {
    this.errorLog.push({
      timestamp: new Date().toISOString(),
      ...entry
    });
  }

  /**
   * Internal: Sleep utility
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Internal: Handle final error after all retries
   */
  _handleFinalError(error, context) {
    return {
      success: false,
      error: error.message,
      type: this.classifyError(error),
      context,
      needsEscalation: true
    };
  }

  /**
   * Internal: Get escalation action
   */
  _getEscalationAction(errorType) {
    const actions = {
      [ERROR_TYPES.VALIDATION_ERROR]: 'Fix input data and retry',
      [ERROR_TYPES.PERMISSION_ERROR]: 'Check file access permissions',
      [ERROR_TYPES.EXECUTION_ERROR]: 'Investigate agent execution logs',
      [ERROR_TYPES.TIMEOUT_ERROR]: 'Increase timeout or reduce workload',
      [ERROR_TYPES.RESOURCE_ERROR]: 'Free up resources and retry'
    };
    return actions[errorType] || 'Review error logs';
  }
}

export default ErrorHandler;
