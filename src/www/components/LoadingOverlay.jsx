import React, { useState, useEffect, useRef } from 'react'

const STAGES = [
  { name: 'Router', emoji: '🔍', description: 'Classifying failure type', duration: 5 },
  { name: 'Retriever', emoji: '📋', description: 'Gathering evidence', duration: 8 },
  { name: 'Skeptic', emoji: '🤔', description: 'Generating competing theory', duration: 6 },
  { name: 'Verifier', emoji: '✓', description: 'Validating root cause', duration: 7 }
]

const TOTAL_ESTIMATED_SECONDS = STAGES.reduce((sum, s) => sum + s.duration, 0)

export default function LoadingOverlay({ onCancel }) {
  const [activeStage, setActiveStage] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  useEffect(() => {
    let cumulativeTime = 0
    const timeouts = STAGES.map((stage, idx) => {
      cumulativeTime += stage.duration
      return setTimeout(() => {
        setActiveStage(idx + 1)
      }, cumulativeTime * 1000)
    })

    return () => timeouts.forEach(clearTimeout)
  }, [])

  const remainingSeconds = Math.max(0, TOTAL_ESTIMATED_SECONDS - elapsedSeconds)
  const currentStage = STAGES[Math.min(activeStage, STAGES.length - 1)]

  return (
    <div className="loading-overlay" role="dialog" aria-label="Analysis in progress" aria-busy="true">
      <div className="loading-content">
        <h2>Analyzing Your Incident</h2>
        <p className="loading-current-stage" aria-live="polite">
          {currentStage.description}...
        </p>

        <div className="loading-pipeline" role="list" aria-label="Analysis stages">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < activeStage
            const isActive = idx === activeStage && activeStage < STAGES.length
            return (
              <div
                key={idx}
                className={`loading-stage ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                role="listitem"
                aria-label={`${stage.name}: ${isCompleted ? 'completed' : isActive ? 'in progress' : 'pending'}`}
              >
                <div className="stage-indicator">
                  {isCompleted ? (
                    <span className="stage-check" aria-hidden="true">✓</span>
                  ) : (
                    <span className={`stage-spinner ${isActive ? 'spinning' : ''}`} aria-hidden="true"></span>
                  )}
                </div>
                <span className="stage-name">{stage.emoji} {stage.name}</span>
              </div>
            )
          })}
        </div>

        <p className="loading-message" aria-live="polite">
          Running 4-agent pipeline to find the root cause...
        </p>

        <div className="loading-progress">
          <div className="progress-bar" role="progressbar" aria-valuenow={activeStage} aria-valuemin={0} aria-valuemax={STAGES.length}>
            <div
              className="progress-fill"
              style={{
                width: `${(activeStage / STAGES.length) * 100}%`
              }}
            ></div>
          </div>
          <div className="progress-details">
            <span className="progress-text">
              {activeStage}/{STAGES.length} stages
            </span>
            <span className="progress-estimate" aria-live="polite">
              ~{remainingSeconds}s remaining
            </span>
          </div>
        </div>

        {onCancel && (
          <button
            className="btn btn-secondary btn-cancel"
            onClick={onCancel}
            aria-label="Cancel analysis"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
