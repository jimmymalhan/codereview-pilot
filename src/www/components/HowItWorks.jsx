import React, { useEffect, useRef } from 'react';
import '../styles/how-it-works.css';

export default function HowItWorks() {
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

    // Observe cards
    const cards = sectionRef.current?.querySelectorAll('.step-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: 1,
      title: 'Capture the Incident',
      description:
        'Type or paste a real production incident into the diagnosis form. Focus on symptoms, impact, and when it started.',
      icon: '📋',
    },
    {
      number: 2,
      title: 'Run the 4-Agent Pipeline',
      description:
        'Click “Diagnose now”. The Router, Retriever, Skeptic, and Verifier agents classify the failure, simulate evidence, and challenge each other.',
      icon: '🔍',
    },
    {
      number: 3,
      title: 'Review the Diagnosis',
      description:
        'You get a single, evidence-backed root cause with confidence, fix steps, rollback guidance, and tests to run.',
      icon: '✅',
    },
    {
      number: 4,
      title: 'Apply, Test, and Share',
      description:
        'Apply the fix in your environment, run the suggested tests, then export the diagnosis into your runbooks or incident tickets.',
      icon: '🚀',
    },
  ];

  return (
    <section className="how-it-works" id="how-it-works" ref={sectionRef} role="region" aria-label="How it works">
      <div className="container">
        <h2 className="section-heading">How It Works</h2>
        <p className="section-subheading">
          Four simple steps from problem to solution
        </p>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="step-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              role="region"
              aria-label={`Step ${step.number}: ${step.title}`}
            >
              {/* Step icon */}
              <div className="step-icon" aria-hidden="true">
                {step.icon}
              </div>

              {/* Step number and connector line */}
              <div className="step-number">{step.number}</div>
              {index < steps.length - 1 && <div className="step-connector" aria-hidden="true"></div>}

              {/* Step content */}
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Feature highlights */}
        <div className="highlights">
          <div className="highlight-item">
            <span className="highlight-icon">⚡</span>
            <span className="highlight-text">Fast: 16-30 seconds end-to-end</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">🎯</span>
            <span className="highlight-text">Accurate: 94% confidence scoring</span>
          </div>
          <div className="highlight-item">
            <span className="highlight-icon">🔒</span>
            <span className="highlight-text">Reliable: Production-grade with retries</span>
          </div>
        </div>

        {/* Customer guidance */}
        <div className="customer-guidance">
          <h3 className="guidance-heading">How to get the best results</h3>
          <ul className="guidance-list">
            <li>Redact secrets, keys, and customer data before you paste any incident.</li>
            <li>Include a clear timeline: when the problem started, what changed, and which systems are affected.</li>
            <li>Add 1–3 representative log lines or error messages instead of entire log files.</li>
            <li>Mention environment and scope (prod vs staging, region, service name) so recommendations stay grounded.</li>
            <li>Use the export options to attach the diagnosis to your runbooks, postmortems, or incident tickets.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
