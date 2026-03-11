#!/usr/bin/env node
/**
 * Update README.md Project 1.0.0 status section from FRONTEND_TASK_BREAKDOWN.csv.
 * Run: node scripts/update-readme-status.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const csvPath = path.join(root, 'FRONTEND_TASK_BREAKDOWN.csv');
const readmePath = path.join(root, 'README.md');

let pending = 0;
let total = 0;
try {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.trim().split('\n').slice(1);
  total = lines.length;
  pending = lines.filter(l => l.includes(',pending,')).length;
} catch (e) {
  console.error('Could not read CSV:', e.message);
  process.exit(1);
}

const done = total - pending;
const pct = total > 0 ? Math.round((done / total) * 100) : 100;
const barLen = 20;
const filled = Math.round((pct / 100) * barLen);
const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

const statusSection = `## Project 1.0.0 Status

| Area | Progress | Status |
|------|----------|--------|
| **Core** (4-agent, API, webhooks) | 100% | ✅ Shipped in v1.0.1 |
| **Premium UI roadmap** | ${pct}% | [${bar}] |
| | | ${done}/${total} tasks done, ${pending} pending |

**Source:** [FRONTEND_TASK_BREAKDOWN.csv](FRONTEND_TASK_BREAKDOWN.csv) · **Milestones:** [.github/PROJECT_1.0.0_CHECKPOINTS.md](.github/PROJECT_1.0.0_CHECKPOINTS.md)

**What's left:** Design tokens (DT), motion utilities (MU), style factory (SF), React migration (RC/RI/CM), loading/error states (LS/ES), dark theme, final checklist.`;

const readme = fs.readFileSync(readmePath, 'utf8');
const startMarker = '## Project 1.0.0 Status';
const endMarker = '**What\'s left:**';
const sectionEnd = /---\s*\n\n## /;

let newReadme;
const startIdx = readme.indexOf(startMarker);
if (startIdx >= 0) {
  const afterSection = readme.indexOf('\n## ', startIdx + 1);
  const endIdx = afterSection >= 0 ? afterSection : readme.length;
  const before = readme.slice(0, startIdx);
  const after = readme.slice(endIdx);
  newReadme = before + statusSection + '\n\n---\n\n' + after.replace(/^## /, '## ');
} else {
  const insertPoint = readme.indexOf('## Quick Start');
  if (insertPoint >= 0) {
    newReadme = readme.slice(0, insertPoint) + statusSection + '\n\n---\n\n' + readme.slice(insertPoint);
  } else {
    newReadme = readme + '\n\n' + statusSection + '\n';
  }
}

fs.writeFileSync(readmePath, newReadme);
console.log(`Updated README: ${pct}% (${done}/${total} done)`);
