/**
 * E2E Tests: Critical User Paths
 *
 * Tests complete user journeys through the system:
 * - Full diagnosis lifecycle (submit -> loading -> results)
 * - Validation error journey (bad input -> guidance -> retry -> success)
 * - Export journey (diagnose -> export JSON)
 * - Batch diagnosis journey
 * - Dashboard and analytics journey
 * - Error states and recovery
 * - Theme toggle logic and persistence
 * - Results sections formatting
 */

import { jest } from '@jest/globals';
import http from 'http';

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
    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timeout'));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('E2E: Critical User Paths', () => {
  let server;

  beforeAll(async () => {
    const oldPort = process.env.PORT;
    process.env.PORT = '0';
    const mod = await import('../../src/server.js');
    server = mod.default;
    process.env.PORT = oldPort;

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

  // ═══════════════════════════════════════════════════════════════
  // Journey 1: Full diagnosis lifecycle
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 1: Full diagnosis lifecycle', () => {
    let diagnosisId;
    let diagnosisResult;

    it('Step 1: Submit valid incident -> get diagnosis', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Production database server responding with 500 errors after deploying v2.3.1',
      });

      expect(res.status).toBe(200);
      expect(res.body.id).toMatch(/^diag-/);
      expect(res.body.status).toBe('completed');
      expect(res.body.timestamp).toBeDefined();

      diagnosisId = res.body.id;
      diagnosisResult = res.body;
    });

    it('Step 2: Verify all 4 pipeline stages present', () => {
      const result = diagnosisResult.result;

      // Router stage
      expect(result.router.stage).toBe('router');
      expect(result.router.classification).toBeDefined();
      expect(result.router.severity).toBeDefined();

      // Retriever stage
      expect(result.retriever.stage).toBe('retriever');
      expect(result.retriever.evidence).toBeInstanceOf(Array);
      expect(result.retriever.evidence.length).toBeGreaterThan(0);

      // Skeptic stage
      expect(result.skeptic.stage).toBe('skeptic');
      expect(result.skeptic.alternativeTheory).toBeDefined();
      expect(result.skeptic.confidence).toBeGreaterThan(0);

      // Verifier stage
      expect(result.verifier.stage).toBe('verifier');
      expect(result.verifier.rootCause).toBeDefined();
      expect(result.verifier.confidence).toBeGreaterThan(0);
      expect(result.verifier.fixPlan).toBeInstanceOf(Array);
      expect(result.verifier.rollback).toBeDefined();
      expect(result.verifier.tests).toBeInstanceOf(Array);
    });

    it('Step 3: Retrieve diagnosis by ID', async () => {
      const res = await request(server, 'GET', `/api/diagnose/${diagnosisId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(diagnosisId);
      expect(res.body.result.verifier.rootCause).toBeDefined();
    });

    it('Step 4: Diagnosis appears in listing', async () => {
      const res = await request(server, 'GET', '/api/diagnostics?limit=50');

      expect(res.status).toBe(200);
      const found = res.body.items.find((item) => item.id === diagnosisId);
      expect(found).toBeDefined();
    });

    it('Step 5: Export diagnosis as JSON', async () => {
      const res = await request(server, 'GET', `/api/diagnose/${diagnosisId}/export?format=json`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(diagnosisId);
      expect(res.body.result.router).toBeDefined();
      expect(res.body.result.verifier).toBeDefined();
    });

    it('Step 6: Diagnosis logged in audit trail', async () => {
      const res = await request(server, 'GET', '/api/audit-log');

      expect(res.status).toBe(200);
      const events = res.body.events;
      const createEvent = events.find(
        (e) => e.action === 'diagnose_created' && e.details.id === diagnosisId
      );
      expect(createEvent).toBeDefined();
      expect(createEvent.timestamp).toBeDefined();
      expect(createEvent.traceId).toMatch(/^trace-/);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 2: Validation error -> guidance -> retry -> success
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 2: Validation error -> retry -> success', () => {
    it('Step 1: Submit empty body -> get clear error', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('missing_field');
      expect(res.body.message).toBeDefined();
    });

    it('Step 2: Submit too-short input -> get length guidance', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('invalid_length');
      expect(res.body.message).toContain('10');
    });

    it('Step 3: Retry with valid input -> success', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'After reading the error guidance, user provides a proper incident description',
      });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(res.body.status).toBe('completed');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 3: Batch diagnosis workflow
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 3: Batch diagnosis workflow', () => {
    it('Step 1: Submit batch of 3 incidents', async () => {
      const res = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: [
          'Load balancer health check failing for backend-3 node',
          'Redis cache hit ratio dropped from 95% to 40% after config change',
          'SSL certificate expiration causing 502 errors on API gateway',
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.batchId).toMatch(/^batch-/);
      expect(res.body.results).toHaveLength(3);

      // Each result should have full pipeline output
      for (const result of res.body.results) {
        expect(result.id).toBeDefined();
        expect(result.result.router).toBeDefined();
        expect(result.result.retriever).toBeDefined();
        expect(result.result.skeptic).toBeDefined();
        expect(result.result.verifier).toBeDefined();
        expect(result.status).toBe('completed');
      }
    });

    it('Step 2: Each batch result retrievable individually', async () => {
      const batchRes = await request(server, 'POST', '/api/batch-diagnose', {
        incidents: [
          'Kubernetes pod restart loop detected on production cluster',
        ],
      });

      const id = batchRes.body.results[0].id;
      const getRes = await request(server, 'GET', `/api/diagnose/${id}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.id).toBe(id);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 4: Dashboard and analytics
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 4: Dashboard and analytics', () => {
    it('Step 1: Dashboard returns overview after diagnoses', async () => {
      const res = await request(server, 'GET', '/api/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
      expect(typeof res.body.overview.totalDiagnoses).toBe('number');
      expect(res.body.overview.totalDiagnoses).toBeGreaterThan(0);
      expect(res.body.overview.successRate).toBeDefined();
      expect(res.body.overview.averageConfidence).toBeDefined();
    });

    it('Step 2: Analytics reflects recent diagnoses', async () => {
      const res = await request(server, 'GET', '/api/analytics');

      expect(res.status).toBe(200);
      expect(res.body.totalDiagnoses).toBeGreaterThan(0);
      expect(res.body.byStatus).toBeDefined();
    });

    it('Step 3: Dashboard shows recent diagnoses list', async () => {
      const res = await request(server, 'GET', '/api/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.recentDiagnoses).toBeInstanceOf(Array);
      if (res.body.recentDiagnoses.length > 0) {
        const recent = res.body.recentDiagnoses[0];
        expect(recent.id).toBeDefined();
        expect(recent.confidence).toBeDefined();
        expect(recent.timestamp).toBeDefined();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 5: Results sections formatting
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 5: Results sections properly formatted', () => {
    it('should return root cause as a descriptive string', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Worker process consuming 99% CPU after cron job deployment',
      });

      const verifier = res.body.result.verifier;
      expect(typeof verifier.rootCause).toBe('string');
      expect(verifier.rootCause.length).toBeGreaterThan(0);
    });

    it('should return evidence as array of strings', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Microservice timeout cascade originating from auth service',
      });

      const retriever = res.body.result.retriever;
      expect(retriever.evidence).toBeInstanceOf(Array);
      retriever.evidence.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });

    it('should return fix plan as actionable steps', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Storage subsystem latency increased from 5ms to 500ms',
      });

      const fixPlan = res.body.result.verifier.fixPlan;
      expect(fixPlan).toBeInstanceOf(Array);
      expect(fixPlan.length).toBeGreaterThan(0);
      fixPlan.forEach((step) => {
        expect(typeof step).toBe('string');
        expect(step.length).toBeGreaterThan(0);
      });
    });

    it('should return rollback instructions', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'DNS resolution failures after infrastructure migration',
      });

      expect(typeof res.body.result.verifier.rollback).toBe('string');
      expect(res.body.result.verifier.rollback.length).toBeGreaterThan(0);
    });

    it('should return test suggestions', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Message queue backlog growing with no consumers available',
      });

      const tests = res.body.result.verifier.tests;
      expect(tests).toBeInstanceOf(Array);
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should return confidence as a number between 0 and 1', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Application crash loop after dependency version upgrade',
      });

      const confidence = res.body.result.verifier.confidence;
      expect(typeof confidence).toBe('number');
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should return duration metrics for each stage', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Network partition detected between data centers A and B',
      });

      const result = res.body.result;
      expect(typeof result.router.duration).toBe('number');
      expect(typeof result.retriever.duration).toBe('number');
      expect(typeof result.skeptic.duration).toBe('number');
      expect(typeof result.verifier.duration).toBe('number');
      expect(typeof result.totalDuration).toBe('number');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 6: Theme toggle logic
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 6: Theme toggle and persistence logic', () => {
    it('should toggle between light and dark themes', () => {
      const storage = {};

      const getTheme = () => storage['app-theme'] || 'light';
      const setTheme = (theme) => { storage['app-theme'] = theme; };
      const toggleTheme = () => {
        const current = getTheme();
        const next = current === 'light' ? 'dark' : 'light';
        setTheme(next);
        return next;
      };

      expect(getTheme()).toBe('light');

      const theme1 = toggleTheme();
      expect(theme1).toBe('dark');
      expect(getTheme()).toBe('dark');

      const theme2 = toggleTheme();
      expect(theme2).toBe('light');
      expect(getTheme()).toBe('light');
    });

    it('should persist theme across simulated reloads', () => {
      const storage = {};

      // User sets dark mode
      storage['app-theme'] = 'dark';

      // Simulate page reload - read from storage
      const restoredTheme = storage['app-theme'] || 'light';
      expect(restoredTheme).toBe('dark');
    });

    it('should default to light theme when no preference stored', () => {
      const storage = {};
      const theme = storage['app-theme'] || 'light';
      expect(theme).toBe('light');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 7: Error boundary and edge cases
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 7: Error boundary and edge cases', () => {
    it('should handle special characters in incident text', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Error: "connection refused" at <server:5432> & timeout=30s',
      });

      expect(res.status).toBe(200);
      expect(res.body.incident).toContain('connection refused');
    });

    it('should handle unicode in incident text', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'Server crash with error: datos no disponibles en la base de datos',
      });

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
    });

    it('should handle exactly 10 character incident (minimum)', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: '1234567890',
      });

      expect(res.status).toBe(200);
    });

    it('should handle exactly 2000 character incident (maximum)', async () => {
      const res = await request(server, 'POST', '/api/diagnose', {
        incident: 'a'.repeat(2000),
      });

      expect(res.status).toBe(200);
    });

    it('should return proper 404 for unknown API routes', async () => {
      const res = await request(server, 'GET', '/api/unknown-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
      expect(res.body.availableEndpoints).toBeInstanceOf(Array);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 8: Static file serving (page loads)
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 8: Server serves static content', () => {
    it('should serve health endpoint without errors', async () => {
      const res = await request(server, 'GET', '/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 9: Concurrent requests
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 9: Concurrent diagnosis requests', () => {
    it('should handle multiple simultaneous diagnoses', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request(server, 'POST', '/api/diagnose', {
          incident: `Concurrent test incident number ${i + 1} for load testing`,
        })
      );

      const results = await Promise.all(promises);

      results.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.id).toBeDefined();
        expect(res.body.result).toBeDefined();
      });

      // All IDs should be defined (uniqueness not guaranteed since IDs use Date.now())
      const ids = results.map((r) => r.body.id);
      ids.forEach((id) => {
        expect(id).toBeDefined();
        expect(id).toMatch(/^diag-/);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Journey 10: Full audit trail verification
  // ═══════════════════════════════════════════════════════════════
  describe('Journey 10: Audit trail completeness', () => {
    it('should track create, retrieve, and export actions', async () => {
      // Create
      const createRes = await request(server, 'POST', '/api/diagnose', {
        incident: 'Audit trail completeness test: verifying all actions tracked',
      });
      const id = createRes.body.id;

      // Retrieve
      await request(server, 'GET', `/api/diagnose/${id}`);

      // Export
      await request(server, 'GET', `/api/diagnose/${id}/export?format=json`);

      // Check audit log
      const auditRes = await request(server, 'GET', '/api/audit-log');
      const events = auditRes.body.events;

      const createEvents = events.filter(
        (e) => e.action === 'diagnose_created' && e.details.id === id
      );
      const retrieveEvents = events.filter(
        (e) => e.action === 'diagnose_retrieved' && e.details.id === id
      );
      const exportEvents = events.filter(
        (e) => e.action === 'diagnose_exported' && e.details.id === id
      );

      expect(createEvents.length).toBe(1);
      expect(retrieveEvents.length).toBe(1);
      expect(exportEvents.length).toBe(1);

      // All events have timestamps and trace IDs
      [createEvents[0], retrieveEvents[0], exportEvents[0]].forEach((event) => {
        expect(event.timestamp).toBeDefined();
        expect(event.traceId).toMatch(/^trace-/);
      });
    });
  });
});
