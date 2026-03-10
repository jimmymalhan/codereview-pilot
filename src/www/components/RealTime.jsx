import React from 'react';
import '../styles/sections.css';

export default function RealTime() {
  return (
    <section className="real-time" id="real-time" role="region" aria-label="Real time diagnosis">
      <div className="container">
        <h2 className="section-heading">Real-time Diagnosis</h2>
        <p className="section-text">
          Every run executes the full four-agent pipeline on the incident you paste in.
          You see simulated evidence, confidence and fix steps generated on your input,
          so you can rehearse how the system will behave on real incidents without
          exposing production logs or secrets.
        </p>
      </div>
    </section>
  );
}
