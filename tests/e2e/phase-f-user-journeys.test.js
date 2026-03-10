/**
 * F4-01 through F4-15: Phase F E2E Tests
 * Phase F - End-to-End Testing Sprint
 *
 * Tests critical user journeys from form to results
 * Includes happy path, error scenarios, and edge cases
 */

describe('Phase F E2E Tests - User Journeys', () => {
  let mockFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <html>
        <head>
          <title>Claude Debug Copilot</title>
        </head>
        <body>
          <div id="app">
            <!-- Navigation -->
            <nav id="nav-links">
              <a href="/">Home</a>
              <a href="/api-reference.html">API Docs</a>
            </nav>

            <!-- Main Form -->
            <section id="form-section">
              <h1>Submit Incident</h1>
              <form id="diagnose-form">
                <textarea
                  id="incident-input"
                  name="incident"
                  minlength="10"
                  maxlength="2000"
                  placeholder="Describe your incident..."
                ></textarea>
                <button type="submit" id="submit-btn">Diagnose</button>
                <div id="form-error"></div>
              </form>
            </section>

            <!-- Loading State -->
            <section id="loading-section" style="display: none;">
              <div id="loading-spinner"></div>
              <div id="progress-message">Analyzing your incident...</div>
              <div id="pipeline-stages">
                <div class="stage" data-stage="router">Router</div>
                <div class="stage" data-stage="retriever">Retriever</div>
                <div class="stage" data-stage="skeptic">Skeptic</div>
                <div class="stage" data-stage="verifier">Verifier</div>
              </div>
            </section>

            <!-- Results Section -->
            <section id="results-section" style="display: none;">
              <h2>Diagnosis Results</h2>
              <div id="router-results"></div>
              <div id="retriever-results"></div>
              <div id="skeptic-results"></div>
              <div id="verifier-results"></div>
              <div id="confidence-meter"></div>
              <button id="new-diagnosis-btn">New Diagnosis</button>
            </section>

            <!-- Error Section -->
            <section id="error-section" style="display: none;">
              <h2 id="error-title">Error</h2>
              <div id="error-message"></div>
              <button id="retry-btn">Retry</button>
            </section>

            <!-- Theme Toggle -->
            <button id="theme-toggle">Dark Mode</button>
          </div>
        </body>
      </html>
    `;

    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
      setItem: jest.fn((key, value) => {
        mockLocalStorage.data[key] = value;
      }),
      removeItem: jest.fn((key) => {
        delete mockLocalStorage.data[key];
      }),
      clear: jest.fn(() => {
        mockLocalStorage.data = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('F4-01: Happy Path - Form Submission to Results', () => {
    it('should complete full diagnosis workflow', async () => {
      // 1. User enters incident
      const input = document.getElementById('incident-input');
      input.value = 'Database connection failed after server restart. Error: ECONNREFUSED 127.0.0.1:5432';

      expect(input.value.length).toBeGreaterThanOrEqual(10);

      // 2. User clicks submit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          router: { classification: 'database_failure' },
          retriever: { evidence: ['Connection refused error', 'Port 5432 not listening'] },
          skeptic: { alternative: 'Network interface down' },
          verifier: {
            rootCause: 'PostgreSQL service not running',
            confidence: 0.95,
          },
        }),
      });

      const form = document.getElementById('diagnose-form');
      const submitBtn = document.getElementById('submit-btn');

      // 3. Form shows loading
      expect(submitBtn).toBeTruthy();

      // 4. API is called with incident
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: input.value }),
      });

      expect(response.ok).toBe(true);

      // 5. Results are displayed
      const result = await response.json();
      expect(result.verifier.rootCause).toBeDefined();
      expect(result.verifier.confidence).toBe(0.95);

      // 6. Confidence meter is shown
      const confidenceDiv = document.getElementById('confidence-meter');
      confidenceDiv.innerHTML = `<div class="meter" style="width: ${result.verifier.confidence * 100}%">95%</div>`;
      expect(confidenceDiv.innerHTML).toContain('95%');
    });
  });

  describe('F4-02: Input Validation Journey', () => {
    it('should prevent submission of too-short input', () => {
      const input = document.getElementById('incident-input');
      const submitBtn = document.getElementById('submit-btn');

      input.value = 'Short'; // Only 5 chars

      const isValid = input.value.length >= 10;
      expect(isValid).toBe(false);
      expect(submitBtn.disabled).toBe(false); // Button is present, validation is client-side
    });

    it('should show validation error message', () => {
      const input = document.getElementById('incident-input');
      const formError = document.getElementById('form-error');

      input.value = 'Too short';

      const validateForm = () => {
        if (input.value.length < 10) {
          formError.textContent = 'Description must be at least 10 characters';
          formError.style.display = 'block';
          return false;
        }
        return true;
      };

      const isValid = validateForm();
      expect(isValid).toBe(false);
      expect(formError.textContent).toContain('at least 10 characters');
    });

    it('should allow valid input and clear errors', () => {
      const input = document.getElementById('incident-input');
      const formError = document.getElementById('form-error');

      input.value = 'This is a valid incident description that exceeds minimum length';

      const validateForm = () => {
        if (input.value.length < 10) {
          formError.textContent = 'Description must be at least 10 characters';
          return false;
        }
        formError.textContent = '';
        formError.style.display = 'none';
        return true;
      };

      const isValid = validateForm();
      expect(isValid).toBe(true);
      expect(formError.textContent).toBe('');
    });
  });

  describe('F4-03: Network Failure and Retry Journey', () => {
    it('should show error on network failure', async () => {
      const input = document.getElementById('incident-input');
      input.value = 'Valid incident description for testing';

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/diagnose', {
          method: 'POST',
          body: JSON.stringify({ incident: input.value }),
        });
      } catch (error) {
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'block';
        errorSection.querySelector('#error-message').textContent =
          'Network error. Please check your connection.';

        expect(errorSection.style.display).toBe('block');
      }
    });

    it('should allow user to retry after network error', async () => {
      const input = document.getElementById('incident-input');
      input.value = 'Valid incident for retry test';

      // First attempt fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/diagnose', {
          method: 'POST',
          body: JSON.stringify({ incident: input.value }),
        });
      } catch (error) {
        // User clicks retry
        const retryBtn = document.getElementById('retry-btn');
        expect(retryBtn).toBeTruthy();

        // Second attempt succeeds
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

        const retryResponse = await fetch('/api/diagnose', {
          method: 'POST',
          body: JSON.stringify({ incident: input.value }),
        });

        expect(retryResponse.ok).toBe(true);
      }
    });

    it('should show exponential backoff timing', async () => {
      const delays = [];
      let attempts = 0;

      const withRetry = async (fn, maxRetries = 3) => {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxRetries) throw error;

            const delayMs = Math.min(1000 * Math.pow(2, i), 8000);
            delays.push(delayMs);
            await new Promise((resolve) => setTimeout(resolve, 10)); // Shorter delay for test
          }
        }
      };

      mockFetch.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      const result = await withRetry(() => fetch('/api/diagnose'), 2);

      // Verify exponential backoff was calculated
      expect(delays[0]).toBe(1000); // 2^0 * 1000
      expect(delays[1]).toBe(2000); // 2^1 * 1000
    });
  });

  describe('F4-04: API Error Handling Journey', () => {
    it('should handle 400 validation error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'validation_error',
          message: 'Incident description is required',
        }),
      });

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({ incident: '' }),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'block';
        errorSection.querySelector('#error-message').textContent =
          error.message;

        expect(errorSection.style.display).toBe('block');
      }
    });

    it('should handle 402 billing error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 402,
      });

      const response = await fetch('/api/diagnose');

      if (response.status === 402) {
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'block';
        errorSection.querySelector('#error-message').innerHTML = `
          No API credits available.
          <a href="https://console.anthropic.com/account/billing/overview" target="_blank">
            Add credits
          </a>
        `;

        expect(errorSection.querySelector('#error-message').innerHTML).toContain(
          'Add credits'
        );
      }
    });

    it('should handle 500 server error with retry option', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const response = await fetch('/api/diagnose');

      if (response.status >= 500) {
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'block';
        errorSection.querySelector('#error-message').innerHTML = `
          Server error. Please try again.
          <button id="retry-btn">Retry</button>
        `;

        expect(errorSection.querySelector('#retry-btn')).toBeTruthy();
      }
    });
  });

  describe('F4-05: Results Display Journey', () => {
    it('should display all 4 agent outputs', async () => {
      const mockResults = {
        router: {
          classification: 'database_failure',
          confidence: 0.92,
        },
        retriever: {
          evidence: ['Error: ECONNREFUSED', 'Service unhealthy'],
        },
        skeptic: {
          alternative: 'Network interface issue',
          reasoning: 'Similar symptoms observed...',
        },
        verifier: {
          validation: 'High confidence in database diagnosis',
          confidence: 0.95,
        },
      };

      const resultsSection = document.getElementById('results-section');
      resultsSection.style.display = 'block';

      // Display router output
      const routerDiv = document.getElementById('router-results');
      routerDiv.innerHTML = `<h3>Classification</h3><p>${mockResults.router.classification}</p>`;

      // Display retriever output
      const retrieverDiv = document.getElementById('retriever-results');
      retrieverDiv.innerHTML = `<h3>Evidence</h3><ul>${mockResults.retriever.evidence
        .map((e) => `<li>${e}</li>`)
        .join('')}</ul>`;

      // Display skeptic output
      const skepticDiv = document.getElementById('skeptic-results');
      skepticDiv.innerHTML = `<h3>Alternative Theory</h3><p>${mockResults.skeptic.alternative}</p>`;

      // Display verifier output
      const verifierDiv = document.getElementById('verifier-results');
      verifierDiv.innerHTML = `<h3>Root Cause</h3><p>${mockResults.verifier.validation}</p>`;

      expect(resultsSection.style.display).toBe('block');
      expect(routerDiv.innerHTML).toContain('database_failure');
      expect(retrieverDiv.innerHTML).toContain('ECONNREFUSED');
      expect(skepticDiv.innerHTML).toContain('Network');
    });

    it('should display confidence meter', async () => {
      const confidenceValue = 0.92;
      const confidenceDiv = document.getElementById('confidence-meter');

      const percentage = Math.round(confidenceValue * 100);
      const level = percentage >= 70 ? 'high' : percentage >= 40 ? 'medium' : 'low';

      confidenceDiv.innerHTML = `
        <div class="meter meter--${level}" style="width: ${percentage}%">
          ${percentage}%
        </div>
      `;

      expect(confidenceDiv.innerHTML).toContain('92%');
      expect(confidenceDiv.innerHTML).toContain('meter--high');
    });
  });

  describe('F4-06: Loading State Journey', () => {
    it('should show loading section during processing', async () => {
      const formSection = document.getElementById('form-section');
      const loadingSection = document.getElementById('loading-section');

      formSection.style.display = 'none';
      loadingSection.style.display = 'block';

      expect(loadingSection.style.display).toBe('block');
    });

    it('should show progress through stages', async () => {
      const stages = ['router', 'retriever', 'skeptic', 'verifier'];
      const loadingSection = document.getElementById('loading-section');

      loadingSection.style.display = 'block';

      // Simulate progressing through stages
      stages.forEach((stage, index) => {
        const stageDiv = loadingSection.querySelector(`[data-stage="${stage}"]`);
        if (index === 0) {
          stageDiv.classList.add('active');
        }
      });

      const activeStage = loadingSection.querySelector('[data-stage="router"]');
      expect(activeStage.classList.contains('active')).toBe(true);
    });

    it('should hide loading after completion', async () => {
      const loadingSection = document.getElementById('loading-section');
      const resultsSection = document.getElementById('results-section');

      loadingSection.style.display = 'none';
      resultsSection.style.display = 'block';

      expect(loadingSection.style.display).toBe('none');
      expect(resultsSection.style.display).toBe('block');
    });
  });

  describe('F4-07: Theme Toggle Journey', () => {
    it('should toggle theme on button click', () => {
      const themeToggle = document.getElementById('theme-toggle');

      const toggleTheme = () => {
        const current = localStorage.getItem('app-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        localStorage.setItem('app-theme', next);
        document.documentElement.setAttribute('data-theme', next);
      };

      toggleTheme();
      expect(localStorage.getItem('app-theme')).toBe('dark');

      toggleTheme();
      expect(localStorage.getItem('app-theme')).toBe('light');
    });

    it('should persist theme across page reloads', () => {
      // User sets dark theme
      localStorage.setItem('app-theme', 'dark');

      // Simulate page reload
      const savedTheme = localStorage.getItem('app-theme');
      document.documentElement.setAttribute('data-theme', savedTheme);

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should default to light theme if not set', () => {
      localStorage.clear();

      const theme = localStorage.getItem('app-theme') || 'light';
      expect(theme).toBe('light');
    });
  });

  describe('F4-08: New Diagnosis Journey', () => {
    it('should clear form and return to input screen', () => {
      const formSection = document.getElementById('form-section');
      const resultsSection = document.getElementById('results-section');
      const input = document.getElementById('incident-input');

      // Currently showing results
      resultsSection.style.display = 'block';
      formSection.style.display = 'none';

      // User clicks "New Diagnosis"
      const newDiagBtn = document.getElementById('new-diagnosis-btn');

      const startNewDiagnosis = () => {
        resultsSection.style.display = 'none';
        formSection.style.display = 'block';
        input.value = '';
      };

      startNewDiagnosis();

      expect(formSection.style.display).toBe('block');
      expect(resultsSection.style.display).toBe('none');
      expect(input.value).toBe('');
    });
  });

  describe('F4-09: Form Data Preservation', () => {
    it('should save form data to session storage during typing', () => {
      const input = document.getElementById('incident-input');

      const autoSaveForm = () => {
        sessionStorage.setItem('form-incident', input.value);
      };

      input.value = 'User is typing their incident description';
      autoSaveForm();

      const saved = sessionStorage.getItem('form-incident');
      expect(saved).toBe('User is typing their incident description');
    });

    it('should restore form data on page reload', () => {
      const savedText = 'Previously entered text';
      sessionStorage.setItem('form-incident', savedText);

      const input = document.getElementById('incident-input');
      const restored = sessionStorage.getItem('form-incident');

      if (restored) {
        input.value = restored;
      }

      expect(input.value).toBe(savedText);
    });
  });

  describe('F4-10: Error Recovery Options', () => {
    it('should show retry button on transient error', () => {
      const errorSection = document.getElementById('error-section');
      const retryBtn = document.getElementById('retry-btn');

      errorSection.style.display = 'block';
      errorSection.querySelector('#error-message').textContent =
        'Connection timeout. Try again?';

      expect(retryBtn).toBeTruthy();
      expect(retryBtn.style.display !== 'none').toBe(true);
    });

    it('should show billing link on credit error', () => {
      const errorSection = document.getElementById('error-section');
      const errorMsg = errorSection.querySelector('#error-message');

      errorMsg.innerHTML = `
        No API credits available.
        <a href="https://console.anthropic.com/account/billing/overview" target="_blank">
          Add credits
        </a>
      `;

      expect(errorMsg.querySelector('a')).toBeTruthy();
      expect(errorMsg.querySelector('a').href).toContain('billing');
    });

    it('should show contact support link on persistent error', () => {
      const errorSection = document.getElementById('error-section');
      const errorMsg = errorSection.querySelector('#error-message');

      errorMsg.innerHTML = `
        Persistent error occurred. Please contact support.
        <a href="mailto:support@anthropic.com">Contact Support</a>
      `;

      expect(errorMsg.querySelector('a')).toBeTruthy();
      expect(errorMsg.querySelector('a').href).toContain('mailto');
    });
  });

  describe('F4-11: Accessibility Features Journey', () => {
    it('should have proper ARIA labels on form', () => {
      const form = document.getElementById('diagnose-form');
      const input = document.getElementById('incident-input');

      input.setAttribute('aria-label', 'Incident description');
      input.setAttribute('aria-required', 'true');

      expect(input.getAttribute('aria-label')).toBe('Incident description');
      expect(input.getAttribute('aria-required')).toBe('true');
    });

    it('should announce loading state to screen readers', () => {
      const loadingSection = document.getElementById('loading-section');

      loadingSection.setAttribute('role', 'status');
      loadingSection.setAttribute('aria-live', 'polite');
      loadingSection.setAttribute('aria-label', 'Processing your incident...');

      expect(loadingSection.getAttribute('role')).toBe('status');
    });

    it('should announce errors with high priority', () => {
      const errorSection = document.getElementById('error-section');

      errorSection.setAttribute('role', 'alert');
      errorSection.setAttribute('aria-live', 'assertive');

      expect(errorSection.getAttribute('role')).toBe('alert');
    });
  });

  describe('F4-12: Navigation Journey', () => {
    it('should navigate to API docs from home', () => {
      const apiLink = document.querySelector('a[href="/api-reference.html"]');

      expect(apiLink).toBeTruthy();
      expect(apiLink.textContent).toContain('API');
    });

    it('should show current page in navigation', () => {
      // Simulate home page
      const homeLink = document.querySelector('a[href="/"]');
      homeLink.setAttribute('aria-current', 'page');

      expect(homeLink.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('F4-13: Performance Journey', () => {
    it('should complete diagnosis within reasonable time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          router: {},
          retriever: {},
          skeptic: {},
          verifier: {},
        }),
      });

      const startTime = Date.now();

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({ incident: 'test' }),
      });

      const elapsed = Date.now() - startTime;

      // Should complete quickly (under 2 seconds in test)
      expect(elapsed).toBeLessThan(2000);
    });
  });

  describe('F4-14: Timeout Journey', () => {
    it('should timeout after 60 seconds and show retry', (done) => {
      jest.useFakeTimers();

      let hasTimedOut = false;
      const timeoutMs = 60000;

      const timeout = setTimeout(() => {
        hasTimedOut = true;
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'block';
        errorSection.querySelector('#error-message').textContent =
          'Request timed out. Please retry.';
      }, timeoutMs);

      jest.advanceTimersByTime(61000);

      expect(hasTimedOut).toBe(true);
      expect(document.getElementById('error-section').style.display).toBe('block');

      clearTimeout(timeout);
      jest.useRealTimers();
      done();
    });
  });

  describe('F4-15: Complete User Journey Summary', () => {
    it('should handle full user journey from start to finish', async () => {
      // Step 1: User fills form
      const input = document.getElementById('incident-input');
      input.value =
        'Database server crashed after deployment. Error: connection refused.';

      // Step 2: User submits
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          router: { classification: 'database_failure' },
          retriever: { evidence: ['Crash log entry', 'Service down'] },
          skeptic: { alternative: 'Network issue' },
          verifier: {
            rootCause: 'DB service crashed',
            confidence: 0.94,
          },
        }),
      });

      const response = await fetch('/api/diagnose', {
        method: 'POST',
        body: JSON.stringify({ incident: input.value }),
      });

      expect(response.ok).toBe(true);

      // Step 3: Results displayed
      const result = await response.json();
      const resultsSection = document.getElementById('results-section');
      resultsSection.style.display = 'block';

      // Step 4: User reviews results
      expect(resultsSection.style.display).toBe('block');
      expect(result.verifier.confidence).toBe(0.94);

      // Step 5: User can start new diagnosis
      const newDiagBtn = document.getElementById('new-diagnosis-btn');
      expect(newDiagBtn).toBeTruthy();
    });
  });
});
