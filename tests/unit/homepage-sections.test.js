import fs from 'fs';
import path from 'path';

describe('Homepage index.html', () => {
  let html;

  beforeAll(() => {
    const filePath = path.join(process.cwd(), 'src', 'www', 'index.html');
    html = fs.readFileSync(filePath, 'utf8');
  });

  describe('navigation', () => {
    it('should not have a "Try It" nav tab', () => {
      // Nav links should not contain a standalone "Try It" link as a tab
      const navSection = html.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/);
      expect(navSection).toBeTruthy();
      const navContent = navSection[1];
      expect(navContent).not.toMatch(/<a[^>]*>Try It<\/a>/);
    });

    it('should have "How It Works" nav link', () => {
      const navSection = html.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/);
      expect(navSection[1]).toMatch(/How It Works/);
    });

    it('should have a "Try It Free" CTA button in nav-right', () => {
      const navRight = html.match(/<div class="nav-right">([\s\S]*?)<\/div>/);
      expect(navRight).toBeTruthy();
      expect(navRight[1]).toMatch(/Try It Free/);
    });

    it('should link nav CTA to #diagnose', () => {
      const navRight = html.match(/<div class="nav-right">([\s\S]*?)<\/div>/);
      expect(navRight[1]).toMatch(/href="#diagnose"/);
    });
  });

  describe('section order', () => {
    it('should have "Built For" section before "How It Works"', () => {
      const builtForPos = html.indexOf('id="who-for"');
      const howItWorksPos = html.indexOf('id="how-it-works"');
      expect(builtForPos).toBeGreaterThan(0);
      expect(howItWorksPos).toBeGreaterThan(0);
      expect(builtForPos).toBeLessThan(howItWorksPos);
    });

    it('should have "How It Works" before diagnosis form', () => {
      const howItWorksPos = html.indexOf('id="how-it-works"');
      const diagnosePos = html.indexOf('id="diagnose"');
      expect(howItWorksPos).toBeLessThan(diagnosePos);
    });

    it('should have diagnosis form before "capabilities"', () => {
      const diagnosePos = html.indexOf('id="diagnose"');
      const capabilitiesPos = html.indexOf('id="capabilities"');
      expect(diagnosePos).toBeLessThan(capabilitiesPos);
    });

    it('should have "Why Different" section', () => {
      expect(html).toContain('id="why-different"');
    });

    it('should have "After Click" section', () => {
      expect(html).toContain('id="after-click"');
    });

    it('should have "Real-Time Stats" section', () => {
      expect(html).toContain('id="real-time"');
    });

    it('should have "Final CTA" section before footer', () => {
      const ctaPos = html.indexOf('id="final-cta"');
      const footerPos = html.indexOf('<footer');
      expect(ctaPos).toBeGreaterThan(0);
      expect(ctaPos).toBeLessThan(footerPos);
    });
  });

  describe('required sections exist', () => {
    const requiredSections = [
      { id: 'who-we-are', name: 'Who We Are' },
      { id: 'problem', name: 'Problem' },
      { id: 'why-now', name: 'Why Now' },
      { id: 'who-for', name: 'Built For' },
      { id: 'how-it-works', name: 'How It Works' },
      { id: 'diagnose', name: 'Diagnosis Form' },
      { id: 'capabilities', name: 'Capabilities' },
      { id: 'product', name: 'Product/Integrations' },
      { id: 'use-cases', name: 'Use Cases' },
      { id: 'why-different', name: 'Why Different' },
      { id: 'after-click', name: 'After Click' },
      { id: 'real-time', name: 'Real-Time Stats' },
      { id: 'faq', name: 'FAQ' },
      { id: 'stats', name: 'Stats' },
      { id: 'final-cta', name: 'Final CTA' },
    ];

    requiredSections.forEach(({ id, name }) => {
      it(`should contain "${name}" section (id="${id}")`, () => {
        expect(html).toContain(`id="${id}"`);
      });
    });
  });

  describe('How It Works section', () => {
    it('should have 4 step cards', () => {
      const howItWorks = html.match(/id="how-it-works"([\s\S]*?)(?=<section|$)/);
      expect(howItWorks).toBeTruthy();
      const stepCards = howItWorks[1].match(/class="step-card/g);
      expect(stepCards).toHaveLength(4);
    });

    it('should have step numbers 1-4', () => {
      const howItWorks = html.match(/id="how-it-works"([\s\S]*?)(?=<section|$)/);
      const content = howItWorks[1];
      expect(content).toContain('>1<');
      expect(content).toContain('>2<');
      expect(content).toContain('>3<');
      expect(content).toContain('>4<');
    });

    it('should have highlight stats', () => {
      const howItWorks = html.match(/id="how-it-works"([\s\S]*?)(?=<section|$)/);
      const content = howItWorks[1];
      expect(content).toContain('16-30 seconds');
      expect(content).toContain('94% confidence');
    });
  });

  describe('diagnosis form', () => {
    it('should have textarea with placeholder', () => {
      expect(html).toContain('id="incident"');
      expect(html).toContain('placeholder=');
    });

    it('should have character counter', () => {
      expect(html).toContain('id="char-count"');
      expect(html).toContain('/2000 characters');
    });

    it('should have pipeline stage indicators in loading', () => {
      expect(html).toContain('id="stage-router"');
      expect(html).toContain('id="stage-retriever"');
      expect(html).toContain('id="stage-skeptic"');
      expect(html).toContain('id="stage-verifier"');
    });

    it('should have export buttons', () => {
      expect(html).toContain('copyToClipboard()');
      expect(html).toContain('exportJSON()');
      expect(html).toContain('newDiagnosis()');
    });

    it('should have submit button', () => {
      expect(html).toContain('id="submit-btn"');
      expect(html).toContain('submitDiagnosis(event)');
    });
  });

  describe('capabilities section', () => {
    it('should have 6 capability cards', () => {
      const capabilities = html.match(/id="capabilities"([\s\S]*?)(?=<\/section>)/);
      expect(capabilities).toBeTruthy();
      const cards = capabilities[1].match(/class="product-card/g);
      expect(cards).toHaveLength(6);
    });

    it('should list all 6 diagnosis outputs', () => {
      expect(html).toContain('Root Cause Analysis');
      expect(html).toContain('Evidence-Backed Proof');
      expect(html).toContain('Fix Plan with Steps');
      expect(html).toContain('Rollback Path');
      expect(html).toContain('Suggested Tests');
      expect(html).toContain('Export and Audit');
    });
  });

  describe('why different section', () => {
    it('should have 4 differentiators', () => {
      const whyDiff = html.match(/id="why-different"([\s\S]*?)(?=<\/section>)/);
      expect(whyDiff).toBeTruthy();
      expect(whyDiff[1]).toContain('Evidence-First');
      expect(whyDiff[1]).toContain('Fixed 4-Step Workflow');
      expect(whyDiff[1]).toContain('Real-Time on Live Input');
      expect(whyDiff[1]).toContain('Built for Operators');
    });
  });

  describe('after click section', () => {
    it('should have pipeline timeline with 4 steps', () => {
      const afterClick = html.match(/id="after-click"([\s\S]*?)(?=<\/section>)/);
      expect(afterClick).toBeTruthy();
      const content = afterClick[1];
      expect(content).toContain('Router');
      expect(content).toContain('Retriever');
      expect(content).toContain('Skeptic');
      expect(content).toContain('Verifier');
    });
  });

  describe('live stats section', () => {
    it('should have 4 live stat elements', () => {
      expect(html).toContain('id="live-total-diagnoses"');
      expect(html).toContain('id="live-success-rate"');
      expect(html).toContain('id="live-avg-confidence"');
      expect(html).toContain('id="live-uptime"');
    });
  });

  describe('FAQ section', () => {
    it('should have at least 5 FAQ items', () => {
      const faq = html.match(/id="faq"([\s\S]*?)(?=<\/section>)/);
      expect(faq).toBeTruthy();
      const items = faq[1].match(/<h4>/g);
      expect(items.length).toBeGreaterThanOrEqual(5);
    });

    it('should include pricing FAQ', () => {
      expect(html).toContain('How much does it cost');
    });

    it('should include compliance FAQ', () => {
      expect(html).toContain('compliance');
    });
  });

  describe('footer', () => {
    it('should link to How It Works', () => {
      const footer = html.match(/<footer([\s\S]*?)<\/footer>/);
      expect(footer[1]).toContain('How It Works');
    });

    it('should not have standalone "Try It" link in footer', () => {
      const footer = html.match(/<footer([\s\S]*?)<\/footer>/);
      expect(footer[1]).not.toMatch(/>Try It<\/a>/);
    });

    it('should show CodeReview-Pilot brand', () => {
      const footer = html.match(/<footer([\s\S]*?)<\/footer>/);
      expect(footer[1]).toContain('CodeReview-Pilot');
    });
  });

  describe('CSS for new sections', () => {
    it('should have how-it-works styles', () => {
      expect(html).toContain('.how-it-works-section');
      expect(html).toContain('.steps-grid');
      expect(html).toContain('.step-card');
    });

    it('should have pipeline-stages styles', () => {
      expect(html).toContain('.pipeline-stages');
      expect(html).toContain('.stage.active');
    });

    it('should have after-click styles', () => {
      expect(html).toContain('.after-click-section');
      expect(html).toContain('.pipeline-timeline');
      expect(html).toContain('.timeline-step');
    });

    it('should have live stats styles', () => {
      expect(html).toContain('.live-stats-grid');
      expect(html).toContain('.live-stat');
    });

    it('should have final CTA styles', () => {
      expect(html).toContain('.final-cta-section');
    });
  });

  describe('JavaScript functions', () => {
    it('should have loadLiveStats function', () => {
      expect(html).toContain('function loadLiveStats');
    });

    it('should call loadLiveStats on DOMContentLoaded', () => {
      expect(html).toContain('loadLiveStats()');
    });

    it('should have pipeline stage animation', () => {
      expect(html).toContain('function animatePipelineStages');
      expect(html).toContain('function stopPipelineStages');
    });

    it('should have submitDiagnosis function', () => {
      expect(html).toContain('function submitDiagnosis');
    });

    it('should have scrollToDiagnose function', () => {
      expect(html).toContain('function scrollToDiagnose');
    });
  });

  describe('accessibility', () => {
    it('should have skip link', () => {
      expect(html).toContain('Skip to main content');
    });

    it('should have ARIA labels on new sections', () => {
      expect(html).toContain('aria-label="How it works"');
      expect(html).toContain('aria-label="Why this is different"');
      expect(html).toContain('aria-label="What happens after you click"');
      expect(html).toContain('aria-label="Live system stats"');
    });

    it('should have role="region" on new sections', () => {
      const regions = html.match(/role="region"/g);
      expect(regions.length).toBeGreaterThanOrEqual(4);
    });

    it('should have aria-hidden on decorative elements', () => {
      expect(html).toContain('aria-hidden="true"');
    });

    it('should have reduced motion media query', () => {
      expect(html).toContain('prefers-reduced-motion');
    });
  });

  describe('backend alignment', () => {
    it('should reference real API endpoints', () => {
      expect(html).toContain('/api/diagnose');
      expect(html).toContain('/api/batch-diagnose');
      expect(html).toContain('/api/analytics');
      expect(html).toContain('/health');
    });

    it('should fetch from /api/analytics for live stats', () => {
      expect(html).toContain("fetch('/api/analytics')");
    });

    it('should fetch from /health for uptime', () => {
      expect(html).toContain("fetch('/health')");
    });

    it('should POST to /api/diagnose on form submit', () => {
      expect(html).toContain("fetch('/api/diagnose'");
      expect(html).toContain("method: 'POST'");
    });
  });
});
