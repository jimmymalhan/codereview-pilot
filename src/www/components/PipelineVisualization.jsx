import React, { useEffect, useState } from 'react'

export default function PipelineVisualization({ result }) {
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    setIsAnimating(true)
  }, [result])

  const stages = [
    {
      name: 'Router',
      icon: '🔍',
      data: result.router.classification,
      duration: (result.router.duration / 1000).toFixed(1) + 's'
    },
    {
      name: 'Retriever',
      icon: '📋',
      data: `${result.retriever.evidence.length} evidence items`,
      duration: (result.retriever.duration / 1000).toFixed(1) + 's'
    },
    {
      name: 'Skeptic',
      icon: '🤔',
      data: result.skeptic.alternativeTheory.substring(0, 50) + '...',
      duration: (result.skeptic.duration / 1000).toFixed(1) + 's'
    },
    {
      name: 'Verifier',
      icon: '✓',
      data: result.verifier.rootCause.substring(0, 50) + '...',
      duration: (result.verifier.duration / 1000).toFixed(1) + 's'
    }
  ]

  const totalDuration = (result.totalDuration / 1000).toFixed(1)

  return (
    <div className="pipeline-visualization">
      <div className="pipeline-track">
        {stages.map((stage, idx) => (
          <div key={idx} className="pipeline-stage">
            <div className={`stage-node completed`}>
              <span className="node-icon">{stage.icon}</span>
            </div>

            <div className="stage-info">
              <h4 className="stage-name">{stage.name}</h4>
              <p className="stage-description">{stage.data}</p>
              <p className="stage-duration">⏱️ {stage.duration}</p>
            </div>

            {idx < stages.length - 1 && (
              <div className="stage-connector completed">
                <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pipeline-summary">
        <span className="summary-icon">⚡</span>
        <span className="summary-text">Total time: {totalDuration}s</span>
      </div>
    </div>
  )
}
