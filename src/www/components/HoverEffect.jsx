import React, { useState } from 'react'
import { createTransitionStyle } from '../motion-utils'

/**
 * D3-01: HoverEffect component
 * Adds smooth hover state transitions to any element
 * Perfect for buttons, cards, links, and interactive elements
 */
export default function HoverEffect({
  children,
  effect = 'scale', // 'scale' | 'lift' | 'glow' | 'underline'
  duration = 200,
  className = '',
}) {
  const [isHovering, setIsHovering] = useState(false)

  const baseStyle = createTransitionStyle('all', duration)

  const effectStyles = {
    scale: {
      transform: isHovering ? 'scale(1.05)' : 'scale(1)',
    },
    lift: {
      transform: isHovering ? 'translateY(-4px)' : 'translateY(0)',
      boxShadow: isHovering
        ? '0 12px 24px rgba(0, 0, 0, 0.15)'
        : '0 4px 8px rgba(0, 0, 0, 0.08)',
    },
    glow: {
      boxShadow: isHovering
        ? '0 0 20px rgba(0, 113, 227, 0.6)'
        : '0 0 5px rgba(0, 113, 227, 0.3)',
    },
    underline: {
      borderBottomWidth: isHovering ? '2px' : '0px',
      borderBottomColor: '#0071e3',
    },
  }

  const selectedEffectStyles = effectStyles[effect] || effectStyles.scale

  return (
    <div
      className={`hover-effect hover-effect-${effect} ${className}`}
      style={{ ...baseStyle, ...selectedEffectStyles }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
    </div>
  )
}
