import React from 'react';
import '../styles/sections.css';

export default function WhoIsFor() {
  return (
    <section className="who-is-for" id="who-is-for" role="region" aria-label="Who it is for">
      <div className="container">
        <h2 className="section-heading">Who It's For</h2>
        <p className="section-text">
          Engineers and operators who need fast, evidence-backed diagnosis of system
          failures. Teams at mid-size to enterprise companies where downtime costs
          thousands per minute.
        </p>
        <ul className="persona-list">
          <li>Platform & SRE teams</li>
          <li>DevOps engineers</li>
          <li>Incident response squads</li>
          <li>Technical support leads</li>
        </ul>
      </div>
    </section>
  );
}
