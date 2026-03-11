/**
 * Accessibility Audit - axe-core automated scan
 * Runs WCAG 2.1 AA compliance checks against the diagnosis form and key UI.
 * Note: Color contrast is limited in jsdom; manual verification recommended.
 *
 * @jest-environment jsdom
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = join(__dirname, '../../src/www/index.html');

describe('Accessibility: axe-core scan', () => {
  let fullHtml;

  beforeAll(() => {
    const raw = readFileSync(indexPath, 'utf8');
    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    fullHtml = bodyMatch ? bodyMatch[1] : raw;
  });

  it('diagnosis form section has no critical or serious axe violations', async () => {
    const results = await axe(fullHtml, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    });
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical).toEqual([]);
  });

  it('form structure has labels and ARIA attributes', () => {
    document.body.innerHTML = fullHtml;
    const diagnoseSection = document.getElementById('diagnose');
    expect(diagnoseSection).not.toBeNull();
    const textarea = diagnoseSection.querySelector('#incident');
    const label = document.querySelector('label[for="incident"]');
    expect(textarea).not.toBeNull();
    expect(textarea.getAttribute('aria-label')).toBeTruthy();
    expect(textarea.getAttribute('aria-describedby')).toBeTruthy();
    expect(label).not.toBeNull();
  });
});
