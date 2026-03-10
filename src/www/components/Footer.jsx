import React from 'react';
import '../styles/footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        {/* Footer content grid */}
        <div className="footer-grid">
          {/* Company info */}
          <div className="footer-section">
            <h3 className="footer-heading">Claude Debug Copilot</h3>
            <p className="footer-description">
              Evidence-first incident diagnosis powered by AI. Get root cause in seconds, not hours.
            </p>
          </div>

          {/* Product links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Product</h4>
            <ul className="footer-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how-it-works">How It Works</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-section-title">Resources</h4>
            <ul className="footer-links">
              <li>
                <a href="/docs">Documentation</a>
              </li>
              <li>
                <a href="/api">API Reference</a>
              </li>
              <li>
                <a href="/blog">Blog</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4 className="footer-section-title">Company</h4>
            <ul className="footer-links">
              <li>
                <a href="/about">About</a>
              </li>
              <li>
                <a href="/privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Claude Debug Copilot. All rights reserved.
          </p>
          <div className="footer-badges">
            <span className="badge">🔒 Production-Grade</span>
            <span className="badge">♿ WCAG 2.1 AA</span>
            <span className="badge">⚡ 60fps</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
