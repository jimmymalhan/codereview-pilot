/**
 * Claude Debug Copilot - Main Application Framework
 * Vanilla JS SPA with client-side routing
 */
(function () {
  'use strict';

  var App = {
    currentPage: null,
    state: {},
    _toastTimer: null
  };

  /* =========================================
   * API Helper
   * ========================================= */
  App.api = function (endpoint, method, data) {
    method = method || 'GET';
    var options = {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) { options.body = JSON.stringify(data); }

    return fetch(endpoint, options).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    });
  };

  /* =========================================
   * Navigation
   * ========================================= */
  App.initNav = function () {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('nav-links--open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    var path = window.location.pathname;
    var navItems = document.querySelectorAll('#nav-links a');
    for (var i = 0; i < navItems.length; i++) {
      var href = navItems[i].getAttribute('href');
      if (href === path || (path === '/' && href === '/')) {
        navItems[i].setAttribute('aria-current', 'page');
      }
    }
  };

  /* =========================================
   * Toast notifications
   * ========================================= */
  App.toast = function (msg, type) {
    type = type || 'info';
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'toast toast--' + type + ' toast--visible';
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(function () {
      el.classList.remove('toast--visible');
    }, 3000);
  };

  /* =========================================
   * Tab Management
   * ========================================= */
  App.initTabs = function (containerId) {
    var container = document.getElementById(containerId);
    if (!container) { return; }
    var tabs = container.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        var target = this.getAttribute('data-tab');
        var siblings = this.parentElement.querySelectorAll('.tab');
        for (var j = 0; j < siblings.length; j++) {
          siblings[j].classList.remove('tab--active');
          siblings[j].setAttribute('aria-selected', 'false');
        }
        this.classList.add('tab--active');
        this.setAttribute('aria-selected', 'true');

        var panels = container.querySelectorAll('.tab-content');
        for (var k = 0; k < panels.length; k++) {
          panels[k].classList.remove('tab-content--active');
        }
        var panel = document.getElementById(target);
        if (panel) { panel.classList.add('tab-content--active'); }
      });
    }
  };

  /* =========================================
   * Confidence Meter
   * ========================================= */
  App.setConfidence = function (elementId, value) {
    var container = document.getElementById(elementId);
    if (!container) { return; }
    var pct = Math.round(value * 100);
    var cls = pct >= 70 ? 'high' : pct >= 40 ? 'medium' : 'low';
    container.innerHTML =
      '<div class="confidence-meter">' +
        '<div class="confidence-meter__fill confidence-meter__fill--' + cls + '" style="width:' + pct + '%">' +
          '<span class="confidence-meter__label">' + pct + '%</span>' +
        '</div>' +
      '</div>';
  };

  /* =========================================
   * Pipeline State Machine
   * ========================================= */
  App.Pipeline = {
    stages: ['Router', 'Retriever', 'Skeptic', 'Verifier', 'Critic'],
    currentStage: -1,
    playing: false,
    timer: null,
    speed: 1500,
    scenario: null,
    onUpdate: null,

    reset: function () {
      this.currentStage = -1;
      this.playing = false;
      clearInterval(this.timer);
      this.timer = null;
      this._notify();
    },

    play: function () {
      if (this.currentStage >= this.stages.length - 1) {
        this.reset();
      }
      this.playing = true;
      var self = this;
      this.timer = setInterval(function () {
        self.step();
        if (self.currentStage >= self.stages.length - 1) {
          self.pause();
        }
      }, this.speed);
      this._notify();
    },

    pause: function () {
      this.playing = false;
      clearInterval(this.timer);
      this.timer = null;
      this._notify();
    },

    step: function () {
      if (this.currentStage < this.stages.length - 1) {
        this.currentStage++;
        this._notify();
      }
    },

    setScenario: function (scenario) {
      this.scenario = scenario;
      this.reset();
    },

    getState: function () {
      return {
        stages: this.stages,
        currentStage: this.currentStage,
        playing: this.playing,
        scenario: this.scenario,
        stageStates: this.stages.map(function (name, idx) {
          var state = 'idle';
          if (idx < App.Pipeline.currentStage) { state = 'done'; }
          else if (idx === App.Pipeline.currentStage) { state = 'active'; }
          return { name: name, state: state, index: idx };
        })
      };
    },

    _notify: function () {
      if (typeof this.onUpdate === 'function') {
        this.onUpdate(this.getState());
      }
    }
  };

  /* =========================================
   * SVG Pipeline Renderer
   * ========================================= */
  App.renderPipelineSVG = function (containerId, state) {
    var container = document.getElementById(containerId);
    if (!container) { return; }

    var w = 800;
    var h = 120;
    var nodeW = 120;
    var nodeH = 50;
    var gap = 30;
    var startX = 20;
    var y = 35;
    var stages = state.stageStates;

    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pipeline visualization showing ' + stages.length + ' stages">';

    for (var i = 0; i < stages.length; i++) {
      var x = startX + i * (nodeW + gap);
      var s = stages[i];
      var fill, stroke, textFill;

      if (s.state === 'done') {
        fill = '#10b981'; stroke = '#059669'; textFill = '#fff';
      } else if (s.state === 'active') {
        fill = '#3b82f6'; stroke = '#60a5fa'; textFill = '#fff';
      } else {
        fill = '#334155'; stroke = '#475569'; textFill = '#94a3b8';
      }

      svg += '<rect x="' + x + '" y="' + y + '" width="' + nodeW + '" height="' + nodeH + '" rx="6" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"';
      if (s.state === 'active') {
        svg += '><animate attributeName="opacity" values="1;0.7;1" dur="1.2s" repeatCount="indefinite"/></rect>';
      } else {
        svg += '/>';
      }

      svg += '<text x="' + (x + nodeW / 2) + '" y="' + (y + nodeH / 2 + 5) + '" text-anchor="middle" fill="' + textFill + '" font-family="-apple-system,sans-serif" font-size="14" font-weight="bold">' + s.name + '</text>';

      if (i < stages.length - 1) {
        var arrowX = x + nodeW + 5;
        var arrowColor = s.state === 'done' ? '#10b981' : '#475569';
        svg += '<line x1="' + arrowX + '" y1="' + (y + nodeH / 2) + '" x2="' + (arrowX + gap - 10) + '" y2="' + (y + nodeH / 2) + '" stroke="' + arrowColor + '" stroke-width="2" marker-end="url(#arrowhead-' + i + ')"/>';
        svg += '<defs><marker id="arrowhead-' + i + '" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="' + arrowColor + '"/></marker></defs>';
      }
    }

    // Stage detail text below
    if (state.scenario && state.currentStage >= 0) {
      var sc = state.scenario;
      var details = [
        sc.classification || '',
        (sc.evidence && sc.evidence[0]) || '',
        sc.alternative || '',
        sc.validation || '',
        sc.approval || ''
      ];
      var detail = details[state.currentStage] || '';
      if (detail) {
        var detailTruncated = detail.length > 70 ? detail.substring(0, 67) + '...' : detail;
        svg += '<text x="' + (w / 2) + '" y="' + (y + nodeH + 25) + '" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="12">' + App.escapeHtml(detailTruncated) + '</text>';
      }
    }

    svg += '</svg>';
    container.innerHTML = svg;
  };

  /* =========================================
   * Utility
   * ========================================= */
  App.escapeHtml = function (str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  App.formatJSON = function (obj) {
    return App.escapeHtml(JSON.stringify(obj, null, 2));
  };

  /* =========================================
   * Keyboard Navigation Support
   * ========================================= */
  App.setupCardKeyboardNavigation = function () {
    var cards = document.querySelectorAll('.card--link');
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          window.location = this.getAttribute('href');
        } else if (event.key === 'Escape') {
          event.preventDefault();
          this.blur();
        }
      });
    }
  };

  /* =========================================
   * Initialize
   * ========================================= */
  App.init = function () {
    App.initNav();
    App.setupCardKeyboardNavigation();
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
  } else {
    App.init();
  }

  window.App = App;
})();
