import React from 'react';
import '../styles/sections.css';

export default function WhyDifferent() {
  return (
    <section className="why-different" id="why-different" role="region" aria-label="Why this is different">
      <div className="container">
        <h2 className="section-heading">Why This Is Different</h2>
        <ul className="diff-list">
          <li>Evidence-first: every root cause comes with citations you can verify.</li>
          <li>Workflow clarity: fixed four steps keep teams aligned and faster.</li>
          <li>Real-time: no stale templates, results generated on live input.</li>
          <li>Opinionated process: minimal setup, maximum trust, built for operators.</li>
        </ul>
      </div>
    </section>
  );
}
