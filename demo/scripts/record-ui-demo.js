#!/usr/bin/env node
/**
 * record-ui-demo.js
 * Record Claude Debug Copilot UI interaction for demo video
 * This script:
 * 1. Launches browser and navigates to localhost:3000
 * 2. Coordinates with screencapture to record the UI
 * 3. Performs the demo sequence (submit incident, view results)
 * 4. Outputs: raw-ui-recording.mp4
 *
 * Usage: node demo/scripts/record-ui-demo.js
 *
 * Prerequisites:
 * - App running at http://localhost:3000
 * - ffmpeg installed
 * - Puppeteer installed (npm install puppeteer)
 */

import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(DEMO_DIR, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'raw-ui-recording.mp4');

console.log('🎬 Claude Debug Copilot UI Recording');
console.log('====================================\n');

async function recordUIDemo() {
  let browser;

  try {
    // Start screencapture in background
    console.log('📹 Starting screen capture...');
    const captureProcess = execSync(
      `screencapture -V -x "${OUTPUT_FILE}" &`,
      { shell: true, stdio: 'pipe' }
    );

    // Wait for capture to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser so we can see it being recorded
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('🏠 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Scene 1: Homepage (3 seconds)
    console.log('\n📸 Scene 1: Homepage (3s)');
    await page.waitForSelector('input[placeholder*="incident"]', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Scene 2: Submit Incident (4 seconds)
    console.log('📸 Scene 2: Submit Incident (4s)');
    const incident =
      'Database connection pool exhaustion after deploy. Response times increased 5x. ' +
      'Errors: "Connection timeout waiting for available connection" occurring every 30 seconds in production.';

    await page.focus('input[placeholder*="incident"]');
    await page.keyboard.type(incident, { delay: 15 }); // Slower typing for demo
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scene 3: Click Diagnose and wait for results (5 seconds)
    console.log('📸 Scene 3: Running Diagnosis (5s)');
    await page.click('button:has-text("Diagnose")');

    // Wait for pipeline to start showing results
    try {
      await page.waitForSelector('.results-container', { timeout: 30000 });
      console.log('✅ Pipeline results loaded');
    } catch (err) {
      console.warn('⚠️  Results not loaded, continuing anyway...');
    }

    // Scene 4: Show Results (5 seconds)
    console.log('📸 Scene 4: Results Display (5s)');

    // Scroll to show confidence score
    await page.evaluate(() => {
      const resultsContainer = document.querySelector('.results-container');
      if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scene 5: Orchestration Panel (3 seconds)
    console.log('📸 Scene 5: Orchestration Panel (3s)');
    await page.evaluate(() => {
      const orchestrationPanel = document.querySelector('[class*="orchestration"], [class*="panel"], [class*="info"]');
      if (orchestrationPanel) {
        orchestrationPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Total recording time: 20 seconds (matches audio duration)
    console.log('\n✅ Recording complete (20s)');
    console.log(`📁 Output: ${OUTPUT_FILE}`);

    await browser.close();

    // Stop screencapture
    console.log('⏹️  Stopping screen capture...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    execSync('killall screencapture 2>/dev/null || true', { stdio: 'pipe' });

    console.log('\n🎬 UI recording ready!');
    console.log('Next: Assemble with audio using assemble-video.sh');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
    execSync('killall screencapture 2>/dev/null || true', { stdio: 'pipe' });
    process.exit(1);
  }
}

recordUIDemo();
