import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleRetry = this.handleRetry.bind(this)
    this.handleGoBack = this.handleGoBack.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  handleRetry() {
    this.setState({ hasError: false, error: null })
  }

  handleGoBack() {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="error-content">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h1>Something went wrong</h1>
            <p className="error-message">
              An unexpected error occurred. You can retry or go back to the start.
            </p>
            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={this.handleRetry}
                aria-label="Retry the last action"
              >
                Retry
              </button>
              <button
                className="btn btn-secondary"
                onClick={this.handleGoBack}
                aria-label="Go back to the diagnosis form"
              >
                Go Back
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
                aria-label="Reload the page"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
