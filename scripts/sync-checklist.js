#!/usr/bin/env node
// A small utility to sync completion status between PLAN_INTEGRATION_WEBSITE.md
// and IMPLEMENTATION_CHECKLIST.md.  It scans for tasks in the plan and marks
// matching checkboxes in the checklist, then recalculates the progress bars.
// Run `node scripts/sync-checklist.js` from project root.

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const planPath = path.join(root, 'PLAN_INTEGRATION_WEBSITE.md');
const checklistPath = path.join(root, 'IMPLEMENTATION_CHECKLIST.md');

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function write(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

let plan = read(planPath).split('\n');
let checklist = read(checklistPath).split('\n');

// collect all completed task lines from plan ("- [x] description")
const completed = new Set();
plan.forEach(line => {
  const m = line.match(/^- \[x\] *(.*)$/);
  if (m) completed.add(m[1].trim());
});

// update checklist lines: if tasks match, mark them done
checklist = checklist.map(line => {
  const m = line.match(/^(- \[.\] *)(.*)$/);
  if (m) {
    const prefix = m[1];
    const desc = m[2].trim();
    if (completed.has(desc)) {
      return prefix.replace('[ ]', '[x]') + desc;
    }
  }
  return line;
});

// recalc progress percentages
function recalc(lines) {
  let bucketStart = false;
  let total = 0,
      done = 0;
  const newLines = lines.map(l => {
    if (l.startsWith('## BUCKET')) {
      bucketStart = true;
      total = 0; done = 0;
      return l;
    }
    if (bucketStart) {
      const taskMatch = l.match(/^- \[(x| )\] /);
      if (taskMatch) {
        total++;
        if (taskMatch[1] === 'x') done++;
      }
    }
    // if we hit an empty line or separator after bucket, update the header
    if (bucketStart && l.trim() === '') {
      const percent = total === 0 ? 0 : Math.round((done/total)*1000)/10;
      bucketStart = false;
      return `\n**Progress:** ${percent}% (${done}/${total} tasks)\n`;
    }
    return l;
  });
  return newLines;
}

checklist = recalc(checklist);
write(checklistPath, checklist.join('\n'));
console.log('Checklist synced with plan; progress recalc complete.');
