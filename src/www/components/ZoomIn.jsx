import React, { useState, useEffect, useRef } from 'react'
import { createAnimationStyle, getSafeDuration, getSafeDelay } from '../motion-utils'

/**
 * D2-03: ZoomIn component
 * Specialized animated component for scale/zoom-in transitions
 * Perfect for emphasis, modal reveals, and pop-in effects
 */
export default function ZoomIn({
  children,
  duration = 300,
  delay = 0,
  fromScale = 0.8,
  toScale = 1,
  onAnimationComplete = null,
  className = '',
}) {
  const [isAnimating, setIsAnimating] = useState(true)
  const ref = useRef(null)

  const safeDuration = getSafeDuration(duration)
  const safeDelay = getSafeDelay(delay)

  useEffect(() => {
    if (!ref.current) {
      if (onAnimationComplete) {
        onAnimationComplete()
      }
      return
    }

    const totalDuration = safeDuration + safeDelay
    const timer = setTimeout(() => {
      setIsAnimating(false)
      if (onAnimationComplete) {
        onAnimationComplete()
      }
    }, totalDuration)

    return () => clearTimeout(timer)
  }, [safeDuration, safeDelay, onAnimationComplete])

  const animationStyles = createAnimationStyle(
    'zoomIn',
    duration,
    'cubic-bezier(0.34, 1.56, 0.64, 1)',
    delay
  )

  return (
    <div
      ref={ref}
      className={`zoom-in ${className}`}
      style={animationStyles}
    >
      {children}
    </div>
  )
}
