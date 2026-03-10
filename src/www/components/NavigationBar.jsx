import React, { useState } from 'react'

export default function NavigationBar({
  onDashboardToggle,
  showDashboard,
  onOrchestrationToggle,
  showOrchestration
}) {
  const [isScrolled, setIsScrolled] = useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <a href="/" className="logo">
            <span className="logo-icon">🔍</span>
            <span className="logo-text">Claude Debug Copilot</span>
          </a>
        </div>

        <nav className="navbar-nav">
          <a href="/#products" className="nav-link">Features</a>
          <a href="/#integrate" className="nav-link">How It Works</a>
          <a href="/api-reference.html" className="nav-link">API Reference</a>
        </nav>

        <div className="navbar-actions">
          <button
            className={`btn-icon ${showDashboard ? 'active' : ''}`}
            onClick={onDashboardToggle}
            title="Toggle Analytics Dashboard"
            aria-pressed={showDashboard}
            type="button"
          >
            <span className="icon" aria-hidden="true">📊</span>
            <span className="sr-only">Toggle analytics dashboard</span>
          </button>
          <button
            className={`btn-icon ${showOrchestration ? 'active' : ''}`}
            onClick={onOrchestrationToggle}
            title="Toggle Paperclip Orchestration"
            aria-pressed={showOrchestration}
            type="button"
          >
            <span className="icon" aria-hidden="true">🧠</span>
            <span className="sr-only">Toggle orchestration view</span>
          </button>
          <a href="/health" className="nav-link small">Status</a>
        </div>
      </div>
    </header>
  )
}
