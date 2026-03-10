import React from 'react';
import '../styles/sections.css';

export default function AfterClick() {
  return (
    <section className="after-click" id="after-click" role="region" aria-label="After you click">
      <div className="container">
        <h2 className="section-heading">What Happens After You Click</h2>
        <p className="section-text">
          When you hit "Diagnose Now", your incident enters our real-time
          pipeline. We analyze your description immediately, surface evidence,
          and deliver a fix plan with confidence score in under 30 seconds.
        </p>
      </div>
    </section>
  );
}
