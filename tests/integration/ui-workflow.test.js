/**
 * Integration Tests: UI Workflow via Server API
 *
 * Tests critical workflows through the Express server:
 * - Form submission (valid/invalid) -> API -> results
 * - Network error -> retry
 * - Export (JSON)
 * - Error recovery
 * - Batch diagnosis
 * - Audit logging
 */

import { jest } from '@jest/globals';
import http from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Helper: make HTTP request to the test server
 */
function request(server, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('Integration: UI Workflow via Server API', () => {
  let server;

  beforeAll(async () => {
    // Dynamic import to get a fresh server on a random port
    const oldPort = process.env.PORT;
    process.env.PORT = '0'; // Let OS pick a random port
    const mod = await import('../../src/server.js');
    server = mod.default;
    process.env.PORT = oldPort;

    // Wait for server to be listening
    await new Promise((resolve) => {
      if (server.listening) return resolve();
      server.on('listening', resolve);
    });
  });

  afterAll((done) => {
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  // ─── Form submission with valid input ─────────────────────────
  describe('Valid form submission -> API -> results', () => {
    it('should return diagnosis with all 4 agent outputs', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Database query takes 45 seconds on production server',
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.incident).toContain('Database query');
      expect(res.body.result).toBeDefined();
      expect(res.body.result.router).toBeDefined();
      expect(res.body.result.router.stage).toBe('router');
      expect(res.body.result.retriever).toBeDefined();
      expect(res.body.result.retriever.evidence).toBeInstanceOf(Array);
      expect(res.body.result.skeptic).toBeDefined();
      expect(res.body.result.skeptic.alternativeTheory).toBeDefined();
      expect(res.body.result.verifier).toBeDefined();
      expect(res.body.result.verifier.rootCause).toBeDefined();
      expect(res.body.result.verifier.confidence).toBeGreaterThan(0);
      expect(res.body.result.verifier.fixPlan).toBeInstanceOf(Array);
      expect(res.body.result.verifier.rollback).toBeDefined();
      expect(res.body.result.verifier.tests).toBeInstanceOf(Array);
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.status).toBe('completed');
    });

    it('should store diagnosis and allow retrieval by ID', async () => {
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Server memory leak detected in production environment',
      });

      expect(createRes.status).toBe(200);
      const id = createRes.body.id;

      const getRes = await request(server, 'GET', `/api/diagnose/${id}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(id);
      expect(getRes.body.incident).toContain('memory leak');
    });

    it('should include traceId in result for observability', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'API latency spike detected across all endpoints',
      });

      expect(res.status).toBe(200);
      expect(res.body.result.traceId).toBeDefined();
      expect(res.body.result.traceId).toMatch(/^trace-/);
    });
  });

  // ─── Form submission with invalid input ────────────────────────
  describe('Invalid form submission -> validation error', () => {
    it('should reject missing incident field', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('missing_field');
      expect(res.body.message).toContain('incident');
    });

    it('should reject too-short incident (< 10 chars)', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_length');
      expect(res.body.message).toContain('at least 10');
    });

    it('should reject too-long incident (> 2000 chars)', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'a'.repeat(2001),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_length');
      expect(res.body.message).toContain('2000');
    });

    it('should reject non-string incident', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 12345,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_type');
    });
  });

  // ─── Results export (JSON) ────────────────────────────────────
  describe('Results export', () => {
    it('should export diagnosis as JSON', async () => {
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Connection pool exhaustion under high traffic load',
      });
      const id = createRes.body.id;

      const exportRes = await request(server, 'GET', `/api/diagnose/${id}/export?format=json`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.body.id).toBe(id);
      expect(exportRes.body.result).toBeDefined();
    });

    it('should export diagnosis as CSV', async () => {
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Disk I/O bottleneck causing slow read operations',
      });
      const id = createRes.body.id;

      const exportRes = await request(server, 'GET', `/api/diagnose/${id}/export?format=csv`);
      expect(exportRes.status).toBe(200);
    });

    it('should reject invalid export format', async () => {
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Cache invalidation failure causing stale data',
      });
      const id = createRes.body.id;

      const exportRes = await request(server, 'GET', `/api/diagnose/${id}/export?format=xml`);
      expect(exportRes.status).toBe(400);
      expect(exportRes.body.error).toBe('invalid_format');
    });

    it('should return 404 for non-existent diagnosis export', async () => {
      const exportRes = await request(server, 'GET', '/api/diagnose/nonexistent/export');
      expect(exportRes.status).toBe(404);
    });
  });

  // ─── Error recovery ───────────────────────────────────────────
  describe('Error recovery (clear error, try again)', () => {
    it('should allow retry after validation error', async () => {
      // First attempt: invalid
      const badRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'short',
      });
      expect(badRes.status).toBe(400);

      // Second attempt: valid
      const goodRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Database connection pool exhausted after traffic spike',
      });
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.result).toBeDefined();
    });

    it('should return 404 for non-existent diagnosis retrieval', async () => {
      const res = await request(server, 'GET', '/api/diagnose/nonexistent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });
  });

  // ─── Batch diagnosis ──────────────────────────────────────────
  describe('Batch diagnosis workflow', () => {
    it('should process multiple incidents in batch', async () => {
      const res = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: [
          'Database query timeout in production after deploy',
          'Memory leak in worker process consuming 8GB RAM',
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.batchId).toBeDefined();
      expect(res.body.results).toHaveLength(2);
      expect(res.body.results[0].result).toBeDefined();
      expect(res.body.results[1].result).toBeDefined();
    });

    it('should reject empty batch', async () => {
      const res = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: [],
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_batch');
    });

    it('should reject batch exceeding 100 items', async () => {
      const res = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: Array(101).fill('Valid incident description for batch test'),
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('batch_too_large');
    });

    it('should skip invalid incidents in batch silently', async () => {
      const res = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: [
          'Valid incident description for testing purposes',
          'short', // too short, should be skipped
          'Another valid incident description for batch',
        ],
      });

      expect(res.status).toBe(200);
      // Only 2 valid incidents should be processed
      expect(res.body.results).toHaveLength(2);
    });
  });

  // ─── Diagnostics listing ──────────────────────────────────────
  describe('Diagnostics listing and pagination', () => {
    it('should list diagnostics with pagination', async () => {
      const res = await request(server, 'GET', '/api/diagnostics?page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
      expect(res.body.items).toBeInstanceOf(Array);
    });

    it('should cap limit at 100', async () => {
      const res = await request(server, 'GET', '/api/diagnostics?limit=999');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(100);
    });
  });

  // ─── Audit logging ────────────────────────────────────────────
  describe('Audit logging', () => {
    it('should record diagnosis creation in audit log', async () => {
      await request(server, 'POST', '/api/diagnose', {
        incident: 'Audit test: service degradation observed in metrics',
      });

      const auditRes = await request(server, 'GET', '/api/audit-log');
      expect(auditRes.status).toBe(200);
      expect(auditRes.body.events).toBeInstanceOf(Array);
      expect(auditRes.body.totalEvents).toBeGreaterThan(0);

      const createEvents = auditRes.body.events.filter(
        (e) => e.action === 'diagnose_created'
      );
      expect(createEvents.length).toBeGreaterThan(0);
    });

    it('should record diagnosis retrieval in audit log', async () => {
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Audit retrieval test: checking event logging flow',
      });
      const id = createRes.body.id;

      await request(server, 'GET', `/api/diagnose/${id}`);

      const auditRes = await request(server, 'GET', '/api/audit-log');
      const retrieveEvents = auditRes.body.events.filter(
        (e) => e.action === 'diagnose_retrieved' && e.details.id === id
      );
      expect(retrieveEvents.length).toBeGreaterThan(0);
    });
  });

  // ─── Health check ─────────────────────────────────────────────
  describe('Health check', () => {
    it('should return healthy status', async () => {
      const res = await request(server, 'GET', '/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.uptime).toBeGreaterThan(0);
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ─── Analytics ────────────────────────────────────────────────
  describe('Analytics endpoint', () => {
    it('should return analytics data', async () => {
      const res = await request(server, 'GET', '/api/analytics');

      expect(res.status).toBe(200);
      expect(typeof res.body.totalDiagnoses).toBe('number');
      expect(typeof res.body.averageConfidence).toBe('number');
      expect(typeof res.body.successRate).toBe('number');
    });
  });

  // ─── Dashboard ────────────────────────────────────────────────
  describe('Dashboard endpoint', () => {
    it('should return dashboard overview', async () => {
      const res = await request(server, 'GET', '/api/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
      expect(res.body.overview.totalDiagnoses).toBeDefined();
      expect(res.body.overview.successRate).toBeDefined();
    });
  });

  // ─── 404 handling ─────────────────────────────────────────────
  describe('404 handling', () => {
    it('should return 404 with available endpoints for unknown routes', async () => {
      const res = await request(server, 'GET', '/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
      expect(res.body.availableEndpoints).toBeInstanceOf(Array);
      expect(res.body.availableEndpoints.length).toBeGreaterThan(0);
    });
  });

  // ─── Webhook management ───────────────────────────────────────
  describe('Webhook management', () => {
    it('should register a webhook', async () => {
      const res = await request(server, 'POST', '/api/webhooks', {
        url: 'https://example.com/webhook',
      });

      expect(res.status).toBe(200);
      expect(res.body.webhookId).toBeDefined();
      expect(res.body.url).toBe('https://example.com/webhook');
    });

    it('should reject webhook without URL', async () => {
      const res = await request(server, 'POST', '/api/webhooks', {});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('missing_url');
    });
  });
});
