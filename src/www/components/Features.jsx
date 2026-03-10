import React, { useEffect, useRef } from 'react';
import '../styles/features.css';

export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
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

    // Observe section heading
    const heading = sectionRef.current?.querySelector('h2');
    if (heading) observer.observe(heading);

    // Observe feature cards
    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Turn an unstructured incident into an end-to-end diagnosis in seconds, not hours of manual investigation.',
    },
    {
      icon: '🎯',
      title: 'Evidence-Backed',
      description: 'Every diagnosis backed by concrete evidence with confidence scoring and proof citations.',
    },
    {
      icon: '🔧',
      title: 'Fix Plan Included',
      description: 'Not just root cause—get actionable fix plan and test cases to verify recovery.',
    },
    {
      icon: '🧠',
      title: 'AI-Powered Analysis',
      description: '4-agent pipeline (Router, Retriever, Skeptic, Verifier) ensures rigorous diagnosis.',
    },
    {
      icon: '📊',
      title: 'What You Can Do',
      description: 'Paste an incident, batch-diagnose multiple failures, and export results into your runbooks and postmortems.',
    },
    {
      icon: '🛡️',
      title: 'Production-Grade',
      description: 'Built for reliability: retry logic, input validation, audit logging, error recovery.',
    },
  ];

  return (
    <section className="features" id="features" ref={sectionRef} role="region" aria-label="Features">
      <div className="container">
        <h2 className="section-heading">Powerful Features</h2>
        <p className="section-subheading">
          Everything you need to diagnose incidents with confidence
        </p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              role="region"
              aria-label={feature.title}
            >
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
