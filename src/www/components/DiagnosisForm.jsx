import React, { useState, useRef, useEffect } from 'react'

const MAX_LENGTH = 2000
const MIN_LENGTH = 10

export default function DiagnosisForm({ onSubmit, resetKey }) {
  const [incident, setIncident] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (resetKey) {
      setIncident('')
      setCharCount(0)
      setIsValid(false)
      setSubmitted(false)
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }, [resetKey])

  const handleChange = (e) => {
    const value = e.target.value
    setIncident(value)
    setCharCount(value.length)
    setIsValid(value.length >= MIN_LENGTH && value.length <= MAX_LENGTH)
    if (submitted) setSubmitted(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) {
      setSubmitted(true)
      onSubmit(incident)
    }
  }

  const percentage = (charCount / MAX_LENGTH) * 100
  const validationMessage = charCount === 0
    ? `Enter at least ${MIN_LENGTH} characters to describe your incident`
    : charCount < MIN_LENGTH
      ? `Need at least ${MIN_LENGTH - charCount} more characters`
      : charCount >= MAX_LENGTH
        ? 'Maximum length reached'
        : 'Ready to submit'

  return (
    <div className="diagnosis-form-container" role="region" aria-label="Incident diagnosis form">
      <div className="form-header">
        <h1>Diagnose Your Incident</h1>
        <p>Describe what's happening and get instant root cause analysis with a fix plan.</p>
      </div>

      <form onSubmit={handleSubmit} className="diagnosis-form" aria-label="Diagnosis submission form">
        <div className="form-group">
          <label htmlFor="incident" className="form-label">
            What's the problem?
          </label>

          <div className="textarea-wrapper">
            <textarea
              ref={textareaRef}
              id="incident"
              className={`form-textarea ${charCount > 0 && !isValid ? 'invalid' : ''} ${isValid ? 'valid' : ''}`}
              placeholder="Example: Database queries are timing out. API responses went from 2s to 45s. Error rate at 15%."
              value={incident}
              onChange={handleChange}
              minLength={MIN_LENGTH}
              maxLength={MAX_LENGTH}
              aria-describedby="incident-hint incident-counter"
              aria-invalid={charCount > 0 && !isValid}
              aria-required="true"
              disabled={submitted}
            />
            <div className="char-counter" id="incident-counter" aria-live="polite">
              <span>{charCount}</span>
              <span className="separator">/</span>
              <span className="max">{MAX_LENGTH}</span>
            </div>
          </div>

          <div className="progress-bar" role="progressbar" aria-valuenow={charCount} aria-valuemin={0} aria-valuemax={MAX_LENGTH}>
            <div
              className={`progress-fill ${
                charCount < MIN_LENGTH
                  ? 'insufficient'
                  : charCount < MAX_LENGTH
                    ? 'valid'
                    : 'full'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <p
            id="incident-hint"
            className={`form-hint ${charCount >= MIN_LENGTH && charCount <= MAX_LENGTH ? 'success' : charCount > 0 ? 'error' : ''}`}
            role="status"
            aria-live="polite"
          >
            {charCount >= MIN_LENGTH && charCount <= MAX_LENGTH ? '✓ ' : ''}{validationMessage}
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-submit"
          disabled={!isValid || submitted}
          aria-label={isValid ? 'Submit incident for analysis' : 'Enter a valid incident description to submit'}
        >
          <span className="btn-text">{submitted ? 'Submitted' : 'Analyze Incident'}</span>
          <span className="btn-icon">{submitted ? '✓' : '→'}</span>
        </button>
      </form>

      <div className="form-features" role="list" aria-label="Analysis features">
        <div className="feature" role="listitem">
          <span className="feature-icon" aria-hidden="true">⚡</span>
          <p>16-30 second diagnosis</p>
        </div>
        <div className="feature" role="listitem">
          <span className="feature-icon" aria-hidden="true">🎯</span>
          <p>94% confidence</p>
        </div>
        <div className="feature" role="listitem">
          <span className="feature-icon" aria-hidden="true">📊</span>
          <p>Complete analysis</p>
        </div>
      </div>
    </div>
  )
}
