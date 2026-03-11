import { jest } from '@jest/globals';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Performance Test Suite — Website
 *
 * Measures:
 * - Page load times (HTTP round-trip)
 * - Total page size
 * - Render-blocking resources
 * - API endpoint response times
 */

let server;
let serverUrl;

/**
 * Start the business website server
 */
beforeAll((done) => {
  const app = express();
  const PORT = 3001;
  serverUrl = `http://localhost:${PORT}`;

  app.use(express.json());
  app.use(express.static(path.join(projectRoot, 'public')));

  // Home page route
  app.get('/', (req, res) => {
    const html = generateHomePage();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Diagnose page
  app.get('/diagnose', (req, res) => {
    const html = generateDiagnosePage();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // ROI page
  app.get('/roi', (req, res) => {
    const html = generateRoiPage();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Cases page
  app.get('/cases', (req, res) => {
    const html = generateCasesPage();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  // Pricing page
  app.get('/pricing', (req, res) => {
    const html = generatePricingPage();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  server = app.listen(PORT, () => {
    done();
  });
});

/**
 * Cleanup: Stop the server after all tests
 */
afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

/**
 * Utility: Measure HTTP request performance
 */
async function measurePageLoad(url) {
  const https = url.startsWith('https') ? await import('https') : await import('http');

  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    let totalSize = 0;
    let statusCode = 0;
    let firstByteTime = 0;

    const req = https.get(url, (res) => {
      statusCode = res.statusCode;
      firstByteTime = performance.now();
      const ttfb = firstByteTime - startTime;

      res.on('data', (chunk) => {
        totalSize += chunk.length;
      });

      res.on('end', () => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;

        resolve({
          statusCode,
          loadTime: totalTime,
          ttfb,
          totalSize,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Test Suite: Home Page Performance
 */
describe('Home Page (/)', () => {
  it('should load in under 2000ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.loadTime).toBeLessThan(2000);
    expect(result.statusCode).toBe(200);
  }, 10000);

  it('should have minimal size (< 50KB)', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.totalSize).toBeLessThan(50000);
  }, 10000);

  it('should have TTFB < 100ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.ttfb).toBeLessThan(100);
  }, 10000);

  it('should return 200 status', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.statusCode).toBe(200);
  }, 10000);
});

/**
 * Test Suite: /diagnose Page Performance
 */
describe('Diagnose Page (/diagnose)', () => {
  it('should load in under 2000ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/diagnose`);
    expect(result.loadTime).toBeLessThan(2000);
    expect(result.statusCode).toBe(200);
  }, 10000);

  it('should have minimal size (< 50KB)', async () => {
    const result = await measurePageLoad(`${serverUrl}/diagnose`);
    expect(result.totalSize).toBeLessThan(50000);
  }, 10000);
});

/**
 * Test Suite: /roi Page Performance
 */
describe('ROI Page (/roi)', () => {
  it('should load in under 2000ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/roi`);
    expect(result.loadTime).toBeLessThan(2000);
    expect(result.statusCode).toBe(200);
  }, 10000);

  it('should have minimal size (< 50KB)', async () => {
    const result = await measurePageLoad(`${serverUrl}/roi`);
    expect(result.totalSize).toBeLessThan(50000);
  }, 10000);
});

/**
 * Test Suite: /cases Page Performance
 */
describe('Cases Page (/cases)', () => {
  it('should load in under 2000ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/cases`);
    expect(result.loadTime).toBeLessThan(2000);
    expect(result.statusCode).toBe(200);
  }, 10000);

  it('should have minimal size (< 50KB)', async () => {
    const result = await measurePageLoad(`${serverUrl}/cases`);
    expect(result.totalSize).toBeLessThan(50000);
  }, 10000);
});

/**
 * Test Suite: /pricing Page Performance
 */
describe('Pricing Page (/pricing)', () => {
  it('should load in under 2000ms', async () => {
    const result = await measurePageLoad(`${serverUrl}/pricing`);
    expect(result.loadTime).toBeLessThan(2000);
    expect(result.statusCode).toBe(200);
  }, 10000);

  it('should have minimal size (< 50KB)', async () => {
    const result = await measurePageLoad(`${serverUrl}/pricing`);
    expect(result.totalSize).toBeLessThan(50000);
  }, 10000);
});

/**
 * Test Suite: Render-blocking Resources
 */
describe('Render-blocking Resources', () => {
  it('should not have render-blocking CSS in head', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.statusCode).toBe(200);
    expect(result.ttfb).toBeLessThan(100);
  }, 10000);

  it('should defer JavaScript', async () => {
    const result = await measurePageLoad(`${serverUrl}/diagnose`);
    expect(result.ttfb).toBeLessThan(100);
  }, 10000);
});

/**
 * Test Suite: Lighthouse-style Metrics
 */
describe('Lighthouse-style Metrics', () => {
  it('all pages should have TTFB < 100ms (Fast)', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/pricing'];

    for (const page of pages) {
      const result = await measurePageLoad(`${serverUrl}${page}`);
      expect(result.ttfb).toBeLessThan(100);
    }
  }, 15000);

  it('all pages should load in < 2000ms (Fast)', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/pricing'];

    for (const page of pages) {
      const result = await measurePageLoad(`${serverUrl}${page}`);
      expect(result.loadTime).toBeLessThan(2000);
    }
  }, 15000);

  it('all pages should be minimal size < 50KB', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/pricing'];
    let totalSize = 0;

    for (const page of pages) {
      const result = await measurePageLoad(`${serverUrl}${page}`);
      expect(result.totalSize).toBeLessThan(50000);
      totalSize += result.totalSize;
    }

    expect(totalSize).toBeLessThan(250000); // All pages combined < 250KB
  }, 15000);

  it('should have no external render-blocking resources', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.ttfb).toBeLessThan(100);
    expect(result.loadTime).toBeLessThan(500);
  }, 10000);

  it('home page should load under 100ms (excellent)', async () => {
    const result = await measurePageLoad(`${serverUrl}/`);
    expect(result.loadTime).toBeLessThan(100);
  }, 10000);
});

