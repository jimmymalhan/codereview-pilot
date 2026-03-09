#!/usr/bin/env node

/**
 * Claude Debug Copilot - Screen Recording Automation
 *
 * Automates the browser interactions for recording the 15-second demo.
 * Uses Puppeteer to drive Chrome with precise timing matched to script.md.
 *
 * Usage:
 *   node demo/scripts/record-demo.js [--headless] [--slow]
 *
 * Prerequisites:
 *   npm install puppeteer --save-dev  (run from project root)
 *   npm start                         (server must be running on :3000)
 *
 * What this does:
 *   1. Opens Chrome at 1920x1080 (recording viewport)
 *   2. Navigates to localhost:3000
 *   3. Types an incident into the form with realistic keystroke timing
 *   4. Clicks Diagnose and waits for pipeline completion
 *   5. Scrolls to show results
 *   6. Takes screenshots at each scene checkpoint
 *
 * Screen recording is handled externally (OBS/ScreenFlow) - this script
 * only automates the browser interactions so recordings are repeatable.
 */

import puppeteer from 'puppeteer';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIG = {
  url: 'http://localhost:3000',
  viewport: { width: 1920, height: 1080 },
  incident: 'Orders API returning 500 errors after deployment. Error rate jumped from 0.1% to 45% at 14:32 UTC.',
  typingDelay: 45,          // ms between keystrokes (natural speed)
  screenshotDir: new URL('../../demo/output/', import.meta.url).pathname,
  slowMode: process.argv.includes('--slow'),
  headless: process.argv.includes('--headless'),
};

// Timing checkpoints aligned with demo/script.md
const CHECKPOINTS = {
  scene1_start:    0,       // 0:00 - Title visible
  scene1_end:      3000,    // 0:03
  scene2_start:    3000,    // 0:03 - Begin typing
  scene2_click:    6000,    // 0:06 - Click Diagnose
  scene2_end:      7000,    // 0:07
  scene3_start:    7000,    // 0:07 - Pipeline running
  scene3_end:      12000,   // 0:12
  scene4_start:    12000,   // 0:12 - Results visible
  scene4_end:      15000,   // 0:15 - Final frame
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp() {
  return new Date().toISOString().slice(11, 23);
}

function log(scene, message) {
  console.log(`[${timestamp()}] [${scene}] ${message}`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  const path = `${CONFIG.screenshotDir}${name}.png`;
  await page.screenshot({ path, fullPage: false });
  log('CAPTURE', `Screenshot saved: ${path}`);
}

// ---------------------------------------------------------------------------
// Scene Runners
// ---------------------------------------------------------------------------

async function scene1_title(page) {
  log('SCENE-1', 'Title / Intro (0:00 - 0:03)');

  // Page should already be loaded at localhost:3000
  // Ensure we are on the Diagnose tab
  await page.waitForSelector('#diagnose.page.active', { timeout: 5000 });
  log('SCENE-1', 'Landing page visible');

  await screenshot(page, '01-title');

  // Hold for scene duration
  await wait(CHECKPOINTS.scene1_end - CHECKPOINTS.scene1_start);
  log('SCENE-1', 'Complete');
}

async function scene2_submit(page) {
  log('SCENE-2', 'Submit Incident (0:03 - 0:07)');

  // Focus textarea
  const textarea = await page.waitForSelector('#incident', { timeout: 5000 });
  await textarea.click();
  log('SCENE-2', 'Textarea focused');

  // Type incident with natural keystroke delay
  await textarea.type(CONFIG.incident, { delay: CONFIG.typingDelay });
  log('SCENE-2', 'Incident typed');

  await screenshot(page, '02-incident-typed');

  // Brief pause before clicking (natural feel)
  await wait(400);

  // Click the Diagnose button
  const submitBtn = await page.waitForSelector('#submitBtn', { timeout: 5000 });
  await submitBtn.click();
  log('SCENE-2', 'Diagnose button clicked');

  await screenshot(page, '03-diagnose-clicked');

  // Wait for loading state to appear
  await page.waitForSelector('.spinner', { timeout: 5000 }).catch(() => {
    log('SCENE-2', 'Warning: spinner not detected (may have completed fast)');
  });

  log('SCENE-2', 'Complete');
}

async function scene3_pipeline(page) {
  log('SCENE-3', 'Pipeline Running (0:07 - 0:12)');

  await screenshot(page, '04-pipeline-running');

  // Wait for results panel to appear (pipeline completion)
  // The real pipeline takes 16-24 seconds; we wait up to 90 seconds
  log('SCENE-3', 'Waiting for pipeline to complete...');

  await page.waitForFunction(
    () => {
      const panel = document.getElementById('resultsPanel');
      return panel && panel.style.display !== 'none';
    },
    { timeout: 90000 }
  );

  log('SCENE-3', 'Pipeline complete - results panel visible');
  await screenshot(page, '05-pipeline-complete');

  log('SCENE-3', 'Complete');
}

async function scene4_results(page) {
  log('SCENE-4', 'Results (0:12 - 0:15)');

  // Scroll results into view
  await page.evaluate(() => {
    const panel = document.getElementById('resultsPanel');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await wait(800);

  await screenshot(page, '06-results-visible');

  // Scroll to verifier output (final diagnosis with confidence)
  await page.evaluate(() => {
    const verifier = document.getElementById('verifierOutput');
    if (verifier) verifier.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await wait(800);

  await screenshot(page, '07-verifier-confidence');

  // Scroll to orchestration panel
  await page.evaluate(() => {
    const orch = document.getElementById('orchestrationPanel');
    if (orch) orch.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  await wait(800);

  await screenshot(page, '08-orchestration');

  // Hold final frame
  await wait(2000);
  await screenshot(page, '09-final-frame');

  log('SCENE-4', 'Complete');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('Claude Debug Copilot - Demo Recording Automation');
  console.log('='.repeat(60));
  console.log(`Viewport:  ${CONFIG.viewport.width}x${CONFIG.viewport.height}`);
  console.log(`Headless:  ${CONFIG.headless}`);
  console.log(`Slow mode: ${CONFIG.slowMode}`);
  console.log(`Target:    ${CONFIG.url}`);
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: CONFIG.headless,
    defaultViewport: CONFIG.viewport,
    args: [
      `--window-size=${CONFIG.viewport.width},${CONFIG.viewport.height}`,
      '--disable-infobars',
      '--no-first-run',
    ],
  });

  const page = await browser.newPage();

  try {
    // Navigate to app
    log('SETUP', `Loading ${CONFIG.url}`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: 10000 });
    log('SETUP', 'Page loaded');

    // Small settling delay
    await wait(500);

    // Run scenes
    const startTime = Date.now();

    await scene1_title(page);
    await scene2_submit(page);
    await scene3_pipeline(page);
    await scene4_results(page);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('='.repeat(60));
    console.log(`Demo automation complete in ${elapsed}s`);
    console.log(`Screenshots saved to: ${CONFIG.screenshotDir}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Demo automation failed:', error.message);
    await screenshot(page, 'error-state').catch(() => {});
    process.exitCode = 1;
  } finally {
    if (!CONFIG.slowMode) {
      await browser.close();
    } else {
      log('SLOW', 'Browser left open for inspection. Close manually or Ctrl+C.');
      // Keep process alive
      await new Promise(() => {});
    }
  }
}

main();
