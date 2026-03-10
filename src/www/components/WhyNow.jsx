import React from 'react';
import '../styles/sections.css';

export default function WhyNow() {
  return (
    <section className="why-now" id="why-now" role="region" aria-label="Why now">
      <div className="container">
        <h2 className="section-heading">Why Now?</h2>
        <p className="section-text">
          With infrastructure complexity skyrocketing and downtime costs rising,
          waiting hours for root cause analysis is no longer acceptable. Automation
          and evidence-based workflows are the only way to keep operations agile.
        </p>
      </div>
    </section>
  );
}
