/**
 * Analytics Service Tests
 * Tests event tracking, metrics computation, and data persistence
 */

import AnalyticsService from '../src/analytics-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testStorageDir = path.join(__dirname, '../.test-analytics');

describe('AnalyticsService', () => {
  let analyticsService;

  beforeEach(() => {
    // Create fresh analytics service for each test
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true });
    }
    analyticsService = new AnalyticsService({ storageDir: testStorageDir });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true });
    }
  });

  describe('Session Management', () => {
    it('should initialize with default metrics structure', () => {
      const metrics = analyticsService.getMetrics();
      expect(metrics.total_events).toBe(0);
      expect(metrics.total_sessions).toBe(0);
      expect(metrics.page_views).toEqual({});
      expect(metrics.cta_clicks).toEqual({});
    });

    it('should track sessions correctly', () => {
      const batch = {
        session_id: 'session_test_1',
        user_id: 'user_123',
        events: [
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.total_sessions).toBe(1);
      expect(metrics.total_events).toBe(1);
    });
  });

  describe('Event Processing', () => {
    it('should process page_view events', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          },
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'pipeline' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.page_views.home).toBe(1);
      expect(metrics.page_views.pipeline).toBe(1);
      expect(metrics.total_events).toBe(2);
    });

    it('should process cta_click events', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'cta_click',
            timestamp: Date.now(),
            data: { cta_text: 'Click Me', cta_type: 'button' }
          },
          {
            name: 'cta_click',
            timestamp: Date.now(),
            data: { cta_text: 'Click Me', cta_type: 'button' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.cta_clicks['Click Me']).toBe(2);
    });

    it('should process device_metrics events', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'device_metrics',
            timestamp: Date.now(),
            data: { device_type: 'mobile' }
          },
          {
            name: 'device_metrics',
            timestamp: Date.now(),
            data: { device_type: 'desktop' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.mobile_count).toBe(1);
      expect(metrics.desktop_count).toBe(1);
    });

    it('should process form_submission events', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'form_submission',
            timestamp: Date.now(),
            data: { form_name: 'contact', success: true }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.form_submissions).toBe(1);
    });

    it('should process error events', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'error',
            timestamp: Date.now(),
            data: { error_type: 'api_error', error_message: 'Network failed' }
          },
          {
            name: 'api_error',
            timestamp: Date.now(),
            data: { endpoint: '/api/test', status_code: 500 }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.error_count).toBe(1);
      expect(metrics.api_errors).toBe(1);
    });
  });

  describe('Metrics Computation', () => {
    it('should compute total page views', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          },
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'pipeline' }
          },
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.total_page_views).toBe(3);
    });

    it('should compute mobile percentage', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'device_metrics',
            timestamp: Date.now(),
            data: { device_type: 'mobile' }
          },
          {
            name: 'device_metrics',
            timestamp: Date.now(),
            data: { device_type: 'mobile' }
          },
          {
            name: 'device_metrics',
            timestamp: Date.now(),
            data: { device_type: 'desktop' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const metrics = analyticsService.getMetrics();

      expect(metrics.mobile_percentage).toBe(67);
    });
  });

  describe('Persistence', () => {
    it('should save and load metrics', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);

      // Create new instance to load saved data
      const newService = new AnalyticsService({ storageDir: testStorageDir });
      const metrics = newService.getMetrics();

      expect(metrics.page_views.home).toBe(1);
    });

    it('should append events to JSONL log', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          {
            name: 'page_view',
            timestamp: Date.now(),
            data: { page_name: 'home' }
          }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);

      const eventsFile = path.join(testStorageDir, 'events.jsonl');
      expect(fs.existsSync(eventsFile)).toBe(true);

      const content = fs.readFileSync(eventsFile, 'utf-8');
      expect(content).toContain('page_view');
    });
  });

  describe('Conversion Funnel', () => {
    it('should compute conversion funnel', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'home' } },
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'home' } },
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'pipeline' } },
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'skills' } }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const funnel = analyticsService.getConversionFunnel();

      expect(funnel.home_viewed).toBe(2);
      expect(funnel.pipeline_viewed).toBe(1);
      expect(funnel.skills_viewed).toBe(1);
      expect(funnel.conversion_rate_to_pipeline).toBe(50);
    });
  });

  describe('Batch Validation', () => {
    it('should reject invalid batch format', () => {
      expect(() => {
        analyticsService.processBatch({ incomplete: 'data' });
      }).toThrow('Invalid batch format');
    });

    it('should reject empty events array', () => {
      expect(() => {
        analyticsService.processBatch({
          session_id: 'test',
          user_id: 'user',
          events: []
        });
      }).toThrow('Empty events array');
    });
  });

  describe('Error Analytics', () => {
    it('should compute error analytics', () => {
      const batch = {
        session_id: 'session_1',
        user_id: 'user_1',
        events: [
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'home' } },
          { name: 'page_view', timestamp: Date.now(), data: { page_name: 'home' } },
          { name: 'error', timestamp: Date.now(), data: { error_type: 'runtime' } }
        ],
        batch_timestamp_ms: Date.now()
      };

      analyticsService.processBatch(batch);
      const errors = analyticsService.getErrorAnalytics();

      expect(errors.total_errors).toBe(1);
      expect(errors.error_rate).toBe(33);
    });
  });
});
