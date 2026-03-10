import React from 'react'

export default function DashboardPanel({ data }) {
  if (!data) return null

  const { overview, severity, recentDiagnoses, orchestration } = data

  return (
    <aside className="dashboard-panel">
      <div className="dashboard-header">
        <h3>📊 Analytics Dashboard</h3>
      </div>

      <div className="dashboard-sections">
        {/* Overview */}
        <section className="dashboard-section">
          <h4>Overview</h4>
          <div className="overview-grid">
            <div className="overview-item">
              <span className="label">Total Diagnoses</span>
              <span className="value">{overview.totalDiagnoses}</span>
            </div>
            <div className="overview-item">
              <span className="label">Last 24h</span>
              <span className="value">{overview.diagnosesLast24h}</span>
            </div>
            <div className="overview-item">
              <span className="label">Avg Confidence</span>
              <span className="value">{overview.averageConfidence}</span>
            </div>
            <div className="overview-item">
              <span className="label">Success Rate</span>
              <span className="value">{overview.successRate}</span>
            </div>
          </div>
        </section>

        {/* Severity Breakdown */}
        {Object.keys(severity).length > 0 && (
          <section className="dashboard-section">
            <h4>Severity Breakdown</h4>
            <div className="severity-breakdown">
              {Object.entries(severity).map(([level, count]) => (
                <div key={level} className={`severity-item severity-${level}`}>
                  <span className="severity-label">{level}</span>
                  <span className="severity-count">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Orchestration Stats */}
        {orchestration && (
          <section className="dashboard-section">
            <h4>Orchestration</h4>
            <div className="overview-grid">
              <div className="overview-item">
                <span className="label">Status</span>
                <span className={`value orch-status-${orchestration.isInitialized ? 'ready' : 'off'}`}>
                  {orchestration.isInitialized ? 'Active' : 'Offline'}
                </span>
              </div>
              <div className="overview-item">
                <span className="label">Tasks</span>
                <span className="value">{orchestration.taskCount ?? 0}</span>
              </div>
              <div className="overview-item">
                <span className="label">Budget Used</span>
                <span className="value">
                  {orchestration.budgetStatus
                    ? `${orchestration.budgetStatus.used}/${orchestration.budgetStatus.limit}`
                    : '—'}
                </span>
              </div>
              <div className="overview-item">
                <span className="label">Agents</span>
                <span className="value">{orchestration.heartbeatStatus ?? 0}</span>
              </div>
            </div>
          </section>
        )}

        {/* Recent Diagnoses */}
        {recentDiagnoses && recentDiagnoses.length > 0 && (
          <section className="dashboard-section">
            <h4>Recent Diagnoses</h4>
            <div className="recent-list">
              {recentDiagnoses.map((diag) => (
                <div key={diag.id} className="recent-item">
                  <div className="recent-incident">
                    <p className="incident-text">{diag.incident}</p>
                    <p className="incident-time">
                      {new Date(diag.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`recent-confidence confidence-${diag.confidence > 85 ? 'high' : 'medium'}`}>
                    {diag.confidence}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  )
}
