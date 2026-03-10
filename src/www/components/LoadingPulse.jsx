import React from 'react'
import { prefersReducedMotion } from '../motion-utils'

/**
 * D3-05: LoadingPulse component
 * Animated loading indicator with pulse/breathing effect
 * Respects prefers-reduced-motion for accessibility
 */
export default function LoadingPulse({
  size = '40px',
  color = '#0071e3',
  label = 'Loading...',
  className = '',
}) {
  const prefersReduced = prefersReducedMotion()

  const pulseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    animation: prefersReduced
      ? 'none'
      : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  }

  return (
    <div className={`loading-pulse ${className}`}>
      <div style={pulseStyle} />
      {label && <p style={{ marginTop: '12px' }}>{label}</p>}
    </div>
  )
}
