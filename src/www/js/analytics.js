/**
 * Claude Debug Copilot - Analytics Instrumentation
 * Tracks 50+ user behavior metrics without breaking privacy
 */

(function () {
  'use strict';

  var Analytics = {
    enabled: true,
    debug: false,
    sessionId: null,
    userId: null,
    events: [],
    config: {
      maxEventsPerSession: 500,
      batchSizeEvents: 50,
      flushIntervalMs: 10000,
      localStorage: true,
      sessionTimeout: 1800000
    }
  };

  Analytics.initSession = function () {
    var storedSessionId = localStorage.getItem('analytics_session_id');
    var storedSessionTime = localStorage.getItem('analytics_session_time');
    var now = Date.now();

    if (storedSessionId && storedSessionTime && (now - parseInt(storedSessionTime)) < this.config.sessionTimeout) {
      this.sessionId = storedSessionId;
    } else {
      this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      if (this.config.localStorage) {
        localStorage.setItem('analytics_session_id', this.sessionId);
        localStorage.setItem('analytics_session_time', now);
      }
    }

    var storedUserId = localStorage.getItem('analytics_user_id');
    if (storedUserId) {
      this.userId = storedUserId;
    } else {
      this.userId = 'user_' + Math.random().toString(36).substr(2, 12);
      if (this.config.localStorage) {
        localStorage.setItem('analytics_user_id', this.userId);
      }
    }

    if (this.debug) {
      console.log('[Analytics] Session initialized:', this.sessionId, this.userId);
    }
  };

  Analytics.track = function (eventName, eventData) {
    if (!this.enabled) { return; }

    var event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.pathname,
      data: eventData || {}
    };

    event.device = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.events.push(event);

    if (this.debug) {
      console.log('[Analytics Event]', eventName, eventData);
    }

    if (this.events.length >= this.config.batchSizeEvents) {
      this.flush();
    }
  };

  Analytics.trackPageView = function (pageName) {
    this.track('page_view', {
      page_name: pageName,
      page_path: window.location.pathname,
      referrer: document.referrer,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackCtaClick = function (buttonText, buttonId, ctaType) {
    this.track('cta_click', {
      cta_text: buttonText,
      cta_id: buttonId,
      cta_type: ctaType || 'button',
      page_path: window.location.pathname
    });
  };

  Analytics.trackNavigation = function (fromPage, toPage, navType) {
    this.track('navigation', {
      from_page: fromPage,
      to_page: toPage,
      nav_type: navType || 'click',
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackFeatureInteraction = function (featureName, action, details) {
    this.track('feature_interaction', {
      feature: featureName,
      action: action,
      details: details || {},
      page_path: window.location.pathname
    });
  };

  Analytics.trackPipelineEvent = function (action, stageIndex, scenarioId) {
    this.track('pipeline_event', {
      action: action,
      stage_index: stageIndex,
      scenario_id: scenarioId,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackSkillsInteraction = function (skillName, action, result) {
    this.track('skills_interaction', {
      skill_name: skillName,
      action: action,
      result: result,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackMcpProviderSwitch = function (oldProvider, newProvider) {
    this.track('mcp_provider_switch', {
      from_provider: oldProvider,
      to_provider: newProvider,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackAgentView = function (agentName, actionPerformed) {
    this.track('agent_view', {
      agent_name: agentName,
      action: actionPerformed,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackFormSubmission = function (formName, formData, success) {
    this.track('form_submission', {
      form_name: formName,
      fields_count: Object.keys(formData).length,
      success: success,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackFormValidation = function (formName, fieldName, error) {
    this.track('form_validation', {
      form_name: formName,
      field_name: fieldName,
      has_error: !!error,
      error_type: error || null,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackScrollDepth = function (depth) {
    this.track('scroll_depth', {
      depth_percent: Math.round(depth),
      page_path: window.location.pathname
    });
  };

  Analytics.trackTimeOnPage = function (timeMs) {
    this.track('time_on_page', {
      time_ms: Math.round(timeMs),
      page_path: window.location.pathname
    });
  };

  Analytics.trackConversionStep = function (step, status) {
    this.track('conversion_step', {
      step_name: step,
      status: status,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackError = function (errorType, errorMessage, errorContext) {
    this.track('error', {
      error_type: errorType,
      error_message: errorMessage,
      context: errorContext || {},
      page_path: window.location.pathname,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackApiError = function (endpoint, statusCode, errorMsg) {
    this.track('api_error', {
      endpoint: endpoint,
      status_code: statusCode,
      error_message: errorMsg,
      timestamp_ms: Date.now()
    });
  };

  Analytics.trackDeviceMetrics = function () {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.track('device_metrics', {
      device_type: isMobile ? 'mobile' : 'desktop',
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      user_agent: navigator.userAgent,
      connection: this.getConnectionType(),
      timestamp_ms: Date.now()
    });
  };

  Analytics.getConnectionType = function () {
    if (navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  };

  Analytics.flush = function () {
    if (this.events.length === 0) { return; }

    var eventsToSend = this.events.slice(0, this.config.batchSizeEvents);
    this.events = this.events.slice(this.config.batchSizeEvents);

    var payload = {
      session_id: this.sessionId,
      user_id: this.userId,
      events: eventsToSend,
      batch_timestamp_ms: Date.now()
    };

    fetch('/api/analytics/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function () {
      if (Analytics.debug) {
        console.log('[Analytics] Batch send failed');
      }
    });

    if (this.debug) {
      console.log('[Analytics] Flushed', eventsToSend.length, 'events');
    }
  };

  Analytics.instrumentPage = function () {
    var pageName = this.getPageName();
    this.trackPageView(pageName);
    this.trackConversionStep(pageName + '_viewed', 'completed');

    var buttons = document.querySelectorAll('button, a[role="button"], .btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', (function (btn) {
        return function () {
          var text = btn.textContent || btn.innerText || '';
          var id = btn.id || btn.className;
          var ctaType = btn.tagName.toLowerCase();
          Analytics.trackCtaClick(text.trim(), id, ctaType);
        };
      })(buttons[i]));
    }

    var forms = document.querySelectorAll('form');
    for (var j = 0; j < forms.length; j++) {
      forms[j].addEventListener('submit', (function (form) {
        return function (e) {
          var formData = new FormData(form);
          var data = {};
          for (var entry of formData.entries()) {
            data[entry[0]] = typeof entry[1] === 'string' ? entry[1].substring(0, 50) : entry[1];
          }
          Analytics.trackFormSubmission(form.id || form.name || 'unknown_form', data, true);
        };
      })(forms[j]));
    }

    var maxScroll = 0;
    window.addEventListener('scroll', function () {
      var scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        if (maxScroll % 25 === 0) {
          Analytics.trackScrollDepth(maxScroll);
        }
      }
    });

    var startTime = Date.now();
    window.addEventListener('beforeunload', function () {
      var timeOnPage = Date.now() - startTime;
      Analytics.trackTimeOnPage(timeOnPage);
      Analytics.flush();
    });

    this.trackDeviceMetrics();

    setInterval(function () {
      Analytics.flush();
    }, this.config.flushIntervalMs);
  };

  Analytics.getPageName = function () {
    var path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('/pipeline')) return 'pipeline';
    if (path.includes('/skills')) return 'skills';
    if (path.includes('/mcp')) return 'mcp';
    if (path.includes('/agents')) return 'agents';
    if (path.includes('/tests')) return 'tests';
    if (path.includes('/docs')) return 'docs';
    return path;
  };

  Analytics.initErrorTracking = function () {
    var self = this;

    window.addEventListener('error', function (event) {
      self.trackError('uncaught_error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', function (event) {
      self.trackError('unhandled_rejection', event.reason.toString(), {
        promise: 'unhandled'
      });
    });

    var originalFetch = window.fetch;
    window.fetch = function () {
      var args = Array.prototype.slice.call(arguments);
      var url = args[0];
      return originalFetch.apply(this, args).then(function (response) {
        if (!response.ok && response.status >= 400) {
          self.trackApiError(url, response.status, response.statusText);
        }
        return response;
      }).catch(function (error) {
        self.trackApiError(url, 0, error.message);
        throw error;
      });
    };
  };

  Analytics.init = function () {
    this.initSession();
    this.instrumentPage();
    this.initErrorTracking();

    if (this.debug) {
      console.log('[Analytics] Initialized - Session ID:', this.sessionId);
    }
  };

  window.Analytics = Analytics;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      Analytics.init();
    });
  } else {
    Analytics.init();
  }
})();