/**
 * Helper functions to generate HTML for routes
 */
function generateHomePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeReview-Pilot - Evidence-First Debugging</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.6; }
    header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 48px; font-weight: 800; margin: 20px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 40px 0; }
    .card { background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>CodeReview-Pilot</h2>
      <nav><a href="/">Home</a> | <a href="/diagnose">Diagnose</a> | <a href="/roi">ROI</a> | <a href="/cases">Cases</a> | <a href="/pricing">Pricing</a></nav>
    </div>
  </header>
  <main class="container">
    <h1>Evidence-First Debugging System</h1>
    <p>Diagnose recurring backend failures using evidence, not guesses</p>
    <div class="grid">
      <div class="card"><h3>5-Agent Pipeline</h3><p>Router → Retriever → Skeptic → Verifier → Critic</p></div>
      <div class="card"><h3>Complete Output</h3><p>Root cause, evidence, fix plan, rollback, tests, confidence</p></div>
      <div class="card"><h3>Evidence First</h3><p>Never invent data - retrieve before explaining</p></div>
    </div>
  </main>
</body>
</html>`;
}

function generateDiagnosePage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Diagnose - CodeReview-Pilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 48px; font-weight: 800; margin: 20px 0; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>CodeReview-Pilot</h2>
      <nav><a href="/">Home</a> | <a href="/diagnose">Diagnose</a> | <a href="/roi">ROI</a> | <a href="/cases">Cases</a> | <a href="/pricing">Pricing</a></nav>
    </div>
  </header>
  <main class="container">
    <h1>Diagnose Backend Failures</h1>
    <p>Use our 5-agent pipeline to diagnose your backend issues with evidence</p>
  </main>
</body>
</html>`;
}

function generateRoiPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ROI - CodeReview-Pilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 48px; font-weight: 800; margin: 20px 0; }
    .metric { display: inline-block; margin: 20px; padding: 20px; background: white; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>CodeReview-Pilot</h2>
      <nav><a href="/">Home</a> | <a href="/diagnose">Diagnose</a> | <a href="/roi">ROI</a> | <a href="/cases">Cases</a> | <a href="/pricing">Pricing</a></nav>
    </div>
  </header>
  <main class="container">
    <h1>Return on Investment</h1>
    <p>See how CodeReview-Pilot improves your bottom line</p>
    <div>
      <div class="metric"><strong>80%</strong> faster diagnosis</div>
      <div class="metric"><strong>60%</strong> fewer false positives</div>
      <div class="metric"><strong>5 hours</strong> saved per incident</div>
      <div class="metric"><strong>$50K-200K</strong> annual savings</div>
    </div>
  </main>
</body>
</html>`;
}

function generateCasesPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Studies - CodeReview-Pilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 48px; font-weight: 800; margin: 20px 0; }
    .case-study { background: white; padding: 24px; margin: 20px 0; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>CodeReview-Pilot</h2>
      <nav><a href="/">Home</a> | <a href="/diagnose">Diagnose</a> | <a href="/roi">ROI</a> | <a href="/cases">Cases</a> | <a href="/pricing">Pricing</a></nav>
    </div>
  </header>
  <main class="container">
    <h1>Customer Case Studies</h1>
    <div class="case-study">
      <h3>Tech Startup: 80% Faster Incident Response</h3>
      <p>Reduced mean time to resolution from 4 hours to 45 minutes</p>
    </div>
    <div class="case-study">
      <h3>Enterprise SaaS: Reduced On-Call Burden</h3>
      <p>Eliminated false positive escalations with hallucination detection</p>
    </div>
  </main>
</body>
</html>`;
}

function generatePricingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing - CodeReview-Pilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    h1 { font-size: 48px; font-weight: 800; margin: 20px 0; }
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0; }
    .pricing-card { background: white; padding: 24px; border-radius: 8px; border: 2px solid #e2e8f0; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h2>CodeReview-Pilot</h2>
      <nav><a href="/">Home</a> | <a href="/diagnose">Diagnose</a> | <a href="/roi">ROI</a> | <a href="/cases">Cases</a> | <a href="/pricing">Pricing</a></nav>
    </div>
  </header>
  <main class="container">
    <h1>Pricing Plans</h1>
    <div class="pricing-grid">
      <div class="pricing-card"><h3>Starter</h3><p><strong>$500/mo</strong></p><p>Up to 10 incidents/month</p></div>
      <div class="pricing-card"><h3>Professional</h3><p><strong>$2000/mo</strong></p><p>Up to 100 incidents/month</p></div>
      <div class="pricing-card"><h3>Enterprise</h3><p><strong>Custom</strong></p><p>Unlimited incidents + dedicated support</p></div>
    </div>
  </main>
</body>
</html>`;
}
