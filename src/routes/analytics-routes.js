/**
 * CodeReview-Pilot - Analytics API Routes
 */

export function initAnalyticsRoutes(app, analyticsService) {
  app.post('/api/analytics/batch', (req, res) => {
    try {
      const batch = req.body;

      if (!batch.session_id || !batch.events || !Array.isArray(batch.events)) {
        return res.status(400).json({
          error: 'Invalid batch format',
          required: ['session_id', 'events (array)']
        });
      }

      if (batch.events.length === 0) {
        return res.status(400).json({
          error: 'Empty events array'
        });
      }

      if (batch.events.length > 1000) {
        return res.status(413).json({
          error: 'Batch too large (max 1000 events)'
        });
      }

      const result = analyticsService.processBatch(batch);
      res.json(result);
    } catch (error) {
      console.error('Error processing analytics batch:', error);
      res.status(500).json({
        error: 'Failed to process batch',
        message: error.message
      });
    }
  });

  app.get('/api/analytics/metrics', (req, res) => {
    try {
      const metrics = analyticsService.getMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        error: 'Failed to retrieve metrics'
      });
    }
  });

  app.get('/api/analytics/sessions', (req, res) => {
    try {
      const sessionAnalytics = analyticsService.getSessionAnalytics();
      res.json(sessionAnalytics);
    } catch (error) {
      console.error('Error getting session analytics:', error);
      res.status(500).json({
        error: 'Failed to retrieve session analytics'
      });
    }
  });

  app.get('/api/analytics/conversion-funnel', (req, res) => {
    try {
      const funnel = analyticsService.getConversionFunnel();
      res.json(funnel);
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      res.status(500).json({
        error: 'Failed to retrieve conversion funnel'
      });
    }
  });

  app.get('/api/analytics/errors', (req, res) => {
    try {
      const errorAnalytics = analyticsService.getErrorAnalytics();
      res.json(errorAnalytics);
    } catch (error) {
      console.error('Error getting error analytics:', error);
      res.status(500).json({
        error: 'Failed to retrieve error analytics'
      });
    }
  });

  app.get('/api/analytics/dashboard', (req, res) => {
    try {
      const metrics = analyticsService.getMetrics();
      const sessions = analyticsService.getSessionAnalytics();
      const funnel = analyticsService.getConversionFunnel();
      const errors = analyticsService.getErrorAnalytics();

      res.json({
        summary: {
          total_events: metrics.total_events,
          total_sessions: sessions.total_sessions,
          total_page_views: metrics.total_page_views,
          total_cta_clicks: metrics.total_cta_clicks,
          total_errors: errors.total_errors,
          timestamp: new Date().toISOString()
        },
        engagement: {
          average_time_on_page_ms: metrics.average_time_on_page_ms,
          average_pages_per_session: sessions.average_pages_per_session,
          active_sessions: sessions.active_sessions,
          scroll_depth_events: metrics.scroll_depth_events,
          form_submissions: metrics.form_submissions,
          navigation_events: metrics.navigation_events
        },
        device_breakdown: {
          mobile_count: metrics.mobile_count,
          desktop_count: metrics.desktop_count,
          mobile_percentage: metrics.mobile_percentage,
          devices: metrics.device_metrics
        },
        pages: metrics.page_views,
        cta_clicks: metrics.cta_clicks,
        features: metrics.feature_interactions,
        skills: metrics.skill_interactions,
        agents: metrics.agent_views,
        conversion_funnel: funnel,
        error_analytics: errors,
        pipeline_stats: {
          total_pipeline_events: metrics.pipeline_events,
          mcp_provider_switches: metrics.mcp_provider_switches
        }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({
        error: 'Failed to retrieve dashboard data'
      });
    }
  });

  app.get('/api/analytics/page-views', (req, res) => {
    try {
      const metrics = analyticsService.getMetrics();
      const total = Object.values(metrics.page_views).reduce((a, b) => a + b, 0);

      const breakdown = {};
      for (const [page, count] of Object.entries(metrics.page_views)) {
        breakdown[page] = {
          views: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        };
      }

      res.json({
        total_page_views: total,
        breakdown: breakdown,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting page views:', error);
      res.status(500).json({
        error: 'Failed to retrieve page views'
      });
    }
  });

  app.get('/api/analytics/feature-usage', (req, res) => {
    try {
      const metrics = analyticsService.getMetrics();
      res.json({
        features: metrics.feature_interactions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting feature usage:', error);
      res.status(500).json({
        error: 'Failed to retrieve feature usage'
      });
    }
  });

  app.get('/api/analytics/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'analytics',
      timestamp: new Date().toISOString()
    });
  });
}
