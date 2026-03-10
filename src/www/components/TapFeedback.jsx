import React, { useState } from 'react'
import { createTransitionStyle } from '../motion-utils'

/**
 * D3-03: TapFeedback component
 * Adds tactile press/tap feedback for buttons and interactive elements
 * Improves perceived responsiveness on desktop and mobile
 */
export default function TapFeedback({
  children,
  onTap = null,
  duration = 100,
  scaleAmount = 0.98,
  className = '',
}) {
  const [isPressed, setIsPressed] = useState(false)

  const baseStyle = createTransitionStyle('all', duration)

  const pressStyle = {
    transform: isPressed ? `scale(${scaleAmount})` : 'scale(1)',
  }

  const handleMouseDown = () => setIsPressed(true)
  const handleMouseUp = () => setIsPressed(false)
  const handleMouseLeave = () => setIsPressed(false)

  const handleClick = () => {
    if (onTap) {
      onTap()
    }
  }

  return (
    <div
      className={`tap-feedback ${className}`}
      style={{ ...baseStyle, ...pressStyle }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}
