import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { useUIState } from '../contexts/UIStateContext';
import '../styles/header.css';

export default function Header() {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIState();

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Docs', href: '#docs' },
  ];

  return (
    <header className="header" role="banner">
      <div className="header-container">
        {/* Logo */}
        <a href="#" className="logo" aria-label="Claude Debug Copilot">
          <span className="logo-icon">🔍</span>
          <span className="logo-text">Claude Debug</span>
        </a>

        {/* Navigation - Desktop */}
        <nav className="nav-desktop" aria-label="Main navigation">
          <ul className="nav-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="nav-link">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side actions */}
        <div className="header-actions">
          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Sign In */}
          <a href="#signin" className="btn-signin">
            Sign In
          </a>

          {/* Mobile menu toggle */}
          <button
            className="nav-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="nav-mobile" aria-label="Mobile navigation">
          <ul className="nav-mobile-list">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="nav-mobile-link"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
