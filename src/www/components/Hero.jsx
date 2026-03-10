import React, { useEffect, useRef } from 'react';
import '../styles/hero.css';

export default function Hero() {
  const contentRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for entrance animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    // Animate heading
    const heading = contentRef.current?.querySelector('h1');
    if (heading) {
      observer.observe(heading);
    }

    // Animate subheading
    const subheading = contentRef.current?.querySelector('.hero-subheadline');
    if (subheading) {
      observer.observe(subheading);
    }

    // Animate buttons
    const buttons = contentRef.current?.querySelectorAll('.hero-cta-group > *');
    buttons?.forEach((btn) => {
      observer.observe(btn);
    });

    return () => observer.disconnect();
  }, []);

  const handleDiagnoseClick = () => {
    // Navigate to the diagnostic tool
    window.location.href = '/diagnose';
  };

  const handleLearnMore = () => {
    // Scroll to how-it-works section
    const section = document.getElementById('how-it-works');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="hero" role="region" aria-label="Hero section">
      <div className="hero-content" ref={contentRef}>
        <h1 className="hero-heading">
          Diagnose Incidents
          <br />
          in Seconds.
          <br />
          Not Hours.
        </h1>

        <p className="hero-subheadline">
          Paste your incident. Get evidence-backed root cause with a fix plan in seconds.
        </p>

        <div className="hero-cta-group">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleDiagnoseClick}
            aria-label="Start diagnosis"
          >
            DIAGNOSE NOW
          </button>

          <button
            className="btn-secondary-cta"
            onClick={handleLearnMore}
            aria-label="Learn how it works"
          >
            See how it works ↓
          </button>
        </div>
      </div>

      {/* Decorative background */}
      <div className="hero-background" aria-hidden="true"></div>
    </section>
  );
}
