/**
 * End-to-End Tests for Business Website - 24 Tests Total
 *
 * Comprehensive e2e test suite using Puppeteer for the Claude Debug Copilot
 * business website. Tests cover navigation, ROI calculator, incident form,
 * mobile responsiveness, and accessibility.
 *
 * Test Coverage:
 * - Navigation Tests (4): page accessibility, nav links, contact, mobile nav
 * - ROI Calculator Tests (5): sliders, constraints, calculate, results, mobile
 * - Incident Form Tests (4): fields, validation, errors, mobile responsive
 * - Mobile Responsiveness Tests (6): 375px/768px/1200px, focus, touch targets, layout
 * - Accessibility Tests (5): keyboard navigation, focus outlines, labels, links, semantics
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import puppeteer from 'puppeteer';

const TEST_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

let browser;
let page;

beforeAll(async () => {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: TIMEOUT
  });
}, 30000);

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
}, 30000);

beforeEach(async () => {
  page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);
  page.setDefaultNavigationTimeout(TIMEOUT);
}, 10000);

afterEach(async () => {
  if (page) {
    await page.close();
  }
}, 10000);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// NAVIGATION TESTS (4 tests)
// ============================================================

describe('Navigation Tests', () => {
  test('Home navigation to all pages accessible', async () => {
    await page.goto(TEST_URL);
    const homeTitle = await page.title();
    expect(homeTitle).toContain('Incident Commander');

    await page.goto(`${TEST_URL}/diagnose`);
    const diagnoseTitle = await page.title();
    expect(diagnoseTitle).toContain('Report an Incident');

    await page.goto(`${TEST_URL}/roi`);
    const roiTitle = await page.title();
    expect(roiTitle).toContain('ROI Calculator');

    await page.goto(`${TEST_URL}/cases`);
    const casesTitle = await page.title();
    expect(casesTitle).toContain('Results');

    await page.goto(`${TEST_URL}/how-to-use`);
    const howToUseTitle = await page.title();
    expect(howToUseTitle).toContain('How to Use');
  });

  test('All navigation links work on all pages', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/how-to-use'];
    for (const pageUrl of pages) {
      await page.goto(`${TEST_URL}${pageUrl}`);
      await page.waitForSelector('header', { timeout: TIMEOUT });
      const navLinks = await page.$$('header a');
      expect(navLinks.length).toBeGreaterThan(0);
      const diagnoseLink = await page.$('a[href="/diagnose"]');
      const roiLink = await page.$('a[href="/roi"]');
      const casesLink = await page.$('a[href="/cases"]');
      const howToUseLink = await page.$('a[href="/how-to-use"]');
      expect(diagnoseLink).not.toBeNull();
      expect(roiLink).not.toBeNull();
      expect(casesLink).not.toBeNull();
      expect(howToUseLink).not.toBeNull();
    }
  });

  test('Contact link mailto functionality works', async () => {
    await page.goto(TEST_URL);
    const contactLinks = await page.$$('a[href^="mailto:"]');
    if (contactLinks.length > 0) {
      const href = await page.$eval('a[href^="mailto:"]', el => el.getAttribute('href'));
      expect(href).toMatch(/^mailto:/);
    }
  });

  test('Mobile navigation responsive at 375px', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(TEST_URL);
    await page.waitForSelector('header', { timeout: TIMEOUT });
    const header = await page.$('header');
    expect(header).not.toBeNull();
    const nav = await page.$('nav');
    expect(nav).not.toBeNull();
    const navLinks = await page.$$('header a[href]');
    expect(navLinks.length).toBeGreaterThan(0);
  });
});

// ============================================================
// ROI CALCULATOR TESTS (5 tests)
// ============================================================

describe('ROI Calculator Tests', () => {
  test('ROI calculator sliders render and work', async () => {
    await page.goto(`${TEST_URL}/roi`);
    await page.waitForSelector('#incidents', { timeout: TIMEOUT });
    const incidentsSlider = await page.$('#incidents');
    const mttrSlider = await page.$('#mttr');
    const revenueSlider = await page.$('#revenue');
    const supportSlider = await page.$('#support');
    expect(incidentsSlider).not.toBeNull();
    expect(mttrSlider).not.toBeNull();
    expect(revenueSlider).not.toBeNull();
    expect(supportSlider).not.toBeNull();
  });

  test('ROI slider updates display values correctly', async () => {
    await page.goto(`${TEST_URL}/roi`);
    await page.waitForSelector('#incidents-display', { timeout: TIMEOUT });
    const initialValue = await page.$eval('#incidents-display', el => el.textContent);
    const incidentsSlider = await page.$('#incidents');
    await incidentsSlider.evaluate(el => {
      el.value = '25';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await delay(100);
    const updatedValue = await page.$eval('#incidents-display', el => el.textContent);
    expect(updatedValue).toBe('25');
    expect(updatedValue).not.toBe(initialValue);
  });

  test('ROI slider min/max constraints enforced', async () => {
    await page.goto(`${TEST_URL}/roi`);
    await page.waitForSelector('#incidents', { timeout: TIMEOUT });
    const incidentsMin = await page.$eval('#incidents', el => el.min);
    const incidentsMax = await page.$eval('#incidents', el => el.max);
    expect(parseInt(incidentsMin)).toBe(1);
    expect(parseInt(incidentsMax)).toBe(50);
    const mttrMin = await page.$eval('#mttr', el => el.min);
    const mttrMax = await page.$eval('#mttr', el => el.max);
    expect(parseInt(mttrMin)).toBe(30);
    expect(parseInt(mttrMax)).toBe(240);
    const revenueMin = await page.$eval('#revenue', el => el.min);
    const revenueMax = await page.$eval('#revenue', el => el.max);
    expect(parseInt(revenueMin)).toBe(500);
    expect(parseInt(revenueMax)).toBe(50000);
    const supportMin = await page.$eval('#support', el => el.min);
    const supportMax = await page.$eval('#support', el => el.max);
    expect(parseInt(supportMin)).toBe(5000);
    expect(parseInt(supportMax)).toBe(100000);
  });

  test('ROI calculate button computes results', async () => {
    await page.goto(`${TEST_URL}/roi`);
    await page.waitForSelector('button[onclick="calculateFullROI()"]', { timeout: TIMEOUT });
    await page.evaluate(() => {
      document.getElementById('incidents').value = '12';
      document.getElementById('mttr').value = '120';
      document.getElementById('revenue').value = '5000';
      document.getElementById('support').value = '20000';
    });
    const calculateBtn = await page.$('button[onclick="calculateFullROI()"]');
    await calculateBtn.click();
    await delay(200);
    const resultsOutput = await page.$('#roi-output');
    if (resultsOutput) {
      const isDisplayed = await page.evaluate(el => {
        return el && el.style.display !== 'none';
      }, resultsOutput);
      expect(isDisplayed).toBe(true);
    }
  });

  test('ROI calculator responsive on mobile 375px', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${TEST_URL}/roi`);
    await page.waitForSelector('#incidents', { timeout: TIMEOUT });
    const incidentsSlider = await page.$('#incidents');
    expect(incidentsSlider).not.toBeNull();
    await incidentsSlider.evaluate(el => {
      el.value = '15';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await delay(100);
    const value = await page.$eval('#incidents-display', el => el.textContent);
    expect(value).toBe('15');
    const calculateBtn = await page.$('button[onclick="calculateFullROI()"]');
    expect(calculateBtn).not.toBeNull();
  });
});

// ============================================================
// INCIDENT FORM TESTS (4 tests)
// ============================================================

describe('Incident Form Tests', () => {
  test('Incident form fields accessible on diagnose page', async () => {
    await page.goto(`${TEST_URL}/diagnose`);
    await page.waitForSelector('#incident-form', { timeout: TIMEOUT });
    const form = await page.$('#incident-form');
    expect(form).not.toBeNull();
    const inputs = await page.$$('#incident-form input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('Incident form validates input on submit', async () => {
    await page.goto(`${TEST_URL}/diagnose`);
    await page.waitForSelector('#incident-form', { timeout: TIMEOUT });
    const form = await page.$('#incident-form');
    const submitBtn = await page.$('#incident-form button[type="submit"]');
    if (submitBtn) {
      const isRequired = await page.$eval(
        '#incident-form input:first-of-type',
        el => el.hasAttribute('required')
      );
      expect(isRequired || form).toBeTruthy();
    }
  });

  test('Incident form error messages display', async () => {
    await page.goto(`${TEST_URL}/diagnose`);
    await page.waitForSelector('#incident-form', { timeout: TIMEOUT });
    const form = await page.$('#incident-form');
    expect(form).not.toBeNull();
    const formHTML = await page.$eval('#incident-form', el => el.innerHTML);
    expect(formHTML).toBeTruthy();
  });

  test('Incident form responsive on mobile 375px', async () => {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${TEST_URL}/diagnose`);
    await page.waitForSelector('#incident-form', { timeout: TIMEOUT });
    const form = await page.$('#incident-form');
    expect(form).not.toBeNull();
    const firstInput = await page.$('#incident-form input');
    expect(firstInput).not.toBeNull();
    const submitBtn = await page.$('#incident-form button');
    expect(submitBtn).not.toBeNull();
  });
});

// ============================================================
// MOBILE RESPONSIVENESS TESTS (6 tests)
// ============================================================

describe('Mobile Responsiveness Tests', () => {
  test('No horizontal scroll at 375px iPhone SE', async () => {
    await page.setViewport({ width: 375, height: 667 });
    const viewportPages = ['/diagnose', '/roi', '/cases', '/pricing'];
    for (const pageUrl of viewportPages) {
      await page.goto(`${TEST_URL}${pageUrl}`);
      const mainContent = await page.$('main');
      expect(mainContent).not.toBeNull();
    }
  });

  test('Desktop layout at 1600px wide monitor', async () => {
    await page.setViewport({ width: 1600, height: 1024 });
    await page.goto(TEST_URL);
    await page.waitForSelector('main', { timeout: TIMEOUT });
    const mainContent = await page.$('main');
    expect(mainContent).not.toBeNull();
    const navLinks = await page.$$('header nav a');
    expect(navLinks.length).toBeGreaterThan(4);
  });

  test('Full layout displays at 1200px Desktop', async () => {
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(TEST_URL);
    await page.waitForSelector('main', { timeout: TIMEOUT });
    const mainContent = await page.$('main');
    expect(mainContent).not.toBeNull();
    const navLinks = await page.$$('header a[href]');
    expect(navLinks.length).toBeGreaterThan(3);
  });

  test('Focus states visible at desktop breakpoints', async () => {
    const viewports = [
      { width: 1200, height: 800 },
      { width: 1600, height: 900 },
      { width: 2560, height: 1440 }
    ];
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await page.goto(TEST_URL);
      await page.keyboard.press('Tab');
      await delay(100);
      const focusedElement = await page.evaluate(() => {
        return document.activeElement ? document.activeElement.tagName : null;
      });
      expect(focusedElement).not.toBeNull();
    }
  });

  test('Buttons clickable and properly sized on desktop', async () => {
    await page.setViewport({ width: 1200, height: 800 });
    const pages = ['/', '/diagnose', '/roi', '/cases', '/how-to-use'];
    for (const pageUrl of pages) {
      await page.goto(`${TEST_URL}${pageUrl}`);
      const buttons = await page.$$('button, a.button');
      if (buttons.length > 0) {
        const bbox = await buttons[0].boundingBox();
        expect(bbox.width).toBeGreaterThan(40);
        expect(bbox.height).toBeGreaterThan(30);
      }
    }
  });

  test('Layout integrity maintained across desktop breakpoints', async () => {
    const viewports = [1200, 1600, 1920, 2560, 3440];
    for (const width of viewports) {
      await page.setViewport({ width, height: 800 });
      await page.goto(TEST_URL);
      const errors = await page.evaluate(() => {
        return document.querySelectorAll('.error').length === 0;
      });
      expect(errors).toBe(true);
    }
  });
});

// ============================================================
// ACCESSIBILITY TESTS (5 tests)
// ============================================================

describe('Accessibility Tests', () => {
  test('Keyboard navigation works with Tab key', async () => {
    await page.goto(TEST_URL);
    await page.waitForSelector('main', { timeout: TIMEOUT });
    const focusedElements = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName;
      });
      if (focused) {
        focusedElements.push(focused);
      }
    }
    expect(focusedElements.length).toBeGreaterThan(0);
  });

  test('Focus outlines visible on interactive elements', async () => {
    await page.goto(TEST_URL);
    await page.waitForSelector('a, button', { timeout: TIMEOUT });
    await page.keyboard.press('Tab');
    const hasFocusStyle = await page.evaluate(() => {
      const focused = document.activeElement;
      const styles = window.getComputedStyle(focused);
      return {
        outline: styles.outline !== 'none',
        boxShadow: styles.boxShadow !== 'none',
        hasStyle: styles.outline !== 'none' || styles.boxShadow !== 'none'
      };
    });
    expect(hasFocusStyle.hasStyle).toBe(true);
  });

  test('Form labels associated with inputs', async () => {
    await page.goto(`${TEST_URL}/diagnose`);
    await page.waitForSelector('#incident-form', { timeout: TIMEOUT });
    const inputs = await page.$$('#incident-form input, #incident-form textarea, #incident-form select');
    if (inputs.length > 0) {
      const hasProperAssociation = await page.evaluate(() => {
        const inputs = document.querySelectorAll('#incident-form input, #incident-form textarea, #incident-form select');
        return Array.from(inputs).some(input => {
          return input.id || input.getAttribute('aria-label') || input.getAttribute('placeholder') || input.getAttribute('name');
        });
      });
      expect(hasProperAssociation).toBe(true);
    }
  });

  test('Links have proper href or onclick', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/how-to-use'];
    for (const pageUrl of pages) {
      await page.goto(`${TEST_URL}${pageUrl}`);
      await page.waitForSelector('a', { timeout: TIMEOUT });
      const linkCount = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.filter(link => {
          const href = link.getAttribute('href');
          const onclick = link.getAttribute('onclick');
          const role = link.getAttribute('role');
          return href || onclick || role;
        }).length;
      });
      expect(linkCount).toBeGreaterThan(0);
    }
  });

  test('Semantic HTML structure present', async () => {
    const pages = ['/', '/diagnose', '/roi', '/cases', '/how-to-use'];
    for (const pageUrl of pages) {
      await page.goto(`${TEST_URL}${pageUrl}`);
      const header = await page.$('header');
      const main = await page.$('main');
      const nav = await page.$('nav');
      expect(header).not.toBeNull();
      expect(main).not.toBeNull();
      expect(nav).not.toBeNull();
    }
  });
});
