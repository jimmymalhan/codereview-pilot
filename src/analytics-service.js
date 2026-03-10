/**
 * Claude Debug Copilot - Analytics Service
 * Backend service for collecting, storing, and analyzing user behavior data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AnalyticsService {
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.join(__dirname, '../logs/analytics');
    this.metricsFile = path.join(this.storageDir, 'metrics.json');
    this.eventsFile = path.join(this.storageDir, 'events.jsonl');
    this.sessionFile = path.join(this.storageDir, 'sessions.json');

    this.metrics = {
      total_events: 0,
      total_sessions: 0,
      page_views: {},
      cta_clicks: {},
      feature_interactions: {},
      form_submissions: 0,
      navigation_events: 0,
      device_metrics: {},
      error_count: 0,
      api_errors: 0,
      conversion_steps: {},
      scroll_depth_events: 0,
      time_on_page_total_ms: 0,
      skill_interactions: {},
      pipeline_events: 0,
      mcp_provider_switches: 0,
      agent_views: {},
      mobile_count: 0,
      desktop_count: 0,
      last_updated: new Date().toISOString()
    };

    this.sessions = {};
    this.eventBatches = [];

    this.initializeStorage();
    this.loadMetrics();
    this.loadSessions();
  }

  initializeStorage() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  processBatch(batch) {
    if (!batch || !batch.events || !Array.isArray(batch.events)) {
      throw new Error('Invalid batch format');
    }

    if (batch.events.length === 0) {
      throw new Error('Empty events array');
    }

    const sessionId = batch.session_id;
    const userId = batch.user_id;

    if (!this.sessions[sessionId]) {
      this.sessions[sessionId] = {
        session_id: sessionId,
        user_id: userId,
        first_event_time: batch.events[0]?.timestamp || Date.now(),
        last_event_time: Date.now(),
        event_count: 0,
        pages_visited: new Set(),
        device_info: null
      };
      this.metrics.total_sessions++;
    }

    this.sessions[sessionId].last_event_time = Date.now();

    for (const event of batch.events) {
      this.processEvent(event, sessionId);
      this.metrics.total_events++;
    }

    this.appendEventsLog(batch.events);
    this.saveMetrics();
    this.saveSessions();

    return {
      success: true,
      events_processed: batch.events.length,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    };
  }

  processEvent(event, sessionId) {
    const eventName = event.name;
    const eventData = event.data || {};

    switch (eventName) {
      case 'page_view':
        this.updatePageViewMetrics(eventData, sessionId);
        break;
      case 'cta_click':
        this.updateCtaClickMetrics(eventData);
        break;
      case 'navigation':
        this.metrics.navigation_events++;
        break;
      case 'feature_interaction':
        this.updateFeatureMetrics(eventData);
        break;
      case 'form_submission':
        this.metrics.form_submissions++;
        break;
      case 'scroll_depth':
        this.metrics.scroll_depth_events++;
        break;
      case 'time_on_page':
        this.metrics.time_on_page_total_ms += (eventData.time_ms || 0);
        break;
      case 'device_metrics':
        this.updateDeviceMetrics(eventData);
        break;
      case 'conversion_step':
        this.updateConversionMetrics(eventData);
        break;
      case 'error':
      case 'uncaught_error':
        this.metrics.error_count++;
        break;
      case 'api_error':
        this.metrics.api_errors++;
        break;
      case 'skills_interaction':
        this.updateSkillsMetrics(eventData);
        break;
      case 'pipeline_event':
        this.metrics.pipeline_events++;
        break;
      case 'mcp_provider_switch':
        this.metrics.mcp_provider_switches++;
        break;
      case 'agent_view':
        this.updateAgentMetrics(eventData);
        break;
    }
  }

  updatePageViewMetrics(eventData, sessionId) {
    const pageName = eventData.page_name || 'unknown';
    if (!this.metrics.page_views[pageName]) {
      this.metrics.page_views[pageName] = 0;
    }
    this.metrics.page_views[pageName]++;

    if (sessionId && this.sessions[sessionId]) {
      this.sessions[sessionId].pages_visited.add(pageName);
    }
  }

  updateCtaClickMetrics(eventData) {
    const ctaText = eventData.cta_text || 'unknown';
    if (!this.metrics.cta_clicks[ctaText]) {
      this.metrics.cta_clicks[ctaText] = 0;
    }
    this.metrics.cta_clicks[ctaText]++;
  }

  updateFeatureMetrics(eventData) {
    const feature = eventData.feature || 'unknown';
    if (!this.metrics.feature_interactions[feature]) {
      this.metrics.feature_interactions[feature] = {
        interactions: 0,
        actions: {}
      };
    }
    this.metrics.feature_interactions[feature].interactions++;

    const action = eventData.action || 'unknown';
    if (!this.metrics.feature_interactions[feature].actions[action]) {
      this.metrics.feature_interactions[feature].actions[action] = 0;
    }
    this.metrics.feature_interactions[feature].actions[action]++;
  }

  updateDeviceMetrics(eventData) {
    const deviceType = eventData.device_type || 'unknown';
    if (deviceType === 'mobile') {
      this.metrics.mobile_count++;
    } else if (deviceType === 'desktop') {
      this.metrics.desktop_count++;
    }

    if (!this.metrics.device_metrics[deviceType]) {
      this.metrics.device_metrics[deviceType] = 0;
    }
    this.metrics.device_metrics[deviceType]++;
  }

  updateConversionMetrics(eventData) {
    const step = eventData.step_name || 'unknown';
    if (!this.metrics.conversion_steps[step]) {
      this.metrics.conversion_steps[step] = {
        completed: 0,
        abandoned: 0,
        initiated: 0
      };
    }

    const status = eventData.status || 'initiated';
    if (this.metrics.conversion_steps[step][status] !== undefined) {
      this.metrics.conversion_steps[step][status]++;
    }
  }

  updateSkillsMetrics(eventData) {
    const skill = eventData.skill_name || 'unknown';
    if (!this.metrics.skill_interactions[skill]) {
      this.metrics.skill_interactions[skill] = {
        total: 0,
        success: 0,
        error: 0,
        validation_failed: 0
      };
    }
    this.metrics.skill_interactions[skill].total++;

    const result = eventData.result || 'unknown';
    if (this.metrics.skill_interactions[skill][result] !== undefined) {
      this.metrics.skill_interactions[skill][result]++;
    }
  }

  updateAgentMetrics(eventData) {
    const agent = eventData.agent_name || 'unknown';
    if (!this.metrics.agent_views[agent]) {
      this.metrics.agent_views[agent] = 0;
    }
    this.metrics.agent_views[agent]++;
  }

  appendEventsLog(events) {
    try {
      const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
      fs.appendFileSync(this.eventsFile, lines, 'utf-8');
    } catch (error) {
      console.error('Error appending to events log:', error);
    }
  }

  saveMetrics() {
    try {
      const metricsToSave = {
        ...this.metrics,
        last_updated: new Date().toISOString(),
        total_page_views: Object.values(this.metrics.page_views).reduce((a, b) => a + b, 0),
        total_cta_clicks: Object.values(this.metrics.cta_clicks).reduce((a, b) => a + b, 0),
        average_time_on_page_ms: this.metrics.total_events > 0
          ? Math.round(this.metrics.time_on_page_total_ms / (this.metrics.total_events || 1))
          : 0,
        mobile_percentage: this.metrics.total_events > 0
          ? Math.round((this.metrics.mobile_count / (this.metrics.mobile_count + this.metrics.desktop_count || 1)) * 100)
          : 0
      };

      fs.writeFileSync(this.metricsFile, JSON.stringify(metricsToSave, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf-8');
        const loaded = JSON.parse(data);
        this.metrics = { ...this.metrics, ...loaded };
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  saveSessions() {
    try {
      const sessionsToSave = {};
      for (const [key, session] of Object.entries(this.sessions)) {
        sessionsToSave[key] = {
          ...session,
          pages_visited: Array.from(session.pages_visited || [])
        };
      }
      fs.writeFileSync(this.sessionFile, JSON.stringify(sessionsToSave, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  loadSessions() {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const data = fs.readFileSync(this.sessionFile, 'utf-8');
        const loaded = JSON.parse(data);
        for (const [key, session] of Object.entries(loaded)) {
          this.sessions[key] = {
            ...session,
            pages_visited: new Set(session.pages_visited || [])
          };
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      total_page_views: Object.values(this.metrics.page_views).reduce((a, b) => a + b, 0),
      total_cta_clicks: Object.values(this.metrics.cta_clicks).reduce((a, b) => a + b, 0),
      average_time_on_page_ms: this.metrics.total_events > 0
        ? Math.round(this.metrics.time_on_page_total_ms / (this.metrics.total_events || 1))
        : 0,
      mobile_percentage: this.metrics.mobile_count + this.metrics.desktop_count > 0
        ? Math.round((this.metrics.mobile_count / (this.metrics.mobile_count + this.metrics.desktop_count)) * 100)
        : 0,
      timestamp: new Date().toISOString()
    };
  }

  getSessionAnalytics() {
    const sessions = Object.values(this.sessions);
    return {
      total_sessions: sessions.length,
      average_pages_per_session: sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.pages_visited.size, 0) / sessions.length)
        : 0,
      active_sessions: sessions.filter(s => (Date.now() - s.last_event_time) < 1800000).length,
      timestamp: new Date().toISOString()
    };
  }

  getConversionFunnel() {
    const funnel = {
      home_viewed: this.metrics.page_views['home'] || 0,
      pipeline_viewed: this.metrics.page_views['pipeline'] || 0,
      skills_viewed: this.metrics.page_views['skills'] || 0,
      conversion_rate_to_pipeline: 0,
      conversion_rate_to_skills: 0
    };

    if (funnel.home_viewed > 0) {
      funnel.conversion_rate_to_pipeline = Math.round((funnel.pipeline_viewed / funnel.home_viewed) * 100);
      funnel.conversion_rate_to_skills = Math.round((funnel.skills_viewed / funnel.home_viewed) * 100);
    }

    return funnel;
  }

  getErrorAnalytics() {
    return {
      total_errors: this.metrics.error_count,
      api_errors: this.metrics.api_errors,
      error_rate: this.metrics.total_events > 0
        ? Math.round((this.metrics.error_count / this.metrics.total_events) * 100)
        : 0,
      timestamp: new Date().toISOString()
    };
  }
}

export default AnalyticsService;
