#!/usr/bin/env node
/**
 * capture-app-ui.js
 * Capture Claude Debug Copilot UI interaction as screenshots
 * Then convert to video with audio
 */

import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_DIR = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(DEMO_DIR, 'assets/screenshots');
const OUTPUT_DIR = path.join(DEMO_DIR, 'output');

async function captureAppUI() {
  let browser;

  try {
    console.log('🎬 Capturing Claude Debug Copilot UI...\n');

    // Create screenshot directory
    fs.ensureDirSync(SCREENSHOTS_DIR);

    browser = await puppeteer.launch({
      headless: false,
      args: ['--start-maximized'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    let frameNumber = 0;
    const fps = 30;
    const frameDuration = 1000 / fps; // ~33ms per frame at 30fps

    async function captureFrame(label) {
      const filename = path.join(SCREENSHOTS_DIR, `frame-${String(frameNumber).padStart(4, '0')}.png`);
      await page.screenshot({ path: filename });
      console.log(`  Frame ${frameNumber}: ${label}`);
      frameNumber++;
    }

    // Scene 1: Homepage (2 seconds = ~60 frames)
    console.log('📍 Scene 1: Homepage');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    for (let i = 0; i < 60; i++) {
      await captureFrame('Homepage');
      await page.waitForTimeout(Math.floor(frameDuration));
    }

    // Scene 2: Focus input and start typing (4 seconds = ~120 frames)
    console.log('\n📍 Scene 2: Typing Incident');
    await page.click('input[placeholder*="incident"], textarea[placeholder*="incident"], input[type="text"]');
    await page.waitForTimeout(300);

    const incident = 'Database connection pool exhaustion after deploy. Response times increased 5x. Errors: Connection timeout waiting for available connection occurring every 30 seconds in production.';

    // Capture while typing
    for (let i = 0; i < incident.length && i < 120; i++) {
      await page.keyboard.type(incident[i], { delay: 30 });
      if (i % 10 === 0) await captureFrame(`Typing (${i}/${incident.length})`);
    }

    // Fill rest by typing faster
    if (incident.length > 120) {
      await page.keyboard.type(incident.slice(120), { delay: 5 });
    }

    // Capture final typing state
    for (let i = 0; i < 30; i++) {
      await captureFrame('Form filled');
      await page.waitForTimeout(Math.floor(frameDuration));
    }

    // Scene 3: Click Diagnose and wait for results (5 seconds = ~150 frames)
    console.log('\n📍 Scene 3: Running Diagnosis');

    // Find and click the diagnose button
    const buttons = await page.$$eval('button', els => els.map(e => ({ text: e.textContent, index: els.indexOf(e) })));
    console.log('  Available buttons:', buttons.map(b => b.text).join(', '));

    const diagnoseBtn = await page.$('button');
    if (diagnoseBtn) {
      await diagnoseBtn.click();
    }

    // Capture diagnosis progress
    for (let i = 0; i < 150; i++) {
      await captureFrame('Running diagnosis');
      await page.waitForTimeout(Math.floor(frameDuration));
    }

    // Scene 4: Show results (3 seconds = ~90 frames)
    console.log('\n📍 Scene 4: Results');

    try {
      await page.evaluate(() => {
        const resultsContainer = document.querySelector('[class*="results"], [class*="container"], .results, main');
        if (resultsContainer) {
          resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    } catch (e) {}

    for (let i = 0; i < 90; i++) {
      await captureFrame('Results visible');
      await page.waitForTimeout(Math.floor(frameDuration));
    }

    await browser.close();

    console.log(`\n✅ Captured ${frameNumber} frames (${(frameNumber / fps).toFixed(1)} seconds)`);
    console.log(`📁 Frames saved to: ${SCREENSHOTS_DIR}\n`);

    // Convert frames to video using ffmpeg
    console.log('🎬 Converting frames to MP4...');
    const videoPath = path.join(OUTPUT_DIR, 'raw-ui-recording.mp4');

    try {
      execSync(
        `ffmpeg -y -framerate ${fps} -i "${SCREENSHOTS_DIR}/frame-%04d.png" ` +
        `-c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p "${videoPath}"`,
        { stdio: 'inherit' }
      );

      console.log(`\n✅ Video created: ${videoPath}`);
      console.log(`📹 Resolution: 1920x1080, ${fps}fps, H.264\n`);
      console.log('Next: Run the assemble script to add audio');
      console.log('  bash demo/scripts/assemble-video.sh\n');

    } catch (error) {
      console.error('Error converting frames to video:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

captureAppUI();
