import React, { useState } from 'react'

export default function NavigationBar({ onDashboardToggle, showDashboard }) {
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
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="/api-reference.html" className="nav-link">API Reference</a>
        </nav>

        <div className="navbar-actions">
          <button
            className={`btn-icon ${showDashboard ? 'active' : ''}`}
            onClick={onDashboardToggle}
            title="Toggle Dashboard"
          >
            <span className="icon">📊</span>
          </button>
          <a href="/health" className="nav-link small">Status</a>
        </div>
      </div>
    </header>
  )
}
