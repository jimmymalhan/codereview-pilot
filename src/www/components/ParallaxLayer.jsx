import React, { useState, useEffect, useRef } from 'react'
import { calculateParallaxOffset, getPerformanceHints } from '../motion-utils'

/**
 * D2-04: ParallaxLayer component
 * Parallax scroll effect component for background/layered animations
 * Perfect for hero sections, depth effects, and visual interest
 */
export default function ParallaxLayer({
  children,
  speed = 0.5,
  className = '',
  minHeight = '400px',
}) {
  const [scrollY, setScrollY] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const offset = calculateParallaxOffset(scrollY, speed)
  const perfHints = getPerformanceHints(['transform'])

  return (
    <div
      ref={ref}
      className={`parallax-layer ${className}`}
      style={{
        transform: `translateY(${offset}px)`,
        minHeight,
        ...perfHints,
      }}
    >
      {children}
    </div>
  )
}
