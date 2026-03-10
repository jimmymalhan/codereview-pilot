import React, { useState, useEffect, useRef } from 'react'
import { createAnimationStyle, getSafeDuration, getSafeDelay } from '../motion-utils'

/**
 * D2-05: SlideIn component
 * Specialized animated component for slide-in transitions
 * Supports sliding from any direction (left, right, top, bottom)
 */
export default function SlideIn({
  children,
  direction = 'left', // 'left' | 'right' | 'top' | 'bottom'
  duration = 300,
  delay = 0,
  distance = '30px',
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

  const animationMap = {
    left: 'slideInLeft',
    right: 'slideInRight',
    top: 'slideInTop',
    bottom: 'slideInBottom',
  }

  const animationName = animationMap[direction] || 'slideInLeft'

  const animationStyles = createAnimationStyle(
    animationName,
    duration,
    'cubic-bezier(0.4, 0, 0.2, 1)',
    delay
  )

  return (
    <div
      ref={ref}
      className={`slide-in slide-in-${direction} ${className}`}
      style={animationStyles}
    >
      {children}
    </div>
  )
}
