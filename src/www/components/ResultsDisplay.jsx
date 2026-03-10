import React, { useState, useEffect } from 'react'
import PipelineVisualization from './PipelineVisualization'

export default function ResultsDisplay({ diagnosis, onReset, onExport }) {
  const [copied, setCopied] = useState(false)
  const { result } = diagnosis
  const confidence = (result.verifier.confidence * 100).toFixed(0)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosis, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const orch = diagnosis.orchestration

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="header-content">
          <h2>Analysis Complete</h2>
          <p className="subtitle">Your incident diagnosis is ready</p>
        </div>
        <div className={`confidence-badge confidence-${confidence > 85 ? 'high' : 'medium'}`}>
          <span className="confidence-value">{confidence}%</span>
          <span className="confidence-label">Confidence</span>
        </div>
      </div>

      {orch && orch.taskId && (
        <div className="orchestration-banner">
          <div className="orchestration-badge">
            <span className="orchestration-icon">⚙</span>
            <span className="orchestration-label">Task</span>
            <code className="orchestration-task-id">{orch.taskId}</code>
          </div>
          <div className={`orchestration-status status-${orch.status || 'unknown'}`}>
            {orch.status || 'unknown'}
          </div>
        </div>
      )}

      <div className="results-sections">
        {/* Pipeline */}
        <section className="result-section">
          <h3 className="section-title">Analysis Pipeline</h3>
          <PipelineVisualization result={result} />
        </section>

        {/* Root Cause */}
        <section className="result-section">
          <h3 className="section-title">🎯 Root Cause</h3>
          <div className="result-content">
            <p>{result.verifier.rootCause}</p>
          </div>
        </section>

        {/* Evidence */}
        <section className="result-section">
          <h3 className="section-title">📋 Evidence Found</h3>
          <div className="evidence-list">
            {result.retriever.evidence.map((item, idx) => (
              <div key={idx} className="evidence-item">
                <span className="evidence-icon">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Fix Plan */}
        <section className="result-section">
          <h3 className="section-title">🔧 Fix Plan</h3>
          <ol className="fix-list">
            {result.verifier.fixPlan.map((step, idx) => (
              <li key={idx} className="fix-item">
                <span className="step-number">{idx + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Rollback */}
        <section className="result-section">
          <h3 className="section-title">↩️ Rollback Plan</h3>
          <div className="result-content">
            <p>{result.verifier.rollback}</p>
          </div>
        </section>

        {/* Tests */}
        <section className="result-section">
          <h3 className="section-title">🧪 Recommended Tests</h3>
          <ul className="test-list">
            {result.verifier.tests.map((test, idx) => (
              <li key={idx} className="test-item">
                <span className="test-icon">▪</span>
                <span>{test}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="results-actions">
        <button
          className={`btn btn-secondary ${copied ? 'success' : ''}`}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy Results'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onExport('json')}
          title="Export as JSON"
        >
          📥 Export JSON
        </button>
        <button
          className="btn btn-primary"
          onClick={onReset}
          title="Start new diagnosis"
        >
          🔄 New Diagnosis
        </button>
      </div>
    </div>
  )
}
