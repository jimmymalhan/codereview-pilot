#!/usr/bin/env node
/**
 * FC-007: Run Lighthouse against localhost, write score to .claude/local/lighthouse-score.json
 * Exit 0 if performance ≥ 90, else 1.
 * Usage: Ensure server is running (npm start), then: node scripts/run-lighthouse.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outputPath = path.join(root, '.claude/local/lighthouse-score.json');
const jsonPath = path.join(root, '.claude/local/lighthouse-report.json');
const url = process.env.LIGHTHOUSE_URL || 'http://localhost:3000';

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const res = spawnSync('npx', [
  'lighthouse', url,
  '--output=json',
  '--output-path=' + jsonPath,
  '--chrome-flags=--headless --no-sandbox',
  '--only-categories=performance,accessibility',
  '--quiet',
], { cwd: root, encoding: 'utf8' });

if (res.status !== 0) {
  console.error(res.stderr || res.stdout);
  process.exit(1);
}

let lhr;
try {
  lhr = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
} catch {
  console.error('Failed to read lighthouse report');
  process.exit(1);
}

const perf = lhr?.categories?.performance?.score != null
  ? Math.round(lhr.categories.performance.score * 100)
  : 0;
const a11y = lhr?.categories?.accessibility?.score != null
  ? Math.round(lhr.categories.accessibility.score * 100)
  : 0;

fs.writeFileSync(outputPath, JSON.stringify({
  performance: perf,
  accessibility: a11y,
  timestamp: new Date().toISOString(),
  url,
}, null, 2));

console.log(`Lighthouse: Performance ${perf}, Accessibility ${a11y}`);
process.exit(perf >= 90 ? 0 : 1);
