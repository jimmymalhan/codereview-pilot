import React from 'react';
import '../styles/sections.css';

export default function UseCases() {
  return (
    <section className="use-cases" id="use-cases" role="region" aria-label="Use cases">
      <div className="container">
        <h2 className="section-heading">Use Cases</h2>
        <div className="use-case-group">
          <div className="use-case">
            <h3>Individual Engineers</h3>
            <p>
              Quickly diagnose a one-off production error without waiting on a
              long ticket queue. Save time and reduce stress.
            </p>
          </div>
          <div className="use-case">
            <h3>Teams & Companies</h3>
            <p>
              Centralize incident analysis, share evidence with stakeholders, and
              standardize fix plans across the organization.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
