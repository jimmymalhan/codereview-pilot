import React from 'react';
import '../styles/sections.css';

const QUESTIONS = [
  {
    q: 'Do I need an API key to use this?',
    a: 'No, the homepage demo works without credentials. For production use, you can integrate with your existing authentication system.'
  },
  {
    q: 'How accurate are the diagnoses?',
    a: 'Our models generate a confidence score; past audits show 94% agreement with expert diagnoses.'
  },
  {
    q: 'Can I export the results?',
    a: 'Yes, JSON and CSV export are available directly from the results screen.'
  },
  {
    q: 'What if the API is down?',
    a: 'You will see a clear, actionable error with retry guidance. Nothing is silently dropped, and you can safely retry once the service is healthy.'
  }
];

export default function FAQ() {
  return (
    <section className="faq" id="faq" role="region" aria-label="Frequently asked questions">
      <div className="container">
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <div className="faq-list">
          {QUESTIONS.map((item, idx) => (
            <div key={idx} className="faq-item">
              <h3 className="faq-question">{item.q}</h3>
              <p className="faq-answer">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
