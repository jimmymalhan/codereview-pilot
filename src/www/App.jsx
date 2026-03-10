import React, { useState, useCallback, useEffect, useRef } from 'react'
import DiagnosisForm from './components/DiagnosisForm'
import ResultsDisplay from './components/ResultsDisplay'
import DashboardPanel from './components/DashboardPanel'
import NavigationBar from './components/NavigationBar'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { getClient } from './api/client'
import { classifyError } from './api/errors'
import './styles/app.css'
import './styles/motion.css'
import './styles/animated-components.css'
import './styles/micro-interactions.css'

const apiClient = getClient()

function formatDiagnosisCSV(diagnosis) {
  const { result } = diagnosis
  const rows = [
    ['Section', 'Content'],
    ['Incident', diagnosis.incident || ''],
    ['Root Cause', result.verifier.rootCause || ''],
    ['Confidence', `${(result.verifier.confidence * 100).toFixed(0)}%`],
    ['Rollback', result.verifier.rollback || '']
  ]
  if (result.retriever.evidence) {
    result.retriever.evidence.forEach((e, i) => rows.push([`Evidence ${i + 1}`, e]))
  }
  if (result.verifier.fixPlan) {
    result.verifier.fixPlan.forEach((s, i) => rows.push([`Fix Step ${i + 1}`, s]))
  }
  if (result.verifier.tests) {
    result.verifier.tests.forEach((t, i) => rows.push([`Test ${i + 1}`, t]))
  }
  return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export default function App() {
  const [stage, setStage] = useState('form') // form, loading, results, error
  const [diagnosis, setDiagnosis] = useState(null)
  const [error, setError] = useState(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const abortRef = useRef(null)

  // Fetch dashboard data
  useEffect(() => {
    if (showDashboard) {
      fetchDashboard()
    }
  }, [showDashboard])

  const fetchDashboard = async () => {
    try {
      const data = await apiClient.get('/dashboard')
      setDashboardData(data)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Dashboard error:', err)
      }
    }
  }

  const handleSubmit = useCallback(async (incident) => {
    if (!incident || incident.length < 10) {
      setError({
        message: 'Incident description must be at least 10 characters',
        suggestion: 'Add more detail about the failure, including symptoms and timeline.',
        retryable: false
      })
      setStage('error')
      return
    }

    setStage('loading')
    setError(null)

    try {
      const data = await apiClient.post('/diagnose', { incident })
      setDiagnosis(data)
      setStage('results')
    } catch (err) {
      const classified = classifyError(err)
      setError({
        message: classified.userMessage || err.message,
        suggestion: classified.suggestion || 'Try again or contact support.',
        retryable: classified.retryable !== false
      })
      setStage('error')
    }
  }, [])

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setStage('form')
    setError(null)
  }, [])

  const handleReset = useCallback(() => {
    setStage('form')
    setDiagnosis(null)
    setError(null)
    setFormResetKey(prev => prev + 1)
  }, [])

  const handleRetry = useCallback(() => {
    setStage('form')
    setError(null)
  }, [])

  const handleExport = useCallback((format = 'json') => {
    if (!diagnosis) return

    let dataStr, mimeType, extension
    if (format === 'csv') {
      dataStr = formatDiagnosisCSV(diagnosis)
      mimeType = 'text/csv'
      extension = 'csv'
    } else {
      dataStr = JSON.stringify(diagnosis, null, 2)
      mimeType = 'application/json'
      extension = 'json'
    }

    const blob = new Blob([dataStr], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `diagnosis-${Date.now()}.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  }, [diagnosis])

  return (
    <ThemeProvider>
      <ErrorBoundary onReset={handleReset}>
        <div className="app">
          <NavigationBar
            onDashboardToggle={() => setShowDashboard(!showDashboard)}
            showDashboard={showDashboard}
          />

          <main className="app-main">
            {stage === 'loading' && <LoadingOverlay onCancel={handleCancel} />}

            <div className="app-container">
              {stage === 'form' && (
                <DiagnosisForm onSubmit={handleSubmit} resetKey={formResetKey} />
              )}

              {stage === 'results' && diagnosis && (
                <ResultsDisplay
                  diagnosis={diagnosis}
                  onReset={handleReset}
                  onExport={handleExport}
                />
              )}

              {stage === 'error' && error && (
                <div className="error-container" role="alert" aria-live="assertive">
                  <div className="error-box">
                    <div className="error-icon" aria-hidden="true">⚠️</div>
                    <h2>Something went wrong</h2>
                    <p className="error-message">{error.message}</p>
                    {error.suggestion && (
                      <p className="error-suggestion">{error.suggestion}</p>
                    )}
                    <div className="error-actions">
                      {error.retryable && (
                        <button className="btn btn-primary" onClick={handleRetry}>
                          Retry
                        </button>
                      )}
                      <button className="btn btn-secondary" onClick={handleReset}>
                        Start Over
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showDashboard && dashboardData && (
                <DashboardPanel data={dashboardData} />
              )}
            </div>
          </main>

          <footer className="app-footer">
            <p>Claude Debug Copilot v3.0 — Production-Ready Incident Diagnosis</p>
            <p>© 2026 All rights reserved</p>
          </footer>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
