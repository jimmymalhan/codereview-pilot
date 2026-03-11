/**
 * Mobile Responsive Viewport Tests
 * Verifies that key pages have viewport meta and responsive breakpoints.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('Mobile responsive viewport', () => {
  it('index.html has viewport meta tag', () => {
    const html = readFileSync(join(__dirname, '../../src/www/index.html'), 'utf8');
    expect(html).toMatch(/<meta\s+name=["']viewport["'][^>]*content=["'][^"']*width=device-width[^"']*["']/i);
    expect(html).toMatch(/initial-scale=1/);
  });

  it('index.html has responsive media queries for mobile', () => {
    const html = readFileSync(join(__dirname, '../../src/www/index.html'), 'utf8');
    expect(html).toMatch(/@media\s*\([^)]*max-width:\s*(768|767)px/);
  });

  it('diagnosis form section has responsive layout class', () => {
    const html = readFileSync(join(__dirname, '../../src/www/index.html'), 'utf8');
    expect(html).toContain('diagnosis-section');
    expect(html).toContain('diagnosis-container');
  });

  it('app.css has mobile breakpoints', () => {
    const css = readFileSync(join(__dirname, '../../src/www/styles/app.css'), 'utf8');
    expect(css).toMatch(/@media\s*\([^)]*max-width/);
  });
});
