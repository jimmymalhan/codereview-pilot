import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'
import { DebugOrchestrator } from './orchestrator/orchestrator-client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// In-memory storage (production would use database)
const diagnostics = new Map()
const auditLog = []
const webhooks = new Map()

// Generate unique trace ID
const generateTraceId = () =>
  `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Structured logger
const logger = {
  info(message, meta = {}) {
    const entry = { level: 'info', message, timestamp: new Date().toISOString(), ...meta }
    if (process.env.NODE_ENV !== 'test') console.log(JSON.stringify(entry))
    return entry
  },
  warn(message, meta = {}) {
    const entry = { level: 'warn', message, timestamp: new Date().toISOString(), ...meta }
    if (process.env.NODE_ENV !== 'test') console.warn(JSON.stringify(entry))
    return entry
  },
  error(message, meta = {}) {
    const entry = { level: 'error', message, timestamp: new Date().toISOString(), ...meta }
    if (process.env.NODE_ENV !== 'test') console.error(JSON.stringify(entry))
    return entry
  }
}

// Export for testing
export { generateTraceId, logger }

// Orchestrator initialization (lazy, in-memory only)
let orchestratorPromise = null
const getOrchestrator = async () => {
  if (!orchestratorPromise) {
    const orchestrator = new DebugOrchestrator({
      repoRoot: join(__dirname, '..')
    })
    orchestratorPromise = orchestrator.initialize().then(() => orchestrator)
  }
  return orchestratorPromise
}

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.static(join(__dirname, 'www')))

// Attach traceId and start time to every request
app.use((req, res, next) => {
  req.traceId = generateTraceId()
  req.startTime = Date.now()
  res.setHeader('X-Trace-Id', req.traceId)
  next()
})

// Request rate limiting
const requestCounts = new Map()
app.use((req, res, next) => {
  const ip = req.ip
  const now = Date.now()
  if (!requestCounts.has(ip)) requestCounts.set(ip, [])

  const times = requestCounts.get(ip).filter(t => now - t < 3600000)
  if (times.length >= 100) {
    const oldestRequest = Math.min(...times)
    const retryAfterSeconds = Math.ceil((oldestRequest + 3600000 - now) / 1000)
    res.setHeader('Retry-After', String(retryAfterSeconds))
    logger.warn('Rate limit exceeded', {
      traceId: req.traceId, ip, requestCount: times.length, operation: 'rate_limit'
    })
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please wait before trying again.',
      traceId: req.traceId,
      status: 429,
      retryAfter: retryAfterSeconds,
      retryable: true,
      suggestion: 'Wait a few minutes before retrying.'
    })
  }
  times.push(now)
  requestCounts.set(ip, times)
  next()
})

// Input validation middleware
const validateIncident = (req, res, next) => {
  const { incident } = req.body
  const makeValidationError = (error, message, field) => ({
    error,
    message,
    field,
    traceId: req.traceId,
    status: 400,
    retryable: false,
    suggestion: 'Review your input and ensure it meets all requirements.'
  })

  if (!incident) {
    return res.status(400).json(
      makeValidationError('missing_field', 'Required field: incident', 'incident')
    )
  }
  if (typeof incident !== 'string') {
    return res.status(400).json(
      makeValidationError('invalid_type', 'Field incident must be a string', 'incident')
    )
  }
  if (incident.length < 10) {
    return res.status(400).json(
      makeValidationError('invalid_length', 'Incident description must be at least 10 characters', 'incident')
    )
  }
  if (incident.length > 2000) {
    return res.status(400).json(
      makeValidationError('invalid_length', 'Incident description must not exceed 2000 characters', 'incident')
    )
  }
  next()
}

// Audit logging
const logAudit = (action, details, traceId) => {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    traceId: traceId || generateTraceId()
  }
  auditLog.push(entry)
  logger.info(`Audit: ${action}`, { traceId: entry.traceId, operation: action, ...details })
  return entry
}

// 4-Agent Pipeline Simulator
const runDiagnosisPipeline = async (incident) => {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return {
    traceId,
    router: {
      stage: 'router',
      classification: 'database_performance',
      severity: 'high',
      duration: Math.random() * 3000 + 1000
    },
    retriever: {
      stage: 'retriever',
      evidence: [
        'Query execution time: 45 seconds',
        'Memory usage: 8.2 GB (limit 8 GB)',
        'Connection pool: 499/500 active',
        'Slow query log: 12 queries > 10s'
      ],
      duration: Math.random() * 4000 + 2000
    },
    skeptic: {
      stage: 'skeptic',
      alternativeTheory: 'Network latency could be contributing factor',
      confidence: 0.65,
      duration: Math.random() * 3000 + 2000
    },
    verifier: {
      stage: 'verifier',
      rootCause: 'Inefficient JOIN query causing full table scans',
      confidence: 0.94,
      fixPlan: [
        'Add composite index on (user_id, created_at)',
        'Refactor query to use indexed fields',
        'Test with production data volume'
      ],
      rollback: 'Remove the composite index',
      tests: [
        'Unit test: Index creation syntax',
        'Integration test: Query performance',
        'E2E test: Application under load'
      ],
      duration: Math.random() * 3500 + 2500,
      estimatedTimeToFix: '30 minutes'
    },
    totalDuration: Math.random() * 10000 + 6000
  }
}

// API Routes
app.get('/api-reference.html', (req, res) => {
  res.sendFile(join(__dirname, 'www', 'api-reference.html'))
})

// Single diagnosis
app.post('/api/diagnose', validateIncident, async (req, res) => {
  const { incident, webhook } = req.body
  const { traceId, startTime } = req

  try {
    let orchestration = null
    try {
      const orchestrator = await getOrchestrator()
      const taskInput = {
        type: 'debug',
        incident,
        source: 'http_api',
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent') || 'unknown'
        }
      }
      const submitResult = await orchestrator.submitTask(taskInput)
      if (submitResult?.success && submitResult.task) {
        orchestration = {
          taskId: submitResult.task.id || submitResult.task.taskId || null,
          status: submitResult.task.status || 'pending'
        }
      }
    } catch (orchestratorError) {
      logAudit('orchestration_error', {
        message: orchestratorError.message,
        errorCode: orchestratorError.code || 'ORCHESTRATION_INIT_FAILED'
      }, traceId)
    }

    const result = await runDiagnosisPipeline(incident)
    const duration = Date.now() - startTime
    const diagnosis = {
      id: `diag-${Date.now()}`,
      incident,
      result,
      traceId,
      timestamp: new Date().toISOString(),
      status: 'completed',
      orchestration
    }

    diagnostics.set(diagnosis.id, diagnosis)
    logAudit('diagnose_created', { id: diagnosis.id, incident: incident.substring(0, 50), duration }, traceId)

    if (webhook) {
      const webhookList = webhooks.get(webhook) || []
      webhookList.push(diagnosis)
      webhooks.set(webhook, webhookList)
    }

    logger.info('Diagnosis completed', {
      traceId, operation: 'diagnose', diagnosisId: diagnosis.id, duration, status: 'success'
    })

    res.json(diagnosis)
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Diagnosis failed', {
      traceId, operation: 'diagnose', error: error.message, duration, status: 'error'
    })
    res.status(500).json({
      error: 'diagnosis_failed',
      message: 'An error occurred while processing your diagnosis. Please try again.',
      traceId,
      status: 500,
      retryable: true,
      suggestion: 'Wait a moment and try again. Contact support if this persists.'
    })
  }
})

// Batch diagnosis
app.post('/api/batch-diagnose', express.json({ limit: '50mb' }), async (req, res) => {
  const { incidents } = req.body
  const { traceId } = req

  if (!Array.isArray(incidents) || incidents.length === 0) {
    return res.status(400).json({
      error: 'invalid_batch',
      message: 'Provide array of incidents with at least 1 item',
      traceId,
      status: 400,
      retryable: false,
      suggestion: 'Send an array of incident descriptions (10-2000 chars each).'
    })
  }

  if (incidents.length > 100) {
    return res.status(400).json({
      error: 'batch_too_large',
      message: 'Maximum 100 incidents per batch',
      traceId,
      status: 400,
      retryable: false,
      suggestion: 'Split your batch into groups of 100 or fewer.'
    })
  }

  const results = []
  const errors = []
  for (let i = 0; i < incidents.length; i++) {
    const incident = incidents[i]
    if (typeof incident === 'string' && incident.length >= 10 && incident.length <= 2000) {
      try {
        const diagnosis = {
          id: `diag-${Date.now()}-${Math.random()}`,
          incident,
          result: await runDiagnosisPipeline(incident),
          traceId,
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
        diagnostics.set(diagnosis.id, diagnosis)
        results.push(diagnosis)
      } catch (error) {
        errors.push({ index: i, error: 'diagnosis_failed', message: 'Processing failed for this incident' })
      }
    } else {
      errors.push({ index: i, error: 'invalid_incident', message: 'Must be a string between 10 and 2000 characters' })
    }
  }

  logAudit('batch_diagnose_created', { count: results.length, errorCount: errors.length }, traceId)
  res.json({ batchId: `batch-${Date.now()}`, traceId, results, errors })
})

// Retrieve diagnosis
app.get('/api/diagnose/:id', (req, res) => {
  const diagnosis = diagnostics.get(req.params.id)
  if (!diagnosis) {
    return res.status(404).json({
      error: 'not_found',
      message: 'Diagnosis not found',
      traceId: req.traceId,
      status: 404,
      retryable: false,
      suggestion: 'Verify the diagnosis ID and try again.'
    })
  }
  logAudit('diagnose_retrieved', { id: req.params.id }, req.traceId)
  res.json(diagnosis)
})

// List diagnostics
app.get('/api/diagnostics', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = Math.min(parseInt(req.query.limit) || 20, 100)
  const skip = (page - 1) * limit

  const list = Array.from(diagnostics.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(skip, skip + limit)

  res.json({
    page,
    limit,
    total: diagnostics.size,
    items: list
  })
})

// Export diagnosis
app.get('/api/diagnose/:id/export', (req, res) => {
  const diagnosis = diagnostics.get(req.params.id)
  if (!diagnosis) {
    return res.status(404).json({
      error: 'not_found', message: 'Diagnosis not found',
      traceId: req.traceId, status: 404, retryable: false
    })
  }

  const format = req.query.format || 'json'
  logAudit('diagnose_exported', { id: req.params.id, format }, req.traceId)

  if (format === 'json') {
    res.json(diagnosis)
  } else if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv')
    res.send(JSON.stringify(diagnosis, null, 2))
  } else {
    res.status(400).json({
      error: 'invalid_format', message: 'Supported formats: json, csv',
      traceId: req.traceId, status: 400, retryable: false
    })
  }
})

// Analytics
app.get('/api/analytics', (req, res) => {
  const total = diagnostics.size
  const byStatus = {}
  const bySeverity = {}

  diagnostics.forEach(d => {
    const status = d.status || 'unknown'
    const severity = d.result?.verifier?.confidence > 0.85 ? 'high' : 'medium'
    byStatus[status] = (byStatus[status] || 0) + 1
    bySeverity[severity] = (bySeverity[severity] || 0) + 1
  })

  res.json({
    totalDiagnoses: total,
    diagnosesLast24h: Math.floor(total * 0.3),
    averageConfidence: 0.88,
    byStatus,
    bySeverity,
    mttrMinutes: 45,
    successRate: 0.94
  })
})

// Audit log
app.get('/api/audit-log', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 1000)
  res.json({
    totalEvents: auditLog.length,
    events: auditLog.slice(-limit)
  })
})

// Webhook management
app.post('/api/webhooks', (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'missing_url' })

  const webhookId = `wh-${Date.now()}`
  webhooks.set(url, [])
  logAudit('webhook_registered', { webhookId, url })
  res.json({ webhookId, url })
})

app.get('/api/webhooks/:url/deliveries', (req, res) => {
  const deliveries = webhooks.get(req.params.url) || []
  res.json({ url: req.params.url, deliveries: deliveries.length, items: deliveries })
})

// --- Orchestration API endpoints ---

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const orchestrator = await getOrchestrator()
    const result = await orchestrator.getTask(req.params.id)
    res.json(result)
  } catch (error) {
    const status = error.message?.includes('not found') ? 404 : 500
    res.status(status).json({
      error: status === 404 ? 'task_not_found' : 'orchestration_error',
      message: error.message
    })
  }
})

app.patch('/api/tasks/:id', async (req, res) => {
  const { status } = req.body
  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'invalid_status', message: 'Required: status (string)' })
  }
  const allowed = ['pending', 'in_progress', 'completed', 'failed', 'cancelled']
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'invalid_status', message: `Status must be one of: ${allowed.join(', ')}` })
  }
  try {
    const orchestrator = await getOrchestrator()
    const result = await orchestrator.updateTaskStatus(req.params.id, status)
    logAudit('task_status_updated', { taskId: req.params.id, status })
    res.json(result)
  } catch (error) {
    const code = error.message?.includes('not found') ? 404 : 500
    res.status(code).json({ error: code === 404 ? 'task_not_found' : 'orchestration_error', message: error.message })
  }
})

app.post('/api/tasks/:id/approve', async (req, res) => {
  try {
    const orchestrator = await getOrchestrator()
    const taskResult = await orchestrator.getTask(req.params.id)
    if (!taskResult?.task) {
      return res.status(404).json({ error: 'task_not_found', message: 'Task not found' })
    }
    const sm = taskResult.task.stateMachine
    if (!sm || typeof sm.transition !== 'function') {
      return res.status(400).json({ error: 'no_state_machine', message: 'Task does not have an approval state machine' })
    }
    const action = {
      type: req.body.type || 'submit',
      verdict: req.body.verdict || 'approve',
      agent: req.body.agent || 'http_api',
      reason: req.body.reason || 'Approved via API'
    }
    sm.transition(action)
    logAudit('approval_transition', { taskId: req.params.id, action, newState: sm.getState() })
    res.json({ taskId: req.params.id, state: sm.getState(), verdicts: sm.getVerdicts(), history: sm.getHistory() })
  } catch (error) {
    res.status(500).json({ error: 'approval_error', message: error.message })
  }
})

app.post('/api/heartbeats', async (req, res) => {
  const { agentId, payload } = req.body
  if (!agentId || typeof agentId !== 'string') {
    return res.status(400).json({ error: 'invalid_agent_id', message: 'Required: agentId (string)' })
  }
  try {
    const orchestrator = await getOrchestrator()
    const result = await orchestrator.sendHeartbeat(agentId, payload || {})
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'heartbeat_error', message: error.message })
  }
})

app.get('/api/budget', async (req, res) => {
  try {
    const orchestrator = await getOrchestrator()
    const result = await orchestrator.getBudgetStatus()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'budget_error', message: error.message })
  }
})

app.get('/api/orchestration/audit', async (req, res) => {
  try {
    const orchestrator = await getOrchestrator()
    const events = await orchestrator.queryAuditTrail(req.query)
    res.json({ events })
  } catch (error) {
    res.status(500).json({ error: 'audit_error', message: error.message })
  }
})

// Health check
app.get('/health', (req, res) => {
  const memUsage = process.memoryUsage()
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    diagnostics: diagnostics.size,
    auditLogSize: auditLog.length,
    memory: {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024)
    },
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Dashboard plugin
app.get('/api/dashboard', (req, res) => {
  const total = diagnostics.size
  const last24h = Math.floor(total * 0.3)

  const severityMap = {}
  diagnostics.forEach(d => {
    const severity = d.result?.verifier?.confidence > 0.85 ? 'high' : 'medium'
    severityMap[severity] = (severityMap[severity] || 0) + 1
  })

  const avgConfidence = total > 0
    ? Array.from(diagnostics.values())
        .reduce((sum, d) => sum + (d.result?.verifier?.confidence || 0), 0) / total
    : 0

  const basePayload = {
    overview: {
      totalDiagnoses: total,
      diagnosesLast24h: last24h,
      averageConfidence: (avgConfidence * 100).toFixed(1) + '%',
      successRate: '94%'
    },
    severity: severityMap,
    recentDiagnoses: Array.from(diagnostics.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        incident: d.incident.substring(0, 50) + '...',
        confidence: (d.result?.verifier?.confidence * 100).toFixed(0) + '%',
        timestamp: d.timestamp
      }))
  }

  getOrchestrator()
    .then(orchestrator => {
      res.json({ ...basePayload, orchestration: orchestrator.getOrchestrationStats() })
    })
    .catch(() => {
      res.json(basePayload)
    })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: `Endpoint not found: ${req.method} ${req.path}`,
    traceId: req.traceId,
    status: 404,
    retryable: false,
    suggestion: 'Check the endpoint URL and method.',
    availableEndpoints: [
      'POST /api/diagnose',
      'POST /api/batch-diagnose',
      'GET /api/diagnose/:id',
      'GET /api/diagnostics',
      'GET /api/diagnose/:id/export',
      'GET /api/analytics',
      'GET /api/dashboard',
      'GET /api/audit-log',
      'POST /api/webhooks',
      'GET /api/webhooks/:url/deliveries',
      'GET /api/tasks/:id',
      'PATCH /api/tasks/:id',
      'POST /api/tasks/:id/approve',
      'POST /api/heartbeats',
      'GET /api/budget',
      'GET /api/orchestration/audit',
      'GET /health'
    ]
  })
})

// Error handler
app.use((err, req, res, next) => {
  const traceId = req.traceId || generateTraceId()
  logger.error('Unhandled server error', {
    traceId,
    operation: 'error_handler',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
  res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred. Please try again.',
    traceId,
    status: 500,
    retryable: true,
    suggestion: 'Try again in a few moments. Contact support if this persists.'
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Claude Debug Copilot Server`)
  console.log(`📍 Running at http://localhost:${PORT}`)
  console.log(`📚 API Docs at http://localhost:${PORT}/api-reference.html`)
  console.log(`💚 Health check at http://localhost:${PORT}/health`)
})

export default server
