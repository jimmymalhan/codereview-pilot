#!/usr/bin/env node
/**
 * capture-screenshots.js
 * Capture screenshots of Claude Debug Copilot demo
 * Usage: node demo/scripts/capture-screenshots.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_DIR = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(DEMO_DIR, 'assets/screenshots');
const OUTPUT_DIR = path.join(DEMO_DIR, 'output');

// Create directories
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const SCENES = [
  {
    name: 'Scene 1: Homepage',
    delay: 0,
    duration: 3,
    frames: 3,
    action: async (page) => {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      await page.waitForSelector('input[placeholder*="incident"]', { timeout: 5000 });
    },
  },
  {
    name: 'Scene 2: Submit Incident',
    delay: 3,
    duration: 4,
    frames: 4,
    action: async (page) => {
      const incident =
        'Database connection pool exhaustion after deploy. Response times increased 5x. Errors: Connection timeout waiting for available connection occurring every 30 seconds in production.';
      await page.focus('input[placeholder*="incident"]');
      await page.keyboard.type(incident, { delay: 10 });
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'Scene 3: Click Diagnose',
    delay: 7,
    duration: 5,
    frames: 5,
    action: async (page) => {
      await page.click('button:has-text("Diagnose")');
      await page.waitForSelector('.results-container', { timeout: 60000 });
    },
  },
  {
    name: 'Scene 4: Results Display',
    delay: 12,
    duration: 3,
    frames: 3,
    action: async (page) => {
      // Scroll to show confidence score
      await page.evaluate(() => {
        const resultsContainer = document.querySelector('.results-container');
        if (resultsContainer) {
          resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
      await page.waitForTimeout(500);
    },
  },
];

async function captureScreenshots() {
  let browser;
  try {
    console.log('🎬 Starting screenshot capture...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    let frameCount = 0;

    for (const scene of SCENES) {
      console.log(`\n📸 ${scene.name}`);
      console.log(`   Duration: ${scene.duration}s (${scene.frames} frames)`);

      try {
        await scene.action(page);
      } catch (err) {
        console.warn(`   ⚠️  Action warning: ${err.message}`);
      }

      // Capture frames for this scene
      for (let i = 0; i < scene.frames; i++) {
        const frameNum = String(frameCount).padStart(4, '0');
        const filename = path.join(SCREENSHOTS_DIR, `frame-${frameNum}.png`);

        await page.screenshot({ path: filename });
        console.log(`   ✅ Captured frame ${frameCount + 1}/${30} → frame-${frameNum}.png`);

        frameCount++;

        if (i < scene.frames - 1) {
          await page.waitForTimeout(500); // 500ms between frames
        }
      }
    }

    console.log(`\n✅ Screenshot capture complete!`);
    console.log(`   Total frames: ${frameCount}`);
    console.log(`   Directory: ${SCREENSHOTS_DIR}`);
    console.log(`\nNext step: Convert screenshots to video with ffmpeg`);

    await browser.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

captureScreenshots();
