#!/usr/bin/env node
/**
 * Basic load test: 20 concurrent POST /api/diagnose requests.
 * Run with: node scripts/load-test.js
 * Requires server running: npm start
 */

const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function runLoadTest() {
  const concurrency = 20;
  const incident = 'Load test: Production database connection pool exhausted after peak traffic.';

  const start = Date.now();
  const promises = Array.from({ length: concurrency }, (_, i) =>
    fetch(`${BASE}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident: `${incident} (request ${i + 1})`,
      }),
    })
  );

  const results = await Promise.allSettled(promises);
  const elapsed = Date.now() - start;

  const ok = results.filter((r) => r.status === 'fulfilled' && r.value?.ok).length;
  const err = results.length - ok;

  console.log(`Load test: ${concurrency} concurrent requests in ${elapsed}ms`);
  console.log(`  OK: ${ok} | Failed: ${err}`);
  console.log(`  Throughput: ${(ok / (elapsed / 1000)).toFixed(1)} req/s`);
  process.exit(err > 0 ? 1 : 0);
}

runLoadTest().catch((e) => {
  console.error('Load test failed:', e.message);
  process.exit(1);
});
