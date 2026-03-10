import React, { useState, useEffect, useRef } from 'react'
import { createAnimationStyle, prefersReducedMotion } from '../motion-utils'

/**
 * D2-01: AnimatedSection component
 * Wrapper component that applies entrance animations to child elements
 * Automatically triggers animation when element enters viewport
 * Respects prefers-reduced-motion for accessibility
 */
export default function AnimatedSection({
  children,
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  triggerOnce = true,
  threshold = 0.1,
  className = '',
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          hasTriggered.current = true

          if (triggerOnce) {
            observer.unobserve(entry.target)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold }
    )

    observer.observe(ref.current)

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [triggerOnce, threshold])

  const animationStyles = isVisible
    ? createAnimationStyle(animation, duration, easing, delay)
    : {}

  return (
    <div
      ref={ref}
      className={`animated-section ${className}`}
      style={animationStyles}
    >
      {children}
    </div>
  )
}
