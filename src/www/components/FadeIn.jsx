import React, { useState, useEffect, useRef } from 'react'
import { createAnimationStyle, getSafeDuration, getSafeDelay, prefersReducedMotion } from '../motion-utils'

/**
 * D2-02: FadeIn component
 * Specialized animated component for fade-in transitions
 * Perfect for content reveals, page transitions, and state changes
 */
export default function FadeIn({
  children,
  duration = 300,
  delay = 0,
  onAnimationComplete = null,
  className = '',
}) {
  const [isAnimating, setIsAnimating] = useState(true)
  const ref = useRef(null)

  const safeDuration = getSafeDuration(duration)
  const safeDelay = getSafeDelay(delay)

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) {
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
    'fadeIn',
    duration,
    'cubic-bezier(0.4, 0, 0.2, 1)',
    delay
  )

  return (
    <div
      ref={ref}
      className={`fade-in ${className}`}
      style={animationStyles}
    >
      {children}
    </div>
  )
}
