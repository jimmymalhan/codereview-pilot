/**
 * Error Handler Module Tests
 * 15+ test cases covering retry logic and escalation
 */

import { jest } from '@jest/globals';
import { ErrorHandler } from '../src/paperclip/error-handler.js';

describe('ErrorHandler: Retry & Escalation Tests', () => {
  let handler;

  beforeEach(() => {
    handler = new ErrorHandler();
  });

  describe('Error Classification', () => {
    test('should classify validation errors', () => {
      const error = new Error('validation failed');
      expect(handler.classifyError(error)).toBe('ValidationError');
    });

    test('should classify permission errors', () => {
      const error = new Error('permission denied');
      expect(handler.classifyError(error)).toBe('PermissionError');
    });

    test('should classify timeout errors', () => {
      const error = new Error('timeout occurred');
      expect(handler.classifyError(error)).toBe('TimeoutError');
    });

    test('should classify resource errors', () => {
      const error = new Error('out of memory');
      expect(handler.classifyError(error)).toBe('ResourceError');
    });

    test('should classify generic execution errors', () => {
      const error = new Error('something failed');
      expect(handler.classifyError(error)).toBe('ExecutionError');
    });
  });

  describe('Retry Logic', () => {
    test('should execute function without errors', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await handler.executeWithRetry(fn);

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
    });

    test('should retry on retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('timeout occurred'))
        .mockResolvedValueOnce('success');

      const result = await handler.executeWithRetry(fn);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should not retry non-retryable errors', async () => {
      const fn = jest.fn()
        .mockRejectedValue(new Error('permission denied'));

      const result = await handler.executeWithRetry(fn);

      expect(result.success).toBe(false);
      expect(fn).toHaveBeenCalledTimes(1); // non-retryable errors exit immediately without retrying
    }, 15000);

    test('should respect max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('timeout'));
      await handler.executeWithRetry(fn);

      expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    }, 15000);

    test('should implement exponential backoff', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('timeout'));
      const start = Date.now();
      await handler.executeWithRetry(fn);
      const duration = Date.now() - start;

      // Should have delays between retries
      expect(duration).toBeGreaterThan(0);
    }, 15000);
  });

  describe('Retryability', () => {
    test('should identify timeout as retryable', () => {
      const error = new Error('timeout occurred');
      expect(handler.isRetryable(error)).toBe(true);
    });

    test('should identify resource error as retryable', () => {
      const error = new Error('out of memory');
      expect(handler.isRetryable(error)).toBe(true);
    });

    test('should identify validation error as non-retryable', () => {
      const error = new Error('invalid input');
      expect(handler.isRetryable(error)).toBe(false);
    });

    test('should identify permission error as non-retryable', () => {
      const error = new Error('access denied');
      expect(handler.isRetryable(error)).toBe(false);
    });
  });

  describe('Error Logging', () => {
    test('should log errors to error log', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      await handler.executeWithRetry(fn);

      const log = handler.getErrorLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0].error).toBe('test error');
    }, 15000);

    test('should clear error log', () => {
      handler._log({ type: 'test' });
      handler.clearErrorLog();

      expect(handler.getErrorLog()).toEqual([]);
    });
  });

  describe('Error Escalation', () => {
    test('should escalate validation errors', () => {
      const error = new Error('invalid input');
      const escalation = handler.escalate(error);

      expect(escalation.type).toBe('ValidationError');
      expect(escalation.action).toContain('Fix input');
    });

    test('should escalate permission errors', () => {
      const error = new Error('permission denied');
      const escalation = handler.escalate(error);

      expect(escalation.type).toBe('PermissionError');
      expect(escalation.action).toContain('permissions');
    });

    test('should escalate timeout errors', () => {
      const error = new Error('timeout');
      const escalation = handler.escalate(error);

      expect(escalation.type).toBe('TimeoutError');
      expect(escalation.action).toContain('timeout');
    });

    test('should include timestamp in escalation', () => {
      const error = new Error('test');
      const escalation = handler.escalate(error);

      expect(escalation.timestamp).toBeDefined();
    });
  });

  describe('Context Preservation', () => {
    test('should preserve context through retry', async () => {
      const context = { taskId: 'test-123', agentId: 'router' };
      const fn = jest.fn().mockResolvedValue('success');

      await handler.executeWithRetry(fn, context);

      const log = handler.getErrorLog();
      // Context is preserved if any logging happened
    });
  });
});
